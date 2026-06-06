import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ShieldCheck } from 'lucide-react'

export default function ProfessionalPendingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/dashboard'), 5000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
        <ShieldCheck size={40} className="text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
      <p className="text-gray-300 mb-4">
        Your Google account has been linked. Your professional application is now{' '}
        <span className="text-amber-400 font-semibold">pending admin review</span>.
      </p>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left mb-4">
        <div className="flex items-start gap-3">
          <Clock size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-300">
            An admin will review your application shortly. You'll receive a notification
            once approved. Until then, you can use MindBridge as a regular user.
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500">Redirecting to your dashboard…</p>
    </div>
  )
}
