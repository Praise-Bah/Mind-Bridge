import { useState } from 'react'
import { Wind, Brain, Hand, HeartPulse, Timer, ChevronRight, ArrowLeft, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react'
import BreathingCircle from '@/components/ai/BreathingCircle'

type Exercise = {
  id: string
  title: string
  description: string
  duration: string
  category: 'breathing' | 'cbt' | 'grounding' | 'relaxation'
  icon: typeof Wind
  color: string
  steps: string[]
}

const EXERCISES: Exercise[] = [
  {
    id: '478-breathing',
    title: '4-7-8 Breathing',
    description: 'A calming technique that reduces anxiety and helps you fall asleep. Breathe in for 4 seconds, hold for 7, exhale for 8.',
    duration: '3-5 min',
    category: 'breathing',
    icon: Wind,
    color: 'from-cyan-500 to-blue-600',
    steps: [
      'Find a comfortable seated position and close your eyes',
      'Exhale completely through your mouth with a whoosh sound',
      'Close your mouth and inhale quietly through your nose for 4 seconds',
      'Hold your breath for 7 seconds',
      'Exhale completely through your mouth for 8 seconds',
      'Repeat this cycle 3-4 times',
    ],
  },
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    description: 'Used by Navy SEALs to stay calm under pressure. Equal counts of inhale, hold, exhale, hold.',
    duration: '4 min',
    category: 'breathing',
    icon: Wind,
    color: 'from-teal-500 to-emerald-600',
    steps: [
      'Sit upright and slowly exhale all your air',
      'Inhale slowly through your nose for 4 seconds',
      'Hold your breath for 4 seconds',
      'Exhale slowly through your mouth for 4 seconds',
      'Hold your breath for 4 seconds',
      'Repeat for 4 cycles',
    ],
  },
  {
    id: 'thought-challenging',
    title: 'Thought Challenging',
    description: 'A core CBT technique to identify and reframe negative automatic thoughts into balanced perspectives.',
    duration: '10 min',
    category: 'cbt',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    steps: [
      'Identify the situation that triggered your distress',
      'Notice the automatic thought — what went through your mind?',
      'Rate how strongly you believe this thought (0-100%)',
      'List evidence that SUPPORTS this thought',
      'List evidence that CONTRADICTS this thought',
      'Create a balanced alternative thought based on all evidence',
      'Re-rate your belief in the original thought',
    ],
  },
  {
    id: 'behavioral-activation',
    title: 'Behavioral Activation',
    description: 'Break the cycle of low mood by scheduling small, achievable activities that bring a sense of accomplishment or pleasure.',
    duration: '5 min',
    category: 'cbt',
    icon: Brain,
    color: 'from-violet-500 to-purple-600',
    steps: [
      'Rate your current mood on a scale of 1-10',
      'List 3 small activities you used to enjoy or that give you a sense of achievement',
      'Pick the easiest one and commit to doing it today',
      'Set a specific time and place for the activity',
      'After completing it, notice and rate how you feel',
      'Gradually add more activities each day',
    ],
  },
  {
    id: 'cognitive-reframing',
    title: 'Cognitive Reframing',
    description: 'Transform "all-or-nothing" thinking patterns by finding the middle ground between extremes.',
    duration: '8 min',
    category: 'cbt',
    icon: Brain,
    color: 'from-fuchsia-500 to-pink-600',
    steps: [
      'Write down the negative thought exactly as it appears',
      'Identify the thinking pattern: catastrophizing, mind-reading, black-and-white, personalization?',
      'Ask: "Would I say this to a friend in the same situation?"',
      'Ask: "What would I tell that friend instead?"',
      'Write a more compassionate, realistic version of the thought',
      'Read both versions and notice how each one makes you feel',
    ],
  },
  {
    id: '54321-grounding',
    title: '5-4-3-2-1 Grounding',
    description: 'A sensory grounding technique that brings you back to the present moment during anxiety or panic.',
    duration: '3 min',
    category: 'grounding',
    icon: Hand,
    color: 'from-amber-500 to-orange-600',
    steps: [
      'Name 5 things you can SEE around you right now',
      'Name 4 things you can TOUCH — feel their texture',
      'Name 3 things you can HEAR in this moment',
      'Name 2 things you can SMELL (or like the smell of)',
      'Name 1 thing you can TASTE (or like the taste of)',
      'Take a deep breath and notice how you feel now',
    ],
  },
  {
    id: 'body-scan',
    title: 'Body Scan',
    description: 'Systematically notice and release tension from each part of your body, from toes to head.',
    duration: '10 min',
    category: 'grounding',
    icon: Hand,
    color: 'from-rose-500 to-red-600',
    steps: [
      'Lie down or sit comfortably. Close your eyes.',
      'Bring attention to your feet. Notice any tension and let it go',
      'Move to your calves and thighs. Breathe into any tightness',
      'Notice your stomach and chest. Let them soften with each exhale',
      'Release tension in your shoulders, arms, and hands',
      'Relax your neck, jaw, and face muscles',
      'Take 3 deep breaths and feel your whole body at ease',
    ],
  },
  {
    id: 'progressive-muscle',
    title: 'Progressive Muscle Relaxation',
    description: 'Tense and release each muscle group to release physical tension caused by stress and anxiety.',
    duration: '10 min',
    category: 'relaxation',
    icon: HeartPulse,
    color: 'from-green-500 to-emerald-600',
    steps: [
      'Sit or lie in a comfortable position. Take 3 deep breaths.',
      'Clench your fists tightly for 5 seconds, then release. Notice the difference.',
      'Tense your biceps for 5 seconds, then release completely',
      'Raise your shoulders to your ears for 5 seconds, then drop them',
      'Scrunch your face muscles for 5 seconds, then relax',
      'Tense your thighs and calves for 5 seconds, then release',
      'Curl your toes tightly for 5 seconds, then let go',
      'Take 3 more deep breaths and enjoy the relaxation',
    ],
  },
]

