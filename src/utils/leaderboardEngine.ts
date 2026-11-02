/**
 * Global Leaderboard & Privacy-Safe Ranking Engine
 * KHTN THẦY HOÀNG - GDPT 2018
 */

import { Grade } from '../types/index.ts';

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  avatarSeed: string;
  avatarColor: string;
  grade: Grade;
  studyPoints: number;
  streakDays: number;
  studyTimeMinutes: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  badgesCount: number;
  isCurrentUser: boolean;
  schoolMoniker?: string; // e.g. "Hà Nội", "Đà Nẵng", "TP.HCM"
}

export type LeaderboardMetric = 'points' | 'streak' | 'time';
export type LeaderboardTimeframe = 'all' | 'month' | 'week';

export interface LeaderboardFilter {
  metric: LeaderboardMetric;
  grade: Grade | 'all';
  timeframe: LeaderboardTimeframe;
  searchQuery?: string;
}

export interface RankedLeaderboardEntry extends LeaderboardEntry {
  rank: number;
  badgeLevel: 'champion' | 'top3' | 'top10' | 'contender';
}

/**
 * Calculates total study points from multiple learning actions
 * - Lesson completed: 100 pts
 * - Quiz taken: 40 pts + (score * 10 pts)
 * - 3D Simulation explored: 80 pts
 * - Streak day bonus: 25 pts per consecutive day
 * - Study time: 2 pts per minute
 */
export function calculateStudyPoints(params: {
  lessonsCount: number;
  quizzesCount: number;
  avgQuizScore?: number;
  simulationsCount: number;
  streakDays: number;
  studyMinutes: number;
}): number {
  const lessonPts = params.lessonsCount * 100;
  const avgScore = params.avgQuizScore ?? 8.0;
  const quizPts = params.quizzesCount * (40 + Math.round(avgScore * 10));
  const simPts = params.simulationsCount * 80;
  const streakPts = params.streakDays * 25;
  const timePts = Math.round(params.studyMinutes * 2);

  return lessonPts + quizPts + simPts + streakPts + timePts;
}

/**
 * Anonymizes a student's full name to protect student privacy according to education privacy guidelines.
 * Example: "Nguyễn Văn Minh" -> "Minh N."
 * Example: "Trần Thị Ánh Dương" -> "Dương T."
 * If custom nickname provided, uses that.
 */
export function anonymizeStudentName(fullName: string, customNickname?: string): string {
  if (customNickname && customNickname.trim().length > 0) {
    return customNickname.trim();
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'Học viên KHTN';

  if (parts.length === 1) {
    return parts[0];
  }

  const givenName = parts[parts.length - 1]; // First name in Vietnamese (last word)
  const familyInitial = parts[0].charAt(0).toUpperCase();

  return `${givenName} ${familyInitial}.`;
}

/**
 * Generates an inspiring scientific title for student display
 */
export function getScientificMoniker(grade: Grade, rank: number): string {
  if (rank === 1) return 'Quán Quân KHTN Toàn Năng';
  if (rank === 2) return 'Nhà Thí Nghiệm Xuất Sắc';
  if (rank === 3) return 'Bậc Thầy Mô Phỏng 3D';
  if (rank <= 5) return 'Chiến Binh Khoa Học';

  const domainByGrade: Record<Grade, string> = {
    6: 'Nhà Thám Hiểm Tế Bào',
    7: 'Chuyên Gia Nguyên Tử & Phân Tử',
    8: 'Nhà Vật Lí Mạch Điện & Axit',
    9: 'Kĩ Sư Quang Học & Di Truyền',
  };

  return domainByGrade[grade] || 'Học Viên KHTN Tiên Phong';
}

/**
 * Sorts and filters students, assigning dynamic rank numbers with tie-breaking
 */
export function filterAndRankLeaderboard(
  entries: LeaderboardEntry[],
  filter: LeaderboardFilter
): RankedLeaderboardEntry[] {
  // 1. Grade filtering
  let filtered = entries.filter((e) => {
    if (filter.grade !== 'all' && e.grade !== filter.grade) {
      return false;
    }
    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.toLowerCase().trim();
      return e.displayName.toLowerCase().includes(q);
    }
    return true;
  });

  // 2. Sorting based on metric with consistent tie-breaking
  filtered.sort((a, b) => {
    if (filter.metric === 'points') {
      if (b.studyPoints !== a.studyPoints) {
        return b.studyPoints - a.studyPoints;
      }
      if (b.streakDays !== a.streakDays) {
        return b.streakDays - a.streakDays;
      }
      return b.studyTimeMinutes - a.studyTimeMinutes;
    }

    if (filter.metric === 'streak') {
      if (b.streakDays !== a.streakDays) {
        return b.streakDays - a.streakDays;
      }
      if (b.studyPoints !== a.studyPoints) {
        return b.studyPoints - a.studyPoints;
      }
      return b.studyTimeMinutes - a.studyTimeMinutes;
    }

    // filter.metric === 'time'
    if (b.studyTimeMinutes !== a.studyTimeMinutes) {
      return b.studyTimeMinutes - a.studyTimeMinutes;
    }
    if (b.studyPoints !== a.studyPoints) {
      return b.studyPoints - a.studyPoints;
    }
    return b.streakDays - a.streakDays;
  });

  // 3. Assign ranks and badge levels
  return filtered.map((entry, index) => {
    const rank = index + 1;
    let badgeLevel: RankedLeaderboardEntry['badgeLevel'] = 'contender';
    if (rank === 1) badgeLevel = 'champion';
    else if (rank <= 3) badgeLevel = 'top3';
    else if (rank <= 10) badgeLevel = 'top10';

    return {
      ...entry,
      rank,
      badgeLevel,
    };
  });
}

