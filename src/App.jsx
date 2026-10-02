// ============================================================================
// Main App Component with Routing - FIXED FOR 5G SPEED (CODE SPLITTING)
// ============================================================================
// File: src/App.jsx
// Purpose: Root component with React Router setup, auth flow, and lazy loading
// Status: Production-Ready ✅

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';

// Store
import { useAuthStore } from './store/authStore';

// Components (Non-lazy for immediate core layout)
import PrivateRoute from './components/Auth/PrivateRoute';
import BottomNavigation from './components/layout/BottomNavigation';
import AIAssistant from './components/ai/AIAssistant';
import LoadingSpinner from './components/common/LoadingSpinner';

// ============================================================================
// LAZY LOADED PAGES (Code Splitting for instant initial load)
// ============================================================================

// Pages - Auth
const SplashScreen = lazy(() => import('./pages/auth/SplashScreen'));
const LoginScreen = lazy(() => import('./pages/auth/LoginScreen'));
const RegisterScreen = lazy(() => import('./pages/auth/RegisterScreen'));
const VerifyEmailScreen = lazy(() => import('./pages/auth/VerifyEmailScreen'));
const CompleteProfileScreen = lazy(() => import('./pages/auth/CompleteProfileScreen'));

// Pages - Main
const HomeScreen = lazy(() => import('./pages/main/HomeScreen'));
const SessionsScreen = lazy(() => import('./pages/main/SessionsScreen'));
const HubScreen = lazy(() => import('./pages/main/HubScreen'));
const NetworkingScreen = lazy(() => import('./pages/main/NetworkingScreen'));
const ProfileScreen = lazy(() => import('./pages/main/ProfileScreen'));

// Pages - Engagement
const SocialWallScreen = lazy(() => import('./pages/engagement/SocialWallScreen'));
const ActivityHubScreen = lazy(() => import('./pages/engagement/ActivityHubScreen'));
const AIMatchesScreen = lazy(() => import('./pages/engagement/AIMatchesScreen'));
const PartnersScreen = lazy(() => import('./pages/engagement/PartnersScreen'));
const BriefcaseScreen = lazy(() => import('./pages/engagement/BriefcaseScreen'));

// Pages - Gamification & Learning
const RatingsScreen = lazy(() => import('./pages/gamification/RatingsScreen'));
const AnalyticsScreen = lazy(() => import('./pages/gamification/AnalyticsScreen'));
const AnnouncementsScreen = lazy(() => import('./pages/gamification/AnnouncementsScreen'));
const SpeakersScreen = lazy(() => import('./pages/gamification/SpeakersScreen'));
const LearningPathsScreen = lazy(() => import('./pages/gamification/LearningPathsScreen'));

// Pages - Engagement Center & Admin
const EngagementCenterScreen = lazy(() => import('./pages/engagement-center/engagementCenterScreen.jsx'));
const AdminDashboardScreen = lazy(() => import('./pages/admin/AdminDashboardScreen.jsx'));
const AdminRBACDashboard = lazy(() => import('./pages/admin/AdminRBACDashboard.jsx'));

// AI Features Screens
const AIEventRecommendations = lazy(() => import('./components/ai/AIEventRecommendations'));
const AISessionSummary = lazy(() => import('./components/ai/AISessionSummary'));
const AIQuizGenerator = lazy(() => import('./components/ai/AIQuizGenerator'));
const AIPerfectNetworkMatch = lazy(() => import('./components/ai/AIPerfectNetworkMatch'));

// ============================================================================
// ROUTING ENGINE
// ============================================================================

const h = React.createElement;

function LoadingFallback() {
  return h(
    'div',
    {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f3f4f6'
      }
    },
    h(LoadingSpinner, { fullScreen: true })
  );
}

function wrapPrivate(Component, props, adminOnly) {
  return h(
    PrivateRoute,
    adminOnly ? { adminOnly: true } : null,
    h(Component, props || null)
  );
}

