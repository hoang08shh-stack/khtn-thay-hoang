import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { TOPICS, LESSONS, SIMULATIONS_3D, DOCUMENTS, VIDEOS } from '../data/mockData.ts';
import {
  getAdminTopicsSync,
  getAdminVideosSync,
  getAdminCatalogDocsSync,
} from './adminService.ts';
import {
  Topic,
  Lesson,
  Simulation3D,
  DocumentItem,
  VideoLesson,
  Grade,
  SubjectDomain,
} from '../types/index.ts';

/**
 * Fetch all published topics
 */
export async function getTopics(grade?: Grade, domain?: SubjectDomain): Promise<Topic[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('topics').select('*').order('order_index', { ascending: true });
      if (grade) query = query.eq('grade', grade);
      if (domain) query = query.eq('domain', domain);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((t: any) => ({
          id: t.id,
          grade: t.grade as Grade,
          domain: t.domain as SubjectDomain,
          code: t.code,
          chapterNumber: t.code,
          title: t.title,
          description: t.description,
          lessonCount: 4,
          lessonsCount: 4,
          experimentCount: 2,
          icon: 'BookOpen',
          order: t.order_index,
        }));
      }
    } catch (err) {
      console.warn('Supabase getTopics failed, falling back to mock:', err);
    }
  }

  const allTopics = getAdminTopicsSync();
  return allTopics.filter((t) => {
    if (grade && t.grade !== grade) return false;
    if (domain && t.domain !== domain) return false;
    return true;
  });
}

/**
 * Fetch all published lessons
 */
export async function getLessons(grade?: Grade, domain?: SubjectDomain): Promise<Lesson[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('lessons')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: true });

      if (grade) query = query.eq('grade', grade);
      if (domain) query = query.eq('domain', domain);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((l: any) => ({
          id: l.id,
          topicId: l.topic_id || '',
          grade: l.grade as Grade,
          domain: l.domain as SubjectDomain,
          code: l.code,
          title: l.title,
          summary: l.summary,
          objectives: [
            'Nắm vững kiến thức trọng tâm bộ sách Kết nối tri thức với cuộc sống',
            'Thực hành mô phỏng 3D tại KHOA HỌC SỐ KHTN',
          ],
          durationMinutes: l.duration_minutes || 45,
          sections: [
            {
              title: 'Nội dung cốt lõi',
              content: [l.content || l.summary],
            },
          ],
          keyTakeaways: ['Ghi nhớ định luật khoa học', 'Vận dụng giải bài tập thực tế'],
          thumbnailUrl: l.thumbnail_url || undefined,
          quizCount: 5,
          viewCount: l.view_count || 100,
          author: 'KHOA HỌC SỐ KHTN',
        }));
      }
    } catch (err) {
      console.warn('Supabase getLessons failed, falling back to mock:', err);
    }
  }

  // Local / offline fallback: strictly filter only published lessons
  let allLessons: Lesson[] = LESSONS;
  try {
    const raw = localStorage.getItem('khtn_admin_lessons_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      const published = parsed
        .filter((l: any) => l.isPublished === true)
        .map((l: any) => {
          const baseMatch = LESSONS.find((m) => m.id === l.id);
          return {
            ...(baseMatch || {}),
            id: l.id,
            topicId: l.topicId,
            grade: l.grade,
            domain: l.domain,
            code: l.code,
            title: l.title,
            summary: l.summary,
            objectives: baseMatch?.objectives || [
              'Nắm vững kiến thức trọng tâm sách Kết nối tri thức với cuộc sống',
              'Thực hành mô phỏng 3D tại KHOA HỌC SỐ KHTN',
            ],
            durationMinutes: l.durationMinutes || 45,
            sections: baseMatch?.sections || [
              {
                title: 'Nội dung cốt lõi',
                content: [l.content || l.summary],
              },
            ],
            keyTakeaways: baseMatch?.keyTakeaways || [
              'Ghi nhớ định luật khoa học',
              'Vận dụng giải bài tập thực tế',
            ],
            thumbnailUrl: l.thumbnailUrl || baseMatch?.thumbnailUrl,
            simulationId: l.simulationIds?.[0] || baseMatch?.simulationId,
            videoUrl: l.videoUrl || baseMatch?.videoUrl,
            quizCount: 5,
            viewCount: l.viewCount || 120,
            author: 'KHOA HỌC SỐ KHTN',
          };
        });
      if (published.length > 0) {
        allLessons = published;
      }
    }
  } catch (e) {
    // ignore local storage errors
  }

  return allLessons.filter((l) => {
    if (grade && l.grade !== grade) return false;
    if (domain && l.domain !== domain) return false;
    return true;
  });
}

export async function getPublishedLessons(): Promise<Lesson[]> {
  return getLessons();
}

export async function getLessonsByGrade(grade: Grade): Promise<Lesson[]> {
  return getLessons(grade);
}

export async function getLessonByIdOrSlug(idOrSlug: string): Promise<Lesson | null> {
  const all = await getLessons();
  return (
    all.find((l) => l.id === idOrSlug || l.code.toLowerCase() === idOrSlug.toLowerCase()) ||
    LESSONS.find((l) => l.id === idOrSlug) ||
    LESSONS[0] ||
    null
  );
}

/**
 * Fetch 3D Simulations
 */
export async function getSimulations(
  grade?: Grade,
  domain?: SubjectDomain
): Promise<Simulation3D[]> {
  return SIMULATIONS_3D.filter((s) => {
    if (grade && s.grade !== grade) return false;
    if (domain && s.domain !== domain) return false;
    return true;
  });
}

export async function getAllDocuments(): Promise<DocumentItem[]> {
  return getAdminCatalogDocsSync();
}

export async function getDocumentsByGrade(grade: Grade): Promise<DocumentItem[]> {
  return getAdminCatalogDocsSync().filter((d) => d.grade === grade);
}

export async function getAllVideos(): Promise<VideoLesson[]> {
  return getAdminVideosSync();
}

export async function getVideosByGrade(grade: Grade): Promise<VideoLesson[]> {
  return getAdminVideosSync().filter((v) => v.grade === grade);
}
