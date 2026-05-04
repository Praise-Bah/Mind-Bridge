export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center text-2xl">👤</div>
          <div>
            <h2 className="text-xl font-semibold">User Name</h2>
            <p className="text-muted-foreground">user@example.com</p>
          </div>
        </div>
        {/* Profile form will be implemented here */}
      </div>
    </div>
  )
}
