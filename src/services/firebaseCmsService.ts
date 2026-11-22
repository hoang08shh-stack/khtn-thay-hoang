import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  auth,
  isFirebaseConfigured,
  isFirebaseAdminAuthenticated,
  handleFirestoreError,
  OperationType,
} from '../firebase.ts';

const VALID_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const VALID_GRADES = new Set([6, 7, 8, 9]);
const VALID_DOMAINS = new Set(['vat-li', 'hoa-hoc', 'sinh-hoc']);
const VALID_FORMATS = new Set(['pptx', 'pdf', 'docx']);

export function toSafeFirestoreDocId(rawId: unknown, fallbackPrefix = 'item'): string {
  const cleaned = String(rawId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 128);
  if (cleaned && VALID_ID_REGEX.test(cleaned)) {
    return cleaned;
  }
  return `${fallbackPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.slice(0, 128);
}

export function truncateBlueprintString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.length <= maxLen ? value : value.slice(0, maxLen);
}

export function normalizeGrade(value: unknown): 6 | 7 | 8 | 9 {
  const n = Number(value);
  if (VALID_GRADES.has(n)) return n as 6 | 7 | 8 | 9;
  return 8;
}

export function normalizeDomain(value: unknown): 'vat-li' | 'hoa-hoc' | 'sinh-hoc' {
  const s = String(value || '').trim();
  if (VALID_DOMAINS.has(s)) return s as 'vat-li' | 'hoa-hoc' | 'sinh-hoc';
  return 'vat-li';
}

export function stripUndefinedDeep<T>(input: T): T {
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (input && typeof input === 'object') {
    // Preserve Firestore FieldValue / Timestamp sentinels without cloning
    if (
      typeof (input as any).toDate === 'function' ||
      typeof (input as any)._methodName === 'string' ||
      Object.getPrototypeOf(input) !== Object.prototype
    ) {
      return input;
    }
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input as Record<string, any>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return input;
}

function sanitizeCrossDeviceUrlForFirestore(rawUrl: unknown, maxLen = 2048): string {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === '#') return '';
  if (trimmed.startsWith('idb://') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return '';
  }
  return trimmed.slice(0, maxLen);
}

function sanitizeCoreWordHtmlForFirestore(rawHtml: unknown, maxLen = 580000): string {
  if (typeof rawHtml !== 'string') return '';
  let html = rawHtml;
  // Never store giant base64-embedded binary images inside Firestore docs (1MB doc limit)
  if (html.length > 400000) {
    html = html.replace(
      /<img\b[^>]*src=["']data:image\/[^"']{20000,}["'][^>]*>/gi,
      '<p><em>[Hình ảnh lớn được lưu trong tệp Word gốc — bấm Tải tệp Word để xem đầy đủ]</em></p>'
    );
  }
  if (html.length > maxLen) {
    return html.slice(0, maxLen);
  }
  return html;
}

export interface ExistingDocMeta {
  createdAt: any;
  ownerUid: string;
}

export function buildFirestoreLessonDoc(
  lesson: any,
  uid: string,
  existingMeta: ExistingDocMeta | undefined,
  nowSentinel: any
): { docId: string; data: Record<string, any> } {
  const docId = toSafeFirestoreDocId(lesson?.id, 'lesson');
  const isPublished = lesson?.isPublished !== false;

  const assets = Array.isArray(lesson?.assets)
    ? lesson.assets.slice(0, 50).map((a: any) =>
        stripUndefinedDeep({
          id: toSafeFirestoreDocId(a?.id, 'asset'),
          lessonId: docId,
          title: truncateBlueprintString(a?.title || 'Tài liệu', 300),
          format: truncateBlueprintString(a?.format || 'pdf', 16),
          type: truncateBlueprintString(a?.type || 'Tài liệu', 120),
          fileSize: truncateBlueprintString(a?.fileSize || '', 64),
          fileUrl: sanitizeCrossDeviceUrlForFirestore(a?.fileUrl, 2048) || '#',
          fileName: truncateBlueprintString(a?.fileName || '', 256),
          storagePath: truncateBlueprintString(a?.storagePath || '', 512),
          downloadsCount: Math.max(0, Number(a?.downloadsCount) || 0),
          lessonTitle: truncateBlueprintString(a?.lessonTitle || lesson?.title || '', 300),
          createdAt: truncateBlueprintString(a?.createdAt || '', 64),
        })
      )
    : [];

  let coreWordDoc: Record<string, any> | undefined;
  if (lesson?.coreWordDoc && typeof lesson.coreWordDoc === 'object') {
    const htmlContent = sanitizeCoreWordHtmlForFirestore(lesson.coreWordDoc.htmlContent, 580000);
    const fileUrl = sanitizeCrossDeviceUrlForFirestore(lesson.coreWordDoc.fileUrl, 2048) || '#';
    if (htmlContent || fileUrl !== '#' || lesson.coreWordDoc.fileName) {
      coreWordDoc = stripUndefinedDeep({
        id: toSafeFirestoreDocId(lesson.coreWordDoc.id || `core-word-${docId}`, 'word'),
        fileName: truncateBlueprintString(lesson.coreWordDoc.fileName || 'Noi_dung_cot_loi.docx', 256),
        fileUrl,
        fileSize: truncateBlueprintString(lesson.coreWordDoc.fileSize || '', 64),
        htmlContent,
        uploadedAt: truncateBlueprintString(lesson.coreWordDoc.uploadedAt || '', 64),
      });
    }
  }

  const simulationIds = Array.isArray(lesson?.simulationIds)
    ? lesson.simulationIds
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        .slice(0, 30)
        .map((s: string) => s.slice(0, 128))
    : [];

  const miniQuiz = Array.isArray(lesson?.miniQuiz)
    ? lesson.miniQuiz.slice(0, 50).map((q: any) => stripUndefinedDeep(q))
    : [];

  const data: Record<string, any> = {
    id: docId,
    topicId: truncateBlueprintString(lesson?.topicId || '', 128),
    grade: normalizeGrade(lesson?.grade),
    domain: normalizeDomain(lesson?.domain),
    code: truncateBlueprintString(lesson?.code || '', 64),
    slug: truncateBlueprintString(lesson?.slug || docId, 200),
    title: truncateBlueprintString(lesson?.title || 'Bài học KHTN', 300) || 'Bài học KHTN',
    summary: truncateBlueprintString(lesson?.summary || '', 2000),
    content: truncateBlueprintString(lesson?.content || '', 120000),
    durationMinutes: Math.min(600, Math.max(0, Number(lesson?.durationMinutes) || 45)),
    orderIndex: Math.min(10000, Math.max(0, Number(lesson?.orderIndex) || 0)),
    isPublished,
    isPublic: isPublished,
    thumbnailUrl: sanitizeCrossDeviceUrlForFirestore(lesson?.thumbnailUrl, 2048),
    videoUrl: sanitizeCrossDeviceUrlForFirestore(lesson?.videoUrl, 2048),
    viewCount: Math.max(0, Number(lesson?.viewCount) || 0),
    lessonCreatedAt: truncateBlueprintString(lesson?.createdAt || '', 64),
    lessonUpdatedAt: truncateBlueprintString(lesson?.updatedAt || '', 64),
    assets,
    simulationIds,
    miniQuiz,
    ownerUid: existingMeta?.ownerUid || uid,
    createdAt: existingMeta?.createdAt || nowSentinel,
    updatedAt: nowSentinel,
  };

  if (coreWordDoc) {
    data.coreWordDoc = coreWordDoc;
  }

  return { docId, data: stripUndefinedDeep(data) };
}

export function buildFirestoreTopicDoc(
  topic: any,
  uid: string,
  existingMeta: ExistingDocMeta | undefined,
  nowSentinel: any
): { docId: string; data: Record<string, any> } {
  const docId = toSafeFirestoreDocId(topic?.id, 'topic');
  return {
    docId,
    data: stripUndefinedDeep({
      id: docId,
      grade: normalizeGrade(topic?.grade),
      domain: normalizeDomain(topic?.domain),
      code: truncateBlueprintString(topic?.code || '', 64),
      chapterNumber: truncateBlueprintString(topic?.chapterNumber || '', 64),
      title: truncateBlueprintString(topic?.title || 'Chủ đề KHTN', 300) || 'Chủ đề KHTN',
      description: truncateBlueprintString(topic?.description || '', 2000),
      lessonCount: Math.max(0, Number(topic?.lessonCount) || 0),
      experimentCount: Math.max(0, Number(topic?.experimentCount) || 0),
      icon: truncateBlueprintString(topic?.icon || 'Atom', 64),
      order: Math.max(0, Number(topic?.order) || 0),
      image: sanitizeCrossDeviceUrlForFirestore(topic?.image, 2048),
      isPublic: true,
      ownerUid: existingMeta?.ownerUid || uid,
      createdAt: existingMeta?.createdAt || nowSentinel,
      updatedAt: nowSentinel,
    }),
  };
}

export function buildFirestoreVideoDoc(
  video: any,
  uid: string,
  existingMeta: ExistingDocMeta | undefined,
  nowSentinel: any
): { docId: string; data: Record<string, any> } {
  const docId = toSafeFirestoreDocId(video?.id, 'video');
  const timestamps = Array.isArray(video?.timestamps)
    ? video.timestamps.slice(0, 50).map((t: any) => ({
        time: truncateBlueprintString(t?.time || '00:00', 32),
        label: truncateBlueprintString(t?.label || '', 200),
      }))
    : [];
  return {
    docId,
    data: stripUndefinedDeep({
      id: docId,
      title: truncateBlueprintString(video?.title || 'Video KHTN', 300) || 'Video KHTN',
      grade: normalizeGrade(video?.grade),
      domain: normalizeDomain(video?.domain),
      duration: truncateBlueprintString(video?.duration || '05:00', 32),
      youtubeId: truncateBlueprintString(video?.youtubeId || '', 64),
      experimentType: truncateBlueprintString(video?.experimentType || 'Bài giảng lý thuyết', 120),
      instructor: truncateBlueprintString(video?.instructor || 'Thầy Hoàng', 120),
      description: truncateBlueprintString(video?.description || '', 4000),
      summary: truncateBlueprintString(video?.summary || '', 2000),
      thumbnail: sanitizeCrossDeviceUrlForFirestore(video?.thumbnail, 2048),
      views: Math.max(0, Number(video?.views) || 0),
      timestamps,
      isPublic: true,
      ownerUid: existingMeta?.ownerUid || uid,
      createdAt: existingMeta?.createdAt || nowSentinel,
      updatedAt: nowSentinel,
    }),
  };
}

export function buildFirestoreCatalogDoc(
  item: any,
  uid: string,
  existingMeta: ExistingDocMeta | undefined,
  nowSentinel: any
): { docId: string; data: Record<string, any> } {
  const docId = toSafeFirestoreDocId(item?.id, 'doc');
  const rawFormat = String(item?.format || 'pdf').toLowerCase();
  const format = VALID_FORMATS.has(rawFormat) ? rawFormat : 'pdf';
  return {
    docId,
    data: stripUndefinedDeep({
      id: docId,
      lessonId: truncateBlueprintString(item?.lessonId || '', 128),
      title: truncateBlueprintString(item?.title || 'Tài liệu KHTN', 300) || 'Tài liệu KHTN',
      grade: normalizeGrade(item?.grade),
      domain: normalizeDomain(item?.domain),
      format,
      type: truncateBlueprintString(item?.type || 'Tài liệu học tập', 120),
      pageCount: Math.max(0, Number(item?.pageCount) || 1),
      fileSize: truncateBlueprintString(item?.fileSize || '1 MB', 64),
      description: truncateBlueprintString(item?.description || '', 2000),
      author: truncateBlueprintString(item?.author || 'Thầy Hoàng', 120),
      downloadCount: Math.max(0, Number(item?.downloadCount) || 0),
      downloadUrl: sanitizeCrossDeviceUrlForFirestore(item?.downloadUrl, 2048) || '#',
      fileUrl: sanitizeCrossDeviceUrlForFirestore(item?.fileUrl, 2048),
      fileName: truncateBlueprintString(item?.fileName || '', 256),
      isPublic: true,
      ownerUid: existingMeta?.ownerUid || uid,
      createdAt: existingMeta?.createdAt || nowSentinel,
      updatedAt: nowSentinel,
    }),
  };
}

export function buildFirestoreResourceDoc(
  kind: 'unified' | 'general_asset' | 'custom_lesson' | 'custom_topic',
  rawItem: any,
  uid: string,
  existingMeta: ExistingDocMeta | undefined,
  nowSentinel: any
): { docId: string; data: Record<string, any> } {
  const baseId = toSafeFirestoreDocId(rawItem?.id, kind);
  const docId = toSafeFirestoreDocId(`${kind}_${baseId}`, kind);
  const safePayload: Record<string, any> = {};
  if (rawItem && typeof rawItem === 'object') {
    const entries = Object.entries(rawItem).slice(0, 38);
    for (const [k, v] of entries) {
      if (v === undefined) continue;
      if ((k === 'fileUrl' || k === 'fileDataUrl' || k === 'downloadUrl') && typeof v === 'string') {
        safePayload[k] = sanitizeCrossDeviceUrlForFirestore(v, 2048) || '#';
      } else if (typeof v === 'string' && v.length > 50000) {
        safePayload[k] = v.slice(0, 50000);
      } else {
        safePayload[k] = stripUndefinedDeep(v);
      }
    }
  }
  return {
    docId,
    data: stripUndefinedDeep({
      id: docId,
      resourceKind: kind,
      payload: safePayload,
      isPublic: true,
      ownerUid: existingMeta?.ownerUid || uid,
      createdAt: existingMeta?.createdAt || nowSentinel,
      updatedAt: nowSentinel,
    }),
  };
}

export function buildFirestoreQuestionDoc(
  q: any,
  uid: string,
  existingMeta: ExistingDocMeta | undefined,
  nowSentinel: any
): { docId: string; data: Record<string, any> } {
  const docId = toSafeFirestoreDocId(q?.id, 'q');
  const safePayload: Record<string, any> = {};
  if (q && typeof q === 'object') {
    const entries = Object.entries(q).slice(0, 38);
    for (const [k, v] of entries) {
      if (v === undefined) continue;
      // Avoid storing huge inline base64 images inside question docs
      if (k === 'questionImages' && Array.isArray(v)) {
        safePayload[k] = v
          .filter((img: any) => typeof img === 'string' && !img.startsWith('data:'))
          .slice(0, 10);
      } else if (k === 'imageUrl' && typeof v === 'string' && v.startsWith('data:')) {
        safePayload[k] = '';
      } else if (typeof v === 'string' && v.length > 20000) {
        safePayload[k] = v.slice(0, 20000);
      } else {
        safePayload[k] = stripUndefinedDeep(v);
      }
    }
  }
  return {
    docId,
    data: stripUndefinedDeep({
      id: docId,
      grade: normalizeGrade(q?.grade),
      domain: normalizeDomain(q?.domain),
      question: truncateBlueprintString(q?.question || 'Câu hỏi KHTN', 4000) || 'Câu hỏi KHTN',
      payload: safePayload,
      isPublic: true,
      ownerUid: existingMeta?.ownerUid || uid,
      createdAt: existingMeta?.createdAt || nowSentinel,
      updatedAt: nowSentinel,
    }),
  };
}

export function buildFirestoreQuizDoc(
  quiz: any,
  uid: string,
  existingMeta: ExistingDocMeta | undefined,
  nowSentinel: any
): { docId: string; data: Record<string, any> } {
  const docId = toSafeFirestoreDocId(quiz?.id, 'quiz');
  const isPublished = quiz?.isPublished !== false;
  return {
    docId,
    data: stripUndefinedDeep({
      id: docId,
      lessonId: truncateBlueprintString(quiz?.lessonId || '', 128),
      lessonTitle: truncateBlueprintString(quiz?.lessonTitle || '', 300),
      grade: normalizeGrade(quiz?.grade),
      domain: normalizeDomain(quiz?.domain),
      title: truncateBlueprintString(quiz?.title || 'Đề luyện tập KHTN', 300) || 'Đề luyện tập KHTN',
      description: truncateBlueprintString(quiz?.description || '', 2000),
      durationMinutes: Math.min(300, Math.max(0, Number(quiz?.durationMinutes) || 15)),
      passScore: Math.min(100, Math.max(0, Number(quiz?.passScore) || 70)),
      questionCount: Math.min(500, Math.max(0, Number(quiz?.questionCount) || 10)),
      isPublished,
      isPublic: isPublished,
      ownerUid: existingMeta?.ownerUid || uid,
      createdAt: existingMeta?.createdAt || nowSentinel,
      updatedAt: nowSentinel,
    }),
  };
}

export function buildFirestoreMetaDoc(
  snapshot: any,
  uid: string,
  prevRevision: number,
  existingMeta: ExistingDocMeta | undefined,
  nowSentinel: any
): Record<string, any> {
  const s = snapshot?.siteSettings || {};
  const d = snapshot?.deletedIds || {};
  const cleanIdList = (arr: any): string[] =>
    Array.isArray(arr)
      ? Array.from(
          new Set(
            arr
              .filter((x: any) => typeof x === 'string' && x.trim().length > 0)
              .map((x: string) => x.trim().slice(0, 128))
          )
        ).slice(0, 500)
      : [];

  return stripUndefinedDeep({
    id: 'live',
    isPublic: true,
    updatedAtIso: truncateBlueprintString(snapshot?.updatedAt || new Date().toISOString(), 64),
    revision: Math.max(1, prevRevision + 1),
    siteSettings: {
      siteName: truncateBlueprintString(s.siteName || 'KHOA HỌC TỰ NHIÊN', 120),
      labName: truncateBlueprintString(s.labName || 'KHOA HỌC SỐ KHTN', 120),
      bookSeries: truncateBlueprintString(s.bookSeries || 'Kết nối tri thức với cuộc sống', 160),
      location: truncateBlueprintString(s.location || 'Đà Nẵng, Việt Nam', 160),
      email: truncateBlueprintString(s.email || 'hoang08shh@gmail.com', 160),
      zalo: truncateBlueprintString(s.zalo || '0793565756', 64),
      domainsLabel: truncateBlueprintString(s.domainsLabel || 'Vật lí • Hóa học • Sinh học', 160),
      allowStudentRegister: Boolean(s.allowStudentRegister),
      maintenanceMode: Boolean(s.maintenanceMode),
    },
    deletedIds: {
      lessons: cleanIdList(d.lessons),
      videos: cleanIdList(d.videos),
      topics: cleanIdList(d.topics),
      catalogDocs: cleanIdList(d.catalogDocs),
      questions: cleanIdList(d.questions),
      quizzes: cleanIdList(d.quizzes),
      clearedLessonVideoIds: cleanIdList(d.clearedLessonVideoIds),
    },
    ownerUid: existingMeta?.ownerUid || uid,
    createdAt: existingMeta?.createdAt || nowSentinel,
    updatedAt: nowSentinel,
  });
}

async function fetchExistingMetaMap(colName: string): Promise<Map<string, ExistingDocMeta>> {
  const map = new Map<string, ExistingDocMeta>();
  try {
    const snap = await getDocs(collection(db, colName));
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data?.createdAt && data?.ownerUid) {
        map.set(docSnap.id, { createdAt: data.createdAt, ownerUid: data.ownerUid });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
  }
  return map;
}

interface BatchWriteOp {
  type: 'set' | 'delete';
  colName: string;
  docId: string;
  data?: Record<string, any>;
}

async function commitBatchedOps(ops: BatchWriteOp[]): Promise<void> {
  const MAX_BATCH = 300;
  for (let i = 0; i < ops.length; i += MAX_BATCH) {
    const slice = ops.slice(i, i + MAX_BATCH);
    const batch = writeBatch(db);
    for (const op of slice) {
      const ref = doc(db, op.colName, op.docId);
      if (op.type === 'delete') {
        batch.delete(ref);
      } else if (op.data) {
        batch.set(ref, op.data);
      }
    }
    try {
      await batch.commit();
    } catch (error) {
      const firstPath = slice[0] ? `${slice[0].colName}/${slice[0].docId}` : 'batch';
      handleFirestoreError(error, OperationType.WRITE, firstPath);
    }
  }
}

export interface FirebasePushResult {
  ok: boolean;
  reason?: 'not_configured' | 'auth_required' | 'error';
  errorDetail?: string;
  updatedAt?: string;
}

export async function pushCmsSnapshotToFirebase(snapshot: any): Promise<FirebasePushResult> {
  if (!isFirebaseConfigured || !db) {
    return { ok: false, reason: 'not_configured' };
  }
  if (!isFirebaseAdminAuthenticated() || !auth.currentUser) {
    return { ok: false, reason: 'auth_required' };
  }

  const uid = auth.currentUser.uid;
  const nowSentinel = serverTimestamp();

  try {
    // Load existing metadata so updates preserve immutable createdAt & ownerUid
    let existingMetaDoc: ExistingDocMeta | undefined;
    let prevRevision = 0;
    try {
      const metaSnap = await getDoc(doc(db, 'cms_meta', 'live'));
      if (metaSnap.exists()) {
        const md = metaSnap.data();
        if (md?.createdAt && md?.ownerUid) {
          existingMetaDoc = { createdAt: md.createdAt, ownerUid: md.ownerUid };
        }
        prevRevision = typeof md?.revision === 'number' ? md.revision : 0;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'cms_meta/live');
    }

    const [
      existingLessons,
      existingTopics,
      existingVideos,
      existingCatalogDocs,
      existingResources,
      existingQuestions,
      existingQuizzes,
    ] = await Promise.all([
      fetchExistingMetaMap('cms_lessons'),
      fetchExistingMetaMap('cms_topics'),
      fetchExistingMetaMap('cms_videos'),
      fetchExistingMetaMap('cms_catalog_docs'),
      fetchExistingMetaMap('cms_resources'),
      fetchExistingMetaMap('cms_questions'),
      fetchExistingMetaMap('cms_quizzes'),
    ]);

    const ops: BatchWriteOp[] = [];

    const enqueueCollectionSync = (
      colName: string,
      items: any[],
      existingMap: Map<string, ExistingDocMeta>,
      builder: (item: any, existingMeta: ExistingDocMeta | undefined) => { docId: string; data: Record<string, any> }
    ) => {
      const activeIds = new Set<string>();
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const previewId = toSafeFirestoreDocId(item.id, colName);
        const existingMeta = existingMap.get(previewId);
        const built = builder(item, existingMeta);
        activeIds.add(built.docId);
        ops.push({ type: 'set', colName, docId: built.docId, data: built.data });
      }
      for (const oldId of existingMap.keys()) {
        if (!activeIds.has(oldId)) {
          ops.push({ type: 'delete', colName, docId: oldId });
        }
      }
    };

    enqueueCollectionSync(
      'cms_lessons',
      Array.isArray(snapshot?.lessons) ? snapshot.lessons : [],
      existingLessons,
      (item, meta) => buildFirestoreLessonDoc(item, uid, meta, nowSentinel)
    );
    enqueueCollectionSync(
      'cms_topics',
      Array.isArray(snapshot?.topics) ? snapshot.topics : [],
      existingTopics,
      (item, meta) => buildFirestoreTopicDoc(item, uid, meta, nowSentinel)
    );
    enqueueCollectionSync(
      'cms_videos',
      Array.isArray(snapshot?.videos) ? snapshot.videos : [],
      existingVideos,
      (item, meta) => buildFirestoreVideoDoc(item, uid, meta, nowSentinel)
    );
    enqueueCollectionSync(
      'cms_catalog_docs',
      Array.isArray(snapshot?.catalogDocs) ? snapshot.catalogDocs : [],
      existingCatalogDocs,
      (item, meta) => buildFirestoreCatalogDoc(item, uid, meta, nowSentinel)
    );
    enqueueCollectionSync(
      'cms_questions',
      Array.isArray(snapshot?.questions) ? snapshot.questions : [],
      existingQuestions,
      (item, meta) => buildFirestoreQuestionDoc(item, uid, meta, nowSentinel)
    );
    enqueueCollectionSync(
      'cms_quizzes',
      Array.isArray(snapshot?.quizzes) ? snapshot.quizzes : [],
      existingQuizzes,
      (item, meta) => buildFirestoreQuizDoc(item, uid, meta, nowSentinel)
    );

    // Unified resources + generalAssets + customLessons + customTopics -> cms_resources
    const activeResourceIds = new Set<string>();
    const resourceGroups: Array<{
      kind: 'unified' | 'general_asset' | 'custom_lesson' | 'custom_topic';
      items: any[];
    }> = [
      { kind: 'unified', items: Array.isArray(snapshot?.unifiedResources) ? snapshot.unifiedResources : [] },
      { kind: 'general_asset', items: Array.isArray(snapshot?.generalAssets) ? snapshot.generalAssets : [] },
      { kind: 'custom_lesson', items: Array.isArray(snapshot?.customLessons) ? snapshot.customLessons : [] },
      { kind: 'custom_topic', items: Array.isArray(snapshot?.customTopics) ? snapshot.customTopics : [] },
    ];
    for (const group of resourceGroups) {
      for (const item of group.items) {
        if (!item || typeof item !== 'object') continue;
        const rawKey = toSafeFirestoreDocId(`${group.kind}_${toSafeFirestoreDocId(item.id, group.kind)}`, group.kind);
        const existingMeta = existingResources.get(rawKey);
        const built = buildFirestoreResourceDoc(group.kind, item, uid, existingMeta, nowSentinel);
        activeResourceIds.add(built.docId);
        ops.push({ type: 'set', colName: 'cms_resources', docId: built.docId, data: built.data });
      }
    }
    for (const oldId of existingResources.keys()) {
      if (!activeResourceIds.has(oldId)) {
        ops.push({ type: 'delete', colName: 'cms_resources', docId: oldId });
      }
    }

    // Commit all collection docs first
    await commitBatchedOps(ops);

    // Finally update cms_meta/live so subscribed phones pull complete committed docs
    const metaDocData = buildFirestoreMetaDoc(
      snapshot,
      uid,
      prevRevision,
      existingMetaDoc,
      nowSentinel
    );
    await commitBatchedOps([
      { type: 'set', colName: 'cms_meta', docId: 'live', data: metaDocData },
    ]);

    return { ok: true, updatedAt: metaDocData.updatedAtIso };
  } catch (err: any) {
    return {
      ok: false,
      reason: 'error',
      errorDetail: err?.message || 'Lỗi đồng bộ lên Firebase Firestore',
    };
  }
}

async function readCollectionDocs(colName: string, includeDrafts: boolean): Promise<any[]> {
  try {
    const q = includeDrafts
      ? collection(db, colName)
      : query(collection(db, colName), where('isPublic', '==', true));
    const snap = await getDocs(q);
    const results: any[] = [];
    snap.forEach((docSnap) => results.push(docSnap.data()));
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
  }
}

export async function fetchFirebaseCmsMetaVersion(): Promise<{
  exists: boolean;
  updatedAtIso?: string;
  revision?: number;
}> {
  if (!isFirebaseConfigured || !db) return { exists: false };
  try {
    const metaSnap = await getDoc(doc(db, 'cms_meta', 'live'));
    if (!metaSnap.exists()) return { exists: false };
    const data = metaSnap.data();
    return {
      exists: true,
      updatedAtIso: typeof data?.updatedAtIso === 'string' ? data.updatedAtIso : undefined,
      revision: typeof data?.revision === 'number' ? data.revision : undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'cms_meta/live');
  }
}

export async function fetchCmsSnapshotFromFirebase(): Promise<any | null> {
  if (!isFirebaseConfigured || !db) return null;

  let metaData: any = null;
  try {
    const metaSnap = await getDoc(doc(db, 'cms_meta', 'live'));
    if (!metaSnap.exists()) {
      return null;
    }
    metaData = metaSnap.data();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'cms_meta/live');
  }

  const includeDrafts = isFirebaseAdminAuthenticated();

  const [
    rawLessons,
    rawTopics,
    rawVideos,
    rawCatalogDocs,
    rawResources,
    rawQuestions,
    rawQuizzes,
  ] = await Promise.all([
    readCollectionDocs('cms_lessons', includeDrafts),
    readCollectionDocs('cms_topics', includeDrafts),
    readCollectionDocs('cms_videos', includeDrafts),
    readCollectionDocs('cms_catalog_docs', includeDrafts),
    readCollectionDocs('cms_resources', includeDrafts),
    readCollectionDocs('cms_questions', includeDrafts),
    readCollectionDocs('cms_quizzes', includeDrafts),
  ]);

  const lessons = rawLessons.map((l) => ({
    id: l.id,
    topicId: l.topicId || '',
    grade: l.grade,
    domain: l.domain,
    code: l.code || '',
    slug: l.slug || l.id,
    title: l.title,
    summary: l.summary || '',
    content: l.content || '',
    durationMinutes: l.durationMinutes ?? 45,
    orderIndex: l.orderIndex ?? 0,
    isPublished: l.isPublished !== false,
    thumbnailUrl: l.thumbnailUrl || undefined,
    videoUrl: l.videoUrl || '',
    viewCount: l.viewCount ?? 0,
    createdAt: l.lessonCreatedAt || metaData?.updatedAtIso || new Date().toISOString(),
    updatedAt: l.lessonUpdatedAt || metaData?.updatedAtIso || new Date().toISOString(),
    assets: Array.isArray(l.assets) ? l.assets : [],
    coreWordDoc: l.coreWordDoc || undefined,
    simulationIds: Array.isArray(l.simulationIds) ? l.simulationIds : [],
    miniQuiz: Array.isArray(l.miniQuiz) ? l.miniQuiz : [],
  }));

  const topics = rawTopics.map((t) => ({
    id: t.id,
    grade: t.grade,
    domain: t.domain,
    code: t.code || '',
    chapterNumber: t.chapterNumber || undefined,
    title: t.title,
    description: t.description || '',
    lessonCount: t.lessonCount ?? 0,
    experimentCount: t.experimentCount ?? 0,
    icon: t.icon || 'Atom',
    order: t.order ?? 0,
    image: t.image || undefined,
  }));

  const videos = rawVideos.map((v) => ({
    id: v.id,
    title: v.title,
    grade: v.grade,
    domain: v.domain,
    duration: v.duration || '05:00',
    youtubeId: v.youtubeId || '',
    experimentType: v.experimentType || 'Bài giảng lý thuyết',
    instructor: v.instructor || 'Thầy Hoàng',
    description: v.description || '',
    summary: v.summary || undefined,
    thumbnail: v.thumbnail || undefined,
    views: v.views ?? 0,
    timestamps: Array.isArray(v.timestamps) ? v.timestamps : [],
  }));

  const catalogDocs = rawCatalogDocs.map((d) => ({
    id: d.id,
    lessonId: d.lessonId || undefined,
    title: d.title,
    grade: d.grade,
    domain: d.domain,
    format: d.format || 'pdf',
    type: d.type || 'Tài liệu',
    pageCount: d.pageCount ?? 1,
    fileSize: d.fileSize || '1 MB',
    description: d.description || '',
    author: d.author || 'Thầy Hoàng',
    downloadCount: d.downloadCount ?? 0,
    downloadUrl: d.downloadUrl || '#',
    fileUrl: d.fileUrl || undefined,
    fileName: d.fileName || undefined,
  }));

  const unifiedResources: any[] = [];
  const generalAssets: any[] = [];
  const customLessons: any[] = [];
  const customTopics: any[] = [];

  for (const r of rawResources) {
    if (!r || !r.payload) continue;
    if (r.resourceKind === 'unified') unifiedResources.push(r.payload);
    else if (r.resourceKind === 'general_asset') generalAssets.push(r.payload);
    else if (r.resourceKind === 'custom_lesson') customLessons.push(r.payload);
    else if (r.resourceKind === 'custom_topic') customTopics.push(r.payload);
  }

  const questions = rawQuestions
    .map((q) => q?.payload)
    .filter((q) => q && typeof q === 'object');

  const quizzes = rawQuizzes.map((q) => ({
    id: q.id,
    lessonId: q.lessonId || undefined,
    lessonTitle: q.lessonTitle || undefined,
    grade: q.grade,
    domain: q.domain,
    title: q.title,
    description: q.description || undefined,
    durationMinutes: q.durationMinutes ?? 15,
    passScore: q.passScore ?? 70,
    questionCount: q.questionCount ?? 10,
    isPublished: q.isPublished !== false,
  }));

  return {
    updatedAt: metaData?.updatedAtIso || new Date().toISOString(),
    lessons,
    topics,
    videos,
    catalogDocs,
    unifiedResources,
    generalAssets,
    customLessons,
    customTopics,
    questions,
    quizzes,
    siteSettings: metaData?.siteSettings,
    deletedIds: metaData?.deletedIds,
  };
}

export function subscribeToFirebaseCmsMeta(
  onMetaChange: (updatedAtIso: string, revision: number) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured || !db) return null;
  const metaPath = 'cms_meta/live';
  return onSnapshot(
    doc(db, 'cms_meta', 'live'),
    (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const updatedAtIso = typeof data?.updatedAtIso === 'string' ? data.updatedAtIso : '';
      const revision = typeof data?.revision === 'number' ? data.revision : 0;
      if (updatedAtIso) {
        onMetaChange(updatedAtIso, revision);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, metaPath);
      } catch {
        // Error already logged as structured FirestoreErrorInfo; keep app running gracefully
      }
    }
  );
}
