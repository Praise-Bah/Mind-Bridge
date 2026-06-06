import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2, RefreshCw } from 'lucide-react'
import type { Video } from '@/types'
import { videoService } from '@/services/videoService'
import MoodFilterBar from '@/components/videos/MoodFilterBar'
import VideoCard from '@/components/videos/VideoCard'
import FeaturedVideo from '@/components/videos/FeaturedVideo'
import VideoPlayerModal from '@/components/videos/VideoPlayerModal'
import ShareVideoModal from '@/components/videos/ShareVideoModal'
import SavedVideosTab from '@/components/videos/SavedVideosTab'

type Tab = 'discover' | 'saved'

const PAGE_SIZE = 50

export default function VideosPage() {
  const [tab, setTab] = useState<Tab>('discover')
  const [activeMood, setActiveMood] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [videos, setVideos] = useState<Video[]>([])
  const [featured, setFeatured] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null)
  const [sharingVideo, setSharingVideo] = useState<Video | null>(null)

  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const isSearchMode = searchQuery.trim().length > 0

  const loadVideos = useCallback(async (mood: string, pageNum: number, append = false) => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (mood) params.mood = mood
      const data = await videoService.getVideos(params)

      const paginated = data.slice(0, pageNum * PAGE_SIZE)
      setHasMore(data.length > pageNum * PAGE_SIZE)

      if (append) {
        setVideos((prev) => [...prev, ...data.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE)])
      } else {
        setVideos(paginated)
        const feat = data.find((v) => v.is_featured) || data[0] || null
        setFeatured(feat)
      }
    } catch {
      setVideos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    loadVideos(activeMood, 1)
  }, [activeMood, loadVideos])

  useEffect(() => {
    if (!searchQuery.trim()) return
    clearTimeout(searchTimerRef.current)
    setSearchLoading(true)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await videoService.searchVideos(searchQuery.trim(), activeMood || undefined)
        setVideos(results)
        setHasMore(false)
      } catch {
        setVideos([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(searchTimerRef.current)
  }, [searchQuery, activeMood])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setPage(1)
      loadVideos(activeMood, 1)
    }
  }, [searchQuery, activeMood, loadVideos])

  const handleLoadMore = () => {
    if (hasMore) {
      // Load more from current data
      const next = page + 1
      setPage(next)
      loadVideos(activeMood, next, true)
    } else {
      // Refresh - reload and shuffle videos
      handleRefresh()
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (activeMood) params.mood = activeMood
      const data = await videoService.getVideos(params)
      
      // Shuffle the videos array to show different order
      const shuffled = [...data].sort(() => Math.random() - 0.5)
      
      setPage(1)
      const paginated = shuffled.slice(0, PAGE_SIZE)
      setHasMore(shuffled.length > PAGE_SIZE)
      setVideos(paginated)
      
      // Pick a random featured video
      const featuredVideos = shuffled.filter((v) => v.is_featured)
      const feat = featuredVideos.length > 0 
        ? featuredVideos[Math.floor(Math.random() * featuredVideos.length)]
        : shuffled[0] || null
      setFeatured(feat)
    } catch {
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleBookmark = async (videoId: string) => {
    try {
      await videoService.toggleBookmark(videoId)
      setVideos((prev) => prev.map((v) => v.id === videoId ? { ...v, is_bookmarked: !v.is_bookmarked } : v))
      if (featured?.id === videoId) setFeatured((f) => f ? { ...f, is_bookmarked: !f.is_bookmarked } : f)
    } catch {}
  }

  const displayedVideos = featured && !isSearchMode
    ? videos.filter((v) => v.id !== featured.id)
    : videos

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mental Health Videos</h1>
        <p className="text-muted-foreground text-sm mt-1">Curated content to support your wellbeing</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['discover', 'saved'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
              tab === t
                ? 'border-[#00BFFF] text-[#00BFFF] font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'saved' ? (
        <SavedVideosTab onPlay={setPlayingVideo} onShare={setSharingVideo} />
      ) : (
        <>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search videos by keyword or mood…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-[#00BFFF] text-sm transition-colors"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#00BFFF]" />
            )}
          </div>

          {/* Mood filter bar */}
          <MoodFilterBar active={activeMood} onChange={setActiveMood} />

          {loading && videos.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl bg-muted animate-pulse aspect-video" />
              ))}
            </div>
          ) : (
            <>
              {/* Featured video */}
              {featured && !isSearchMode && (
                <FeaturedVideo
                  video={featured}
                  onPlay={setPlayingVideo}
                  onBookmark={handleBookmark}
                />
              )}

              {/* Video grid */}
              {displayedVideos.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg font-medium">No videos found</p>
                  <p className="text-sm mt-1">Try a different mood or search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedVideos.map((video) => (
                    <div key={video.id} className="animate-fade-in">
                      <VideoCard
                        video={video}
                        onPlay={setPlayingVideo}
                        onBookmark={handleBookmark}
                        onShare={setSharingVideo}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Load more / Refresh */}
              {!isSearchMode && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {hasMore ? 'Load More Videos' : 'Refresh & Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modals */}
      {playingVideo && (
        <VideoPlayerModal
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
          onShare={(v) => { setPlayingVideo(null); setSharingVideo(v) }}
        />
      )}
      {sharingVideo && (
        <ShareVideoModal
          video={sharingVideo}
          onClose={() => setSharingVideo(null)}
        />
      )}
    </div>
  )
}
