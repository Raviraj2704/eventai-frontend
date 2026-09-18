import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ============================================================================
      // STATE
      // ============================================================================
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      loading: false,
      
      // ============================================================================
      // ACTIONS
      // ============================================================================
      
      checkAuth: () => {
        try {
          const token = localStorage.getItem('access_token');
          const userStr = localStorage.getItem('user_data');
          
          if (token && userStr && userStr !== 'undefined' && userStr !== 'null') {
            set({
              token: token,
              user: JSON.parse(userStr),
              isAuthenticated: true
            });
            console.log('✅ User restored from localStorage');
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_data');
          }
        } catch (error) {
          console.error('❌ Auth check error:', error);
          set({ isAuthenticated: false });
        }
      },
      
      login: (accessToken, refreshToken, userData) => {
        console.log('🔐 Logging in user:', userData?.email);
        
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken || '');
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        set({
          token: accessToken,
          refreshToken: refreshToken || null,
          user: userData,
          isAuthenticated: true,
          loading: false
        });
      },
      
      registerUser: async (userData) => {
        set({ loading: true });
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://event-ai-backend-o2f3.onrender.com';
          const response = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });
          
          const data = await response.json();
          if (!response.ok) throw new Error(data.detail || 'Registration failed');
          
          set({ loading: false });
          return { success: true, data };
        } catch (error) {
          console.error('❌ Registration error:', error);
          set({ loading: false });
          throw error;
        }
      },
      
      logout: () => {
        console.log('👋 Logging out user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          loading: false
        });
      },
      
      updateProfile: (userData) => {
        console.log('📝 Updating profile');
        const updatedUser = { ...get().user, ...userData };
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      },
      
      setLoading: (loading) => set({ loading }),
      
      setToken: (token) => {
        localStorage.setItem('access_token', token);
        set({ token });
      }
    }),
    {
      name: 'eventai-auth-store',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        console.log('💾 Rehydrating auth store from localStorage');
      }
    }
  )
);