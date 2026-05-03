import { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, Role } from '../types';
import { ChatMessage } from './ChatMessage';
import { PromptButtons } from './PromptButtons';
import { samplePrompts } from '../data/samplePrompts';

interface Props {
  messages: ChatMessageType[];
  onSend: (message: string) => void;
  role: Role;
  isLoading: boolean;
}

export function ChatWindow({ messages, onSend, role, isLoading }: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <main className="chat-window">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <h2>Welcome to Pharmora Signal</h2>
            <p>AI Cardiometabolic Strategy & Pipeline Copilot</p>
            <p className="welcome-sub">
              Ask strategic questions about pipeline prioritization, clinical trial planning,
              payer strategy, competitor threats, and compliance traceability.
            </p>
            <p className="welcome-role">Current role: <strong>{role}</strong></p>
            <PromptButtons prompts={samplePrompts} onSelect={onSend} />
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="chat-msg chat-msg-assistant">
            <div className="msg-bubble msg-assistant-bubble loading-bubble">
              <div className="loading-dots">
                <span></span><span></span><span></span>
              </div>
              <span className="loading-text">Pharmora Signal is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask Pharmora Signal a strategic question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="chat-send-btn" disabled={isLoading}>
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </main>
  );
}
