import { useState } from 'react'
import { User, Briefcase } from 'lucide-react'

interface RoleSelectorProps {
  value: 'user' | 'professional'
  onChange: (role: 'user' | 'professional') => void
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleSelect = (role: 'user' | 'professional') => {
    if (role !== value) {
      setIsAnimating(true)
      onChange(role)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-3 text-center text-gray-300">
        I am joining as...
      </label>
      <div className="grid grid-cols-2 gap-3">
        {/* User Role Card */}
        <button
          type="button"
          onClick={() => handleSelect('user')}
          className={`relative p-4 rounded-xl border-2 transition-all duration-300 transform ${
            value === 'user'
              ? 'border-cyan-500 bg-cyan-500/10 scale-[1.02] shadow-lg shadow-cyan-500/20'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
          } ${isAnimating && value === 'user' ? 'animate-pulse' : ''}`}
        >
          <div className={`flex flex-col items-center gap-2 transition-colors ${
            value === 'user' ? 'text-cyan-400' : 'text-gray-400'
          }`}>
            <div className={`p-3 rounded-full transition-all duration-300 ${
              value === 'user' 
                ? 'bg-cyan-500/20' 
                : 'bg-white/5'
            }`}>
              <User size={24} />
            </div>
            <span className="font-medium text-sm">I need support</span>
            <span className="text-xs text-gray-500">
              Access therapy, AI companion & community
            </span>
          </div>
          {value === 'user' && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Professional Role Card */}
        <button
          type="button"
          onClick={() => handleSelect('professional')}
          className={`relative p-4 rounded-xl border-2 transition-all duration-300 transform ${
            value === 'professional'
              ? 'border-purple-500 bg-purple-500/10 scale-[1.02] shadow-lg shadow-purple-500/20'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
          } ${isAnimating && value === 'professional' ? 'animate-pulse' : ''}`}
        >
          <div className={`flex flex-col items-center gap-2 transition-colors ${
            value === 'professional' ? 'text-purple-400' : 'text-gray-400'
          }`}>
            <div className={`p-3 rounded-full transition-all duration-300 ${
              value === 'professional' 
                ? 'bg-purple-500/20' 
                : 'bg-white/5'
            }`}>
              <Briefcase size={24} />
            </div>
            <span className="font-medium text-sm">I am a professional</span>
            <span className="text-xs text-gray-500">
              Provide therapy & counseling services
            </span>
          </div>
          {value === 'professional' && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>
      
      {value === 'professional' && (
        <p className="mt-3 text-xs text-amber-400/80 text-center bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
          Professional accounts require admin approval after registration
        </p>
      )}
    </div>
  )
}
