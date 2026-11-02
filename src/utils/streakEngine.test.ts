import test from 'node:test';
import assert from 'node:assert';
import {
  calculateStreakStats,
  getIntensityLevel,
  DayActivity,
  generateSeedStudyHistory,
  addDays,
} from './streakEngine.ts';

test('Streak Engine: getIntensityLevel scales properly', () => {
  assert.strictEqual(getIntensityLevel(0, false), 0);
  assert.strictEqual(getIntensityLevel(10, false), 1);
  assert.strictEqual(getIntensityLevel(15, true), 2);
  assert.strictEqual(getIntensityLevel(25, true), 2);
  assert.strictEqual(getIntensityLevel(35, true), 3);
});

test('Streak Engine: Current streak when today is completed', () => {
  const today = '2026-10-31';
  const activities: DayActivity[] = [
    { date: '2026-10-28', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    { date: '2026-10-29', minutesStudied: 25, lessonsCompleted: 1, quizzesTaken: 1, goalMet: true },
    { date: '2026-10-30', minutesStudied: 30, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    { date: '2026-10-31', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 1, goalMet: true },
  ];

  const stats = calculateStreakStats(activities, today, 20);
  assert.strictEqual(stats.currentStreak, 4);
  assert.strictEqual(stats.isTodayCompleted, true);
  assert.strictEqual(stats.totalActiveDays, 4);
});

test('Streak Engine: Preserves streak if yesterday completed and today is still in-progress', () => {
  const today = '2026-10-31';
  const activities: DayActivity[] = [
    { date: '2026-10-28', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    { date: '2026-10-29', minutesStudied: 25, lessonsCompleted: 1, quizzesTaken: 1, goalMet: true },
    { date: '2026-10-30', minutesStudied: 30, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    // Today: only 5 minutes studied, goal not met yet
    { date: '2026-10-31', minutesStudied: 5, lessonsCompleted: 0, quizzesTaken: 0, goalMet: false },
  ];

  const stats = calculateStreakStats(activities, today, 20);
  // Current streak should be 3 from yesterday, allowing user to keep it today!
  assert.strictEqual(stats.currentStreak, 3);
  assert.strictEqual(stats.isTodayCompleted, false);
});

test('Streak Engine: Breaks streak to 0 if neither today nor yesterday completed', () => {
  const today = '2026-10-31';
  const activities: DayActivity[] = [
    { date: '2026-10-28', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    { date: '2026-10-29', minutesStudied: 25, lessonsCompleted: 1, quizzesTaken: 1, goalMet: true },
    // 10-30 (yesterday) was missed (0 mins)
    { date: '2026-10-30', minutesStudied: 0, lessonsCompleted: 0, quizzesTaken: 0, goalMet: false },
    // 10-31 (today) not completed yet
    { date: '2026-10-31', minutesStudied: 5, lessonsCompleted: 0, quizzesTaken: 0, goalMet: false },
  ];

  const stats = calculateStreakStats(activities, today, 20);
  assert.strictEqual(stats.currentStreak, 0);
  assert.strictEqual(stats.isTodayCompleted, false);
});

test('Streak Engine: Accurately identifies longest historical streak', () => {
  const today = '2026-10-31';
  const activities: DayActivity[] = [
    // 5-day streak in the past
    { date: '2026-10-10', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    { date: '2026-10-11', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    { date: '2026-10-12', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    { date: '2026-10-13', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    { date: '2026-10-14', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    // Missed day
    { date: '2026-10-15', minutesStudied: 0, lessonsCompleted: 0, quizzesTaken: 0, goalMet: false },
    // 2-day current streak
    { date: '2026-10-30', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    { date: '2026-10-31', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
  ];

  const stats = calculateStreakStats(activities, today, 20);
  assert.strictEqual(stats.currentStreak, 2);
  assert.strictEqual(stats.longestStreak, 5);
});

test('Streak Engine: Weekly days has exactly 7 days from T2 to CN', () => {
  const today = '2026-10-31'; // Saturday
  const activities = generateSeedStudyHistory(today);
  const stats = calculateStreakStats(activities, today, 20);

  assert.strictEqual(stats.weeklyDays.length, 7);
  assert.strictEqual(stats.weeklyDays[0].dayName, 'T2');
  assert.strictEqual(stats.weeklyDays[6].dayName, 'CN');

  const todayStatus = stats.weeklyDays.find((d) => d.isToday);
  assert.ok(todayStatus, 'Today should be in weekly view');
  assert.strictEqual(todayStatus?.date, today);
});

test('Streak Engine: Milestones calculate progress and identify next milestone', () => {
  const today = '2026-10-31';
  const activities: DayActivity[] = [
    { date: '2026-10-28', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    { date: '2026-10-29', minutesStudied: 25, lessonsCompleted: 1, quizzesTaken: 1, goalMet: true },
    { date: '2026-10-30', minutesStudied: 30, lessonsCompleted: 1, quizzesTaken: 0, goalMet: true },
    { date: '2026-10-31', minutesStudied: 20, lessonsCompleted: 1, quizzesTaken: 1, goalMet: true },
  ];

  const stats = calculateStreakStats(activities, today, 20); // streak = 4
  const milestone3 = stats.milestones.find((m) => m.days === 3);
  const milestone7 = stats.milestones.find((m) => m.days === 7);

  assert.strictEqual(milestone3?.achieved, true);
  assert.strictEqual(milestone7?.achieved, false);
  assert.strictEqual(milestone7?.progress, 0.57); // 4 / 7
  assert.strictEqual(stats.nextMilestone?.days, 7);
});

test('Streak Engine: Seed generator produces non-empty history with active streak', () => {
  const today = '2026-10-31';
  const history = generateSeedStudyHistory(today);
  assert.strictEqual(history.length, 22);

  const stats = calculateStreakStats(history, today, 20);
  assert.ok(stats.currentStreak >= 3, 'Seed data should have an active streak');
  assert.ok(stats.totalMinutes > 100, 'Total minutes should be substantial');
});
