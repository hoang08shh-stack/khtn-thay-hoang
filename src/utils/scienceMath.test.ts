import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOhmLaw,
  calculatePH,
  calculateTitrationPH,
  getElectronShells,
  calculateSnellRefraction,
  evaluateQuizPerformance,
} from './scienceMath.ts';

test("Ohm's Law calculates current and power accurately", () => {
  const result = calculateOhmLaw(12, 6);
  assert.equal(result.currentAmperes, 2.0);
  assert.equal(result.powerWatts, 24.0);
  assert.equal(result.brightnessRatio, 1.0);

  const lowVoltage = calculateOhmLaw(3, 10);
  assert.equal(lowVoltage.currentAmperes, 0.3);
  assert.equal(lowVoltage.powerWatts, 0.9);
});

test("Ohm's Law throws for non-positive resistance", () => {
  assert.throws(() => calculateOhmLaw(12, 0), /Resistance must be strictly positive/);
});

test('calculatePH computes standard acid/base concentrations', () => {
  assert.equal(calculatePH(0.01), 2.0); // 10^-2 M -> pH 2
  assert.equal(calculatePH(0.0001), 4.0); // 10^-4 M -> pH 4
});

test('calculateTitrationPH identifies neutral, acidic and basic states', () => {
  // Equimolar acid and base
  const neutral = calculateTitrationPH(50, 0.1, 50, 0.1);
  assert.equal(neutral.ph, 7.0);
  assert.equal(neutral.colorHex, '#10b981');

  // Excess acid
  const acidic = calculateTitrationPH(60, 0.1, 40, 0.1);
  assert.ok(acidic.ph < 7.0);

  // Excess base
  const basic = calculateTitrationPH(30, 0.1, 70, 0.1);
  assert.ok(basic.ph > 7.0);
});

test('getElectronShells correctly distributes electrons into Bohr shells', () => {
  // Hydrogen (1)
  assert.deepEqual(getElectronShells(1), [1]);

  // Carbon (6) -> 2, 4
  assert.deepEqual(getElectronShells(6), [2, 4]);

  // Sodium (11) -> 2, 8, 1
  assert.deepEqual(getElectronShells(11), [2, 8, 1]);

  // Chlorine (17) -> 2, 8, 7
  assert.deepEqual(getElectronShells(17), [2, 8, 7]);
});

test("Snell's Law computes refraction angle accurately", () => {
  // Light entering glass (n2 = 1.5) from air (n1 = 1.0) at 30 deg
  const result = calculateSnellRefraction(30, 1.0, 1.5);
  assert.equal(result.isTotalInternalReflection, false);
  // sin(theta2) = sin(30)/1.5 = 0.5/1.5 = 0.3333 -> theta2 ~ 19.47 deg
  assert.ok(result.angleRefractedDeg > 19.0 && result.angleRefractedDeg < 20.0);
});

test('evaluateQuizPerformance assesses percentage and badge awards', () => {
  const perfect = evaluateQuizPerformance(10, 10);
  assert.equal(perfect.percentage, 100);
  assert.equal(perfect.status, 'Xuất sắc');
  assert.equal(perfect.badgeId, 'badge_gold_scientist');

  const good = evaluateQuizPerformance(8, 10);
  assert.equal(good.percentage, 80);
  assert.equal(good.status, 'Giỏi');

  const fail = evaluateQuizPerformance(3, 10);
  assert.equal(fail.percentage, 30);
  assert.equal(fail.status, 'Cần ôn tập');
  assert.equal(fail.passed, false);
});
