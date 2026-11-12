import { supabase, isSupabaseConfigured, DEMO_USERS } from '../lib/supabase.ts';
import {
  Grade,
  SubjectDomain,
  Topic,
  DocumentItem,
  VideoLesson,
  QuizQuestion,
  QuizMeta,
  AppUser,
  LessonMiniQuizItem,
} from '../types/index.ts';
import {
  LESSONS,
  DOCUMENTS,
  TOPICS,
  VIDEOS,
  QUIZ_QUESTIONS,
  LESSON_QUIZZES,
} from '../data/mockData.ts';
import cmsSnapshot from '../data/cmsSnapshot.json';
import {
  SciencePairItem,
  CrosswordRowItem,
  DetectivePuzzleItem,
  SCIENCE_PAIR_BANK,
  CROSSWORD_ROW_BANK,
  DETECTIVE_PUZZLE_BANK,
  normalizeCrosswordInput,
} from '../utils/scienceGameEngine.ts';
import { deleteStorageFile } from './storageService.ts';
import {
  generateStepByStepSolution,
  generateDetailedExplanation,
} from '../utils/wordQuestionParser.ts';

export interface LessonAssetItem {
  id: string;
  lessonId: string;
  title: string;
  format: 'pptx' | 'pdf' | 'docx' | 'png' | 'jpg' | 'xlsx' | 'zip';
  type: string;
  fileSize: string;
  fileUrl: string;
  fileName?: string;
  storagePath?: string;
  downloadsCount?: number;
  lessonTitle?: string;
  createdAt?: string;
}

export interface AdminLesson {
  id: string;
  topicId: string;
  grade: Grade;
  domain: SubjectDomain;
  code: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  durationMinutes: number;
  orderIndex: number;
  isPublished: boolean;
  thumbnailUrl?: string;
  videoUrl?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  assets?: LessonAssetItem[];
  simulationIds?: string[];
  miniQuiz?: LessonMiniQuizItem[];
}

export interface SiteSettings {
  siteName: string;
  labName: string;
  bookSeries: string;
  location: string;
  email: string;
  zalo: string;
  domainsLabel: string;
  allowStudentRegister: boolean;
  maintenanceMode: boolean;
}

export const STORAGE_KEYS = {
  LESSONS: 'khtn_admin_lessons_v2',
  ASSETS: 'khtn_admin_assets_v2',
  TOPICS: 'khtn_admin_topics_v2',
  QUESTIONS: 'khtn_admin_questions_v2',
  QUIZZES: 'khtn_admin_quizzes_v2',
  VIDEOS: 'khtn_admin_videos_v2',
  CATALOG_DOCS: 'khtn_admin_catalog_docs_v2',
  GAME_PAIRS: 'khtn_admin_game_pairs_v2',
  GAME_CROSSWORDS: 'khtn_admin_game_crosswords_v2',
  GAME_DETECTIVE: 'khtn_admin_game_detective_v2',
  USERS: 'khtn_admin_users_v2',
  SETTINGS: 'khtn_admin_site_settings_v2',
  DELETED_IDS: 'khtn_admin_deleted_ids_v1',
} as const;

export interface DeletedIdsRegistry {
  lessons: string[];
  videos: string[];
  topics: string[];
  catalogDocs: string[];
  questions: string[];
  quizzes: string[];
  clearedLessonVideoIds: string[];
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'KHOA HỌC TỰ NHIÊN',
  labName: 'KHOA HỌC SỐ KHTN',
  bookSeries: 'Kết nối tri thức với cuộc sống',
  location: 'Đà Nẵng, Việt Nam',
  email: 'hoang08shh@gmail.com',
  zalo: '0793565756',
  domainsLabel: 'Vật lí • Hóa học • Sinh học',
  allowStudentRegister: false,
  maintenanceMode: false,
};

/**
 * Generate standard URL slug from Vietnamese string
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Extract YouTube 11-character video ID from URL, iframe snippet, or raw ID
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  let trimmed = urlOrId.trim();

  // Extract src attribute if teacher pasted full <iframe ... src="...">
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    trimmed = iframeSrcMatch[1].trim();
  }

  // Strip accidental "k3_" prefix before an 11-char ID (14 chars total)
  trimmed = trimmed
    .replace(/([?&]v=|youtu\.be\/|embed\/|shorts\/|live\/)k3_([a-zA-Z0-9_-]{11})(?![a-zA-Z0-9_-])/g, '$1$2')
    .replace(/^k3_([a-zA-Z0-9_-]{11})$/, '$1');

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regex =
    /(?:youtube(?:-nocookie)?\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regex);
  return match ? match[1] : null;
}

export function normalizeVideoUrl(rawUrl?: string): string | undefined {
  if (!rawUrl || !rawUrl.trim()) return undefined;
  const trimmed = rawUrl.trim();
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return `https://www.youtube.com/watch?v=${ytId}`;
  }
  return trimmed;
}

const memoryFallbackStore = new Map<string, string>();

function safeReadLocal<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') {
      const memRaw = memoryFallbackStore.get(key);
      if (memRaw) {
        return JSON.parse(memRaw) as T;
      }
      return fallback;
    }
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed !== null && parsed !== undefined) {
        return parsed as T;
      }
    }
  } catch (e) {
    console.warn(`Could not read ${key} from localStorage:`, e);
  }
  return fallback;
}

function safeWriteLocal<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data);
    memoryFallbackStore.set(key, serialized);
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, serialized);
  } catch (e) {
    console.warn(`Failed to write ${key} to localStorage:`, e);
  }
}

const snapshotLessons: AdminLesson[] = Array.isArray((cmsSnapshot as any)?.lessons)
  ? ((cmsSnapshot as any).lessons as AdminLesson[])
  : [];

const snapshotQuestions: QuizQuestion[] = Array.isArray((cmsSnapshot as any)?.questions)
  ? ((cmsSnapshot as any).questions as QuizQuestion[])
  : [];

const snapshotDeletedIds: Partial<DeletedIdsRegistry> =
  (cmsSnapshot as any)?.deletedIds && typeof (cmsSnapshot as any).deletedIds === 'object'
    ? ((cmsSnapshot as any).deletedIds as Partial<DeletedIdsRegistry>)
    : {};

const DEFAULT_DELETED_IDS: DeletedIdsRegistry = {
  lessons: [],
  videos: [],
  topics: [],
  catalogDocs: [],
  questions: [],
  quizzes: [],
  clearedLessonVideoIds: [],
};

export function getDeletedIdsRegistrySync(): DeletedIdsRegistry {
  const local = safeReadLocal<Partial<DeletedIdsRegistry>>(
    STORAGE_KEYS.DELETED_IDS,
    DEFAULT_DELETED_IDS
  );
  const mergeUnique = (a?: string[], b?: string[]) =>
    Array.from(new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]));

  return {
    lessons: mergeUnique(local.lessons, snapshotDeletedIds.lessons),
    videos: mergeUnique(local.videos, snapshotDeletedIds.videos),
    topics: mergeUnique(local.topics, snapshotDeletedIds.topics),
    catalogDocs: mergeUnique(local.catalogDocs, snapshotDeletedIds.catalogDocs),
    questions: mergeUnique(local.questions, snapshotDeletedIds.questions),
    quizzes: mergeUnique(local.quizzes, snapshotDeletedIds.quizzes),
    clearedLessonVideoIds: mergeUnique(
      local.clearedLessonVideoIds,
      snapshotDeletedIds.clearedLessonVideoIds
    ),
  };
}

export function markIdAsDeleted(category: keyof DeletedIdsRegistry, id: string): void {
  if (!id) return;
  const reg = getDeletedIdsRegistrySync();
  if (!reg[category].includes(id)) {
    reg[category] = [...reg[category], id];
    safeWriteLocal(STORAGE_KEYS.DELETED_IDS, reg);
  }
}

export function unmarkIdAsDeleted(category: keyof DeletedIdsRegistry, id: string): void {
  if (!id) return;
  const reg = getDeletedIdsRegistrySync();
  if (reg[category].includes(id)) {
    reg[category] = reg[category].filter((item) => item !== id);
    safeWriteLocal(STORAGE_KEYS.DELETED_IDS, reg);
  }
}

function isLegacyPlaceholderVideoUrl(url?: string): boolean {
  if (!url) return false;
  return extractYouTubeId(url) === 'dQw4w9WgXcQ';
}

export function syncCmsSnapshotToRepo(): void {
  try {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    const rawLessons = safeReadLocal<AdminLesson[]>(STORAGE_KEYS.LESSONS, []);
    const rawQuestions = safeReadLocal<QuizQuestion[]>(STORAGE_KEYS.QUESTIONS, []);
    const rawQuizzes = safeReadLocal<QuizMeta[]>(STORAGE_KEYS.QUIZZES, []);
    const rawVideos = safeReadLocal<VideoLesson[] | null>(STORAGE_KEYS.VIDEOS, null);
    const rawTopics = safeReadLocal<Topic[] | null>(STORAGE_KEYS.TOPICS, null);
    const rawCatalogDocs = safeReadLocal<DocumentItem[] | null>(STORAGE_KEYS.CATALOG_DOCS, null);
    const deletedIds = getDeletedIdsRegistrySync();

    // Keep assets lightweight in git snapshot (strip huge base64 data URLs > 150KB)
    const cleanLessons = rawLessons.map((l) => ({
      ...l,
      assets: (l.assets || []).map((a) => ({
        ...a,
        fileUrl: a.fileUrl && a.fileUrl.length > 150000 ? '#' : a.fileUrl,
      })),
    }));

    fetch('/api/sync-cms-snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessons: cleanLessons,
        questions: rawQuestions,
        quizzes: rawQuizzes,
        videos: rawVideos ?? undefined,
        topics: rawTopics ?? undefined,
        catalogDocs: rawCatalogDocs ?? undefined,
        deletedIds,
      }),
    }).catch(() => {});
  } catch {
    // ignore in static environments
  }
}

/**
 * ============================================================================
 * 1. LESSONS MANAGEMENT
 * ============================================================================
 */
