import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { PlusCircle, Loader2, Users, Rss } from 'lucide-react'
import type { Post, CommunityGroup, Comment } from '@/types'
import type { RootState } from '@/store'
import { communityService } from '@/services/communityService'
import GroupCard from '@/components/community/GroupCard'
import PostCard from '@/components/community/PostCard'
import PostCreationModal from '@/components/community/PostCreationModal'
import CommentThread from '@/components/community/CommentThread'
import ReportModal from '@/components/community/ReportModal'
import ShareToJournalModal from '@/components/community/ShareToJournalModal'
import CreateGroupModal from '@/components/community/CreateGroupModal'

type Tab = 'feed' | 'groups'
type ReportTarget = { type: 'post' | 'comment'; id: string } | null

export default function CommunityPage() {
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id)

  const [tab, setTab] = useState<Tab>('feed')
  const [posts, setPosts] = useState<Post[]>([])
  const [groups, setGroups] = useState<CommunityGroup[]>([])
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [openCommentPost, setOpenCommentPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [sharePost, setSharePost] = useState<Post | null>(null)
  const [journalPost, setJournalPost] = useState<Post | null>(null)
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null)

  const joinedGroups = Array.isArray(groups) ? groups.filter(g => g.is_member) : []
  const userCreatedGroups = Array.isArray(groups)
    ? groups.filter(g => g.is_user_created && g.created_by === currentUserId)
    : []

  const handleGroupCreated = (newGroup: CommunityGroup) => {
    setGroups(prev => [newGroup, ...prev])
  }

  const loadFeed = useCallback(async () => {
    setLoadingFeed(true)
    try {
      const data = await communityService.getFeed()
      setPosts(data ?? [])
    } catch {
      setPosts([])
    } finally {
      setLoadingFeed(false)
    }
  }, [])

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true)
    try {
      const data = await communityService.getGroups()
      setGroups(data ?? [])
    } catch {
      setGroups([])
    } finally {
      setLoadingGroups(false)
    }
  }, [])

  useEffect(() => { loadFeed(); loadGroups() }, [loadFeed, loadGroups])

  async function openComments(post: Post) {
    setOpenCommentPost(post)
    setLoadingComments(true)
    try {
      const data = await communityService.getComments(post.id)
      setComments(data)
    } finally {
      setLoadingComments(false)
    }
  }

  function updatePost(updated: Post) {
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  function updateGroup(updated: CommunityGroup) {
    setGroups(prev => prev.map(g => g.id === updated.id ? updated : g))
  }

  function handleCommentAdded(comment: Comment) {
    if (comment.parent) {
      setComments(prev => prev.map(c =>
        c.id === comment.parent
          ? { ...c, replies: [...(c.replies ?? []), comment] }
          : c
      ))
    } else {
      setComments(prev => [...prev, comment])
    }
    if (openCommentPost) {
      setPosts(prev => prev.map(p =>
        p.id === openCommentPost.id ? { ...p, comments_count: p.comments_count + 1 } : p
      ))
    }
  }

  function handleCommentDeleted(commentId: string) {
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Community</h1>
          <p className="text-gray-400 text-sm mt-0.5">Connect with others on their journey</p>
        </div>
        {joinedGroups.length > 0 && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            <PlusCircle size={16} /> New Post
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 rounded-xl p-1 gap-1">
        {([['feed', <Rss size={14} />, 'Feed'], ['groups', <Users size={14} />, 'Groups']] as const).map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === id ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Feed tab */}
      {tab === 'feed' && (
        <div className="space-y-4">
          {loadingFeed ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-indigo-400" size={28} />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white/3 rounded-2xl border border-white/10">
              <Rss size={36} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400 font-medium">No posts yet</p>
              <p className="text-gray-500 text-sm mt-1">Be the first to post in a public group</p>
              <button onClick={() => setTab('groups')} className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors">
                Browse Groups
              </button>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                isModerator={groups.find(g => g.id === post.group)?.is_moderator}
                onOpenComments={openComments}
                onShare={setSharePost}
                onReport={p => setReportTarget({ type: 'post', id: p.id })}
                onSaveToJournal={setJournalPost}
                onUpdate={updatePost}
              />
            ))
          )}
        </div>
      )}

      {/* Groups tab */}
      {tab === 'groups' && (
        <div className="space-y-4">
          {/* Create Group Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Groups</h3>
              <p className="text-gray-400 text-sm mt-0.5">
                {userCreatedGroups.length}/3 groups created
              </p>
            </div>
            <button
              onClick={() => setShowCreateGroup(true)}
              disabled={userCreatedGroups.length >= 3}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                userCreatedGroups.length >= 3
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              <PlusCircle size={16} />
              Create Group
            </button>
          </div>

          {loadingGroups ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-indigo-400" size={28} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groups.map(group => (
                <GroupCard key={group.id} group={group} onUpdate={updateGroup} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comments drawer */}
      {openCommentPost && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setOpenCommentPost(null)}>
          <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <h3 className="font-semibold text-white">Comments</h3>
              <button onClick={() => setOpenCommentPost(null)} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto p-4">
              {loadingComments ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-400" size={24} /></div>
              ) : (
                <CommentThread
                  postId={openCommentPost.id}
                  comments={comments}
                  onReport={id => setReportTarget({ type: 'comment', id })}
                  onDeleted={handleCommentDeleted}
                  onAdded={handleCommentAdded}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <PostCreationModal
          groups={joinedGroups}
          onClose={() => setShowCreate(false)}
          onCreated={loadFeed}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreated={handleGroupCreated}
          userGroupCount={userCreatedGroups.length}
        />
      )}

      {sharePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-slide-up">
            <p className="font-semibold text-white mb-3">Share Post</p>
            <p className="text-gray-400 text-sm mb-4">Copy the link to share this post</p>
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 border border-white/10">
              <span className="flex-1 truncate">{window.location.origin}/community/{sharePost.group}</span>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/community/${sharePost.group}`); setSharePost(null) }}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Copy</button>
            </div>
            <button onClick={() => setSharePost(null)} className="mt-3 w-full py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Close</button>
          </div>
        </div>
      )}

      {journalPost && (
        <ShareToJournalModal post={journalPost} onClose={() => setJournalPost(null)} />
      )}

      {reportTarget && (
        <ReportModal type={reportTarget.type} targetId={reportTarget.id} onClose={() => setReportTarget(null)} />
      )}
    </div>
  )
}
