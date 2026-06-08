import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import {
  MessageSquare, Heart, Play, BookOpen, CalendarCheck, Users,
  Flame, RefreshCw, Activity, ChevronRight, Clock, ArrowRight, Sun,
  ShieldCheck, XCircle,
} from 'lucide-react'
import type { ProfessionalApplicationStatus } from '@/types'
import { authService } from '@/services/authService'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { format, subDays } from 'date-fns'
import api from '@/services/api'
import { journalService } from '@/services/journalService'
import { professionalService } from '@/services/professionalService'
import { communityService } from '@/services/communityService'
import { videoService } from '@/services/videoService'
import type { UserStreak, UserMood, Booking, Post, Video } from '@/types'
import toast from 'react-hot-toast'

// ─── Brand palette (from logo) ────────────────────────────────────────────────
const CYAN = '#00BFFF'
const PURPLE = '#7C5CBF'

// ─── Static content ────────────────────────────────────────────────────────────
const AFFIRMATIONS = [
  'You are worthy of love and healing.',
  'Each day is a new opportunity to grow.',
  'Your feelings are valid — you matter.',
  'Progress, not perfection.',
  'You have the strength to face today.',
  'Taking care of yourself is not selfish.',
  'Small steps forward are still steps forward.',
  'You are not alone in your journey.',
  'Healing takes time, and that\'s okay.',
  'You deserve peace and happiness.',
  'Be gentle with yourself today.',
  'Your mental health is a priority.',
  'One breath at a time.',
  'You\'ve made it through every hard day so far.',
]

const MOODS = [
  { score: 1, label: 'Very Bad', color: '#f43f5e' },
  { score: 2, label: 'Bad',      color: '#f97316' },
  { score: 3, label: 'Neutral',  color: '#94a3b8' },
  { score: 4, label: 'Good',     color: '#38bdf8' },
  { score: 5, label: 'Great',    color: CYAN       },
]

const QUICK_ACTIONS: { icon: React.ElementType; label: string; path: string; gradient: string }[] = [
  { icon: MessageSquare, label: 'Chat with Pro',  path: '/chat',          gradient: 'from-cyan-400 to-sky-500'      },
  { icon: Heart,         label: 'AI Companion',   path: '/ai-assistant',  gradient: 'from-violet-500 to-purple-500' },
  { icon: Play,          label: 'Watch Videos',   path: '/videos',        gradient: 'from-teal-500 to-emerald-500'  },
  { icon: BookOpen,      label: 'Write Journal',  path: '/journal',       gradient: 'from-indigo-500 to-blue-500'   },
  { icon: CalendarCheck, label: 'Book Session',   path: '/professionals', gradient: 'from-pink-500 to-rose-500'     },
  { icon: Users,         label: 'Community',      path: '/community',     gradient: 'from-sky-500 to-cyan-500'      },
]

// ─── SVG mood face (line-art, no emoji) ────────────────────────────────────────
const MOUTH: Record<number, string> = {
  1: 'M 12 27 Q 20 21 28 27',
  2: 'M 12 26 Q 20 23 28 26',
  3: 'M 12 25 L 28 25',
  4: 'M 12 24 Q 20 28 28 24',
  5: 'M 11 23 Q 20 30 29 23',
}