export function getInitialLocalLessons(): AdminLesson[] {
  const deletedReg = getDeletedIdsRegistrySync();
  const deletedLessonSet = new Set(deletedReg.lessons);
  const clearedVideoSet = new Set(deletedReg.clearedLessonVideoIds);

  const cached = safeReadLocal<AdminLesson[] | null>(STORAGE_KEYS.LESSONS, null);
  if (cached !== null && Array.isArray(cached)) {
    let needsResave = false;
    const activeCached = cached.filter((c) => {
      if (!c || !c.id || deletedLessonSet.has(c.id)) {
        needsResave = true;
        return false;
      }
      return true;
    });
    const existingIds = new Set(activeCached.map((c) => c.id));

    const cleaned: AdminLesson[] = activeCached.map((item): AdminLesson => {
      const baseLesson = LESSONS.find((m) => m.id === item.id);
      const snapLesson = snapshotLessons.find((s) => s.id === item.id);
      const isClearedVideo =
        clearedVideoSet.has(item.id) ||
        item.videoUrl === '' ||
        isLegacyPlaceholderVideoUrl(item.videoUrl);
      const fixedVideoUrl = isClearedVideo ? '' : normalizeVideoUrl(item.videoUrl) || '';
      if (fixedVideoUrl !== item.videoUrl) {
        needsResave = true;
      }
      // Remove legacy auto-seeded placeholder assets that have fileUrl === '#'
      const rawAssets = Array.isArray(item.assets) ? item.assets : [];
      const realAssets = rawAssets.filter(
        (a) => a && a.fileUrl && a.fileUrl.trim() !== '' && a.fileUrl.trim() !== '#'
      );
      if (realAssets.length !== rawAssets.length) {
        needsResave = true;
      }

      const currentMiniQuiz = Array.isArray(item.miniQuiz) ? item.miniQuiz : [];
      const fallbackMiniQuiz =
        snapLesson?.miniQuiz && snapLesson.miniQuiz.length > 0
          ? snapLesson.miniQuiz
          : baseLesson?.miniQuiz && baseLesson.miniQuiz.length > 0
          ? baseLesson.miniQuiz
          : [];

      const resolvedMiniQuiz =
        currentMiniQuiz.length > 0 ? currentMiniQuiz : fallbackMiniQuiz;

      if (currentMiniQuiz.length === 0 && resolvedMiniQuiz.length > 0) {
        needsResave = true;
      }

      const updatedCode =
        item.id === 'khtn-8-bai-5' &&
        item.code === 'KHTN8-B05' &&
        item.title?.includes('Bài 8')
          ? 'KHTN8-B08'
          : item.code;
      if (updatedCode !== item.code) {
        needsResave = true;
      }

      return {
        ...item,
        code: updatedCode,
        videoUrl: fixedVideoUrl,
        assets: realAssets,
        miniQuiz: resolvedMiniQuiz,
      };
    });

    // Append any new lessons from cmsSnapshot or LESSONS not yet in cached localStorage and NOT deleted
    snapshotLessons.forEach((snap) => {
      if (snap && snap.id && !existingIds.has(snap.id) && !deletedLessonSet.has(snap.id)) {
        existingIds.add(snap.id);
        cleaned.push({
          ...snap,
          videoUrl:
            clearedVideoSet.has(snap.id) || isLegacyPlaceholderVideoUrl(snap.videoUrl)
              ? ''
              : normalizeVideoUrl(snap.videoUrl) || '',
        });
        needsResave = true;
      }
    });

    LESSONS.forEach((l, index) => {
      if (!existingIds.has(l.id) && !deletedLessonSet.has(l.id)) {
        existingIds.add(l.id);
        cleaned.push({
          id: l.id,
          topicId: l.topicId || 'topic-default',
          grade: l.grade,
          domain: l.domain,
          code: l.code,
          slug: generateSlug(l.title),
          title: l.title,
          summary: l.summary,
          content:
            l.sections?.map((s) => `### ${s.title}\n${s.content.join('\n')}`).join('\n\n') ||
            l.summary,
          durationMinutes: l.durationMinutes || 45,
          orderIndex: index + 1,
          isPublished: true,
          thumbnailUrl: l.thumbnailUrl,
          videoUrl: clearedVideoSet.has(l.id) ? '' : normalizeVideoUrl(l.videoUrl) || '',
          viewCount: l.viewCount || 120,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          simulationIds: l.simulationId ? [l.simulationId] : [],
          miniQuiz: l.miniQuiz ? [...l.miniQuiz] : [],
          assets: [],
        });
        needsResave = true;
      }
    });

    // Ensure any teacher-uploaded asset for Bài 5 (Định luật bảo toàn khối lượng) that was accidentally attached to khtn-8-bai-5 or general assets is also linked to khtn-8-bai-5-btkl
    const btklLesson = cleaned.find((l) => l.id === 'khtn-8-bai-5-btkl');
    if (btklLesson) {
      const bai8Lesson = cleaned.find((l) => l.id === 'khtn-8-bai-5');
      const generalUploaded = safeReadLocal<LessonAssetItem[]>(STORAGE_KEYS.ASSETS, []);
      const candidateAssets = [
        ...(bai8Lesson?.assets || []),
        ...(Array.isArray(generalUploaded) ? generalUploaded : []),
      ];
      candidateAssets.forEach((asset) => {
        if (
          asset &&
          asset.fileUrl &&
          asset.fileUrl !== '#' &&
          /bảo toàn khối lượng|bài\s*0?5\b/i.test(`${asset.title || ''} ${asset.fileName || ''}`)
        ) {
          const alreadyHas = (btklLesson.assets || []).some(
            (a) => a.id === asset.id || (a.fileName && a.fileName === asset.fileName)
          );
          if (!alreadyHas) {
            btklLesson.assets = [
              {
                ...asset,
                lessonId: btklLesson.id,
                lessonTitle: btklLesson.title,
              },
              ...(btklLesson.assets || []),
            ];
            needsResave = true;
          }
        }
      });
    }

    // Sort lessons naturally within each grade by lesson number ("Bài <N>") so newly added built-in lessons like Bài 5 appear before Bài 8
    const extractLessonNum = (title: string): number => {
      const m = (title || '').match(/bài\s*(\d+)/i);
      return m ? parseInt(m[1], 10) : 999;
    };
    cleaned.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      const numA = extractLessonNum(a.title);
      const numB = extractLessonNum(b.title);
      if (numA !== numB) return numA - numB;
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });

    if (needsResave) {
      safeWriteLocal(STORAGE_KEYS.LESSONS, cleaned);
    }
    return cleaned;
  }

  const baseSeeded: AdminLesson[] = LESSONS.filter((l) => !deletedLessonSet.has(l.id)).map(
    (l, index) => {
      const snapLesson = snapshotLessons.find((s) => s.id === l.id);
      const rawVid = snapLesson?.videoUrl !== undefined ? snapLesson.videoUrl : l.videoUrl;
      const cleanVid =
        clearedVideoSet.has(l.id) || isLegacyPlaceholderVideoUrl(rawVid)
          ? ''
          : normalizeVideoUrl(rawVid) || '';
      return {
        id: l.id,
        topicId: l.topicId || 'topic-default',
        grade: l.grade,
        domain: l.domain,
        code: l.code,
        slug: generateSlug(l.title),
        title: snapLesson?.title || l.title,
        summary: snapLesson?.summary || l.summary,
        content:
          snapLesson?.content ||
          l.sections?.map((s) => `### ${s.title}\n${s.content.join('\n')}`).join('\n\n') ||
          l.summary,
        durationMinutes: l.durationMinutes || 45,
        orderIndex: index + 1,
        isPublished: true,
        thumbnailUrl: l.thumbnailUrl,
        videoUrl: cleanVid,
        viewCount: l.viewCount || 120,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        simulationIds: l.simulationId ? [l.simulationId] : [],
        miniQuiz:
          snapLesson?.miniQuiz && snapLesson.miniQuiz.length > 0
            ? [...snapLesson.miniQuiz]
            : l.miniQuiz
            ? [...l.miniQuiz]
            : [],
        assets: snapLesson?.assets || [],
      };
    }
  );

  const seededIds = new Set(baseSeeded.map((b) => b.id));
  snapshotLessons.forEach((snap) => {
    if (snap && snap.id && !seededIds.has(snap.id) && !deletedLessonSet.has(snap.id)) {
      seededIds.add(snap.id);
      baseSeeded.push({
        ...snap,
        videoUrl:
          clearedVideoSet.has(snap.id) || isLegacyPlaceholderVideoUrl(snap.videoUrl)
            ? ''
            : normalizeVideoUrl(snap.videoUrl) || '',
      });
    }
  });

  safeWriteLocal(STORAGE_KEYS.LESSONS, baseSeeded);
  return baseSeeded;
}

