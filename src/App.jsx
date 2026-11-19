// ============================================================================
// Main App Component with Routing
// File: src/App.jsx
// Purpose: Root component with React Router setup, auth flow, and lazy loading
// ============================================================================

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';

// Store
import { useAuthStore } from './store/authStore';

// Components (non-lazy, needed immediately)
import PrivateRoute from './components/Auth/PrivateRoute';
import BottomNavigation from './components/layout/BottomNavigation';
import AIAssistant from './components/ai/AIAssistant';
import LoadingSpinner from './components/common/LoadingSpinner';
import NotificationsScreen from './pages/main/NotificationsScreen';

// ============================================================================
// LAZY LOADED PAGES (code splitting)
// ============================================================================

// Pages - Auth
const SplashScreen = lazy(() => import('./pages/auth/SplashScreen'));
const LoginScreen = lazy(() => import('./pages/auth/LoginScreen'));
const RegisterScreen = lazy(() => import('./pages/auth/RegisterScreen'));
const VerifyEmailScreen = lazy(() => import('./pages/auth/VerifyEmailScreen'));
const CompleteProfileScreen = lazy(() => import('./pages/auth/CompleteProfileScreen'));
const FeedbackScreen = lazy(() => import('./pages/main/FeedbackScreen'));
const ChatListScreen = lazy(() => import('./pages/chat/ChatListScreen'));
const ChatDetailScreen = lazy(() => import('./pages/chat/ChatDetailScreen'));

// Pages - Main
const HomeScreen = lazy(() => import('./pages/main/HomeScreen'));
const SessionsScreen = lazy(() => import('./pages/main/SessionsScreen'));
const HubScreen = lazy(() => import('./pages/main/HubScreen'));
const NetworkingScreen = lazy(() => import('./pages/main/NetworkingScreen'));
const ProfileScreen = lazy(() => import('./pages/main/ProfileScreen'));
const SessionQuizPage = lazy(() => import('./pages/main/SessionQuizPage'));
const EventInfoScreen = lazy(() => import('./pages/main/EventInfoScreen'));
const SessionDetailScreen = lazy(() => import('./pages/main/SessionDetailScreen'));
const MyCalendarScreen = lazy(() => import('./pages/main/MyCalendarScreen'));
const MyContactsScreen = lazy(() => import('./pages/main/MyContactsScreen'));
const MyMeetingsScreen = lazy(() => import('./pages/main/MyMeetingsScreen'));
const MyBadgeScreen = lazy(() => import('./pages/main/MyBadgeScreen'));
const MyFavouritesScreen = lazy(() => import('./pages/main/MyFavouritesScreen'));
const LeaderboardScreen = lazy(() => import('./pages/main/LeaderboardScreen'));
const PrivacyPolicyScreen = lazy(() => import('./pages/main/PrivacyPolicyScreen'));
const TermsScreen = lazy(() => import('./pages/main/TermsScreen'));

// Pages - Engagement
const SocialWallScreen = lazy(() => import('./pages/engagement/SocialWallScreen'));
const ActivityHubScreen = lazy(() => import('./pages/engagement/ActivityHubScreen'));
const AIMatchesScreen = lazy(() => import('./pages/engagement/AIMatchesScreen'));
const PartnersScreen = lazy(() => import('./pages/engagement/PartnersScreen'));
const PartnerDetailScreen = lazy(() => import('./pages/engagement/PartnerDetailScreen'));
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
// ERROR BOUNDARY (Prevents Blank White Screen)
// ============================================================================

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white max-w-[390px] mx-auto px-5 flex flex-col items-center justify-center text-center font-sans text-slate-800">
          <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-6 w-full">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-2">
              Unable to load view
            </h2>
            <p className="text-[13px] text-slate-500 mb-5">
              A temporary loading issue occurred. Tap below to reload cleanly.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-2.5 rounded-[12px] bg-[#0000c8] text-white text-[13px] font-bold hover:bg-blue-900 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
        background: '#f3f4f6',
      },
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

