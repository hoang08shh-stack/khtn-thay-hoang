/**
 * Badge System Pure Logic & Evaluation Engine
 * Nền tảng KHTN THẦY HOÀNG - GDPT 2018
 */

export type BadgeCategory = 'physics' | 'chemistry' | 'biology' | 'simulation' | 'quiz' | 'general';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface BadgeDefinition {
  id: string;
  code: string;
  name: string;
  titleEn: string;
  description: string;
  icon: string; // Lucide icon name: 'Zap', 'Sparkles', 'FlaskConical', 'Microscope', 'Award', 'Compass', 'Clock', 'Droplets'
  category: BadgeCategory;
  tier: BadgeTier;
  requiredCriteria: string;
  pointsReward: number;
}

export interface UserBadgeProgressState {
  userId: string;
  completedLessons: string[]; // e.g. ['khtn-8-bai-8', 'khtn-7-bai-2']
  completedSimulations: string[]; // e.g. ['sim-water-molecule', 'sim-electric-circuit']
  quizScores: Record<
    string,
    {
      score: number;
      total: number;
      percentage?: number;
      grade?: number;
      domain?: string;
    }
  >;
  studyTimeMinutes: number;
  earnedBadgeIds: string[];
}

export interface BadgeProgressInfo {
  badgeId: string;
  isEarned: boolean;
  earnedAt?: string;
  progressPercent: number; // 0 to 100
  currentValue: number;
  targetValue: number;
  progressLabel: string;
}

export interface BadgeEvaluationResult {
  newlyAwardedBadges: BadgeDefinition[];
  allProgress: Record<string, BadgeProgressInfo>;
  totalPointsEarned: number;
}

export const SYSTEM_BADGES: BadgeDefinition[] = [
  {
    id: 'badge_explorer',
    code: 'SCIENCE_EXPLORER',
    name: 'Nhà Thám Hiểm Khoa Học',
    titleEn: 'Science Explorer',
    description: 'Bắt đầu hành trình khám phá và hoàn thành bài học đầu tiên trong chương trình KHTN.',
    icon: 'Compass',
    category: 'general',
    tier: 'bronze',
    requiredCriteria: 'Hoàn thành ít nhất 1 bài học bất kỳ',
    pointsReward: 30,
  },
  {
    id: 'badge_lab_pioneer',
    code: 'LAB_PIONEER',
    name: 'Người Tiên Phong Phòng Lab 3D',
    titleEn: 'Lab Pioneer',
    description: 'Tiên phong làm chủ công nghệ thực hành mô phỏng 3D trong phòng thí nghiệm số.',
    icon: 'Sparkles',
    category: 'simulation',
    tier: 'gold',
    requiredCriteria: 'Hoàn thành từ 2 mô phỏng thí nghiệm 3D tương tác',
    pointsReward: 100,
  },
  {
    id: 'badge_water_master',
    code: 'WATER_MOLECULE_MASTER',
    name: 'Nhà Nghiên Cứu Phân Tử Nước',
    titleEn: 'Water Molecule Explorer',
    description: 'Khám phá mô hình cấu trúc phân tử H2O, nắm vững góc liên kết hóa học 104.5°.',
    icon: 'Droplets',
    category: 'simulation',
    tier: 'silver',
    requiredCriteria: 'Thực hành mô phỏng 3D Phân tử nước H2O',
    pointsReward: 60,
  },
  {
    id: 'badge_physics_master',
    code: 'MASTER_OF_PHYSICS',
    name: 'Bậc Thầy Vật Lí KHTN',
    titleEn: 'Master of Physics',
    description: 'Làm chủ kiến thức phân môn Vật lí (Điện học, Định luật Ôm hoặc Quang học) với điểm số xuất sắc.',
    icon: 'Zap',
    category: 'physics',
    tier: 'diamond',
    requiredCriteria: 'Hoàn thành ít nhất 1 bài học Vật lí và đạt điểm bài thi trắc nghiệm Vật lí từ 8.0 trở lên',
    pointsReward: 150,
  },
  {
    id: 'badge_chemistry_master',
    code: 'MASTER_OF_CHEMISTRY',
    name: 'Bậc Thầy Hóa Học KHTN',
    titleEn: 'Master of Chemistry',
    description: 'Làm chủ kiến thức Chất và sự biến đổi hóa học (Cấu tạo nguyên tử, Axit - Bazơ, Phân tử H2O).',
    icon: 'FlaskConical',
    category: 'chemistry',
    tier: 'diamond',
    requiredCriteria: 'Hoàn thành ít nhất 1 bài học Hóa học và đạt điểm bài thi trắc nghiệm Hóa học từ 8.0 trở lên',
    pointsReward: 150,
  },
  {
    id: 'badge_biology_master',
    code: 'MASTER_OF_BIOLOGY',
    name: 'Bậc Thầy Sinh Học Tế Bào',
    titleEn: 'Master of Biology',
    description: 'Làm chủ thế giới sống: thành thạo cấu tạo tế bào và thao tác kính hiển vi quang học.',
    icon: 'Microscope',
    category: 'biology',
    tier: 'diamond',
    requiredCriteria: 'Hoàn thành bài học Sinh học và đạt điểm bài thi trắc nghiệm Sinh học từ 8.0 trở lên',
    pointsReward: 150,
  },
  {
    id: 'badge_quiz_champion',
    code: 'QUIZ_CHAMPION',
    name: 'Thủ Khoa Đấu Trí',
    titleEn: 'Quiz Champion',
    description: 'Thể hiện tư duy sắc bén và đạt điểm tuyệt đối 10/10 trong bài thi đánh giá năng lực.',
    icon: 'Award',
    category: 'quiz',
    tier: 'gold',
    requiredCriteria: 'Đạt điểm tối đa (10/10) trong ít nhất một bài kiểm tra trắc nghiệm',
    pointsReward: 120,
  },
  {
    id: 'badge_study_streak',
    code: 'DEDICATED_SCHOLAR',
    name: 'Nhà Khoa Học Chăm Chỉ',
    titleEn: 'Dedicated Scholar',
    description: 'Chăm chỉ tích lũy kiến thức với tổng thời lượng học tập và thực hành đạt trên 120 phút.',
    icon: 'Clock',
    category: 'general',
    tier: 'silver',
    requiredCriteria: 'Tích lũy từ 120 phút học tập trên hệ thống',
    pointsReward: 80,
  },
];

