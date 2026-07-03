import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Shield, Brain, MapPin, ExternalLink, Menu, X } from 'lucide-react'

const team = [
  {
    name: 'Precious Maloba Senge Abene Makia',
    role: 'Founder & Developer',
    photo: '/team/precious-makia.jpeg',
    location: 'Yaoundé, Cameroon',
    bio: 'Precious is the visionary and builder behind MindBridge. A BSc Software Engineering student at The ICT University in Yaoundé, she designed and developed the platform from concept to deployment — from the Django microservices backend and RAG-powered AI companion to the React frontend and real-time chat system. She has built mobile applications with Flutter, worked on IoT projects, and holds certifications in Linux (LFCA), Software Project Management, and Meta Database Engineering. Bilingual in English and French, she brings a deeply human perspective to technology — driven by the belief that software can be a force for healing.',
    tags: ['Python', 'React', 'TypeScript', 'Flutter', 'AI', 'Bilingual EN/FR'],
    tagColor: 'bg-purple-500/20 text-purple-300',
  },
]

const values = [
  {
    icon: Heart,
    title: 'Accessible Care',
    description: 'Mental health support should never be a privilege. We build tools that reach people regardless of geography or income.',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: Shield,
    title: 'Safe Spaces',
    description: 'Anonymity options, end-to-end encryption, and zero-judgment community guidelines keep every user protected.',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Brain,
    title: 'AI + Human Touch',
    description: 'Our AI companion is available 24/7, but real therapists are always one tap away — because some conversations need a human.',
    gradient: 'from-purple-500 to-violet-500',
  },
]

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-x-hidden">
      {/* Navbar — mirrors LandingPage */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <img src="/logo.png" alt="MindBridge" className="h-8 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <Link to="/about" className="text-white font-medium transition-colors">About</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                Log in
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
              >
                Get Started
              </Link>
              <button
                className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4 space-y-1 pb-4">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                Home
              </Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-white font-medium hover:bg-white/5 rounded-lg transition-colors">
                About
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 text-center overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-[10%] w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Our Story
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
            More than an app —{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              a movement
            </span>
            <br />for mental wellness in Africa
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            One student. One mission. A platform built to bridge the gap between people and the mental health support they deserve.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">The Vision</h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              Mental health conversations in Africa are often silenced by stigma, distance, and a shortage of resources. MindBridge was born from a simple belief: that every person deserves a safe space to be heard, to heal, and to grow — powered by technology built with empathy.
            </p>
            <p className="text-gray-400 leading-relaxed text-lg">
              We imagined a platform where AI and human professionals work together — where someone in a rural town can access the same quality of care as someone in a capital city. Where the first step toward healing is as simple as opening an app.
            </p>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">What Inspired Us</h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              As students at The ICT University in Cameroon, we watched peers struggle in silence. The stigma around mental health, the cost of therapy, and the scarcity of accessible professionals meant most people simply went without help.
            </p>
            <p className="text-gray-400 leading-relaxed text-lg">
              We asked ourselves: what if we built something that actually met people where they are? Not a clinical portal, but a warm, intelligent companion that listens first — and connects you to real professionals when you're ready.
            </p>
            <blockquote className="border-l-4 border-cyan-500 pl-6 py-2">
              <p className="text-gray-300 italic text-lg">
                "One student at The ICT University in Cameroon decided to build that space."
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Meet the Founder</h2>
            <p className="text-gray-400 text-lg">The person behind every line of code and every design decision</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 justify-center">
            {team.map((member) => (
              <div
                key={member.name}
                className="flex-1 max-w-lg relative rounded-2xl overflow-hidden shadow-2xl group cursor-default"
                style={{ height: '520px' }}
              >
                {/* Full photo — fills entire card */}
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    const el = e.currentTarget
                    el.style.display = 'none'
                    const parent = el.parentElement
                    if (parent) {
                      const initials = member.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
                      parent.style.background = 'linear-gradient(135deg,#00BFFF22,#7C5CBF33)'
                      const div = document.createElement('div')
                      div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:5rem;font-weight:700;color:rgba(255,255,255,0.2)'
                      div.textContent = initials
                      parent.appendChild(div)
                    }
                  }}
                />

                {/* Always-visible bottom strip: name + role */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-6 pt-16 pb-5 transition-opacity duration-300 group-hover:opacity-0">
                  <p className="text-white font-bold text-xl leading-tight drop-shadow">{member.name}</p>
                  <p className="text-cyan-400 text-sm font-medium mt-1 drop-shadow">{member.role}</p>
                </div>

                {/* Hover overlay: slides up from bottom, covers lower ~55% */}
                <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/95 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out flex flex-col justify-end px-6 pb-6 pt-10">
                  <p className="text-white font-bold text-lg leading-tight mb-0.5">{member.name}</p>
                  <p className="text-cyan-400 text-sm font-medium mb-2">{member.role}</p>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {member.location}
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed mb-4 line-clamp-5">{member.bio}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.tags.map((tag) => (
                      <span key={tag} className={`px-2.5 py-1 rounded-full text-xs font-medium ${member.tagColor}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Mission & Values</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Every feature we build, every decision we make — it all comes back to these three commitments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map(({ icon: Icon, title, description, gradient }) => (
              <div
                key={title}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300 group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 rounded-3xl p-12">
            <h2 className="text-4xl font-bold mb-4">Join us on this mission</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Whether you're seeking support or looking to make a difference as a professional — MindBridge is built for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                Get Started Free
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-3.5 border border-white/20 rounded-full font-semibold text-lg hover:bg-white/5 transition-all duration-300"
              >
                Already have an account?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} MindBridge · Built with empathy at The ICT University, Cameroon</p>
      </footer>
    </div>
  )
}
