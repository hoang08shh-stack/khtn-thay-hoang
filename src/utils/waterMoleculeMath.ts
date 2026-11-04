/**
 * Scientific Mathematical Model for H2O (Water Molecule)
 * Standards: KHTN GDPT 2018 (Grades 7 & 10 Chemistry & Physics)
 * VSEPR Theory (Valence Shell Electron Pair Repulsion)
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface AtomProperties {
  id: string;
  name: string;
  vietnameseName: string;
  symbol: string;
  atomicNumber: number; // Số hiệu nguyên tử Z
  protons: number;
  neutrons: number;
  electrons: number;
  atomicMass: number; // amu (g/mol)
  electronegativity: number; // Độ âm điện Pauling
  valenceElectrons: number;
  electronConfiguration: string;
  covalentRadius: number; // Angstroms (Å)
  vanDerWaalsRadius: number; // Angstroms (Å)
  partialCharge: string; // delta+ or delta-
  partialChargeValue: number; // approx in e
  cpkColor: string;
  description: string;
  roleInWater: string;
}

export interface MoleculeParameters {
  displayMode: 'ball-and-stick' | 'space-filling';
  bondAngleDeg: number; // Default 104.45 deg
  bondLengthScale: number; // Default 1.0 (approx 0.9584 Å scaled)
  showLabels: boolean;
  showAngleArc: boolean;
  showDipole: boolean;
  showLonePairs: boolean;
  showPartialCharges: boolean;
  vibrationSpeed: number; // 0 to 2
  autoRotate: boolean;
  rotateSpeed: number; // 0 to 3
}

export const ATOM_DATABASE: Record<'O' | 'H1' | 'H2', AtomProperties> = {
  O: {
    id: 'O',
    name: 'Oxygen',
    vietnameseName: 'Oxygen (O)',
    symbol: 'O',
    atomicNumber: 8,
    protons: 8,
    neutrons: 8,
    electrons: 8,
    atomicMass: 15.999,
    electronegativity: 3.44, // Pauling scale
    valenceElectrons: 6,
    electronConfiguration: '1s² 2s² 2p⁴',
    covalentRadius: 0.66, // Å
    vanDerWaalsRadius: 1.52, // Å
    partialCharge: 'δ⁻ (2δ⁻)',
    partialChargeValue: -0.66,
    cpkColor: '#EF4444', // Red (CPK standard)
    description: 'Nguyên tử trung tâm lai hóa sp³, có độ âm điện lớn (3.44), hút mạnh 2 cặp electron liên kết về phía mình.',
    roleInWater: 'Tạo nên cực âm của phân tử, giữ 2 cặp electron tự do (lone pairs) gây lực đẩy góc liên kết.',
  },
  H1: {
    id: 'H1',
    name: 'Hydrogen 1',
    vietnameseName: 'Hydrogen 1 (H)',
    symbol: 'H',
    atomicNumber: 1,
    protons: 1,
    neutrons: 0,
    electrons: 1,
    atomicMass: 1.008,
    electronegativity: 2.20, // Pauling scale
    valenceElectrons: 1,
    electronConfiguration: '1s¹',
    covalentRadius: 0.31, // Å
    vanDerWaalsRadius: 1.20, // Å
    partialCharge: 'δ⁺',
    partialChargeValue: +0.33,
    cpkColor: '#F8FAFC', // White/Light slate (CPK standard)
    description: 'Nguyên tử nhẹ nhất vũ trụ, chỉ có 1 electron lớp ngoài cùng, góp chung 1 electron với Oxygen.',
    roleInWater: 'Tạo cực dương của phân tử, sẵn sàng tạo liên kết hydrogen liên phân tử với nguyên tử O của phân tử nước lân cận.',
  },
  H2: {
    id: 'H2',
    name: 'Hydrogen 2',
    vietnameseName: 'Hydrogen 2 (H)',
    symbol: 'H',
    atomicNumber: 1,
    protons: 1,
    neutrons: 0,
    electrons: 1,
    atomicMass: 1.008,
    electronegativity: 2.20, // Pauling scale
    valenceElectrons: 1,
    electronConfiguration: '1s¹',
    covalentRadius: 0.31, // Å
    vanDerWaalsRadius: 1.20, // Å
    partialCharge: 'δ⁺',
    partialChargeValue: +0.33,
    cpkColor: '#F8FAFC', // White/Light slate (CPK standard)
    description: 'Nguyên tử Hydrogen đối xứng qua mặt phẳng phân tử, tạo góc liên kết 104.5° với H1 qua tâm Oxygen.',
    roleInWater: 'Cùng với H1 tạo dạng hình học gấp khúc không đối xứng, làm cho phân tử có mômen lưỡng cực vĩnh viễn.',
  },
};

/**
 * Standard physical constants for H2O
 */
export const H2O_CONSTANTS = {
  REAL_BOND_LENGTH_ANGSTROM: 0.9584, // d(O-H) in gas phase
  IDEAL_BOND_ANGLE_DEG: 104.45, // Experimental bond angle
  TETRAHEDRAL_ANGLE_DEG: 109.47, // Ideal sp3 tetrahedral angle
  DIPOLE_MOMENT_DEBYE: 1.854, // Permanent dipole moment
  ELECTRONEGATIVITY_DIFF: 3.44 - 2.20, // 1.24 -> Polar covalent
  // Scaled units for 3D Viewport presentation
  BALL_AND_STICK: {
    O_RADIUS: 0.52,
    H_RADIUS: 0.32,
    BOND_RADIUS: 0.08,
    BASE_BOND_LENGTH: 1.85,
  },
  SPACE_FILLING: {
    // Proportional to van der Waals radii (O: 1.52 Å, H: 1.20 Å)
    O_RADIUS: 1.05,
    H_RADIUS: 0.83,
    BASE_BOND_LENGTH: 1.05, // Overlapping distance matching vdW overlap
  },
};

