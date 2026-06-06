import React, { useState } from 'react'
import { Camera, Edit2, Calendar, Flame } from 'lucide-react'
import type { User, UserStreak } from '@/types'

interface ProfileHeaderProps {
  user: User
  streak: UserStreak
  isEditing: boolean
  onEditToggle: () => void
  onAvatarChange: (file: File) => void
}

export default function ProfileHeader({ user, streak, isEditing, onEditToggle, onAvatarChange }: ProfileHeaderProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarPreview(URL.createObjectURL(file))
      onAvatarChange(file)
    }
  }

  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user.username

  const _d = new Date(user.created_at)
  const joinedDate = user.created_at && !isNaN(_d.getTime())
    ? _d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown'

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            
            {isEditing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* User Info */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{displayName}</h1>
            <p className="text-gray-400 mb-2">@{user.username}</p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {joinedDate}</span>
              </div>
              {user.is_professional && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                  Professional
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={onEditToggle}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          {isEditing ? (
            <>
              <span>Save</span>
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </>
          )}
        </button>
      </div>

      {/* Bio */}
      <div className="mb-6">
        {isEditing ? (
          <textarea
            defaultValue={user.bio || ''}
            placeholder="Tell us about yourself..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
          />
        ) : (
          <p className="text-gray-300 leading-relaxed">
            {user.bio || 'No bio yet. Click Edit Profile to add one!'}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <div>
            <p className="text-2xl font-bold text-white">{streak.current_streak}</p>
            <p className="text-xs text-gray-400">Day Streak</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full"></div>
          <div>
            <p className="text-2xl font-bold text-white">{streak.longest_streak}</p>
            <p className="text-xs text-gray-400">Longest Streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}