/**
 * Gets the current user's entry and distance to the next rank
 */
export function getCurrentUserRank(
  rankedEntries: RankedLeaderboardEntry[],
  currentUserId: string
): {
  userEntry: RankedLeaderboardEntry | null;
  rank: number;
  totalParticipants: number;
  pointsToNextRank: number;
  aheadEntry: RankedLeaderboardEntry | null;
} {
  const index = rankedEntries.findIndex((e) => e.id === currentUserId || e.isCurrentUser);
  if (index === -1) {
    return {
      userEntry: null,
      rank: 0,
      totalParticipants: rankedEntries.length,
      pointsToNextRank: 0,
      aheadEntry: null,
    };
  }

  const userEntry = rankedEntries[index];
  const aheadEntry = index > 0 ? rankedEntries[index - 1] : null;
  const pointsToNextRank = aheadEntry
    ? Math.max(1, aheadEntry.studyPoints - userEntry.studyPoints)
    : 0;

  return {
    userEntry,
    rank: userEntry.rank,
    totalParticipants: rankedEntries.length,
    pointsToNextRank,
    aheadEntry,
  };
}

/**
 * Generates realistic seed leaderboard data representing students across THCS grades 6-9,
 * ensuring strict privacy with anonymized display names and safe monikers.
 */
