import { supabase, isSupabaseConfigured, getInitialProgress, saveUserProgress } from '../lib/supabase.ts';
import { getPublishedLessonsSync } from './contentService.ts';
import { Grade, SubjectDomain, UserProgress } from '../types/index.ts';

export interface LessonProgressRecord {
  lessonId: string;
  lessonCode: string;
  lessonTitle: string;
  grade: Grade;
  domain: SubjectDomain;
  completed: boolean;
  quizScore?: number;
  lastAccessedAt?: string;
  completedAt?: string;
}

/**
 * Fetch all lessons with current student's completion status
 */
export async function getStudentLessonProgress(userId: string): Promise<LessonProgressRecord[]> {
  const progress = getInitialProgress(userId);
  const completedSet = new Set(progress?.completedLessons || []);
  const quizScores = progress?.quizScores || {};
  const liveLessons = getPublishedLessonsSync();

  // If Supabase is connected
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id, completed, quiz_score, last_accessed_at, completed_at')
        .eq('user_id', userId);

      if (!error && data) {
        const dbMap = new Map<string, any>();
        for (const row of data) {
          dbMap.set(row.lesson_id, row);
        }

        return liveLessons.map((lesson) => {
          const dbRow = dbMap.get(lesson.id);
          const isCompleted = dbRow ? Boolean(dbRow.completed) : completedSet.has(lesson.id);
          const quizScore = dbRow?.quiz_score ?? quizScores[`quiz-for-${lesson.id}`]?.score;

          return {
            lessonId: lesson.id,
            lessonCode: lesson.code,
            lessonTitle: lesson.title,
            grade: lesson.grade,
            domain: lesson.domain,
            completed: isCompleted,
            quizScore,
            lastAccessedAt: dbRow?.last_accessed_at,
            completedAt: dbRow?.completed_at,
          };
        });
      }
    } catch (err) {
      console.warn('Supabase getStudentLessonProgress error, using local storage:', err);
    }
  }

  // Fallback using local progress
  return liveLessons.map((lesson) => {
    const isCompleted = completedSet.has(lesson.id);
    const quizKey = Object.keys(quizScores).find(
      (k) => k.includes(lesson.id) || k === `quiz-for-${lesson.id}`
    );
    const quizScore = quizKey ? quizScores[quizKey]?.score : undefined;

    return {
      lessonId: lesson.id,
      lessonCode: lesson.code,
      lessonTitle: lesson.title,
      grade: lesson.grade,
      domain: lesson.domain,
      completed: isCompleted,
      quizScore,
    };
  });
}

/**
 * Toggle completion of a lesson for the current student
 * RLS rule: auth.uid() = user_id (students can only modify their own progress)
 */
export async function toggleLessonCompletion(
  userId: string,
  lessonId: string,
  completed: boolean
): Promise<boolean> {
  // 1. Supabase update
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('lesson_progress').upsert({
        user_id: userId,
        lesson_id: lessonId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        last_accessed_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase toggleLessonCompletion error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase error:', err);
    }
  }

  // 2. Always sync local storage for demo / offline
  try {
    const progress = getInitialProgress(userId);
    if (progress) {
      const existing = new Set(progress.completedLessons);
      if (completed) {
        existing.add(lessonId);
      } else {
        existing.delete(lessonId);
      }

      const updated = {
        ...progress,
        completedLessons: Array.from(existing),
        lastActive: new Date().toISOString(),
      };

      if (completed && !updated.badges.includes('badge_explorer')) {
        updated.badges.push('badge_explorer');
      }

      saveUserProgress(updated);
    }
  } catch (err) {
    console.error('Failed to sync progress locally:', err);
  }

  return true;
}

/**
 * Fetch full user progress for dashboard & global state
 */
export async function fetchUserProgress(userId: string): Promise<UserProgress> {
  const local = getInitialProgress(userId);
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          userId: data.user_id,
          completedLessons: data.completed_lessons || local.completedLessons,
          quizScores: data.quiz_scores || local.quizScores,
          completedSimulations: data.completed_simulations || local.completedSimulations,
          bookmarkedLessons: data.bookmarked_lessons || local.bookmarkedLessons,
          badges: data.badges || local.badges,
          studyTimeMinutes: data.study_time_minutes ?? local.studyTimeMinutes,
          lastActive: data.last_active || local.lastActive,
        };
      }
    } catch (err) {
      console.warn('Failed to fetch user progress from Supabase, fallback to local:', err);
    }
  }
  return local;
}
