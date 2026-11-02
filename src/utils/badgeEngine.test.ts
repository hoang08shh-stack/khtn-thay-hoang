import { test } from 'node:test';
import assert from 'node:assert';
import {
  SYSTEM_BADGES,
  checkBadgeCondition,
  evaluateStudentBadges,
  UserBadgeProgressState,
} from './badgeEngine.ts';

test('Badge System: New user starts with no badges earned', () => {
  const freshState: UserBadgeProgressState = {
    userId: 'user_fresh',
    completedLessons: [],
    completedSimulations: [],
    quizScores: {},
    studyTimeMinutes: 0,
    earnedBadgeIds: [],
  };

  const result = evaluateStudentBadges(freshState);
  assert.strictEqual(result.newlyAwardedBadges.length, 0);
  assert.strictEqual(result.totalPointsEarned, 0);
  assert.strictEqual(result.allProgress['badge_explorer'].isEarned, false);
  assert.strictEqual(result.allProgress['badge_explorer'].progressPercent, 0);
});

test('Badge System: Completing 1 lesson awards Science Explorer badge', () => {
  const state: UserBadgeProgressState = {
    userId: 'user_1',
    completedLessons: ['khtn-7-bai-2'],
    completedSimulations: [],
    quizScores: {},
    studyTimeMinutes: 15,
    earnedBadgeIds: [],
  };

  const result = evaluateStudentBadges(state);
  const explorer = result.newlyAwardedBadges.find((b) => b.id === 'badge_explorer');
  assert.ok(explorer, 'Science Explorer should be newly awarded');
  assert.strictEqual(explorer.titleEn, 'Science Explorer');
  assert.strictEqual(result.allProgress['badge_explorer'].isEarned, true);
  assert.strictEqual(result.allProgress['badge_explorer'].progressPercent, 100);
});

test('Badge System: Completing 2 3D simulations awards Lab Pioneer badge', () => {
  const state: UserBadgeProgressState = {
    userId: 'user_2',
    completedLessons: ['khtn-8-bai-8'],
    completedSimulations: ['sim-water-molecule', 'sim-electric-circuit'],
    quizScores: {},
    studyTimeMinutes: 45,
    earnedBadgeIds: ['badge_explorer'],
  };

  const result = evaluateStudentBadges(state);
  const pioneer = result.newlyAwardedBadges.find((b) => b.id === 'badge_lab_pioneer');
  assert.ok(pioneer, 'Lab Pioneer should be newly awarded');
  assert.strictEqual(pioneer.titleEn, 'Lab Pioneer');
  assert.strictEqual(result.allProgress['badge_lab_pioneer'].isEarned, true);
});

test('Badge System: Master of Physics requires physics lesson and quiz score >= 8.0', () => {
  // Scenario A: Only physics lesson completed, but quiz score < 8
  const stateIncomplete: UserBadgeProgressState = {
    userId: 'user_3',
    completedLessons: ['khtn-8-bai-8'],
    completedSimulations: [],
    quizScores: {
      'quiz-circuit': { score: 6.0, total: 10, domain: 'vat-li' },
    },
    studyTimeMinutes: 30,
    earnedBadgeIds: [],
  };

  const resA = evaluateStudentBadges(stateIncomplete);
  assert.strictEqual(resA.allProgress['badge_physics_master'].isEarned, false);
  assert.strictEqual(resA.allProgress['badge_physics_master'].progressPercent, 50);

  // Scenario B: Physics lesson completed AND quiz score is 9.0
  const stateComplete: UserBadgeProgressState = {
    ...stateIncomplete,
    quizScores: {
      'quiz-circuit': { score: 9.0, total: 10, domain: 'vat-li' },
    },
  };

  const resB = evaluateStudentBadges(stateComplete);
  const physicsMaster = resB.newlyAwardedBadges.find((b) => b.id === 'badge_physics_master');
  assert.ok(physicsMaster, 'Master of Physics should be newly awarded');
  assert.strictEqual(physicsMaster.titleEn, 'Master of Physics');
  assert.strictEqual(resB.allProgress['badge_physics_master'].isEarned, true);
});

test('Badge System: Quiz Champion requires perfect 10/10 score', () => {
  const stateNine: UserBadgeProgressState = {
    userId: 'user_4',
    completedLessons: ['khtn-8-bai-5'],
    completedSimulations: [],
    quizScores: {
      'quiz-acid-base': { score: 9.5, total: 10, domain: 'hoa-hoc' },
    },
    studyTimeMinutes: 50,
    earnedBadgeIds: [],
  };
  const resNine = evaluateStudentBadges(stateNine);
  assert.strictEqual(resNine.allProgress['badge_quiz_champion'].isEarned, false);

  const stateTen: UserBadgeProgressState = {
    ...stateNine,
    quizScores: {
      'quiz-acid-base': { score: 10.0, total: 10, domain: 'hoa-hoc' },
    },
  };
  const resTen = evaluateStudentBadges(stateTen);
  const champion = resTen.newlyAwardedBadges.find((b) => b.id === 'badge_quiz_champion');
  assert.ok(champion, 'Quiz Champion should be newly awarded on score 10');
});

test('Badge System: Dedicated Scholar awarded after 120 minutes of study', () => {
  const state60: UserBadgeProgressState = {
    userId: 'user_5',
    completedLessons: [],
    completedSimulations: [],
    quizScores: {},
    studyTimeMinutes: 60,
    earnedBadgeIds: [],
  };
  assert.strictEqual(checkBadgeCondition('badge_study_streak', state60).isSatisfied, false);
  assert.strictEqual(checkBadgeCondition('badge_study_streak', state60).current, 60);

  const state145: UserBadgeProgressState = {
    ...state60,
    studyTimeMinutes: 145,
  };
  assert.strictEqual(checkBadgeCondition('badge_study_streak', state145).isSatisfied, true);
});

test('Badge System: Evaluation is idempotent and does not re-award already earned badges', () => {
  const alreadyEarnedState: UserBadgeProgressState = {
    userId: 'user_6',
    completedLessons: ['khtn-8-bai-8'],
    completedSimulations: ['sim-water-molecule', 'sim-electric-circuit'],
    quizScores: {
      'quiz-circuit': { score: 10.0, total: 10, domain: 'vat-li' },
    },
    studyTimeMinutes: 150,
    earnedBadgeIds: [
      'badge_explorer',
      'badge_lab_pioneer',
      'badge_physics_master',
      'badge_quiz_champion',
      'badge_study_streak',
      'badge_water_master',
    ],
  };

  const result = evaluateStudentBadges(alreadyEarnedState);
  assert.strictEqual(result.newlyAwardedBadges.length, 0, 'Should not award already earned badges');
  assert.ok(result.totalPointsEarned > 500, 'Total points should account for all earned badges');
});
