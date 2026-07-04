import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain,
  MessageCircle,
  Video,
  Users,
  Shield,
  Heart,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  X,
  Menu,
  EyeOff
} from 'lucide-react'

const features = [
  {
    icon: MessageCircle,
    title: "AI Companion",
    description: "24/7 AI-powered support for when you need someone to talk to. Empathetic, understanding, and always available.",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: Brain,
    title: "Licensed Professionals",
    description: "Connect with verified mental health professionals for real-time chat sessions and personalized care.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Video,
    title: "Mood-Based Videos",
    description: "Curated therapeutic content matched to your current mood. Meditation, relaxation, and motivational videos.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Join supportive groups with like-minded individuals. Share experiences, find understanding, heal together.",
    color: "from-pink-500 to-purple-500"
  }
]

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up in seconds with email or Google. Your journey to better mental health starts here."
  },
  {
    number: "02",
    title: "Share How You Feel",
    description: "Log your mood daily. Our AI learns your patterns and provides personalized recommendations."
  },
  {
    number: "03",
    title: "Get Support",
    description: "Chat with AI, connect with professionals, watch curated videos, or join community groups."
  }
]

const differentiators = [
  {
    icon: EyeOff,
    title: "Anonymous by Default",
    description: "Share freely in community spaces without revealing your identity. Your privacy is a feature, not an afterthought.",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: Heart,
    title: "Built With Real Empathy",
    description: "MindBridge was created by students at The ICT University in Cameroon who witnessed the mental health gap firsthand and decided to build something about it.",
    color: "from-rose-500 to-pink-500"
  },
  {
    icon: Brain,
    title: "AI First, Human When Ready",
    description: "Start a conversation with our AI any time of day or night. When you're ready for a deeper connection, licensed professionals are one tap away.",
    color: "from-purple-500 to-violet-500"
  }
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.1 }
    )

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <img src="/logo.png" alt="MindBridge" className="h-8 w-auto" />

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-white transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-300 hover:text-white transition-colors">
                How It Works
              </button>
              <button onClick={() => scrollToSection('professionals')} className="text-gray-300 hover:text-white transition-colors">
                For Professionals
              </button>
              <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                About
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
              >
                Get Started
              </Link>
              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4 space-y-1 pb-4">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                How It Works
              </button>
              <button onClick={() => scrollToSection('professionals')} className="block w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                For Professionals
              </button>
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                About
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Animated Mood Orbs Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl animate-float" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
              <Sparkles size={16} className="text-cyan-400" />
              Your Mental Health Companion
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Find Peace of Mind
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              One Conversation at a Time
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10">
            Connect with AI companions, licensed professionals, and a supportive community.
            Your journey to better mental health starts here.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-2 animate-pulse-subtle"
            >
              Get Started Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
            >
              <Play size={20} className="text-cyan-400" />
              Watch Demo
            </button>
          </div>

          {/* Honest platform highlights */}
          <div className="mt-16 flex flex-wrap justify-center gap-4">
            <span className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Free to Join
            </span>
            <span className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              24/7 AI Support
            </span>
            <span className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Anonymous Mode
            </span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/40 rounded-full animate-scroll-indicator" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        ref={(el) => (sectionRefs.current['features'] = el)}
        className={`py-24 px-4 transition-all duration-1000 ${visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need for
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"> Mental Wellness</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Comprehensive tools and support designed to help you on your journey to better mental health.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        ref={(el) => (sectionRefs.current['how-it-works'] = el)}
        className={`py-24 px-4 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent transition-all duration-1000 ${visibleSections.has('how-it-works') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Getting started with MindBridge is simple. Follow these three easy steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative p-8 rounded-2xl bg-white/5 border border-white/10"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="text-6xl font-bold bg-gradient-to-r from-cyan-500/20 to-purple-500/20 bg-clip-text text-transparent mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built Different Section (replaces fake testimonials) */}
      <section
        id="why-us"
        ref={(el) => (sectionRefs.current['why-us'] = el)}
        className={`py-24 px-4 transition-all duration-1000 ${visibleSections.has('why-us') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Different</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              MindBridge isn't just another wellness app. Here's what genuinely sets it apart.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {differentiators.map(({ icon: Icon, title, description, color }, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Read our full story
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Professional CTA Section */}
      <section
        id="professionals"
        ref={(el) => (sectionRefs.current['professionals'] = el)}
        className={`py-24 px-4 transition-all duration-1000 ${visibleSections.has('professionals') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-cyan-600/30" />
            <div className="absolute inset-0 bg-[#0a0f1a]/60" />

            <div className="relative z-10 py-16 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={24} className="text-cyan-400" />
                  <span className="text-cyan-400 font-medium">For Mental Health Professionals</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Expand Your Practice with MindBridge
                </h2>
                <p className="text-gray-300 mb-6">
                  Join our network of licensed therapists and counselors. Reach more clients,
                  manage appointments seamlessly, and make a difference in people's lives.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 size={20} className="text-green-400" />
                    Flexible scheduling and session management
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 size={20} className="text-green-400" />
                    Secure, privacy-first platform
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 size={20} className="text-green-400" />
                    Reach clients who need your expertise
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-4">
                <Link
                  to="/register?role=professional"
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105 text-center"
                >
                  Join as Professional
                </Link>
                <Link
                  to="/professionals"
                  className="px-8 py-4 bg-white/10 border border-white/20 rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-300 text-center"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Wellness Journey?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Start your mental wellness journey today — connect with AI support, a growing community, and licensed professionals.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-semibold text-xl hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
          >
            Get Started Free
            <ArrowRight size={24} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <img src="/logo.png" alt="MindBridge" className="h-8 w-auto mb-4" />
              <p className="text-gray-400 text-sm">
                Your safe space for mental wellness. Connect, heal, and grow with MindBridge.
              </p>
              <div className="flex gap-4 mt-6">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link to="/register" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
                <li><Link to="/professionals" className="hover:text-white transition-colors">Find Professionals</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Crisis Resources</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} MindBridge · Built at The ICT University, Cameroon
            </p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={32} />
            </button>
            <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden">
              {/* Replace the YouTube ID below with your own MindBridge demo recording */}
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/NQcYZplTXnQ?autoplay=1&rel=0"
                title="MindBridge Platform Demo"
                style={{ border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
