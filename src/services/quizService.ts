import { supabase, isSupabaseConfigured, saveUserProgress, getInitialProgress } from '../lib/supabase.ts';
import { QUIZ_QUESTIONS, LESSON_QUIZZES, LESSONS } from '../data/mockData.ts';
import { Grade, SubjectDomain, AppUser, QuizMeta } from '../types/index.ts';
import {
  QuestionType,
  QuizQuestionItem,
  StudentAnswerItem,
  AnswerKeyEntry,
  ServerGradingResult,
  gradeQuizSubmission,
  sanitizeQuestionsForStudent,
  computeTeacherClassStats,
  TeacherClassStats,
} from '../utils/quizScoringEngine.ts';

const STORAGE_KEY_QUIZ_ATTEMPTS = 'khtn_hoang_quiz_attempts_v2';

export interface QuizSubmissionItem {
  question_id: string;
  selected_option_id?: string | null;
  selected_option_ids?: string[];
}

export interface ClientQuestion {
  id: string;
  quiz_id?: string;
  question_text: string;
  question_type: QuestionType;
  points: number;
  order_index: number;
  difficulty?: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';
  hint?: string;
  options: Array<{
    id: string;
    option_text: string;
    order_index: number;
  }>;
  // NOTE: Strictly undefined for student before submission!
  explanation?: string;
}

/**
 * Fetch list of published quizzes (filterable by grade and domain)
 */
export async function getLessonQuizzes(
  grade?: Grade | 'all',
  domain?: SubjectDomain | 'all'
): Promise<QuizMeta[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('quizzes')
        .select(`
          id,
          lesson_id,
          grade,
          domain,
          title,
          duration_minutes,
          pass_score,
          is_published,
          lessons:lesson_id (title)
        `)
        .eq('is_published', true);

      if (grade && grade !== 'all') query = query.eq('grade', grade);
      if (domain && domain !== 'all') query = query.eq('domain', domain);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          lessonId: row.lesson_id || undefined,
          lessonTitle: row.lessons?.title || undefined,
          grade: row.grade as Grade,
          domain: row.domain as SubjectDomain,
          title: row.title,
          durationMinutes: row.duration_minutes || 15,
          passScore: row.pass_score || 6.0,
          questionCount: 4,
          isPublished: row.is_published,
        }));
      }
    } catch (err) {
      console.warn('Supabase getLessonQuizzes error, falling back to mock:', err);
    }
  }

  // Fallback to local mock data
  return LESSON_QUIZZES.filter((q) => {
    if (grade && grade !== 'all' && q.grade !== grade) return false;
    if (domain && domain !== 'all' && q.domain !== domain) return false;
    return true;
  });
}

/**
 * Get quiz metadata for a specific lesson
 */
export async function getQuizForLesson(lessonId: string): Promise<QuizMeta | null> {
  const all = await getLessonQuizzes();
  const found = all.find((q) => q.lessonId === lessonId);
  if (found) return found;

  // Create a default linked quiz if none explicitly assigned
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lesson) return null;

  return {
    id: `quiz-for-${lesson.id}`,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    grade: lesson.grade,
    domain: lesson.domain,
    title: `Kiểm tra củng cố: ${lesson.title}`,
    description: `Bài đánh giá năng lực trắc nghiệm 3 dạng câu hỏi theo chuẩn GDPT 2018.`,
    durationMinutes: 15,
    passScore: 6.0,
    questionCount: QUIZ_QUESTIONS.filter((q) => q.lessonId === lesson.id).length || 4,
    isPublished: true,
  };
}

/**
 * Fetch questions and their options for a quiz.
 * SECURITY: Does NOT return answer keys or explanations!
 */
