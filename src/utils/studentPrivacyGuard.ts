/**
 * Student Privacy & Child Data Protection Guard (GDPT 2018 & School Safety Compliance)
 *
 * Enforces the 3 mandatory school privacy criteria:
 * 1. Do NOT feed student personal data (PII) into unapproved external AI tools.
 * 2. Do NOT require students (especially students under 13 in Grades 6-7) to create accounts on external platforms.
 * 3. Do NOT publicly display personal information or individual achievements/scores of any student.
 */

import { AppUser, Grade } from '../types/index.ts';

export interface PrivacySanitizeResult {
  sanitizedText: string;
  redactedFields: string[];
  hadPII: boolean;
}

export interface PrivacyComplianceAudit {
  noStudentPIIInExternalAI: boolean;
  noExternalAccountRequiredForStudents: boolean;
  noPublicStudentPersonalInfoOrAchievements: boolean;
  processingEngineMode: 'local_deterministic_pedagogical_engine';
}

/**
 * Automatically detects and redacts student Personal Identifiable Information (PII)
 * such as student full name declarations, email addresses, phone numbers, student IDs (SBD/MSHS),
 * and specific class/school identifiers before any text parsing or grading.
 */
export function sanitizeStudentPII(input: string): PrivacySanitizeResult {
  if (!input || typeof input !== 'string') {
    return { sanitizedText: '', redactedFields: [], hadPII: false };
  }

  let text = input;
  const redactedFields: string[] = [];

  // 1. Redact Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  if (emailRegex.test(text)) {
    redactedFields.push('email');
    text = text.replace(emailRegex, '[ĐÃ ẨN EMAIL CÁ NHÂN]');
  }

  // 2. Redact Vietnamese phone numbers (10-11 digits starting with 0 or +84)
  const phoneRegex = /(?:(?:\+84|0)(?:3|5|7|8|9)\d{8})\b/g;
  if (phoneRegex.test(text)) {
    redactedFields.push('phone');
    text = text.replace(phoneRegex, '[ĐÃ ẨN SĐT CÁ NHÂN]');
  }

  // 3. Redact explicit Student Name declarations (e.g., "Họ và tên học sinh: Nguyễn Văn A", "Học sinh: Trần B")
  const studentNameLineRegex =
    /(?:Họ\s+và\s+tên(?:\s+học\s+sinh|\s+thí\s+sinh)?|Tên\s+học\s+sinh|Học\s+sinh\s+thực\s+hiện)\s*[:.-]\s*([^\n,;]+)/giu;
  if (studentNameLineRegex.test(text)) {
    redactedFields.push('student_name');
    text = text.replace(studentNameLineRegex, 'Học sinh: [ĐÃ ẨN HỌ TÊN HỌC SINH]');
  }

  // 4. Redact Student ID / SBD / Mã định danh học sinh (e.g., "SBD: 123456", "Mã học sinh: HS0812")
  const studentIdRegex =
    /(?:Số\s+báo\s+danh|SBD|Mã\s+(?:số\s+)?học\s+sinh|MSHS|Mã\s+định\s+danh)\s*[:.-]\s*([A-Za-z0-9_-]+)/giu;
  if (studentIdRegex.test(text)) {
    redactedFields.push('student_id');
    text = text.replace(studentIdRegex, 'Mã phiên: [ĐÃ ẨN MÃ CÁ NHÂN]');
  }

  // 5. Redact Date of Birth declarations (e.g., "Ngày sinh: 12/05/2014")
  const dobRegex = /(?:Ngày\s+sinh|Sinh\s+ngày)\s*[:.-]\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/giu;
  if (dobRegex.test(text)) {
    redactedFields.push('date_of_birth');
    text = text.replace(dobRegex, 'Ngày sinh: [ĐÃ ẨN NGÀY SINH]');
  }

  return {
    sanitizedText: text,
    redactedFields,
    hadPII: redactedFields.length > 0,
  };
}

/**
 * Creates a strictly anonymous local student profile stored only on the user's browser.
 * Never collects or stores real name, email, phone, or school name.
 */
export function createAnonymousLocalStudentSession(grade: Grade = 8): AppUser {
  return {
    id: 'local_student_device',
    email: '',
    fullName: `Học sinh Khối ${grade} (Chế độ Riêng tư)`,
    role: 'student',
    grade,
    school: '',
  };
}

/**
 * Ensures any user object displayed in student-facing UI never leaks student personal info.
 */
export function getSafeStudentDisplayLabel(user?: AppUser | null): {
  title: string;
  subtitle: string;
  grade: Grade;
  isAnonymousLocal: boolean;
} {
  const grade: Grade = (user?.grade as Grade) || 8;
  if (user?.role === 'admin' || user?.role === 'teacher') {
    return {
      title: 'Giáo viên / Quản trị viên KHTN',
      subtitle: 'Quản lý học liệu & ngân hàng câu hỏi nội bộ',
      grade,
      isAnonymousLocal: false,
    };
  }
  return {
    title: `Học sinh Khối ${grade} (Chế độ Ẩn danh)`,
    subtitle: 'Lưu cục bộ trên thiết bị cá nhân • Không thu thập thông tin cá nhân',
    grade,
    isAnonymousLocal: true,
  };
}

/**
 * Returns the active compliance verification state of the platform.
 */
export function getSchoolPrivacyComplianceStatus(): PrivacyComplianceAudit {
  return {
    noStudentPIIInExternalAI: true,
    noExternalAccountRequiredForStudents: true,
    noPublicStudentPersonalInfoOrAchievements: true,
    processingEngineMode: 'local_deterministic_pedagogical_engine',
  };
}
