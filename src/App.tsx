import { useState } from 'react';
import { ChatMessage as ChatMessageType, Role, EvidenceData, AuditRecord } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { EvidencePanel } from './components/EvidencePanel';
import { sendChatMessage } from './lib/apiClient';
import { parseStructuredResponse, buildAssistantMessage } from './lib/recommendationEngine';

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessageType[];
}

function App() {
  const [role, setRole] = useState<Role>('C-Suite');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentEvidence, setCurrentEvidence] = useState<EvidenceData | null>(null);
  const [currentAudit, setCurrentAudit] = useState<AuditRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: 'New conversation',
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setCurrentEvidence(null);
    setCurrentAudit(null);
  };

  const handleSend = async (content: string) => {
    let convId = activeConversationId;

    if (!convId) {
      const newConv: Conversation = {
        id: crypto.randomUUID(),
        title: content.slice(0, 40) + (content.length > 40 ? '...' : ''),
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
        const updated = { ...c, messages: [...c.messages, userMessage] };
        if (c.messages.length === 0) {
          updated.title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
        }
        return updated;
      })
    );

    setIsLoading(true);

    try {
      // Build history from the latest state snapshot — we need to capture messages
      // *before* the setConversations call above has been applied (React batches),
      // so we grab them here and always append the current user message at the end.
      const convSnapshot = conversations.find((c) => c.id === convId);
      const priorMessages = (convSnapshot?.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const historyMessages = [...priorMessages, { role: 'user' as const, content }];

      const rawResponse = await sendChatMessage(historyMessages, role);
      const parsed = parseStructuredResponse(rawResponse);
      const assistantMessage = buildAssistantMessage(rawResponse, content, role, !parsed);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, assistantMessage] } : c
        )
      );

      setCurrentEvidence(assistantMessage.evidence || null);
      setCurrentAudit(assistantMessage.audit || null);
    } catch (error) {
      const errorMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `**Error:** Unable to reach Pharmora Signal API. Please ensure the server is running (\`npm run server\` or \`npm run dev\`). ${error instanceof Error ? error.message : ''}`,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, errorMessage] } : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    const conv = conversations.find((c) => c.id === id);
    const lastAssistant = conv?.messages.filter((m) => m.role === 'assistant').pop();
    setCurrentEvidence(lastAssistant?.evidence || null);
    setCurrentAudit(lastAssistant?.audit || null);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setCurrentEvidence(null);
      setCurrentAudit(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        role={role}
        onRoleChange={setRole}
        onPromptClick={handleSend}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <ChatWindow messages={messages} onSend={handleSend} role={role} isLoading={isLoading} />
      <EvidencePanel evidence={currentEvidence} audit={currentAudit} />
    </div>
  );
}

export default App;
