import {
  LogOut,
  MessageSquareText,
  Plus,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';
import { Role } from '../types';
import { StoredConversation } from '../lib/conversationStore';
import { UserProfile } from './UserProfile';
import { SavedConversations } from './SavedConversations';
import { SystemGuardrails } from './SystemGuardrails';
import { PharmoraLogo } from './PharmoraLogo';

interface Props {
  signedInRole: Role;
  username: string;
  conversations: StoredConversation[];
  activeConversationId: string | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onLogout?: () => void;
}

export function Sidebar({
  signedInRole,
  username,
  conversations,
  activeConversationId,
  collapsed,
  onToggleCollapsed,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onLogout,
}: Props) {
  const expand = () => {
    if (collapsed) onToggleCollapsed();
  };

  const displayName = username ? username.charAt(0).toUpperCase() + username.slice(1) : 'User';

  return (
    <div className={`sidebar-wrapper ${collapsed ? 'is-collapsed' : ''}`}>
      <aside className="sidebar">
        {collapsed ? (
          <div className="sidebar-rail">
            <button
              className="sidebar-rail-btn sidebar-rail-btn-brand"
              onClick={onToggleCollapsed}
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PharmoraLogo size={28} />
            </button>

            <div className="sidebar-rail-divider" />

            <button
              className="sidebar-rail-btn sidebar-rail-btn-accent"
              onClick={onNewConversation}
              title="New conversation"
              aria-label="New conversation"
            >
              <Plus size={20} />
            </button>

            <button
              className="sidebar-rail-btn"
              onClick={expand}
              title="Conversations"
              aria-label="Open conversations"
            >
              <MessageSquareText size={19} />
              {conversations.length > 0 && (
                <span className="sidebar-rail-badge">{conversations.length}</span>
              )}
            </button>

            <button
              className="sidebar-rail-btn"
              onClick={expand}
              title="System guardrails"
              aria-label="Open guardrails"
            >
              <ShieldCheck size={19} />
            </button>

            <div className="sidebar-rail-spacer" />

            <button
              className="sidebar-rail-btn"
              onClick={expand}
              title={`${displayName} · ${signedInRole}`}
              aria-label="Open user profile"
            >
              <UserCircle2 size={20} />
            </button>

            {onLogout && (
              <button
                className="sidebar-rail-btn sidebar-rail-btn-logout"
                onClick={onLogout}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        ) : (
          <>
            <button
              className="sidebar-brand sidebar-brand-button"
              onClick={onToggleCollapsed}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PharmoraLogo size={36} />
              <div className="sidebar-brand-text">
                <h1 className="brand-title">Pharmora Co-Assist</h1>
                <p className="brand-subtitle">Cardiometabolic Strategy &amp; Pipeline</p>
              </div>
            </button>

            <SavedConversations
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={onSelectConversation}
              onNew={onNewConversation}
              onDelete={onDeleteConversation}
              onRename={onRenameConversation}
            />

            <SystemGuardrails />

            <div className="sidebar-account">
              <UserProfile
                username={username}
                signedInRole={signedInRole}
                onLogout={onLogout}
              />
            </div>
          </>
        )}
      </aside>

    </div>
  );
}
