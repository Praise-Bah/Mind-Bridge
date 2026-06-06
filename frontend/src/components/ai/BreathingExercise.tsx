import { useState } from 'react'
import { X, Play, Pause, RotateCcw } from 'lucide-react'
import BreathingCircle from './BreathingCircle'

interface BreathingExerciseProps {
  isOpen: boolean
  onClose: () => void
}

export default function BreathingExercise({ isOpen, onClose }: BreathingExerciseProps) {
  const [isActive, setIsActive] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)

  const handleStart = () => {
    setIsActive(true)
  }

  const handlePause = () => {
    setIsActive(false)
  }

  const handleReset = () => {
    setIsActive(false)
    setCycleCount(0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6] bg-clip-text text-transparent">
            4-7-8 Breathing Exercise
          </h2>
          <p className="text-muted-foreground mt-2">
            A calming technique to reduce anxiety and promote relaxation
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <BreathingCircle isActive={isActive} />
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-[#00D4FF]">4 seconds</span> inhale · 
            <span className="font-medium text-[#0EA5E9]"> 7 seconds</span> hold · 
            <span className="font-medium text-[#8B5CF6]"> 8 seconds</span> exhale
          </p>
        </div>

        <div className="flex justify-center gap-3">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#00D4FF] text-white hover:opacity-90 transition-opacity"
            >
              <Play className="w-5 h-5" />
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              <Pause className="w-5 h-5" />
              Pause
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-muted transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        {cycleCount > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Cycles completed: {cycleCount}
          </p>
        )}
      </div>
    </div>
  )
}
