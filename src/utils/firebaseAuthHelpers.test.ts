import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFirebaseAuthErrorCode,
  formatFirebaseAuthError,
  truncateUtf8Bytes,
} from './firebaseAuthHelpers';

test('extractFirebaseAuthErrorCode parses FirebaseError objects and raw messages', () => {
  assert.equal(
    extractFirebaseAuthErrorCode({ code: 'auth/popup-blocked', message: 'Popup blocked' }),
    'auth/popup-blocked'
  );
  assert.equal(
    extractFirebaseAuthErrorCode(new Error('Firebase: Error (auth/unauthorized-domain).')),
    'auth/unauthorized-domain'
  );
  assert.equal(
    extractFirebaseAuthErrorCode('auth/network-request-failed happened'),
    'auth/network-request-failed'
  );
  assert.equal(extractFirebaseAuthErrorCode(null), 'auth/unknown');
});

test('formatFirebaseAuthError handles unauthorized-domain with exact hostname and Firebase Console link', () => {
  const report = formatFirebaseAuthError(
    new Error('Firebase: Error (auth/unauthorized-domain).'),
    {
      hostname: 'my-custom-site.vercel.app',
      inIframe: false,
      projectId: 'decisive-chess-1xhgq',
    }
  );
  assert.equal(report.code, 'auth/unauthorized-domain');
  assert.equal(report.unauthorizedHost, 'my-custom-site.vercel.app');
  assert.match(report.message, /my-custom-site\.vercel\.app/);
  assert.equal(
    report.firebaseConsoleAuthUrl,
    'https://console.firebase.google.com/project/decisive-chess-1xhgq/authentication/settings'
  );
});

test('formatFirebaseAuthError suggests opening in new tab for popup-blocked and iframe restrictions', () => {
  const popupReport = formatFirebaseAuthError(
    { code: 'auth/popup-blocked' },
    { hostname: 'ais-dev.run.app', inIframe: true, projectId: 'decisive-chess-1xhgq' }
  );
  assert.equal(popupReport.code, 'auth/popup-blocked');
  assert.equal(popupReport.shouldSuggestNewTab, true);
  assert.match(popupReport.hint || '', /tab mới/i);

  const storageReport = formatFirebaseAuthError(
    { code: 'auth/web-storage-unsupported' },
    { inIframe: true }
  );
  assert.equal(storageReport.shouldSuggestNewTab, true);

  const internalReport = formatFirebaseAuthError(
    { code: 'auth/internal-error' },
    { inIframe: true }
  );
  assert.equal(internalReport.shouldSuggestNewTab, true);
});

test('formatFirebaseAuthError preserves Vietnamese admin email mismatch message', () => {
  const err = Object.assign(
    new Error('Tài khoản Google (other@gmail.com) không có quyền Quản trị viên.'),
    { code: 'auth/admin-email-mismatch' }
  );
  const report = formatFirebaseAuthError(err, { adminEmail: 'hoang08shh@gmail.com' });
  assert.equal(report.code, 'auth/admin-email-mismatch');
  assert.match(report.message, /other@gmail\.com/);
  assert.match(report.hint || '', /hoang08shh@gmail\.com/);
});

test('truncateUtf8Bytes strictly enforces UTF-8 byte budget for Vietnamese diacritics', () => {
  const vnText = 'Bài giảng Khoa học Tự nhiên lớp 8 — Phương trình hóa học & Định luật Ohm. '.repeat(200);
  const maxBytes = 1000;
  const truncated = truncateUtf8Bytes(vnText, maxBytes);
  const actualBytes = new TextEncoder().encode(truncated).byteLength;
  assert.ok(actualBytes <= maxBytes, `Expected <= ${maxBytes} bytes, got ${actualBytes}`);
  assert.ok(actualBytes > maxBytes - 10, `Expected close to byte limit, got ${actualBytes}`);
  // Must not leave broken replacement characters when decoded
  assert.equal(truncated.includes('\uFFFD'), false);
});
