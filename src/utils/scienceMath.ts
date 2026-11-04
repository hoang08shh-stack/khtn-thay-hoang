/**
 * Pure scientific calculation functions for KHOA HỌC SỐ KHTN simulations & quizzes
 */

export interface OhmLawResult {
  voltage: number;
  resistance: number;
  currentAmperes: number;
  powerWatts: number;
  brightnessRatio: number;
}

/**
 * Calculates current (I = U / R), power (P = U * I), and bulb brightness ratio
 */
export function calculateOhmLaw(voltage: number, resistance: number): OhmLawResult {
  if (resistance <= 0) {
    throw new Error('Resistance must be strictly positive');
  }
  const safeVoltage = Math.max(0, voltage);
  const currentAmperes = Math.round((safeVoltage / resistance) * 1000) / 1000;
  const powerWatts = Math.round(safeVoltage * currentAmperes * 1000) / 1000;
  // Normalize brightness relative to 12W nominal bulb
  const brightnessRatio = Math.min(1.0, Math.round((powerWatts / 12) * 100) / 100);

  return {
    voltage: safeVoltage,
    resistance,
    currentAmperes,
    powerWatts,
    brightnessRatio,
  };
}

/**
 * Computes pH = -log10([H+]) rounded to 2 decimal places
 */
export function calculatePH(hydrogenIonConcentrationMolar: number): number {
  if (hydrogenIonConcentrationMolar <= 0) {
    return 7.0;
  }
  const raw = -Math.log10(hydrogenIonConcentrationMolar);
  return Math.max(0, Math.min(14, Math.round(raw * 100) / 100));
}

export interface TitrationPHResult {
  ph: number;
  colorHex: string;
  label: string;
}

/**
 * Calculates pH of strong Acid (Hydrochloric acid HCl) titrated with strong Base (Sodium hydroxide NaOH)
 */
export function calculateTitrationPH(
  acidVolumeMl: number,
  acidMolarity: number,
  baseVolumeMl: number,
  baseMolarity: number
): TitrationPHResult {
  const molesAcid = (acidVolumeMl / 1000) * acidMolarity;
  const molesBase = (baseVolumeMl / 1000) * baseMolarity;
  const totalVolumeLiters = Math.max(0.001, (acidVolumeMl + baseVolumeMl) / 1000);

  const diff = molesAcid - molesBase;

  if (Math.abs(diff) < 1e-7) {
    return {
      ph: 7.0,
      colorHex: '#10b981',
      label: 'Môi trường Trung tính (pH = 7.0) — Điểm tương đương (NaCl + H₂O)',
    };
  }

  if (diff > 0) {
    // Excess H+
    const hConcentration = diff / totalVolumeLiters;
    const ph = calculatePH(hConcentration);
    return {
      ph,
      colorHex: ph < 3.0 ? '#ef4444' : '#f59e0b',
      label: ph < 3.0 ? `Môi trường Acid mạnh (pH = ${ph})` : `Môi trường Acid yếu (pH = ${ph})`,
    };
  } else {
    // Excess OH-
    const ohConcentration = Math.abs(diff) / totalVolumeLiters;
    const pOH = calculatePH(ohConcentration);
    const ph = Math.max(0, Math.min(14, Math.round((14 - pOH) * 100) / 100));
    return {
      ph,
      colorHex: ph > 11.0 ? '#ec4899' : '#3b82f6',
      label: ph > 11.0 ? `Môi trường Base kiềm mạnh (pH = ${ph})` : `Môi trường Base yếu (pH = ${ph})`,
    };
  }
}

/**
 * Distributes atomic number (Z) electrons into Bohr shells [K, L, M, N] -> [2, 8, 8, 18]
 */
export function getElectronShells(atomicNumber: number): number[] {
  let remaining = Math.max(1, Math.min(36, Math.floor(atomicNumber)));
  const capacities = [2, 8, 8, 18];
  const shells: number[] = [];

  for (const cap of capacities) {
    if (remaining <= 0) break;
    const count = Math.min(remaining, cap);
    shells.push(count);
    remaining -= count;
  }

  return shells;
}

export interface SnellRefractionResult {
  angleIncidentDeg: number;
  angleRefractedDeg: number;
  isTotalInternalReflection: boolean;
}

/**
 * Computes Snell's Law refraction angle: n1 * sin(theta1) = n2 * sin(theta2)
 */
export function calculateSnellRefraction(
  angleIncidentDeg: number,
  n1: number,
  n2: number
): SnellRefractionResult {
  const clamped = Math.max(0, Math.min(89.9, angleIncidentDeg));
  const rad1 = (clamped * Math.PI) / 180;
  const sinTheta2 = (n1 / n2) * Math.sin(rad1);

  if (sinTheta2 > 1.0) {
    return {
      angleIncidentDeg: clamped,
      angleRefractedDeg: 90,
      isTotalInternalReflection: true,
    };
  }

  const rad2 = Math.asin(sinTheta2);
  const angleRefractedDeg = Math.round(((rad2 * 180) / Math.PI) * 10) / 10;

  return {
    angleIncidentDeg: clamped,
    angleRefractedDeg,
    isTotalInternalReflection: false,
  };
}

export interface QuizPerformanceResult {
  percentage: number;
  passed: boolean;
  status: 'Xuất sắc' | 'Giỏi' | 'Đạt' | 'Cần ôn tập';
  badgeId?: string;
}

/**
 * Evaluates student quiz performance percentage and badge eligibility
 */
export function evaluateQuizPerformance(score: number, total: number): QuizPerformanceResult {
  const safeTotal = Math.max(1, total);
  const percentage = Math.round((score / safeTotal) * 100);

  if (percentage === 100) {
    return {
      percentage,
      passed: true,
      status: 'Xuất sắc',
      badgeId: 'badge_gold_scientist',
    };
  }
  if (percentage >= 80) {
    return {
      percentage,
      passed: true,
      status: 'Giỏi',
      badgeId: 'badge_explorer',
    };
  }
  if (percentage >= 60) {
    return {
      percentage,
      passed: true,
      status: 'Đạt',
    };
  }
  return {
    percentage,
    passed: false,
    status: 'Cần ôn tập',
  };
}
