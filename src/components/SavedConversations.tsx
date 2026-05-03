import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { StoredConversation } from '../lib/conversationStore';

interface Props {
  conversations: StoredConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function SavedConversations({ conversations, activeId, onSelect, onNew, onDelete, onRename }: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renamingId]);

  const startRename = (conv: StoredConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(conv.id);
    setRenameValue(conv.title);
  };

  const commitRename = (id: string) => {
    if (renameValue.trim()) onRename(id, renameValue.trim());
    setRenamingId(null);
  };

  const cancelRename = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRenamingId(null);
  };

  return (
    <div className="saved-conversations">
      <div className="saved-conversations-header">
        <h4 className="section-title">Conversations</h4>
        <button className="new-chat-btn-sm" onClick={onNew}>+ New</button>
      </div>
      <div className="conversation-list">
        {conversations.length === 0 && (
          <p className="no-conversations">No conversations yet.</p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${conv.id === activeId ? 'active' : ''}`}
            onClick={() => renamingId !== conv.id && onSelect(conv.id)}
          >
            {renamingId === conv.id ? (
              <div className="conversation-rename" onClick={(e) => e.stopPropagation()}>
                <input
                  ref={inputRef}
                  className="conversation-rename-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(conv.id);
                    if (e.key === 'Escape') cancelRename();
                  }}
                  onBlur={() => commitRename(conv.id)}
                  maxLength={60}
                />
                <button
                  className="conversation-rename-ok"
                  onMouseDown={(e) => { e.preventDefault(); commitRename(conv.id); }}
                  title="Save"
                  aria-label="Save rename"
                >
                  <Check size={11} />
                </button>
                <button
                  className="conversation-rename-cancel"
                  onMouseDown={(e) => { e.preventDefault(); cancelRename(); }}
                  title="Cancel"
                  aria-label="Cancel rename"
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <>
                <div className="conversation-item-content">
                  <span className="conversation-title">{conv.title}</span>
                  <span className="conversation-time">{formatTime(conv.timestamp)}</span>
                </div>
                <button
                  className="conversation-action-btn conversation-rename-btn"
                  onClick={(e) => startRename(conv, e)}
                  title="Rename"
                  aria-label="Rename conversation"
                >
                  <Pencil size={11} />
                </button>
                <button
                  className="conversation-action-btn conversation-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  title="Delete"
                  aria-label="Delete conversation"
                >
                  <X size={11} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