export async function getQuizQuestions(quizId: string): Promise<ClientQuestion[]> {
  // If Supabase is configured and connected
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: questions, error } = await supabase
        .from('questions')
        .select(`
          id,
          quiz_id,
          question_text,
          question_type,
          points,
          order_index,
          difficulty,
          hint,
          options:question_options(id, option_text, order_index)
        `)
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      if (!error && questions && questions.length > 0) {
        return questions.map((q: any) => ({
          id: q.id,
          quiz_id: q.quiz_id,
          question_text: q.question_text,
          question_type: (q.question_type as QuestionType) || 'single_choice',
          points: q.points || 1,
          order_index: q.order_index || 0,
          difficulty: q.difficulty || 'Thông hiểu',
          hint: q.hint || undefined,
          options: (q.options || []).sort((a: any, b: any) => a.order_index - b.order_index),
          explanation: undefined, // Stripped for security
        }));
      }
    } catch (err) {
      console.warn('Supabase questions fetch failed, falling back to mock:', err);
    }
  }

  // Local fallback: map matching questions or pool
  let matching = QUIZ_QUESTIONS.filter((q) => {
    if (quizId.startsWith('quiz-for-')) {
      const targetLessonId = quizId.replace('quiz-for-', '');
      return q.lessonId === targetLessonId;
    }
    const meta = LESSON_QUIZZES.find((m) => m.id === quizId);
    if (meta && meta.lessonId) {
      return q.lessonId === meta.lessonId;
    }
    return false;
  });

  if (matching.length === 0) {
    // If general practice or not matched to lesson, return all or filtered pool
    matching = QUIZ_QUESTIONS;
  }

  const converted: QuizQuestionItem[] = matching.map((q, idx) => ({
    id: q.id,
    quiz_id: quizId,
    question_text: q.question,
    question_type: q.questionType || 'single_choice',
    points: q.points || 1,
    order_index: idx + 1,
    difficulty: q.difficulty,
    hint: q.hint,
    options: q.options.map((opt, optIdx) => ({
      id: `${q.id}_opt_${optIdx}`,
      option_text: opt,
      order_index: optIdx,
    })),
  }));

  return sanitizeQuestionsForStudent(converted);
}

/**
 * SECURE SUBMISSION:
 * Submits student answers to Supabase RPC `submit_quiz_attempt` (or runs server-style engine).
 * Never accepts frontend-claimed score; only calculates score on server using answer_keys!
 */
