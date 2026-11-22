import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEYS,
  buildCmsSnapshotPayload,
  fetchAndApplyRemoteCmsSnapshot,
  getGeneralUploadedAssetsSync,
  getInitialLocalLessons,
  markLocalCmsModified,
  resetAllAdminDataToDefault,
  saveAdminCatalogDoc,
  saveAdminLesson,
  saveUploadedAssetToRepository,
  syncCmsSnapshotWithReport,
} from '../services/adminService.ts';
import {
  saveUnifiedLearningResourceAsync,
  validateMaterialFileOrSource,
  WizardStep1Data,
  WizardStep2Data,
} from './materialUploadEngine.ts';
import { getAllDocumentsSync, getLessonByIdOrSlug } from '../services/contentService.ts';

function createMockLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
  };
}

function installBrowserEnv(
  fetchImpl: (input: string | URL | Request, init?: RequestInit) => Promise<Response>
) {
  const ls = createMockLocalStorage();
  const events: string[] = [];
  const win = {
    dispatchEvent(evt: Event) {
      events.push(evt.type);
      return true;
    },
  };
  (globalThis as any).localStorage = ls;
  (globalThis as any).window = win;
  (globalThis as any).fetch = fetchImpl;
  if (typeof (globalThis as any).CustomEvent === 'undefined') {
    (globalThis as any).CustomEvent = class CustomEvent extends Event {
      detail: any;
      constructor(type: string, init?: { detail?: any }) {
        super(type);
        this.detail = init?.detail;
      }
    };
  }
  return { ls, events };
}

function cleanupBrowserEnv() {
  delete (globalThis as any).localStorage;
  delete (globalThis as any).window;
  delete (globalThis as any).fetch;
}

test('validateMaterialFileOrSource blocks uploading, errored, or missing-url uploads', () => {
  const baseStep2: WizardStep2Data = {
    category: 'lecture_doc',
    title: 'Phiếu học tập KHTN 9',
    fileName: 'phieu_9.pdf',
    fileType: 'application/pdf',
    fileSize: 2048,
    uploadProgress: 50,
    uploadStatus: 'uploading',
  };

  assert.equal(validateMaterialFileOrSource(baseStep2).valid, false);
  assert.match(validateMaterialFileOrSource(baseStep2).error || '', /đang được tải lên/i);

  assert.equal(
    validateMaterialFileOrSource({
      ...baseStep2,
      uploadStatus: 'error',
      errorMessage: 'Lỗi mạng',
    }).valid,
    false
  );

  // Ready status but missing fileDataUrl / externalUrl / coreWordDoc must be rejected
  assert.equal(
    validateMaterialFileOrSource({
      ...baseStep2,
      uploadStatus: 'ready',
      fileDataUrl: undefined,
    }).valid,
    false
  );

  // Valid once fileDataUrl is present
  assert.equal(
    validateMaterialFileOrSource({
      ...baseStep2,
      uploadStatus: 'ready',
      fileDataUrl: '/assets/uploads/123_phieu_9.pdf',
    }).valid,
    true
  );
});

