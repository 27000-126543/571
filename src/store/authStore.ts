import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginResponse } from '../../shared/types';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

interface AuthState {
  user: UserWithoutPassword | undefined;
  token: string | null;
  permissions: string[];
  setAuth: (data: LoginResponse) => void;
  setUser: (user: UserWithoutPassword) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: undefined as UserWithoutPassword | undefined,
      token: null,
      permissions: [],
      setAuth: (data: LoginResponse) => {
        set({
          user: data.user,
          token: data.token,
          permissions: data.permissions,
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      },
      setUser: (user: User) => {
        set({ user });
        localStorage.setItem('user', JSON.stringify(user));
      },
      logout: () => {
        set({
          user: undefined,
          token: null,
          permissions: [],
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
      isAuthenticated: () => {
        const state = get();
        return !!state.token;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        permissions: state.permissions,
      }),
    }
  )
);
