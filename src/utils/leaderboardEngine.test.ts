import test from 'node:test';
import assert from 'node:assert';
import {
  calculateStudyPoints,
  anonymizeStudentName,
  filterAndRankLeaderboard,
  getCurrentUserRank,
  generateSeedLeaderboard,
  LeaderboardEntry,
} from './leaderboardEngine.ts';

test('Leaderboard Engine: calculateStudyPoints aggregates learning achievements', () => {
  const points = calculateStudyPoints({
    lessonsCount: 2, // 200 pts
    quizzesCount: 1, // 40 + (8 * 10) = 120 pts
    avgQuizScore: 8.0,
    simulationsCount: 2, // 160 pts
    streakDays: 4, // 100 pts
    studyMinutes: 145, // 290 pts
  });

  // 200 + 120 + 160 + 100 + 290 = 870
  assert.strictEqual(points, 870);
});

test('Leaderboard Engine: anonymizeStudentName protects student privacy', () => {
  assert.strictEqual(anonymizeStudentName('Nguyễn Văn Minh'), 'Minh N.');
  assert.strictEqual(anonymizeStudentName('Trần Thị Ánh Dương'), 'Dương T.');
  assert.strictEqual(anonymizeStudentName('Lê Hoàng'), 'Hoàng L.');
  assert.strictEqual(anonymizeStudentName('Minh'), 'Minh');
  assert.strictEqual(anonymizeStudentName(''), 'Học viên KHTN');
  // Custom nickname takes precedence
  assert.strictEqual(anonymizeStudentName('Nguyễn Văn Minh', 'Nhà Vật Lí Nhí'), 'Nhà Vật Lí Nhí');
});

test('Leaderboard Engine: filterAndRankLeaderboard ranks by points descending', () => {
  const entries: LeaderboardEntry[] = [
    {
      id: 'student-1',
      displayName: 'An N.',
      avatarSeed: 'A',
      avatarColor: 'teal',
      grade: 8,
      studyPoints: 500,
      streakDays: 3,
      studyTimeMinutes: 60,
      lessonsCompleted: 1,
      quizzesTaken: 1,
      badgesCount: 2,
      isCurrentUser: false,
    },
    {
      id: 'student-2',
      displayName: 'Bình L.',
      avatarSeed: 'B',
      avatarColor: 'blue',
      grade: 8,
      studyPoints: 1200,
      streakDays: 5,
      studyTimeMinutes: 150,
      lessonsCompleted: 3,
      quizzesTaken: 2,
      badgesCount: 4,
      isCurrentUser: true,
    },
    {
      id: 'student-3',
      displayName: 'Cường T.',
      avatarSeed: 'C',
      avatarColor: 'purple',
      grade: 8,
      studyPoints: 850,
      streakDays: 2,
      studyTimeMinutes: 90,
      lessonsCompleted: 2,
      quizzesTaken: 1,
      badgesCount: 3,
      isCurrentUser: false,
    },
  ];

  const ranked = filterAndRankLeaderboard(entries, {
    metric: 'points',
    grade: 'all',
    timeframe: 'all',
  });

  assert.strictEqual(ranked.length, 3);
  assert.strictEqual(ranked[0].id, 'student-2');
  assert.strictEqual(ranked[0].rank, 1);
  assert.strictEqual(ranked[0].badgeLevel, 'champion');

  assert.strictEqual(ranked[1].id, 'student-3');
  assert.strictEqual(ranked[1].rank, 2);
  assert.strictEqual(ranked[1].badgeLevel, 'top3');

  assert.strictEqual(ranked[2].id, 'student-1');
  assert.strictEqual(ranked[2].rank, 3);
  assert.strictEqual(ranked[2].badgeLevel, 'top3');
});

