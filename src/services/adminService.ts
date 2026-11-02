import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { Grade, SubjectDomain } from '../types/index.ts';
import { LESSONS, DOCUMENTS, TOPICS } from '../data/mockData.ts';
import { deleteStorageFile } from './storageService.ts';

export interface LessonAssetItem {
  id: string;
  lessonId: string;
  title: string;
  format: 'pptx' | 'pdf' | 'docx' | 'png' | 'jpg' | 'xlsx' | 'zip';
  type: string;
  fileSize: string;
  fileUrl: string;
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
}

const LOCAL_STORAGE_KEY_LESSONS = 'khtn_admin_lessons_v2';
const LOCAL_STORAGE_KEY_ASSETS = 'khtn_admin_assets_v2';

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
 * Extract YouTube 11-character video ID from URL or raw ID
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already standard 11 alphanumeric characters
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube URL regex
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regex);
  return match ? match[1] : null;
}

/**
 * Initialize default local data from mock data
 */
function getInitialLocalLessons(): AdminLesson[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LESSONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read lessons from localStorage:', e);
  }

  // Pre-populate from mock data
  const initial = LESSONS.map((l, index) => ({
    id: l.id,
    topicId: l.topicId || 'topic-default',
    grade: l.grade,
    domain: l.domain,
    code: l.code,
    slug: generateSlug(l.title),
    title: l.title,
    summary: l.summary,
    content: l.sections?.map((s) => `### ${s.title}\n${s.content.join('\n')}`).join('\n\n') || l.summary,
    durationMinutes: l.durationMinutes || 45,
    orderIndex: index + 1,
    isPublished: true, // Default lessons are published
    thumbnailUrl: l.thumbnailUrl,
    videoUrl: l.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    viewCount: l.viewCount || 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    simulationIds: l.simulationId ? [l.simulationId] : [],
    assets: [
      {
        id: `asset-${l.id}-1`,
        lessonId: l.id,
        title: `Giáo án điện tử PowerPoint - ${l.title}`,
        format: 'pptx' as const,
        type: 'Giáo án điện tử',
        fileSize: '18.4 MB',
        fileUrl: '#',
        storagePath: `lesson-documents/${l.id}/giao_an.pptx`,
        downloadsCount: 45,
      },
      {
        id: `asset-${l.id}-2`,
        lessonId: l.id,
        title: `Phiếu học tập và bài tập KHTN - ${l.title}`,
        format: 'pdf' as const,
        type: 'Phiếu học tập',
        fileSize: '2.1 MB',
        fileUrl: '#',
        storagePath: `lesson-documents/${l.id}/phieu_hoc_tap.pdf`,
        downloadsCount: 89,
      },
    ],
  }));

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_LESSONS, JSON.stringify(initial));
  } catch (e) {
    // Ignore storage quota errors
  }

  return initial;
}

function saveLocalLessons(lessons: AdminLesson[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_LESSONS, JSON.stringify(lessons));
  } catch (e) {
    console.warn('Failed to save lessons to localStorage:', e);
  }
}

/**
 * Fetch all lessons for Admin / Teacher (including Drafts)
 */
export async function fetchAdminLessons(): Promise<AdminLesson[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });

      if (lessonsError) {
        console.warn('Supabase fetch lessons failed:', lessonsError);
      } else if (lessonsData && lessonsData.length > 0) {
        // 2. Fetch all lesson_assets
        const { data: assetsData } = await supabase
          .from('lesson_assets')
          .select('*');

        // 3. Fetch lesson_simulations
        const { data: simLinks } = await supabase
          .from('lesson_simulations')
          .select('*');

        return lessonsData.map((l: any) => {
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

          return {
            id: l.id,
            topicId: l.topic_id || '',
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
            thumbnailUrl: l.thumbnail_url || undefined,
            videoUrl: l.video_url || undefined,
            viewCount: l.view_count || 0,
            createdAt: l.created_at,
            updatedAt: l.updated_at,
            assets: lessonAssets,
            simulationIds,
          };
        });
      }
    } catch (err) {
      console.warn('Supabase fetch error, fallback to local:', err);
    }
  }

  return getInitialLocalLessons();
}

/**
 * Check if a slug is available/unique
 */
export async function checkSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<{ available: boolean; reason?: string }> {
  if (!slug || slug.trim().length < 2) {
    return { available: false, reason: 'Slug phải có ít nhất 2 ký tự.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('lessons')
        .select('id, slug, code')
        .or(`slug.eq.${slug},code.eq.${slug}`);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return {
          available: false,
          reason: `Đường dẫn/mã "${slug}" đã được sử dụng bởi một bài học khác.`,
        };
      }
      return { available: true };
    } catch (err) {
      console.warn('Supabase slug check fallback to local check:', err);
    }
  }

  // Local check
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

