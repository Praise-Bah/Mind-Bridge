import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '@/store/slices/authSlice'
import type { AppDispatch } from '@/store'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, Loader2, CheckCircle, Clock, ShieldCheck } from 'lucide-react'
import OTPInput from '@/components/auth/OTPInput'
import { authService } from '@/services/authService'

export default function VerifyEmailPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  const role: 'user' | 'professional' = location.state?.role || 'user'

  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isVerified, setIsVerified] = useState(false)

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/register')
    }
  }, [email, navigate])

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify()
    }
  }, [otp])

  const handleVerify = async () => {
    if (otp.length !== 6) return
    
    setIsLoading(true)
    setError('')

    try {
      const response = await authService.verifyEmail({ email, code: otp })
      setIsVerified(true)
      
      // Auto-login after verification
      dispatch(setCredentials({
        access: response.access,
        refresh: response.refresh,
        user: null, // Will be fetched by the app
      }))

      toast.success('Email verified successfully!')

      // Professionals see an "Application Submitted" screen; regular users go straight to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, role === 'professional' ? 4000 : 1500)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code'
      setError(errorMessage)
      setOtp('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    
    setIsResending(true)
    setError('')

    try {
      await authService.resendOTP(email)
      toast.success('Verification code sent!')
      setResendCooldown(60) // 60 second cooldown
    } catch {
      toast.error('Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  if (isVerified && role === 'professional') {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
          <ShieldCheck size={40} className="text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
        <p className="text-gray-300 mb-4">
          Your email has been verified. Your professional application is now
          <span className="text-amber-400 font-semibold"> pending admin review</span>.
        </p>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left mb-4">
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-300">
              An admin will review your application shortly. You'll receive an email notification once approved.
              Until then, you can use MindBridge as a regular user.
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500">Redirecting to your dashboard…</p>
      </div>
    )
  }

  if (isVerified) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center animate-bounce">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
        <p className="text-gray-400">Redirecting to dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      <Link 
        to="/register" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back to registration
      </Link>

      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
          <Mail size={32} className="text-cyan-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
        <p className="text-gray-400 text-sm">
          We've sent a 6-digit code to<br />
          <span className="text-cyan-400 font-medium">{email}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
          {error}
        </div>
      )}

      <div className="mb-6">
        <OTPInput
          value={otp}
          onChange={setOtp}
          disabled={isLoading}
          error={!!error}
        />
      </div>

      <button
        onClick={handleVerify}
        disabled={isLoading || otp.length !== 6}
        className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mb-4"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Email'
        )}
      </button>

      <div className="text-center">
        <p className="text-gray-400 text-sm mb-2">Didn't receive the code?</p>
        <button
          onClick={handleResend}
          disabled={isResending || resendCooldown > 0}
          className="text-cyan-400 hover:text-cyan-300 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isResending ? (
            'Sending...'
          ) : resendCooldown > 0 ? (
            `Resend in ${resendCooldown}s`
          ) : (
            'Resend Code'
          )}
        </button>
      </div>

      <p className="text-center mt-6 text-xs text-gray-500">
        Code expires in 15 minutes
      </p>
    </div>
  )
}
