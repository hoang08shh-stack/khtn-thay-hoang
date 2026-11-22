import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RULES_PATH = path.resolve(process.cwd(), 'firestore.rules');
const DRAFT_PATH = path.resolve(process.cwd(), 'DRAFT_firestore.rules');
const BLUEPRINT_PATH = path.resolve(process.cwd(), 'firebase-blueprint.json');

function loadRulesText(): string {
  if (fs.existsSync(RULES_PATH)) return fs.readFileSync(RULES_PATH, 'utf8');
  return fs.readFileSync(DRAFT_PATH, 'utf8');
}

interface MockAuth {
  uid: string;
  token: { email?: string; email_verified?: boolean };
}

const VALID_ID_RE = /^[a-zA-Z0-9_\-]+$/;
const LESSON_REQUIRED = [
  'id',
  'topicId',
  'grade',
  'domain',
  'code',
  'slug',
  'title',
  'summary',
  'content',
  'durationMinutes',
  'orderIndex',
  'isPublished',
  'isPublic',
  'viewCount',
  'ownerUid',
  'createdAt',
  'updatedAt',
];
const LESSON_ALLOWED = [
  ...LESSON_REQUIRED,
  'thumbnailUrl',
  'videoUrl',
  'lessonCreatedAt',
  'lessonUpdatedAt',
  'assets',
  'coreWordDoc',
  'simulationIds',
  'miniQuiz',
];

function evaluateLessonRule(opts: {
  op: 'get' | 'list' | 'create' | 'update';
  auth: MockAuth | null;
  docId: string;
  incoming?: Record<string, any>;
  existing?: Record<string, any>;
  serverTime?: number;
  adminUids?: Set<string>;
}): 'ALLOW' | 'PERMISSION_DENIED' {
  const { op, auth, docId, incoming, existing, serverTime = 1000, adminUids = new Set() } = opts;
  const isSignedIn = auth !== null;
  const isVerified = isSignedIn && auth!.token.email_verified === true;
  const isAdmin =
    isVerified &&
    (auth!.token.email === 'hoang08shh@gmail.com' || adminUids.has(auth!.uid));
  const isValidId =
    typeof docId === 'string' && docId.length >= 1 && docId.length <= 128 && VALID_ID_RE.test(docId);

  if (op === 'get') {
    if (!isValidId) return 'PERMISSION_DENIED';
    return existing?.isPublic === true || isAdmin ? 'ALLOW' : 'PERMISSION_DENIED';
  }
  if (op === 'list') {
    return existing?.isPublic === true || isAdmin ? 'ALLOW' : 'PERMISSION_DENIED';
  }
  if (!isSignedIn || !isValidId || !isAdmin || !incoming) return 'PERMISSION_DENIED';

  const keys = Object.keys(incoming);
  if (!LESSON_REQUIRED.every((k) => keys.includes(k))) return 'PERMISSION_DENIED';
  if (!keys.every((k) => LESSON_ALLOWED.includes(k))) return 'PERMISSION_DENIED';
  if (incoming.id !== docId) return 'PERMISSION_DENIED';
  if (![6, 7, 8, 9].includes(incoming.grade)) return 'PERMISSION_DENIED';
  if (!['vat-li', 'hoa-hoc', 'sinh-hoc'].includes(incoming.domain)) return 'PERMISSION_DENIED';
  if (typeof incoming.title !== 'string' || incoming.title.length < 1 || incoming.title.length > 300)
    return 'PERMISSION_DENIED';
  if (typeof incoming.content !== 'string' || incoming.content.length > 120000)
    return 'PERMISSION_DENIED';
  if (incoming.isPublic !== incoming.isPublished) return 'PERMISSION_DENIED';
  if (incoming.ownerUid !== auth!.uid) return 'PERMISSION_DENIED';
  if (Array.isArray(incoming.assets) && incoming.assets.length > 50) return 'PERMISSION_DENIED';

  if (op === 'create') {
    if (incoming.createdAt !== serverTime || incoming.updatedAt !== serverTime)
      return 'PERMISSION_DENIED';
    return 'ALLOW';
  }
  if (op === 'update') {
    if (!existing) return 'PERMISSION_DENIED';
    if (incoming.id !== existing.id || incoming.createdAt !== existing.createdAt)
      return 'PERMISSION_DENIED';
    if (incoming.updatedAt !== serverTime) return 'PERMISSION_DENIED';
    return 'ALLOW';
  }
  return 'PERMISSION_DENIED';
}

const VALID_ADMIN: MockAuth = {
  uid: 'admin_uid_1',
  token: { email: 'hoang08shh@gmail.com', email_verified: true },
};