function saveLocalLessons(lessons: AdminLesson[]) {
  safeWriteLocal(STORAGE_KEYS.LESSONS, lessons);
  syncCmsSnapshotToRepo();
}

export async function fetchAdminLessons(): Promise<AdminLesson[]> {
  const localLessons = getInitialLocalLessons();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });

      if (!lessonsError && lessonsData && lessonsData.length > 0) {
        const { data: assetsData } = await supabase.from('lesson_assets').select('*');
        const { data: simLinks } = await supabase.from('lesson_simulations').select('*');

        return lessonsData.map((l: any) => {
          const localMatch = localLessons.find((loc) => loc.id === l.id);
          const baseMatch = LESSONS.find((m) => m.id === l.id);
          const snapMatch = snapshotLessons.find((s) => s.id === l.id);

          const lessonAssets: LessonAssetItem[] = (assetsData || [])
            .filter((a: any) => a.lesson_id === l.id)
            .map((a: any) => ({
              id: a.id,
              lessonId: a.lesson_id,
              title: a.title,
              format: a.format,
              type: a.type,
              fileSize: a.file_size,
              fileUrl: a.file_url,
              storagePath: a.storage_path,
              downloadsCount: a.downloads_count,
              createdAt: a.created_at,
            }));

          const simulationIds = (simLinks || [])
            .filter((sl: any) => sl.lesson_id === l.id)
            .map((sl: any) => sl.simulation_id);

          const resolvedMiniQuiz: LessonMiniQuizItem[] =
            Array.isArray(l.mini_quiz) && l.mini_quiz.length > 0
              ? l.mini_quiz
              : localMatch?.miniQuiz && localMatch.miniQuiz.length > 0
              ? localMatch.miniQuiz
              : snapMatch?.miniQuiz && snapMatch.miniQuiz.length > 0
              ? snapMatch.miniQuiz
              : baseMatch?.miniQuiz || [];

          return {
            id: l.id,
            topicId: l.topic_id || localMatch?.topicId || '',
            grade: l.grade as Grade,
            domain: l.domain as SubjectDomain,
            code: l.code,
            slug: l.slug || generateSlug(l.title),
            title: l.title,
            summary: l.summary,
            content: l.content,
            durationMinutes: l.duration_minutes || 45,
            orderIndex: l.order_index ?? 0,
            isPublished: l.is_published ?? true,
            thumbnailUrl: l.thumbnail_url || localMatch?.thumbnailUrl || undefined,
            videoUrl: normalizeVideoUrl(l.video_url || localMatch?.videoUrl),
            viewCount: l.view_count || 0,
            createdAt: l.created_at,
            updatedAt: l.updated_at,
            assets: lessonAssets.length > 0 ? lessonAssets : localMatch?.assets || [],
            simulationIds:
              simulationIds.length > 0 ? simulationIds : localMatch?.simulationIds || [],
            miniQuiz: resolvedMiniQuiz,
          };
        });
      }
    } catch (err) {
      console.warn('Supabase fetch error, fallback to local:', err);
    }
  }

  return localLessons;
}

export async function checkSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<{ available: boolean; reason?: string }> {
  if (!slug || slug.trim().length < 2) {
    return { available: false, reason: 'Slug phải có ít nhất 2 ký tự.' };
  }

  const localLessons = getInitialLocalLessons();
  const exists = localLessons.some(
    (l) => (l.slug === slug || l.code === slug) && l.id !== excludeId
  );
  if (exists) {
    return {
      available: false,
      reason: `Đường dẫn/mã "${slug}" đã tồn tại trên hệ thống.`,
    };
  }

  return { available: true };
}

export async function saveAdminLesson(
  lessonData: {
    id?: string;
    topicId: string;
    grade: Grade;
    domain: SubjectDomain;
    code: string;
    slug?: string;
    title: string;
    summary: string;
    content: string;
    durationMinutes: number;
    orderIndex: number;
    isPublished: boolean;
    thumbnailUrl?: string;
    videoUrl?: string;
    miniQuiz?: LessonMiniQuizItem[];
  },
  assets: LessonAssetItem[],
  simulationIds: string[] = [],
  miniQuiz?: LessonMiniQuizItem[]
): Promise<AdminLesson> {
  const finalSlug = lessonData.slug?.trim() || generateSlug(lessonData.title);
  const now = new Date().toISOString();

  const local = getInitialLocalLessons();
  const id = lessonData.id || `custom-lesson-${Date.now()}`;
  const existing = local.find((l) => l.id === id);

  unmarkIdAsDeleted('lessons', id);

  const normalizedVid = normalizeVideoUrl(lessonData.videoUrl);
  if (!normalizedVid) {
    markIdAsDeleted('clearedLessonVideoIds', id);
    // Also remove any unified video resource attached to this lesson so it does not resurface
    try {
      const uniKey = 'khtn_unified_learning_resources_v2';
      const rawUni = safeReadLocal<any[] | null>(uniKey, null);
      if (rawUni && Array.isArray(rawUni)) {
        const filteredUni = rawUni.filter(
          (r) => !(r.category === 'video' && (r.lessonId === id || r.lessonTitle === lessonData.title))
        );
        if (filteredUni.length !== rawUni.length) {
          safeWriteLocal(uniKey, filteredUni);
        }
      }
    } catch {
      // ignore
    }
  } else {
    unmarkIdAsDeleted('clearedLessonVideoIds', id);
  }

  const savedLesson: AdminLesson = {
    id,
    topicId: lessonData.topicId,
    grade: lessonData.grade,
    domain: lessonData.domain,
    code: lessonData.code,
    slug: finalSlug,
    title: lessonData.title,
    summary: lessonData.summary,
    content: lessonData.content,
    durationMinutes: lessonData.durationMinutes,
    orderIndex: lessonData.orderIndex,
    isPublished: lessonData.isPublished,
    thumbnailUrl: lessonData.thumbnailUrl,
    videoUrl: normalizedVid || '',
    viewCount: existing?.viewCount || 0,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    assets: assets.map((a, i) => ({
      ...a,
      id: a.id || `asset-${id}-${i}`,
      lessonId: id,
    })),
    simulationIds,
    miniQuiz: miniQuiz ?? lessonData.miniQuiz ?? existing?.miniQuiz ?? [],
  };

  const existingIndex = local.findIndex((l) => l.id === id);
  if (existingIndex >= 0) {
    local[existingIndex] = savedLesson;
  } else {
    local.unshift(savedLesson);
  }

  saveLocalLessons(local);
  return savedLesson;
}

