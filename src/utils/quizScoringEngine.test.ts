import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gradeQuizSubmission,
  sanitizeQuestionsForStudent,
  computeTeacherClassStats,
  QuizQuestionItem,
  AnswerKeyEntry,
  StudentAnswerItem,
} from './quizScoringEngine.ts';

const mockQuestions: QuizQuestionItem[] = [
  {
    id: 'q1_single',
    question_text: 'Nguyên tử Hydro có bao nhiêu proton trong hạt nhân?',
    question_type: 'single_choice',
    points: 1,
    order_index: 1,
    explanation: 'Hydro là nguyên tố thứ 1 trong Bảng tuần hoàn, hạt nhân chỉ chứa 1 proton.',
    options: [
      { id: 'opt_1a', option_text: '1 proton', order_index: 0 },
      { id: 'opt_1b', option_text: '2 proton', order_index: 1 },
      { id: 'opt_1c', option_text: '0 proton', order_index: 2 },
    ],
  },
  {
    id: 'q2_multi',
    question_text: 'Các đặc điểm nào sau đây thuộc về tế bào thực vật? (Chọn tất cả)',
    question_type: 'multiple_choice',
    points: 2,
    order_index: 2,
    explanation: 'Tế bào thực vật có thành cellulose cứng cáp và bào quan lục lạp quang hợp.',
    options: [
      { id: 'opt_2a', option_text: 'Thành tế bào bằng Xenlulôzơ', order_index: 0 },
      { id: 'opt_2b', option_text: 'Bào quan Lục lạp chứa diệp lục', order_index: 1 },
      { id: 'opt_2c', option_text: 'Khả năng vận động chủ động bằng chân giả', order_index: 2 },
    ],
  },
  {
    id: 'q3_tf',
    question_text: 'Dung dịch Axit Clohiđric (HCl) làm giấy quỳ tím chuyển sang màu đỏ.',
    question_type: 'true_false',
    points: 1,
    order_index: 3,
    explanation: 'Đúng! Dung dịch axit có tính axit làm quỳ tím hóa đỏ (pH < 7).',
    options: [
      { id: 'opt_3_true', option_text: 'Đúng', order_index: 0 },
      { id: 'opt_3_false', option_text: 'Sai', order_index: 1 },
    ],
  },
];

const mockAnswerKeys = new Map<string, AnswerKeyEntry>([
  [
    'q1_single',
    {
      question_id: 'q1_single',
      correct_option_ids: ['opt_1a'],
      explanation: 'Hydro là nguyên tố thứ 1 trong Bảng tuần hoàn, hạt nhân chỉ chứa 1 proton.',
    },
  ],
  [
    'q2_multi',
    {
      question_id: 'q2_multi',
      correct_option_ids: ['opt_2a', 'opt_2b'],
      explanation: 'Tế bào thực vật có thành cellulose cứng cáp và bào quan lục lạp quang hợp.',
    },
  ],
  [
    'q3_tf',
    {
      question_id: 'q3_tf',
      correct_option_ids: ['opt_3_true'],
      explanation: 'Đúng! Dung dịch axit có tính axit làm quỳ tím hóa đỏ (pH < 7).',
    },
  ],
]);

test('Grades single choice question correctly', () => {
  const studentAnswers: StudentAnswerItem[] = [
    { question_id: 'q1_single', selected_option_id: 'opt_1a' },
  ];
  const res = gradeQuizSubmission(
    [mockQuestions[0]],
    mockAnswerKeys,
    studentAnswers,
    { userId: 'student_1', quizId: 'quiz_1' }
  );

  assert.equal(res.correct_count, 1);
  assert.equal(res.score, 10.0);
  assert.equal(res.passed, true);
  assert.equal(res.details[0].is_correct, true);
});

test('Rejects incorrect single choice answer', () => {
  const studentAnswers: StudentAnswerItem[] = [
    { question_id: 'q1_single', selected_option_id: 'opt_1b' },
  ];
  const res = gradeQuizSubmission(
    [mockQuestions[0]],
    mockAnswerKeys,
    studentAnswers,
    { userId: 'student_1', quizId: 'quiz_1' }
  );

  assert.equal(res.correct_count, 0);
  assert.equal(res.score, 0);
  assert.equal(res.passed, false);
  assert.equal(res.details[0].is_correct, false);
});

