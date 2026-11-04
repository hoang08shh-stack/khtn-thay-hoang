import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMemoryDeck,
  evaluateMemoryTurn,
  evaluateCrosswordRow,
  normalizeCrosswordInput,
  calculateAnswerReward,
  buildGameRunSummary,
  filterByGradeWithFallback,
  SCIENCE_PAIR_BANK,
  CROSSWORD_ROW_BANK,
} from './scienceGameEngine.ts';

test('buildMemoryDeck creates 2N cards with matching pairs and deterministic order', () => {
  const deckA = buildMemoryDeck('all', 6, 101);
  const deckB = buildMemoryDeck('all', 6, 101);

  assert.equal(deckA.length, 12);
  assert.deepEqual(
    deckA.map((c) => c.uid),
    deckB.map((c) => c.uid)
  );
});

test('filterByGradeWithFallback prioritizes selected grade and supplements to minCount', () => {
  const grade8Pairs = filterByGradeWithFallback(SCIENCE_PAIR_BANK, 8, 6);
  assert.equal(grade8Pairs.length, 6);
  assert.equal(grade8Pairs[0].grade, 8);
});

test('evaluateMemoryTurn awards combo bonus on valid match and resets streak on mismatch', () => {
  const deck = buildMemoryDeck('all', 4, 7);
  const firstCard = deck[0];
  const partnerCard = deck.find((c) => c.pairId === firstCard.pairId && c.uid !== firstCard.uid)!;
  const nonPartnerCard = deck.find((c) => c.pairId !== firstCard.pairId)!;

  const match1 = evaluateMemoryTurn(firstCard, partnerCard, 0);
  assert.equal(match1.isMatch, true);
  assert.equal(match1.nextStreak, 1);
  assert.equal(match1.pointsDelta, 120);

  const miss = evaluateMemoryTurn(firstCard, nonPartnerCard, 3);
  assert.equal(miss.isMatch, false);
  assert.equal(miss.nextStreak, 0);
});

test('normalizeCrosswordInput and evaluateCrosswordRow handle Vietnamese accents and spaces', () => {
  assert.equal(normalizeCrosswordInput('Lục lạp'), 'LUCLAP');
  assert.equal(normalizeCrosswordInput('Trái Đất'), 'TRAIDAT');

  const row = CROSSWORD_ROW_BANK.find((r) => r.id === 'cw-5')!;
  const resCorrect = evaluateCrosswordRow(row, 'Lục lạp', 1, false);
  assert.equal(resCorrect.isCorrect, true);
  assert.equal(resCorrect.nextStreak, 2);
  assert.equal(resCorrect.keyLetter, 'C');
  assert.ok(resCorrect.pointsDelta >= 160);

  const resWrong = evaluateCrosswordRow(row, 'Nhân tế bào', 2, false);
  assert.equal(resWrong.isCorrect, false);
  assert.equal(resWrong.nextStreak, 0);
});

test('calculateAnswerReward and buildGameRunSummary compute expected metrics', () => {
  const reward = calculateAnswerReward({
    isCorrect: true,
    currentStreak: 2,
    remainingSeconds: 20,
    usedHint: false,
  });
  assert.equal(reward.nextStreak, 3);
  assert.ok(reward.pointsDelta > 150);

  const summary = buildGameRunSummary({
    mode: 'science-crossword',
    victory: true,
    score: 840,
    previousBest: 700,
    correctAttempts: 5,
    totalAttempts: 5,
    timeSpentSeconds: 45,
    maxStreak: 5,
    completedCount: 5,
    totalCount: 5,
  });

  assert.equal(summary.bestScore, 840);
  assert.equal(summary.accuracyPercent, 100);
});
