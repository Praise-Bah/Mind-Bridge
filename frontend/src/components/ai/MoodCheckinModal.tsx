import { useState } from 'react';
import { X } from 'lucide-react';

interface MoodCheckinModalProps {
  sessionId: string;
  onComplete: (mood: string, score: number) => void;
  onSkip: () => void;
}

const MOODS = [
  { emoji: '😊', label: 'Happy', value: 'happy', score: 0.9 },
  { emoji: '😌', label: 'Calm', value: 'calm', score: 0.7 },
  { emoji: '😐', label: 'Neutral', value: 'neutral', score: 0.5 },
  { emoji: '😟', label: 'Anxious', value: 'anxious', score: 0.3 },
  { emoji: '😢', label: 'Sad', value: 'sad', score: 0.2 },
  { emoji: '😤', label: 'Stressed', value: 'stressed', score: 0.25 },
  { emoji: '😩', label: 'Overwhelmed', value: 'overwhelmed', score: 0.15 },
];

export default function MoodCheckinModal({ sessionId, onComplete, onSkip }: MoodCheckinModalProps) {
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[number] | null>(null);

  const handleSubmit = () => {
    if (selectedMood) {
      onComplete(selectedMood.value, selectedMood.score);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            How are you feeling?
          </h2>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
          Take a moment to check in with yourself before we chat. This helps Mira understand where you are right now.
        </p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood)}
              className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                selectedMood?.value === mood.value
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500 scale-105'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-2xl mb-1">{mood.emoji}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">{mood.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 px-4 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedMood}
            className="flex-1 py-2.5 px-4 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
