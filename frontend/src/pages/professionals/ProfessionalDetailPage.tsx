import { useParams } from 'react-router-dom'

export default function ProfessionalDetailPage() {
  const { id } = useParams()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Professional Profile</h1>
      <p className="text-muted-foreground">Professional ID: {id}</p>
      {/* Professional details and booking options will be loaded here */}
    </div>
  )
}
