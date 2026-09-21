import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../services/api';
import CreatePost from '../components/SocialWall/CreatePost';
import PostCard from '../components/SocialWall/PostCard';

export const SocialWallPage = () => {
  const navigate = useNavigate();
  
  // STATE MANAGEMENT
  const [filterTab, setFilterTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // FETCH DATA ON MOUNT
  useEffect(() => {
    // 1. Get real user profile from storage
    const profile = sessionStorage.getItem('userProfile');
    const userId = localStorage.getItem('user_id');
    
    if (profile && userId) {
      const parsedProfile = JSON.parse(profile);
      setUserProfile({
        id: userId, // Ensure we have the raw DB ID
        firstName: parsedProfile.first_name || parsedProfile.name?.split(' ')[0] || "User",
        lastName: parsedProfile.last_name || parsedProfile.name?.split(' ').slice(1).join(' ') || "",
        avatar: parsedProfile.avatar || parsedProfile.profile_photo_url || null
      });
    } else {
      // Fallback if no user is found
      setUserProfile({
        id: "anonymous",
        firstName: "Guest",
        lastName: "User",
        avatar: null
      });
    }

    // 2. Fetch real posts
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet('/api/v1/social/posts');
      const postsData = data?.posts || (Array.isArray(data) ? data : []);
      
      // Ensure timestamps are date objects for sorting
      const formattedPosts = postsData.map(post => ({
        ...post,
        timestamp: new Date(post.created_at || post.timestamp || Date.now())
      })).sort((a, b) => b.timestamp - a.timestamp);
      
      setPosts(formattedPosts);
    } catch (err) {
      console.error('Failed to load social posts:', err);
      setError('Unable to load the social feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPost = async (newPostData) => {
    try {
      // Create post via API
      const newPost = await apiPost('/api/v1/social/posts', {
        content: newPostData.content,
        image_url: newPostData.image || null, // Map frontend 'image' to backend 'image_url' if needed
        is_announcement: false // Default for standard users
      });
      
      // Format incoming post to ensure timestamp is a Date object
      const formattedNewPost = {
        ...newPost,
        timestamp: new Date(newPost.created_at || newPost.timestamp || Date.now()),
        author: { 
          id: userProfile.id, 
          name: `${userProfile.firstName} ${userProfile.lastName}`, 
          title: "Attendee", 
          initials: `${userProfile.firstName?.[0] || ''}${userProfile.lastName?.[0] || ''}` 
        },
        likes: 0,
        comments: [],
        isLikedByUser: false
      };

      // Optimistically update the UI without waiting for a full re-fetch
      setPosts(prev => [formattedNewPost, ...prev]);
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('Failed to post. Please try again.');
    }
  };

  // HASHTAG EXTRACTOR
  const trendingHashtags = [...new Set(posts.flatMap(p => p.content?.match(/#\w+/g) || []).filter(Boolean))];

  // FILTER LOGIC
  const filteredPosts = posts.filter(post => {
    const contentText = post.content || '';
    const matchesSearch = contentText.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterTab === 'liked') return matchesSearch && post.isLikedByUser;
    if (filterTab === 'mine') return matchesSearch && post.author?.id === userProfile?.id;
    
    return matchesSearch; // 'all' fallback
  });

  return (
    <div className="bg-slate-950 h-screen w-full overflow-y-auto text-white font-sans flex flex-col pb-32">
      
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md px-6 py-4 border-b border-white/10 flex justify-between items-center shadow-lg">
        <button onClick={() => navigate('/hub')} className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-lg hover:bg-slate-800 transition-colors">←</button>
        <h1 className="font-bold text-lg tracking-wide">Social Wall</h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 w-full flex-1">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex justify-between items-center">
            <span className="text-sm">⚠️ {error}</span>
            <button onClick={fetchPosts} className="text-sm underline hover:text-red-100">Retry</button>
          </div>
        )}

        <CreatePost userProfile={userProfile} onPostSubmit={handleNewPost} />

        {/* Trending Hashtags UI */}
        {trendingHashtags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 animate-fade-in">
            <span className="text-xs text-slate-400 font-bold py-1">Trending:</span>
            {trendingHashtags.slice(0, 8).map((tag, i) => (
              <span key={i} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-md border border-blue-500/30">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mb-4 relative">
          <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 text-white placeholder-slate-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
          {['all', 'liked', 'mine'].map(tab => (
            <button 
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors capitalize ${filterTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              {tab === 'mine' ? 'My Posts' : tab}
            </button>
          ))}
        </div>
        
        {/* Posts Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center py-10 text-slate-500 animate-fade-in">
              <div className="text-4xl mb-3">📭</div>
              <p>No posts found.</p>
              {filterTab === 'mine' && <p className="text-sm mt-1">Be the first to share your thoughts!</p>}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-lg border-t border-white/10 px-6 py-3 flex justify-between items-center z-50">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center text-slate-400 hover:text-white"><span className="text-xl mb-1">🏠</span><span className="text-[10px]">Home</span></button>
        <button onClick={() => navigate('/hub')} className="flex flex-col items-center text-blue-500"><span className="text-xl mb-1">⚡</span><span className="text-[10px] font-bold">Hub</span></button>
      </div>
    </div>
  );
};

export default SocialWallPage;