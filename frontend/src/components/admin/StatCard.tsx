import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: number | string
  icon: LucideIcon
  accent?: string
  onClick?: () => void
}

export default function StatCard({ label, value, icon: Icon, accent = 'text-indigo-400', onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/3 border border-white/10 rounded-2xl p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
    >
      <div className={`w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  )
}
