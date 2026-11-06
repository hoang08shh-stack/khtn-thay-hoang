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

  if (isSupabaseConfigured && supabase && normalizedEmail.endsWith('@khtn.edu.vn')) {
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
          fullName: profile?.full_name || 'Giáo viên KHTN',
          role: role === 'admin' ? 'admin' : 'teacher',
          grade: (profile?.grade as Grade) || 8,
          school: profile?.school || 'THCS Đà Nẵng, Việt Nam',
        };

        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(appUser));
        return appUser;
      }
    } catch (err: any) {
      console.warn('Supabase auth network unreachable, using local session:', err);
    }
  }

  // Students use anonymous local device mode without personal email or full name
  const localStudentUser: AppUser = {
    id: 'local_student_device',
    email: '',
    fullName: 'Học sinh KHTN (Chế độ Riêng tư)',
    role: 'student',
    grade: 8,
    school: '',
  };

  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(localStudentUser));
  return localStudentUser;
}

/**
 * Configures local anonymous student study mode by grade.
 * Strictly DOES NOT create any account on external platforms (Supabase/Google/etc.)
 * and DOES NOT store student personal information (no name, no email, no school).
 */
export async function signUpWithEmail(data: SignUpData): Promise<AppUser> {
  const selectedGrade: Grade = data.grade || 8;
  const anonymousStudent: AppUser = {
    id: 'local_student_device',
    email: '',
    fullName: `Học sinh Khối ${selectedGrade} (Chế độ Riêng tư)`,
    role: 'student',
    grade: selectedGrade,
    school: '',
  };

  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(anonymousStudent));
  return anonymousStudent;
}

/**
 * Sign Out from Admin Session & Return to Local Anonymous Student Mode
 */
export async function signOutUser(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY_AUTH);
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
}

/**
 * Update local user preferences (e.g., selected Grade for student) without sending student PII externally
 */
export async function updateUserProfile(_userId: string, updates: { fullName?: string; grade?: Grade; school?: string; avatarUrl?: string }): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEY_AUTH);
  try {
    const current = raw ? (JSON.parse(raw) as AppUser) : DEMO_USERS.student;
    if (current.role === 'student') {
      const nextGrade = updates.grade || current.grade || 8;
      const safeStudent: AppUser = {
        id: 'local_student_device',
        email: '',
        fullName: `Học sinh Khối ${nextGrade} (Chế độ Riêng tư)`,
        role: 'student',
        grade: nextGrade,
        school: '',
      };
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(safeStudent));
      return;
    }
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
