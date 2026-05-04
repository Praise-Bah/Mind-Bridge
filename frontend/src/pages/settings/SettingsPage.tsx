export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="bg-card border rounded-lg p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Notifications</h3>
          <p className="text-muted-foreground text-sm">Manage your notification preferences</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Privacy</h3>
          <p className="text-muted-foreground text-sm">Control your privacy settings</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Theme</h3>
          <p className="text-muted-foreground text-sm">Customize your display preferences</p>
        </div>
      </div>
    </div>
  )
}
