import { useState } from 'react';
import { X, Star } from 'lucide-react';

interface SessionFeedbackModalProps {
  sessionId: string;
  onSubmit: (rating: number, text: string) => void;
  onSkip: () => void;
}

export default function SessionFeedbackModal({ sessionId: _sessionId, onSubmit, onSkip }: SessionFeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, feedbackText);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            How was your session?
          </h2>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
          Your feedback helps us improve MindBot and provide better support.
        </p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                } transition-colors`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Any thoughts you'd like to share? (optional)"
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          rows={3}
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 px-4 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1 py-2.5 px-4 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
