import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from './authService';

/**
 * Auth Store - Zustand store for authentication state management
 * Includes user data, tokens, loading states, and auth methods
 */

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastLoginTime: null,

      // ============================================
      // ACTIONS
      // ============================================

      /**
       * Login action
       */
      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const result = await authService.login(email, password);

          if (result.success) {
            set({
              user: result.user,
              accessToken: result.access_token,
              refreshToken: result.refresh_token,
              isAuthenticated: true,
              error: null,
              lastLoginTime: new Date().toISOString(),
            });

            return { success: true };
          } else {
            set({
              error: result.error,
              isAuthenticated: false,
            });

            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error.message || 'Login failed';
          set({
            error: errorMessage,
            isAuthenticated: false,
          });

          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Register action
       */
      register: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const result = await authService.register(userData);

          if (result.success) {
            return { success: true };
          } else {
            set({ error: result.error });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error.message || 'Registration failed';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Verify email action
       */
      verifyEmail: async (email, otp) => {
        set({ isLoading: true, error: null });

        try {
          const result = await authService.verifyEmail(email, otp);

          if (result.success) {
            return { success: true };
          } else {
            set({ error: result.error });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error.message || 'Email verification failed';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Resend verification email
       */
      resendVerificationEmail: async (email) => {
        set({ isLoading: true, error: null });

        try {
          const result = await authService.resendVerificationEmail(email);

          if (result.success) {
            return { success: true };
          } else {
            set({ error: result.error });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error.message || 'Failed to resend email';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Complete profile action
       */
      completeProfile: async (profileData) => {
        set({ isLoading: true, error: null });

        try {
          const result = await authService.completeProfile(profileData);

          if (result.success) {
            // Update user with completed profile
            set((state) => ({
              user: result.data?.user || state.user,
            }));

            return { success: true };
          } else {
            set({ error: result.error });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error.message || 'Profile completion failed';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Logout action
       */
      logout: async () => {
        set({ isLoading: true, error: null });

        try {
          await authService.logout();

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
            lastLoginTime: null,
          });

          return { success: true };
        } catch (error) {
          console.error('Logout error:', error);
          
          // Force logout anyway
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            lastLoginTime: null,
          });

          return { success: true };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Refresh token action
       */
      refreshAccessToken: async () => {
        try {
          const result = await authService.refreshToken();

          if (result.success) {
            set({
              accessToken: result.access_token,
              refreshToken: result.refresh_token,
            });

            return { success: true };
          } else {
            // Refresh failed, logout user
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              error: 'Session expired',
            });

            return { success: false, error: result.error };
          }
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });

          return { success: false, error: error.message };
        }
      },

      /**
       * Request password reset
       */
      requestPasswordReset: async (email) => {
        set({ isLoading: true, error: null });

        try {
          const result = await authService.requestPasswordReset(email);

          if (result.success) {
            return { success: true };
          } else {
            set({ error: result.error });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error.message || 'Password reset request failed';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Reset password
       */
      resetPassword: async (token, newPassword) => {
        set({ isLoading: true, error: null });

        try {
          const result = await authService.resetPassword(token, newPassword);

          if (result.success) {
            return { success: true };
          } else {
            set({ error: result.error });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error.message || 'Password reset failed';
          set({ error: errorMessage });
          return { success: false, error: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      /**
       * Restore auth state from localStorage
       */
      restoreAuth: () => {
        try {
          const user = localStorage.getItem('user');
          const accessToken = localStorage.getItem('access_token');
          const refreshToken = localStorage.getItem('refresh_token');

          if (user && accessToken) {
            set({
              user: JSON.parse(user),
              accessToken,
              refreshToken,
              isAuthenticated: true,
            });

            return true;
          }

          return false;
        } catch (error) {
          console.error('Error restoring auth:', error);
          return false;
        }
      },

      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Set error
       */
      setError: (error) => {
        set({ error });
      },

      /**
       * Update user data
       */
      setUser: (user) => {
        set({ user });
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
      },

      /**
       * Hydrate store from localStorage on app load
       */
      hydrate: () => {
        try {
          const savedState = localStorage.getItem('auth-store');
          if (savedState) {
            const parsed = JSON.parse(savedState);
            set(parsed.state);
          }
        } catch (error) {
          console.error('Error hydrating auth store:', error);
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastLoginTime: state.lastLoginTime,
      }),
    }
  )
);

/**
 * Custom hook to check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated;
};

/**
 * Custom hook to get current user
 */
export const useUser = () => {
  const user = useAuthStore((state) => state.user);
  return user;
};

/**
 * Custom hook to get auth loading state
 */
export const useAuthLoading = () => {
  const isLoading = useAuthStore((state) => state.isLoading);
  return isLoading;
};

/**
 * Custom hook to get auth error
 */
export const useAuthError = () => {
  const error = useAuthStore((state) => state.error);
  return error;
};

/**
 * Custom hook to get auth actions
 */
export const useAuthActions = () => {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const register = useAuthStore((state) => state.register);

  return { login, logout, register };
};

export default useAuthStore;