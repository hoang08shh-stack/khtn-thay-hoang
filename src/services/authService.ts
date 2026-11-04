import { supabase, isSupabaseConfigured, DEMO_USERS, withTimeout } from '../lib/supabase.ts';
import { AppUser, Grade } from '../types/index.ts';
import { UserRole } from '../types/supabase.ts';

const STORAGE_KEY_AUTH = 'khtn_hoang_user';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  grade?: Grade;
  school?: string;
}

export function isHoangAdminEmail(email?: string | null): boolean {
  return Boolean(email && email.trim().toLowerCase() === 'hoang08shh@gmail.com');
}

/**
 * Fetch user profile and assigned role from Supabase PostgreSQL
 */
export async function fetchUserProfileAndRole(userId: string, userEmail?: string): Promise<{ profile: any; role: UserRole }> {
  const isOwnerEmail = isHoangAdminEmail(userEmail);

  if (!supabase) {
    return { profile: null, role: isOwnerEmail ? 'admin' : 'student' };
  }

  try {
    // 1. Fetch Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 2. Fetch all roles for user and pick highest privilege
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roleList = (rolesData || []).map((r: any) => r.role as UserRole);
    let resolvedRole: UserRole = 'student';
    if (isOwnerEmail || roleList.includes('admin')) {
      resolvedRole = 'admin';
    } else if (roleList.includes('teacher')) {
      resolvedRole = 'teacher';
    }

    return {
      profile: profile || null,
      role: resolvedRole,
    };
  } catch (err) {
    console.error('Error fetching user profile & role:', err);
    return { profile: null, role: isOwnerEmail ? 'admin' : 'student' };
  }
}

/**
 * Sign In with Supabase Auth (or mock demo user if unconfigured)
 */
export async function signInWithEmail(email: string, password: string): Promise<AppUser> {
  const normalizedEmail = email.trim().toLowerCase();

  // Direct owner admin login for hoang08shh@gmail.com
  if (isHoangAdminEmail(normalizedEmail)) {
    const adminUser: AppUser = {
      ...DEMO_USERS.teacher,
      email: 'hoang08shh@gmail.com',
      role: 'admin',
    };
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(adminUser));
    return adminUser;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error }: any = await withTimeout(
        supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        }),
        1500,
        'Supabase auth timeout'
      );

      if (!error && data.user) {
        const { profile, role } = await fetchUserProfileAndRole(data.user.id, data.user.email || normalizedEmail);

        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email || normalizedEmail,
          fullName: profile?.full_name || data.user.user_metadata?.full_name || normalizedEmail.split('@')[0],
          role: role,
          grade: (profile?.grade as Grade) || 8,
          school: profile?.school || 'THCS Đà Nẵng, Việt Nam',
          avatarUrl: profile?.avatar_url || undefined,
        };

        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(appUser));
        return appUser;
      }

      if (error && !error.message?.toLowerCase().includes('fetch')) {
        console.warn('Supabase auth error:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase auth network unreachable, using local session:', err);
    }
  }

  // Fallback demo auth for student accounts
  const demoUser: AppUser =
    normalizedEmail === DEMO_USERS.student.email.toLowerCase()
      ? DEMO_USERS.student
      : {
          id: `student_${Date.now()}`,
          email: normalizedEmail,
          fullName: normalizedEmail.split('@')[0],
          role: 'student',
          grade: 8,
          school: 'THCS Đà Nẵng, Việt Nam',
        };

  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(demoUser));
  return demoUser;
}

/**
 * Sign Up with Supabase Auth.
 * Trigger on auth.users automatically inserts into public.profiles and public.user_roles ('student')
 */
export async function signUpWithEmail(data: SignUpData): Promise<AppUser> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            grade: data.grade || 8,
            school: data.school || 'THCS',
          },
        },
      });

      if (!error && authData.user) {
        // Role is guaranteed 'student' by database trigger
        const appUser: AppUser = {
          id: authData.user.id,
          email: authData.user.email || data.email,
          fullName: data.fullName,
          role: 'student',
          grade: data.grade || 8,
          school: data.school || 'THCS',
        };

        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(appUser));
        return appUser;
      }

      if (error && !error.message?.toLowerCase().includes('fetch')) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      if (!err.message?.toLowerCase().includes('fetch')) {
        throw err;
      }
      console.warn('Supabase sign up network unreachable, falling back to local account:', err);
    }
  }

  // Fallback demo signup
  const newDemoUser: AppUser = {
    id: `student_${Date.now()}`,
    email: data.email,
    fullName: data.fullName,
    role: 'student',
    grade: data.grade || 8,
    school: data.school || 'THCS',
  };

  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newDemoUser));
  return newDemoUser;
}

/**
 * Sign Out from Supabase Auth & Clear Local Session
 */
export async function signOutUser(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY_AUTH);
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
}

/**
 * Update user profile in Supabase
 */
export async function updateUserProfile(userId: string, updates: { fullName?: string; grade?: Grade; school?: string; avatarUrl?: string }): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase
      .from('profiles')
      .update({
        full_name: updates.fullName,
        grade: updates.grade,
        school: updates.school,
        avatar_url: updates.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  // Update cached local user
  const raw = localStorage.getItem(STORAGE_KEY_AUTH);
  if (raw) {
    try {
      const user = JSON.parse(raw);
      const updated = { ...user, ...updates };
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}