/**
 * Check if a specific badge criterion is satisfied
 */
export function checkBadgeCondition(
  badgeId: string,
  state: UserBadgeProgressState
): { isSatisfied: boolean; current: number; target: number; label: string } {
  const completedLessons = state.completedLessons || [];
  const completedSims = state.completedSimulations || [];
  const quizScores = Object.values(state.quizScores || {});
  const studyMinutes = state.studyTimeMinutes || 0;

  switch (badgeId) {
    case 'badge_explorer': {
      const current = completedLessons.length;
      const target = 1;
      return {
        isSatisfied: current >= target,
        current: Math.min(current, target),
        target,
        label: `${current}/${target} bài học hoàn thành`,
      };
    }

    case 'badge_lab_pioneer': {
      const current = completedSims.length;
      const target = 2;
      return {
        isSatisfied: current >= target,
        current: Math.min(current, target),
        target,
        label: `${current}/${target} mô phỏng 3D hoàn thành`,
      };
    }

    case 'badge_water_master': {
      const hasWater = completedSims.includes('sim-water-molecule');
      return {
        isSatisfied: hasWater,
        current: hasWater ? 1 : 0,
        target: 1,
        label: hasWater ? 'Đã khám phá phân tử H2O' : 'Chưa thực hành mô phỏng H2O',
      };
    }

    case 'badge_physics_master': {
      // Physics lessons include 'khtn-8-bai-8' (Ohm's law), 'khtn-9-bai-4' (optics)
      const hasPhysicsLesson = completedLessons.some(
        (id) => id.includes('bai-8') || id.includes('bai-4') || id.includes('vat-li')
      );
      // High score in physics quiz
      const hasHighPhysicsScore = quizScores.some(
        (q) => (q.domain === 'vat-li' || q.domain === 'physics') && q.score >= 8.0
      ) || Object.entries(state.quizScores || {}).some(
        ([key, val]) => (key.includes('circuit') || key.includes('bai-8') || key.includes('optics')) && val.score >= 8.0
      );

      const isSatisfied = hasPhysicsLesson && hasHighPhysicsScore;
      let currentCount = 0;
      if (hasPhysicsLesson) currentCount += 1;
      if (hasHighPhysicsScore) currentCount += 1;

      return {
        isSatisfied,
        current: currentCount,
        target: 2,
        label: isSatisfied
          ? 'Đã đạt chuẩn Bậc thầy Vật lí'
          : `${currentCount}/2 điều kiện (Bài học + Thi ≥8đ)`,
      };
    }

    case 'badge_chemistry_master': {
      // Chemistry lessons include 'khtn-7-bai-2' (atom), 'khtn-8-bai-5' (acid-base)
      const hasChemistryLesson = completedLessons.some(
        (id) => id.includes('bai-2') || id.includes('bai-5') || id.includes('hoa-hoc')
      );
      const hasHighChemistryScore = quizScores.some(
        (q) => (q.domain === 'hoa-hoc' || q.domain === 'chemistry') && q.score >= 8.0
      ) || Object.entries(state.quizScores || {}).some(
        ([key, val]) => (key.includes('atom') || key.includes('acid') || key.includes('bai-2') || key.includes('bai-5')) && val.score >= 8.0
      );

      const isSatisfied = hasChemistryLesson && hasHighChemistryScore;
      let currentCount = 0;
      if (hasChemistryLesson) currentCount += 1;
      if (hasHighChemistryScore) currentCount += 1;

      return {
        isSatisfied,
        current: currentCount,
        target: 2,
        label: isSatisfied
          ? 'Đã đạt chuẩn Bậc thầy Hóa học'
          : `${currentCount}/2 điều kiện (Bài học + Thi ≥8đ)`,
      };
    }

    case 'badge_biology_master': {
      // Biology lesson 'khtn-6-bai-3' (microscope cell)
      const hasBiologyLesson = completedLessons.some(
        (id) => id.includes('bai-3') || id.includes('sinh-hoc')
      );
      const hasHighBiologyScore = quizScores.some(
        (q) => (q.domain === 'sinh-hoc' || q.domain === 'biology') && q.score >= 8.0
      ) || Object.entries(state.quizScores || {}).some(
        ([key, val]) => (key.includes('microscope') || key.includes('cell') || key.includes('bai-3')) && val.score >= 8.0
      );

      const isSatisfied = hasBiologyLesson && hasHighBiologyScore;
      let currentCount = 0;
      if (hasBiologyLesson) currentCount += 1;
      if (hasHighBiologyScore) currentCount += 1;

      return {
        isSatisfied,
        current: currentCount,
        target: 2,
        label: isSatisfied
          ? 'Đã đạt chuẩn Bậc thầy Sinh học'
          : `${currentCount}/2 điều kiện (Bài học + Thi ≥8đ)`,
      };
    }

    case 'badge_quiz_champion': {
      const hasPerfectScore = quizScores.some((q) => q.score >= 10.0);
      const maxScore = quizScores.length > 0 ? Math.max(...quizScores.map((q) => q.score)) : 0;
      return {
        isSatisfied: hasPerfectScore,
        current: maxScore,
        target: 10,
        label: hasPerfectScore ? 'Đạt điểm tối đa 10/10' : `Điểm cao nhất: ${maxScore}/10`,
      };
    }

    case 'badge_study_streak': {
      const target = 120;
      const current = Math.min(studyMinutes, target);
      return {
        isSatisfied: studyMinutes >= target,
        current,
        target,
        label: `${studyMinutes}/${target} phút học tập`,
      };
    }

    default:
      return {
        isSatisfied: false,
        current: 0,
        target: 1,
        label: 'Chưa hoàn thành',
      };
  }
}

