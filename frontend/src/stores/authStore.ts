import { create } from 'zustand';
import { User } from '@types';
import { authService } from '@services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.login(email, password);
      set({
        user: result.user,
        token: result.token,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      token: null,
      error: null,
    });
  },

  initialize: () => {
    const user = authService.getStoredUser();
    const token = localStorage.getItem('auth_token');
    if (user && token) {
      set({ user, token });
    }
  },
}));