/**
 * Calculate exact 3D coordinates for Oxygen and 2 Hydrogens
 * Centers the molecule at (0, 0, 0)
 */
export function calculateMoleculeCoordinates(
  bondAngleDeg: number = H2O_CONSTANTS.IDEAL_BOND_ANGLE_DEG,
  displayMode: 'ball-and-stick' | 'space-filling' = 'ball-and-stick',
  scale: number = 1.0
): {
  oxygen: Vector3D;
  hydrogen1: Vector3D;
  hydrogen2: Vector3D;
  centerOfMass: Vector3D;
  bondLength: number;
} {
  const isSpaceFilling = displayMode === 'space-filling';
  const baseLength = isSpaceFilling
    ? H2O_CONSTANTS.SPACE_FILLING.BASE_BOND_LENGTH
    : H2O_CONSTANTS.BALL_AND_STICK.BASE_BOND_LENGTH;

  const bondLength = baseLength * scale;
  const halfAngleRad = ((bondAngleDeg / 2) * Math.PI) / 180;

  // Center the molecule vertically: Oxygen at +yOffset, Hydrogens at -yOffset
  const yOffset = (bondLength * Math.cos(halfAngleRad)) * 0.5;

  const oxygen: Vector3D = {
    x: 0,
    y: yOffset,
    z: 0,
  };

  const hydrogen1: Vector3D = {
    x: bondLength * Math.sin(halfAngleRad),
    y: yOffset - bondLength * Math.cos(halfAngleRad),
    z: 0,
  };

  const hydrogen2: Vector3D = {
    x: -bondLength * Math.sin(halfAngleRad),
    y: yOffset - bondLength * Math.cos(halfAngleRad),
    z: 0,
  };

  // Center of mass calculation (M_O = 16, M_H = 1)
  const totalMass = 16 + 1 + 1;
  const comY = (16 * oxygen.y + 1 * hydrogen1.y + 1 * hydrogen2.y) / totalMass;

  return {
    oxygen,
    hydrogen1,
    hydrogen2,
    centerOfMass: { x: 0, y: comY, z: 0 },
    bondLength,
  };
}

/**
 * Calculate bond distance between two 3D points
 */
export function calculateDistance(p1: Vector3D, p2: Vector3D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate actual angle in degrees between O-H1 and O-H2 vectors
 */
export function calculateAngleFromCoordinates(
  oxygen: Vector3D,
  h1: Vector3D,
  h2: Vector3D
): number {
  const v1 = { x: h1.x - oxygen.x, y: h1.y - oxygen.y, z: h1.z - oxygen.z };
  const v2 = { x: h2.x - oxygen.x, y: h2.y - oxygen.y, z: h2.z - oxygen.z };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  const cosTheta = Math.max(-1, Math.min(1, dot / (len1 * len2)));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

/**
 * Calculate points for bond angle arc visualization
 */
export function generateAngleArcPoints(
  oxygen: Vector3D,
  h1: Vector3D,
  h2: Vector3D,
  arcRadius = 0.65,
  segments = 32
): Vector3D[] {
  const halfAngleRad = ((calculateAngleFromCoordinates(oxygen, h1, h2) / 2) * Math.PI) / 180;
  const points: Vector3D[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Angle interpolates from -halfAngle to +halfAngle
    const currentAngle = -halfAngleRad + 2 * halfAngleRad * t;
    // In our coordinate system, 0 angle is straight down (-Y direction)
    points.push({
      x: oxygen.x + arcRadius * Math.sin(currentAngle),
      y: oxygen.y - arcRadius * Math.cos(currentAngle),
      z: oxygen.z,
    });
  }

  return points;
}

/**
 * Position for 2 Lone Pairs on Oxygen (VSEPR lobes)
 * Since H atoms are in the XY plane tilted in -Y, the 2 lone pairs point in +Y,
 * tilted symmetrically into +Z and -Z (tetrahedral geometry)
 */
export function calculateLonePairPositions(
  oxygen: Vector3D,
  distance = 0.75
): [Vector3D, Vector3D] {
  // sp3 lone pairs stick out at approx tetrahedral angle relative to the bisector
  const tiltAngleRad = (54.7 * Math.PI) / 180; // half of tetrahedral angle

  return [
    {
      x: oxygen.x,
      y: oxygen.y + distance * Math.cos(tiltAngleRad),
      z: oxygen.z + distance * Math.sin(tiltAngleRad),
    },
    {
      x: oxygen.x,
      y: oxygen.y + distance * Math.cos(tiltAngleRad),
      z: oxygen.z - distance * Math.sin(tiltAngleRad),
    },
  ];
}

/**
 * Vibration model: calculates displacement offset for time t
 * Simulates symmetric stretch and bending modes
 */
export function calculateVibrations(
  timeSeconds: number,
  speed: number = 1.0,
  amplitudeScale: number = 0.05
): {
  bondOffset: number;
  angleOffsetDeg: number;
} {
  if (speed <= 0) return { bondOffset: 0, angleOffsetDeg: 0 };

  const freq = timeSeconds * speed * 4.0;
  // Symmetric stretching mode
  const bondOffset = Math.sin(freq * 1.5) * amplitudeScale;
  // Bending mode (oscillates the angle by ±2.5 deg)
  const angleOffsetDeg = Math.sin(freq) * 2.5;

  return { bondOffset, angleOffsetDeg };
}
