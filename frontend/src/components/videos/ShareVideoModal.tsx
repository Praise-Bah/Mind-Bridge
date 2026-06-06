import { useState } from 'react'
import { X, Copy, Check, Users } from 'lucide-react'
import type { Video } from '@/types'
import { communityService } from '@/services/communityService'
import type { CommunityGroup } from '@/types'

interface ShareVideoModalProps {
  video: Video
  onClose: () => void
}

export default function ShareVideoModal({ video, onClose }: ShareVideoModalProps) {
  const [copied, setCopied] = useState(false)
  const [groups, setGroups] = useState<CommunityGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)
  const [showGroups, setShowGroups] = useState(false)

  const videoUrl = `${window.location.origin}/videos?v=${video.id}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('Copy this link:', videoUrl)
    }
  }

  const handleShowGroups = async () => {
    setShowGroups(true)
    if (groups.length === 0) {
      setLoadingGroups(true)
      try {
        const data = await communityService.getGroups()
        setGroups(data)
      } catch {}
      setLoadingGroups(false)
    }
  }

  const handleShareToGroup = async () => {
    if (!selectedGroup) return
    setSharing(true)
    try {
      const group = groups.find((g) => g.id === selectedGroup)
      if (group) {
        const fd = new FormData()
        fd.append('content', `📹 Check out this video: **${video.title}**\n\n${videoUrl}`)
        await communityService.createPost(group.slug, fd)
        setShared(true)
        setTimeout(onClose, 1500)
      }
    } catch {}
    setSharing(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">Share Video</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Video title preview */}
          <p className="text-sm text-muted-foreground line-clamp-2">{video.title}</p>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:border-[#00BFFF] hover:bg-[#00BFFF]/5 transition-all text-sm font-medium"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Link copied!' : 'Copy link'}
          </button>

          {/* Share to community */}
          {!showGroups ? (
            <button
              onClick={handleShowGroups}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Users className="w-4 h-4" />
              Post to Community
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Select a group:</p>
              {loadingGroups ? (
                <p className="text-sm text-center text-muted-foreground py-2">Loading groups…</p>
              ) : groups.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-2">No groups available</p>
              ) : (
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-[#00BFFF]"
                >
                  <option value="">Choose a group…</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              )}
              {selectedGroup && (
                <button
                  onClick={handleShareToGroup}
                  disabled={sharing || shared}
                  className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {shared ? '✓ Shared!' : sharing ? 'Sharing…' : 'Share to Group'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
