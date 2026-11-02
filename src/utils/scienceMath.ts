/**
 * Pure Science & Chemistry/Physics calculations for KHTN GDPT 2018
 */

/**
 * Calculates current, power, and relative brightness using Ohm's Law (I = U / R)
 */
export function calculateOhmLaw(voltageVolts: number, resistanceOhms: number) {
  if (resistanceOhms <= 0) {
    throw new Error('Resistance must be strictly positive');
  }
  const currentAmperes = Number((voltageVolts / resistanceOhms).toFixed(3));
  const powerWatts = Number((voltageVolts * currentAmperes).toFixed(3));
  // Normalized brightness scale from 0 to 1 based on 12V / 10 Ohm nominal peak
  const brightnessRatio = Math.min(1, Math.max(0, powerWatts / 14.4));
  return {
    currentAmperes,
    powerWatts,
    brightnessRatio,
  };
}

/**
 * Calculates pH value from hydrogen ion concentration [H+] or titration volume
 * pH = -log10[H+]
 */
export function calculatePH(hConcentration: number): number {
  if (hConcentration <= 0) {
    throw new Error('Hydrogen ion concentration must be positive');
  }
  const ph = -Math.log10(hConcentration);
  return Number(Math.max(0, Math.min(14, ph)).toFixed(2));
}

/**
 * Acid-base titration calculation:
 * V_acid * C_acid vs V_base * C_base
 * Returns resulting pH and solution color code
 */
export function calculateTitrationPH(
  acidVolMl: number,
  acidConcentrationM: number,
  baseVolMl: number,
  baseConcentrationM: number
): { ph: number; colorHex: string; label: string } {
  const totalVolumeL = (acidVolMl + baseVolMl) / 1000;
  if (totalVolumeL <= 0) {
    return { ph: 7.0, colorHex: '#22c55e', label: 'Trung tính' };
  }

  const molesH = (acidVolMl / 1000) * acidConcentrationM;
  const molesOH = (baseVolMl / 1000) * baseConcentrationM;

  let ph = 7.0;
  if (Math.abs(molesH - molesOH) < 1e-7) {
    ph = 7.0;
  } else if (molesH > molesOH) {
    const excessH = (molesH - molesOH) / totalVolumeL;
    ph = Math.max(1.0, -Math.log10(excessH));
  } else {
    const excessOH = (molesOH - molesH) / totalVolumeL;
    const pOH = Math.max(0.5, -Math.log10(excessOH));
    ph = Math.min(14.0, 14 - pOH);
  }

  const roundedPh = Number(ph.toFixed(2));

  // Determine universal indicator color
  let colorHex = '#22c55e'; // neutral green
  let label = 'Trung tính (pH 7)';
  if (roundedPh < 3) {
    colorHex = '#ef4444'; // Red (Strong Acid)
    label = 'Axit mạnh';
  } else if (roundedPh < 6) {
    colorHex = '#f97316'; // Orange-Yellow (Weak Acid)
    label = 'Axit yếu';
  } else if (roundedPh <= 7.5) {
    colorHex = '#10b981'; // Green (Neutral)
    label = 'Trung tính';
  } else if (roundedPh < 11) {
    colorHex = '#0ea5e9'; // Cyan-Blue (Weak Base)
    label = 'Bazơ yếu';
  } else {
    colorHex = '#8b5cf6'; // Violet-Purple (Strong Base)
    label = 'Bazơ mạnh';
  }

  return { ph: roundedPh, colorHex, label };
}

/**
 * Calculates electron shell configuration according to Bohr model (2, 8, 8, 18...)
 */
export function getElectronShells(electronCount: number): number[] {
  const shellCapacities = [2, 8, 8, 18, 18, 32];
  const shells: number[] = [];
  let remaining = electronCount;

  for (const cap of shellCapacities) {
    if (remaining <= 0) break;
    const countInShell = Math.min(remaining, cap);
    shells.push(countInShell);
    remaining -= countInShell;
  }
  return shells;
}

/**
 * Calculates refraction angle using Snell's Law: n1 * sin(theta1) = n2 * sin(theta2)
 * angles in degrees
 */
export function calculateSnellRefraction(
  angleDeg: number,
  n1: number = 1.0,
  n2: number = 1.5
): { angleRefractedDeg: number; isTotalInternalReflection: boolean } {
  const theta1Rad = (angleDeg * Math.PI) / 180;
  const sinTheta2 = (n1 / n2) * Math.sin(theta1Rad);

  if (sinTheta2 > 1.0) {
    return {
      angleRefractedDeg: 0,
      isTotalInternalReflection: true,
    };
  }

  const theta2Rad = Math.asin(sinTheta2);
  const angleRefractedDeg = Number(((theta2Rad * 180) / Math.PI).toFixed(2));
  return {
    angleRefractedDeg,
    isTotalInternalReflection: false,
  };
}

/**
 * Evaluates quiz results and awards appropriate medal/status
 */
export function evaluateQuizPerformance(score: number, total: number) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  let status: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Cần ôn tập';
  let badgeId: string | null = null;

  if (percentage >= 90) {
    status = 'Xuất sắc';
    badgeId = 'badge_gold_scientist';
  } else if (percentage >= 75) {
    status = 'Giỏi';
    badgeId = 'badge_silver_explorer';
  } else if (percentage >= 50) {
    status = 'Khá';
    badgeId = 'badge_bronze_student';
  } else {
    status = 'Cần ôn tập';
  }

  return {
    percentage,
    status,
    badgeId,
    passed: percentage >= 50,
  };
}
