import { useEffect, useState } from 'react'
import {
  Users, ShieldCheck, Video, Mail, Flag, LayoutDashboard,
  Search, Check, X, Loader2, Download, Send, Eye, Trash2,
  AlertTriangle, UserX, UserCheck, Plus, Star, UsersRound,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '@/services/adminService'
import api from '@/services/api'
import type { AdminStats, AdminUser, PendingProfessional, ModerationReport, PendingGroup, Video as VideoType } from '@/types'
import StatCard from '@/components/admin/StatCard'

type Tab = 'overview' | 'users' | 'professionals' | 'groups' | 'moderation' | 'videos' | 'email'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',      label: 'Overview',      icon: <LayoutDashboard size={15} /> },
  { id: 'users',         label: 'Users',          icon: <Users size={15} /> },
  { id: 'professionals', label: 'Professionals',  icon: <ShieldCheck size={15} /> },
  { id: 'groups',        label: 'Groups',         icon: <UsersRound size={15} /> },
  { id: 'moderation',    label: 'Moderation',     icon: <Flag size={15} /> },
  { id: 'videos',        label: 'Videos',         icon: <Video size={15} /> },
  { id: 'email',         label: 'Email Campaigns',icon: <Mail size={15} /> },
]

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-rose-400" />
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-xs font-semibold border border-rose-500/20">
          Admin only
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white/3 border border-white/10 rounded-2xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0
              ${tab === t.id
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'      && <OverviewTab setTab={setTab} />}
      {tab === 'users'         && <UsersTab />}
      {tab === 'professionals' && <ProfessionalsTab />}
      {tab === 'groups'        && <GroupsTab />}
      {tab === 'moderation'    && <ModerationTab />}
      {tab === 'videos'        && <VideosTab />}
      {tab === 'email'         && <EmailTab />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────────────────────
function OverviewTab({ setTab }: { setTab: (t: Tab) => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getStats().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Users"           value={stats?.total_users ?? 0}           icon={Users}         accent="text-blue-400"   onClick={() => setTab('users')} />
        <StatCard label="New Today"             value={stats?.new_users_today ?? 0}       icon={UserCheck}     accent="text-green-400" />
        <StatCard label="Professionals"         value={stats?.total_professionals ?? 0}   icon={ShieldCheck}   accent="text-indigo-400" onClick={() => setTab('professionals')} />
        <StatCard label="Pending Approvals"     value={stats?.pending_professionals ?? 0} icon={AlertTriangle} accent="text-amber-400"  onClick={() => setTab('professionals')} />
        <StatCard label="Active Sessions Today" value={stats?.active_sessions_today ?? 0} icon={Star}          accent="text-teal-400" />
        <StatCard label="Total Messages"        value={stats?.total_messages ?? 0}        icon={Mail}          accent="text-purple-400" />
        <StatCard label="Unresolved Reports"    value={stats?.unresolved_reports ?? 0}    icon={Flag}          accent="text-rose-400"   onClick={() => setTab('moderation')} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Users Tab
// ─────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  function load() {
    setLoading(true)
    adminService.getUsers({ search: search || undefined, role: role || undefined })
      .then(setUsers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, role])

  async function toggleBan(u: AdminUser) {
    setActing(u.id)
    try {
      if (u.is_active) {
        await adminService.banUser(u.id)
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: false } : x))
      } else {
        await adminService.activateUser(u.id)
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: true } : x))
      }
    } finally { setActing(null) }
  }

  const ROLE_BADGE: Record<string, string> = {
    admin: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    professional: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    user: 'bg-white/5 text-gray-400 border-white/10',
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="professional">Professional</option>
          <option value="user">User</option>
        </select>
        <button
          onClick={() => adminService.exportUsersCSV()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {loading ? <Spinner /> : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/10 overflow-hidden shrink-0">
                        {u.avatar
                          ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">{u.username[0]?.toUpperCase()}</div>
                        }
                      </div>
                      <div>
                        <p className="text-white font-medium leading-none">{u.full_name || u.username}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${ROLE_BADGE[u.role] ?? ROLE_BADGE.user}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${u.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {u.is_active ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleBan(u)}
                      disabled={acting === u.id || u.is_staff}
                      title={u.is_staff ? 'Cannot ban admin' : u.is_active ? 'Ban user' : 'Activate user'}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-colors disabled:opacity-40
                        ${u.is_active
                          ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                          : 'border-green-500/20 text-green-400 hover:bg-green-500/10'
                        }`}
                    >
                      {acting === u.id ? <Loader2 size={12} className="animate-spin inline" /> : u.is_active ? 'Ban' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <EmptyState message="No users found" />}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Professionals Tab
// ─────────────────────────────────────────────────────────────
function ProfessionalsTab() {
  const [list, setList] = useState<PendingProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    adminService.getPendingProfessionals().then(setList).finally(() => setLoading(false))
  }, [])

  async function approve(id: string) {
    setActing(id)
    try {
      await adminService.approveProfessional(id)
      setList(prev => prev.filter(p => p.id !== id))
      toast.success('Application approved — professional access granted.')
    } catch {
      toast.error('Failed to approve application. Please try again.')
    } finally {
      setActing(null)
    }
  }

  async function reject(id: string) {
    if (!rejectReason.trim()) return
    setActing(id)
    try {
      await adminService.rejectProfessional(id, rejectReason)
      setList(prev => prev.filter(p => p.id !== id))
      setRejectId(null)
      setRejectReason('')
      toast.success('Application rejected.')
    } catch {
      toast.error('Failed to reject application. Please try again.')
    } finally {
      setActing(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">{list.length} pending application{list.length !== 1 ? 's' : ''}</p>
      {list.length === 0 && <EmptyState message="No pending applications" />}
      <div className="space-y-3">
        {list.map(p => (
          <div key={p.id} className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{p.user_name}</p>
                <p className="text-sm text-gray-400 truncate">{p.user_email}</p>
                <p className="text-xs text-gray-500 mt-0.5">Applied {new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              {p.years_of_experience > 0 && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{p.years_of_experience}y experience</p>
                </div>
              )}
            </div>
            {p.bio && <p className="text-sm text-gray-300 line-clamp-2">{p.bio}</p>}
            {p.license_number && (
              <p className="text-xs text-gray-400">License: <span className="text-gray-200">{p.license_number}</span></p>
            )}
            {p.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {p.specializations.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20">{s}</span>
                ))}
              </div>
            )}
            {p.credential_url && (
              <a href={p.credential_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                <Eye size={12} /> View credentials
              </a>
            )}

            {rejectId === p.id ? (
              <div className="flex gap-2 items-start">
                <input
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Rejection reason…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
                />
                <button onClick={() => reject(p.id)} disabled={acting === p.id || !rejectReason.trim()}
                  className="px-3 py-2 rounded-xl bg-rose-600/80 text-white text-sm hover:bg-rose-600 disabled:opacity-40 transition-colors">
                  {acting === p.id ? <Loader2 size={14} className="animate-spin" /> : 'Send'}
                </button>
                <button onClick={() => { setRejectId(null); setRejectReason('') }}
                  className="px-3 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => approve(p.id)} disabled={acting === p.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600/20 text-green-400 border border-green-500/20 text-sm hover:bg-green-600/30 disabled:opacity-40 transition-colors">
                  {acting === p.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                </button>
                <button onClick={() => setRejectId(p.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/10 text-rose-400 border border-rose-500/20 text-sm hover:bg-rose-600/20 transition-colors">
                  <X size={13} /> Reject with reason
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Groups Tab
// ─────────────────────────────────────────────────────────────
function GroupsTab() {
  const [groups, setGroups] = useState<PendingGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    adminService.getPendingGroups().then(setGroups).finally(() => setLoading(false))
  }, [])

  async function approve(id: string) {
    setActing(id)
    try {
      await adminService.approveGroup(id)
      setGroups(prev => prev.filter(g => g.id !== id))
      toast.success('Group approved and is now live.')
    } catch {
      toast.error('Failed to approve group.')
    } finally {
      setActing(null)
    }
  }

  async function reject(id: string) {
    if (!rejectReason.trim()) return
    setActing(id)
    try {
      await adminService.rejectGroup(id, rejectReason)
      setGroups(prev => prev.filter(g => g.id !== id))
      setRejectId(null)
      setRejectReason('')
      toast.success('Group rejected.')
    } catch {
      toast.error('Failed to reject group.')
    } finally {
      setActing(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">
        {groups.length} group{groups.length !== 1 ? 's' : ''} awaiting review
        <span className="ml-2 text-gray-600 text-xs">(AI score 50–79 — requires admin decision)</span>
      </p>
      {groups.length === 0 && <EmptyState message="No groups pending review" />}
      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-semibold text-white truncate">{g.name}</p>
                  {g.group_type && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20">
                      {g.group_type}
                    </span>
                  )}
                  {g.custom_type && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20">
                      {g.custom_type}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-0.5 truncate">by {g.created_by_username} · {g.created_by_email}</p>
                <p className="text-xs text-gray-600 mt-0.5">{new Date(g.created_at).toLocaleDateString()}</p>
              </div>
              {/* AI Score badge */}
              {g.ai_total_score !== null && (
                <div className={`shrink-0 text-center px-3 py-1.5 rounded-xl border ${
                  g.ai_total_score >= 70
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                }`}>
                  <p className="text-lg font-bold leading-none">{g.ai_total_score}</p>
                  <p className="text-[10px] mt-0.5">AI score</p>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-300 line-clamp-2">{g.description}</p>

            {/* Creation reason */}
            {g.creation_reason && (
              <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-gray-500 mb-1">Why they want this group</p>
                <p className="text-sm text-gray-300">{g.creation_reason}</p>
              </div>
            )}

            {/* AI review summary */}
            {g.ai_review_summary && (
              <details className="text-xs">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">
                  AI review details
                </summary>
                <pre className="mt-2 text-gray-400 whitespace-pre-wrap font-sans leading-relaxed bg-white/3 rounded-lg p-3 border border-white/5">
                  {g.ai_review_summary}
                </pre>
              </details>
            )}

            {/* Per-model scores */}
            {g.ai_review_scores?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {g.ai_review_scores.map(s => (
                  <span key={s.model} className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-400 text-xs border border-white/10">
                    {s.model}: {s.score}/100
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            {rejectId === g.id ? (
              <div className="flex gap-2 items-start">
                <input
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Rejection reason…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
                />
                <button onClick={() => reject(g.id)} disabled={acting === g.id || !rejectReason.trim()}
                  className="px-3 py-2 rounded-xl bg-rose-600/80 text-white text-sm hover:bg-rose-600 disabled:opacity-40 transition-colors">
                  {acting === g.id ? <Loader2 size={14} className="animate-spin" /> : 'Send'}
                </button>
                <button onClick={() => { setRejectId(null); setRejectReason('') }}
                  className="px-3 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => approve(g.id)} disabled={acting === g.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600/20 text-green-400 border border-green-500/20 text-sm hover:bg-green-600/30 disabled:opacity-40 transition-colors">
                  {acting === g.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                </button>
                <button onClick={() => setRejectId(g.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/10 text-rose-400 border border-rose-500/20 text-sm hover:bg-rose-600/20 transition-colors">
                  <X size={13} /> Reject with reason
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Moderation Tab
// ─────────────────────────────────────────────────────────────
function ModerationTab() {
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    adminService.getReports().then(setReports).finally(() => setLoading(false))
  }, [])

  async function act(id: string, fn: () => Promise<void>) {
    setActing(id)
    try {
      await fn()
      setReports(prev => prev.filter(r => r.id !== id))
    } catch {
      toast.error('Action failed. Please try again.')
    } finally {
      setActing(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">{reports.length} unresolved report{reports.length !== 1 ? 's' : ''}</p>
      {reports.length === 0 && <EmptyState message="No unresolved reports" />}
      <div className="space-y-3">
        {reports.map(r => (
          <div key={r.id} className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-xs border border-rose-500/20 uppercase tracking-wide">{r.reason.replace('_', ' ')}</span>
                <p className="text-xs text-gray-500 mt-1">Reported by <span className="text-gray-300">{r.reporter_name}</span></p>
              </div>
              <p className="text-xs text-gray-600 shrink-0">{new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            {(r.post_content || r.comment_content) && (
              <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-gray-500 mb-1">
                  {r.post_content ? 'Post' : 'Comment'} by <span className="text-gray-300">{r.content_author}</span>
                </p>
                <p className="text-sm text-gray-300 line-clamp-3">{r.post_content ?? r.comment_content}</p>
              </div>
            )}
            {r.details && <p className="text-xs text-gray-400 italic">"{r.details}"</p>}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => act(r.id, () => adminService.dismissReport(r.id))} disabled={acting === r.id}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-colors">
                <Check size={11} /> Dismiss
              </button>
              <button onClick={() => act(r.id, () => adminService.deleteReportContent(r.id))} disabled={acting === r.id}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 transition-colors">
                <Trash2 size={11} /> Delete post
              </button>
              <button onClick={() => act(r.id, () => adminService.warnUser(r.id))} disabled={acting === r.id}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 transition-colors">
                <AlertTriangle size={11} /> Warn user
              </button>
              <button onClick={() => act(r.id, () => adminService.banReportedUser(r.id))} disabled={acting === r.id}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors">
                <UserX size={11} /> Ban user
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Videos Tab
// ─────────────────────────────────────────────────────────────
function VideosTab() {
  const [videos, setVideos] = useState<VideoType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', youtube_id: '', mood_tags: '', is_featured: false })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api.get('/videos/').then(r => {
      setVideos(r.data.results || r.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    setSaving(true)
    await adminService.createVideo({
      ...form,
      mood_tags: form.mood_tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setShowForm(false)
    setForm({ title: '', description: '', youtube_id: '', mood_tags: '', is_featured: false })
    load()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await adminService.deleteVideo(id)
    setVideos(prev => prev.filter(v => v.id !== id))
    setDeletingId(null)
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400">{videos.length} curated video{videos.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-sm hover:bg-indigo-600/30 transition-colors">
          <Plus size={14} /> Add video
        </button>
      </div>

      {showForm && (
        <div className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Add Curated Video</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Title" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50" />
            <input value={form.youtube_id} onChange={e => setForm(f => ({ ...f, youtube_id: e.target.value }))}
              placeholder="YouTube ID (e.g. dQw4w9WgXcQ)" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50" />
            <input value={form.mood_tags} onChange={e => setForm(f => ({ ...f, mood_tags: e.target.value }))}
              placeholder="Mood tags (comma-separated)" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50" />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description" rows={2} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
              className="w-4 h-4 rounded accent-indigo-500" />
            Mark as featured
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.title || !form.youtube_id}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-3 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos.map(v => (
          <div key={v.id} className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden group">
            <div className="aspect-video bg-black/30 relative">
              {v.thumbnail
                ? <img src={String(v.thumbnail)} alt={v.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Video size={24} className="text-gray-600" /></div>
              }
              {v.is_featured && (
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-500/80 text-black text-[10px] font-bold">FEATURED</span>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-white line-clamp-1">{v.title}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(Array.isArray(v.mood_tags) ? v.mood_tags : []).slice(0, 3).map((tag: string) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300">{tag}</span>
                ))}
              </div>
              <button onClick={() => handleDelete(v.id)} disabled={deletingId === v.id}
                className="mt-2 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors">
                {deletingId === v.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />} Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      {videos.length === 0 && <EmptyState message="No curated videos yet" />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Email Campaign Tab
// ─────────────────────────────────────────────────────────────
function EmailTab() {
  const [form, setForm] = useState({ subject: '', message: '', segment: 'all' })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ status: string; sent_to: number } | null>(null)

  async function handleSend() {
    if (!form.subject || !form.message) return
    setSending(true)
    setResult(null)
    const res = await adminService.sendEmailCampaign(form)
    setResult(res)
    setSending(false)
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-gray-400">Compose and send a one-off broadcast email to a user segment.</p>

      <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Recipient segment</label>
          <select value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
            <option value="all">All active users</option>
            <option value="professionals">Professionals only</option>
            <option value="mood:1">Users with mood score 1 (Very Bad)</option>
            <option value="mood:2">Users with mood score 2 (Bad)</option>
            <option value="mood:3">Users with mood score 3 (Neutral)</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Subject</label>
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Email subject…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50" />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Message</label>
          <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={7} placeholder="Write your message here…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none" />
        </div>

        {/* Preview */}
        {(form.subject || form.message) && (
          <div className="bg-black/20 border border-white/5 rounded-xl p-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Preview</p>
            <p className="text-sm font-semibold text-white">{form.subject || '(no subject)'}</p>
            <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{form.message}</p>
          </div>
        )}

        {result && (
          <div className={`px-3 py-2 rounded-xl text-sm border ${result.status === 'sent' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
            {result.status === 'sent' ? `✓ Sent to ${result.sent_to} recipient${result.sent_to !== 1 ? 's' : ''}` : 'No recipients found for this segment.'}
          </div>
        )}

        <button onClick={handleSend} disabled={sending || !form.subject || !form.message}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send broadcast email
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="animate-spin text-indigo-400" size={26} />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10 text-gray-500 text-sm">{message}</div>
  )
}
