// ============================================================================
// Home Screen - FIXED
// ============================================================================
// File: src/pages/main/HomeScreen.jsx
// Purpose: Main home/dashboard screen
// Status: Production-Ready ✅

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, Users, Trophy, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import Header from '../../components/layout/Header'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SessionCard from '../../components/cards/SessionCard'
import { useAuthStore } from '../../store/authStore'
import apiClient from '../../config/apiClient'

const HomeScreen = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [leaderboardData, setLeaderboardData] = useState(null)
  const [stats, setStats] = useState({
    sessionsAttended: 0,
    pointsEarned: 0,
    badgesEarned: 0,
    rank: 0
  })

  useEffect(() => {
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    setLoading(true)
    try {
      // Fetch featured sessions
      const sessionsResponse = await apiClient.get('/sessions', {
        params: { limit: 6 }
      })
      setSessions(sessionsResponse.data.data || [])

      // Fetch leaderboard stats
      const leaderboardResponse = await apiClient.get('/leaderboard/me')
      setLeaderboardData(leaderboardResponse.data.data)
      
      setStats({
        sessionsAttended: leaderboardResponse.data.data?.sessions_attended || 0,
        pointsEarned: leaderboardResponse.data.data?.total_points || 0,
        badgesEarned: leaderboardResponse.data.data?.badges_earned || 0,
        rank: leaderboardResponse.data.data?.rank || 0
      })
    } catch (error) {
      console.error('Error loading home data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <LoadingSpinner fullScreen />
      </>
    )
  }

  // Safe username fallback
  const displayName = user?.first_name || user?.full_name || 'User';

  return (
    <>
      <Header />

      <main className="pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container-max py-12 px-4 md:px-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Welcome back, {displayName}! 👋
            </h1>
            <p className="text-lg text-white/80 max-w-2xl">
              Discover amazing sessions, connect with professionals, and level up your skills.
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="container-max py-8 px-4 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sessions Attended */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-neutral-900">
                  {stats.sessionsAttended}
                </span>
              </div>
              <p className="text-sm text-neutral-600">Sessions Attended</p>
            </div>

            {/* Points Earned */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-indigo-600" />
                <span className="text-2xl font-bold text-neutral-900">
                  {stats.pointsEarned}
                </span>
              </div>
              <p className="text-sm text-neutral-600">Points Earned</p>
            </div>

            {/* Badges Earned */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-8 h-8 text-yellow-600" />
                <span className="text-2xl font-bold text-neutral-900">
                  {stats.badgesEarned}
                </span>
              </div>
              <p className="text-sm text-neutral-600">Badges Earned</p>
            </div>

            {/* Rank */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-neutral-900">
                  #{stats.rank}
                </span>
              </div>
              <p className="text-sm text-neutral-600">Global Rank</p>
            </div>
          </div>
        </section>

        {/* Featured Sessions */}
        <section className="container-max py-8 px-4 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Featured Sessions</h2>
            <button
              onClick={() => navigate('/sessions')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  className="cursor-pointer transition-transform hover:-translate-y-1"
                >
                  <SessionCard
                    session={session}
                    onViewDetails={() => navigate(`/sessions/${session.id}`)}
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-12 text-center">
              <p className="text-neutral-600 mb-4">No sessions available yet</p>
              <button
                onClick={() => navigate('/sessions')}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Browse Sessions
              </button>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="container-max py-8 px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/activity-hub')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
            >
              <h3 className="text-lg font-bold mb-1">Activity Hub</h3>
              <p className="text-sm text-white/80">Join challenges and engage</p>
            </button>

            <button
              onClick={() => navigate('/learning-paths')}
              className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
            >
              <h3 className="text-lg font-bold mb-1">Learning Paths</h3>
              <p className="text-sm text-white/80">Boost your skills</p>
            </button>

            <button
              onClick={() => navigate('/networking')}
              className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
            >
              <h3 className="text-lg font-bold mb-1">Networking</h3>
              <p className="text-sm text-white/80">Connect with professionals</p>
            </button>
          </div>
        </section>
      </main>
    </>
  )
}

export default HomeScreen