test('Multiple choice requires exact match of all correct options', () => {
  // Case A: Perfect match (both 2a and 2b)
  const fullAnswers: StudentAnswerItem[] = [
    { question_id: 'q2_multi', selected_option_ids: ['opt_2b', 'opt_2a'] }, // unordered
  ];
  const fullRes = gradeQuizSubmission(
    [mockQuestions[1]],
    mockAnswerKeys,
    fullAnswers,
    { userId: 'student_1', quizId: 'quiz_1' }
  );
  assert.equal(fullRes.details[0].is_correct, true);
  assert.equal(fullRes.score, 10.0);

  // Case B: Partial match (only selected 2a, missed 2b) -> fails
  const partialAnswers: StudentAnswerItem[] = [
    { question_id: 'q2_multi', selected_option_ids: ['opt_2a'] },
  ];
  const partialRes = gradeQuizSubmission(
    [mockQuestions[1]],
    mockAnswerKeys,
    partialAnswers,
    { userId: 'student_1', quizId: 'quiz_1' }
  );
  assert.equal(partialRes.details[0].is_correct, false);
  assert.equal(partialRes.score, 0);

  // Case C: Over-selected (selected 2a, 2b, and incorrect 2c) -> fails
  const overAnswers: StudentAnswerItem[] = [
    { question_id: 'q2_multi', selected_option_ids: ['opt_2a', 'opt_2b', 'opt_2c'] },
  ];
  const overRes = gradeQuizSubmission(
    [mockQuestions[1]],
    mockAnswerKeys,
    overAnswers,
    { userId: 'student_1', quizId: 'quiz_1' }
  );
  assert.equal(overRes.details[0].is_correct, false);
  assert.equal(overRes.score, 0);
});

test('True/False questions grade accurately', () => {
  const correctTf: StudentAnswerItem[] = [
    { question_id: 'q3_tf', selected_option_id: 'opt_3_true' },
  ];
  const resTrue = gradeQuizSubmission(
    [mockQuestions[2]],
    mockAnswerKeys,
    correctTf,
    { userId: 'student_1', quizId: 'quiz_1' }
  );
  assert.equal(resTrue.details[0].is_correct, true);

  const incorrectTf: StudentAnswerItem[] = [
    { question_id: 'q3_tf', selected_option_id: 'opt_3_false' },
  ];
  const resFalse = gradeQuizSubmission(
    [mockQuestions[2]],
    mockAnswerKeys,
    incorrectTf,
    { userId: 'student_1', quizId: 'quiz_1' }
  );
  assert.equal(resFalse.details[0].is_correct, false);
});

test('Full multi-question quiz calculates weighted score on 10-point scale', () => {
  // q1 (1 pt) correct, q2 (2 pts) correct, q3 (1 pt) wrong -> 3 out of 4 pts = 7.5 / 10
  const mixedAnswers: StudentAnswerItem[] = [
    { question_id: 'q1_single', selected_option_id: 'opt_1a' },
    { question_id: 'q2_multi', selected_option_ids: ['opt_2a', 'opt_2b'] },
    { question_id: 'q3_tf', selected_option_id: 'opt_3_false' },
  ];

  const res = gradeQuizSubmission(
    mockQuestions,
    mockAnswerKeys,
    mixedAnswers,
    { userId: 'student_minh', quizId: 'quiz_khtn_mix', passScore: 6.0 }
  );

  assert.equal(res.points_earned, 3);
  assert.equal(res.total_points, 4);
  assert.equal(res.score, 7.5);
  assert.equal(res.passed, true);
  assert.equal(res.correct_count, 2);
  assert.equal(res.total_questions, 3);
});

test('Sanitizes questions to prevent leaking answers and explanations to client', () => {
  const sanitized = sanitizeQuestionsForStudent(mockQuestions);

  for (const q of sanitized) {
    // Explanation MUST be stripped before sending to client
    assert.equal(q.explanation, undefined);
    // Question text and options remain intact
    assert.ok(q.question_text.length > 0);
    assert.ok(q.options.length > 0);
    // Options do not contain an 'is_correct' property
    for (const opt of q.options) {
      assert.equal((opt as any).is_correct, undefined);
    }
  }
});

test('Teacher class analytics correctly identifies average and weak topics', () => {
  const attempts = [
    { id: 'a1', user_id: 's1', quiz_id: 'q1', score: 9.0, passed: true, domain: 'hoa-hoc' as const, topicTitle: 'Cấu tạo chất' },
    { id: 'a2', user_id: 's2', quiz_id: 'q1', score: 8.0, passed: true, domain: 'hoa-hoc' as const, topicTitle: 'Cấu tạo chất' },
    { id: 'a3', user_id: 's1', quiz_id: 'q2', score: 5.0, passed: false, domain: 'vat-li' as const, topicTitle: 'Điện học' },
    { id: 'a4', user_id: 's2', quiz_id: 'q2', score: 6.0, passed: true, domain: 'vat-li' as const, topicTitle: 'Điện học' },
  ];

  const stats = computeTeacherClassStats(attempts, ['s1', 's2', 's3']);

  assert.equal(stats.totalStudents, 3);
  assert.equal(stats.totalAttempts, 4);
  assert.equal(stats.averageScore, 7.0); // (9 + 8 + 5 + 6) / 4 = 7.0
  assert.equal(stats.passRatePercentage, 75); // 3 of 4 passed

  const dienHoc = stats.topicPerformance.find((t) => t.topicTitle === 'Điện học');
  assert.ok(dienHoc);
  assert.equal(dienHoc.averageScore, 5.5);
  assert.equal(dienHoc.isWeakTopic, true); // < 6.5

  const cauTaoChat = stats.topicPerformance.find((t) => t.topicTitle === 'Cấu tạo chất');
  assert.ok(cauTaoChat);
  assert.equal(cauTaoChat.averageScore, 8.5);
  assert.equal(cauTaoChat.isWeakTopic, false);
});
