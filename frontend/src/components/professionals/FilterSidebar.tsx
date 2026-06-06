import { useEffect, useState } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'
import type { Specialization } from '@/types'
import StarRating from './StarRating'

export interface FilterState {
  specialization: string
  language: string
  max_price: string
  gender: string
  min_rating: number
  available_today: boolean
}

interface Props {
  filters: FilterState
  specializations: Specialization[]
  onChange: (f: FilterState) => void
  onClear: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

const LANGUAGES = ['English', 'Spanish', 'French', 'Arabic', 'Portuguese', 'Mandarin', 'German']

export const DEFAULT_FILTERS: FilterState = {
  specialization: '',
  language: '',
  max_price: '',
  gender: '',
  min_rating: 0,
  available_today: false,
}

export default function FilterSidebar({
  filters, specializations, onChange, onClear, mobileOpen, onMobileClose,
}: Props) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)

  useEffect(() => { setLocalFilters(filters) }, [filters])

  function update(partial: Partial<FilterState>) {
    const next = { ...localFilters, ...partial }
    setLocalFilters(next)
    onChange(next)
  }

  const hasActive = Object.entries(localFilters).some(([, v]) =>
    v !== '' && v !== 0 && v !== false
  )

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-white font-semibold">
          <SlidersHorizontal size={16} className="text-indigo-400" />
          Filters
        </div>
        {hasActive && (
          <button
            onClick={onClear}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-5 flex-1 overflow-y-auto pr-1">
        {/* Specialisation */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">Specialisation</label>
          <select
            value={localFilters.specialization}
            onChange={e => update({ specialization: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="" className="bg-[#1a1a2e]">All specialisations</option>
            {specializations.map(s => (
              <option key={s.id} value={s.slug} className="bg-[#1a1a2e]">{s.name}</option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">Language</label>
          <select
            value={localFilters.language}
            onChange={e => update({ language: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="" className="bg-[#1a1a2e]">Any language</option>
            {LANGUAGES.map(l => (
              <option key={l} value={l} className="bg-[#1a1a2e]">{l}</option>
            ))}
          </select>
        </div>

        {/* Max price */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">
            Max price{localFilters.max_price ? `: $${localFilters.max_price}/session` : ''}
          </label>
          <input
            type="range"
            min={20}
            max={300}
            step={10}
            value={localFilters.max_price || 300}
            onChange={e => update({ max_price: e.target.value === '300' ? '' : e.target.value })}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-[11px] text-gray-500 mt-1">
            <span>$20</span><span>Any</span>
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">Gender preference</label>
          <div className="flex gap-2">
            {[['', 'Any'], ['male', 'Male'], ['female', 'Female']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => update({ gender: val })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150 ${
                  localFilters.gender === val
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300'
                    : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Min rating */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">Minimum rating</label>
          <StarRating
            value={localFilters.min_rating}
            interactive
            size={20}
            onChange={v => update({ min_rating: v === localFilters.min_rating ? 0 : v })}
          />
        </div>

        {/* Available today */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => update({ available_today: !localFilters.available_today })}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
              localFilters.available_today ? 'bg-indigo-600' : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                localFilters.available_today ? 'translate-x-4' : ''
              }`}
            />
          </div>
          <span className="text-sm text-gray-300">Available today</span>
        </label>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 bg-[#1a1a2e] border border-white/10 rounded-2xl p-4 h-fit sticky top-4">
        {content}
      </aside>

      {/* Mobile slide-in */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#12121f] border-r border-white/10 p-5 animate-filter-slide-in overflow-y-auto">
            <button onClick={onMobileClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X size={20} />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  )
}
