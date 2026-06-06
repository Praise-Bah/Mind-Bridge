import { Outlet } from 'react-router-dom'
import { Heart, Shield } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-[#0a0f1a]">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-600/20 via-purple-600/20 to-pink-600/20 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            {/* Logo Image */}
            <div className="mb-6">
              <img 
                src="/logo.png" 
                alt="MindBridge" 
                className="h-30 w-auto"
              />
            </div>
            <p className="text-xl text-gray-300 leading-relaxed">
              Your safe space for mental wellness. Connect with professionals, 
              AI companions, and a supportive community.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Heart size={20} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">24/7 AI Companion</h3>
                <p className="text-sm text-gray-400">Always here to listen and support you</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Shield size={20} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Licensed Professionals</h3>
                <p className="text-sm text-gray-400">Connect with verified therapists</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="/logo.png" 
              alt="MindBridge" 
              className="h-10 w-auto mx-auto mb-2"
            />
            <p className="text-gray-400 text-sm">Your Mental Health Companion</p>
          </div>

          {/* Auth Card */}
          <div className="bg-[#0f1729] rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/5">
            <Outlet />
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            By continuing, you agree to our{' '}
            <a href="#" className="text-cyan-400 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-cyan-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