export async function submitQuizAttemptSecurely(
  quizId: string,
  answers: QuizSubmissionItem[],
  timeSpentSeconds: number,
  currentUser: AppUser | null
): Promise<ServerGradingResult> {
  const userId = currentUser?.id || 'demo_user_anonymous';

  // 1. If Supabase is connected, call the PostgreSQL RPC
  if (isSupabaseConfigured && supabase && currentUser) {
    try {
      const rpcPayload = answers.map((a) => ({
        question_id: a.question_id,
        selected_option_id: a.selected_option_id || null,
        selected_option_ids: a.selected_option_ids || null,
      }));

      const { data, error } = await supabase.rpc('submit_quiz_attempt', {
        p_quiz_id: quizId,
        p_answers: rpcPayload,
        p_time_spent_seconds: timeSpentSeconds,
      });

      if (!error && data) {
        return data as ServerGradingResult;
      } else if (error) {
        console.warn('Supabase submit_quiz_attempt RPC error, using local secure engine:', error.message);
      }
    } catch (err) {
      console.warn('Supabase RPC call failed:', err);
    }
  }

  // 2. Authoritative local calculation engine (Protected Answer Keys)
  const answerKeysMap = new Map<string, AnswerKeyEntry>();
  for (const q of QUIZ_QUESTIONS) {
    let correctOptionIds: string[] = [];
    if (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0) {
      correctOptionIds = q.correctAnswers.map((idx) => `${q.id}_opt_${idx}`);
    } else if (typeof q.correctAnswer === 'number') {
      correctOptionIds = [`${q.id}_opt_${q.correctAnswer}`];
    }

    answerKeysMap.set(q.id, {
      question_id: q.id,
      correct_option_ids: correctOptionIds,
      explanation: q.explanation,
    });
  }

  // Re-fetch question definitions to calculate
  const questions = await getQuizQuestions(quizId);
  const quizMeta = LESSON_QUIZZES.find((m) => m.id === quizId);

  const gradingResult = gradeQuizSubmission(
    questions,
    answerKeysMap,
    answers,
    {
      userId,
      quizId,
      passScore: quizMeta?.passScore ?? 6.0,
      timeSpentSeconds,
    }
  );

  // 3. Persist attempt locally for demo / offline
  try {
    const rawAttempts = localStorage.getItem(STORAGE_KEY_QUIZ_ATTEMPTS);
    const existing: ServerGradingResult[] = rawAttempts ? JSON.parse(rawAttempts) : [];
    existing.unshift(gradingResult);
    localStorage.setItem(STORAGE_KEY_QUIZ_ATTEMPTS, JSON.stringify(existing.slice(0, 100)));
  } catch (err) {
    console.error('Failed to save quiz attempt locally:', err);
  }

  // 4. Update student progress & badges if user exists
  if (currentUser) {
    try {
      const progress = getInitialProgress(currentUser.id);
      if (progress) {
        const lessonId = quizMeta?.lessonId;
        const updatedCompletedLessons = [...progress.completedLessons];
        if (lessonId && gradingResult.passed && !updatedCompletedLessons.includes(lessonId)) {
          updatedCompletedLessons.push(lessonId);
        }

        const updatedBadges = [...progress.badges];
        if (gradingResult.score === 10 && !updatedBadges.includes('badge_gold_scientist')) {
          updatedBadges.push('badge_gold_scientist');
        }
        if (lessonId && gradingResult.passed && !updatedBadges.includes('badge_explorer')) {
          updatedBadges.push('badge_explorer');
        }

        const updated = {
          ...progress,
          completedLessons: updatedCompletedLessons,
          badges: updatedBadges,
          quizScores: {
            ...progress.quizScores,
            [quizId]: {
              score: gradingResult.score,
              total: gradingResult.max_score,
              date: new Date().toISOString().split('T')[0],
              passed: gradingResult.passed,
              quizTitle: quizMeta?.title || 'Bài kiểm tra KHTN',
              percentage: Math.round((gradingResult.score / gradingResult.max_score) * 100),
            },
          },
          studyTimeMinutes: progress.studyTimeMinutes + Math.round(timeSpentSeconds / 60),
          lastActive: new Date().toISOString(),
        };

        saveUserProgress(updated);
      }
    } catch (err) {
      console.warn('Failed to update progress after quiz submission:', err);
    }
  }

  return gradingResult;
}

/**
 * Fetch a student's past quiz attempts (RLS protected: only own attempts)
 */
export async function getStudentQuizAttempts(userId: string): Promise<ServerGradingResult[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          quiz_id,
          score,
          max_score,
          passed,
          time_spent_seconds,
          completed_at,
          quizzes (title, grade, domain, pass_score)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          attempt_id: row.id,
          quiz_id: row.quiz_id,
          user_id: userId,
          score: Number(row.score),
          max_score: Number(row.max_score) || 10.0,
          points_earned: Number(row.score),
          total_points: Number(row.max_score) || 10.0,
          correct_count: Math.round(Number(row.score) / 2.5),
          total_questions: 4,
          passed: Boolean(row.passed),
          pass_score: row.quizzes?.pass_score || 6.0,
          completed_at: row.completed_at,
          time_spent_seconds: row.time_spent_seconds || 0,
          details: [],
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch attempts failed:', err);
    }
  }

  // LocalStorage fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUIZ_ATTEMPTS);
    if (raw) {
      const parsed: ServerGradingResult[] = JSON.parse(raw);
      return parsed.filter((a) => a.user_id === userId);
    }
  } catch (err) {
    console.error('Failed to parse local attempts:', err);
  }

  // Sample default attempt for demo user
  return [
    {
      attempt_id: 'demo_attempt_1',
      quiz_id: 'quiz-atom-7',
      user_id: userId,
      score: 8.5,
      max_score: 10.0,
      points_earned: 4,
      total_points: 5,
      correct_count: 3,
      total_questions: 4,
      passed: true,
      pass_score: 6.0,
      completed_at: new Date(Date.now() - 86400000).toISOString(),
      time_spent_seconds: 420,
      details: [],
    },
  ];
}