test('Leaderboard Engine: filterAndRankLeaderboard ranks by streak length', () => {
  const entries: LeaderboardEntry[] = [
    {
      id: 'student-1',
      displayName: 'An N.',
      avatarSeed: 'A',
      avatarColor: 'teal',
      grade: 8,
      studyPoints: 2000,
      streakDays: 2, // low streak, high points
      studyTimeMinutes: 200,
      lessonsCompleted: 5,
      quizzesTaken: 4,
      badgesCount: 5,
      isCurrentUser: false,
    },
    {
      id: 'student-2',
      displayName: 'Bình L.',
      avatarSeed: 'B',
      avatarColor: 'blue',
      grade: 8,
      studyPoints: 1000,
      streakDays: 14, // high streak
      studyTimeMinutes: 120,
      lessonsCompleted: 3,
      quizzesTaken: 2,
      badgesCount: 4,
      isCurrentUser: true,
    },
  ];

  const ranked = filterAndRankLeaderboard(entries, {
    metric: 'streak',
    grade: 'all',
    timeframe: 'all',
  });

  assert.strictEqual(ranked[0].id, 'student-2');
  assert.strictEqual(ranked[0].streakDays, 14);
  assert.strictEqual(ranked[1].id, 'student-1');
});

test('Leaderboard Engine: filterAndRankLeaderboard filters by grade', () => {
  const entries: LeaderboardEntry[] = [
    {
      id: 's-6',
      displayName: 'Lớp 6 Student',
      avatarSeed: '6',
      avatarColor: 'teal',
      grade: 6,
      studyPoints: 1000,
      streakDays: 4,
      studyTimeMinutes: 100,
      lessonsCompleted: 2,
      quizzesTaken: 1,
      badgesCount: 2,
      isCurrentUser: false,
    },
    {
      id: 's-8',
      displayName: 'Lớp 8 Student',
      avatarSeed: '8',
      avatarColor: 'purple',
      grade: 8,
      studyPoints: 1200,
      streakDays: 5,
      studyTimeMinutes: 120,
      lessonsCompleted: 3,
      quizzesTaken: 2,
      badgesCount: 3,
      isCurrentUser: true,
    },
  ];

  const grade8Only = filterAndRankLeaderboard(entries, {
    metric: 'points',
    grade: 8,
    timeframe: 'all',
  });

  assert.strictEqual(grade8Only.length, 1);
  assert.strictEqual(grade8Only[0].grade, 8);
});

test('Leaderboard Engine: getCurrentUserRank finds rank and points to next position', () => {
  const entries: LeaderboardEntry[] = [
    {
      id: 'lead-1',
      displayName: 'Leader 1',
      avatarSeed: 'L',
      avatarColor: 'gold',
      grade: 8,
      studyPoints: 1500,
      streakDays: 10,
      studyTimeMinutes: 200,
      lessonsCompleted: 5,
      quizzesTaken: 3,
      badgesCount: 5,
      isCurrentUser: false,
    },
    {
      id: 'my-id',
      displayName: 'Me',
      avatarSeed: 'M',
      avatarColor: 'teal',
      grade: 8,
      studyPoints: 1200,
      streakDays: 4,
      studyTimeMinutes: 145,
      lessonsCompleted: 3,
      quizzesTaken: 2,
      badgesCount: 3,
      isCurrentUser: true,
    },
    {
      id: 'lead-3',
      displayName: 'Leader 3',
      avatarSeed: '3',
      avatarColor: 'gray',
      grade: 8,
      studyPoints: 900,
      streakDays: 2,
      studyTimeMinutes: 80,
      lessonsCompleted: 2,
      quizzesTaken: 1,
      badgesCount: 2,
      isCurrentUser: false,
    },
  ];

  const ranked = filterAndRankLeaderboard(entries, {
    metric: 'points',
    grade: 'all',
    timeframe: 'all',
  });

  const userStats = getCurrentUserRank(ranked, 'my-id');
  assert.strictEqual(userStats.rank, 2);
  assert.strictEqual(userStats.totalParticipants, 3);
  assert.strictEqual(userStats.pointsToNextRank, 300); // 1500 - 1200
  assert.strictEqual(userStats.aheadEntry?.id, 'lead-1');
});

test('Leaderboard Engine: generateSeedLeaderboard returns populated list with current student', () => {
  const list = generateSeedLeaderboard('my_student_demo', 'Nguyễn Văn Minh', undefined, {
    streak: 4,
    grade: 8,
  });

  assert.ok(list.length >= 10);
  const me = list.find((e) => e.isCurrentUser);
  assert.ok(me, 'Current student should be present in seed leaderboard');
  assert.strictEqual(me?.displayName, 'Minh N.');
  assert.strictEqual(me?.grade, 8);
});
