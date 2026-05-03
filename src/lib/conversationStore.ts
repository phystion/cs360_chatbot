import { ChatMessage } from '../types';

export interface StoredConversation {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'pharmora-signal-conversations-strategy';
const MAX_THREADS = 20;

export function loadConversations(_mode?: string): StoredConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredConversation[];
    return parsed.slice(0, MAX_THREADS);
  } catch {
    return [];
  }
}

export function saveConversations(conversations: StoredConversation[]): void {
  const trimmed = conversations.slice(0, MAX_THREADS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function deleteConversation(_mode: string, id: string): StoredConversation[] {
  const conversations = loadConversations().filter((c) => c.id !== id);
  saveConversations(conversations);
  return conversations;
}

export function upsertConversation(_mode: string, conv: StoredConversation): StoredConversation[] {
  let conversations = loadConversations();
  const idx = conversations.findIndex((c) => c.id === conv.id);
  if (idx >= 0) {
    conversations[idx] = conv;
  } else {
    conversations = [conv, ...conversations];
  }
  conversations = conversations.slice(0, MAX_THREADS);
  saveConversations(conversations);
  return conversations;
}
