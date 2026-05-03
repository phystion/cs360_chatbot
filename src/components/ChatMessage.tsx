import { ChatMessage as ChatMessageType } from '../types';

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  if (message.role === 'user') {
    return (
      <div className="chat-msg chat-msg-user">
        <div className="msg-bubble msg-user-bubble">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-msg chat-msg-assistant">
      <div className="msg-bubble msg-assistant-bubble">
        {message.content.split('\n').map((line, i) => {
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
      </div>
    </div>
  );
}
