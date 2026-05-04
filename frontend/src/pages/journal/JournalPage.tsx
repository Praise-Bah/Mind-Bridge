export default function JournalPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Journal</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">New Entry</button>
      </div>
      <p className="text-muted-foreground">Record your thoughts and track your emotional journey.</p>
      <div className="space-y-4">
        {/* Journal entries will be loaded here */}
      </div>
    </div>
  )
}