export async function clearAdminLessonVideo(lessonId: string): Promise<boolean> {
  if (!lessonId) return false;
  markIdAsDeleted('clearedLessonVideoIds', lessonId);
  const local = getInitialLocalLessons();
  const target = local.find((l) => l.id === lessonId || l.code === lessonId);
  if (target) {
    markIdAsDeleted('clearedLessonVideoIds', target.id);
    target.videoUrl = '';
    target.updatedAt = new Date().toISOString();
    saveLocalLessons(local);
  }
  try {
    const uniKey = 'khtn_unified_learning_resources_v2';
    const rawUni = safeReadLocal<any[] | null>(uniKey, null);
    if (rawUni && Array.isArray(rawUni)) {
      const filteredUni = rawUni.filter(
        (r) =>
          !(
            r.category === 'video' &&
            (r.lessonId === lessonId || (target && r.lessonTitle === target.title))
          )
      );
      safeWriteLocal(uniKey, filteredUni);
    }
  } catch {
    // ignore
  }
  return true;
}

export async function clearAllAdminLessonVideos(grade?: Grade): Promise<number> {
  const local = getInitialLocalLessons();
  let clearedCount = 0;
  local.forEach((l) => {
    if (grade === undefined || l.grade === grade) {
      markIdAsDeleted('clearedLessonVideoIds', l.id);
      if (l.videoUrl) {
        clearedCount++;
      }
      l.videoUrl = '';
      l.updatedAt = new Date().toISOString();
    }
  });
  saveLocalLessons(local);

  try {
    const uniKey = 'khtn_unified_learning_resources_v2';
    const rawUni = safeReadLocal<any[] | null>(uniKey, null);
    if (rawUni && Array.isArray(rawUni)) {
      const filteredUni = rawUni.filter(
        (r) => !(r.category === 'video' && (grade === undefined || r.grade === grade))
      );
      safeWriteLocal(uniKey, filteredUni);
    }
  } catch {
    // ignore
  }
  return clearedCount;
}

export function updateLessonMiniQuizSync(
  lessonId: string,
  miniQuiz: LessonMiniQuizItem[]
): AdminLesson | null {
  const local = getInitialLocalLessons();
  const idx = local.findIndex(
    (l) => l.id === lessonId || l.slug === lessonId || l.code.toLowerCase() === lessonId.toLowerCase()
  );
  if (idx < 0) return null;

  const updated: AdminLesson = {
    ...local[idx],
    miniQuiz: [...miniQuiz],
    updatedAt: new Date().toISOString(),
  };
  local[idx] = updated;
  saveLocalLessons(local);
  return updated;
}

export async function toggleLessonPublish(
  lessonId: string,
  isPublished: boolean
): Promise<boolean> {
  const local = getInitialLocalLessons();
  const target = local.find((l) => l.id === lessonId);
  if (target) {
    target.isPublished = isPublished;
    target.updatedAt = new Date().toISOString();
    saveLocalLessons(local);
    return true;
  }
  return false;
}

export async function deleteAdminLesson(lessonId: string): Promise<boolean> {
  if (!lessonId) return false;
  markIdAsDeleted('lessons', lessonId);
  const local = getInitialLocalLessons();
  const target = local.find((l) => l.id === lessonId);
  const filtered = local.filter((l) => l.id !== lessonId);
  saveLocalLessons(filtered);

  // Also remove any unified learning resources linked to this deleted lesson
  try {
    const uniKey = 'khtn_unified_learning_resources_v2';
    const rawUni = safeReadLocal<any[] | null>(uniKey, null);
    if (rawUni && Array.isArray(rawUni)) {
      const filteredUni = rawUni.filter(
        (r) => r.lessonId !== lessonId && (!target || r.lessonTitle !== target.title)
      );
      safeWriteLocal(uniKey, filteredUni);
    }
  } catch {
    // ignore
  }
  return true;
}

export function getGeneralUploadedAssetsSync(): LessonAssetItem[] {
  return safeReadLocal<LessonAssetItem[]>(STORAGE_KEYS.ASSETS, []);
}

export async function saveUploadedAssetToRepository(
  newAsset: LessonAssetItem
): Promise<LessonAssetItem> {
  const localLessons = getInitialLocalLessons();
  let matchedLesson = localLessons.find(
    (l) => l.id === newAsset.lessonId || l.code === newAsset.lessonId
  );

  // If uploaded from general library (or unmatched lessonId), try matching by title / lesson number
  if (!matchedLesson && (newAsset.title || newAsset.fileName)) {
    const combinedText = `${newAsset.title || ''} ${newAsset.fileName || ''}`.trim();
    if (/bảo toàn khối lượng/i.test(combinedText)) {
      matchedLesson = localLessons.find((l) => l.id === 'khtn-8-bai-5-btkl' || /bảo toàn khối lượng/i.test(l.title));
    }
    if (!matchedLesson) {
      const normTitle = (newAsset.title || '').trim().toLowerCase();
      matchedLesson = localLessons.find(
        (l) =>
          l.title.trim().toLowerCase() === normTitle ||
          (normTitle.length >= 6 && l.title.trim().toLowerCase().includes(normTitle))
      );
    }
  }

  const enriched: LessonAssetItem = {
    ...newAsset,
    id: newAsset.id || `asset-repo-${Date.now()}`,
    lessonId: matchedLesson?.id || newAsset.lessonId,
    lessonTitle: newAsset.lessonTitle || matchedLesson?.title || 'Kho học liệu chung',
    createdAt: newAsset.createdAt || new Date().toISOString(),
  };

  if (matchedLesson) {
    const existing = Array.isArray(matchedLesson.assets) ? matchedLesson.assets : [];
    matchedLesson.assets = [
      enriched,
      ...existing.filter((a) => a.id !== enriched.id),
    ];
    matchedLesson.updatedAt = new Date().toISOString();
    saveLocalLessons(localLessons);
  }

  const generalAssets = getGeneralUploadedAssetsSync();
  const updatedGeneral = [
    enriched,
    ...generalAssets.filter((a) => a.id !== enriched.id),
  ];
  safeWriteLocal(STORAGE_KEYS.ASSETS, updatedGeneral);

  return enriched;
}

export async function fetchAllAdminDocuments(): Promise<LessonAssetItem[]> {
  const lessons = await fetchAdminLessons();
  const allDocsMap = new Map<string, LessonAssetItem>();

  lessons.forEach((l) => {
    if (l.assets && l.assets.length > 0) {
      l.assets.forEach((a) => {
        if (a.fileUrl && a.fileUrl !== '#') {
          allDocsMap.set(a.id, {
            ...a,
            lessonTitle: a.lessonTitle || l.title,
          });
        }
      });
    }
  });

  const generalAssets = getGeneralUploadedAssetsSync();
  generalAssets.forEach((a) => {
    if (!allDocsMap.has(a.id) && a.fileUrl && a.fileUrl !== '#') {
      allDocsMap.set(a.id, a);
    }
  });

  return Array.from(allDocsMap.values());
}

export async function deleteAdminAsset(
  assetId: string,
  storagePath?: string
): Promise<boolean> {
  if (storagePath) {
    await deleteStorageFile('lesson-documents', storagePath);
  }
  const local = getInitialLocalLessons();
  local.forEach((l) => {
    if (l.assets) {
      l.assets = l.assets.filter((a) => a.id !== assetId);
    }
  });
  saveLocalLessons(local);

  const generalAssets = getGeneralUploadedAssetsSync().filter((a) => a.id !== assetId);
  safeWriteLocal(STORAGE_KEYS.ASSETS, generalAssets);
  return true;
}

export async function updateAssetMetadata(
  assetId: string,
  newTitle: string,
  newType: string
): Promise<boolean> {
  const local = getInitialLocalLessons();
  local.forEach((l) => {
    const asset = l.assets?.find((a) => a.id === assetId);
    if (asset) {
      asset.title = newTitle;
      asset.type = newType;
    }
  });
  saveLocalLessons(local);
  return true;
}

/**
 * ============================================================================
 * 2. TOPICS (CHỦ ĐỀ HỌC TẬP LỚP 6 - 9) MANAGEMENT
 * ============================================================================
 */
