import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2, CheckCircle, KeyRound } from 'lucide-react'
import OTPInput from '@/components/auth/OTPInput'
import PasswordInput from '@/components/auth/PasswordInput'
import { authService } from '@/services/authService'

type Step = 'code' | 'password' | 'success'

export default function ResetPasswordPage() {
  const location = useLocation()
  const emailFromState = location.state?.email || ''

  const [step, setStep] = useState<Step>('code')
  const [email, setEmail] = useState(emailFromState)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!emailFromState) {
      // If no email in state, show email input
    }
  }, [emailFromState])

  const handleVerifyCode = async () => {
    if (code.length !== 6) return
    
    setIsLoading(true)
    setError('')

    try {
      await authService.verifyResetCode(email, code)
      setStep('password')
    } catch {
      setError('Invalid or expired reset code')
      setCode('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await authService.resetPassword({
        email,
        code,
        new_password: password,
        new_password_confirm: confirmPassword,
      })
      setStep('success')
      toast.success('Password reset successfully!')
    } catch {
      setError('Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-verify when code is complete
  useEffect(() => {
    if (code.length === 6 && step === 'code') {
      handleVerifyCode()
    }
  }, [code])

  if (step === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
        <p className="text-gray-400 mb-6">Your password has been successfully reset.</p>
        
        <Link
          to="/login"
          className="inline-block w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transition-all duration-200 text-center"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link 
        to="/forgot-password" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back
      </Link>

      {step === 'code' && (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <KeyRound size={32} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Enter Reset Code</h2>
            <p className="text-gray-400 text-sm">
              Enter the 6-digit code sent to<br />
              <span className="text-cyan-400 font-medium">{email}</span>
            </p>
          </div>

          {!emailFromState && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5 text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder-gray-500 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <div className="mb-6">
            <OTPInput
              value={code}
              onChange={setCode}
              disabled={isLoading}
              error={!!error}
            />
          </div>

          <button
            onClick={handleVerifyCode}
            disabled={isLoading || code.length !== 6 || !email}
            className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </button>
        </>
      )}

      {step === 'password' && (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
              <KeyRound size={32} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Create New Password</h2>
            <p className="text-gray-400 text-sm">
              Choose a strong password for your account
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <PasswordInput
              label="New Password"
              value={password}
              onChange={setPassword}
              placeholder="Enter new password"
              showStrength
              autoComplete="new-password"
            />

            <PasswordInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={isLoading || !password || password !== confirmPassword}
              className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </>
      )}

      <p className="text-center mt-6 text-xs text-gray-500">
        Code expires in 1 hour
      </p>
    </div>
  )
}
