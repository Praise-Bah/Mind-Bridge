import React, { useState } from 'react'
import { Target, Plus, Edit2, Trash2, CheckCircle, Circle } from 'lucide-react'
import type { UserGoal } from '@/types'
import { profileService } from '@/services/profileService'

interface GoalsTrackerProps {
  goals: UserGoal[]
  onGoalsChange: () => void
}

const CATEGORY_COLORS = {
  wellness: 'from-green-500 to-emerald-500',
  social: 'from-blue-500 to-cyan-500',
  professional: 'from-purple-500 to-pink-500',
  personal: 'from-orange-500 to-red-500'
}

const CATEGORY_ICONS = {
  wellness: '💚',
  social: '💙',
  professional: '💜',
  personal: '❤️'
}

export default function GoalsTracker({ goals, onGoalsChange }: GoalsTrackerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal' as 'personal' | 'wellness' | 'social' | 'professional',
    target_date: '',
    progress: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingGoal) {
        await profileService.updateGoal(editingGoal.id, formData)
      } else {
        await profileService.createGoal(formData)
      }
      
      onGoalsChange()
      resetForm()
    } catch (error) {
      console.error('Failed to save goal:', error)
    }
  }

  const handleDelete = async (goalId: string) => {
    try {
      await profileService.deleteGoal(goalId)
      onGoalsChange()
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  const toggleComplete = async (goal: UserGoal) => {
    try {
      await profileService.updateGoal(goal.id, {
        is_completed: !goal.is_completed,
        progress: !goal.is_completed ? 100 : goal.progress
      })
      onGoalsChange()
    } catch (error) {
      console.error('Failed to update goal:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'personal',
      target_date: '',
      progress: 0
    })
    setEditingGoal(null)
    setIsCreating(false)
  }

  const startEdit = (goal: UserGoal) => {
    setFormData({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      target_date: goal.target_date,
      progress: goal.progress
    })
    setEditingGoal(goal)
    setIsCreating(true)
  }

  const completedCount = goals.filter(g => g.is_completed).length
  const totalCount = goals.length
  const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-semibold text-white">Goals Tracker</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {completedCount} / {totalCount} Completed
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Overall Progress</span>
          <span className="text-white font-medium">{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Goal title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            <div>
              <textarea
                placeholder="Description (optional)..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="personal">Personal</option>
                  <option value="wellness">Wellness</option>
                  <option value="social">Social</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
              
              <div>
                <input
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Progress: {formData.progress}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                {editingGoal ? 'Update' : 'Create'} Goal
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No goals yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first goal to get started!</p>
          </div>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className={`p-4 border rounded-xl transition-all ${
                goal.is_completed
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {/* Category Icon */}
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[goal.category]} flex items-center justify-center text-lg flex-shrink-0`}>
                    {CATEGORY_ICONS[goal.category]}
                  </div>
                  
                  {/* Goal Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${goal.is_completed ? 'text-green-400 line-through' : 'text-white'}`}>
                        {goal.title}
                      </h3>
                      {goal.is_completed && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    
                    {goal.description && (
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                        {goal.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
                      <span className="capitalize">{goal.category}</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleComplete(goal)}
                    className={`p-2 rounded-lg transition-colors ${
                      goal.is_completed
                        ? 'text-green-400 hover:bg-green-500/20'
                        : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {goal.is_completed ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => startEdit(goal)}
                    className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              {!goal.is_completed && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-medium">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${CATEGORY_COLORS[goal.category]} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
