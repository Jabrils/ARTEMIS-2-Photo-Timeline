import { QUICK_ANSWERS } from '../data/artemis-knowledge';

interface Props {
  onSelect: (question: string) => void;
}

const DISPLAYED_QUESTIONS = QUICK_ANSWERS.slice(0, 8);

export default function QuickAnswers({ onSelect }: Props) {
  return (
    <div className="p-3">
      <p className="text-xs text-gray-400 mb-3">Ask me about the Artemis II mission:</p>
      <div className="flex flex-wrap gap-2">
        {DISPLAYED_QUESTIONS.map((qa) => (
          <button
            key={qa.question}
            onClick={() => onSelect(qa.question)}
            className="px-3 py-1.5 rounded-full text-xs bg-[rgba(0,212,255,0.1)] text-hud-blue border border-[rgba(0,212,255,0.15)] hover:bg-[rgba(0,212,255,0.2)] hover:border-[rgba(0,212,255,0.3)] transition-all"
          >
            {qa.question}
          </button>
        ))}
      </div>
    </div>
  );
}
