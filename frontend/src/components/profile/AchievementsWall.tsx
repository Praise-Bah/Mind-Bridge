import { Trophy, Star, Lock } from 'lucide-react'
import type { UserAchievement } from '@/types'

interface AchievementsWallProps {
  achievements: UserAchievement[]
  totalAchievements: number
}

const ACHIEVEMENT_ICONS: Record<string, string> = {
  'streak_7': '🔥',
  'streak_30': '💪',
  'first_session': '🎯',
  'community_helper': '🤝',
  'journal_writer': '📝',
  'video_watcher': '📺',
  'mood_tracker': '📊',
}

const ACHIEVEMENT_COLORS: Record<string, string> = {
  'streak_7': 'from-orange-500 to-red-500',
  'streak_30': 'from-purple-500 to-pink-500',
  'first_session': 'from-blue-500 to-cyan-500',
  'community_helper': 'from-green-500 to-emerald-500',
  'journal_writer': 'from-yellow-500 to-orange-500',
  'video_watcher': 'from-red-500 to-pink-500',
  'mood_tracker': 'from-indigo-500 to-purple-500',
}

export default function AchievementsWall({ achievements, totalAchievements }: AchievementsWallProps) {
  const earnedAchievementTypes = new Set(achievements.map(a => a.achievement.achievement_type))

  // Create a grid showing all possible achievements
  const allAchievementTypes = Object.keys(ACHIEVEMENT_ICONS)
  const achievementGrid = allAchievementTypes.map(type => {
    const isEarned = earnedAchievementTypes.has(type)
    const userAchievement = achievements.find(a => a.achievement.achievement_type === type)
    
    return {
      type,
      isEarned,
      achievement: userAchievement?.achievement,
      earnedAt: userAchievement?.earned_at
    }
  })

  const earnedCount = achievements.length
  const progressPercentage = totalAchievements > 0 ? (earnedCount / totalAchievements) * 100 : 0

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-xl font-semibold text-white">Achievements</h2>
        </div>
        
        <div className="text-sm text-gray-400">
          {earnedCount} / {totalAchievements} Unlocked
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievementGrid.map(({ type, isEarned, achievement, earnedAt }) => (
          <div
            key={type}
            className={`relative group transition-all duration-300 ${
              isEarned 
                ? 'transform hover:scale-105' 
                : 'opacity-50 grayscale'
            }`}
          >
            {/* Achievement Card */}
            <div className={`relative aspect-square rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 ${
              isEarned
                ? `bg-gradient-to-br ${ACHIEVEMENT_COLORS[type]} shadow-lg shadow-purple-500/25`
                : 'bg-gray-800 border border-gray-700'
            }`}>
              {/* Icon */}
              <div className={`text-4xl mb-2 ${isEarned ? 'animate-pulse' : ''}`}>
                {ACHIEVEMENT_ICONS[type]}
              </div>
              
              {/* Title */}
              <h3 className="text-sm font-medium text-white mb-1">
                {achievement?.name || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              
              {/* Points */}
              {achievement && (
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <Star className="w-3 h-3" />
                  <span>{achievement.points}</span>
                </div>
              )}
              
              {/* Lock overlay for unearned achievements */}
              {!isEarned && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                  <Lock className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {achievement?.description || 'Complete requirements to unlock this achievement'}
              {earnedAt && (
                <div className="text-gray-400 mt-1">
                  Earned {new Date(earnedAt).toLocaleDateString()}
                </div>
              )}
              
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {totalAchievements === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No achievements available yet</p>
        </div>
      )}
    </div>
  )
}
