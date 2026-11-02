import { test } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_DAILY_GOAL,
  calculateGoalProgress,
  evaluateStudyReminder,
  DailyStudyGoal,
  DailyStudyProgress,
  getTodayDateString,
} from './reminderEngine.ts';

test('Reminder Engine: getTodayDateString returns valid YYYY-MM-DD', () => {
  const dateStr = getTodayDateString();
  assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/);
});

test('Reminder Engine: 0 minutes progress calculates 0% completion', () => {
  const progress: DailyStudyProgress = {
    date: getTodayDateString(),
    minutesStudied: 0,
    lessonsCompletedToday: [],
    quizzesTakenToday: [],
    simulationsCompletedToday: [],
    goalCompleted: false,
    streakDays: 3,
  };

  const calc = calculateGoalProgress(DEFAULT_DAILY_GOAL, progress);
  assert.strictEqual(calc.overallPercent, 0);
  assert.strictEqual(calc.isCompleted, false);
});

test('Reminder Engine: Halfway study progress calculates correct percentages', () => {
  const progress: DailyStudyProgress = {
    date: getTodayDateString(),
    minutesStudied: 10, // 10/20 mins = 50%
    lessonsCompletedToday: [], // 0/1 = 0%
    quizzesTakenToday: [{ quizId: 'quiz-atom', score: 9.0 }], // 1/1 = 100%
    simulationsCompletedToday: [],
    goalCompleted: false,
    streakDays: 5,
  };

  const calc = calculateGoalProgress(DEFAULT_DAILY_GOAL, progress);
  // 50% * 0.4 + 0% * 0.3 + 100% * 0.3 = 20 + 0 + 30 = 50%
  assert.strictEqual(calc.overallPercent, 50);
  assert.strictEqual(calc.minutesPercent, 50);
  assert.strictEqual(calc.quizzesPercent, 100);
  assert.strictEqual(calc.isCompleted, false);
});

test('Reminder Engine: Met minutes and lesson completes daily goal', () => {
  const progress: DailyStudyProgress = {
    date: getTodayDateString(),
    minutesStudied: 25,
    lessonsCompletedToday: ['khtn-8-bai-8'],
    quizzesTakenToday: [{ quizId: 'quiz-circuit', score: 8.5 }],
    simulationsCompletedToday: ['sim-electric-circuit'],
    goalCompleted: true,
    streakDays: 6,
  };

  const calc = calculateGoalProgress(DEFAULT_DAILY_GOAL, progress);
  assert.strictEqual(calc.isCompleted, true);
  assert.strictEqual(calc.overallPercent, 100);
});

test('Reminder Engine: Triggers reminder_start when 0 minutes studied', () => {
  const progress: DailyStudyProgress = {
    date: getTodayDateString(),
    minutesStudied: 0,
    lessonsCompletedToday: [],
    quizzesTakenToday: [],
    simulationsCompletedToday: [],
    goalCompleted: false,
    streakDays: 4,
  };

  const notif = evaluateStudyReminder(DEFAULT_DAILY_GOAL, progress, 'Nguyễn Văn Minh');
  assert.ok(notif);
  assert.strictEqual(notif.type, 'reminder_start');
  assert.ok(notif.title.includes('🔔'));
  assert.ok(notif.body.includes('Nguyễn Văn Minh'));
  assert.strictEqual(notif.actionUrl, '/phong-thi-nghiem-3d');
});

test('Reminder Engine: Triggers weak_topic_review when weak topic provided', () => {
  const progress: DailyStudyProgress = {
    date: getTodayDateString(),
    minutesStudied: 5,
    lessonsCompletedToday: [],
    quizzesTakenToday: [],
    simulationsCompletedToday: [],
    goalCompleted: false,
    streakDays: 2,
  };

  const notif = evaluateStudyReminder(
    DEFAULT_DAILY_GOAL,
    progress,
    'Minh',
    { topicName: 'Đo cường độ dòng điện & Định luật Ôm', quizId: 'quiz-circuit-8' }
  );

  assert.ok(notif);
  assert.strictEqual(notif.type, 'weak_topic_review');
  assert.ok(notif.title.includes('Định luật Ôm'));
  assert.strictEqual(notif.actionUrl, '/luyen-tap?quizId=quiz-circuit-8');
});

test('Reminder Engine: Triggers halfway reminder when progress is between 40% and 99%', () => {
  const progress: DailyStudyProgress = {
    date: getTodayDateString(),
    minutesStudied: 12,
    lessonsCompletedToday: [],
    quizzesTakenToday: [{ quizId: 'quiz-1', score: 8.0 }],
    simulationsCompletedToday: [],
    goalCompleted: false,
    streakDays: 4,
  };

  const notif = evaluateStudyReminder(DEFAULT_DAILY_GOAL, progress, 'Minh');
  assert.ok(notif);
  assert.strictEqual(notif.type, 'reminder_halfway');
  assert.ok(notif.title.includes('Sắp chạm mốc'));
});

test('Reminder Engine: Triggers congratulations when goal completed', () => {
  const progress: DailyStudyProgress = {
    date: getTodayDateString(),
    minutesStudied: 30,
    lessonsCompletedToday: ['lesson-1'],
    quizzesTakenToday: [{ quizId: 'quiz-1', score: 10.0 }],
    simulationsCompletedToday: ['sim-1'],
    goalCompleted: true,
    streakDays: 7,
  };

  const notif = evaluateStudyReminder(DEFAULT_DAILY_GOAL, progress, 'Minh');
  assert.ok(notif);
  assert.strictEqual(notif.type, 'congratulations');
  assert.ok(notif.title.includes('🎉'));
});
