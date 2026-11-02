import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMoleculeCoordinates,
  calculateDistance,
  calculateAngleFromCoordinates,
  generateAngleArcPoints,
  calculateLonePairPositions,
  calculateVibrations,
  H2O_CONSTANTS,
  ATOM_DATABASE,
} from './waterMoleculeMath.ts';

test('Water molecule coordinates match standard 104.5 degree bond angle', () => {
  const coords = calculateMoleculeCoordinates(104.45, 'ball-and-stick', 1.0);

  // Symmetry check: x1 = -x2, y1 = y2
  assert.equal(Math.abs(coords.hydrogen1.x + coords.hydrogen2.x) < 1e-6, true);
  assert.equal(Math.abs(coords.hydrogen1.y - coords.hydrogen2.y) < 1e-6, true);

  // Oxygen is at x = 0, z = 0
  assert.equal(coords.oxygen.x, 0);
  assert.equal(coords.oxygen.z, 0);

  // Check calculated angle between O-H1 and O-H2
  const computedAngle = calculateAngleFromCoordinates(
    coords.oxygen,
    coords.hydrogen1,
    coords.hydrogen2
  );
  assert.ok(Math.abs(computedAngle - 104.45) < 0.01, `Angle should be approx 104.45, got ${computedAngle}`);
});

test('Bond distances between Oxygen and both Hydrogens are equal', () => {
  const coords = calculateMoleculeCoordinates(104.5, 'ball-and-stick', 1.0);
  const d1 = calculateDistance(coords.oxygen, coords.hydrogen1);
  const d2 = calculateDistance(coords.oxygen, coords.hydrogen2);

  assert.ok(Math.abs(d1 - d2) < 1e-6, 'Both O-H bonds must be equal in length');
  assert.ok(Math.abs(d1 - H2O_CONSTANTS.BALL_AND_STICK.BASE_BOND_LENGTH) < 1e-6);
});

test('Space-filling mode uses appropriate overlapping bond scale', () => {
  const ballCoords = calculateMoleculeCoordinates(104.5, 'ball-and-stick', 1.0);
  const spaceCoords = calculateMoleculeCoordinates(104.5, 'space-filling', 1.0);

  const ballDist = calculateDistance(ballCoords.oxygen, ballCoords.hydrogen1);
  const spaceDist = calculateDistance(spaceCoords.oxygen, spaceCoords.hydrogen1);

  // In space filling mode, atoms overlap closer together matching van der Waals overlap
  assert.ok(spaceDist < ballDist, 'Space-filling bond distance should be shorter than ball-and-stick');
  assert.equal(spaceDist, H2O_CONSTANTS.SPACE_FILLING.BASE_BOND_LENGTH);
});

test('Lone pair positions are placed symmetrically above Oxygen out-of-plane', () => {
  const coords = calculateMoleculeCoordinates(104.5, 'ball-and-stick', 1.0);
  const [lp1, lp2] = calculateLonePairPositions(coords.oxygen, 0.75);

  // Oxygen is at z = 0; lone pairs should extend into +z and -z symmetrically
  assert.ok(lp1.z > 0, 'Lone pair 1 should have positive z');
  assert.ok(lp2.z < 0, 'Lone pair 2 should have negative z');
  assert.ok(Math.abs(lp1.z + lp2.z) < 1e-6, 'Lone pair z coordinates must be mirror opposites');
  assert.ok(lp1.y > coords.oxygen.y, 'Lone pairs must be above Oxygen (+y)');
});

test('Angle arc points produce valid smooth curve', () => {
  const coords = calculateMoleculeCoordinates(104.5, 'ball-and-stick', 1.0);
  const points = generateAngleArcPoints(coords.oxygen, coords.hydrogen1, coords.hydrogen2, 0.5, 16);

  assert.equal(points.length, 17);
  // First point should be on H2 side (-x), last point on H1 side (+x)
  assert.ok(points[0].x < 0, 'First arc point should be on negative x side');
  assert.ok(points[points.length - 1].x > 0, 'Last arc point should be on positive x side');
});

test('Vibrations oscillate without NaN or infinite values', () => {
  const staticVibe = calculateVibrations(0, 0);
  assert.equal(staticVibe.bondOffset, 0);
  assert.equal(staticVibe.angleOffsetDeg, 0);

  const dynamicVibe = calculateVibrations(1.25, 1.0);
  assert.ok(!Number.isNaN(dynamicVibe.bondOffset));
  assert.ok(!Number.isNaN(dynamicVibe.angleOffsetDeg));
  assert.ok(Math.abs(dynamicVibe.angleOffsetDeg) <= 3.0);
});

test('Atom database contains complete GDPT 2018 scientific properties', () => {
  const oxygen = ATOM_DATABASE.O;
  const h1 = ATOM_DATABASE.H1;

  assert.equal(oxygen.symbol, 'O');
  assert.equal(oxygen.atomicNumber, 8);
  assert.equal(oxygen.electronegativity, 3.44);
  assert.equal(oxygen.cpkColor, '#EF4444');

  assert.equal(h1.symbol, 'H');
  assert.equal(h1.atomicNumber, 1);
  assert.equal(h1.electronegativity, 2.20);
  assert.equal(h1.cpkColor, '#F8FAFC');

  // Difference in electronegativity calculation
  const deltaChi = oxygen.electronegativity - h1.electronegativity;
  assert.ok(Math.abs(deltaChi - 1.24) < 1e-6);
  assert.ok(deltaChi >= 0.4 && deltaChi < 1.7, 'Must classify as polar covalent bond (0.4 <= deltaChi < 1.7)');
});
