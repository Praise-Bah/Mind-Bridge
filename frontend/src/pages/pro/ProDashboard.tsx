import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Calendar, Users, Clock, FileText, DollarSign, User,
  MessageCircle, Play,
  Plus, Trash2, Edit2, Check, X, Loader2, Video,
  TrendingUp, AlertCircle, Inbox,
} from 'lucide-react'
import { proDashboardService } from '@/services/proDashboardService'
import { chatService } from '@/services/chatService'
import type { ProBooking, PatientEntry, EarningsSummary, SessionNote, Availability } from '@/types'

type Tab = 'sessions' | 'patients' | 'availability' | 'notes' | 'earnings' | 'profile' | 'bookings'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'sessions',     label: "Today's Sessions",   icon: <Clock size={14} /> },
  { id: 'bookings',     label: 'Booking Requests',   icon: <Inbox size={14} /> },
  { id: 'patients',     label: 'Patient List',        icon: <Users size={14} /> },
  { id: 'availability', label: 'Availability',        icon: <Calendar size={14} /> },
  { id: 'notes',        label: 'Session Notes',       icon: <FileText size={14} /> },
  { id: 'earnings',     label: 'Earnings',            icon: <DollarSign size={14} /> },
  { id: 'profile',      label: 'Profile Editor',      icon: <User size={14} /> },
]

