import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { authService } from '@/services/authService'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.forgotPassword(email)
      setIsSent(true)
      toast.success('Reset code sent to your email')
    } catch {
      toast.error('Failed to send reset code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    navigate('/reset-password', { state: { email } })
  }

  if (isSent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
        <p className="text-gray-400 text-sm mb-6">
          We've sent a 6-digit reset code to<br />
          <span className="text-cyan-400 font-medium">{email}</span>
        </p>
        
        <button
          onClick={handleContinue}
          className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transition-all duration-200 mb-4"
        >
          Enter Reset Code
        </button>

        <p className="text-gray-500 text-sm">
          Didn't receive the email?{' '}
          <button 
            onClick={() => setIsSent(false)}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Try again
          </button>
        </p>
      </div>
    )
  }

  return (
    <div>
      <Link 
        to="/login" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back to login
      </Link>

      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
          <Mail size={32} className="text-cyan-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
        <p className="text-gray-400 text-sm">
          No worries! Enter your email and we'll send you a reset code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-300">Email Address</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder-gray-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Sending...
            </>
          ) : (
            'Send Reset Code'
          )}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-400">
        Remember your password?{' '}
        <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