/**
 * Save Lesson (Create or Update) + sync assets and simulations
 */
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
  },
  assets: LessonAssetItem[],
  simulationIds: string[] = []
): Promise<AdminLesson> {
  const finalSlug = lessonData.slug?.trim() || generateSlug(lessonData.title);
  const now = new Date().toISOString();

  // 1. Supabase live database save
  if (isSupabaseConfigured && supabase) {
    try {
      let savedLessonId = lessonData.id;

      if (savedLessonId) {
        // UPDATE
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            topic_id: lessonData.topicId || null,
            grade: lessonData.grade,
            domain: lessonData.domain,
            code: lessonData.code,
            slug: finalSlug,
            title: lessonData.title,
            summary: lessonData.summary,
            content: lessonData.content,
            duration_minutes: lessonData.durationMinutes,
            order_index: lessonData.orderIndex,
            is_published: lessonData.isPublished,
            thumbnail_url: lessonData.thumbnailUrl || null,
            video_url: lessonData.videoUrl || null,
            updated_at: now,
          })
          .eq('id', savedLessonId);

        if (updateError) throw new Error(updateError.message);
      } else {
        // INSERT
        const { data: insertData, error: insertError } = await supabase
          .from('lessons')
          .insert({
            topic_id: lessonData.topicId || null,
            grade: lessonData.grade,
            domain: lessonData.domain,
            code: lessonData.code,
            slug: finalSlug,
            title: lessonData.title,
            summary: lessonData.summary,
            content: lessonData.content,
            duration_minutes: lessonData.durationMinutes,
            order_index: lessonData.orderIndex,
            is_published: lessonData.isPublished,
            thumbnail_url: lessonData.thumbnailUrl || null,
            video_url: lessonData.videoUrl || null,
            created_at: now,
            updated_at: now,
          })
          .select('id')
          .single();

        if (insertError) throw new Error(insertError.message);
        savedLessonId = insertData.id;
      }

      // Sync lesson_assets
      if (savedLessonId) {
        // Delete old assets not in current list
        const currentAssetIds = assets.map((a) => a.id).filter(Boolean);
        if (currentAssetIds.length > 0) {
          await supabase
            .from('lesson_assets')
            .delete()
            .eq('lesson_id', savedLessonId)
            .not('id', 'in', `(${currentAssetIds.join(',')})`);
        } else {
          await supabase
            .from('lesson_assets')
            .delete()
            .eq('lesson_id', savedLessonId);
        }

        // Upsert assets
        for (const asset of assets) {
          await supabase.from('lesson_assets').upsert({
            id: asset.id.startsWith('temp-') ? undefined : asset.id,
            lesson_id: savedLessonId,
            title: asset.title,
            format: asset.format,
            type: asset.type,
            file_size: asset.fileSize,
            file_url: asset.fileUrl,
            storage_path: asset.storagePath || null,
            downloads_count: asset.downloadsCount || 0,
          });
        }

        // Sync lesson_simulations
        await supabase
          .from('lesson_simulations')
          .delete()
          .eq('lesson_id', savedLessonId);

        if (simulationIds.length > 0) {
          const simRows = simulationIds.map((simId) => ({
            lesson_id: savedLessonId,
            simulation_id: simId,
          }));
          await supabase.from('lesson_simulations').insert(simRows);
        }
      }

      return {
        id: savedLessonId || lessonData.id || ('lesson_' + Date.now()),
        ...lessonData,
        slug: finalSlug,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
        assets,
        simulationIds,
      };
    } catch (err: any) {
      console.warn('Supabase saveLesson failed, using local store:', err);
    }
  }

  // 2. Local fallback save
  const local = getInitialLocalLessons();
  const id = lessonData.id || `custom-lesson-${Date.now()}`;

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
    videoUrl: lessonData.videoUrl,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
    assets: assets.map((a, i) => ({
      ...a,
      id: a.id || `asset-${id}-${i}`,
      lessonId: id,
    })),
    simulationIds,
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

/**
 * Toggle Publish / Draft status of a lesson
 */
export async function toggleLessonPublish(
  lessonId: string,
  isPublished: boolean
): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ is_published: isPublished, updated_at: new Date().toISOString() })
        .eq('id', lessonId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase togglePublish failed, updating local:', err);
    }
  }

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

/**
 * Delete a lesson and all associated files/records
 */
export async function deleteAdminLesson(lessonId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      // Find assets to delete files from storage
      const { data: assets } = await supabase
        .from('lesson_assets')
        .select('storage_path')
        .eq('lesson_id', lessonId);

      if (assets) {
        for (const a of assets) {
          if (a.storage_path) {
            await deleteStorageFile('lesson-documents', a.storage_path);
          }
        }
      }

      // Delete from DB (cascades to lesson_assets, lesson_simulations)
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase deleteLesson failed, falling back to local:', err);
    }
  }

  const local = getInitialLocalLessons();
  const filtered = local.filter((l) => l.id !== lessonId);
  saveLocalLessons(filtered);
  return true;
}

/**
 * Fetch all documents across all lessons
 */
export async function fetchAllAdminDocuments(): Promise<LessonAssetItem[]> {
  const lessons = await fetchAdminLessons();
  const allDocs: LessonAssetItem[] = [];

  lessons.forEach((l) => {
    if (l.assets && l.assets.length > 0) {
      l.assets.forEach((a) => {
        allDocs.push({
          ...a,
          lessonTitle: l.title,
        });
      });
    }
  });

  return allDocs;
}

/**
 * Delete a single asset
 */
export async function deleteAdminAsset(
  assetId: string,
  storagePath?: string
): Promise<boolean> {
  if (storagePath) {
    await deleteStorageFile('lesson-documents', storagePath);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('lesson_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase delete asset error:', err);
    }
  }

  const local = getInitialLocalLessons();
  local.forEach((l) => {
    if (l.assets) {
      l.assets = l.assets.filter((a) => a.id !== assetId);
    }
  });
  saveLocalLessons(local);
  return true;
}

/**
 * Update asset title or type metadata
 */
export async function updateAssetMetadata(
  assetId: string,
  newTitle: string,
  newType: string
): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('lesson_assets')
        .update({ title: newTitle, type: newType })
        .eq('id', assetId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase update asset error:', err);
    }
  }

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