const CATEGORIES = [
  { id: 'all', label: 'All', icon: CheckCircle2 },
  { id: 'breathing', label: 'Breathing', icon: Wind },
  { id: 'cbt', label: 'CBT Techniques', icon: Brain },
  { id: 'grounding', label: 'Grounding', icon: Hand },
  { id: 'relaxation', label: 'Relaxation', icon: HeartPulse },
]

export default function WellnessPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [breathingActive, setBreathingActive] = useState(false)

  const filtered = selectedCategory === 'all'
    ? EXERCISES
    : EXERCISES.filter(e => e.category === selectedCategory)

  function openExercise(exercise: Exercise) {
    setActiveExercise(exercise)
    setCurrentStep(0)
    setCompletedSteps(new Set())
    setBreathingActive(false)
  }

  function markStepComplete(step: number) {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.add(step)
      return next
    })
    if (step < (activeExercise?.steps.length ?? 0) - 1) {
      setCurrentStep(step + 1)
    }
  }

  const isBreathingExercise = activeExercise?.category === 'breathing'

  if (activeExercise) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => setActiveExercise(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to Exercises
        </button>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${activeExercise.color}`} />
          <div className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activeExercise.color} flex items-center justify-center shrink-0`}>
                <activeExercise.icon size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{activeExercise.title}</h1>
                <p className="text-gray-400 text-sm mt-1">{activeExercise.description}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Timer size={12} />
                  {activeExercise.duration}
                </div>
              </div>
            </div>

            {/* Breathing visualization */}
            {isBreathingExercise && (
              <div className="flex flex-col items-center py-8">
                <div className="h-72 flex items-center justify-center">
                  <BreathingCircle isActive={breathingActive} />
                </div>
                <div className="flex gap-3 mt-4">
                  {!breathingActive ? (
                    <button
                      onClick={() => setBreathingActive(true)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${activeExercise.color} text-white hover:opacity-90 transition-opacity`}
                    >
                      <Play size={18} /> Start Breathing
                    </button>
                  ) : (
                    <button
                      onClick={() => setBreathingActive(false)}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white hover:bg-white/15 transition-colors"
                    >
                      <Pause size={18} /> Pause
                    </button>
                  )}
                  <button
                    onClick={() => setBreathingActive(false)}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
                  >
                    <RotateCcw size={18} /> Reset
                  </button>
                </div>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-3 mt-6">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Step-by-Step Guide
              </h3>
              {activeExercise.steps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => markStepComplete(i)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all ${
                    completedSteps.has(i)
                      ? 'bg-green-500/10 border border-green-500/20'
                      : i === currentStep
                        ? 'bg-white/5 border border-indigo-500/30'
                        : 'bg-white/2 border border-white/5 opacity-60'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                    completedSteps.has(i)
                      ? 'bg-green-500 text-white'
                      : i === currentStep
                        ? `bg-gradient-to-br ${activeExercise.color} text-white`
                        : 'bg-white/10 text-gray-500'
                  }`}>
                    {completedSteps.has(i) ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <p className={`text-sm leading-relaxed ${
                    completedSteps.has(i) ? 'text-green-300' : i === currentStep ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step}
                  </p>
                </button>
              ))}
            </div>

            {completedSteps.size === activeExercise.steps.length && (
              <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                <CheckCircle2 size={28} className="mx-auto text-green-400 mb-2" />
                <p className="text-green-300 font-medium">Exercise Complete!</p>
                <p className="text-green-400/70 text-sm mt-1">Well done. Take a moment to notice how you feel.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Wellness Toolkit</h1>
        <p className="text-gray-400 mt-1">
          Guided CBT techniques, breathing exercises, and grounding activities for your mental wellbeing.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <cat.icon size={15} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Exercise cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map(exercise => (
          <button
            key={exercise.id}
            onClick={() => openExercise(exercise)}
            className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-5 text-left hover:border-indigo-500/30 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${exercise.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <exercise.icon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {exercise.title}
                </h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{exercise.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Timer size={12} /> {exercise.duration}
                  </span>
                  <ChevronRight size={16} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
