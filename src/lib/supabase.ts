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

// Mock demo users (Students use anonymous local device mode without personal data or external accounts)
export const DEMO_USERS: Record<string, AppUser> = {
  student: {
    id: 'local_student_device',
    email: '',
    fullName: 'Học sinh KHTN (Chế độ Riêng tư)',
    role: 'student',
    grade: 8,
    school: '',
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
    if (raw) {
      const parsed = JSON.parse(raw) as AppUser;
      // If it is not the teacher/admin account, strictly enforce anonymous local student profile (no student PII)
      if (parsed && parsed.role !== 'admin' && parsed.role !== 'teacher') {
        const grade = (parsed.grade as any) || 8;
        return {
          id: 'local_student_device',
          email: '',
          fullName: `Học sinh Khối ${grade} (Chế độ Riêng tư)`,
          role: 'student',
          grade,
          school: '',
        };
      }
      return parsed;
    }
  } catch {
    // fallback
  }
  // Default to anonymous local student session (no account creation required)
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

export async function loginWithEmail(email: string, _role: 'student' | 'teacher' = 'student'): Promise<AppUser> {
  const isOwner = email.trim().toLowerCase() === 'hoang08shh@gmail.com';
  const user: AppUser = isOwner
    ? DEMO_USERS.teacher
    : {
        ...DEMO_USERS.student,
      };

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
    // Store student progress 100% locally on the student's browser to protect student privacy
    localStorage.setItem(`${STORAGE_KEY_PROGRESS}_${progress.userId}`, JSON.stringify(progress));
  } catch (err) {
    console.error('Failed to save progress:', err);
  }
}

export function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  let cleaned = url.trim();

  // If user pasted full <iframe ... src="..."> snippet, extract src attribute
  const iframeSrcMatch = cleaned.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    cleaned = iframeSrcMatch[1].trim();
  }

  // Clean legacy accidental "k3_" prefix added before an 11-char YouTube ID (making 14 chars total)
  cleaned = cleaned
    .replace(/([?&]v=|youtu\.be\/|embed\/|shorts\/|live\/)k3_([a-zA-Z0-9_-]{11})(?![a-zA-Z0-9_-])/g, '$1$2')
    .replace(/^k3_([a-zA-Z0-9_-]{11})$/, '$1');

  if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) {
    return `https://www.youtube.com/embed/${cleaned}`;
  }

  const regExp =
    /(?:youtube(?:-nocookie)?\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = cleaned.match(regExp);
  return match && match[1] ? `https://www.youtube.com/embed/${match[1]}` : null;
}


