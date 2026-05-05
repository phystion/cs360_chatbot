import { useEffect, useRef, useState } from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface Props {
  message: ChatMessageType;
  onTypingComplete?: (messageId: string) => void;
}

const TYPING_CHARS_PER_TICK = 4;
const TYPING_TICK_MS = 16;

export function ChatMessage({ message, onTypingComplete }: Props) {
  const isAssistant = message.role === 'assistant';
  const shouldType = isAssistant && message.isTyping === true;
  const [revealedCount, setRevealedCount] = useState(shouldType ? 0 : message.content.length);
  const completedRef = useRef(!shouldType);

  useEffect(() => {
    if (!shouldType) {
      setRevealedCount(message.content.length);
      completedRef.current = true;
      return;
    }
    completedRef.current = false;
    setRevealedCount(0);
    const total = message.content.length;
    const interval = window.setInterval(() => {
      setRevealedCount((current) => {
        const next = Math.min(current + TYPING_CHARS_PER_TICK, total);
        if (next >= total) {
          window.clearInterval(interval);
          if (!completedRef.current) {
            completedRef.current = true;
            onTypingComplete?.(message.id);
          }
        }
        return next;
      });
    }, TYPING_TICK_MS);
    return () => window.clearInterval(interval);
  }, [shouldType, message.id, message.content, onTypingComplete]);

  if (message.role === 'user') {
    return (
      <div className="chat-msg chat-msg-user">
        <div className="msg-bubble msg-user-bubble">
          {message.content}
        </div>
      </div>
    );
  }

  const visibleContent = shouldType ? message.content.slice(0, revealedCount) : message.content;
  const isStillTyping = shouldType && revealedCount < message.content.length;

  return (
    <div className="chat-msg chat-msg-assistant">
      <div className="msg-bubble msg-assistant-bubble">
        {visibleContent.split('\n').map((line, i) => {
          if (line.startsWith('**') && line.endsWith('**')) {
            return <h4 key={i} className="msg-section-header">{line.replace(/\*\*/g, '')}</h4>;
          }
          if (line.startsWith('**') && line.includes(':**')) {
            const parts = line.split(':**');
            const label = parts[0].replace(/\*\*/g, '');
            const value = parts.slice(1).join(':**');
            return (
              <div key={i} className="msg-field">
                <span className="msg-field-label">{label}:</span>
                <span>{value}</span>
              </div>
            );
          }
          if (line === '') return <br key={i} />;
          return <p key={i} className="msg-text">{line}</p>;
        })}
        {isStillTyping && <span className="msg-typing-caret" aria-hidden />}
      </div>
    </div>
  );
}
