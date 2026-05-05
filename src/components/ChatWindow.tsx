import { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  FlaskConical,
  DollarSign,
  Megaphone,
  ShieldCheck,
  Server,
  SendHorizontal,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
  UserPlus,
  Mail,
  X,
  LucideProps,
} from 'lucide-react';
import { ChatMessage as ChatMessageType, Role } from '../types';
import { ChatMessage } from './ChatMessage';
import { PromptButtons } from './PromptButtons';
import { samplePrompts } from '../data/samplePrompts';
import { getRoleConfig } from '../data/roleConfig';
import { normalizeEmail, shareConversation } from '../lib/shareStore';

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
  currentUserEmail: string;
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
  currentUserEmail,
  isLoading,
  conversationTitle,
  onViewRecommendation,
  evidenceOpen,
  onToggleEvidence,
}: Props) {
  const [input, setInput] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [shareStatus, setShareStatus] = useState<'idle' | 'sent'>('idle');
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

  const closeShare = () => {
    setShareOpen(false);
    setShareEmail('');
    setShareNote('');
    setShareStatus('idle');
  };

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = normalizeEmail(shareEmail);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    shareConversation({
      recipientEmail: email,
      senderEmail: currentUserEmail,
      title: conversationTitle || 'Untitled conversation',
      note: shareNote.trim() || null,
      messages,
    });
    setShareEmail(email);
    setShareStatus('sent');
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
          <button
            className="topbar-evidence-btn"
            onClick={() => setShareOpen(true)}
            disabled={isEmpty}
            title={isEmpty ? 'Start a conversation to share' : 'Share conversation'}
            aria-label="Share conversation"
          >
            <UserPlus size={16} />
          </button>
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
              <Sparkles size={22} />
            </div>
            <h2>Pharmora Co-Assist</h2>
            <p className="welcome-role-msg"></p>
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

      <div className={`chat-input-bar${isEmpty ? ' chat-input-bar-empty' : ''}`}>
        <form className="chat-bar-form" onSubmit={handleSubmit}>
          <div className="chat-input-shell">
            <input
              type="text"
              className="chat-input"
              placeholder={isEmpty ? 'Ask anything to get started…' : 'Message Pharmora Co-Assist'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              autoFocus={isEmpty}
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
        {isEmpty && (
          <div className="chat-empty-suggestions">
            <PromptButtons prompts={allPrompts.slice(0, 3)} onSelect={onSend} />
          </div>
        )}
      </div>

      {shareOpen && (
        <div className="share-modal-overlay" onClick={closeShare}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <div className="share-modal-title">
                <UserPlus size={16} />
                <span>Share conversation</span>
              </div>
              <button
                className="share-modal-close"
                onClick={closeShare}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            {shareStatus === 'sent' ? (
              <div className="share-modal-body share-modal-success">
                <p>
                  Conversation shared with <strong>{shareEmail}</strong>.
                </p>
                <p className="share-modal-hint">
                  They'll see it in their Conversations panel after signing in.
                </p>
                <button className="share-modal-submit" onClick={closeShare}>Done</button>
              </div>
            ) : (
              <form className="share-modal-body" onSubmit={handleShareSubmit}>
                <p className="share-modal-hint">
                  Send this conversation to another internal user. They'll need to sign in to view it.
                </p>
                <label className="share-modal-label">
                  <Mail size={13} />
                  <span>Recipient email</span>
                </label>
                <input
                  type="email"
                  className="share-modal-input"
                  placeholder="colleague@pharmora.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  required
                  autoFocus
                />
                <label className="share-modal-label">
                  <span>Note (optional)</span>
                </label>
                <textarea
                  className="share-modal-textarea"
                  placeholder="Add a quick message…"
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  rows={3}
                />
                <div className="share-modal-actions">
                  <button type="button" className="share-modal-cancel" onClick={closeShare}>
                    Cancel
                  </button>
                  <button type="submit" className="share-modal-submit" disabled={!shareEmail.trim()}>
                    Share
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
