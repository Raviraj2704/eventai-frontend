// ============================================================================
// Main App Component with Routing - FIXED
// ============================================================================
// File: src/App.jsx
// Purpose: Root component with React Router setup and authentication flow
// Status: Production-Ready ✅

import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Store
import { useAuthStore } from './store/authStore';

// Pages - Auth
import SplashScreen from './pages/auth/SplashScreen';
import LoginScreen from './pages/auth/LoginScreen';
import RegisterScreen from './pages/auth/RegisterScreen';
import VerifyEmailScreen from './pages/auth/VerifyEmailScreen';
import CompleteProfileScreen from './pages/auth/CompleteProfileScreen';

// Pages - Main
import HomeScreen from './pages/main/HomeScreen';
import SessionsScreen from './pages/main/SessionsScreen';
import HubScreen from './pages/main/HubScreen';
import NetworkingScreen from './pages/main/NetworkingScreen';
import ProfileScreen from './pages/main/ProfileScreen';

// Pages - Engagement
import SocialWallScreen from './pages/engagement/SocialWallScreen';
import ActivityHubScreen from './pages/engagement/ActivityHubScreen';
import AIMatchesScreen from './pages/engagement/AIMatchesScreen';
import PartnersScreen from './pages/engagement/PartnersScreen';
import BriefcaseScreen from './pages/engagement/BriefcaseScreen';

// Pages - Gamification & Learning
import RatingsScreen from './pages/gamification/RatingsScreen';
import AnalyticsScreen from './pages/gamification/AnalyticsScreen';
import AnnouncementsScreen from './pages/gamification/AnnouncementsScreen';
import SpeakersScreen from './pages/gamification/SpeakersScreen';
import LearningPathsScreen from './pages/gamification/LearningPathsScreen';

// Pages - Engagement Center & Admin
import EngagementCenterScreen from './pages/engagement-center/engagementCenterScreen.jsx';
import AdminDashboardScreen from './pages/admin/AdminDashboardScreen.jsx';
import AdminRBACDashboard from './pages/admin/AdminRBACDashboard.jsx';

// Components
import PrivateRoute from './components/Auth/PrivateRoute';
import BottomNavigation from './components/layout/BottomNavigation';

// AI Features
import AIAssistant from './components/ai/AIAssistant';
import AIEventRecommendations from './components/ai/AIEventRecommendations';
import AISessionSummary from './components/ai/AISessionSummary';
import AIQuizGenerator from './components/ai/AIQuizGenerator';
import AIPerfectNetworkMatch from './components/ai/AIPerfectNetworkMatch';

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
    h('div', { style: { textAlign: 'center' } }, h('p', null, 'Loading...'))
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
  const { isAuthenticated } = useAuthStore();
  const [userProfile] = useState(null);

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