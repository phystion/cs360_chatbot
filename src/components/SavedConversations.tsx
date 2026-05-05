import { useState, useRef, useEffect, useMemo } from 'react';
import { Pencil, Check, X, SquarePen, Search, MessageSquareText } from 'lucide-react';
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations.map((c) => ({ conv: c, snippet: null as string | null }));
    return conversations
      .map((c) => {
        const titleHit = c.title.toLowerCase().includes(q);
        const matchingMsg = c.messages.find((m) => m.content.toLowerCase().includes(q));
        if (!titleHit && !matchingMsg) return null;
        let snippet: string | null = null;
        if (matchingMsg) {
          const text = matchingMsg.content;
          const idx = text.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 30);
          const end = Math.min(text.length, idx + q.length + 60);
          snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
        }
        return { conv: c, snippet };
      })
      .filter((r): r is { conv: StoredConversation; snippet: string | null } => r !== null);
  }, [conversations, searchQuery]);

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
      <div className="sidebar-actions">
        <button className="sidebar-action-row" onClick={onNew}>
          <SquarePen size={18} />
          <span>New chat</span>
        </button>
        <button className="sidebar-action-row" onClick={() => setSearchOpen(true)}>
          <Search size={18} />
          <span>Search chats</span>
        </button>
      </div>
      <div className="saved-conversations-header">
        <h4 className="section-title">Conversations</h4>
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

      {searchOpen && (
        <div className="search-modal-overlay" onClick={closeSearch}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-input-row">
              <Search size={18} />
              <input
                ref={searchInputRef}
                type="text"
                className="search-modal-input"
                placeholder="Search chats and messages…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="search-modal-close"
                onClick={closeSearch}
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>

            <div className="search-modal-results">
              {!searchQuery.trim() && (
                <button
                  className="search-modal-item search-modal-newchat"
                  onClick={() => {
                    closeSearch();
                    onNew();
                  }}
                >
                  <SquarePen size={16} />
                  <span>New chat</span>
                </button>
              )}

              {searchResults.length > 0 && (
                <div className="search-modal-section-label">
                  {searchQuery.trim() ? 'Matches' : 'Recent'}
                </div>
              )}

              {searchResults.length === 0 && searchQuery.trim() && (
                <p className="search-modal-empty">No conversations match "{searchQuery.trim()}".</p>
              )}

              {searchResults.map(({ conv, snippet }) => (
                <button
                  key={conv.id}
                  className="search-modal-item search-modal-conv"
                  onClick={() => {
                    closeSearch();
                    onSelect(conv.id);
                  }}
                >
                  <MessageSquareText size={15} />
                  <div className="search-modal-conv-text">
                    <span className="search-modal-conv-title">{conv.title}</span>
                    {snippet && (
                      <span className="search-modal-conv-snippet">{snippet}</span>
                    )}
                  </div>
                  <span className="search-modal-conv-time">{formatTime(conv.timestamp)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
