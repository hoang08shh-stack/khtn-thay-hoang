import test from 'node:test';
import assert from 'node:assert';
import {
  sanitizeStudentPII,
  createAnonymousLocalStudentSession,
  getSafeStudentDisplayLabel,
  getSchoolPrivacyComplianceStatus,
} from './studentPrivacyGuard.ts';

test('StudentPrivacyGuard: sanitizeStudentPII redacts student name, email, phone, SBD, and DOB', () => {
  const rawInput = `Họ và tên học sinh: Nguyễn Văn Minh
SBD: HS80129
Ngày sinh: 15/08/2014
Liên hệ: hocsinh.khtn@gmail.com hoặc 0912345678
Câu 1. Hòa tan 6,5 gam Zn vào dung dịch HCl dư thu được bao nhiêu lít khí H2?`;

  const result = sanitizeStudentPII(rawInput);
  assert.strictEqual(result.hadPII, true);
  assert.ok(result.redactedFields.includes('student_name'));
  assert.ok(result.redactedFields.includes('student_id'));
  assert.ok(result.redactedFields.includes('date_of_birth'));
  assert.ok(result.redactedFields.includes('email'));
  assert.ok(result.redactedFields.includes('phone'));

  // Ensure actual PII values are completely removed
  assert.ok(!result.sanitizedText.includes('Nguyễn Văn Minh'));
  assert.ok(!result.sanitizedText.includes('HS80129'));
  assert.ok(!result.sanitizedText.includes('15/08/2014'));
  assert.ok(!result.sanitizedText.includes('hocsinh.khtn@gmail.com'));
  assert.ok(!result.sanitizedText.includes('0912345678'));

  // Ensure scientific content is preserved intact
  assert.ok(result.sanitizedText.includes('Hòa tan 6,5 gam Zn vào dung dịch HCl dư'));
});

test('StudentPrivacyGuard: createAnonymousLocalStudentSession requires zero personal info or external account', () => {
  const sessionGrade6 = createAnonymousLocalStudentSession(6);
  assert.strictEqual(sessionGrade6.email, '');
  assert.strictEqual(sessionGrade6.school, '');
  assert.strictEqual(sessionGrade6.role, 'student');
  assert.strictEqual(sessionGrade6.grade, 6);
  assert.ok(sessionGrade6.fullName.includes('Chế độ Riêng tư'));
});

test('StudentPrivacyGuard: getSafeStudentDisplayLabel masks any student personal name or email from public display', () => {
  const label = getSafeStudentDisplayLabel({
    id: 'any',
    email: 'secret@gmail.com',
    fullName: 'Lê Hoàng Nam',
    role: 'student',
    grade: 7,
    school: 'THCS Đà Nẵng',
  });

  assert.ok(!label.title.includes('Lê Hoàng Nam'));
  assert.ok(!label.subtitle.includes('secret@gmail.com'));
  assert.strictEqual(label.isAnonymousLocal, true);
  assert.strictEqual(label.grade, 7);
});

test('StudentPrivacyGuard: getSchoolPrivacyComplianceStatus confirms all 3 school safety criteria', () => {
  const status = getSchoolPrivacyComplianceStatus();
  assert.strictEqual(status.noStudentPIIInExternalAI, true);
  assert.strictEqual(status.noExternalAccountRequiredForStudents, true);
  assert.strictEqual(status.noPublicStudentPersonalInfoOrAchievements, true);
  assert.strictEqual(status.processingEngineMode, 'local_deterministic_pedagogical_engine');
});
