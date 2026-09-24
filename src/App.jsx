// ============================================================================
// Main App Component with Routing
// ============================================================================
// File: src/App.jsx
// Purpose: Root component with React Router setup and authentication flow
// Status: Production-Ready ✅

import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Store
import { useAuthStore } from './store/authStore'

// Pages - Auth
import SplashScreen from './pages/auth/SplashScreen'
import LoginScreen from './pages/auth/LoginScreen'
import RegisterScreen from './pages/auth/RegisterScreen'
import VerifyEmailScreen from './pages/auth/VerifyEmailScreen'
import CompleteProfileScreen from './pages/auth/CompleteProfileScreen'

// Pages - Main
import HomeScreen from './pages/main/HomeScreen'
import SessionsScreen from './pages/main/SessionsScreen'
import HubScreen from './pages/main/HubScreen'
import NetworkingScreen from './pages/main/NetworkingScreen'
import ProfileScreen from './pages/main/ProfileScreen'
import PicbotScreen from './pages/main/PicbotScreen'

// Pages - Engagement
import SocialWallScreen from './pages/engagement/SocialWallScreen'
import ActivityHubScreen from './pages/engagement/ActivityHubScreen'
import AIMatchesScreen from './pages/engagement/AIMatchesScreen'
import PartnersScreen from './pages/engagement/PartnersScreen'
import BriefcaseScreen from './pages/engagement/BriefcaseScreen'

// Pages - Gamification & Learning
import RatingsScreen from './pages/gamification/RatingsScreen'
import AnalyticsScreen from './pages/gamification/AnalyticsScreen'
import AnnouncementsScreen from './pages/gamification/AnnouncementsScreen'
import SpeakersScreen from './pages/gamification/SpeakersScreen'
import LearningPathsScreen from './pages/gamification/LearningPathsScreen'

// Pages - Engagement Center & Admin
import EngagementCenterScreen from './pages/engagement-center/engagementCenterScreen.jsx'
import AdminDashboardScreen from './pages/admin/AdminDashboardScreen.jsx'
import AdminRBACDashboard from './pages/admin/AdminRBACDashboard.jsx'

// Components
import PrivateRoute from './components/Auth/PrivateRoute'
import BottomNavigation from './components/layout/BottomNavigation'

// AI Features
import AIAssistant from './components/ai/AIAssistant'
import AIEventRecommendations from './components/ai/AIEventRecommendations'
import AISessionSummary from './components/ai/AISessionSummary'
import AIQuizGenerator from './components/ai/AIQuizGenerator'
import AIPerfectNetworkMatch from './components/ai/AIPerfectNetworkMatch'

