import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage as ChatMessageType, Role, AuditRecord } from './types';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { DepartmentPanel } from './components/DepartmentPanel';
import { RecommendationView } from './components/RecommendationView';
import { ExportScreen } from './components/ExportScreen';
import { TestPanel } from './components/TestPanel';
import { sendChatMessage } from './lib/apiClient';
import { buildAssistantMessage } from './lib/recommendationEngine';
import { getRoleSystemMessage } from './data/roleConfig';
import {
  StoredConversation,
  loadConversations,
  upsertConversation,
  saveConversations,
  deleteConversation as deleteFromStore,
} from './lib/conversationStore';
import { claimSharedConversations, normalizeEmail } from './lib/shareStore';

type Screen = 'login' | 'chatbot' | 'recommendation' | 'export';

const VALID_ROLES: Role[] = ['C-Suite', 'R&D', 'Finance', 'Marketing', 'Regulatory/Compliance', 'IT'];

function getInitialRole(): Role {
  const saved = localStorage.getItem('pharmora-signal-role');
  if (saved && (VALID_ROLES as string[]).includes(saved)) {
    return saved as Role;
  }
  return 'C-Suite';
}

function getInitialSignedInRole(): Role {
  const saved = localStorage.getItem('pharmora-signal-signed-in-role');
  if (saved && (VALID_ROLES as string[]).includes(saved)) {
    return saved as Role;
  }
  return getInitialRole();
}

function getInitialUsername(): string {
  return localStorage.getItem('pharmora-signal-username') || '';
}

function getInitialSidebarCollapsed(): boolean {
  return localStorage.getItem('pharmora-sidebar-collapsed') === '1';
}

function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [role, setRole] = useState<Role>(getInitialRole);
  const [signedInRole, setSignedInRole] = useState<Role>(getInitialSignedInRole);
  const [username, setUsername] = useState<string>(getInitialUsername);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(getInitialSidebarCollapsed);

  useEffect(() => {
    localStorage.setItem('pharmora-sidebar-collapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);
  const [conversations, setConversations] = useState<StoredConversation[]>(() => loadConversations('strategy'));
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingMessage, setViewingMessage] = useState<ChatMessageType | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(true);
  const isFirstRender = useRef(true);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    localStorage.setItem('pharmora-signal-role', role);

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (activeConversationId) {
      const systemMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getRoleSystemMessage(role),
      };
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === activeConversationId ? { ...c, messages: [...c.messages, systemMsg], timestamp: Date.now() } : c
        );
        const conv = updated.find((c) => c.id === activeConversationId);
        if (conv) upsertConversation('strategy', conv);
        return updated;
      });
    }
  }, [role]);

  const handleLogin = (selectedRole: Role, signedInUsername: string) => {
    const normalizedUsername = normalizeEmail(signedInUsername);
    setRole(selectedRole);
    setSignedInRole(selectedRole);
    setUsername(normalizedUsername);
    localStorage.setItem('pharmora-signal-signed-in-role', selectedRole);
    localStorage.setItem('pharmora-signal-username', normalizedUsername);

    const sharedConversations = claimSharedConversations(normalizedUsername);
    if (sharedConversations.length > 0) {
      setConversations((prev) => {
        const existingIds = new Set(prev.map((conversation) => conversation.id));
        const next = [
          ...sharedConversations.filter((conversation) => !existingIds.has(conversation.id)),
          ...prev,
        ].slice(0, 20);
        saveConversations(next);
        return next;
      });
    }

    setScreen('chatbot');
  };

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const handleSend = async (content: string) => {
    let convId = activeConversationId;

    if (!convId) {
      const newConv: StoredConversation = {
        id: crypto.randomUUID(),
        title: content.slice(0, 40) + (content.length > 40 ? '...' : ''),
        timestamp: Date.now(),
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      convId = newConv.id;
      setActiveConversationId(convId);
    }

    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const updated = { ...c, messages: [...c.messages, userMessage], timestamp: Date.now() };
        if (c.messages.length === 0) {
          updated.title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
        }
        return updated;
      })
    );

    setIsLoading(true);

    try {
      const convSnapshot = conversations.find((c) => c.id === convId);
      const priorMessages = (convSnapshot?.messages || [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));
      const historyMessages = [...priorMessages, { role: 'user' as const, content }];

      const rawResponse = await sendChatMessage(historyMessages, role);
      const assistantMessage = buildAssistantMessage(rawResponse, content, role);

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, assistantMessage], timestamp: Date.now() } : c
        );
        const conv = updated.find((c) => c.id === convId);
        if (conv) upsertConversation('strategy', conv);
        return updated;
      });

      if (assistantMessage.audit) {
        setAuditRecords((prev) => [assistantMessage.audit!, ...prev].slice(0, 30));
      }
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `**Error:** Unable to reach the server. ${error instanceof Error ? error.message : 'Please try again.'}`,
      };

      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, errorMessage], timestamp: Date.now() } : c
        );
        const conv = updated.find((c) => c.id === convId);
        if (conv) upsertConversation('strategy', conv);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleDeleteConversation = (id: string) => {
    deleteFromStore('strategy', id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  const handleRenameConversation = (id: string, title: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, title } : c));
      const conv = updated.find((c) => c.id === id);
      if (conv) upsertConversation('strategy', conv);
      return updated;
    });
  };

  const handleReorderConversations = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setConversations((prev) => {
      const fromIdx = prev.findIndex((c) => c.id === fromId);
      const toIdx = prev.findIndex((c) => c.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      saveConversations(next);
      return next;
    });
  };

  const handleViewRecommendation = (msg: ChatMessageType) => {
    setViewingMessage(msg);
    setScreen('recommendation');
  };

  const handleExport = () => {
    setScreen('export');
  };

  const handleBackToChat = () => {
    setScreen('chatbot');
    setViewingMessage(null);
  };

  const handleBackToRecommendation = () => {
    setScreen('recommendation');
  };

  const handleLogout = () => {
    setScreen('login');
    setActiveConversationId(null);
    setViewingMessage(null);
    setUsername('');
    localStorage.removeItem('pharmora-signal-username');
    localStorage.removeItem('pharmora-signal-signed-in-role');
  };

  if (screen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (screen === 'recommendation' && viewingMessage) {
    return (
      <RecommendationView
        message={viewingMessage}
        onExport={handleExport}
        onBack={handleBackToChat}
      />
    );
  }

  if (screen === 'export' && viewingMessage) {
    return (
      <ExportScreen
        message={viewingMessage}
        role={role}
        onBack={handleBackToRecommendation}
      />
    );
  }

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${!evidenceOpen ? 'evidence-collapsed' : ''}`}>
      <Sidebar
        signedInRole={signedInRole}
        username={username}
        conversations={conversations}
        activeConversationId={activeConversationId}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onReorderConversations={handleReorderConversations}
        onLogout={handleLogout}
      />
      <ChatWindow
        messages={messages}
        onSend={handleSend}
        role={role}
        signedInRole={signedInRole}
        currentUserEmail={username}
        isLoading={isLoading}
        conversationTitle={activeConversation?.title}
        onViewRecommendation={handleViewRecommendation}
        evidenceOpen={evidenceOpen}
        onToggleEvidence={() => setEvidenceOpen((o) => !o)}
      />
      <DepartmentPanel role={role} open={evidenceOpen} auditRecords={auditRecords} />
      <TestPanel activeRole={role} signedInRole={signedInRole} onChange={setRole} />
    </div>
  );
}

export default App;
