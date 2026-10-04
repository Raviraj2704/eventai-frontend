// ============================================================================
// Social Wall Screen - PREMIUM UI + FULL CRUD
// ============================================================================
import React, { useEffect, useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Loader, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../config/apiClient';

const SocialWallScreen = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);

  useEffect(() => {
    loadPosts();
  }, [page]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/social/posts', { params: { page, limit: 10 } });
      setPosts(prev => page === 1 ? response.data.data : [...prev, ...response.data.data]);
      setHasMore(response.data.has_next || false);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // --- POST OPERATIONS ---
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setIsCreating(true);
    try {
      const response = await apiClient.post('/social/posts', { content: newPost });
      setPosts(prev => [response.data, ...prev]);
      setNewPost('');
      toast.success('Post created!');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await apiClient.delete(`/social/posts/${postId}`);
        setPosts(prev => prev.filter(p => p.id !== postId));
        toast.success('Post deleted!');
      } catch (error) {
        toast.error('Failed to delete post');
      }
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await apiClient.post(`/social/posts/${postId}/unlike`);
      } else {
        await apiClient.post(`/social/posts/${postId}/like`);
      }
      setPosts(prev => prev.map(post => 
        post.id === postId ? {
          ...post,
          like_count: isLiked ? Math.max(0, post.like_count - 1) : post.like_count + 1,
          user_liked: !isLiked
        } : post
      ));
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  // --- COMMENT OPERATIONS ---
  const loadComments = async (postId) => {
    try {
      const response = await apiClient.get(`/social/posts/${postId}/comments`);
      setComments(prev => ({ ...prev, [postId]: response.data.data || [] }));
    } catch (error) {
      toast.error('Failed to load comments');
    }
  };

  const handleToggleComments = (postId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
        if (!comments[postId]) loadComments(postId);
      }
      return newSet;
    });
  };

  const handleAddComment = async (postId) => {
    const commentText = newComments[postId];
    if (!commentText?.trim()) return;
    try {
      const response = await apiClient.post(`/social/posts/${postId}/comments`, { content: commentText });
      setComments(prev => ({ ...prev, [postId]: [response.data, ...(prev[postId] || [])] }));
      setNewComments(prev => ({ ...prev, [postId]: '' }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await apiClient.delete(`/social/comments/${commentId}`);
        // Remove from local state
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].filter(c => c.id !== commentId)
        }));
        // Decrement post comment counter safely
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p));
        toast.success('Comment deleted!');
      } catch (error) {
        toast.error('Failed to delete comment');
      }
    }
  };

  // Helper for initials Avatar
  const getInitials = (first, last) => `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || 'U';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-50 pb-24">
        <div className="max-w-2xl mx-auto px-4 py-6">
          
          {/* Header Widget */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">Community Wall</h1>
            <p className="text-neutral-500 text-sm mt-1">Connect, share, and engage with peers</p>
          </div>

          {/* Create Post Card */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4 mb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0">
                {getInitials(user?.first_name, user?.last_name)}
              </div>
              <form onSubmit={handleCreatePost} className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share a thought, insight, or update..."
                  rows="3"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none transition-all"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-neutral-400 font-medium">{newPost.length}/500</span>
                  <button type="submit" disabled={isCreating || !newPost.trim()} className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm">
                    {isCreating ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                
                {/* Post Header */}
                <div className="px-5 py-4 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 font-bold flex items-center justify-center flex-shrink-0 border border-neutral-200">
                      {getInitials(post.author?.first_name, post.author?.last_name)}
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 text-sm">
                        {post.author?.first_name} {post.author?.last_name}
                      </p>
                      <p className="text-xs text-neutral-500 font-medium">
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  </div>
                  {/* Delete Post Trigger (Author or Admin) */}
                  {(user?.id === post.user_id || user?.is_admin) && (
                    <button onClick={() => handleDeletePost(post.id)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Post Body */}
                <div className="px-5 pb-4">
                  <p className="text-neutral-800 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>

                {/* Post Stats */}
                {(post.like_count > 0 || post.comment_count > 0) && (
                  <div className="px-5 py-2 border-t border-neutral-100 flex gap-4 text-xs font-medium text-neutral-500">
                    {post.like_count > 0 && <span>{post.like_count} Likes</span>}
                    {post.comment_count > 0 && <span>{post.comment_count} Comments</span>}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="px-2 py-1 border-t border-neutral-100 flex">
                  <button onClick={() => handleLike(post.id, post.user_liked)} className={`flex-1 flex justify-center items-center gap-2 py-2.5 mx-1 rounded-lg text-sm font-medium transition-colors ${post.user_liked ? 'text-blue-600 bg-blue-50' : 'text-neutral-600 hover:bg-neutral-50'}`}>
                    <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-current' : ''}`} /> Like
                  </button>
                  <button onClick={() => handleToggleComments(post.id)} className="flex-1 flex justify-center items-center gap-2 py-2.5 mx-1 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                    <MessageCircle className="w-4 h-4" /> Comment
                  </button>
                </div>

                {/* Comments Thread */}
                {expandedComments.has(post.id) && (
                  <div className="bg-neutral-50 border-t border-neutral-100 p-4 space-y-4">
                    
                    {/* Add Comment Input */}
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {getInitials(user?.first_name, user?.last_name)}
                      </div>
                      <input
                        type="text"
                        value={newComments[post.id] || ''}
                        onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-white border border-neutral-200 text-sm px-4 py-2 rounded-full focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                      <button onClick={() => handleAddComment(post.id)} disabled={!newComments[post.id]?.trim()} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full disabled:opacity-50 transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comment List */}
                    <div className="space-y-3 pl-2">
                      {comments[post.id]?.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {getInitials(comment.author?.first_name, comment.author?.last_name)}
                          </div>
                          <div className="flex-1">
                            <div className="bg-white border border-neutral-100 rounded-2xl rounded-tl-none px-4 py-2 shadow-sm inline-block">
                              <p className="text-xs font-bold text-neutral-900">{comment.author?.first_name}</p>
                              <p className="text-sm text-neutral-800 mt-0.5">{comment.content}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-1 ml-2 text-[11px] font-medium text-neutral-400">
                              <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                              {/* Delete Comment Trigger (Author or Admin) */}
                              {(user?.id === comment.user_id || user?.is_admin) && (
                                <button onClick={() => handleDeleteComment(post.id, comment.id)} className="hover:text-red-500 transition-colors">
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading / End State */}
            <div ref={observerTarget} className="py-6 text-center">
              {loading && hasMore && <Loader className="w-6 h-6 animate-spin mx-auto text-blue-600" />}
              {!hasMore && posts.length > 0 && <p className="text-neutral-400 text-sm font-medium">You have caught up on all posts!</p>}
              {!loading && posts.length === 0 && <p className="text-neutral-500">No posts yet. Be the first to say hello!</p>}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default SocialWallScreen;