export function getAdminTopicsSync(): Topic[] {
  const deletedTopicSet = new Set(getDeletedIdsRegistrySync().topics);
  const cached = safeReadLocal<Topic[] | null>(STORAGE_KEYS.TOPICS, null);
  if (cached !== null && Array.isArray(cached)) {
    return cached.filter((t) => !deletedTopicSet.has(t.id));
  }
  const initial = TOPICS.filter((t) => !deletedTopicSet.has(t.id));
  safeWriteLocal(STORAGE_KEYS.TOPICS, initial);
  return [...initial];
}

export async function fetchAdminTopics(): Promise<Topic[]> {
  return getAdminTopicsSync();
}

export async function saveAdminTopic(topicInput: Partial<Topic> & { title: string; grade: Grade; domain: SubjectDomain }): Promise<Topic> {
  const all = getAdminTopicsSync();
  const id = topicInput.id || `topic-${topicInput.grade}-${Date.now()}`;
  unmarkIdAsDeleted('topics', id);
  const saved: Topic = {
    id,
    grade: topicInput.grade,
    domain: topicInput.domain,
    code: topicInput.code || `CD${topicInput.grade}-${all.filter((t) => t.grade === topicInput.grade).length + 1}`,
    title: topicInput.title.trim(),
    description: topicInput.description?.trim() || 'Chuyên đề Khoa học tự nhiên bộ sách Kết nối tri thức với cuộc sống.',
    lessonCount: Number(topicInput.lessonCount) || 5,
    experimentCount: Number(topicInput.experimentCount) || 2,
    icon: topicInput.icon || (topicInput.domain === 'hoa-hoc' ? 'FlaskConical' : topicInput.domain === 'vat-li' ? 'Zap' : 'Dna'),
    order: Number(topicInput.order) || all.length + 1,
    image: topicInput.image,
  };

  const idx = all.findIndex((t) => t.id === id);
  if (idx >= 0) {
    all[idx] = saved;
  } else {
    all.unshift(saved);
  }
  safeWriteLocal(STORAGE_KEYS.TOPICS, all);
  syncCmsSnapshotToRepo();
  return saved;
}

export async function deleteAdminTopic(topicId: string): Promise<boolean> {
  markIdAsDeleted('topics', topicId);
  const all = getAdminTopicsSync().filter((t) => t.id !== topicId);
  safeWriteLocal(STORAGE_KEYS.TOPICS, all);
  syncCmsSnapshotToRepo();
  return true;
}

/**
 * ============================================================================
 * 3. QUIZ QUESTIONS & EXAMS MANAGEMENT
 * ============================================================================
 */
export function getAdminQuestionsSync(): QuizQuestion[] {
  const deletedQuestionSet = new Set(getDeletedIdsRegistrySync().questions);
  const allBuiltIns = [...snapshotQuestions, ...QUIZ_QUESTIONS].filter(
    (q) => !deletedQuestionSet.has(q.id)
  );
  const cached = safeReadLocal<QuizQuestion[] | null>(STORAGE_KEYS.QUESTIONS, null);
  if (cached !== null && Array.isArray(cached)) {
    const activeCached = cached.filter((q) => !deletedQuestionSet.has(q.id));
    const builtInMap = new Map(allBuiltIns.map((q) => [q.id, q]));
    const existingIds = new Set(activeCached.map((q) => q.id));

    // Upgrade built-in questions and any cached custom questions that used old generic guidance templates
    const upgraded = activeCached.map((q) => {
      const builtIn = builtInMap.get(q.id);
      if (builtIn) {
        return {
          ...builtIn,
          ...q,
          explanation: builtIn.explanation || q.explanation,
          solutionSteps: builtIn.solutionSteps || q.solutionSteps,
          sampleAnswer: builtIn.sampleAnswer || q.sampleAnswer,
          hint: builtIn.hint || q.hint,
          allowImageUpload: q.allowImageUpload ?? builtIn.allowImageUpload,
        };
      }

      const stepsJoined = (q.solutionSteps || []).join(' ');
      const needsScientificSolutionUpgrade =
        !q.solutionSteps ||
        q.solutionSteps.length === 0 ||
        !stepsJoined.includes('Dữ kiện:') ||
        /(n_Zn|n_Fe|V_dd|R_tđ|Xác định cơ sở lý thuyết|Tóm tắt dữ kiện & Xác định bản chất|Kiến thức & Công thức|Công thức điện học|Kiến thức Sinh học gốc|Kiến thức trọng tâm|Thay trực tiếp số liệu đề bài)/i.test(
          stepsJoined
        );

      if (needsScientificSolutionUpgrade && !q.explanation?.trim()) {
        const concreteSteps = generateStepByStepSolution({
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer ?? 0,
          questionType: q.questionType || 'single_choice',
          domain: q.domain,
          grade: q.grade,
        });
        const concreteExp = generateDetailedExplanation({
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer ?? 0,
          questionType: q.questionType || 'single_choice',
          domain: q.domain,
          grade: q.grade,
        });
        return {
          ...q,
          solutionSteps: concreteSteps,
          explanation: concreteExp,
        };
      }

      return q;
    });

    // Append any newly added built-in or snapshot questions that have NOT been deleted
    const missingBuiltIns = allBuiltIns.filter(
      (q) => !existingIds.has(q.id) && !deletedQuestionSet.has(q.id)
    );
    const merged = missingBuiltIns.length > 0 ? [...upgraded, ...missingBuiltIns] : upgraded;
    safeWriteLocal(STORAGE_KEYS.QUESTIONS, merged);
    return merged;
  }
  safeWriteLocal(STORAGE_KEYS.QUESTIONS, allBuiltIns);
  return [...allBuiltIns];
}

function mapQuizQuestionToMiniQuizItem(q: QuizQuestion): LessonMiniQuizItem {
  const mappedType =
    q.questionType === 'true_false'
      ? 'true_false'
      : q.questionType === 'essay' || q.questionType === 'short_answer'
      ? 'essay'
      : 'single_choice';
  return {
    id: q.id,
    questionType: mappedType,
    question: q.question,
    options:
      mappedType === 'essay'
        ? []
        : q.options && q.options.length >= 2
        ? q.options.slice(0, 4)
        : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
    correctIndex: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 ? q.correctAnswer : 0,
    trueFalseStatements: q.trueFalseStatements,
    sampleAnswer: mappedType === 'essay' ? q.sampleAnswer || q.shortAnswer || q.explanation : undefined,
    rubric: q.rubric,
    explanation: q.explanation || 'Xem lại kiến thức trọng tâm trong bài học.',
  };
}

function syncQuestionsToLessonsMiniQuiz(questions: QuizQuestion[]): void {
  const withLesson = questions.filter((q) => q.lessonId && q.lessonId.trim() !== '');
  if (withLesson.length === 0) return;

  const localLessons = getInitialLocalLessons();
  let modified = false;

  withLesson.forEach((q) => {
    const lessonIdx = localLessons.findIndex(
      (l) =>
        l.id === q.lessonId ||
        l.slug === q.lessonId ||
        l.code.toLowerCase() === (q.lessonId || '').toLowerCase()
    );
    if (lessonIdx >= 0) {
      const currentQuiz = [...(localLessons[lessonIdx].miniQuiz || [])];
      const mapped = mapQuizQuestionToMiniQuizItem(q);
      const existingQIdx = currentQuiz.findIndex(
        (mq) =>
          (mq.id && mq.id === mapped.id) ||
          mq.question.trim().toLowerCase() === mapped.question.trim().toLowerCase()
      );
      if (existingQIdx >= 0) {
        currentQuiz[existingQIdx] = mapped;
      } else {
        currentQuiz.push(mapped);
      }
      localLessons[lessonIdx] = {
        ...localLessons[lessonIdx],
        miniQuiz: currentQuiz,
        updatedAt: new Date().toISOString(),
      };
      modified = true;
    }
  });

  if (modified) {
    safeWriteLocal(STORAGE_KEYS.LESSONS, localLessons);
  }
}

export async function fetchAdminQuestions(): Promise<QuizQuestion[]> {
  return getAdminQuestionsSync();
}

