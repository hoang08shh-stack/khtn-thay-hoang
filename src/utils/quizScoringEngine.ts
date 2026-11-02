import { Grade, SubjectDomain } from '../types/index.ts';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false';

export interface QuizOptionItem {
  id: string;
  option_text: string;
  order_index: number;
}

export interface QuizQuestionItem {
  id: string;
  quiz_id?: string;
  question_text: string;
  question_type: QuestionType;
  options: QuizOptionItem[];
  points: number;
  order_index: number;
  difficulty?: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';
  hint?: string;
  // NOTE: In student-facing questions, explanation and correct answers are strictly omitted!
  explanation?: string;
}

export interface StudentAnswerItem {
  question_id: string;
  selected_option_id?: string | null; // For single_choice and true_false
  selected_option_ids?: string[]; // For multiple_choice
}

export interface AnswerKeyEntry {
  question_id: string;
  correct_option_ids: string[]; // 1 id for single/true_false, >=1 for multiple_choice
  explanation: string;
}

export interface QuestionGradingDetail {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  is_correct: boolean;
  points_earned: number;
  max_points: number;
  selected_option_ids: string[];
  correct_option_ids: string[];
  explanation: string;
}

export interface ServerGradingResult {
  attempt_id: string;
  quiz_id: string;
  user_id: string;
  score: number; // Scale 0-10, rounded to 1 decimal place
  max_score: number; // Always 10.0
  points_earned: number;
  total_points: number;
  correct_count: number;
  total_questions: number;
  passed: boolean;
  pass_score: number;
  completed_at: string;
  time_spent_seconds: number;
  details: QuestionGradingDetail[];
}

/**
 * PURE SCORING ENGINE (Authority: Server / RPC)
 * Calculates the score based strictly on the protected answer keys.
 * Client-submitted scores are strictly ignored.
 */
export function gradeQuizSubmission(
  questions: QuizQuestionItem[],
  answerKeysMap: Map<string, AnswerKeyEntry>,
  studentAnswers: StudentAnswerItem[],
  options: {
    userId: string;
    quizId: string;
    passScore?: number;
    timeSpentSeconds?: number;
  }
): ServerGradingResult {
  const passScore = options.passScore ?? 6.0;
  let totalPointsEarned = 0;
  let totalMaxPoints = 0;
  let correctCount = 0;

  const answersMap = new Map<string, StudentAnswerItem>();
  for (const ans of studentAnswers) {
    answersMap.set(ans.question_id, ans);
  }

  const details: QuestionGradingDetail[] = [];

  for (const q of questions) {
    const key = answerKeysMap.get(q.id);
    const ans = answersMap.get(q.id);
    const maxPoints = q.points > 0 ? q.points : 1;
    totalMaxPoints += maxPoints;

    const correctOptionIds = key ? [...key.correct_option_ids].sort() : [];
    const explanation = key?.explanation || q.explanation || 'Không có giải thích chi tiết.';

    // Normalize student selected options
    let selectedOptionIds: string[] = [];
    if (ans) {
      if (Array.isArray(ans.selected_option_ids) && ans.selected_option_ids.length > 0) {
        selectedOptionIds = [...ans.selected_option_ids];
      } else if (ans.selected_option_id) {
        selectedOptionIds = [ans.selected_option_id];
      }
    }
    selectedOptionIds = selectedOptionIds.filter(Boolean).sort();

    let isCorrect = false;

    if (q.question_type === 'multiple_choice') {
      // Must match EXACT set of correct options
      if (
        selectedOptionIds.length === correctOptionIds.length &&
        selectedOptionIds.every((id, idx) => id === correctOptionIds[idx])
      ) {
        isCorrect = true;
      }
    } else {
      // single_choice or true_false: exactly 1 match
      if (
        selectedOptionIds.length === 1 &&
        correctOptionIds.length === 1 &&
        selectedOptionIds[0] === correctOptionIds[0]
      ) {
        isCorrect = true;
      }
    }

    const pointsEarned = isCorrect ? maxPoints : 0;
    if (isCorrect) {
      correctCount += 1;
      totalPointsEarned += pointsEarned;
    }

    details.push({
      question_id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      max_points: maxPoints,
      selected_option_ids: selectedOptionIds,
      correct_option_ids: correctOptionIds,
      explanation,
    });
  }

  // Calculate score on 10-point scale
  const rawScore = totalMaxPoints > 0 ? (totalPointsEarned / totalMaxPoints) * 10 : 0;
  const score = Math.round(rawScore * 10) / 10;
  const passed = score >= passScore;

  return {
    attempt_id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    quiz_id: options.quizId,
    user_id: options.userId,
    score,
    max_score: 10.0,
    points_earned: totalPointsEarned,
    total_points: totalMaxPoints,
    correct_count: correctCount,
    total_questions: questions.length,
    passed,
    pass_score: passScore,
    completed_at: new Date().toISOString(),
    time_spent_seconds: options.timeSpentSeconds ?? 0,
    details,
  };
}

