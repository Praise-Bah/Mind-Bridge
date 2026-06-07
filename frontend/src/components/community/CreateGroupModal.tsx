import { useState } from 'react'
import { X, Users, Globe, Lock, Loader2, Upload } from 'lucide-react'
import { communityService } from '@/services/communityService'
import type { CommunityGroup } from '@/types'

interface CreateGroupModalProps {
  onClose: () => void
  onCreated: (group: CommunityGroup) => void
  userGroupCount: number
}

export default function CreateGroupModal({ onClose, onCreated, userGroupCount }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_type: '',
    custom_type: '',
    visibility: 'public' as 'public' | 'private',
    cover_image: null as File | null,
    creation_reason: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [currentStep, setCurrentStep] = useState(1) // 1: basic info, 2: reason, 3: questions, 4: review
  const [aiQuestions, setAiQuestions] = useState<string[]>([])
  const [aiAnswers, setAiAnswers] = useState<string[]>([])
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null)
  const [reviewStatus, setReviewStatus] = useState<any>(null)

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('visibility', formData.visibility)
      
      // Add type field
      if (formData.group_type) {
        formDataToSend.append('group_type', formData.group_type)
      } else if (formData.custom_type) {
        formDataToSend.append('custom_type', formData.custom_type)
      }
      
      // Add image if present
      if (formData.cover_image) {
        formDataToSend.append('cover_image', formData.cover_image)
      }

      const newGroup = await communityService.createGroup(formDataToSend)
      setCreatedGroupId(newGroup.id)
      
      // Move to reason step
      setCurrentStep(2)
    } catch (err: any) {
      const data = err.response?.data
      if (data && typeof data === 'object' && !data.detail) {
        const msgs = Object.values(data).flat().join(' ')
        setError(msgs || 'Failed to create group')
      } else {
        setError(data?.detail || err.message || 'Failed to create group')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReasonSubmit = async () => {
    if (!formData.creation_reason.trim()) {
      setError('Please provide a reason for creating this group')
      return
    }
    if (!createdGroupId) return

    setError('')
    setLoading(true)

    try {
      const questions = await communityService.generateQuestions(createdGroupId, formData.creation_reason)
      setAiQuestions(questions)
      setCurrentStep(3)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswersSubmit = async () => {
    if (aiAnswers.length !== aiQuestions.length || aiAnswers.some(a => !a.trim())) {
      setError('Please answer all questions')
      return
    }
    if (!createdGroupId) return

    setError('')
    setLoading(true)

    try {
      await communityService.submitAnswers(createdGroupId, aiAnswers)
      setCurrentStep(4)
      pollReviewStatus()
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit answers')
    } finally {
      setLoading(false)
    }
  }

  const pollReviewStatus = () => {
    if (!createdGroupId) return

    const pollInterval = setInterval(async () => {
      try {
        const data = await communityService.getReviewStatus(createdGroupId)
        setReviewStatus(data)

        if (data.review_step === 'complete') {
          clearInterval(pollInterval)
          if (data.is_approved) {
            onCreated(data as unknown as CommunityGroup)
            onClose()
          }
        }
      } catch (err: any) {
        // Stop polling on a definitive error (e.g. group not found / not yours)
        // instead of retrying every 3s for up to 10 minutes.
        clearInterval(pollInterval)
        if (err?.response?.status === 404) {
          setError('We lost track of your group submission. Please try creating the group again.')
        } else {
          setError('Could not check your group review status. Please refresh and try again.')
        }
      }
    }, 3000)

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000)
  }

  const GROUP_TYPES = [
    { value: 'anxiety', label: 'Anxiety Support', description: 'Support for managing anxiety and panic disorders' },
    { value: 'grief', label: 'Grief & Loss', description: 'Coping with grief and bereavement' },
    { value: 'depression', label: 'Depression', description: 'Support for depression and mood disorders' },
    { value: 'ptsd', label: 'PTSD', description: 'Post-traumatic stress disorder support' }, 
    { value: 'self_growth', label: 'Self-Growth', description: 'Personal development and growth' },
    { value: 'stress', label: 'Stress Management', description: 'Techniques for managing stress' },
    { value: 'relationships', label: 'Relationship Issues', description: 'Relationship advice and support' },
    { value: 'addiction', label: 'Addiction Recovery', description: 'Support for addiction recovery' }
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, or WebP)')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB')
        return
      }
      
      setFormData({ ...formData, cover_image: file })
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, cover_image: null })
    setImagePreview('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users size={20} />
              Create Community Group
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {userGroupCount}/3 groups created
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep >= step 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white/10 text-gray-400'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-8 h-0.5 ${
                    currentStep > step ? 'bg-indigo-600' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                
                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-colors"
                    placeholder="Enter group name"
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-colors resize-none"
                    placeholder="Describe the purpose of this group"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Cover Image
                  </label>
                  <div className="space-y-3">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Group cover preview" 
                          className="w-full h-32 object-cover rounded-lg border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg hover:border-white/30 transition-colors cursor-pointer bg-white/5">
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-gray-400 text-sm">Click to upload image</span>
                        <span className="text-gray-500 text-xs mt-1">JPEG, PNG, or WebP (max 5MB)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Group Type
                  </label>
                  <div className="space-y-3">
                    {/* Predefined Types */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Predefined Types</label>
                      <select
                        value={formData.group_type}
                        onChange={(e) => setFormData({ ...formData, group_type: e.target.value, custom_type: '' })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-colors"
                      >
                        <option value="">Select a predefined type...</option>
                        {GROUP_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Type */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Or Create Custom Type</label>
                      <input
                        type="text"
                        value={formData.custom_type}
                        onChange={(e) => setFormData({ ...formData, custom_type: e.target.value, group_type: '' })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-colors"
                        placeholder="Enter custom group type"
                        maxLength={50}
                      />
                    </div>
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Visibility *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, visibility: 'public' })}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                        formData.visibility === 'public'
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <Globe size={16} />
                      <span className="text-sm">Public</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, visibility: 'private' })}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                        formData.visibility === 'private'
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <Lock size={16} />
                      <span className="text-sm">Private</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.visibility === 'public' 
                      ? 'Anyone can discover and join this group'
                      : 'Only people with an invite link can join'
                    }
                  </p>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.name || !formData.description}
                    className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    Next
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Step 2: Creation Reason */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Why are you creating this group?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Please explain your motivation for creating this community group and what you hope to achieve.
              </p>
              
              <textarea
                value={formData.creation_reason}
                onChange={(e) => setFormData({ ...formData, creation_reason: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-colors resize-none"
                placeholder="Share your reason for creating this group..."
                rows={4}
                maxLength={1000}
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleReasonSubmit}
                  disabled={loading || !formData.creation_reason.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Generate Questions
                </button>
              </div>
            </div>
          )}

          {/* Step 3: AI Questions */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Answer a few questions</h3>
              <p className="text-gray-400 text-sm mb-4">
                Our AI has generated some questions to better understand your group. Please answer all of them.
              </p>
              
              {aiQuestions.map((question, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    {index + 1}. {question}
                  </label>
                  <textarea
                    value={aiAnswers[index] || ''}
                    onChange={(e) => {
                      const newAnswers = [...aiAnswers]
                      newAnswers[index] = e.target.value
                      setAiAnswers(newAnswers)
                    }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-colors resize-none"
                    placeholder="Your answer..."
                    rows={3}
                    maxLength={500}
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleAnswersSubmit}
                  disabled={loading || aiAnswers.length !== aiQuestions.length || aiAnswers.some(a => !a.trim())}
                  className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Submit for Review
                </button>
              </div>
            </div>
          )}

          {/* Step 4: AI Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">AI Review in Progress</h3>
              
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <Loader2 size={32} className="animate-spin text-indigo-400" />
                </div>
                <p className="text-gray-300 mb-2">
                  Our AI is evaluating your group request
                </p>
                <p className="text-gray-500 text-sm">
                  This usually takes 5-10 minutes. We're consulting multiple AI models for a thorough evaluation.
                </p>
                
                {/* Model Progress */}
                <div className="mt-6 space-y-2">
                  {['Claude Sonnet', 'GPT-4', 'Gemini', 'Llama 3'].map((model, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-gray-300 text-sm">{model}</span>
                      <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{width: '60%'}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {reviewStatus && reviewStatus.review_step === 'complete' && (
                <div className="text-center">
                  {reviewStatus.is_approved ? (
                    <div className="text-green-400">
                      <p className="text-lg font-semibold mb-2">Group Approved! 🎉</p>
                      <p className="text-sm">Your group is now live and ready for members to join.</p>
                    </div>
                  ) : (
                    <div className="text-red-400">
                      <p className="text-lg font-semibold mb-2">Group Not Approved</p>
                      <p className="text-sm">{reviewStatus.ai_review_summary}</p>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="mt-4 px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