export async function saveAdminQuestion(qInput: Partial<QuizQuestion> & { question: string; grade: Grade; domain: SubjectDomain }): Promise<QuizQuestion> {
  const all = getAdminQuestionsSync();
  const id = qInput.id || `q-custom-${Date.now()}`;
  const qType = qInput.questionType || 'single_choice';
  const options =
    qType === 'essay' || qType === 'short_answer'
      ? []
      : qType === 'true_false' && Array.isArray(qInput.trueFalseStatements) && qInput.trueFalseStatements.length > 0
      ? qInput.trueFalseStatements.map((st) => `${st.label}) ${st.text}`)
      : Array.isArray(qInput.options) && qInput.options.length >= 2
      ? qInput.options
      : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'];

  const now = new Date().toISOString();
  const saved: QuizQuestion = {
    id,
    lessonId: qInput.lessonId || undefined,
    topicId: qInput.topicId || undefined,
    grade: qInput.grade,
    domain: qInput.domain,
    question: qInput.question.trim(),
    questionType: qType,
    options,
    correctAnswer: typeof qInput.correctAnswer === 'number' ? qInput.correctAnswer : 0,
    correctAnswers: qInput.correctAnswers,
    trueFalseStatements: qInput.trueFalseStatements,
    shortAnswer: qInput.shortAnswer?.trim() || undefined,
    shortAnswerUnit: qInput.shortAnswerUnit?.trim() || undefined,
    shortAnswerTolerance: qInput.shortAnswerTolerance,
    explanation: qInput.explanation?.trim() || 'Giải thích theo chuẩn kiến thức sách Kết nối tri thức với cuộc sống.',
    solutionSteps: qInput.solutionSteps,
    sampleAnswer: qInput.sampleAnswer?.trim() || undefined,
    rubric: qInput.rubric?.trim() || undefined,
    allowImageUpload: qType === 'essay' ? (qInput.allowImageUpload ?? true) : qInput.allowImageUpload,
    imageUrl: qInput.imageUrl || qInput.questionImages?.[0] || undefined,
    questionImages: qInput.questionImages,
    questionTables: qInput.questionTables,
    rawSourceBlock: qInput.rawSourceBlock,
    approvalStatus: qInput.approvalStatus || 'approved',
    sourceDocument: qInput.sourceDocument,
    createdBy: qInput.createdBy,
    createdAt: qInput.createdAt || now,
    updatedAt: now,
    difficulty: qInput.difficulty || 'Thông hiểu',
    hint: qInput.hint?.trim() || undefined,
    points: Number(qInput.points) || (qType === 'essay' ? 2.5 : qType === 'true_false' ? 1.0 : qType === 'short_answer' ? 0.5 : 0.25),
  };

  const idx = all.findIndex((item) => item.id === id);
  if (idx >= 0) {
    all[idx] = saved;
  } else {
    all.unshift(saved);
  }
  safeWriteLocal(STORAGE_KEYS.QUESTIONS, all);
  syncQuestionsToLessonsMiniQuiz([saved]);
  syncCmsSnapshotToRepo();
  return saved;
}

export async function saveAdminQuestionsBulk(
  questionsList: Array<Partial<QuizQuestion> & { question: string; grade: Grade; domain: SubjectDomain }>
): Promise<QuizQuestion[]> {
  const all = getAdminQuestionsSync();
  const savedItems: QuizQuestion[] = [];
  const now = new Date().toISOString();

  questionsList.forEach((qInput, index) => {
    const id = qInput.id || `q-word-${Date.now()}-${index + 1}`;
    const qType = qInput.questionType || 'single_choice';
    const options =
      qType === 'essay' || qType === 'short_answer'
        ? []
        : qType === 'true_false' && Array.isArray(qInput.trueFalseStatements) && qInput.trueFalseStatements.length > 0
        ? qInput.trueFalseStatements.map((st) => `${st.label}) ${st.text}`)
        : Array.isArray(qInput.options) && qInput.options.length >= 2
        ? qInput.options
        : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'];

    const saved: QuizQuestion = {
      id,
      lessonId: qInput.lessonId || undefined,
      topicId: qInput.topicId || undefined,
      grade: qInput.grade,
      domain: qInput.domain,
      question: qInput.question.trim(),
      questionType: qType,
      options,
      correctAnswer: typeof qInput.correctAnswer === 'number' ? qInput.correctAnswer : 0,
      correctAnswers: qInput.correctAnswers,
      trueFalseStatements: qInput.trueFalseStatements,
      shortAnswer: qInput.shortAnswer?.trim() || undefined,
      shortAnswerUnit: qInput.shortAnswerUnit?.trim() || undefined,
      shortAnswerTolerance: qInput.shortAnswerTolerance,
      explanation:
        qInput.explanation?.trim() ||
        'Giải thích theo chuẩn kiến thức sách Kết nối tri thức với cuộc sống.',
      solutionSteps: qInput.solutionSteps,
      sampleAnswer: qInput.sampleAnswer?.trim() || undefined,
      rubric: qInput.rubric?.trim() || undefined,
      allowImageUpload: qType === 'essay' ? (qInput.allowImageUpload ?? true) : qInput.allowImageUpload,
      imageUrl: qInput.imageUrl || qInput.questionImages?.[0] || undefined,
      questionImages: qInput.questionImages,
      questionTables: qInput.questionTables,
      rawSourceBlock: qInput.rawSourceBlock,
      approvalStatus: qInput.approvalStatus || 'approved',
      sourceDocument: qInput.sourceDocument,
      createdBy: qInput.createdBy,
      createdAt: qInput.createdAt || now,
      updatedAt: now,
      difficulty: qInput.difficulty || 'Thông hiểu',
      hint: qInput.hint?.trim() || undefined,
      points: Number(qInput.points) || (qType === 'essay' ? 2.5 : qType === 'true_false' ? 1.0 : qType === 'short_answer' ? 0.5 : 1.5),
    };

    savedItems.push(saved);
  });

  const existingIds = new Set(savedItems.map((s) => s.id));
  const merged = [...savedItems, ...all.filter((q) => !existingIds.has(q.id))];
  safeWriteLocal(STORAGE_KEYS.QUESTIONS, merged);
  syncQuestionsToLessonsMiniQuiz(savedItems);
  syncCmsSnapshotToRepo();
  return savedItems;
}

export async function deleteAdminQuestion(questionId: string): Promise<boolean> {
  markIdAsDeleted('questions', questionId);
  const all = getAdminQuestionsSync().filter((q) => q.id !== questionId);
  safeWriteLocal(STORAGE_KEYS.QUESTIONS, all);
  syncCmsSnapshotToRepo();
  return true;
}

export function getAdminQuizzesSync(): QuizMeta[] {
  const deletedQuizSet = new Set(getDeletedIdsRegistrySync().quizzes);
  const cached = safeReadLocal<QuizMeta[] | null>(STORAGE_KEYS.QUIZZES, null);
  if (cached !== null && Array.isArray(cached)) {
    return cached.filter((q) => !deletedQuizSet.has(q.id));
  }
  const initial = LESSON_QUIZZES.filter((q) => !deletedQuizSet.has(q.id));
  safeWriteLocal(STORAGE_KEYS.QUIZZES, initial);
  return [...initial];
}

export async function fetchAdminQuizzes(): Promise<QuizMeta[]> {
  return getAdminQuizzesSync();
}

export async function saveAdminQuiz(quizInput: Partial<QuizMeta> & { title: string; grade: Grade; domain: SubjectDomain }): Promise<QuizMeta> {
  const all = getAdminQuizzesSync();
  const id = quizInput.id || `quiz-custom-${Date.now()}`;
  unmarkIdAsDeleted('quizzes', id);
  const saved: QuizMeta = {
    id,
    lessonId: quizInput.lessonId,
    lessonTitle: quizInput.lessonTitle,
    grade: quizInput.grade,
    domain: quizInput.domain,
    title: quizInput.title.trim(),
    description: quizInput.description?.trim() || 'Đề kiểm tra năng lực Khoa học tự nhiên Kết nối tri thức.',
    durationMinutes: Number(quizInput.durationMinutes) || 15,
    passScore: Number(quizInput.passScore) || 6.0,
    questionCount: Number(quizInput.questionCount) || 5,
    isPublished: quizInput.isPublished ?? true,
  };

  const idx = all.findIndex((q) => q.id === id);
  if (idx >= 0) {
    all[idx] = saved;
  } else {
    all.unshift(saved);
  }
  safeWriteLocal(STORAGE_KEYS.QUIZZES, all);
  syncCmsSnapshotToRepo();
  return saved;
}

