import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login, fetchCurrentUser, setCredentials } from '@/store/slices/authSlice'
import type { AppDispatch, RootState } from '@/store'
import toast from 'react-hot-toast'
import { Mail, Loader2 } from 'lucide-react'
import PasswordInput from '@/components/auth/PasswordInput'
import GoogleAuthButton from '@/components/auth/GoogleAuthButton'
import { authService } from '@/services/authService'

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((state: RootState) => state.auth)
  
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(false)
  const [shakeError, setShakeError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await dispatch(login(formData))
    if (login.fulfilled.match(result)) {
      await dispatch(fetchCurrentUser())
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      setShakeError(true)
      setTimeout(() => setShakeError(false), 500)
    }
  }

  const handleGoogleSuccess = async (token: string) => {
    try {
      const response = await authService.googleAuth({ token })
      dispatch(setCredentials({
        access: response.access,
        refresh: response.refresh,
        user: response.user,
      }))
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch {
      toast.error('Google sign-in failed')
    }
  }

  return (
    <div className={`transition-transform duration-300 ${shakeError ? 'animate-shake' : ''}`}>
      <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
        Welcome Back
      </h2>
      <p className="text-center text-gray-400 text-sm mb-6">
        Sign in to continue your wellness journey
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Google Sign In */}
      <GoogleAuthButton 
        onSuccess={handleGoogleSuccess}
        text="Continue with Google"
      />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[#0f1729] text-gray-500">or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        {/* Password */}
        <PasswordInput
          label="Password"
          value={formData.password}
          onChange={(value) => setFormData({ ...formData, password: value })}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/30"
            />
            <span className="text-sm text-gray-400">Remember me</span>
          </label>
          <Link 
            to="/forgot-password" 
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  )
}
