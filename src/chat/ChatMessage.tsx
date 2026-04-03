import type { ChatMessage as ChatMessageType, ChatPart } from '../hooks/useChat';
import ChatImage from './ChatImage';
import ChatChart from './ChatChart';
import ChatVideo from './ChatVideo';

/** Render basic markdown: **bold**, newlines, and numbered/bullet lists */
function renderMarkdown(text: string) {
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/^(\d+)\.\s+/gm, '<li>');
  html = html.replace(/^[-*]\s+/gm, '<li>');
  html = html.replace(/\n\n/g, '<br/><br/>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

function renderPart(part: ChatPart, index: number) {
  switch (part.type) {
    case 'text':
      return <span key={index} dangerouslySetInnerHTML={{ __html: renderMarkdown(part.content) }} />;
    case 'image':
    case 'nasa-image':
      return <ChatImage key={index} part={part} />;
    case 'chart':
      return <ChatChart key={index} part={part} />;
    case 'video':
      return <ChatVideo key={index} part={part} />;
  }
}

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-[rgba(0,212,255,0.15)] text-hud-blue border border-[rgba(0,212,255,0.2)]'
            : 'bg-[rgba(255,255,255,0.05)] text-gray-200 border border-[rgba(255,255,255,0.05)]'
        }`}
      >
        {isUser ? (
          message.text
        ) : message.parts ? (
          message.parts.map(renderPart)
        ) : (
          <span dangerouslySetInnerHTML={{ __html: renderMarkdown(message.text) }} />
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-[rgba(255,255,255,0.05)] rounded-lg px-4 py-3 border border-[rgba(255,255,255,0.05)]">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