function AppContent() {
  const { isAuthenticated, logout } = useAuthStore();
  const [userProfile] = useState(null);
  const location = useLocation();
  const authed = typeof isAuthenticated === 'function' ? Boolean(isAuthenticated()) : Boolean(isAuthenticated);

  useEffect(() => {
    const handleTokenExpiration = () => {
      logout();
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
          color: '#fff',
        },
      },
    }),
    h(Analytics),
    h(
      RouteErrorBoundary,
      null,
      h(
        Suspense,
        { fallback: h(LoadingFallback) },
        h(
          Routes,
          null,
          // Public routes
          h(Route, { path: '/', element: h(SplashScreen) }),
          h(Route, { path: '/login', element: h(LoginScreen) }),
          h(Route, { path: '/register', element: h(RegisterScreen) }),
          h(Route, { path: '/verify-email', element: h(VerifyEmailScreen) }),
          h(Route, { path: '/complete-profile', element: h(CompleteProfileScreen) }),
          h(Route, { path: '/privacy', element: h(PrivacyPolicyScreen) }),
          h(Route, { path: '/terms', element: h(TermsScreen) }),

          // Main protected routes
          h(Route, { path: '/home', element: wrapPrivate(HomeScreen) }),
          h(Route, { path: '/sessions', element: wrapPrivate(SessionsScreen) }),
          h(Route, { path: '/hub', element: wrapPrivate(HubScreen) }),
          h(Route, { path: '/networking', element: wrapPrivate(NetworkingScreen) }),
          h(Route, { path: '/profile', element: wrapPrivate(ProfileScreen) }),
          h(Route, { path: '/event-info', element: wrapPrivate(EventInfoScreen) }),
          h(Route, { path: '/sessions/:id', element: wrapPrivate(SessionDetailScreen) }),
          h(Route, { path: '/feedback', element: wrapPrivate(FeedbackScreen) }),
          h(Route, { path: '/my-calendar', element: wrapPrivate(MyCalendarScreen) }),
          h(Route, { path: '/my-contacts', element: wrapPrivate(MyContactsScreen) }),
          h(Route, { path: '/my-meetings', element: wrapPrivate(MyMeetingsScreen) }),
          h(Route, { path: '/my-badges', element: wrapPrivate(MyBadgeScreen) }),
          h(Route, { path: '/my-favourites', element: wrapPrivate(MyFavouritesScreen) }),
          h(Route, { path: '/notifications', element: wrapPrivate(NotificationsScreen) }),
          h(Route, { path: '/leaderboard', element: wrapPrivate(LeaderboardScreen) }),

          // Chat routes
          h(Route, { path: '/chat', element: wrapPrivate(ChatListScreen) }),
          h(Route, { path: '/chat/:id', element: wrapPrivate(ChatDetailScreen) }),

          // Engagement routes
          h(Route, { path: '/social-wall', element: wrapPrivate(SocialWallScreen) }),
          h(Route, { path: '/activity-hub', element: wrapPrivate(ActivityHubScreen) }),
          h(Route, { path: '/ai-matches', element: wrapPrivate(AIMatchesScreen) }),
          h(Route, { path: '/partners', element: wrapPrivate(PartnersScreen) }),
          h(Route, { path: '/partners/:partnerId', element: wrapPrivate(PartnerDetailScreen) }),
          h(Route, { path: '/briefcase', element: wrapPrivate(BriefcaseScreen) }),
          h(Route, { path: '/polls', element: h(Navigate, { to: '/engagement-center', replace: true }) }),

          // Gamification & learning routes
          h(Route, { path: '/ratings', element: wrapPrivate(RatingsScreen) }),
          h(Route, { path: '/analytics', element: wrapPrivate(AnalyticsScreen) }),
          h(Route, { path: '/announcements', element: wrapPrivate(AnnouncementsScreen) }),
          h(Route, { path: '/speakers', element: wrapPrivate(SpeakersScreen) }),
          h(Route, { path: '/learning-paths', element: wrapPrivate(LearningPathsScreen) }),

          // Engagement Center & admin routes
          h(Route, { path: '/engagement-center', element: wrapPrivate(EngagementCenterScreen) }),
          h(Route, { path: '/admin', element: wrapPrivate(AdminDashboardScreen, null, true) }),
          h(Route, { path: '/admin/rbac', element: wrapPrivate(AdminRBACDashboard, null, true) }),

          // AI feature routes
          h(Route, {
            path: '/discover',
            element: wrapPrivate(AIEventRecommendations, { userProfile: userProfile }),
          }),
          h(Route, { path: '/sessions/:id/summary', element: wrapPrivate(AISessionSummary) }),
          h(Route, { path: '/sessions/:id/quiz', element: wrapPrivate(SessionQuizPage) }),
          h(Route, { path: '/network-matches', element: wrapPrivate(AIPerfectNetworkMatch) }),

          // Fallback route
          h(Route, {
            path: '*',
            element: h(Navigate, { to: authed ? '/home' : '/', replace: true }),
          })
        )
      )
    ),
    authed && h(BottomNavigation),
    // FIX: Only show AI Assistant on the Home Screen
    authed && location.pathname === '/home' && h(AIAssistant, { userProfile: userProfile })
  );
}

function App() {
  return h(Router, null, h(AppContent));
}

export default App;