export default function VideosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mental Health Videos</h1>
      <p className="text-muted-foreground">Explore curated content for your wellbeing.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Video cards will be loaded here */}
      </div>
    </div>
  )
}
