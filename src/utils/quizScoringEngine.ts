import { Grade, SubjectDomain, QuestionType, TrueFalseStatement } from '../types/index.ts';
export type { QuestionType, TrueFalseStatement };

export interface UploadedEssayImage {
  id: string;
  name: string;
  dataUrl: string;
  sizeLabel?: string;
}

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
  true_false_statements?: Array<{
    id: string;
    label: string;
    text: string;
    // isTrue & explanation omitted for student before submission
    isTrue?: boolean | null;
    explanation?: string;
  }>;
  short_answer_unit?: string;
  short_answer_tolerance?: number;
  question_images?: string[];
  question_tables?: string[];
  rubric?: string;
  approval_status?: 'approved' | 'pending_review' | 'draft';
  points: number;
  order_index: number;
  difficulty?: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';
  hint?: string;
  allow_image_upload?: boolean;
  // NOTE: In student-facing questions, explanation and correct answers are strictly omitted before submission!
  explanation?: string;
  solution_steps?: string[];
  sample_answer?: string;
}

export interface StudentAnswerItem {
  question_id: string;
  selected_option_id?: string | null; // For single_choice and legacy true_false
  selected_option_ids?: string[]; // For multiple_choice
  true_false_answers?: Record<string, boolean>; // For 4-statement true_false: { a: true, b: false, c: true, d: false }
  short_answer_text?: string; // For short_answer
  essay_text?: string; // For essay questions
  essay_images?: UploadedEssayImage[]; // Uploaded student work images for essay questions
  teacher_awarded_points?: number; // Optional manual override by teacher
}

export interface AnswerKeyEntry {
  question_id: string;
  correct_option_ids: string[]; // 1 id for single/legacy true_false, >=1 for multiple_choice
  correct_true_false_map?: Record<string, boolean>; // { a: true, b: false, c: true, d: false }
  true_false_statements?: TrueFalseStatement[];
  correct_short_answer?: string;
  short_answer_unit?: string;
  short_answer_tolerance?: number;
  explanation: string;
  solution_steps?: string[];
  sample_answer?: string;
  rubric?: string;
  approval_status?: 'approved' | 'pending_review' | 'draft';
}

export interface TrueFalseStatementGradingResult {
  statement_id: string;
  label: 'a' | 'b' | 'c' | 'd';
  student_answer?: boolean;
  correct_answer: boolean;
  is_correct: boolean;
  explanation?: string;
}