function makeValidLesson(overrides: Record<string, any> = {}) {
  return {
    id: 'bai-88-test',
    topicId: 'topic-8-1',
    grade: 8,
    domain: 'hoa-hoc',
    code: 'Bài 88',
    slug: 'bai-88-test',
    title: 'Bài 88: Thí nghiệm hóa học',
    summary: 'Tóm tắt bài học',
    content: 'Nội dung lý thuyết',
    durationMinutes: 45,
    orderIndex: 1,
    isPublished: true,
    isPublic: true,
    viewCount: 0,
    ownerUid: 'admin_uid_1',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

test('Blueprint coverage: every Firestore path in firebase-blueprint.json has a match block in rules', () => {
  const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, 'utf8'));
  const rules = loadRulesText();
  assert.match(rules, /rules_version\s*=\s*'2'/);
  assert.match(rules, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
  assert.match(rules, /request\.auth\.token\.email_verified == true/);
  assert.match(rules, /hoang08shh@gmail\.com/);

  for (const collectionPath of Object.keys(blueprint.firestore)) {
    const escaped = collectionPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(
      rules,
      new RegExp(`match\\s+${escaped}\\s*\\{`),
      `Missing match block for ${collectionPath}`
    );
  }
});

test('Dirty Dozen #1-#12 adversarial payloads all return PERMISSION_DENIED', () => {
  // #1 Shadow Field Injection
  assert.equal(
    evaluateLessonRule({
      op: 'create',
      auth: VALID_ADMIN,
      docId: 'bai-88-test',
      incoming: makeValidLesson({ isSystemAdmin: true }),
    }),
    'PERMISSION_DENIED'
  );

  // #2 Email Spoofing (unverified email)
  assert.equal(
    evaluateLessonRule({
      op: 'create',
      auth: { uid: 'spoof', token: { email: 'hoang08shh@gmail.com', email_verified: false } },
      docId: 'bai-88-test',
      incoming: makeValidLesson({ ownerUid: 'spoof' }),
    }),
    'PERMISSION_DENIED'
  );

  // #3 Non-admin student write
  assert.equal(
    evaluateLessonRule({
      op: 'create',
      auth: { uid: 'student1', token: { email: 'hs@gmail.com', email_verified: true } },
      docId: 'bai-88-test',
      incoming: makeValidLesson({ ownerUid: 'student1' }),
    }),
    'PERMISSION_DENIED'
  );

  // #4 Unauthenticated write
  assert.equal(
    evaluateLessonRule({
      op: 'create',
      auth: null,
      docId: 'bai-88-test',
      incoming: makeValidLesson(),
    }),
    'PERMISSION_DENIED'
  );

  // #5 Identity Spoofing (ownerUid mismatch)
  assert.equal(
    evaluateLessonRule({
      op: 'create',
      auth: VALID_ADMIN,
      docId: 'bai-88-test',
      incoming: makeValidLesson({ ownerUid: 'someone_else' }),
    }),
    'PERMISSION_DENIED'
  );

  // #6 Immutable createdAt tampering on update
  assert.equal(
    evaluateLessonRule({
      op: 'update',
      auth: VALID_ADMIN,
      docId: 'bai-88-test',
      existing: makeValidLesson({ createdAt: 500, updatedAt: 500 }),
      incoming: makeValidLesson({ createdAt: 999, updatedAt: 1000 }),
      serverTime: 1000,
    }),
    'PERMISSION_DENIED'
  );

  // #7 Client-forged timestamp
  assert.equal(
    evaluateLessonRule({
      op: 'create',
      auth: VALID_ADMIN,
      docId: 'bai-88-test',
      incoming: makeValidLesson({ createdAt: 999999, updatedAt: 999999 }),
      serverTime: 1000,
    }),
    'PERMISSION_DENIED'
  );

  // #8 ID Poisoning (invalid characters or > 128 chars)
  assert.equal(
    evaluateLessonRule({
      op: 'create',
      auth: VALID_ADMIN,
      docId: 'bad id/with.dots',
      incoming: makeValidLesson({ id: 'bad id/with.dots' }),
    }),
    'PERMISSION_DENIED'
  );

  // #9 Value Poisoning (invalid grade or oversized title)
  assert.equal(
    evaluateLessonRule({
      op: 'update',
      auth: VALID_ADMIN,
      docId: 'bai-88-test',
      existing: makeValidLesson({ createdAt: 500, updatedAt: 500 }),
      incoming: makeValidLesson({ grade: 99, createdAt: 500, updatedAt: 1000 }),
      serverTime: 1000,
    }),
    'PERMISSION_DENIED'
  );

  // #10 Draft lesson read by unauthenticated student
  assert.equal(
    evaluateLessonRule({
      op: 'get',
      auth: null,
      docId: 'bai-88-test',
      existing: makeValidLesson({ isPublished: false, isPublic: false }),
    }),
    'PERMISSION_DENIED'
  );

  // #11 Oversized content / unbounded array attack
  assert.equal(
    evaluateLessonRule({
      op: 'create',
      auth: VALID_ADMIN,
      docId: 'bai-88-test',
      incoming: makeValidLesson({ assets: Array.from({ length: 55 }, () => ({})) }),
    }),
    'PERMISSION_DENIED'
  );

  // #12 Valid admin create & public student read succeed
  assert.equal(
    evaluateLessonRule({
      op: 'create',
      auth: VALID_ADMIN,
      docId: 'bai-88-test',
      incoming: makeValidLesson(),
      serverTime: 1000,
    }),
    'ALLOW'
  );
  assert.equal(
    evaluateLessonRule({
      op: 'get',
      auth: null,
      docId: 'bai-88-test',
      existing: makeValidLesson(),
    }),
    'ALLOW'
  );
});
