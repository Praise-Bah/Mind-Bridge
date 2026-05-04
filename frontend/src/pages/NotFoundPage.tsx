import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl text-muted-foreground mt-4">Page not found</p>
        <Link
          to="/dashboard"
          className="inline-block mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
