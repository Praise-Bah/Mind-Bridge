import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, PlusCircle, Loader2, LogIn, LogOut, Lock, MessageCircle, FileText } from 'lucide-react'
import type { Post, CommunityGroup, Comment } from '@/types'
import { communityService } from '@/services/communityService'
import PostCard from '@/components/community/PostCard'
import PostCreationModal from '@/components/community/PostCreationModal'
import CommentThread from '@/components/community/CommentThread'
import ReportModal from '@/components/community/ReportModal'
import ShareToJournalModal from '@/components/community/ShareToJournalModal'
import GroupChat from '@/components/community/GroupChat'

type ReportTarget = { type: 'post' | 'comment'; id: string } | null

export default function GroupDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [group, setGroup] = useState<CommunityGroup | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  const [activeTab, setActiveTab] = useState<'posts' | 'chat'>('posts')
  const [showCreate, setShowCreate] = useState(false)
  const [openCommentPost, setOpenCommentPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [journalPost, setJournalPost] = useState<Post | null>(null)
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    try {
      const [groupData, postsData] = await Promise.all([
        communityService.getGroup(slug),
        communityService.getPosts(slug),
      ])
      setGroup(groupData)
      setPosts(postsData)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function handleToggleMembership() {
    if (!group) return
    setJoining(true)
    try {
      if (group.is_member) {
        await communityService.leaveGroup(group.slug)
        setGroup(g => g ? { ...g, is_member: false, member_count: g.member_count - 1 } : g)
      } else {
        await communityService.joinGroup(group.slug)
        setGroup(g => g ? { ...g, is_member: true, member_count: g.member_count + 1 } : g)
      }
    } finally {
      setJoining(false)
    }
  }

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

  const pinnedPost = posts.find(p => p.is_pinned)
  const feedPosts = posts.filter(p => !p.is_pinned)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    )
  }

  if (!group) return null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/community')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Community
      </button>

      {/* Group header */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-700 relative">
          {group.cover_image && (
            <img src={group.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>
        <div className="p-4 -mt-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3">
            {group.name.charAt(0)}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white">{group.name}</h1>
              <p className="text-gray-400 text-sm mt-1 max-w-md">{group.description}</p>
              <div className="flex items-center gap-1 text-gray-500 text-xs mt-2">
                <Users size={12} />
                {group.member_count.toLocaleString()} members
                {group.is_moderator && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-medium">Moderator</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {group.is_member && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
                >
                  <PlusCircle size={14} /> Post
                </button>
              )}
              {group.is_member ? (
                <button
                  onClick={handleToggleMembership}
                  disabled={joining}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white/10 text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <LogOut size={14} /> Leave
                </button>
              ) : group.visibility === 'private' ? (
                <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white/5 text-gray-400 border border-white/10">
                  <Lock size={14} /> Invite only
                </span>
              ) : (
                <button
                  onClick={handleToggleMembership}
                  disabled={joining}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-500 transition-colors disabled:opacity-50"
                >
                  <LogIn size={14} /> Join
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs — Posts / Chat */}
      {group.is_member && (
        <div className="flex bg-[#1a1a2e] border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'posts' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText size={15} /> Posts
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageCircle size={15} /> Group Chat
          </button>
        </div>
      )}

      {/* Chat tab */}
      {activeTab === 'chat' && group.is_member && (
        <GroupChat groupSlug={group.slug} groupName={group.name} />
      )}

      {/* Posts tab */}
      {activeTab === 'posts' && (
        <>
          {/* Pinned post */}
          {pinnedPost && (
            <PostCard
              post={pinnedPost}
              isModerator={group.is_moderator}
              onOpenComments={openComments}
              onShare={() => {}}
              onReport={p => setReportTarget({ type: 'post', id: p.id })}
              onSaveToJournal={setJournalPost}
              onUpdate={updatePost}
            />
          )}

          {/* Non-member call-to-action banner */}
          {!group.is_member && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/3 border border-white/10 text-sm">
              {group.visibility === 'private' ? (
                <>
                  <Lock size={15} className="text-gray-500 shrink-0" />
                  <p className="text-gray-400">
                    This is a private group. Ask a member for an invite link to join and post.
                  </p>
                </>
              ) : (
                <>
                  <LogIn size={15} className="text-indigo-400 shrink-0" />
                  <p className="text-gray-400">
                    <button onClick={handleToggleMembership} disabled={joining}
                      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 disabled:opacity-50">
                      Join this group
                    </button>
                    {' '}to post, comment, and react.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Posts feed — visible to everyone */}
          {feedPosts.length === 0 ? (
            <div className="text-center py-12 bg-white/3 rounded-2xl border border-white/10">
              <p className="text-gray-400">No posts yet</p>
              {group.is_member && (
                <button onClick={() => setShowCreate(true)} className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors">
                  Be the first to post
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {feedPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  isModerator={group.is_moderator}
                  onOpenComments={openComments}
                  onShare={() => {}}
                  onReport={p => setReportTarget({ type: 'post', id: p.id })}
                  onSaveToJournal={setJournalPost}
                  onUpdate={updatePost}
                />
              ))}
            </div>
          )}
        </>
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
          groups={[group]}
          defaultGroupSlug={group.slug}
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
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
