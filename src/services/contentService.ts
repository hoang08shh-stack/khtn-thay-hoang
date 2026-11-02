import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { TOPICS, LESSONS, SIMULATIONS_3D, DOCUMENTS } from '../data/mockData.ts';
import { Topic, Lesson, Simulation3D, DocumentItem, Grade, SubjectDomain } from '../types/index.ts';

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
          title: t.title,
          description: t.description,
          lessonCount: 4,
          experimentCount: 2,
          icon: 'BookOpen',
          order: t.order_index,
        }));
      }
    } catch (err) {
      console.warn('Supabase getTopics failed, falling back to mock:', err);
    }
  }

  return TOPICS.filter((t) => {
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
          objectives: ['Nắm vững kiến thức trọng tâm', 'Thực hành mô phỏng 3D'],
          durationMinutes: l.duration_minutes,
          sections: [
            {
              title: 'Nội dung cốt lõi',
              content: [l.content],
            },
          ],
          keyTakeaways: ['Ghi nhớ định luật', 'Vận dụng giải bài tập'],
          thumbnailUrl: l.thumbnail_url || undefined,
          quizCount: 5,
          viewCount: l.view_count,
          author: 'Thầy Hoàng',
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
        .map((l: any) => ({
          id: l.id,
          topicId: l.topicId,
          grade: l.grade,
          domain: l.domain,
          code: l.code,
          title: l.title,
          summary: l.summary,
          objectives: ['Nắm vững kiến thức trọng tâm GDPT 2018', 'Thực hành mô phỏng 3D'],
          durationMinutes: l.durationMinutes || 45,
          sections: [
            {
              title: 'Nội dung cốt lõi',
              content: [l.content || l.summary],
            },
          ],
          keyTakeaways: ['Ghi nhớ định luật', 'Vận dụng giải bài tập thực tế'],
          thumbnailUrl: l.thumbnailUrl,
          simulationId: l.simulationIds?.[0],
          videoUrl: l.videoUrl,
          quizCount: 5,
          viewCount: l.viewCount || 0,
          author: 'Thầy Hoàng',
        }));
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

/**
 * Fetch 3D Simulations
 */
export async function getSimulations(grade?: Grade, domain?: SubjectDomain): Promise<Simulation3D[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('simulations')
        .select('*')
        .eq('is_published', true);

      if (grade) query = query.eq('grade', grade);
      if (domain) query = query.eq('domain', domain);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // Return simulations mapped with local configurations
        return SIMULATIONS_3D.filter((s) => {
          if (grade && s.grade !== grade) return false;
          if (domain && s.domain !== domain) return false;
          return true;
        });
      }
    } catch (err) {
      console.warn('Supabase getSimulations failed, using mock:', err);
    }
  }

  return SIMULATIONS_3D.filter((s) => {
    if (grade && s.grade !== grade) return false;
    if (domain && s.domain !== domain) return false;
    return true;
  });
}