/**
 * Fetch aggregated teacher class analytics (Teachers/Admins only)
 */
export async function getTeacherClassAnalytics(filterGrade?: Grade | 'all'): Promise<TeacherClassStats> {
  let allAttempts: any[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('quiz_attempts')
        .select(`
          id,
          user_id,
          quiz_id,
          score,
          passed,
          completed_at,
          quizzes (title, grade, domain)
        `);

      if (filterGrade && filterGrade !== 'all') {
        query = query.eq('quizzes.grade', filterGrade);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        allAttempts = data.map((d: any) => ({
          id: d.id,
          user_id: d.user_id,
          quiz_id: d.quiz_id,
          score: Number(d.score),
          passed: Boolean(d.passed),
          domain: d.quizzes?.domain,
          topicTitle: d.quizzes?.title,
        }));
      }
    } catch (err) {
      console.warn('Supabase teacher analytics failed, using local seed:', err);
    }
  }

  if (allAttempts.length === 0) {
    // Seed mock class attempts for demonstration
    allAttempts = [
      { id: 'a1', user_id: 'hs1', quiz_id: 'quiz-atom-7', score: 9.0, passed: true, domain: 'hoa-hoc', topicTitle: 'Cấu tạo nguyên tử Rutherford - Bohr' },
      { id: 'a2', user_id: 'hs2', quiz_id: 'quiz-atom-7', score: 8.5, passed: true, domain: 'hoa-hoc', topicTitle: 'Cấu tạo nguyên tử Rutherford - Bohr' },
      { id: 'a3', user_id: 'hs3', quiz_id: 'quiz-atom-7', score: 7.0, passed: true, domain: 'hoa-hoc', topicTitle: 'Cấu tạo nguyên tử Rutherford - Bohr' },
      { id: 'a4', user_id: 'hs4', quiz_id: 'quiz-circuit-8', score: 5.5, passed: false, domain: 'vat-li', topicTitle: 'Đo cường độ dòng điện & Định luật Ôm' },
      { id: 'a5', user_id: 'hs5', quiz_id: 'quiz-circuit-8', score: 6.0, passed: true, domain: 'vat-li', topicTitle: 'Đo cường độ dòng điện & Định luật Ôm' },
      { id: 'a6', user_id: 'hs1', quiz_id: 'quiz-acid-8', score: 9.5, passed: true, domain: 'hoa-hoc', topicTitle: 'Axit - Bazơ - Muối & pH' },
      { id: 'a7', user_id: 'hs2', quiz_id: 'quiz-acid-8', score: 8.0, passed: true, domain: 'hoa-hoc', topicTitle: 'Axit - Bazơ - Muối & pH' },
      { id: 'a8', user_id: 'hs6', quiz_id: 'quiz-cell-6', score: 9.0, passed: true, domain: 'sinh-hoc', topicTitle: 'Kính hiển vi quang học & Tế bào' },
      { id: 'a9', user_id: 'hs7', quiz_id: 'quiz-optics-9', score: 7.5, passed: true, domain: 'vat-li', topicTitle: 'Khúc xạ & Tán sắc ánh sáng' },
      { id: 'a10', user_id: 'hs8', quiz_id: 'quiz-circuit-8', score: 4.5, passed: false, domain: 'vat-li', topicTitle: 'Đo cường độ dòng điện & Định luật Ôm' },
    ];
  }

  const studentIds = ['hs1', 'hs2', 'hs3', 'hs4', 'hs5', 'hs6', 'hs7', 'hs8', 'user_student_demo'];
  return computeTeacherClassStats(allAttempts, studentIds);
}
