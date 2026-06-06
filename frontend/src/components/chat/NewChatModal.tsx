import { useState, useEffect } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import type { Professional } from '@/types'
import { professionalService } from '@/services/professionalService'

interface Props {
  onClose: () => void
  onSelect: (professionalId: string) => void
}

export default function NewChatModal({ onClose, onSelect }: Props) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadProfessionals()
  }, [])

  const loadProfessionals = async () => {
    try {
      const data = await professionalService.getProfessionals()
      setProfessionals(data)
    } catch {
      setProfessionals([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = professionals.filter(p =>
    p.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.specializations?.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-semibold text-white">New Conversation</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search professionals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00BFFF]"
            />
          </div>
        </div>

        {/* Professional list */}
        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#00BFFF]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No professionals found</p>
            </div>
          ) : (
            filtered.map(professional => (
              <button
                key={professional.id}
                onClick={() => onSelect(professional.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00BFFF] to-[#7C5CBF] flex items-center justify-center text-white font-semibold shrink-0">
                  {professional.user_name?.charAt(0).toUpperCase() || 'P'}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <p className="font-medium text-white">{professional.user_name}</p>
                  <p className="text-sm text-gray-400">
                    {professional.specializations?.map(s => s.name).join(', ') || professional.title || 'Mental Health Professional'}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-green-400">Available</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            Select a professional to start a conversation
          </p>
        </div>
      </div>
    </div>
  )
}
