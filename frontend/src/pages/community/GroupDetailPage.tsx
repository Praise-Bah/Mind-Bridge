import { useParams } from 'react-router-dom'

export default function GroupDetailPage() {
  const { slug } = useParams()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Group: {slug}</h1>
      {/* Group details and posts will be loaded here */}
    </div>
  )
}
