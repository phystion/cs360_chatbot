import { Role } from '../types';

interface ChatApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendChatMessage(
  messages: ChatApiMessage[],
  role: Role
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, role }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`API error ${response.status}: ${body.error || 'unknown error'}`);
  }

  const data = await response.json();
  return data.content;
}
