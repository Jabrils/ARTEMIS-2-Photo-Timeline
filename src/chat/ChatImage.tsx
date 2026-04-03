import type { ChatPart } from '../hooks/useChat';

interface Props {
  part: Extract<ChatPart, { type: 'image' }> | Extract<ChatPart, { type: 'nasa-image' }>;
}

export default function ChatImage({ part }: Props) {
  if (part.type === 'image') {
    return (
      <div className="my-2">
        <img
          src={`data:${part.mimeType};base64,${part.data}`}
          alt={part.alt || 'AI-generated illustration'}
          className="rounded-lg w-full"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="my-2">
      <img
        src={part.url}
        alt={part.title}
        className="rounded-lg w-full"
        loading="lazy"
      />
      <div className="flex justify-between items-center mt-1 text-[10px] text-gray-400">
        <span className="truncate">{part.title}</span>
        <span className="shrink-0 ml-2">{part.credit}</span>
      </div>
    </div>
  );
}