export default function ProDashboard() {
  const [tab, setTab] = useState<Tab>('sessions')

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Video size={20} className="text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">Professional Dashboard</h1>
        <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
          Professionals
        </span>
      </div>

      <div className="flex gap-1 bg-white/3 border border-white/10 rounded-2xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0
              ${tab === t.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'sessions'     && <TodaySessionsTab />}
      {tab === 'bookings'     && <BookingRequestsTab />}
      {tab === 'patients'     && <PatientListTab />}
      {tab === 'availability' && <AvailabilityTab />}
      {tab === 'notes'        && <SessionNotesTab />}
      {tab === 'earnings'     && <EarningsTab />}
      {tab === 'profile'      && <ProfileEditorTab />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────
function Spinner() {
  return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-400" size={26} /></div>
}
function Empty({ msg }: { msg: string }) {
  return <div className="text-center py-10 text-gray-500 text-sm">{msg}</div>
}

// ─────────────────────────────────────────────────────────────
// Today's Sessions
// ─────────────────────────────────────────────────────────────
function TodaySessionsTab() {
  const [sessions, setSessions] = useState<ProBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const navigate = useNavigate()

  useEffect(() => {
    proDashboardService.getTodaySessions().then(setSessions).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  function getCountdown(session: ProBooking): string {
    const [h, m] = session.scheduled_time.split(':').map(Number)
    const target = new Date()
    target.setHours(h, m, 0, 0)
    const diff = Math.floor((target.getTime() - now.getTime()) / 1000)
    if (diff <= 0) return 'In progress'
    const hh = Math.floor(diff / 3600)
    const mm = Math.floor((diff % 3600) / 60)
    const ss = diff % 60
    return hh > 0 ? `${hh}h ${mm}m` : `${mm}m ${String(ss).padStart(2, '0')}s`
  }

  async function startChat(patientId: string) {
    try {
      const conv = await chatService.createConversation([patientId])
      navigate(`/chat/${conv.id}`)
    } catch {
      toast.error('Could not start the chat. Please try again.')
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">{sessions.length} session{sessions.length !== 1 ? 's' : ''} today</p>
      {sessions.length === 0 && <Empty msg="No sessions scheduled for today" />}
      {sessions.map(s => {
        const countdown = getCountdown(s)
        const isNext = sessions[0]?.id === s.id && countdown !== 'In progress'
        return (
          <div key={s.id} className={`bg-white/3 border rounded-2xl p-4 space-y-3 transition-colors ${isNext ? 'border-indigo-500/30' : 'border-white/10'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                  {s.patient_avatar
                    ? <img src={s.patient_avatar} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">{s.patient_name[0]}</div>}
                </div>
                <div>
                  <p className="font-semibold text-white">{s.patient_name}</p>
                  <p className="text-xs text-gray-400">{s.scheduled_time} · {s.duration_minutes} min</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-mono font-bold ${countdown === 'In progress' ? 'text-green-400' : 'text-indigo-300'}`}>
                  {countdown}
                </span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] border ${
                  s.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : s.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>{s.status}</span>
              </div>
            </div>
            {s.description && <p className="text-sm text-gray-400 italic">"{s.description}"</p>}
            <div className="flex gap-2">
              <button onClick={() => startChat(s.patient_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-sm hover:bg-indigo-600/30 transition-colors">
                <MessageCircle size={13} /> Start session
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-gray-300 border border-white/10 text-sm hover:bg-white/10 transition-colors">
                <Play size={13} /> Join video call
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Booking Requests
// ─────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled / Declined' },
]

function BookingRequestsTab() {
  const [bookings, setBookings] = useState<ProBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [acting, setActing] = useState<string | null>(null)

  async function load(filter: string) {
    setLoading(true)
    try {
      const data = await proDashboardService.getIncomingBookings(filter || undefined)
      setBookings(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  async function handleApprove(id: string) {
    setActing(id)
    try {
      await proDashboardService.approveBooking(id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b))
    } finally {
      setActing(null)
    }
  }

  async function handleReject(id: string) {
    setActing(id)
    try {
      await proDashboardService.rejectBooking(id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <Spinner />}

      {!loading && bookings.length === 0 && (
        <Empty msg={statusFilter === 'pending' ? 'No pending booking requests' : 'No bookings found'} />
      )}

      {!loading && (
        <div className="space-y-3">
          {bookings.map(b => {
            const isPending = b.status === 'pending'
            const isActing = acting === b.id
            return (
              <div key={b.id} className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                      {b.patient_avatar
                        ? <img src={b.patient_avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-400">
                            {b.patient_name[0]}
                          </div>}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{b.patient_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(b.scheduled_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' · '}{b.scheduled_time.slice(0, 5)} · {b.duration_minutes} min
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] border whitespace-nowrap ${
                    b.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : b.status === 'pending'  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {b.status}
                  </span>
                </div>

                {b.description && (
                  <p className="text-sm text-gray-400 italic">"{b.description}"</p>
                )}

                {isPending && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(b.id)}
                      disabled={isActing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600/20 text-green-400 border border-green-500/20 text-sm hover:bg-green-600/30 disabled:opacity-50 transition-colors"
                    >
                      {isActing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(b.id)}
                      disabled={isActing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                    >
                      {isActing ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                      Decline
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Patient List
// ─────────────────────────────────────────────────────────────
function PatientListTab() {
  const [patients, setPatients] = useState<PatientEntry[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    proDashboardService.getPatients().then(setPatients).finally(() => setLoading(false))
  }, [])

  async function message(userId: string) {
    try {
      const conv = await chatService.createConversation([userId])
      navigate(`/chat/${conv.id}`)
    } catch {
      toast.error('Could not start the chat. Please try again.')
    }
  }

  const MOOD_COLORS = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-lime-400', 'bg-green-400']

  if (loading) return <Spinner />

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">{patients.length} patient{patients.length !== 1 ? 's' : ''}</p>
      {patients.length === 0 && <Empty msg="No patients yet" />}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-left">
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Last session</th>
              <th className="px-4 py-3 font-medium">Mood trend</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.user_id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden shrink-0">
                      {p.user_avatar
                        ? <img src={p.user_avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">{p.user_name[0]}</div>}
                    </div>
                    <span className="text-white font-medium">{p.user_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {p.last_session_date ? new Date(p.last_session_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {p.mood_trend.length === 0 && <span className="text-gray-600 text-xs">No data</span>}
                    {p.mood_trend.map((score, i) => (
                      <span key={i} title={`Mood: ${score}`}
                        className={`w-3 h-3 rounded-full ${MOOD_COLORS[score - 1] ?? 'bg-gray-600'}`} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => message(p.user_id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 transition-colors ml-auto">
                    <MessageCircle size={11} /> Message
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Availability Manager
// ─────────────────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`)

function AvailabilityTab() {
  const [slots, setSlots] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  function load() {
    setLoading(true)
    proDashboardService.getMyAvailability().then(setSlots).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  function findSlot(weekday: number, hour: string) {
    return slots.find(s => s.weekday === weekday && s.start_time.startsWith(hour.split(':')[0]))
  }

  async function toggleSlot(weekday: number, hour: string) {
    const key = `${weekday}-${hour}`
    setToggling(key)
    const existing = findSlot(weekday, hour)
    const endHour = String(parseInt(hour) + 1).padStart(2, '0') + ':00'
    try {
      if (existing) {
        if (existing.is_available) {
          await proDashboardService.blockSlot({ weekday, start_time: hour, end_time: endHour })
        } else {
          await proDashboardService.deleteSlot(existing.id)
        }
      } else {
        await proDashboardService.createSlot({ weekday, start_time: hour, end_time: endHour, is_available: true })
      }
      load()
    } catch {
      // slot update failed — reload to restore correct state
      load()
    } finally {
      setToggling(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Click a cell to toggle availability. Green = open, Red = blocked, Empty = not set.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="w-12 text-gray-500 font-normal pb-2"></th>
              {DAYS.map(d => (
                <th key={d} className="text-center text-gray-400 font-medium pb-2 px-1">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(hour => (
              <tr key={hour}>
                <td className="text-gray-600 pr-2 text-right py-0.5">{hour}</td>
                {DAYS.map((_, dayIdx) => {
                  const slot = findSlot(dayIdx, hour)
                  const key = `${dayIdx}-${hour}`
                  const isToggling = toggling === key
                  return (
                    <td key={dayIdx} className="p-0.5">
                      <button
                        onClick={() => toggleSlot(dayIdx, hour)}
                        disabled={isToggling}
                        className={`w-full h-7 rounded-md text-[10px] font-medium transition-all duration-150 cal-slot
                          ${!slot ? 'bg-white/3 border border-white/10 text-gray-700 hover:bg-indigo-500/20 hover:border-indigo-500/30 hover:text-indigo-400'
                            : slot.is_available ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25'
                          }`}
                      >
                        {isToggling ? <Loader2 size={10} className="animate-spin mx-auto" /> : slot ? (slot.is_available ? '✓' : '✕') : '+'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30 inline-block" /> Open</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/15 border border-red-500/20 inline-block" /> Blocked</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white/3 border border-white/10 inline-block" /> Not set</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Session Notes
// ─────────────────────────────────────────────────────────────
function SessionNotesTab() {
  const [patients, setPatients] = useState<PatientEntry[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [loading, setLoading] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    proDashboardService.getPatients().then(setPatients)
  }, [])

  useEffect(() => {
    if (!selectedPatient) { setNotes([]); return }
    setLoading(true)
    proDashboardService.getSessionNotes(selectedPatient).then(setNotes).finally(() => setLoading(false))
  }, [selectedPatient])

  async function addNote() {
    if (!newContent.trim() || !selectedPatient) return
    setSaving(true)
    const note = await proDashboardService.createNote({ patient: selectedPatient, content: newContent })
    setNotes(prev => [note, ...prev])
    setNewContent('')
    setSaving(false)
  }

  async function saveEdit(id: string) {
    const updated = await proDashboardService.updateNote(id, editContent)
    setNotes(prev => prev.map(n => n.id === id ? updated : n))
    setEditId(null)
  }

  async function deleteNote(id: string) {
    await proDashboardService.deleteNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
        <option value="">Select a patient…</option>
        {patients.map(p => <option key={p.user_id} value={p.user_id}>{p.user_name}</option>)}
      </select>

      {selectedPatient && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
              rows={3} placeholder="Add a private session note…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none" />
            <button onClick={addNote} disabled={saving || !newContent.trim()}
              className="self-end flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add
            </button>
          </div>
        </div>
      )}

      {loading && <Spinner />}

      <div className="space-y-2">
        {notes.map(n => (
          <div key={n.id} className="bg-white/3 border border-white/10 rounded-xl p-4">
            {editId === n.id ? (
              <div className="space-y-2">
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(n.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-green-500/20 text-green-400 hover:bg-green-500/10 transition-colors">
                    <Check size={11} /> Save
                  </button>
                  <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-white/10 text-gray-400 hover:text-white transition-colors">
                    <X size={11} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{n.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-600">{new Date(n.created_at).toLocaleString()}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(n.id); setEditContent(n.content) }}
                      className="text-gray-500 hover:text-indigo-400 transition-colors"><Edit2 size={12} /></button>
                    <button onClick={() => deleteNote(n.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {selectedPatient && !loading && notes.length === 0 && <Empty msg="No notes for this patient yet" />}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Earnings
// ─────────────────────────────────────────────────────────────
function EarningsTab() {
  const [data, setData] = useState<EarningsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    proDashboardService.getEarnings().then(setData).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data || !chartRef.current) return
    chartRef.current.classList.add('earnings-chart-animate')
  }, [data])

  async function requestPayout() {
    setRequesting(true)
    await proDashboardService.requestPayout()
    setData(prev => prev ? { ...prev, payout_requested: true } : prev)
    setRequesting(false)
  }

  if (loading) return <Spinner />
  if (!data) return <Empty msg="Could not load earnings" />

  const maxEarnings = Math.max(...data.monthly.map(m => m.earnings), 1)

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Sessions this month', value: data.sessions_this_month, color: 'text-indigo-400' },
          { label: 'Total earned', value: `£${data.total_earnings.toFixed(2)}`, color: 'text-green-400' },
          { label: 'Pending payout', value: `£${data.pending_payout.toFixed(2)}`, color: 'text-amber-400' },
        ].map(card => (
          <div key={card.label} className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-4">
        <p className="text-sm font-medium text-white mb-4">Last 6 months</p>
        <div ref={chartRef} className="flex items-end gap-2 h-32">
          {data.monthly.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <p className="text-[10px] text-gray-500">£{m.earnings.toFixed(0)}</p>
              <div className="w-full rounded-t-md bg-indigo-500/30 border border-indigo-500/20 earnings-bar"
                style={{ height: `${Math.round((m.earnings / maxEarnings) * 100)}%`, minHeight: '4px' }} />
              <p className="text-[10px] text-gray-500">{m.month}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={requestPayout} disabled={requesting || data.payout_requested}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600/20 text-green-400 border border-green-500/20 text-sm hover:bg-green-600/30 disabled:opacity-40 transition-colors">
          {requesting ? <Loader2 size={13} className="animate-spin" /> : <TrendingUp size={13} />}
          {data.payout_requested ? 'Payout requested' : 'Request payout'}
        </button>
        {data.payout_requested && (
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <AlertCircle size={11} /> Your payout request is being processed
          </p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Profile Editor
// ─────────────────────────────────────────────────────────────
function ProfileEditorTab() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    title: '', bio: '', credentials: '', years_of_experience: '', session_rate: '', gender: '', languages: '',
  })

  useEffect(() => {
    proDashboardService.getProfile().then(p => {
      setProfile(p)
      setForm({
        title: p.title ?? '',
        bio: p.bio ?? '',
        credentials: p.credentials ?? '',
        years_of_experience: String(p.years_of_experience ?? ''),
        session_rate: String(p.session_rate ?? ''),
        gender: p.gender ?? '',
        languages: Array.isArray(p.languages) ? (p.languages as string[]).join(', ') : '',
      })
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await proDashboardService.updateProfile({
        ...form,
        years_of_experience: parseInt(form.years_of_experience) || 0,
        session_rate: parseFloat(form.session_rate) || 0,
        languages: form.languages.split(',').map(l => l.trim()).filter(Boolean),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // error is visible in console; button re-enables so user can retry
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  const fields: { key: keyof typeof form; label: string; type?: string; rows?: number }[] = [
    { key: 'title', label: 'Professional title' },
    { key: 'bio', label: 'Bio', rows: 4 },
    { key: 'credentials', label: 'Credentials / Qualifications', rows: 3 },
    { key: 'years_of_experience', label: 'Years of experience', type: 'number' },
    { key: 'session_rate', label: 'Session rate (£)', type: 'number' },
    { key: 'languages', label: 'Languages (comma-separated)' },
  ]

  return (
    <div className="space-y-4 max-w-xl">
      {fields.map(f => (
        <div key={f.key}>
          <label className="text-xs text-gray-400 block mb-1">{f.label}</label>
          {f.rows ? (
            <textarea value={form[f.key]} rows={f.rows}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none" />
          ) : (
            <input type={f.type ?? 'text'} value={form[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50" />
          )}
        </div>
      ))}

      <div>
        <label className="text-xs text-gray-400 block mb-1">Gender</label>
        <select value={form.gender} onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
          <option value="">Prefer not to say</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="prefer_not">Prefer not to say</option>
        </select>
      </div>

      <div className="flex gap-3 items-center">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Update profile
        </button>
        {saved && <p className="text-xs text-green-400">✓ Profile updated</p>}
      </div>

      {profile && (
        <p className="text-xs text-gray-500 pt-2">
          To update your profile photo or intro video, please contact support or use the file upload feature (coming soon).
        </p>
      )}
    </div>
  )
}
