import { SubjectDomain } from '../types/index.ts';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';
export type BadgeCategory = 'exploration' | 'laboratory' | 'mastery' | 'consistency';

export interface BadgeDefinition {
  id: string;
  code: string;
  name: string;
  titleEn: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
  requiredCriteria: string;
  pointsReward: number;
}

export interface UserBadgeProgressState {
  userId: string;
  completedLessons: string[];
  completedSimulations: string[];
  quizScores: Record<
    string,
    {
      score: number;
      total: number;
      domain?: SubjectDomain;
    }
  >;
  studyTimeMinutes: number;
  earnedBadgeIds: string[];
}

export interface BadgeProgressInfo {
  badgeId: string;
  isEarned: boolean;
  current: number;
  target: number;
  progressPercent: number;
  progressLabel: string;
}

export interface BadgeEvaluationResult {
  newlyAwardedBadges: BadgeDefinition[];
  totalPointsEarned: number;
  allProgress: Record<string, BadgeProgressInfo>;
}

export const SYSTEM_BADGES: BadgeDefinition[] = [
  {
    id: 'badge_explorer',
    code: 'SCIENCE_EXPLORER',
    name: 'Nhà Khám Phá Khoa Học',
    titleEn: 'Science Explorer',
    description: 'Hoàn thành bài học Khoa học tự nhiên đầu tiên trên KHOA HỌC SỐ KHTN.',
    icon: 'Compass',
    category: 'exploration',
    tier: 'bronze',
    requiredCriteria: 'Hoàn thành ít nhất 1 bài học trong bộ sách Kết nối tri thức với cuộc sống.',
    pointsReward: 50,
  },
  {
    id: 'badge_lab_pioneer',
    code: 'LAB_PIONEER',
    name: 'Chuyên Gia Thí Nghiệm 3D',
    titleEn: 'Lab Pioneer',
    description: 'Tương tác và hoàn thành ít nhất 2 mô phỏng trong KHOA HỌC SỐ KHTN.',
    icon: 'FlaskConical',
    category: 'laboratory',
    tier: 'silver',
    requiredCriteria: 'Thực hành ít nhất 2 mô phỏng 3D tương tác.',
    pointsReward: 100,
  },
  {
    id: 'badge_water_master',
    code: 'MOLECULE_ARCHITECT',
    name: 'Kiến Trúc Sư Phân Tử IUPAC',
    titleEn: 'Molecule Architect',
    description: 'Khám phá mô hình 3D phân tử Nước (H₂O) hoặc Nguyên tử Rutherford - Bohr chuẩn IUPAC.',
    icon: 'Droplets',
    category: 'laboratory',
    tier: 'silver',
    requiredCriteria: 'Hoàn thành mô phỏng cấu trúc phân tử H₂O hoặc Nguyên tử Bohr.',
    pointsReward: 100,
  },
  {
    id: 'badge_physics_master',
    code: 'MASTER_OF_PHYSICS',
    name: 'Bậc Thầy Vật Lí & Định Luật Ohm',
    titleEn: 'Master of Physics',
    description: 'Hoàn thành bài học Vật lí và đạt từ 8.0/10 điểm trở lên trong bài kiểm tra Vật lí.',
    icon: 'Zap',
    category: 'mastery',
    tier: 'gold',
    requiredCriteria: 'Hoàn thành ≥ 1 bài học và đạt điểm Quiz Vật lí ≥ 8.0/10.',
    pointsReward: 150,
  },
  {
    id: 'badge_quiz_champion',
    code: 'QUIZ_CHAMPION',
    name: 'Thủ Khoa Khoa Học Tự Nhiên',
    titleEn: 'Quiz Champion',
    description: 'Đạt điểm tuyệt đối 10/10 trong một bài kiểm tra năng lực KHTN.',
    icon: 'Award',
    category: 'mastery',
    tier: 'diamond',
    requiredCriteria: 'Đạt điểm 10/10 trong bất kỳ bài kiểm tra trắc nghiệm nào.',
    pointsReward: 200,
  },
  {
    id: 'badge_study_streak',
    code: 'DEDICATED_SCHOLAR',
    name: 'Học Giả Kiên Trì',
    titleEn: 'Dedicated Scholar',
    description: 'Tích lũy tối thiểu 120 phút học tập và nghiên cứu trên hệ thống KHOA HỌC SỐ KHTN.',
    icon: 'Clock',
    category: 'consistency',
    tier: 'gold',
    requiredCriteria: 'Tổng thời gian học tập tích lũy đạt từ 120 phút trở lên.',
    pointsReward: 150,
  },
];