function App() {
  // Grab logout from the store to handle state cleanup
  const { isAuthenticated, logout } = useAuthStore();
  const [userProfile] = useState(null);

  // Listen for the custom 401 Unauthorized event from apiClient.js
  useEffect(() => {
    const handleTokenExpiration = () => {
      logout(); // Clears Zustand state, triggering a clean redirect to /login
      toast.error('Session expired. Please log in again.');
    };

    window.addEventListener('auth-token-expired', handleTokenExpiration);
    return () => window.removeEventListener('auth-token-expired', handleTokenExpiration);
  }, [logout]);

  return h(
    'div',
    { className: 'min-h-screen bg-white dark:bg-slate-950' },
    h(Toaster, {
      position: 'top-right',
      reverseOrder: false,
      toastOptions: {
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#fff'
        }
      }
    }),
    h(
      Router,
      null,
      h(
        Suspense,
        { fallback: h(LoadingFallback) },
        h(
          Routes,
          null,
          // Public Routes
          h(Route, { path: '/', element: h(SplashScreen) }),
          h(Route, { path: '/login', element: h(LoginScreen) }),
          h(Route, { path: '/register', element: h(RegisterScreen) }),
          h(Route, { path: '/verify-email', element: h(VerifyEmailScreen) }),
          h(Route, { path: '/complete-profile', element: h(CompleteProfileScreen) }),

          // Main Protected Routes
          h(Route, { path: '/home', element: wrapPrivate(HomeScreen) }),
          h(Route, { path: '/sessions', element: wrapPrivate(SessionsScreen) }),
          h(Route, { path: '/hub', element: wrapPrivate(HubScreen) }),
          h(Route, { path: '/networking', element: wrapPrivate(NetworkingScreen) }),
          h(Route, { path: '/profile', element: wrapPrivate(ProfileScreen) }),

          // Engagement Routes
          h(Route, { path: '/social-wall', element: wrapPrivate(SocialWallScreen) }),
          h(Route, { path: '/activity-hub', element: wrapPrivate(ActivityHubScreen) }),
          h(Route, { path: '/ai-matches', element: wrapPrivate(AIMatchesScreen) }),
          h(Route, { path: '/partners', element: wrapPrivate(PartnersScreen) }),
          h(Route, { path: '/briefcase', element: wrapPrivate(BriefcaseScreen) }),

          // Gamification & Learning Routes
          h(Route, { path: '/ratings', element: wrapPrivate(RatingsScreen) }),
          h(Route, { path: '/analytics', element: wrapPrivate(AnalyticsScreen) }),
          h(Route, { path: '/announcements', element: wrapPrivate(AnnouncementsScreen) }),
          h(Route, { path: '/speakers', element: wrapPrivate(SpeakersScreen) }),
          h(Route, { path: '/learning-paths', element: wrapPrivate(LearningPathsScreen) }),

          // Engagement Center & Admin Routes
          h(Route, { path: '/engagement-center', element: wrapPrivate(EngagementCenterScreen) }),
          h(Route, { path: '/admin', element: wrapPrivate(AdminDashboardScreen, null, true) }),
          h(Route, { path: '/admin/rbac', element: wrapPrivate(AdminRBACDashboard, null, true) }),

          // AI Features Routes
          h(Route, {
            path: '/discover',
            element: wrapPrivate(AIEventRecommendations, { userProfile: userProfile })
          }),
          h(Route, { path: '/sessions/:id/summary', element: wrapPrivate(AISessionSummary) }),
          h(Route, {
            path: '/sessions/:id/quiz',
            element: wrapPrivate(AIQuizGenerator, { sessionTitle: 'Session Name' })
          }),
          h(Route, { path: '/network-matches', element: wrapPrivate(AIPerfectNetworkMatch) }),

          // Fallback Route
          h(Route, {
            path: '*',
            element: h(Navigate, { to: isAuthenticated ? '/home' : '/', replace: true })
          })
        )
      ),
      isAuthenticated && h(BottomNavigation)
    ),
    // Single Unified AI Assistant Floating Widget
    isAuthenticated && h(AIAssistant, { userProfile: userProfile })
  );
}

export default App;