export async function deleteAdminQuiz(quizId: string): Promise<boolean> {
  markIdAsDeleted('quizzes', quizId);
  const all = getAdminQuizzesSync().filter((q) => q.id !== quizId);
  safeWriteLocal(STORAGE_KEYS.QUIZZES, all);
  syncCmsSnapshotToRepo();
  return true;
}

/**
 * ============================================================================
 * 4. VIDEOS MANAGEMENT
 * ============================================================================
 */
export function getAdminVideosSync(): VideoLesson[] {
  const deletedVideoSet = new Set(getDeletedIdsRegistrySync().videos);
  const cached = safeReadLocal<VideoLesson[] | null>(STORAGE_KEYS.VIDEOS, null);
  if (cached !== null && Array.isArray(cached)) {
    return cached.filter((v) => !deletedVideoSet.has(v.id));
  }
  const initial = VIDEOS.filter((v) => !deletedVideoSet.has(v.id));
  safeWriteLocal(STORAGE_KEYS.VIDEOS, initial);
  return [...initial];
}

export async function fetchAdminVideos(): Promise<VideoLesson[]> {
  return getAdminVideosSync();
}

export async function saveAdminVideo(vInput: Partial<VideoLesson> & { title: string; grade: Grade; domain: SubjectDomain; youtubeId: string }): Promise<VideoLesson> {
  const all = getAdminVideosSync();
  const id = vInput.id || `vid-custom-${Date.now()}`;
  unmarkIdAsDeleted('videos', id);
  const cleanYt = extractYouTubeId(vInput.youtubeId) || vInput.youtubeId.trim();

  const saved: VideoLesson = {
    id,
    title: vInput.title.trim(),
    grade: vInput.grade,
    domain: vInput.domain,
    duration: vInput.duration?.trim() || '12:30',
    youtubeId: cleanYt,
    experimentType: vInput.experimentType || 'Thí nghiệm thực hành',
    instructor: vInput.instructor?.trim() || 'KHOA HỌC SỐ KHTN',
    description: vInput.description?.trim() || 'Video trực quan phục vụ bài giảng Khoa học tự nhiên.',
    views: Number(vInput.views) || 150,
    timestamps: vInput.timestamps && vInput.timestamps.length > 0
      ? vInput.timestamps
      : [
          { time: '00:00', label: 'Giới thiệu mục tiêu thí nghiệm' },
          { time: '03:30', label: 'Tiến hành quan sát hiện tượng' },
          { time: '08:00', label: 'Giải thích cơ chế & Công thức' },
        ],
  };

  const idx = all.findIndex((v) => v.id === id);
  if (idx >= 0) {
    all[idx] = saved;
  } else {
    all.unshift(saved);
  }
  safeWriteLocal(STORAGE_KEYS.VIDEOS, all);
  syncCmsSnapshotToRepo();
  return saved;
}

export async function deleteAdminVideo(videoId: string): Promise<boolean> {
  const currentVideos = getAdminVideosSync();
  const targetVideo = currentVideos.find((v) => v.id === videoId);
  markIdAsDeleted('videos', videoId);
  const all = currentVideos.filter((v) => v.id !== videoId);
  safeWriteLocal(STORAGE_KEYS.VIDEOS, all);

  // Also clear matching videoUrl from any lessons that used this video's youtubeId
  if (targetVideo && targetVideo.youtubeId) {
    const targetYtId = extractYouTubeId(targetVideo.youtubeId) || targetVideo.youtubeId;
    const localLessons = getInitialLocalLessons();
    let lessonsModified = false;
    localLessons.forEach((l) => {
      const lessonYtId = extractYouTubeId(l.videoUrl || '');
      if (lessonYtId && lessonYtId === targetYtId) {
        markIdAsDeleted('clearedLessonVideoIds', l.id);
        l.videoUrl = '';
        l.updatedAt = new Date().toISOString();
        lessonsModified = true;
      }
    });
    if (lessonsModified) {
      safeWriteLocal(STORAGE_KEYS.LESSONS, localLessons);
    }

    try {
      const uniKey = 'khtn_unified_learning_resources_v2';
      const rawUni = safeReadLocal<any[] | null>(uniKey, null);
      if (rawUni && Array.isArray(rawUni)) {
        const filteredUni = rawUni.filter((r) => {
          if (r.category !== 'video') return true;
          const rYtId = extractYouTubeId(r.externalUrl || '');
          return rYtId !== targetYtId;
        });
        safeWriteLocal(uniKey, filteredUni);
      }
    } catch {
      // ignore
    }
  }

  syncCmsSnapshotToRepo();
  return true;
}

/**
 * ============================================================================
 * 5. CATALOG DOCUMENTS (/tai-lieu) MANAGEMENT
 * ============================================================================
 */
export function getAdminCatalogDocsSync(): DocumentItem[] {
  const deletedDocSet = new Set(getDeletedIdsRegistrySync().catalogDocs);
  const cached = safeReadLocal<DocumentItem[] | null>(STORAGE_KEYS.CATALOG_DOCS, null);
  if (cached !== null && Array.isArray(cached)) {
    const activeCached = cached.filter((d) => !deletedDocSet.has(d.id));
    const existingIds = new Set(activeCached.map((d) => d.id));
    const missingBuiltIns = DOCUMENTS.filter(
      (d) => !existingIds.has(d.id) && !deletedDocSet.has(d.id)
    );
    if (missingBuiltIns.length > 0) {
      const merged = [...activeCached, ...missingBuiltIns];
      safeWriteLocal(STORAGE_KEYS.CATALOG_DOCS, merged);
      return merged;
    }
    return activeCached;
  }
  const initial = DOCUMENTS.filter((d) => !deletedDocSet.has(d.id));
  safeWriteLocal(STORAGE_KEYS.CATALOG_DOCS, initial);
  return [...initial];
}

export async function fetchAdminCatalogDocs(): Promise<DocumentItem[]> {
  return getAdminCatalogDocsSync();
}

export async function saveAdminCatalogDoc(docInput: Partial<DocumentItem> & { title: string; grade: Grade; domain: SubjectDomain }): Promise<DocumentItem> {
  const all = getAdminCatalogDocsSync();
  const id = docInput.id || `doc-custom-${Date.now()}`;
  unmarkIdAsDeleted('catalogDocs', id);
  const resolvedUrl =
    (docInput.fileUrl && docInput.fileUrl.trim() !== '#' ? docInput.fileUrl.trim() : '') ||
    (docInput.downloadUrl && docInput.downloadUrl.trim() !== '#' ? docInput.downloadUrl.trim() : '') ||
    '#';

  const saved: DocumentItem = {
    id,
    lessonId: docInput.lessonId,
    title: docInput.title.trim(),
    grade: docInput.grade,
    domain: docInput.domain,
    format: docInput.format || 'pdf',
    type: docInput.type?.trim() || 'Đề cương ôn tập',
    pageCount: Number(docInput.pageCount) || 12,
    fileSize: docInput.fileSize?.trim() || '3.5 MB',
    description: docInput.description?.trim() || 'Tài liệu chuẩn hóa danh pháp IUPAC - Kết nối tri thức với cuộc sống.',
    author: docInput.author?.trim() || 'KHOA HỌC SỐ KHTN',
    downloadCount: Number(docInput.downloadCount) || 50,
    downloadUrl: resolvedUrl,
    fileUrl: resolvedUrl !== '#' ? resolvedUrl : undefined,
    fileName: docInput.fileName,
    previewSlides: docInput.previewSlides || [
      'Tóm tắt lý thuyết trọng tâm & Công thức chuẩn',
      'Hệ thống bài tập trắc nghiệm và tự luận có lời giải',
    ],
  };

  const idx = all.findIndex((d) => d.id === id);
  if (idx >= 0) {
    all[idx] = saved;
  } else {
    all.unshift(saved);
  }
  safeWriteLocal(STORAGE_KEYS.CATALOG_DOCS, all);
  syncCmsSnapshotToRepo();
  return saved;
}

export async function deleteAdminCatalogDoc(docId: string): Promise<boolean> {
  markIdAsDeleted('catalogDocs', docId);
  const all = getAdminCatalogDocsSync().filter((d) => d.id !== docId);
  safeWriteLocal(STORAGE_KEYS.CATALOG_DOCS, all);
  syncCmsSnapshotToRepo();
  return true;
}

