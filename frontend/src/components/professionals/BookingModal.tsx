import { useState } from 'react'
import { X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Professional, Availability } from '@/types'
import { professionalService } from '@/services/professionalService'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface Props {
  professional: Professional
  availability: Availability[]
  onClose: () => void
  onBooked: () => void
}

function getNextDateForWeekday(weekday: number): string {
  const today = new Date()
  const todayDay = today.getDay() === 0 ? 6 : today.getDay() - 1
  let daysAhead = weekday - todayDay
  if (daysAhead <= 0) daysAhead += 7
  const target = new Date(today)
  target.setDate(today.getDate() + daysAhead)
  return target.toISOString().split('T')[0]
}

type Step = 'day' | 'time' | 'confirm' | 'done'

export default function BookingModal({ professional, availability, onClose, onBooked }: Props) {
  const [step, setStep] = useState<Step>('day')
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const availableDays = [...new Set(availability.map(a => a.weekday))].sort()
  const slotsForDay = availability.filter(a => a.weekday === selectedWeekday)

  async function handleConfirm() {
    if (!selectedSlot || selectedWeekday === null) return
    setLoading(true)
    try {
      await professionalService.createBooking({
        professional: professional.id,
        scheduled_date: getNextDateForWeekday(selectedWeekday),
        scheduled_time: selectedSlot.start_time,
        description,
      })
      setStep('done')
      setTimeout(onBooked, 1800)
    } catch {
      toast.error('Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="font-semibold text-white">Book Session</h2>
            <p className="text-xs text-gray-400 mt-0.5">{professional.user_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {/* Step indicator */}
          {step !== 'done' && (
            <div className="flex items-center gap-2 mb-5">
              {(['day', 'time', 'confirm'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s ? 'bg-indigo-600 text-white' :
                    ['day', 'time', 'confirm'].indexOf(step) > i ? 'bg-green-600 text-white' :
                    'bg-white/10 text-gray-500'
                  }`}>
                    {['day', 'time', 'confirm'].indexOf(step) > i ? <Check size={12} /> : i + 1}
                  </div>
                  <span className={`text-xs capitalize ${step === s ? 'text-white' : 'text-gray-500'}`}>
                    {s === 'day' ? 'Choose day' : s === 'time' ? 'Pick slot' : 'Confirm'}
                  </span>
                  {i < 2 && <div className="w-6 h-px bg-white/10" />}
                </div>
              ))}
            </div>
          )}

          {/* Step: Select day */}
          {step === 'day' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-300 mb-3">Which day works for you?</p>
              {availableDays.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No availability set yet</p>
              ) : (
                availableDays.map(day => (
                  <button
                    key={day}
                    onClick={() => { setSelectedWeekday(day); setStep('time') }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 text-sm text-gray-200 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-150"
                  >
                    <span className="font-medium">{WEEKDAYS[day]}</span>
                    <span className="text-xs text-gray-500">
                      {availability.filter(a => a.weekday === day).length} slot(s)
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step: Select time slot */}
          {step === 'time' && selectedWeekday !== null && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setStep('day')} className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
                  ← {WEEKDAYS[selectedWeekday]}
                </button>
              </div>
              <p className="text-sm text-gray-300 mb-3">Pick a time slot:</p>
              {slotsForDay.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => { setSelectedSlot(slot); setStep('confirm') }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 text-sm text-gray-200 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-150"
                >
                  <span>{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</span>
                  <span className="text-xs text-green-400">Available</span>
                </button>
              ))}
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && selectedSlot && selectedWeekday !== null && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Professional</span>
                  <span className="text-white font-medium">{professional.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Day</span>
                  <span className="text-white">{WEEKDAYS[selectedWeekday]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time</span>
                  <span className="text-white">{selectedSlot.start_time.slice(0, 5)} – {selectedSlot.end_time.slice(0, 5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span className="text-white">{getNextDateForWeekday(selectedWeekday)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rate</span>
                  <span className="text-green-400 font-semibold">${Number(professional.session_rate).toFixed(0)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Session description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What would you like to discuss?"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('time')} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Booking…' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}

          {/* Done state */}
          {step === 'done' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 64 64" className="w-16 h-16">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#4ade80" strokeWidth="3" />
                  <path
                    d="M20 32 L28 40 L44 24"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-checkmark-draw"
                  />
                </svg>
              </div>
              <p className="text-green-400 font-semibold text-lg">Booking Confirmed!</p>
              <p className="text-gray-400 text-sm mt-1">
                {professional.user_name} has been notified.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
