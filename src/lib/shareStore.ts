import { ChatMessage } from '../types';
import { StoredConversation } from './conversationStore';

export const TEST_USER_EMAIL = 'testuser@pharmora.com';

const SHARED_STORAGE_KEY = 'pharmora-shared-conversations';
const MAX_IMPORTED_THREADS = 20;

export interface SharedConversation {
  id: string;
  recipientEmail: string;
  senderEmail: string;
  title: string;
  note: string | null;
  sharedAt: number;
  messages: ChatMessage[];
}

interface ShareConversationInput {
  recipientEmail: string;
  senderEmail: string;
  title: string;
  note?: string | null;
  messages: ChatMessage[];
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readSharedConversations(): SharedConversation[] {
  try {
    const raw = localStorage.getItem(SHARED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((share) => {
        const recipientEmail = typeof share?.recipientEmail === 'string'
          ? share.recipientEmail
          : typeof share?.recipient === 'string'
            ? share.recipient
            : '';
        const senderEmail = typeof share?.senderEmail === 'string'
          ? share.senderEmail
          : 'legacy-share@pharmora.local';

        return {
          id: typeof share?.id === 'string' ? share.id : crypto.randomUUID(),
          recipientEmail,
          senderEmail,
          title: share?.title,
          note: share?.note ?? null,
          sharedAt: share?.sharedAt,
          messages: share?.messages,
        };
      })
      .filter((share): share is SharedConversation => {
        return (
          typeof share?.id === 'string' &&
          typeof share?.recipientEmail === 'string' &&
          typeof share?.senderEmail === 'string' &&
          typeof share?.title === 'string' &&
          typeof share?.sharedAt === 'number' &&
          Array.isArray(share?.messages)
        );
      })
      .map((share) => ({
        ...share,
        recipientEmail: normalizeEmail(share.recipientEmail),
        senderEmail: normalizeEmail(share.senderEmail),
      }));
  } catch {
    return [];
  }
}

function writeSharedConversations(shares: SharedConversation[]): void {
  localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify(shares));
}

export function shareConversation(input: ShareConversationInput): SharedConversation {
  const share: SharedConversation = {
    id: crypto.randomUUID(),
    recipientEmail: normalizeEmail(input.recipientEmail),
    senderEmail: normalizeEmail(input.senderEmail),
    title: input.title,
    note: input.note?.trim() || null,
    sharedAt: Date.now(),
    messages: input.messages,
  };

  writeSharedConversations([...readSharedConversations(), share]);
  return share;
}

export function claimSharedConversations(recipientEmail: string): StoredConversation[] {
  const normalizedRecipient = normalizeEmail(recipientEmail);
  if (!normalizedRecipient) return [];

  const allShares = readSharedConversations();
  const matchedShares = allShares.filter((share) => share.recipientEmail === normalizedRecipient);
  if (matchedShares.length === 0) return [];

  const remainingShares = allShares.filter((share) => share.recipientEmail !== normalizedRecipient);
  writeSharedConversations(remainingShares);

  return matchedShares.slice(0, MAX_IMPORTED_THREADS).map((share) => ({
    id: `shared-${share.id}`,
    title: share.title,
    timestamp: share.sharedAt,
    messages: [
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: [
          `Shared by ${share.senderEmail}.`,
          share.note ? `Note: ${share.note}` : null,
        ].filter(Boolean).join('\n\n'),
      },
      ...share.messages,
    ],
  }));
}
