import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">MindBridge</h1>
          <p className="text-muted-foreground mt-2">Your Mental Health Companion</p>
        </div>
        <div className="bg-card rounded-lg shadow-lg p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
