import { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  FlaskConical,
  DollarSign,
  Megaphone,
  ShieldCheck,
  Server,
  SendHorizontal,
  Search,
  PanelRightOpen,
  PanelRightClose,
  LucideProps,
} from 'lucide-react';
import { ChatMessage as ChatMessageType, Role } from '../types';
import { ChatMessage } from './ChatMessage';
import { PromptButtons } from './PromptButtons';
import { samplePrompts } from '../data/samplePrompts';
import { getRoleConfig } from '../data/roleConfig';

type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;

const iconMap: Record<string, IconComponent> = {
  Briefcase,
  FlaskConical,
  DollarSign,
  Megaphone,
  ShieldCheck,
  Server,
};

interface Props {
  messages: ChatMessageType[];
  onSend: (message: string) => void;
  role: Role;
  signedInRole: Role;
  isLoading: boolean;
  conversationTitle?: string;
  onViewRecommendation?: (msg: ChatMessageType) => void;
  evidenceOpen?: boolean;
  onToggleEvidence?: () => void;
}

export function ChatWindow({
  messages,
  onSend,
  role,
  signedInRole,
  isLoading,
  conversationTitle,
  onViewRecommendation,
  evidenceOpen,
  onToggleEvidence,
}: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const roleConfig = getRoleConfig(role);
  const RoleIcon = iconMap[roleConfig.icon];
  const isTesting = role !== signedInRole;
  const isEmpty = messages.length === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const allPrompts = [...roleConfig.suggestedPrompts, ...samplePrompts];
  const headerTitle = conversationTitle && messages.length > 0 ? conversationTitle : 'New conversation';
  const headerSubtitle = messages.length > 0
    ? `${Math.ceil(messages.length / 2)} exchange${messages.length > 2 ? 's' : ''}`
    : 'Ask a strategic question to get started';

  return (
    <main className={`chat-window ${isEmpty ? 'chat-window-empty' : ''}`}>
      <div className="chat-topbar">
        <div className="chat-topbar-left">
          <div className="role-indicator">
            <RoleIcon size={13} />
            <span>
              {isTesting ? 'Viewing as: ' : 'Signed in as: '}
              <strong>{roleConfig.label}</strong>
            </span>
          </div>
        </div>

        <div className="chat-topbar-center">
          <div className="chat-topbar-title">{headerTitle}</div>
          <div className="chat-topbar-subtitle">{headerSubtitle}</div>
        </div>

        <div className="chat-topbar-right">
          {onToggleEvidence && (
            <button
              className="topbar-evidence-btn"
              onClick={onToggleEvidence}
              title={evidenceOpen ? 'Hide Sources & Audit' : 'Show Sources & Audit'}
              aria-label={evidenceOpen ? 'Hide Sources & Audit' : 'Show Sources & Audit'}
            >
              {evidenceOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {isEmpty && (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <Search size={22} />
            </div>
            <h2>Pharmora Co-Assist</h2>
            <p className="welcome-role-msg">{roleConfig.welcomeMessage}</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatMessage message={msg} />
            {msg.role === 'assistant' && onViewRecommendation && !msg.content.startsWith('**Error') && !msg.content.startsWith('Now answering') && (
              <div className="msg-actions">
                <button className="msg-view-rec-btn" onClick={() => onViewRecommendation(msg)}>
                  View Full Recommendation
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="chat-msg chat-msg-assistant">
            <div className="msg-bubble msg-assistant-bubble loading-bubble">
              <div className="loading-dots">
                <span></span><span></span><span></span>
              </div>
              <span className="loading-text">Pharmora Copilot is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {isEmpty ? (
        <div className="chat-empty-center">
          <form className="chat-empty-form" onSubmit={handleSubmit}>
            <div className="chat-input-shell">
              <input
                type="text"
                className="chat-input"
                placeholder="Ask anything to get started…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                className="chat-send-btn"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
              >
                <SendHorizontal size={16} />
                <span>Send</span>
              </button>
            </div>
          </form>
          <div className="chat-empty-suggestions">
            <PromptButtons prompts={allPrompts.slice(0, 3)} onSelect={onSend} />
          </div>
        </div>
      ) : (
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <div className="chat-input-shell">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask Pharmora Copilot a strategic question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <SendHorizontal size={16} />
              <span>{isLoading ? 'Sending' : 'Send'}</span>
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
