import type { ChatPart } from '../hooks/useChat';

interface Props {
  part: Extract<ChatPart, { type: 'sources' }>;
}

export default function ChatSources({ part }: Props) {
  if (part.items.length === 0) return null;

  return (
    <div className="my-2">
      <div className="text-[10px] text-gray-400 mb-1">Sources</div>
      <div className="flex flex-wrap gap-1.5">
        {part.items.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 rounded-full text-[11px] bg-[rgba(0,212,255,0.08)] text-hud-blue border border-[rgba(0,212,255,0.15)] hover:bg-[rgba(0,212,255,0.2)] hover:border-[rgba(0,212,255,0.3)] transition-all truncate max-w-[200px]"
            title={item.url}
          >
            {item.title}
          </a>
        ))}
      </div>
    </div>
  );
}
