import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal, Search, Loader2, Users, Heart } from 'lucide-react'
import type { Professional, Specialization } from '@/types'
import { professionalService } from '@/services/professionalService'
import { chatService } from '@/services/chatService'
import ProfessionalCard from '@/components/professionals/ProfessionalCard'
import FilterSidebar, { FilterState, DEFAULT_FILTERS } from '@/components/professionals/FilterSidebar'
import ProfileModal from '@/components/professionals/ProfileModal'

type Tab = 'all' | 'favourites'

export default function ProfessionalsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('all')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [favourites, setFavourites] = useState<Professional[]>([])
  const [specializations, setSpecializations] = useState<Specialization[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (filters.specialization) params.specialization = filters.specialization
      if (filters.language) params.language = filters.language
      if (filters.max_price) params.max_price = filters.max_price
      if (filters.gender) params.gender = filters.gender
      if (filters.min_rating) params.min_rating = String(filters.min_rating)
      if (filters.available_today) params.available_today = 'true'

      const data = await professionalService.getProfessionals(params)
      setProfessionals(data)
    } finally {
      setLoading(false)
    }
  }, [search, filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    professionalService.getSpecializations().then(setSpecializations)
    professionalService.getFavourites().then(setFavourites)
  }, [])

  function updateProfessional(updated: Professional) {
    setProfessionals(prev => prev.map(p => p.id === updated.id ? updated : p))
    if (updated.is_favourite) {
      setFavourites(prev => prev.some(p => p.id === updated.id) ? prev.map(p => p.id === updated.id ? updated : p) : [...prev, updated])
    } else {
      setFavourites(prev => prev.filter(p => p.id !== updated.id))
    }
    if (selectedProfessional?.id === updated.id) setSelectedProfessional(updated)
  }

  async function handleMessage(professional: Professional) {
    try {
      // Create or find existing conversation with this professional
      const conversation = await chatService.createConversation([professional.user])
      // Close the profile modal if open
      setSelectedProfessional(null)
      // Navigate to chat with this conversation
      navigate(`/chat/${conversation.id}`)
    } catch (error) {
      console.error('Failed to start conversation:', error)
    }
  }

  const displayList = tab === 'favourites' ? favourites : professionals

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Find a Professional</h1>
          <p className="text-gray-400 text-sm mt-0.5">Certified mental health professionals, ready to help</p>
        </div>
      </div>

      {/* Search bar + mobile filters trigger */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or title…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => setMobileFilterOpen(true)}
          className="lg:hidden flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 rounded-xl p-1 gap-1 w-fit max-w-full overflow-x-auto">
        {([['all', <Users size={14} />, 'All Professionals'], ['favourites', <Heart size={14} />, `Favourites (${favourites.length})`]] as const).map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              tab === id ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex gap-5 items-start">
        <FilterSidebar
          filters={filters}
          specializations={specializations}
          onChange={setFilters}
          onClear={() => setFilters(DEFAULT_FILTERS)}
          mobileOpen={mobileFilterOpen}
          onMobileClose={() => setMobileFilterOpen(false)}
        />

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-indigo-400" size={30} />
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-16 bg-white/3 rounded-2xl border border-white/10">
              <Users size={40} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">
                {tab === 'favourites' ? 'No favourites yet' : 'No professionals found'}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {tab === 'favourites'
                  ? 'Save professionals you like for quick access'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayList.map(p => (
                <ProfessionalCard
                  key={p.id}
                  professional={p}
                  onViewProfile={setSelectedProfessional}
                  onUpdate={updateProfessional}
                  onMessage={handleMessage}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile modal */}
      {selectedProfessional && (
        <ProfileModal
          professional={selectedProfessional}
          onClose={() => setSelectedProfessional(null)}
          onUpdate={updateProfessional}
          onMessage={handleMessage}
        />
      )}
    </div>
  )
}
