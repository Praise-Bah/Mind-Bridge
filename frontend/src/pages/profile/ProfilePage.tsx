import { useState, useEffect } from 'react'
import { User, BookOpen, Calendar, Target, Bookmark, Settings } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

import ProfileHeader from '@/components/profile/ProfileHeader'
import MoodHeatmap from '@/components/profile/MoodHeatmap'
import AchievementsWall from '@/components/profile/AchievementsWall'
import SessionHistoryList from '@/components/profile/SessionHistoryList'
import SavedContentTabs from '@/components/profile/SavedContentTabs'
import GoalsTracker from '@/components/profile/GoalsTracker'

import { profileService } from '@/services/profileService'
import { authService } from '@/services/authService'

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [activeTab, setActiveTab] = useState<'account' | 'mood' | 'achievements' | 'sessions' | 'saved' | 'goals'>('account')
  const [profileData, setProfileData] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    setLoading(true)
    console.log('Loading profile data...')
    
    try {
      // Load profile overview data
      const data = await profileService.getProfileOverview()
      console.log('Profile data:', data)
      setProfileData(data)
    } catch (error) {
      console.error('Failed to load profile data:', error)
      // Set some default data so the page doesn't break
      setProfileData({
        user: {
          id: 'unknown',
          username: 'unknown',
          first_name: 'Unknown',
          last_name: 'User',
          avatar: null,
          bio: '',
          joined_date: new Date().toISOString(),
          is_professional: false,
        },
        streak: { current_streak: 0, longest_streak: 0 },
        achievements: { earned: 0, total: 0 },
        bookings: [],
        saved_content: { videos: 0, posts: 0 },
        goals: { total: 0, completed: 0 },
        recent_moods: []
      })
    }
    
    // Load goals separately - failure here won't break the profile
    profileService.getGoals().then(goalsData => {
      console.log('Goals data:', goalsData)
      setGoals(goalsData)
    }).catch(_ => {
      console.log('Goals API not ready, using empty array')
      setGoals([])
    })
    
    // Load achievements (mock data for now since API might not be ready)
    setAchievements([
      { achievement: { name: 'First Session', description: 'Complete your first session', points: 10 }, earned_at: new Date().toISOString() },
      { achievement: { name: 'Mood Tracker', description: 'Track your mood for 7 days', points: 25 }, earned_at: new Date().toISOString() }
    ])
    
    setLoading(false)
  }

  const handleAvatarChange = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      await authService.updateProfile(formData as any)
      loadProfileData() // Reload to show new avatar
    } catch (error) {
      console.error('Failed to update avatar:', error)
    }
  }

  const handleProfileEdit = () => {
    setIsEditingProfile(!isEditingProfile)
    if (isEditingProfile) {
      loadProfileData() // Reload after saving
    }
  }

  const handleMoodDateClick = (date: string) => {
    // Navigate to journal page with date pre-selected
    window.location.href = `/journal?date=${date}`
  }

  const handleGoalsChange = () => {
    profileService.getGoals().then(setGoals).catch(console.error)
  }

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'mood' as const, label: 'Mood Journal', icon: Calendar },
    { id: 'achievements' as const, label: 'Achievements', icon: Target },
    { id: 'sessions' as const, label: 'Sessions', icon: BookOpen },
    { id: 'saved' as const, label: 'Saved', icon: Bookmark },
    { id: 'goals' as const, label: 'Goals', icon: Settings },
  ]

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
          <div className="h-64 bg-gray-700 rounded-xl mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-700 rounded-xl"></div>
            <div className="h-64 bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  // Add debugging to see what's happening
  console.log('Rendering check - loading:', loading, 'profileData:', !!profileData, 'user:', !!user)
  
  if (!profileData) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-400">Loading profile data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Profile</h1>
      </div>

      {/* Profile Header - Always Visible */}
      <ProfileHeader
        user={profileData?.user || user}
        streak={profileData?.streak || { current_streak: 0, longest_streak: 0 }}
        isEditing={isEditingProfile}
        onEditToggle={handleProfileEdit}
        onAvatarChange={handleAvatarChange}
      />

      {/* Tab Navigation */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Profile info is already shown in the header */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <p className="text-white">{profileData?.user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username</label>
                  <p className="text-white">@{profileData?.user?.username}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Member Since</label>
                  <p className="text-white">{new Date(profileData?.user?.joined_date || user?.created_at || '').toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Account Type</label>
                  <p className="text-white">
                    {profileData?.user?.is_professional ? 'Professional' : 'Regular User'}
                    {profileData?.user?.is_staff && ' (Admin)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mood' && (
          <MoodHeatmap onDateClick={handleMoodDateClick} />
        )}

        {activeTab === 'achievements' && (
          <AchievementsWall
            achievements={achievements}
            totalAchievements={profileData?.achievements?.total || 0}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionHistoryList bookings={profileData?.bookings || []} />
        )}

        {activeTab === 'saved' && (
          <SavedContentTabs
            videoCount={profileData?.saved_content?.videos || 0}
            postCount={profileData?.saved_content?.posts || 0}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsTracker
            goals={goals}
            onGoalsChange={handleGoalsChange}
          />
        )}
      </div>
    </div>
  )
}