/**
 * Filter questions without leaking answer keys or post-submission explanations
 */
export function sanitizeQuestionsForStudent(
  questions: QuizQuestionItem[]
): QuizQuestionItem[] {
  return questions.map((q) => ({
    id: q.id,
    quiz_id: q.quiz_id,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options.map((opt) => ({
      id: opt.id,
      option_text: opt.option_text,
      order_index: opt.order_index,
    })),
    points: q.points,
    order_index: q.order_index,
    difficulty: q.difficulty,
    hint: q.hint,
    // explanation is removed for student before submission
    explanation: undefined,
  }));
}

/**
 * Aggregates teacher-level class analytics
 */
export interface TeacherClassStats {
  totalStudents: number;
  totalAttempts: number;
  averageScore: number;
  passRatePercentage: number;
  scoreDistribution: {
    excellent: number; // 8.5 - 10
    good: number; // 7.0 - 8.4
    average: number; // 5.0 - 6.9
    poor: number; // 0 - 4.9
  };
  topicPerformance: Array<{
    topicTitle: string;
    domain: SubjectDomain;
    attemptsCount: number;
    averageScore: number;
    isWeakTopic: boolean; // averageScore < 6.5
  }>;
}

export function computeTeacherClassStats(
  attempts: Array<{
    id: string;
    user_id: string;
    quiz_id: string;
    score: number;
    passed: boolean;
    domain?: SubjectDomain;
    topicTitle?: string;
  }>,
  allStudentIds: string[]
): TeacherClassStats {
  const totalAttempts = attempts.length;
  const uniqueStudents = new Set([...allStudentIds, ...attempts.map((a) => a.user_id)]);
  const totalStudents = uniqueStudents.size;

  if (totalAttempts === 0) {
    return {
      totalStudents,
      totalAttempts: 0,
      averageScore: 0,
      passRatePercentage: 0,
      scoreDistribution: { excellent: 0, good: 0, average: 0, poor: 0 },
      topicPerformance: [],
    };
  }

  const totalScore = attempts.reduce((acc, curr) => acc + curr.score, 0);
  const averageScore = Math.round((totalScore / totalAttempts) * 10) / 10;
  const passedCount = attempts.filter((a) => a.passed).length;
  const passRatePercentage = Math.round((passedCount / totalAttempts) * 100);

  const scoreDistribution = {
    excellent: attempts.filter((a) => a.score >= 8.5).length,
    good: attempts.filter((a) => a.score >= 7.0 && a.score < 8.5).length,
    average: attempts.filter((a) => a.score >= 5.0 && a.score < 7.0).length,
    poor: attempts.filter((a) => a.score < 5.0).length,
  };

  // Topic breakdown
  const topicMap = new Map<string, { domain: SubjectDomain; scores: number[] }>();
  for (const a of attempts) {
    const topic = a.topicTitle || 'Chủ đề KHTN chung';
    const domain = a.domain || 'hoa-hoc';
    const entry = topicMap.get(topic) || { domain, scores: [] };
    entry.scores.push(a.score);
    topicMap.set(topic, entry);
  }

  const topicPerformance = Array.from(topicMap.entries()).map(([topicTitle, data]) => {
    const avg = Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10;
    return {
      topicTitle,
      domain: data.domain,
      attemptsCount: data.scores.length,
      averageScore: avg,
      isWeakTopic: avg < 6.5,
    };
  });

  return {
    totalStudents,
    totalAttempts,
    averageScore,
    passRatePercentage,
    scoreDistribution,
    topicPerformance,
  };
}
