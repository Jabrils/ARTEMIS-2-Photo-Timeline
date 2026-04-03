import type { ChatPart } from '../hooks/useChat';

interface Props {
  part: Extract<ChatPart, { type: 'video' }>;
}

export default function ChatVideo({ part }: Props) {
  return (
    <div className="my-2">
      <div className="text-[10px] text-gray-400 mb-1">{part.title}</div>
      <div className="rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${part.videoId}`}
          title={part.title}
          width="100%"
          style={{ aspectRatio: '16/9' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="border-0"
        />
      </div>
    </div>
  );
}
