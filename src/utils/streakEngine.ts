/**
 * Daily Study Streak Engine
 * Pure logic for calculating, tracking, and visualizing consecutive learning days.
 * KHTN THẦY HOÀNG - GDPT 2018
 */

export interface DayActivity {
  date: string; // YYYY-MM-DD
  minutesStudied: number;
  lessonsCompleted: number;
  quizzesTaken: number;
  simulationsRun?: number;
  goalMet: boolean;
}

export type ActivityIntensity = 0 | 1 | 2 | 3;

export interface StreakMilestone {
  id: string;
  days: number;
  title: string;
  description: string;
  icon: string;
  rewardBadgeId?: string;
  achieved: boolean;
  progress: number; // 0 to 1
}

export interface WeekDayStatus {
  dayName: 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'CN';
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  minutesStudied: number;
  goalMet: boolean;
  status: 'completed' | 'in_progress' | 'missed' | 'upcoming';
  intensity: ActivityIntensity;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  totalMinutes: number;
  isTodayCompleted: boolean;
  todayMinutes: number;
  nextMilestone: StreakMilestone | null;
  milestones: StreakMilestone[];
  weeklyDays: WeekDayStatus[];
  heatMapDays: Array<{
    date: string;
    dayOfWeek: number; // 0-6
    minutes: number;
    intensity: ActivityIntensity;
    goalMet: boolean;
    isToday: boolean;
  }>;
}

export const STREAK_MILESTONES_CONFIG: Array<Omit<StreakMilestone, 'achieved' | 'progress'>> = [
  {
    id: 'streak-3',
    days: 3,
    title: 'Tập Sự Kiên Trì',
    description: 'Duy trì học tập liên tiếp 3 ngày',
    icon: '🌱',
  },
  {
    id: 'streak-7',
    days: 7,
    title: 'Tuần Lễ Vàng Khoa Học',
    description: 'Học đều đặn suốt 7 ngày trong tuần',
    icon: '🔥',
    rewardBadgeId: 'badge-dedicated-scholar',
  },
  {
    id: 'streak-14',
    days: 14,
    title: 'Chiến Binh KHTN',
    description: '14 ngày liên tục khám phá và làm chủ thí nghiệm',
    icon: '⚡',
  },
  {
    id: 'streak-30',
    days: 30,
    title: 'Bậc Thầy Bền Bỉ',
    description: '30 ngày học tập không ngừng nghỉ',
    icon: '👑',
  },
  {
    id: 'streak-60',
    days: 60,
    title: 'Huyền Thoại Khoa Học Số',
    description: '60 ngày chinh phục mọi chuyên đề KHTN THCS',
    icon: '🏆',
  },
];

/**
 * Calculates activity intensity from minutes studied
 * 0: 0 min
 * 1: 1 - 14 min (Light study)
 * 2: 15 - 29 min (Target met)
 * 3: >= 30 min (Super active)
 */
export function getIntensityLevel(minutes: number, goalMet: boolean): ActivityIntensity {
  if (minutes <= 0) return 0;
  if (minutes < 15 && !goalMet) return 1;
  if (minutes < 30) return 2;
  return 3;
}

/**
 * Parses YYYY-MM-DD into a local Date object without time zone shifting
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a Date object into YYYY-MM-DD
 */
export function formatDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Shifts date by N days
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateString(d);
}

/**
 * Calculate streak and historical metrics given an array of daily activities
 */
