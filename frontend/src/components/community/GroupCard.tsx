import { useState } from 'react'
import React from 'react'
import { useSelector } from 'react-redux'
import { Users, LogIn, LogOut, Lock, Globe, Clock, CheckCircle, XCircle, Share } from 'lucide-react'
import type { CommunityGroup } from '@/types'
import type { RootState } from '@/store'
import { communityService } from '@/services/communityService'

interface Props {
  group: CommunityGroup
  onUpdate: (updated: CommunityGroup) => void
}

const GROUP_COLORS: Record<string, string> = {
  anxiety: 'from-purple-500 to-indigo-600',
  grief: 'from-slate-500 to-gray-700',
  depression: 'from-blue-500 to-cyan-600',
  ptsd: 'from-red-500 to-orange-600',
  self_growth: 'from-green-500 to-emerald-600',
  stress: 'from-yellow-500 to-amber-600',
  relationships: 'from-pink-500 to-rose-600',
  addiction: 'from-violet-500 to-purple-700',
}

export default function GroupCard({ group, onUpdate }: Props) {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id)
  const isMyGroup = group.is_user_created && group.created_by === currentUserId

  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)

  const gradient = GROUP_COLORS[group.group_type || ''] || 'from-teal-500 to-cyan-600'

  async function handleToggleMembership() {
    setLoading(true)
    try {
      if (group.is_member) {
        await communityService.leaveGroup(group.slug)
        onUpdate({ ...group, is_member: false, member_count: group.member_count - 1 })
      } else {
        await communityService.joinGroup(group.slug)
        onUpdate({ ...group, is_member: true, member_count: group.member_count + 1 })
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 1200)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateInvite() {
    setLoading(true)
    try {
      const invite = await communityService.generateInvite(group.slug)
      setInviteUrl(invite.invite_url)
      setShowInviteModal(true)
    } finally {
      setLoading(false)
    }
  }

  function getApprovalStatus() {
    if (!group.is_user_created) return null
    
    switch (group.approval_status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-400', text: 'Pending Approval' }
      case 'approved':
        return { icon: CheckCircle, color: 'text-green-400', text: 'Approved' }
      case 'rejected':
        return { icon: XCircle, color: 'text-red-400', text: 'Rejected' }
      default:
        return null
    }
  }

  return (
    <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-200 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5">
      {/* Gradient header */}
      <div className={`h-16 bg-gradient-to-r ${gradient} opacity-80`} />

      <div className="p-4 -mt-6">
        {/* Icon badge */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl shadow-lg mb-3`}>
          {group.name.charAt(0)}
        </div>

        <h3 className="font-semibold text-white text-base leading-tight">{group.name}</h3>
        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{group.description}</p>

        {/* Group metadata */}
        <div className="flex items-center gap-2 mt-2">
          {group.visibility === 'private' && (
            <span className="flex items-center gap-1 text-gray-400 text-xs">
              <Lock size={10} />
              Private
            </span>
          )}
          {group.visibility === 'public' && (
            <span className="flex items-center gap-1 text-gray-400 text-xs">
              <Globe size={10} />
              Public
            </span>
          )}
          {isMyGroup && (
            <span className="flex items-center gap-1 text-gray-400 text-xs">
              Created by you
            </span>
          )}
        </div>

        {/* Approval status */}
        {isMyGroup && (() => {
          const status = getApprovalStatus()
          return status ? (
            <div className={`flex items-center gap-1 mt-2 text-xs ${status.color}`}>
              {React.createElement(status.icon, { size: 12 })}
              {status.text}
            </div>
          ) : null
        })()}

        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1 text-gray-400 text-xs">
            <Users size={12} />
            {group.member_count.toLocaleString()} members
          </span>

          <div className="flex items-center gap-1">
            {/* Invite button for private groups */}
            {group.visibility === 'private' && group.is_member && (
              <button
                onClick={handleGenerateInvite}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs bg-white/10 text-gray-300 hover:bg-white/20 disabled:opacity-50"
                title="Generate invite link"
              >
                <Share size={12} />
              </button>
            )}

            <button
              onClick={handleToggleMembership}
              disabled={loading || !group.is_approved}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                !group.is_approved
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : group.is_member
                  ? 'bg-white/10 text-gray-300 hover:bg-red-500/20 hover:text-red-400'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              } disabled:opacity-50`}
            >
              {group.is_member ? <><LogOut size={12} /> Leave</> : <><LogIn size={12} /> Join</>}
            </button>
          </div>
        </div>
      </div>

      {/* Confetti burst */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti-burst"
              style={{
                backgroundColor: ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6'][i % 5],
                '--angle': `${i * 30}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-slide-up">
            <h3 className="font-semibold text-white mb-3">Invite Link Generated</h3>
            <p className="text-gray-400 text-sm mb-4">Share this link with people you want to invite to the group:</p>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 border border-white/10">
              <span className="flex-1 truncate">{inviteUrl}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(inviteUrl); }} 
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <button 
              onClick={() => setShowInviteModal(false)} 
              className="mt-3 w-full py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
