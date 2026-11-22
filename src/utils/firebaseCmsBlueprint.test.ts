import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toSafeFirestoreDocId,
  buildFirestoreLessonDoc,
  buildFirestoreTopicDoc,
  buildFirestoreVideoDoc,
  buildFirestoreCatalogDoc,
  buildFirestoreResourceDoc,
  buildFirestoreQuestionDoc,
  buildFirestoreQuizDoc,
  buildFirestoreMetaDoc,
} from '../services/firebaseCmsService.ts';

const VALID_ID_RE = /^[a-zA-Z0-9_\-]+$/;
const NOW_SENTINEL = { _methodName: 'serverTimestamp' };
const EXISTING_CREATED_AT = { toDate: () => new Date('2026-01-01T00:00:00Z') };

test('toSafeFirestoreDocId strips unsafe chars and enforces 1..128 regex invariant', () => {
  const sanitized = toSafeFirestoreDocId('bai 88 / hoa.hoc?test');
  assert.match(sanitized, VALID_ID_RE);
  assert.ok(sanitized.length >= 1 && sanitized.length <= 128);

  const oversized = toSafeFirestoreDocId('a'.repeat(300));
  assert.equal(oversized.length, 128);
  assert.match(oversized, VALID_ID_RE);

  const emptyFallback = toSafeFirestoreDocId('   ');
  assert.match(emptyFallback, VALID_ID_RE);
});

test('buildFirestoreLessonDoc enforces blueprint schema, isPublic == isPublished, size caps, and immutable ownerUid/createdAt', () => {
  const hugeImgHtml = `<p>Kiến thức trọng tâm</p><img src="data:image/png;base64,${'A'.repeat(420000)}" />`;
  const created = buildFirestoreLessonDoc(
    {
      id: 'bai-88-word',
      topicId: 'topic-8-1',
      grade: 8,
      domain: 'hoa-hoc',
      code: 'Bài 88',
      slug: 'bai-88-word',
      title: 'T'.repeat(500),
      summary: 'S'.repeat(3000),
      content: 'C'.repeat(500),
      durationMinutes: 45,
      orderIndex: 2,
      isPublished: true,
      videoUrl: 'idb://local-only-video',
      coreWordDoc: {
        id: 'cw-1',
        fileName: 'Bai88.docx',
        fileUrl: '/assets/uploads/bai88.docx',
        htmlContent: hugeImgHtml,
      },
      assets: Array.from({ length: 60 }, (_, idx) => ({
        id: `a-${idx}`,
        title: `File ${idx}`,
        format: 'pdf',
        type: 'Phiếu học tập',
        fileSize: '1 MB',
        fileUrl: idx === 0 ? 'data:application/pdf;base64,abc' : `/assets/uploads/f${idx}.pdf`,
      })),
      simulationIds: Array.from({ length: 40 }, (_, i) => `sim-${i}`),
    },
    'uid_admin_1',
    undefined,
    NOW_SENTINEL
  );

  assert.equal(created.docId, 'bai-88-word');
  assert.equal(created.data.title.length, 300);
  assert.equal(created.data.summary.length, 2000);
  assert.equal(created.data.isPublished, true);
  assert.equal(created.data.isPublic, true);
  assert.equal(created.data.videoUrl, '');
  assert.equal(created.data.assets.length, 50);
  assert.equal(created.data.assets[0].fileUrl, '#');
  assert.equal(created.data.simulationIds.length, 30);
  assert.ok(created.data.coreWordDoc.htmlContent.length < 1000, 'Oversized inline data image should be stripped');
  assert.equal(created.data.ownerUid, 'uid_admin_1');
  assert.equal(created.data.createdAt, NOW_SENTINEL);
  assert.equal(created.data.updatedAt, NOW_SENTINEL);

  // Update preserves immutable createdAt and ownerUid, and mirrors draft status into isPublic = false
  const updated = buildFirestoreLessonDoc(
    { id: 'bai-88-word', title: 'Draft', grade: 8, domain: 'hoa-hoc', isPublished: false },
    'uid_admin_2',
    { createdAt: EXISTING_CREATED_AT, ownerUid: 'uid_admin_1' },
    NOW_SENTINEL
  );
  assert.equal(updated.data.isPublic, false);
  assert.equal(updated.data.ownerUid, 'uid_admin_1');
  assert.equal(updated.data.createdAt, EXISTING_CREATED_AT);
  assert.equal(updated.data.updatedAt, NOW_SENTINEL);
});

test('buildFirestoreMetaDoc & other entity builders enforce allowed keys and bounded lists', () => {
  const meta = buildFirestoreMetaDoc(
    {
      updatedAt: '2026-11-22T10:00:00.000Z',
      siteSettings: { siteName: 'KHTN', unexpectedField: 'drop-me' },
      deletedIds: { lessons: ['l1', 'l1', 'l2'], extraKey: ['nope'] },
    },
    'uid_admin_1',
    4,
    { createdAt: EXISTING_CREATED_AT, ownerUid: 'uid_admin_1' },
    NOW_SENTINEL
  );
  assert.equal(meta.id, 'live');
  assert.equal(meta.revision, 5);
  assert.equal(meta.isPublic, true);
  assert.equal('unexpectedField' in meta.siteSettings, false);
  assert.deepEqual(meta.deletedIds.lessons, ['l1', 'l2']);
  assert.equal('extraKey' in meta.deletedIds, false);
  assert.equal(meta.createdAt, EXISTING_CREATED_AT);

  const topic = buildFirestoreTopicDoc({ id: 't1', grade: 99, domain: 'invalid', title: 'Chủ đề 1' }, 'u1', undefined, NOW_SENTINEL);
  assert.equal(topic.data.grade, 8);
  assert.equal(topic.data.domain, 'vat-li');

  const video = buildFirestoreVideoDoc({ id: 'v1', grade: 7, domain: 'sinh-hoc', title: 'Video 1' }, 'u1', undefined, NOW_SENTINEL);
  assert.equal(video.data.isPublic, true);

  const catDoc = buildFirestoreCatalogDoc({ id: 'd1', grade: 6, domain: 'vat-li', format: 'exe', title: 'Doc 1' }, 'u1', undefined, NOW_SENTINEL);
  assert.equal(catDoc.data.format, 'pdf');

  const res = buildFirestoreResourceDoc('unified', { id: 'r1', fileDataUrl: 'data:application/pdf;base64,xyz', title: 'R1' }, 'u1', undefined, NOW_SENTINEL);
  assert.equal(res.data.payload.fileDataUrl, '#');

  const q = buildFirestoreQuestionDoc({ id: 'q1', grade: 8, domain: 'hoa-hoc', question: 'H2O là gì?', imageUrl: 'data:image/png;base64,123' }, 'u1', undefined, NOW_SENTINEL);
  assert.equal(q.data.payload.imageUrl, '');

  const quiz = buildFirestoreQuizDoc({ id: 'qz1', grade: 9, domain: 'vat-li', title: 'Quiz 1', isPublished: false }, 'u1', undefined, NOW_SENTINEL);
  assert.equal(quiz.data.isPublic, false);
});