/**
 * ============================================================================
 * 6. SCIENCE GAMES (GHÉP THẺ, GIẢI MÃ Ô CHỮ, THÁM TỬ CÔNG THỨC) MANAGEMENT
 * ============================================================================
 */
export function getAdminGamePairsSync(): SciencePairItem[] {
  const cached = safeReadLocal<SciencePairItem[] | null>(STORAGE_KEYS.GAME_PAIRS, null);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  safeWriteLocal(STORAGE_KEYS.GAME_PAIRS, SCIENCE_PAIR_BANK);
  return [...SCIENCE_PAIR_BANK];
}

export async function saveAdminGamePair(pairInput: Partial<SciencePairItem> & { term: string; definition: string; grade: Grade; domain: SubjectDomain }): Promise<SciencePairItem> {
  const all = getAdminGamePairsSync();
  const id = pairInput.id || `pair-${Date.now()}`;
  const saved: SciencePairItem = {
    id,
    grade: pairInput.grade,
    domain: pairInput.domain,
    term: pairInput.term.trim(),
    definition: pairInput.definition.trim(),
    explanation: pairInput.explanation?.trim() || `${pairInput.term} tương ứng với ${pairInput.definition}.`,
  };
  const idx = all.findIndex((p) => p.id === id);
  if (idx >= 0) all[idx] = saved;
  else all.unshift(saved);
  safeWriteLocal(STORAGE_KEYS.GAME_PAIRS, all);
  return saved;
}

export async function deleteAdminGamePair(id: string): Promise<boolean> {
  const all = getAdminGamePairsSync().filter((p) => p.id !== id);
  safeWriteLocal(STORAGE_KEYS.GAME_PAIRS, all);
  return true;
}

export function getAdminCrosswordsSync(): CrosswordRowItem[] {
  const cached = safeReadLocal<CrosswordRowItem[] | null>(STORAGE_KEYS.GAME_CROSSWORDS, null);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  safeWriteLocal(STORAGE_KEYS.GAME_CROSSWORDS, CROSSWORD_ROW_BANK);
  return [...CROSSWORD_ROW_BANK];
}

export async function saveAdminCrossword(cwInput: Partial<CrosswordRowItem> & { displayTerm: string; clue: string; grade: Grade; domain: SubjectDomain }): Promise<CrosswordRowItem> {
  const all = getAdminCrosswordsSync();
  const id = cwInput.id || `cw-${Date.now()}`;
  const normalizedAns = normalizeCrosswordInput(cwInput.answer || cwInput.displayTerm);
  const saved: CrosswordRowItem = {
    id,
    grade: cwInput.grade,
    domain: cwInput.domain,
    answer: normalizedAns || 'KHOAHOC',
    displayTerm: cwInput.displayTerm.trim(),
    keyColumnIndex: Number(cwInput.keyColumnIndex) || 0,
    clue: cwInput.clue.trim(),
    scientificHint: cwInput.scientificHint?.trim() || `Từ khóa gồm ${normalizedAns.length} chữ cái.`,
    explanation: cwInput.explanation?.trim() || `${cwInput.displayTerm}: ${cwInput.clue}`,
  };
  const idx = all.findIndex((c) => c.id === id);
  if (idx >= 0) all[idx] = saved;
  else all.unshift(saved);
  safeWriteLocal(STORAGE_KEYS.GAME_CROSSWORDS, all);
  return saved;
}

export async function deleteAdminCrossword(id: string): Promise<boolean> {
  const all = getAdminCrosswordsSync().filter((c) => c.id !== id);
  safeWriteLocal(STORAGE_KEYS.GAME_CROSSWORDS, all);
  return true;
}

export function getAdminDetectivePuzzlesSync(): DetectivePuzzleItem[] {
  const cached = safeReadLocal<DetectivePuzzleItem[] | null>(STORAGE_KEYS.GAME_DETECTIVE, null);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  safeWriteLocal(STORAGE_KEYS.GAME_DETECTIVE, DETECTIVE_PUZZLE_BANK);
  return [...DETECTIVE_PUZZLE_BANK];
}

export async function saveAdminDetectivePuzzle(detInput: Partial<DetectivePuzzleItem> & { clue: string; displayAnswer: string; grade: Grade; domain: SubjectDomain }): Promise<DetectivePuzzleItem> {
  const all = getAdminDetectivePuzzlesSync();
  const id = detInput.id || `det-${Date.now()}`;
  const normalizedAns = normalizeCrosswordInput(detInput.answer || detInput.displayAnswer);
  const chars = normalizedAns.split('');
  const extraChars = ['A', 'O', 'N', 'H', 'C', 'S', 'I', 'E'];
  const pool = Array.from(new Set([...chars, ...extraChars])).slice(0, Math.max(chars.length + 3, 8));

  const saved: DetectivePuzzleItem = {
    id,
    grade: detInput.grade,
    domain: detInput.domain,
    clue: detInput.clue.trim(),
    answer: normalizedAns || 'SODIUM',
    displayFormula: detInput.displayFormula?.trim() || detInput.displayAnswer.trim(),
    displayAnswer: detInput.displayAnswer.trim(),
    lettersPool: detInput.lettersPool && detInput.lettersPool.length >= chars.length ? detInput.lettersPool : pool,
    scientificHint: detInput.scientificHint?.trim() || 'Dựa vào tính chất đặc trưng theo sách Kết nối tri thức.',
    explanation: detInput.explanation?.trim() || `${detInput.displayAnswer}: ${detInput.clue}`,
  };
  const idx = all.findIndex((d) => d.id === id);
  if (idx >= 0) all[idx] = saved;
  else all.unshift(saved);
  safeWriteLocal(STORAGE_KEYS.GAME_DETECTIVE, all);
  return saved;
}

export async function deleteAdminDetectivePuzzle(id: string): Promise<boolean> {
  const all = getAdminDetectivePuzzlesSync().filter((d) => d.id !== id);
  safeWriteLocal(STORAGE_KEYS.GAME_DETECTIVE, all);
  return true;
}

/**
 * ============================================================================
 * 7. USERS & ROLES MANAGEMENT
 * ============================================================================
 */
const INITIAL_USERS: AppUser[] = [
  DEMO_USERS.teacher,
  {
    id: 'user_teacher_physics',
    email: 'giaovien.vatli@khtn.edu.vn',
    fullName: 'Giáo viên Bộ môn KHTN (Tổ Tự nhiên)',
    role: 'teacher',
    grade: 9,
    school: 'Đà Nẵng, Việt Nam',
  },
];

export function getAdminUsersSync(): AppUser[] {
  const cached = safeReadLocal<AppUser[] | null>(STORAGE_KEYS.USERS, null);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }
  safeWriteLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
  return [...INITIAL_USERS];
}

export async function saveAdminUser(uInput: Partial<AppUser> & { fullName: string; email: string; role: 'admin' | 'teacher' | 'student' }): Promise<AppUser> {
  const all = getAdminUsersSync();
  const id = uInput.id || `user_${Date.now()}`;
  const saved: AppUser = {
    id,
    fullName: uInput.fullName.trim(),
    email: uInput.email.trim(),
    role: uInput.role,
    grade: uInput.grade || 8,
    school: uInput.school?.trim() || 'Đà Nẵng, Việt Nam',
    avatarUrl: uInput.avatarUrl,
  };
  const idx = all.findIndex((u) => u.id === id);
  if (idx >= 0) all[idx] = saved;
  else all.unshift(saved);
  safeWriteLocal(STORAGE_KEYS.USERS, all);
  return saved;
}

export async function deleteAdminUser(userId: string): Promise<boolean> {
  const all = getAdminUsersSync().filter((u) => u.id !== userId);
  safeWriteLocal(STORAGE_KEYS.USERS, all);
  return true;
}

/**
 * ============================================================================
 * 8. SITE SETTINGS & FULL BACKUP / RESTORE
 * ============================================================================
 */
export function getSiteSettingsSync(): SiteSettings {
  return safeReadLocal<SiteSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SITE_SETTINGS);
}

export function saveSiteSettingsSync(settings: SiteSettings): SiteSettings {
  safeWriteLocal(STORAGE_KEYS.SETTINGS, settings);
  return settings;
}

export function resetAllAdminDataToDefault(): void {
  memoryFallbackStore.clear();
  if (typeof localStorage === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
  try {
    localStorage.removeItem('khtn_unified_learning_resources_v2');
  } catch {
    // ignore
  }
  syncCmsSnapshotToRepo();
}

