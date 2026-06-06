interface Props {
  isOnline: boolean
  size?: 'sm' | 'md'
}

export default function AvailabilityDot({ isOnline, size = 'sm' }: Props) {
  const dim = size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'

  if (!isOnline) {
    return <span className={`inline-block ${dim} rounded-full bg-gray-500`} title="Offline" />
  }

  return (
    <span className="relative inline-flex" title="Online">
      <span className={`${dim} rounded-full bg-green-500 animate-availability-pulse`} />
      <span className={`absolute inset-0 ${dim} rounded-full bg-green-400 animate-ping opacity-60`} />
    </span>
  )
}
