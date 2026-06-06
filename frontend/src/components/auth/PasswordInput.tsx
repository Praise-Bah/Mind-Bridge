import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  showStrength?: boolean
  disabled?: boolean
  autoComplete?: string
}

interface PasswordCheck {
  label: string
  pass: boolean
}

function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains special character', pass: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]
}

function getStrengthLevel(checks: PasswordCheck[]): { level: number; label: string; color: string } {
  const passed = checks.filter((c) => c.pass).length
  if (passed <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' }
  if (passed <= 2) return { level: 2, label: 'Fair', color: 'bg-orange-500' }
  if (passed <= 3) return { level: 3, label: 'Good', color: 'bg-yellow-500' }
  if (passed === 4) return { level: 4, label: 'Strong', color: 'bg-blue-500' }
  return { level: 5, label: 'Very Strong', color: 'bg-green-500' }
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  label,
  error,
  showStrength = false,
  disabled = false,
  autoComplete = 'current-password',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const checks = getPasswordChecks(value)
  const strength = getStrengthLevel(checks)

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Lock size={18} />
        </div>
        
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full pl-10 pr-12 py-3 rounded-xl border-2 bg-white/5 outline-none
            transition-all duration-200 text-white placeholder-gray-500
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30' 
              : isFocused
                ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                : 'border-white/10 hover:border-white/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-red-400 rounded-full" />
          {error}
        </p>
      )}

      {showStrength && value.length > 0 && (
        <div className="space-y-2 pt-1">
          {/* Strength bar */}
          <div className="flex gap-1 h-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-300 ${
                  i <= strength.level ? strength.color : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <span className={`text-xs font-medium ${
              strength.level <= 2 ? 'text-red-400' :
              strength.level === 3 ? 'text-yellow-400' :
              strength.level === 4 ? 'text-blue-400' : 'text-green-400'
            }`}>
              {strength.label}
            </span>
          </div>

          {/* Requirements checklist */}
          {isFocused && (
            <ul className="space-y-1 pt-1">
              {checks.map((check) => (
                <li key={check.label} className="flex items-center gap-2 text-xs">
                  <span className={`transition-colors ${check.pass ? 'text-green-400' : 'text-gray-500'}`}>
                    {check.pass ? '✓' : '○'}
                  </span>
                  <span className={`transition-colors ${check.pass ? 'text-gray-400' : 'text-gray-500'}`}>
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
