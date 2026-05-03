import { Role } from '../types';
import { RoleSelector } from './RoleSelector';
import { SystemGuardrails } from './SystemGuardrails';

interface Conversation {
  id: string;
  title: string;
}

interface Props {
  role: Role;
  onRoleChange: (role: Role) => void;
  onPromptClick: (prompt: string) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function Sidebar({
  role,
  onRoleChange,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">P</div>
        <div>
          <h1 className="brand-title">Pharmora Signal</h1>
          <p className="brand-subtitle">AI Cardiometabolic Strategy & Pipeline Copilot</p>
        </div>
      </div>

      <button className="new-chat-btn" onClick={onNewConversation}>
        + New Conversation
      </button>

      <RoleSelector selected={role} onChange={onRoleChange} />

      <div className="sidebar-section conversations-section">
        <h4 className="section-title">Conversations</h4>
        <div className="conversation-list">
          {conversations.length === 0 && (
            <p className="no-conversations">No conversations yet. Ask a question to get started.</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.id === activeConversationId ? 'active' : ''}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <span className="conversation-title">{conv.title}</span>
              <button
                className="conversation-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
                title="Delete conversation"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </div>

      <SystemGuardrails />
    </aside>
  );
}