function MoodFace({ score, color, active }: { score: number; color: string; active: boolean }) {
  const fg = active ? '#fff' : color
  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10">
      <circle cx="20" cy="20" r="18" fill={active ? color : 'transparent'} stroke={color} strokeWidth="2" />
      <circle cx="14" cy="15" r="2.5" fill={fg} />
      <circle cx="26" cy="15" r="2.5" fill={fg} />
      {score === 1 && (
        <path d="M 14 19 Q 12 22 13.5 24" stroke={fg} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}
      <path d={MOUTH[score]} stroke={fg} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// ─── Skeleton loader ────────────────────────────────────────────────────────────
function Sk({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

// ─── Booking status pill ────────────────────────────────────────────────────────
function statusCls(s: Booking['status']) {
  const m: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    cancelled: 'bg-red-100 text-red-600',
    completed: 'bg-muted text-muted-foreground',
  }
  return m[s] ?? 'bg-muted text-muted-foreground'
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth)

  const [streak, setStreak]               = useState<UserStreak | null>(null)
  const [moods, setMoods]                 = useState<UserMood[]>([])
  const [journalCount, setJournalCount]   = useState(0)
  const [bookings, setBookings]           = useState<Booking[]>([])
  const [feedPosts, setFeedPosts]         = useState<Post[]>([])
  const [video, setVideo]                 = useState<Video | null>(null)
  const [loading, setLoading]             = useState(true)

  const [selectedMood, setSelectedMood]   = useState<number | null>(null)
  const [moodNote, setMoodNote]           = useState('')
  const [savingMood, setSavingMood]       = useState(false)
  const [checkedIn, setCheckedIn]         = useState(false)
  const [todayScore, setTodayScore]       = useState<number | null>(null)
  const [application, setApplication]    = useState<ProfessionalApplicationStatus | null>(null)

  const todayBase = Math.floor(Date.now() / 86_400_000)
  const [affIdx, setAffIdx]               = useState(todayBase % AFFIRMATIONS.length)

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // 7-day chart data
  const chartData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d    = subDays(new Date(), 6 - i)
    const key  = format(d, 'yyyy-MM-dd')
    const entry = moods.find(m => m.recorded_date === key)
    return { day: format(d, 'EEE'), score: entry ? entry.mood_score : null }
  }), [moods])

  // Upcoming bookings
  const upcoming = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return bookings
      .filter(b => (b.status === 'confirmed' || b.status === 'pending') && b.scheduled_date >= today)
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
      .slice(0, 3)
  }, [bookings])

  // Load all data
  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      const [streakRes, moodsRes, journalsRes, bookingsRes, feedRes, videosRes, appRes] = await Promise.all([
        api.get('/achievements/streak/').then(r => r.data).catch(() => null),
        api.get('/users/moods/').then(r => r.data?.results ?? r.data ?? []).catch(() => []),
        journalService.getEntries().catch(() => []),
        professionalService.getBookings().catch(() => []),
        communityService.getFeed().catch(() => []),
        videoService.getVideos().catch(() => []),
        authService.getMyApplication().catch(() => null),
      ])
      if (!alive) return

      if (streakRes) setStreak(streakRes)
      if (appRes && !user?.is_professional) setApplication(appRes as ProfessionalApplicationStatus)

      const moodList = moodsRes as UserMood[]
      setMoods(moodList)
      const todayKey   = format(new Date(), 'yyyy-MM-dd')
      const todayEntry = moodList.find(m => m.recorded_date === todayKey)
      if (todayEntry) { setCheckedIn(true); setTodayScore(todayEntry.mood_score) }

      setJournalCount((journalsRes as unknown[]).length)
      setBookings(bookingsRes as Booking[])
      setFeedPosts((feedRes as Post[]).slice(0, 3))
      setVideo((videosRes as Video[])[0] ?? null)
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  const logMood = async () => {
    if (!selectedMood) return
    setSavingMood(true)
    try {
      await api.post('/users/moods/', {
        mood_score:    selectedMood,
        note:          moodNote,
        recorded_date: format(new Date(), 'yyyy-MM-dd'),
      })
      setCheckedIn(true)
      setTodayScore(selectedMood)
      const todayKey = format(new Date(), 'yyyy-MM-dd')
      setMoods(prev => [
        ...prev.filter(m => m.recorded_date !== todayKey),
        { id: 'tmp', mood_score: selectedMood, note: moodNote, recorded_date: todayKey, created_at: new Date().toISOString() },
      ])
      toast.success('Mood logged!')
    } catch {
      toast.error('Could not save mood. Please try again.')
    } finally {
      setSavingMood(false)
    }
  }

  return (
    <div className="space-y-5 pb-8">

      {/* Professional application status banner */}
      {application?.exists && application.status === 'pending' && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
          <ShieldCheck className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-300">Professional Application Under Review</p>
            <p className="text-sm text-amber-200/80 mt-0.5">
              Your application is pending admin approval. You'll receive an email once it's reviewed.
              In the meantime, you have full access as a regular user.
            </p>
          </div>
        </div>
      )}

      {application?.exists && application.status === 'rejected' && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/25">
          <XCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-300">Professional Application Not Approved</p>
            {application.rejection_reason && (
              <p className="text-sm text-red-200/80 mt-0.5">Reason: {application.rejection_reason}</p>
            )}
            <p className="text-sm text-red-200/60 mt-1">
              Contact support if you believe this was an error.
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <div
        className="rounded-2xl p-6 md:p-8 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${CYAN} 0%, #5EAEE8 45%, ${PURPLE} 100%)` }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium opacity-75 tracking-wide uppercase">{format(new Date(), 'EEEE, MMMM d')}</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">
              {greeting}, {user?.first_name || 'there'} 👋
            </h1>
            <p className="mt-2 opacity-85 text-sm md:text-base max-w-sm">
              Your wellness journey continues — take a moment to check in.
            </p>
          </div>
          <img src="/logo.png" alt="" aria-hidden className="h-16 opacity-25 hidden md:block flex-shrink-0" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Streak',            icon: Flame,         iconCls: 'text-orange-500', bgCls: 'bg-orange-50 dark:bg-orange-950/30', value: loading ? null : `${streak?.current_streak ?? 0} days` },
          { label: 'Journal Entries',   icon: BookOpen,      iconCls: 'text-indigo-500', bgCls: 'bg-indigo-50 dark:bg-indigo-950/30',  value: loading ? null : journalCount },
          { label: 'Upcoming Sessions', icon: CalendarCheck, iconCls: 'text-primary',    bgCls: 'bg-primary/10',                        value: loading ? null : upcoming.length },
        ].map(({ label, icon: Icon, iconCls, bgCls, value }) => (
          <div key={label} className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`${bgCls} p-2.5 rounded-lg flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${iconCls}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                {value === null ? <Sk className="h-6 w-10 mt-1" /> : <p className="text-xl font-bold">{value}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mood check-in + Streak */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        {/* Mood check-in */}
        <div className="md:col-span-3 bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-1">Daily Mood Check-in</h2>
          {checkedIn ? (
            <div className="flex items-center gap-4 mt-3">
              {todayScore && (
                <MoodFace score={todayScore} color={MOODS[todayScore - 1].color} active />
              )}
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">✓ Checked in today</p>
                <p className="text-xs text-muted-foreground">Feeling: {todayScore ? MOODS[todayScore - 1].label : '—'}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">How are you feeling right now?</p>
              <div className="flex gap-4 justify-center mb-4">
                {MOODS.map(({ score, label, color }) => (
                  <button
                    key={score}
                    title={label}
                    onClick={() => setSelectedMood(prev => prev === score ? null : score)}
                    className={`flex flex-col items-center gap-1.5 transition-transform hover:scale-110 ${selectedMood === score ? 'scale-110' : ''}`}
                  >
                    <MoodFace score={score} color={color} active={selectedMood === score} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </button>
                ))}
              </div>
              {selectedMood && (
                <div className="space-y-3 animate-slide-down">
                  <textarea
                    value={moodNote}
                    onChange={e => setMoodNote(e.target.value)}
                    placeholder="Add a note (optional)…"
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={logMood}
                    disabled={savingMood}
                    className="w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})` }}
                  >
                    {savingMood ? 'Saving…' : 'Log Mood'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Streak visual */}
        <div className="md:col-span-2 bg-card border rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Streak</h2>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-2">
            <div className="flex items-center gap-2">
              <Flame className="h-9 w-9 text-orange-500" />
              <span className="text-5xl font-bold">{streak?.current_streak ?? 0}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">day streak</p>
            <p className="text-xs text-muted-foreground mt-3">Best: {streak?.longest_streak ?? 0} days</p>
          </div>
          <div className="flex gap-2 mt-3">
            {[7, 30, 100].map(ms => {
              const hit = (streak?.current_streak ?? 0) >= ms
              return (
                <div key={ms} className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold border ${
                  hit ? 'border-orange-400 bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
                      : 'border-border text-muted-foreground'
                }`}>
                  🔥 {ms}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 7-day mood chart */}
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">7-Day Mood History</h2>
          <Link to="/journal" className="text-xs text-primary hover:underline flex items-center gap-1">
            Journal <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {!loading && moods.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <Activity className="h-8 w-8 opacity-25" />
            <p>Check in daily to build your mood chart.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CYAN} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={CYAN} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const labels = ['', 'Very Bad', 'Bad', 'Neutral', 'Good', 'Great']
                  const val = Number(payload[0]?.value)
                  return (
                    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-md">
                      <p className="font-semibold">{label}</p>
                      <p style={{ color: CYAN }}>{labels[val] ?? '—'}</p>
                    </div>
                  )
                }}
              />
              <Area type="monotone" dataKey="score" stroke={CYAN} strokeWidth={2.5}
                fill="url(#mg)" dot={{ r: 4, fill: CYAN, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: CYAN }} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ icon: Icon, label, path, gradient }) => (
            <Link key={path} to={path}
              className="bg-card border rounded-xl p-3 text-center hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className={`bg-gradient-to-br ${gradient} w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-sm`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-medium leading-tight">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming sessions + Community feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Sessions */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Sessions</h2>
            <Link to="/professionals" className="text-xs text-primary hover:underline flex items-center gap-1">
              Book <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3"><Sk className="h-14 w-full" /><Sk className="h-14 w-full" /></div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm space-y-2">
              <CalendarCheck className="h-8 w-8 mx-auto opacity-25" />
              <p>No upcoming sessions.</p>
              <Link to="/professionals" className="text-primary hover:underline text-xs inline-block">Find a professional →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.professional_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {format(new Date(b.scheduled_date), 'MMM d')} · {b.scheduled_time?.slice(0, 5)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusCls(b.status)}`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community feed */}
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Community Feed</h2>
            <Link to="/community" className="text-xs text-primary hover:underline flex items-center gap-1">
              See all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3"><Sk className="h-14 w-full" /><Sk className="h-14 w-full" /></div>
          ) : feedPosts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm space-y-2">
              <Users className="h-8 w-8 mx-auto opacity-25" />
              <p>Join a group to see posts here.</p>
              <Link to="/community" className="text-primary hover:underline text-xs inline-block">Explore community →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {feedPosts.map(post => (
                <div key={post.id} className="p-3 bg-muted/40 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Users className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-xs font-medium">{post.is_anonymous ? 'Anonymous' : post.author_name}</span>
                    <span className="text-xs text-muted-foreground ml-auto truncate max-w-[80px]">{post.group_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Affirmation + Video recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        {/* Affirmation */}
        <div
          className="md:col-span-2 rounded-xl p-5 text-white relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${PURPLE} 0%, #5EAEE8 100%)` }}
        >
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full border-[18px] border-white/10 pointer-events-none" />
          <Sun className="h-5 w-5 mb-3 opacity-80" />
          <p className="text-sm font-medium leading-relaxed relative z-10">
            "{AFFIRMATIONS[affIdx]}"
          </p>
          <button
            onClick={() => setAffIdx(i => (i + 1) % AFFIRMATIONS.length)}
            className="mt-4 flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> New affirmation
          </button>
        </div>

        {/* Video recommendation */}
        <div className="md:col-span-3 bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recommended for You</h2>
            <Link to="/videos" className="text-xs text-primary hover:underline flex items-center gap-1">
              See all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="flex gap-3">
              <Sk className="h-20 w-32 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1"><Sk className="h-4 w-3/4" /><Sk className="h-3 w-1/2" /></div>
            </div>
          ) : video ? (
            <div className="flex gap-4 items-center">
              <div className="relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-muted">
                {video.thumbnail
                  ? <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Play className="h-8 w-8 text-muted-foreground" /></div>
                }
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="h-4 w-4 text-white ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold line-clamp-2">{video.title}</p>
                {video.mood_tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {video.mood_tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
                <Link to={`/videos`} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Watch now <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm space-y-2">
              <Play className="h-8 w-8 mx-auto opacity-25" />
              <p>No videos available yet.</p>
              <Link to="/videos" className="text-primary hover:underline text-xs inline-block">Browse videos →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