export function checkBadgeCondition(
  badgeId: string,
  state: UserBadgeProgressState
): { isSatisfied: boolean; current: number; target: number } {
  switch (badgeId) {
    case 'badge_explorer': {
      const current = state.completedLessons.length;
      const target = 1;
      return { isSatisfied: current >= target, current: Math.min(current, target), target };
    }

    case 'badge_lab_pioneer': {
      const current = state.completedSimulations.length;
      const target = 2;
      return { isSatisfied: current >= target, current: Math.min(current, target), target };
    }

    case 'badge_water_master': {
      const hasMol =
        state.completedSimulations.includes('sim-water-molecule') ||
        state.completedSimulations.includes('sim-atom-bohr');
      return { isSatisfied: hasMol, current: hasMol ? 1 : 0, target: 1 };
    }

    case 'badge_physics_master': {
      const hasLesson = state.completedLessons.length >= 1;
      const scores = Object.values(state.quizScores);
      const hasHighPhysicsQuiz = scores.some((s) => {
        const normalized = s.total > 0 ? (s.score / s.total) * 10 : 0;
        return (s.domain === 'vat-li' || s.domain === undefined) && normalized >= 8.0;
      });
      const steps = (hasLesson ? 1 : 0) + (hasHighPhysicsQuiz ? 1 : 0);
      return { isSatisfied: steps === 2, current: steps, target: 2 };
    }

    case 'badge_quiz_champion': {
      const scores = Object.values(state.quizScores);
      let bestScore10 = 0;
      for (const s of scores) {
        const normalized = s.total > 0 ? (s.score / s.total) * 10 : 0;
        if (normalized > bestScore10) bestScore10 = normalized;
      }
      const rounded = Math.round(bestScore10 * 10) / 10;
      return {
        isSatisfied: rounded >= 10.0,
        current: Math.min(10, rounded),
        target: 10,
      };
    }

    case 'badge_study_streak': {
      const current = state.studyTimeMinutes;
      const target = 120;
      return { isSatisfied: current >= target, current: Math.min(current, target), target };
    }

    default:
      return { isSatisfied: false, current: 0, target: 1 };
  }
}

export function evaluateStudentBadges(
  state: UserBadgeProgressState,
  catalog: BadgeDefinition[] = SYSTEM_BADGES
): BadgeEvaluationResult {
  const newlyAwardedBadges: BadgeDefinition[] = [];
  const allProgress: Record<string, BadgeProgressInfo> = {};
  let totalPointsEarned = 0;

  const alreadyEarnedSet = new Set(state.earnedBadgeIds);

  for (const badge of catalog) {
    const cond = checkBadgeCondition(badge.id, state);
    const isEarned = alreadyEarnedSet.has(badge.id) || cond.isSatisfied;
    const progressPercent = isEarned
      ? 100
      : Math.min(99, Math.round((cond.current / Math.max(1, cond.target)) * 100));

    allProgress[badge.id] = {
      badgeId: badge.id,
      isEarned,
      current: cond.current,
      target: cond.target,
      progressPercent,
      progressLabel: isEarned ? 'Đã hoàn thành' : `${cond.current}/${cond.target}`,
    };

    if (isEarned) {
      totalPointsEarned += badge.pointsReward;
      if (!alreadyEarnedSet.has(badge.id)) {
        newlyAwardedBadges.push(badge);
      }
    }
  }

  return {
    newlyAwardedBadges,
    totalPointsEarned,
    allProgress,
  };
}
