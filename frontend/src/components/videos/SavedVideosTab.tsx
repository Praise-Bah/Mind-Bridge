import { useEffect, useState } from 'react'
import { Bookmark } from 'lucide-react'
import type { Video } from '@/types'
import { videoService } from '@/services/videoService'
import VideoCard from './VideoCard'

interface SavedVideosTabProps {
  onPlay: (video: Video) => void
  onShare: (video: Video) => void
}

export default function SavedVideosTab({ onPlay, onShare }: SavedVideosTabProps) {
  const [savedVideos, setSavedVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    videoService.getBookmarks()
      .then((data) => setSavedVideos(data.map((b) => b.video)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleBookmark = async (videoId: string) => {
    try {
      await videoService.toggleBookmark(videoId)
      setSavedVideos((prev) => prev.filter((v) => v.id !== videoId))
    } catch {}
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-muted animate-pulse aspect-video" />
        ))}
      </div>
    )
  }

  if (savedVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Bookmark className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg">No saved videos yet</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Tap the heart icon on any video to save it here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {savedVideos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onPlay={onPlay}
          onBookmark={handleBookmark}
          onShare={onShare}
        />
      ))}
    </div>
  )
}