export function calculateStreakStats(
  activities: DayActivity[],
  todayDateStr: string,
  dailyTargetMinutes = 20
): StreakStats {
  const activityMap = new Map<string, DayActivity>();
  let totalMinutes = 0;
  let totalActiveDays = 0;

  activities.forEach((act) => {
    activityMap.set(act.date, act);
    totalMinutes += act.minutesStudied;
    if (act.minutesStudied > 0 || act.goalMet) {
      totalActiveDays++;
    }
  });

  const todayAct = activityMap.get(todayDateStr);
  const isTodayCompleted = !!todayAct && (todayAct.goalMet || todayAct.minutesStudied >= dailyTargetMinutes);
  const todayMinutes = todayAct ? todayAct.minutesStudied : 0;

  // 1. Calculate Current Streak
  // If today is completed, streak ends today.
  // If today is not completed yet, streak is active if yesterday was completed.
  // If yesterday was not completed either, streak is 0.
  let currentStreak = 0;
  const yesterdayDateStr = addDays(todayDateStr, -1);
  const yesterdayAct = activityMap.get(yesterdayDateStr);
  const wasYesterdayCompleted = !!yesterdayAct && (yesterdayAct.goalMet || yesterdayAct.minutesStudied >= dailyTargetMinutes);

  let checkDateStr = isTodayCompleted ? todayDateStr : wasYesterdayCompleted ? yesterdayDateStr : null;

  if (checkDateStr) {
    while (checkDateStr) {
      const act = activityMap.get(checkDateStr);
      const isMet = !!act && (act.goalMet || act.minutesStudied >= dailyTargetMinutes);
      if (isMet) {
        currentStreak++;
        checkDateStr = addDays(checkDateStr, -1);
      } else {
        break;
      }
    }
  }

  // 2. Calculate Longest Streak in historical record
  let longestStreak = currentStreak;
  const sortedDates = Array.from(activityMap.keys()).sort();
  let tempStreak = 0;
  let lastDate: string | null = null;

  for (const d of sortedDates) {
    const act = activityMap.get(d)!;
    const isMet = act.goalMet || act.minutesStudied >= dailyTargetMinutes;

    if (isMet) {
      if (lastDate && addDays(lastDate, 1) === d) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      lastDate = d;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
      lastDate = null;
    }
  }

  // 3. Compute Milestones
  const milestones: StreakMilestone[] = STREAK_MILESTONES_CONFIG.map((config) => {
    const achieved = currentStreak >= config.days;
    const progress = Math.min(1, Math.round((currentStreak / config.days) * 100) / 100);
    return {
      ...config,
      achieved,
      progress,
    };
  });

  const nextMilestone = milestones.find((m) => !m.achieved) || null;

  // 4. Generate Current Week View (Monday to Sunday)
  const todayDate = parseDateString(todayDateStr);
  // getDay: 0 is Sunday, 1 is Monday...
  const dayOfWeek = todayDate.getDay();
  // We want Monday = 0, Sunday = 6
  const normalizedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayDate = new Date(todayDate);
  mondayDate.setDate(todayDate.getDate() - normalizedDay);

  const dayNames: WeekDayStatus['dayName'][] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const weeklyDays: WeekDayStatus[] = [];

  for (let i = 0; i < 7; i++) {
    const currD = new Date(mondayDate);
    currD.setDate(mondayDate.getDate() + i);
    const dStr = formatDateString(currD);
    const act = activityMap.get(dStr);

    const isToday = dStr === todayDateStr;
    const isPast = dStr < todayDateStr;
    const isFuture = dStr > todayDateStr;

    const mins = act ? act.minutesStudied : 0;
    const goalMet = act ? act.goalMet || mins >= dailyTargetMinutes : false;
    const intensity = getIntensityLevel(mins, goalMet);

    let status: WeekDayStatus['status'] = 'upcoming';
    if (isToday) {
      status = goalMet ? 'completed' : 'in_progress';
    } else if (isPast) {
      status = goalMet ? 'completed' : 'missed';
    } else {
      status = 'upcoming';
    }

    weeklyDays.push({
      dayName: dayNames[i],
      date: dStr,
      dayNumber: currD.getDate(),
      isToday,
      isPast,
      isFuture,
      minutesStudied: mins,
      goalMet,
      status,
      intensity,
    });
  }

  // 5. Generate 28-35 days for Heatmap (past 4 weeks ending Sunday of this week)
  const heatMapDays: StreakStats['heatMapDays'] = [];
  const heatmapStartDate = new Date(mondayDate);
  heatmapStartDate.setDate(mondayDate.getDate() - 21); // 4 full weeks: 3 past weeks + current week

  for (let i = 0; i < 28; i++) {
    const d = new Date(heatmapStartDate);
    d.setDate(heatmapStartDate.getDate() + i);
    const dStr = formatDateString(d);
    const act = activityMap.get(dStr);
    const mins = act ? act.minutesStudied : 0;
    const isMet = act ? act.goalMet || mins >= dailyTargetMinutes : false;

    heatMapDays.push({
      date: dStr,
      dayOfWeek: d.getDay() === 0 ? 6 : d.getDay() - 1,
      minutes: mins,
      intensity: getIntensityLevel(mins, isMet),
      goalMet: isMet,
      isToday: dStr === todayDateStr,
    });
  }

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    totalMinutes,
    isTodayCompleted,
    todayMinutes,
    nextMilestone,
    milestones,
    weeklyDays,
    heatMapDays,
  };
}

/**
 * Generates realistic seed study history for demonstration and new users
 * Shows consistent learning over recent weeks with an active 4-day streak
 */
export function generateSeedStudyHistory(todayDateStr: string): DayActivity[] {
  const activities: DayActivity[] = [];
  const sampleData: Record<number, { mins: number; lessons: number; quizzes: number; met: boolean }> = {
    // 0: today (in-progress)
    0: { mins: 15, lessons: 1, quizzes: 0, met: false },
    // Past days (1-3 were completed to form the 4-day streak with 4th day 4 days ago)
    1: { mins: 25, lessons: 1, quizzes: 1, met: true },
    2: { mins: 30, lessons: 2, quizzes: 1, met: true },
    3: { mins: 20, lessons: 1, quizzes: 0, met: true },
    4: { mins: 0, lessons: 0, quizzes: 0, met: false }, // rest day
    5: { mins: 35, lessons: 2, quizzes: 2, met: true },
    6: { mins: 25, lessons: 1, quizzes: 1, met: true },
    7: { mins: 40, lessons: 2, quizzes: 1, met: true },
    8: { mins: 20, lessons: 1, quizzes: 0, met: true },
    9: { mins: 0, lessons: 0, quizzes: 0, met: false },
    10: { mins: 25, lessons: 1, quizzes: 1, met: true },
    11: { mins: 30, lessons: 2, quizzes: 1, met: true },
    12: { mins: 15, lessons: 1, quizzes: 0, met: true },
    13: { mins: 0, lessons: 0, quizzes: 0, met: false },
    14: { mins: 45, lessons: 3, quizzes: 2, met: true },
    15: { mins: 20, lessons: 1, quizzes: 1, met: true },
    16: { mins: 30, lessons: 2, quizzes: 0, met: true },
    17: { mins: 25, lessons: 1, quizzes: 1, met: true },
    18: { mins: 0, lessons: 0, quizzes: 0, met: false },
    19: { mins: 20, lessons: 1, quizzes: 1, met: true },
    20: { mins: 35, lessons: 2, quizzes: 1, met: true },
  };

  for (let offset = 21; offset >= 0; offset--) {
    const dStr = addDays(todayDateStr, -offset);
    const data = sampleData[offset] || { mins: 0, lessons: 0, quizzes: 0, met: false };
    activities.push({
      date: dStr,
      minutesStudied: data.mins,
      lessonsCompleted: data.lessons,
      quizzesTaken: data.quizzes,
      goalMet: data.met,
    });
  }

  return activities;
}