test('saveUploadedAssetToRepository syncs general-library uploads to /api/sync-cms-snapshot', async () => {
  const postedSnapshots: any[] = [];
  installBrowserEnv(async (input, init) => {
    const url = String(input);
    if (url.includes('/api/sync-cms-snapshot')) {
      const body = JSON.parse(String(init?.body || '{}'));
      postedSnapshots.push(body);
      return new Response(JSON.stringify({ ok: true, updatedAt: body.updatedAt }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 404 });
  });

  try {
    resetAllAdminDataToDefault();
    postedSnapshots.length = 0;

    await saveUploadedAssetToRepository({
      id: 'asset-general-sync-test',
      lessonId: 'general-library',
      title: 'Tài liệu ôn tập KHTN Lớp 7',
      format: 'pdf',
      type: 'Đề cương ôn tập',
      fileSize: '420 KB',
      fileUrl: '/assets/uploads/test_khtn7.pdf',
      fileName: 'test_khtn7.pdf',
    });

    assert.equal(postedSnapshots.length, 1, 'General library upload must trigger remote snapshot sync');
    const syncedGeneral = postedSnapshots[0].generalAssets || [];
    assert.ok(
      syncedGeneral.some((a: any) => a.id === 'asset-general-sync-test' && a.fileUrl === '/assets/uploads/test_khtn7.pdf'),
      'Synced snapshot must contain the uploaded general asset'
    );
    assert.ok(
      getGeneralUploadedAssetsSync().some((a) => a.id === 'asset-general-sync-test'),
      'General asset must be persisted locally'
    );
  } finally {
    cleanupBrowserEnv();
  }
});

test('fetchAndApplyRemoteCmsSnapshot NEVER overwrites newer local edits with an older remote snapshot', async () => {
  let serverSnapshot = buildCmsSnapshotPayload();
  serverSnapshot.updatedAt = '2025-01-01T00:00:00.000Z';
  const pushedPayloads: any[] = [];

  installBrowserEnv(async (input, init) => {
    const url = String(input);
    if (url.includes('/api/cms-snapshot')) {
      return new Response(JSON.stringify(serverSnapshot), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/api/sync-cms-snapshot')) {
      const body = JSON.parse(String(init?.body || '{}'));
      pushedPayloads.push(body);
      serverSnapshot = body;
      return new Response(JSON.stringify({ ok: true, updatedAt: body.updatedAt }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 404 });
  });

  try {
    // Seed local lessons and create a newer local catalog document without updating serverSnapshot yet
    getInitialLocalLessons();
    await saveAdminCatalogDoc({
      id: 'doc-newer-local-only',
      title: 'Tài liệu mới vừa tải lên (Chưa bị ghi đè)',
      grade: 9,
      domain: 'hoa-hoc',
      format: 'pdf',
      fileUrl: '/assets/uploads/newer_local_9.pdf',
      downloadUrl: '/assets/uploads/newer_local_9.pdf',
      fileName: 'newer_local_9.pdf',
    });

    // Simulate server still holding an OLDER snapshot timestamp
    serverSnapshot = {
      ...serverSnapshot,
      updatedAt: '2025-01-01T00:00:00.000Z',
      catalogDocs: [],
    };
    markLocalCmsModified('2030-01-01T00:00:00.000Z');
    pushedPayloads.length = 0;

    const applied = await fetchAndApplyRemoteCmsSnapshot(false);
    assert.equal(applied, false, 'Older remote snapshot must NOT overwrite newer local edits');

    const docsAfter = getAllDocumentsSync(9);
    assert.ok(
      docsAfter.some((d) => d.id === 'doc-newer-local-only'),
      'Newer local document must remain intact after remote check'
    );

    // Give background push microtask a tick to verify local state was pushed upstream
    await new Promise((r) => setTimeout(r, 20));
    assert.ok(
      pushedPayloads.length >= 1,
      'When local edits are newer than remote, client should push local edits upstream'
    );
  } finally {
    cleanupBrowserEnv();
  }
});

test('fetchAndApplyRemoteCmsSnapshot pulls newer server snapshot onto a brand-new browser session', async () => {
  let serverSnapshot: any = null;

  const { ls } = installBrowserEnv(async (input, init) => {
    const url = String(input);
    if (url.includes('/api/sync-cms-snapshot')) {
      const body = JSON.parse(String(init?.body || '{}'));
      serverSnapshot = body;
      return new Response(JSON.stringify({ ok: true, updatedAt: body.updatedAt }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/api/cms-snapshot')) {
      return new Response(JSON.stringify(serverSnapshot), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 404 });
  });

  try {
    // Teacher uploads a document + coreWordDoc to Grade 9 lesson
    const lessons = getInitialLocalLessons();
    const g9 = lessons.find((l) => l.grade === 9)!;
    assert.ok(g9, 'Expected a Grade 9 lesson');

    await saveAdminLesson(
      {
        ...g9,
        coreWordDoc: {
          id: 'core-word-g9-sync',
          fileName: 'NoiDung_KHTN9.docx',
          fileUrl: '/assets/uploads/NoiDung_KHTN9.docx',
          fileSize: '125 KB',
          htmlContent: '<p>Nội dung cốt lõi từ máy giáo viên</p>',
          uploadedAt: new Date().toISOString(),
        },
      },
      [
        ...(g9.assets || []),
        {
          id: 'asset-g9-cross-device',
          lessonId: g9.id,
          title: 'Bài giảng đồng bộ Lớp 9',
          format: 'pdf',
          type: 'Giáo án điện tử',
          fileSize: '512 KB',
          fileUrl: '/assets/uploads/BaiGiang_Lop9.pdf',
          fileName: 'BaiGiang_Lop9.pdf',
        },
      ],
      g9.simulationIds || [],
      g9.miniQuiz || []
    );

    assert.ok(serverSnapshot, 'Server snapshot should be captured');

    // Simulate a brand-new visitor / reopened link with completely empty localStorage
    ls.clear();
    // Make sure server snapshot has a strictly newer timestamp than build-time bundled snapshot
    serverSnapshot = {
      ...serverSnapshot,
      updatedAt: '2035-05-05T12:00:00.000Z',
    };

    // Even if initial render runs getInitialLocalLessons() first (seeding bundled snapshot),
    // fetchAndApplyRemoteCmsSnapshot() must still apply the newer live server snapshot
    getInitialLocalLessons();
    const applied = await fetchAndApplyRemoteCmsSnapshot(false);
    assert.equal(applied, true, 'Newer live server snapshot must be applied to fresh visitor');

    const freshLesson = await getLessonByIdOrSlug(g9.id);
    assert.ok(freshLesson, 'Lesson must load on fresh visitor');
    assert.ok(
      (freshLesson.assets || []).some((a) => a.fileUrl === '/assets/uploads/BaiGiang_Lop9.pdf'),
      'Uploaded lesson PDF must be visible after clearing localStorage and reopening link'
    );
    assert.equal(
      freshLesson.coreWordDoc?.fileUrl,
      '/assets/uploads/NoiDung_KHTN9.docx',
      'Uploaded coreWordDoc must be visible after clearing localStorage and reopening link'
    );
  } finally {
    cleanupBrowserEnv();
  }
});

test('overlapping syncCmsSnapshotWithReport calls coalesce cleanly and send the latest state last', async () => {
  const postedTitles: string[][] = [];
  let inFlightCount = 0;
  let maxConcurrent = 0;

  installBrowserEnv(async (input, init) => {
    const url = String(input);
    if (url.includes('/api/sync-cms-snapshot')) {
      inFlightCount++;
      maxConcurrent = Math.max(maxConcurrent, inFlightCount);
      const body = JSON.parse(String(init?.body || '{}'));
      await new Promise((r) => setTimeout(r, 25));
      postedTitles.push((body.catalogDocs || []).map((d: any) => d.title));
      inFlightCount--;
      return new Response(JSON.stringify({ ok: true, updatedAt: body.updatedAt }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 404 });
  });

  try {
    getInitialLocalLessons();
    const p1 = syncCmsSnapshotWithReport(false);
    // While p1 is in-flight, write a new catalog doc and fire two more overlapping sync calls
    const localDocs = JSON.parse(
      (globalThis as any).localStorage.getItem(STORAGE_KEYS.CATALOG_DOCS) || '[]'
    );
    localDocs.unshift({
      id: 'doc-coalesce-final',
      title: 'Tài liệu cuối cùng sau coalescing',
      grade: 8,
      domain: 'hoa-hoc',
      format: 'pdf',
      type: 'Phiếu học tập',
      pageCount: 2,
      fileSize: '100 KB',
      description: 'Test',
      author: 'GV',
      downloadCount: 1,
      downloadUrl: '/assets/uploads/final.pdf',
      fileUrl: '/assets/uploads/final.pdf',
    });
    (globalThis as any).localStorage.setItem(STORAGE_KEYS.CATALOG_DOCS, JSON.stringify(localDocs));
    const p2 = syncCmsSnapshotWithReport(false);
    const p3 = syncCmsSnapshotWithReport(false);

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    assert.equal(r1.ok, true);
    assert.equal(r2.ok, true);
    assert.equal(r3.ok, true);
    assert.equal(maxConcurrent, 1, 'Sync requests must never run concurrently');
    assert.equal(postedTitles.length, 2, 'Two queued calls must coalesce into 1 follow-up sync');
    assert.ok(
      postedTitles[postedTitles.length - 1].includes('Tài liệu cuối cùng sau coalescing'),
      'Final synced payload must contain the latest local mutation'
    );
  } finally {
    cleanupBrowserEnv();
  }
});

test('saveUnifiedLearningResourceAsync keeps selected lesson instead of creating an orphan lesson and awaits server sync', async () => {
  let syncedServerPayload: any = null;

  installBrowserEnv(async (input, init) => {
    const url = String(input);
    if (url.includes('/api/sync-cms-snapshot')) {
      syncedServerPayload = JSON.parse(String(init?.body || '{}'));
      return new Response(JSON.stringify({ ok: true, updatedAt: syncedServerPayload.updatedAt }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 404 });
  });

  try {
    const lessons = getInitialLocalLessons();
    const targetLesson = lessons.find((l) => l.grade === 9)!;
    assert.ok(targetLesson);

    const step1: WizardStep1Data = {
      subject: 'khtn',
      grade: 9,
      textbook: 'ket-noi-tri-thuc',
      topicId: targetLesson.topicId,
      topicTitle: 'Chủ đề Lớp 9',
      lessonId: targetLesson.id,
      lessonTitle: targetLesson.title,
    };

    const step2: WizardStep2Data = {
      category: 'lecture_doc',
      title: 'Bài 99 - Tài liệu mở rộng không có trong danh mục',
      fileName: 'mo_rong_99.pdf',
      fileType: 'application/pdf',
      fileSize: 40960,
      fileDataUrl: '/assets/uploads/mo_rong_99.pdf',
      uploadProgress: 100,
      uploadStatus: 'ready',
    };

    const { resource, synced } = await saveUnifiedLearningResourceAsync(step1, step2, 'published');
    assert.equal(synced, true);
    assert.equal(
      resource.lessonId,
      targetLesson.id,
      'Must stay bound to the teacher-selected Step 1 lesson instead of creating an orphan lesson'
    );
    assert.ok(syncedServerPayload, 'Must have synced to server before resolving');

    const syncedTarget = (syncedServerPayload.lessons || []).find(
      (l: any) => l.id === targetLesson.id
    );
    assert.ok(
      syncedTarget?.assets?.some((a: any) => a.fileUrl === '/assets/uploads/mo_rong_99.pdf'),
      'Synced server lesson must include the uploaded PDF'
    );
  } finally {
    cleanupBrowserEnv();
  }
});

test('read-only phone applies changed remote server snapshot even if previous applied timestamp was ahead (clock skew)', async () => {
  const basePayload = buildCmsSnapshotPayload();
  const g9 = basePayload.lessons.find((l) => l.grade === 9)!;
  assert.ok(g9);

  const phoneUpdatedServerSnapshot = {
    ...basePayload,
    // Even if server timestamp is earlier than a future-skewed bundled/applied timestamp,
    // a read-only phone (LOCAL_UPDATED_AT unset) MUST accept the server snapshot whenever updatedAt differs!
    updatedAt: '2026-06-01T10:00:00.000Z',
    lessons: basePayload.lessons.map((l) =>
      l.id === g9.id
        ? {
            ...l,
            assets: [
              ...(l.assets || []),
              {
                id: 'asset-phone-clock-skew',
                lessonId: g9.id,
                title: 'Tài liệu đồng bộ sang điện thoại (Clock Skew)',
                format: 'pdf',
                type: 'Giáo án điện tử',
                fileSize: '300 KB',
                fileUrl: '/assets/uploads/phone_clock_skew.pdf',
                fileName: 'phone_clock_skew.pdf',
              },
            ],
          }
        : l
    ),
  };

  const { ls } = installBrowserEnv(async (input) => {
    const url = String(input);
    if (url.includes('/api/cms-snapshot')) {
      return new Response(JSON.stringify(phoneUpdatedServerSnapshot), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 404 });
  });

  try {
    // Seed read-only phone via getInitialLocalLessons() (bundled snapshot)
    getInitialLocalLessons();
    assert.equal(
      ls.getItem(STORAGE_KEYS.LOCAL_UPDATED_AT),
      null,
      'Read-only phone MUST NOT set LOCAL_UPDATED_AT when applying bundled snapshot'
    );

    const applied = await fetchAndApplyRemoteCmsSnapshot(false);
    assert.equal(applied, true, 'Read-only phone must apply changed server snapshot');

    const lessonOnPhone = await getLessonByIdOrSlug(g9.id);
    assert.ok(
      (lessonOnPhone?.assets || []).some((a) => a.id === 'asset-phone-clock-skew'),
      'Phone must display newly synced teacher lesson PDF'
    );

    // Calling again with identical server updatedAt should be a no-op (avoid redundant re-renders)
    const appliedAgain = await fetchAndApplyRemoteCmsSnapshot(false);
    assert.equal(appliedAgain, false, 'Identical remote updatedAt should not re-apply redundantly');
  } finally {
    cleanupBrowserEnv();
  }
});

test('syncCmsSnapshotWithReport rejects HTML 200 OK SPA fallback instead of falsely reporting serverOk', async () => {
  installBrowserEnv(async (input) => {
    const url = String(input);
    if (url.includes('/api/sync-cms-snapshot')) {
      // Simulate static SPA host returning index.html with 200 OK
      return new Response('<!doctype html><html><body>SPA</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }
    return new Response('{}', { status: 404 });
  });

  try {
    getInitialLocalLessons();
    const report = await syncCmsSnapshotWithReport(false);
    assert.equal(report.ok, false, 'HTML 200 OK fallback must NOT count as successful server sync');
    assert.equal(report.target, 'local_only');
  } finally {
    cleanupBrowserEnv();
  }
});

test('fetchAndApplyRemoteCmsSnapshot falls back to static /cms-snapshot.json when /api/cms-snapshot is unavailable', async () => {
  const basePayload = buildCmsSnapshotPayload();
  const staticSnapshot = {
    ...basePayload,
    updatedAt: '2036-01-01T00:00:00.000Z',
    catalogDocs: [
      ...(basePayload.catalogDocs || []),
      {
        id: 'doc-static-fallback-phone',
        title: 'Đề cương KHTN 9 từ cms-snapshot.json tĩnh',
        grade: 9,
        domain: 'hoa-hoc',
        format: 'pdf',
        type: 'Đề cương ôn tập',
        pageCount: 4,
        fileSize: '210 KB',
        description: 'Fallback test',
        author: 'GV',
        downloadCount: 0,
        downloadUrl: '/assets/uploads/static_fallback.pdf',
        fileUrl: '/assets/uploads/static_fallback.pdf',
      },
    ],
  };

  installBrowserEnv(async (input) => {
    const url = String(input);
    if (url.includes('/api/cms-snapshot')) {
      return new Response('Not Found', { status: 404 });
    }
    if (url.includes('/cms-snapshot.json')) {
      return new Response(JSON.stringify(staticSnapshot), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 404 });
  });

  try {
    getInitialLocalLessons();
    const applied = await fetchAndApplyRemoteCmsSnapshot(false);
    assert.equal(applied, true, 'Must apply /cms-snapshot.json when /api/cms-snapshot is unavailable');
    const docs = getAllDocumentsSync(9);
    assert.ok(
      docs.some((d) => d.id === 'doc-static-fallback-phone'),
      'Static snapshot document must appear in catalog'
    );
  } finally {
    cleanupBrowserEnv();
  }
});

test('server isSameOriginWriteAllowed permits Nginx/Cloud Run forwarded hosts & rejects third-party origins', async () => {
  const { isSameOriginWriteAllowed } = await import('../../server.ts');

  // 1. Proxied Cloud Run Shared Link (Host rewritten to localhost:3000 by Nginx)
  assert.equal(
    isSameOriginWriteAllowed({
      headers: {
        host: 'localhost:3000',
        'x-forwarded-host': 'ais-pre-abc123.asia-southeast1.run.app',
        origin: 'https://ais-pre-abc123.asia-southeast1.run.app',
      },
    } as any),
    true,
    'Must allow same-origin request behind Nginx proxy with X-Forwarded-Host'
  );

  // 2. Explicit :443 port normalization
  assert.equal(
    isSameOriginWriteAllowed({
      headers: {
        host: 'ais-pre-abc123.asia-southeast1.run.app:443',
        origin: 'https://ais-pre-abc123.asia-southeast1.run.app',
      },
    } as any),
    true,
    'Must normalize standard :443 port'
  );

  // 3. Unrelated third-party origin MUST be rejected (CSRF protection)
  assert.equal(
    isSameOriginWriteAllowed({
      headers: {
        host: 'localhost:3000',
        'x-forwarded-host': 'ais-pre-abc123.asia-southeast1.run.app',
        origin: 'https://evil.example',
      },
    } as any),
    false,
    'Must reject unrelated third-party Origin'
  );
});
