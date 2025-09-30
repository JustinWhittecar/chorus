import { MessageSquare } from 'lucide-react';

interface FeedbackButtonProps {
  onClick: () => void;
}

export function FeedbackButton({ onClick }: FeedbackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-40"
      aria-label="Open feedback form"
    >
      <MessageSquare className="w-5 h-5" />
      <span className="font-medium">Feedback</span>
    </button>
  );
}
