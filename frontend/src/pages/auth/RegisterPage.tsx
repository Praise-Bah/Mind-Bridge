import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register, setCredentials } from '@/store/slices/authSlice'
import type { AppDispatch, RootState } from '@/store'
import toast from 'react-hot-toast'
import { Mail, User, Loader2 } from 'lucide-react'
import RoleSelector from '@/components/auth/RoleSelector'
import PasswordInput from '@/components/auth/PasswordInput'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'
import { authService } from '@/services/authService'

export default function RegisterPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((state: RootState) => state.auth)

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    role: 'user' as 'user' | 'professional',
  })
  const [shakeError, setShakeError] = useState(false)

  const passwordsMatch = formData.password === formData.password_confirm
  const isPasswordValid = formData.password.length >= 8 && 
    /[A-Z]/.test(formData.password) && 
    /[a-z]/.test(formData.password) && 
    /\d/.test(formData.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordsMatch) {
      toast.error('Passwords do not match')
      setShakeError(true)
      setTimeout(() => setShakeError(false), 500)
      return
    }
    
    if (!isPasswordValid) {
      toast.error('Please meet all password requirements')
      setShakeError(true)
      setTimeout(() => setShakeError(false), 500)
      return
    }

    const result = await dispatch(register(formData))
    if (register.fulfilled.match(result)) {
      toast.success('Account created! Please verify your email.')
      navigate('/verify-email', { state: { email: formData.email, role: formData.role } })
    } else {
      setShakeError(true)
      setTimeout(() => setShakeError(false), 500)
    }
  }

  const handleGoogleSuccess = async (token: string) => {
    try {
      const response = await authService.googleAuth({ token, role: formData.role })
      dispatch(setCredentials({
        access: response.access,
        refresh: response.refresh,
        user: response.user,
      }))
      if (response.created && formData.role === 'professional') {
        // New professional — show "Application Submitted" screen before dashboard
        navigate('/professional-pending')
      } else {
        toast.success(response.created ? 'Account created!' : 'Welcome back!')
        navigate('/dashboard')
      }
    } catch {
      toast.error('Google sign-in failed')
    }
  }

  return (
    <div className={`transition-transform duration-300 ${shakeError ? 'animate-shake' : ''}`}>
      <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
        Create Account
      </h2>
      <p className="text-center text-gray-400 text-sm mb-6">
        Join MindBridge and start your wellness journey
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Role Selector */}
      <RoleSelector 
        value={formData.role} 
        onChange={(role) => setFormData({ ...formData, role })} 
      />

      {/* Google Sign Up */}
      <GoogleAuthButton 
        onSuccess={handleGoogleSuccess}
        text="Sign up with Google"
      />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[#0f1729] text-gray-500">or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-300">First Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder-gray-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
                placeholder="John"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-300">Last Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder-gray-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
                placeholder="Doe"
                required
              />
            </div>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-300">Username</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder-gray-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
              placeholder="johndoe"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-300">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder-gray-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
              placeholder="john@example.com"
              required
            />
          </div>
        </div>

        {/* Password */}
        <PasswordInput
          label="Password"
          value={formData.password}
          onChange={(value) => setFormData({ ...formData, password: value })}
          placeholder="Create a strong password"
          showStrength
          autoComplete="new-password"
        />

        {/* Confirm Password */}
        <PasswordInput
          label="Confirm Password"
          value={formData.password_confirm}
          onChange={(value) => setFormData({ ...formData, password_confirm: value })}
          placeholder="Confirm your password"
          error={formData.password_confirm && !passwordsMatch ? 'Passwords do not match' : undefined}
          autoComplete="new-password"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !isPasswordValid || !passwordsMatch}
          className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