export function generateSeedLeaderboard(
  currentUserId: string,
  currentUserRawName: string,
  currentUserCustomNickname?: string,
  currentUserStats?: {
    points?: number;
    streak?: number;
    minutes?: number;
    grade?: Grade;
    badgesCount?: number;
  }
): LeaderboardEntry[] {
  const currentDisplayName = anonymizeStudentName(currentUserRawName, currentUserCustomNickname);
  const userStreak = currentUserStats?.streak ?? 4;
  const userMinutes = currentUserStats?.minutes ?? 145;
  const userGrade = currentUserStats?.grade ?? 8;
  const userBadges = currentUserStats?.badgesCount ?? 5;
  const userPoints =
    currentUserStats?.points ??
    calculateStudyPoints({
      lessonsCount: 2,
      quizzesCount: 1,
      avgQuizScore: 8.5,
      simulationsCount: 2,
      streakDays: userStreak,
      studyMinutes: userMinutes,
    });

  const samplePeers: Array<Omit<LeaderboardEntry, 'isCurrentUser'>> = [
    {
      id: 'peer-1',
      displayName: 'Hương L.',
      avatarSeed: 'HL',
      avatarColor: 'from-amber-400 to-amber-600',
      grade: 8,
      studyPoints: 2150,
      streakDays: 14,
      studyTimeMinutes: 320,
      lessonsCompleted: 8,
      quizzesTaken: 6,
      badgesCount: 7,
      schoolMoniker: 'Hà Nội',
    },
    {
      id: 'peer-2',
      displayName: 'Tuấn A.',
      avatarSeed: 'TA',
      avatarColor: 'from-teal-400 to-emerald-600',
      grade: 9,
      studyPoints: 1980,
      streakDays: 12,
      studyTimeMinutes: 290,
      lessonsCompleted: 7,
      quizzesTaken: 5,
      badgesCount: 6,
      schoolMoniker: 'TP.HCM',
    },
    {
      id: 'peer-3',
      displayName: 'Khánh V.',
      avatarSeed: 'KV',
      avatarColor: 'from-blue-400 to-indigo-600',
      grade: 7,
      studyPoints: 1820,
      streakDays: 9,
      studyTimeMinutes: 260,
      lessonsCompleted: 6,
      quizzesTaken: 5,
      badgesCount: 6,
      schoolMoniker: 'Đà Nẵng',
    },
    {
      id: 'peer-4',
      displayName: 'Bảo N.',
      avatarSeed: 'BN',
      avatarColor: 'from-purple-400 to-pink-600',
      grade: 8,
      studyPoints: 1460,
      streakDays: 6,
      studyTimeMinutes: 195,
      lessonsCompleted: 5,
      quizzesTaken: 4,
      badgesCount: 5,
      schoolMoniker: 'Hải Phòng',
    },
    {
      id: 'peer-5',
      displayName: 'Phương T.',
      avatarSeed: 'PT',
      avatarColor: 'from-rose-400 to-red-600',
      grade: 6,
      studyPoints: 1320,
      streakDays: 7,
      studyTimeMinutes: 180,
      lessonsCompleted: 4,
      quizzesTaken: 3,
      badgesCount: 4,
      schoolMoniker: 'Cần Thơ',
    },
    {
      id: 'peer-6',
      displayName: 'Đức M.',
      avatarSeed: 'DM',
      avatarColor: 'from-cyan-400 to-blue-600',
      grade: 9,
      studyPoints: 1190,
      streakDays: 5,
      studyTimeMinutes: 160,
      lessonsCompleted: 4,
      quizzesTaken: 3,
      badgesCount: 4,
      schoolMoniker: 'Huế',
    },
    {
      id: 'peer-7',
      displayName: 'Hà Q.',
      avatarSeed: 'HQ',
      avatarColor: 'from-emerald-400 to-teal-600',
      grade: 7,
      studyPoints: 1040,
      streakDays: 3,
      studyTimeMinutes: 135,
      lessonsCompleted: 3,
      quizzesTaken: 3,
      badgesCount: 3,
      schoolMoniker: 'Bắc Ninh',
    },
    {
      id: 'peer-8',
      displayName: 'An N.',
      avatarSeed: 'AN',
      avatarColor: 'from-amber-500 to-orange-600',
      grade: 6,
      studyPoints: 920,
      streakDays: 4,
      studyTimeMinutes: 120,
      lessonsCompleted: 3,
      quizzesTaken: 2,
      badgesCount: 3,
      schoolMoniker: 'Nam Định',
    },
    {
      id: 'peer-9',
      displayName: 'Long V.',
      avatarSeed: 'LV',
      avatarColor: 'from-violet-400 to-purple-600',
      grade: 8,
      studyPoints: 810,
      streakDays: 2,
      studyTimeMinutes: 110,
      lessonsCompleted: 2,
      quizzesTaken: 2,
      badgesCount: 2,
      schoolMoniker: 'Nghệ An',
    },
    {
      id: 'peer-10',
      displayName: 'Thảo M.',
      avatarSeed: 'TM',
      avatarColor: 'from-pink-400 to-rose-600',
      grade: 9,
      studyPoints: 720,
      streakDays: 3,
      studyTimeMinutes: 95,
      lessonsCompleted: 2,
      quizzesTaken: 1,
      badgesCount: 2,
      schoolMoniker: 'Quảng Ninh',
    },
  ];

  const currentStudentEntry: LeaderboardEntry = {
    id: currentUserId,
    displayName: currentDisplayName,
    avatarSeed: currentDisplayName.charAt(0).toUpperCase(),
    avatarColor: 'from-teal-500 to-cyan-600',
    grade: userGrade,
    studyPoints: userPoints,
    streakDays: userStreak,
    studyTimeMinutes: userMinutes,
    lessonsCompleted: 2,
    quizzesTaken: 1,
    badgesCount: userBadges,
    isCurrentUser: true,
    schoolMoniker: 'Hà Nội',
  };

  return [currentStudentEntry, ...samplePeers.map((p) => ({ ...p, isCurrentUser: false }))];
}