export interface QuestionGradingDetail {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  is_correct: boolean;
  points_earned: number;
  earned_points?: number;
  max_points: number;
  selected_option_ids: string[];
  correct_option_ids: string[];
  true_false_answers?: Record<string, boolean>;
  correct_true_false_map?: Record<string, boolean>;
  true_false_statements?: TrueFalseStatement[];
  true_false_results?: TrueFalseStatementGradingResult[];
  true_false_correct_count?: number;
  short_answer_text?: string;
  student_short_answer?: string;
  correct_short_answer?: string;
  short_answer_unit?: string;
  explanation: string;
  solution_steps?: string[];
  sample_answer?: string;
  rubric?: string;
  essay_text?: string;
  essay_images?: UploadedEssayImage[];
  grading_status?: 'auto_graded' | 'pending_teacher_review' | 'teacher_graded';
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

export interface UserAnswerSelection {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  trueFalseAnswers?: Record<string, boolean>;
  shortAnswerText?: string;
  essayText?: string;
  essayImages?: UploadedEssayImage[];
}

export interface LessonQuizConfig {
  id: string;
  lessonId?: string;
  title: string;
  grade: Grade;
  domain: SubjectDomain;
  timeLimitMinutes: number;
  passingScore: number;
  questions: Array<{
    id: string;
    question: string;
    type: QuestionType;
    difficulty: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';
    points: number;
    hint?: string;
    allowImageUpload?: boolean;
    solutionSteps?: string[];
    sampleAnswer?: string;
    rubric?: string;
    explanation?: string;
    trueFalseStatements?: TrueFalseStatement[];
    shortAnswer?: string;
    shortAnswerUnit?: string;
    shortAnswerTolerance?: number;
    questionImages?: string[];
    questionTables?: string[];
    approvalStatus?: 'approved' | 'pending_review' | 'draft';
    correctOptionIds?: string[];
    options: Array<{
      id: string;
      content: string;
    }>;
  }>;
}

/**
 * Shuffles option display order while preserving each option's unique `id`.
 * Accepts either an options array `T[]` or a question object `{ options: T[] }`.
 * Because `gradeQuizSubmission` grades by `option.id`, shuffling options NEVER breaks the answer key!
 */
export function shuffleQuestionOptions<T>(
  input: T,
  seedOrRng?: number | (() => number)
): T {
  const shuffleArray = <Item>(arr: Item[]): Item[] => {
    const copy = [...arr];
    let s = typeof seedOrRng === 'number' ? seedOrRng : Date.now();
    for (let i = copy.length - 1; i > 0; i--) {
      let j: number;
      if (typeof seedOrRng === 'function') {
        j = Math.floor(seedOrRng() * (i + 1));
      } else {
        s = (s * 1664525 + 1013904223) % 4294967296;
        j = Math.floor((s / 4294967296) * (i + 1));
      }
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  if (Array.isArray(input)) {
    return shuffleArray(input) as unknown as T;
  }
  if (input && typeof input === 'object' && Array.isArray((input as any).options)) {
    return {
      ...(input as any),
      options: shuffleArray((input as any).options),
    } as T;
  }
  return input;
}

/**
 * Compares student short-answer input with the expected short answer.
 * Supports decimal comma (2,48) and dot (2.48), optional unit suffix, and numeric tolerance.
 */
export function evaluateShortAnswerMatch(
  studentInput: string | undefined,
  expectedAnswer: string | undefined,
  unit?: string,
  tolerance = 0.02
): boolean {
  if (!studentInput || !expectedAnswer) return false;
  let cleanStudent = studentInput.trim();
  let cleanExpected = expectedAnswer.trim();
  if (!cleanStudent || !cleanExpected) return false;

  if (unit && unit.trim()) {
    const escapedUnit = unit.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const unitRe = new RegExp(`\\s*${escapedUnit}\\s*$`, 'i');
    cleanStudent = cleanStudent.replace(unitRe, '').trim();
    cleanExpected = cleanExpected.replace(unitRe, '').trim();
  }

  // Strip common trailing units if student typed "2,48 L" or "2,48 lít" when expected is "2,48"
  const numStudentStr = cleanStudent.replace(',', '.').replace(/\s*(?:lít|L|mL|gam|g|kg|mol\/L|M|Ω|A|V|W|J|Pa|m\/s|km\/h)\s*$/i, '').trim();
  const numExpectedStr = cleanExpected.replace(',', '.').replace(/\s*(?:lít|L|mL|gam|g|kg|mol\/L|M|Ω|A|V|W|J|Pa|m\/s|km\/h)\s*$/i, '').trim();

  const numStudent = Number(numStudentStr);
  const numExpected = Number(numExpectedStr);

  if (!Number.isNaN(numStudent) && !Number.isNaN(numExpected) && numStudentStr !== '' && numExpectedStr !== '') {
    const allowedDiff = Math.max(tolerance, Math.abs(numExpected) * 0.005);
    return Math.abs(numStudent - numExpected) <= allowedDiff;
  }

  return cleanStudent.toLowerCase().replace(/\s+/g, ' ') === cleanExpected.toLowerCase().replace(/\s+/g, ' ');
}

/**
 * PURE SCORING ENGINE (Authority: Server / RPC)
 * Calculates the score based strictly on the protected answer keys.
 * Supports both:
 * 1) Server signature: `(questions: QuizQuestionItem[], answerKeysMap, studentAnswers, options)`
 * 2) Direct LessonQuizConfig signature: `(quizConfig: LessonQuizConfig, selections: UserAnswerSelection[], timeSpentSeconds?: number)`
 */
export function gradeQuizSubmission(
  questionsOrConfig: QuizQuestionItem[] | LessonQuizConfig,
  answerKeysOrSelections: Map<string, AnswerKeyEntry> | UserAnswerSelection[],
  studentAnswersOrTime?: StudentAnswerItem[] | number,
  options?: {
    userId: string;
    quizId: string;
    passScore?: number;
    timeSpentSeconds?: number;
  }
): ServerGradingResult {
  let questions: QuizQuestionItem[];
  let answerKeysMap: Map<string, AnswerKeyEntry>;
  let studentAnswers: StudentAnswerItem[];
  let resolvedOptions: {
    userId: string;
    quizId: string;
    passScore?: number;
    timeSpentSeconds?: number;
  };

  if (!Array.isArray(questionsOrConfig) && 'questions' in questionsOrConfig) {
    const cfg = questionsOrConfig;
    const sels = (answerKeysOrSelections as UserAnswerSelection[]) || [];
    const timeSecs = typeof studentAnswersOrTime === 'number' ? studentAnswersOrTime : 0;
    questions = cfg.questions.map((q, idx) => ({
      id: q.id,
      quiz_id: cfg.id,
      question_text: q.question,
      question_type: q.type,
      options: (q.options || []).map((o, oIdx) => ({
        id: o.id,
        option_text: o.content,
        order_index: oIdx,
      })),
      true_false_statements: q.trueFalseStatements,
      short_answer_unit: q.shortAnswerUnit,
      short_answer_tolerance: q.shortAnswerTolerance,
      points: q.points,
      order_index: idx,
      difficulty: q.difficulty,
      explanation: q.explanation,
      solution_steps: q.solutionSteps,
      sample_answer: q.sampleAnswer,
      rubric: q.rubric,
    }));
    answerKeysMap = new Map<string, AnswerKeyEntry>();
    for (const q of cfg.questions) {
      const tfMap: Record<string, boolean> = {};
      if (q.trueFalseStatements) {
        for (const st of q.trueFalseStatements) {
          if (typeof st.isTrue === 'boolean') {
            tfMap[st.label] = st.isTrue;
            tfMap[st.id] = st.isTrue;
          }
        }
      }
      answerKeysMap.set(q.id, {
        question_id: q.id,
        correct_option_ids: q.correctOptionIds || [],
        correct_true_false_map: Object.keys(tfMap).length > 0 ? tfMap : undefined,
        true_false_statements: q.trueFalseStatements,
        correct_short_answer: q.shortAnswer,
        short_answer_unit: q.shortAnswerUnit,
        short_answer_tolerance: q.shortAnswerTolerance,
        explanation: q.explanation || '',
        solution_steps: q.solutionSteps,
        sample_answer: q.sampleAnswer,
        rubric: q.rubric,
      });
    }
    studentAnswers = sels.map((s) => ({
      question_id: s.questionId,
      selected_option_id: s.selectedOptionId,
      selected_option_ids: s.selectedOptionIds,
      true_false_answers: s.trueFalseAnswers,
      short_answer_text: s.shortAnswerText,
      essay_text: s.essayText,
      essay_images: s.essayImages,
    }));
    resolvedOptions = {
      userId: 'user_student_demo',
      quizId: cfg.id,
      passScore: cfg.passingScore ?? 6.0,
      timeSpentSeconds: timeSecs,
    };
  } else {
    questions = questionsOrConfig as QuizQuestionItem[];
    answerKeysMap = answerKeysOrSelections as Map<string, AnswerKeyEntry>;
    studentAnswers = (studentAnswersOrTime as StudentAnswerItem[]) || [];
    resolvedOptions = options || {
      userId: 'user_student_demo',
      quizId: 'quiz_default',
      passScore: 6.0,
      timeSpentSeconds: 0,
    };
  }

  const passScore = resolvedOptions.passScore ?? 6.0;
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
    const solutionSteps = key?.solution_steps || q.solution_steps;
    const sampleAnswer = key?.sample_answer || q.sample_answer;
    const rubric = key?.rubric || q.rubric;

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
    let pointsEarned = 0;
    let tfCorrectSubCount: number | undefined;
    let tfResults: TrueFalseStatementGradingResult[] | undefined;
    let gradingStatus: QuestionGradingDetail['grading_status'] = 'auto_graded';

    // Build expected True/False statements and map if question is 4-statement true_false
    const stmts = key?.true_false_statements || (q.true_false_statements as TrueFalseStatement[] | undefined) || [];
    const expectedTfMap: Record<string, boolean> = {};
    if (key?.correct_true_false_map) {
      for (const [k, v] of Object.entries(key.correct_true_false_map)) {
        if (['a', 'b', 'c', 'd'].includes(k)) {
          expectedTfMap[k] = v;
        }
      }
    }
    if (Object.keys(expectedTfMap).length === 0 && stmts.length > 0) {
      for (const st of stmts) {
        if (typeof st.isTrue === 'boolean') {
          expectedTfMap[st.label] = st.isTrue;
        }
      }
    }

    if (q.question_type === 'essay') {
      const hasEssayText = Boolean(ans?.essay_text && ans.essay_text.trim().length > 0);
      const hasEssayImage = Boolean(ans?.essay_images && ans.essay_images.length > 0);
      if (typeof ans?.teacher_awarded_points === 'number') {
        pointsEarned = Math.min(maxPoints, Math.max(0, ans.teacher_awarded_points));
        isCorrect = pointsEarned >= maxPoints * 0.5;
        gradingStatus = 'teacher_graded';
      } else {
        isCorrect = hasEssayText || hasEssayImage;
        pointsEarned = isCorrect ? maxPoints : 0;
        gradingStatus = 'pending_teacher_review';
      }
    } else if (q.question_type === 'true_false' && (Object.keys(expectedTfMap).length > 0 || stmts.length > 0)) {
      const studentTf = ans?.true_false_answers || {};
      const labels = (['a', 'b', 'c', 'd'] as const).filter(
        (lbl) => lbl in expectedTfMap || stmts.some((s) => s.label === lbl)
      );
      let matched = 0;
      tfResults = [];
      for (const lbl of labels) {
        const stmtObj = stmts.find((s) => s.label === lbl);
        const expectedVal =
          lbl in expectedTfMap
            ? expectedTfMap[lbl]
            : typeof stmtObj?.isTrue === 'boolean'
            ? stmtObj.isTrue
            : true;
        // Support studentTf keyed either by statement.id or by statement.label ('a'..'d')
        const studentVal =
          stmtObj && typeof studentTf[stmtObj.id] === 'boolean'
            ? studentTf[stmtObj.id]
            : typeof studentTf[lbl] === 'boolean'
            ? studentTf[lbl]
            : undefined;
        const subCorrect = typeof studentVal === 'boolean' && studentVal === expectedVal;
        if (subCorrect) matched++;
        tfResults.push({
          statement_id: stmtObj?.id || lbl,
          label: lbl,
          student_answer: studentVal,
          correct_answer: expectedVal,
          is_correct: subCorrect,
          explanation: stmtObj?.explanation,
        });
      }
      tfCorrectSubCount = matched;
      isCorrect = matched === labels.length && labels.length > 0;

      // GDPT 2018 official partial credit scale for 4-statement True/False questions:
      // 1/4 correct = 10%, 2/4 = 25%, 3/4 = 50%, 4/4 = 100%
      if (labels.length === 4) {
        const multiplier =
          matched === 4 ? 1.0 : matched === 3 ? 0.5 : matched === 2 ? 0.25 : matched === 1 ? 0.1 : 0;
        pointsEarned = Math.round(maxPoints * multiplier * 100) / 100;
      } else if (labels.length > 0) {
        pointsEarned = Math.round(maxPoints * (matched / labels.length) * 100) / 100;
      }
    } else if (q.question_type === 'short_answer') {
      const expectedShort = key?.correct_short_answer;
      const unit = key?.short_answer_unit || q.short_answer_unit;
      const tol = key?.short_answer_tolerance ?? q.short_answer_tolerance ?? 0.02;
      isCorrect = evaluateShortAnswerMatch(ans?.short_answer_text, expectedShort, unit, tol);
      pointsEarned = isCorrect ? maxPoints : 0;
    } else if (q.question_type === 'multiple_choice') {
      if (
        selectedOptionIds.length === correctOptionIds.length &&
        selectedOptionIds.every((id, idx) => id === correctOptionIds[idx])
      ) {
        isCorrect = true;
      }
      pointsEarned = isCorrect ? maxPoints : 0;
    } else {
      // single_choice or legacy 2-option true_false: exact match on option ID
      if (
        selectedOptionIds.length === 1 &&
        correctOptionIds.length === 1 &&
        selectedOptionIds[0] === correctOptionIds[0]
      ) {
        isCorrect = true;
      }
      pointsEarned = isCorrect ? maxPoints : 0;
    }

    if (isCorrect) {
      correctCount += 1;
    }
    totalPointsEarned += pointsEarned;

    details.push({
      question_id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      earned_points: pointsEarned,
      max_points: maxPoints,
      selected_option_ids: selectedOptionIds,
      correct_option_ids: correctOptionIds,
      true_false_answers: ans?.true_false_answers,
      correct_true_false_map: Object.keys(expectedTfMap).length > 0 ? expectedTfMap : undefined,
      true_false_statements: stmts.length > 0 ? stmts : undefined,
      true_false_results: tfResults,
      true_false_correct_count: tfCorrectSubCount,
      short_answer_text: ans?.short_answer_text,
      student_short_answer: ans?.short_answer_text,
      correct_short_answer: key?.correct_short_answer,
      short_answer_unit: key?.short_answer_unit || q.short_answer_unit,
      explanation,
      solution_steps: solutionSteps,
      sample_answer: sampleAnswer,
      rubric,
      essay_text: ans?.essay_text,
      essay_images: ans?.essay_images,
      grading_status: gradingStatus,
    });
  }

  // Calculate score on 10-point scale
  const rawScore = totalMaxPoints > 0 ? (totalPointsEarned / totalMaxPoints) * 10 : 0;
  const score = Math.round(rawScore * 10) / 10;
  const passed = score >= passScore;

  return {
    attempt_id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    quiz_id: resolvedOptions.quizId,
    user_id: resolvedOptions.userId,
    score,
    max_score: 10.0,
    points_earned: Math.round(totalPointsEarned * 100) / 100,
    total_points: Math.round(totalMaxPoints * 100) / 100,
    correct_count: correctCount,
    total_questions: questions.length,
    passed,
    pass_score: passScore,
    completed_at: new Date().toISOString(),
    time_spent_seconds: resolvedOptions.timeSpentSeconds ?? 0,
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
    true_false_statements: q.true_false_statements?.map((st) => ({
      id: st.id,
      label: st.label,
      text: st.text,
      // Omit isTrue and explanation before submission
    })),
    short_answer_unit: q.short_answer_unit,
    question_images: q.question_images,
    question_tables: q.question_tables,
    points: q.points,
    order_index: q.order_index,
    difficulty: q.difficulty,
    hint: q.hint,
    allow_image_upload: q.allow_image_upload ?? (q.question_type === 'essay' ? true : undefined),
    // explanation is removed for student before submission
    explanation: undefined,
    solution_steps: undefined,
    sample_answer: undefined,
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
