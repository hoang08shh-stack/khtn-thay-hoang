import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppUser, UserProgress } from '../types/index.ts';
import { Database } from '../types/supabase.ts';

// Supabase environment keys (configured via Cloudflare Pages or .env)
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('example') &&
  !supabaseUrl.includes('mtqvwocpvufaujmtto')
);

// Safe typed Supabase client
export const supabase: any = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Promise timeout helper to prevent hanging if remote Supabase DNS is down or unconfigured
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs = 2000, errorMsg = 'Network timeout'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs)),
  ]);
}

// Mock demo users
export const DEMO_USERS: Record<string, AppUser> = {
  student: {
    id: 'user_student_demo',
    email: 'hocsinh.khtn@gmail.com',
    fullName: 'Nguyễn Văn Minh (Học sinh Lớp 8A1)',
    role: 'student',
    grade: 8,
    school: 'THCS Đà Nẵng, Việt Nam',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  },
  teacher: {
    id: 'user_teacher_hoang',
    email: 'hoang08shh@gmail.com',
    fullName: 'Quản trị viên KHOA HỌC SỐ KHTN',
    role: 'admin',
    school: 'Đà Nẵng, Việt Nam',
    avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=256&q=80',
  },
};

const STORAGE_KEY_AUTH = 'khtn_hoang_user';
const STORAGE_KEY_PROGRESS = 'khtn_hoang_progress';

export function getInitialUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  // Default to student demo user for immediate great first impression
  return DEMO_USERS.student;
}

export function getInitialProgress(userId: string): UserProgress {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PROGRESS}_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {
    userId,
    completedLessons: ['khtn-8-bai-5', 'khtn-8-bai-8'],
    quizScores: {
      'quiz-acid-8': { score: 9, total: 10, date: '2026-10-25' },
      'quiz-atom-7': { score: 10, total: 10, date: '2026-10-27' },
    },
    completedSimulations: ['sim-atom-bohr', 'sim-electric-circuit'],
    bookmarkedLessons: ['khtn-9-bai-8'],
    badges: ['badge_explorer', 'badge_lab_pioneer'],
    studyTimeMinutes: 145,
    lastActive: new Date().toISOString(),
  };
}

export async function loginWithEmail(email: string, role: 'student' | 'teacher' = 'student'): Promise<AppUser> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123',
      });
      if (!error && data.user) {
        const user: AppUser = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: data.user.user_metadata?.full_name || 'Học viên KHTN',
          role: (data.user.user_metadata?.role as any) || role,
          grade: 8,
        };
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
        return user;
      }
    } catch {
      // fallback to mock
    }
  }

  // Fallback demo auth
  const user = email.includes('hoang') ? DEMO_USERS.teacher : {
    id: `user_${Date.now()}`,
    email,
    fullName: email.split('@')[0],
    role: email.includes('hoang') ? 'admin' : 'student',
    grade: 8,
    school: 'THCS Đà Nẵng, Việt Nam',
  } as AppUser;

  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
  return user;
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH);
  if (isSupabaseConfigured && supabase) {
    supabase.auth.signOut().catch(() => {});
  }
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PROGRESS}_${progress.userId}`, JSON.stringify(progress));
    // If Supabase is active, sync to Postgres
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('user_progress')
        .upsert({
          user_id: progress.userId,
          completed_lessons: progress.completedLessons,
          quiz_scores: progress.quizScores,
          completed_simulations: progress.completedSimulations,
          updated_at: new Date().toISOString(),
        })
        .then(() => {});
    }
  } catch (err) {
    console.error('Failed to save progress:', err);
  }
}

export function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  if (url.includes('youtube.com/embed/')) return url;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
}

