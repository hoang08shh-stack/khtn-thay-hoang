import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getInitialUser, withTimeout } from '../lib/supabase.ts';
import { AppUser, Grade } from '../types/index.ts';
import { UserRole } from '../types/supabase.ts';
import {
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  fetchUserProfileAndRole,
  updateUserProfile as apiUpdateProfile,
  SignUpData,
} from '../services/authService.ts';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  role: UserRole;
  isLoading: boolean;
  isSupabaseActive: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  register: (data: SignUpData) => Promise<AppUser>;
  logout: () => Promise<void>;
  updateProfile: (updates: { fullName?: string; grade?: Grade; school?: string; avatarUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(getInitialUser);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth session and listen to changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const res: any = await withTimeout(
            supabase.auth.getSession(),
            1500,
            'Session fetch timeout'
          );
          const currentSession = res?.data?.session;
          if (mounted && currentSession) {
            setSession(currentSession);
            const { profile, role } = await fetchUserProfileAndRole(currentSession.user.id, currentSession.user.email);
            setUser({
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              fullName: profile?.full_name || currentSession.user.user_metadata?.full_name || 'Học viên KHTN',
              role,
              grade: (profile?.grade as Grade) || 8,
              school: profile?.school || 'THCS',
              avatarUrl: profile?.avatar_url || undefined,
            });
          }
        } catch (err) {
          console.error('Supabase getSession error:', err);
        }
      }
      if (mounted) setIsLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event: string, newSession: any) => {
          if (!mounted) return;
          setSession(newSession);

          if (newSession?.user) {
            const { profile, role } = await fetchUserProfileAndRole(newSession.user.id, newSession.user.email);
            setUser({
              id: newSession.user.id,
              email: newSession.user.email || '',
              fullName: profile?.full_name || newSession.user.user_metadata?.full_name || 'Học viên KHTN',
              role,
              grade: (profile?.grade as Grade) || 8,
              school: profile?.school || 'THCS',
              avatarUrl: profile?.avatar_url || undefined,
            });
          } else if (_event === 'SIGNED_OUT') {
            setUser(null);
          }
        }
      );

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<AppUser> => {
    setIsLoading(true);
    try {
      const authenticatedUser = await signInWithEmail(email, password);
      setUser(authenticatedUser);
      return authenticatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: SignUpData): Promise<AppUser> => {
    setIsLoading(true);
    try {
      const newUser = await signUpWithEmail(data);
      setUser(newUser);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await signOutUser();
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (updates: { fullName?: string; grade?: Grade; school?: string; avatarUrl?: string }) => {
    if (!user) return;
    await apiUpdateProfile(user.id, updates);
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role: user?.role || 'student',
        isLoading,
        isSupabaseActive: isSupabaseConfigured,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