/**
 * Authoritative evaluation: evaluates all badges for a user and calculates newly earned badges
 */
export function evaluateStudentBadges(
  state: UserBadgeProgressState,
  badgeDefs: BadgeDefinition[] = SYSTEM_BADGES
): BadgeEvaluationResult {
  const earnedSet = new Set(state.earnedBadgeIds || []);
  const newlyAwarded: BadgeDefinition[] = [];
  const allProgress: Record<string, BadgeProgressInfo> = {};
  let totalPointsEarned = 0;

  for (const badge of badgeDefs) {
    const alreadyEarned = earnedSet.has(badge.id);
    const condition = checkBadgeCondition(badge.id, state);

    const isNowEarned = alreadyEarned || condition.isSatisfied;
    const progressPercent = isNowEarned
      ? 100
      : Math.min(100, Math.round((condition.current / Math.max(1, condition.target)) * 100));

    allProgress[badge.id] = {
      badgeId: badge.id,
      isEarned: isNowEarned,
      progressPercent,
      currentValue: condition.current,
      targetValue: condition.target,
      progressLabel: condition.label,
    };

    if (!alreadyEarned && condition.isSatisfied) {
      newlyAwarded.push(badge);
    }

    if (isNowEarned) {
      totalPointsEarned += badge.pointsReward;
    }
  }

  return {
    newlyAwardedBadges: newlyAwarded,
    allProgress,
    totalPointsEarned,
  };
}