const App = () => {
  const { isAuthenticated } = useAuthStore();
  const [userProfile, setUserProfile] = useState(null);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff'
          }
        }}
      />

      <Router>
        <Routes>
          {/* ============================================================================
              ✅ PUBLIC ROUTES - No authentication required
              ============================================================================ */}

          {/* Splash/Landing Screen */}
          <Route path="/" element={<SplashScreen />} />

          {/* ============================================================================
              AUTHENTICATION ROUTES
              ============================================================================ */}

          {/* Login Screen */}
           <Route element={<LoginScreen />} path="/login" />

          {/* Register Screen */}
          <Route element={<RegisterScreen />} path="/register" />

          {/* Email Verification Screen (Optional - auto-verified for MVP) */}
          <Route element={<VerifyEmailScreen />} path="/verify-email"/>

          {/* Complete Profile Screen (Optional) */}
          <Route element={<CompleteProfileScreen />} path="/complete-profile"/>

          {/* ============================================================================
              ✅ PROTECTED ROUTES - Authentication required
              ============================================================================ */}

          {/* ============================================================================
              MAIN ROUTES - Core App Pages
              ============================================================================ */}

          {/* Home Screen */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <HomeScreen />
              </PrivateRoute>
            }
          />

          {/* Sessions Screen */}
          <Route
            path="/sessions"
            element={
              <PrivateRoute>
                <SessionsScreen />
              </PrivateRoute>
            }
          />

          {/* Hub Screen */}
          <Route
            path="/hub"
            element={
              <PrivateRoute>
                <HubScreen />
              </PrivateRoute>
            }
          />

          {/* Networking Screen */}
          <Route
            path="/networking"
            element={
              <PrivateRoute>
                <NetworkingScreen />
              </PrivateRoute>
            }
          />

          {/* Profile Screen */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfileScreen />
              </PrivateRoute>
            }
          />

          {/* Picbot Screen */}
          <Route
            path="/picbot"
            element={
              <PrivateRoute>
                <PicbotScreen />
              </PrivateRoute>
            }
          />

          {/* ============================================================================
              ENGAGEMENT ROUTES - Social & Community
              ============================================================================ */}

          {/* Social Wall Screen */}
          <Route
            path="/social-wall"
            element={
              <PrivateRoute>
                <SocialWallScreen />
              </PrivateRoute>
            }
          />

          {/* Activity Hub Screen */}
          <Route
            path="/activity-hub"
            element={
              <PrivateRoute>
                <ActivityHubScreen />
              </PrivateRoute>
            }
          />

          {/* AI Matches Screen */}
          <Route
            path="/ai-matches"
            element={
              <PrivateRoute>
                <AIMatchesScreen />
              </PrivateRoute>
            }
          />

          {/* Partners Screen */}
          <Route
            path="/partners"
            element={
              <PrivateRoute>
                <PartnersScreen />
              </PrivateRoute>
            }
          />

          {/* Briefcase Screen */}
          <Route
            path="/briefcase"
            element={
              <PrivateRoute>
                <BriefcaseScreen />
              </PrivateRoute>
            }
          />

          {/* ============================================================================
              GAMIFICATION & LEARNING ROUTES
              ============================================================================ */}

          {/* Ratings Screen */}
          <Route
            path="/ratings"
            element={
              <PrivateRoute>
                <RatingsScreen />
              </PrivateRoute>
            }
          />

          {/* Analytics Screen */}
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <AnalyticsScreen />
              </PrivateRoute>
            }
          />

          {/* Announcements Screen */}
          <Route
            path="/announcements"
            element={
              <PrivateRoute>
                <AnnouncementsScreen />
              </PrivateRoute>
            }
          />

          {/* Speakers Screen */}
          <Route
            path="/speakers"
            element={
              <PrivateRoute>
                <SpeakersScreen />
              </PrivateRoute>
            }
          />

          {/* Learning Paths Screen */}
          <Route
            path="/learning-paths"
            element={
              <PrivateRoute>
                <LearningPathsScreen />
              </PrivateRoute>
            }
          />

          {/* ============================================================================
              ENGAGEMENT CENTER & ADMIN ROUTES
              ============================================================================ */}

          {/* Engagement Center Screen (Polls, Quizzes, Activities) */}
          <Route
            path="/engagement-center"
            element={
              <PrivateRoute>
                <EngagementCenterScreen />
              </PrivateRoute>
            }
          />

          {/* Admin Dashboard Screen */}
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly={true}>
                <AdminDashboardScreen />
              </PrivateRoute>
            }
          />
          {/* Admin RBAC Dashboard */}
          <Route
            path="/admin/rbac"
            element={
              <PrivateRoute adminOnly={true}>
                <AdminRBACDashboard />
              </PrivateRoute>
            }
          />

          {/* ============================================================================
              AI FEATURES ROUTES
              ============================================================================ */}
          
          <Route 
            path="/discover" 
            element={
              <PrivateRoute>
                <AIEventRecommendations userProfile={userProfile} />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/sessions/:id/summary" 
            element={
              <PrivateRoute>
                <AISessionSummary />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/sessions/:id/quiz" 
            element={
              <PrivateRoute>
                <AIQuizGenerator sessionTitle="Session Name" />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/network-matches" 
            element={
              <PrivateRoute>
                <AIPerfectNetworkMatch />
              </PrivateRoute>
            } 
          />

          {/* ============================================================================
              FALLBACK ROUTE - Catch-all redirect
              ============================================================================ */}

          {/* Redirect unknown routes based on auth status */}
          <Route
            path="*"
            element={
              <Navigate
                to={isAuthenticated ? "/home" : "/"}
                replace
              />
            }
          />
        </Routes>
        <BottomNavigation />
      </Router>

      {/* AI Assistant Floating Widget - REMOVED the userProfile condition */}
      <AIAssistant />
    </div>
  )
}

export default App