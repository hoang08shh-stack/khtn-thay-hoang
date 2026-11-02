import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  Info,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import {
  DayActivity,
  StreakStats,
  calculateStreakStats,
  generateSeedStudyHistory,
  formatDateString,
  addDays,
} from '../../utils/streakEngine.ts';
import { useNotification } from '../../context/NotificationContext.tsx';

interface DailyStreakVisualizerProps {
  userId?: string;
  onNavigateToStudy?: () => void;
}

const LOCAL_STORAGE_STREAK_KEY = 'khtn_streak_history';

export const DailyStreakVisualizer: React.FC<DailyStreakVisualizerProps> = ({
  userId,
  onNavigateToStudy,
}) => {
  const { dailyProgress, dailyGoal, logStudyActivity } = useNotification();
  const todayStr = dailyProgress.date;

  // Load or initialize activities history from localStorage
  const [activities, setActivities] = useState<DayActivity[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_STREAK_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DayActivity[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return generateSeedStudyHistory(todayStr);
  });

  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    minutes: number;
    goalMet: boolean;
  } | null>(null);

  const [celebrateEffect, setCelebrateEffect] = useState(false);

  // Sync today's progress from NotificationContext into activities history
  useEffect(() => {
    setActivities((prev) => {
      const existingIdx = prev.findIndex((a) => a.date === todayStr);
      const isMet =
        dailyProgress.goalCompleted ||
        dailyProgress.minutesStudied >= dailyGoal.targetMinutes;

      const updatedToday: DayActivity = {
        date: todayStr,
        minutesStudied: dailyProgress.minutesStudied,
        lessonsCompleted: dailyProgress.lessonsCompletedToday.length,
        quizzesTaken: dailyProgress.quizzesTakenToday.length,
        simulationsRun: dailyProgress.simulationsCompletedToday.length,
        goalMet: isMet,
      };

      let nextActivities: DayActivity[];
      if (existingIdx >= 0) {
        nextActivities = [...prev];
        nextActivities[existingIdx] = updatedToday;
      } else {
        nextActivities = [...prev, updatedToday];
      }

      try {
        localStorage.setItem(LOCAL_STORAGE_STREAK_KEY, JSON.stringify(nextActivities));
      } catch {}

      return nextActivities;
    });
  }, [dailyProgress, dailyGoal.targetMinutes, todayStr]);

  const stats: StreakStats = calculateStreakStats(activities, todayStr, dailyGoal.targetMinutes);

  // Quick 1-click study log for testing / demonstration
  const handleQuickStudyLog = () => {
    logStudyActivity(15);
    setCelebrateEffect(true);
    confetti({
      particleCount: 90,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#F59E0B', '#10B981', '#06B6D4', '#6366F1'],
    });
    setTimeout(() => setCelebrateEffect(false), 2000);
  };

  const streakLevelColor =
    stats.currentStreak >= 14
      ? 'from-amber-500 via-orange-500 to-red-500'
      : stats.currentStreak >= 7
      ? 'from-amber-400 to-orange-500'
      : 'from-teal-400 to-emerald-500';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
      {/* 1. Header & Hero Streak Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1F3A] via-[#102A4E] to-[#0A192F] p-6 sm:p-8 text-white border border-slate-700/80 shadow-lg">
        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Flame Icon & Current Streak Counter */}
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 transform transition-transform group-hover:scale-105">
                <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-current animate-pulse" />
              </div>
              {stats.isTodayCompleted && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-slate-950 p-1 rounded-full border-2 border-[#0B1F3A]">
                  <CheckCircle2 className="w-4 h-4 text-white fill-current" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-mono">
                  {stats.currentStreak} <span className="text-xl sm:text-2xl font-sans font-bold text-amber-300">Ngày Liên Tiếp</span>
                </h2>
                {stats.isTodayCompleted ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                    Đã giữ chuỗi hôm nay
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold animate-pulse">
                    Chờ học hôm nay
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {stats.isTodayCompleted
                  ? `Xuất sắc! Em đã hoàn thành mục tiêu học tập hôm nay. Chuỗi học tập tiếp tục tăng lên!`
                  : `Học thêm ${Math.max(0, dailyGoal.targetMinutes - dailyProgress.minutesStudied)} phút nữa hôm nay để bảo vệ ngọn lửa chuỗi học tập của em!`}
              </p>

              {stats.nextMilestone && (
                <div className="flex items-center gap-2 pt-1 text-xs text-amber-300/90 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    Mục tiêu kế tiếp: <strong className="text-white">{stats.nextMilestone.title}</strong> (còn {stats.nextMilestone.days - stats.currentStreak} ngày nữa)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Button & Stats Pills */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3">
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold">Kỷ lục cao nhất</span>
                <span className="text-base font-extrabold text-white font-mono">
                  {stats.longestStreak} ngày
                </span>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold">Tổng ngày học</span>
                <span className="text-base font-extrabold text-teal-400 font-mono">
                  {stats.totalActiveDays} ngày
                </span>
              </div>
            </div>

            <button
              onClick={handleQuickStudyLog}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg ${
                stats.isTodayCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-orange-500/30'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{stats.isTodayCompleted ? 'Học thêm 15 phút (+15p)' : 'Điểm danh học hôm nay (+15p)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Current Week Tracker (7 Days) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-500" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Tiến Độ Tuần Này (Thứ 2 đến Chủ Nhật)
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Mục tiêu: {dailyGoal.targetMinutes} phút/ngày
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {stats.weeklyDays.map((day) => {
            const isCompleted = day.status === 'completed';
            const isInProgress = day.status === 'in_progress';
            const isMissed = day.status === 'missed';
            const isUpcoming = day.status === 'upcoming';

            return (
              <div
                key={day.date}
                onClick={() =>
                  setSelectedDay({
                    date: day.date,
                    minutes: day.minutesStudied,
                    goalMet: day.goalMet,
                  })
                }
                className={`relative cursor-pointer p-2.5 sm:p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-between gap-1.5 ${
                  day.isToday
                    ? 'ring-2 ring-amber-500 dark:ring-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
                    : isCompleted
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : isMissed
                    ? 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800/40'
                }`}
              >
                {/* Day Name */}
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    day.isToday
                      ? 'text-amber-600 dark:text-amber-400'
                      : isCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {day.dayName}
                </span>

                {/* Flame or Indicator Ring */}
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : isInProgress
                      ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-500 animate-pulse'
                      : isMissed
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 border border-dashed border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <Flame className="w-5 h-5 fill-current" />
                  ) : isInProgress ? (
                    <Clock className="w-5 h-5 text-amber-500" />
                  ) : (
                    <span className="text-xs font-bold font-mono">{day.dayNumber}</span>
                  )}
                </div>

                {/* Minutes badge */}
                <span className="text-[10px] font-medium font-mono text-slate-600 dark:text-slate-400">
                  {day.minutesStudied > 0 ? `${day.minutesStudied}p` : isUpcoming ? '—' : '0p'}
                </span>

                {day.isToday && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-amber-500 text-[9px] font-black text-slate-950 uppercase">
                    Hôm nay
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Monthly Activity Heatmap (28 Days) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Bản Đồ Hoạt Động 28 Ngày Gần Nhất
            </h3>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span>Ít</span>
            <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" title="0 phút" />
            <span className="w-3 h-3 rounded bg-teal-200 dark:bg-teal-950 border border-teal-300 dark:border-teal-800" title="1-14 phút" />
            <span className="w-3 h-3 rounded bg-teal-400 dark:bg-teal-700 border border-teal-500 dark:border-teal-600" title="15-29 phút" />
            <span className="w-3 h-3 rounded bg-emerald-500 dark:bg-emerald-500 shadow-sm" title="≥30 phút" />
            <span>Nhiều</span>
          </div>
        </div>

        {/* Heatmap Grid: 4 weeks x 7 days */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <div className="min-w-[420px] space-y-2">
            <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>CN</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {stats.heatMapDays.map((cell) => {
                let colorClass = 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-800';
                if (cell.intensity === 1) {
                  colorClass = 'bg-teal-200 dark:bg-teal-950 border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-200';
                } else if (cell.intensity === 2) {
                  colorClass = 'bg-teal-400 dark:bg-teal-700 border-teal-500 dark:border-teal-600 text-slate-950 font-bold';
                } else if (cell.intensity === 3) {
                  colorClass = 'bg-emerald-500 text-white font-extrabold shadow-sm shadow-emerald-500/20';
                }

                return (
                  <button
                    key={cell.date}
                    onClick={() =>
                      setSelectedDay({
                        date: cell.date,
                        minutes: cell.minutes,
                        goalMet: cell.goalMet,
                      })
                    }
                    className={`h-9 rounded-xl border flex flex-col items-center justify-center text-[10px] transition transform hover:scale-105 ${colorClass} ${
                      cell.isToday ? 'ring-2 ring-amber-500 font-black' : ''
                    }`}
                    title={`${cell.date}: ${cell.minutes} phút học ${cell.goalMet ? '(Đạt mục tiêu)' : ''}`}
                  >
                    <span>{cell.date.split('-')[2]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Day Details Popup/Banner */}
        {selectedDay && (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>
                Ngày <strong className="font-mono">{selectedDay.date}</strong>: đã học{' '}
                <strong className="text-teal-600 dark:text-teal-300 font-mono">{selectedDay.minutes} phút</strong>
                {selectedDay.goalMet ? ' (✅ Đã đạt chuẩn mục tiêu hằng ngày)' : ' (Chưa đạt mốc mục tiêu)'}
              </span>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 4. Streak Milestones Roadmap */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Cột Mốc Chuỗi Học Tập (Streak Milestones)
            </h3>
          </div>
          <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
            {stats.milestones.filter((m) => m.achieved).length} / {stats.milestones.length} Cột mốc đã đạt
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.milestones.map((m) => {
            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition flex items-start gap-3 ${
                  m.achieved
                    ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200 dark:border-amber-800/60 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-850/30 border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm ${
                    m.achieved
                      ? 'bg-amber-500/20 border border-amber-500/40'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  {m.icon}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {m.title}
                    </h4>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        m.achieved
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {m.days} ngày
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {m.description}
                  </p>

                  {/* Progress bar */}
                  <div className="pt-1.5 space-y-1">
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          m.achieved
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.round(m.progress * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>{Math.min(stats.currentStreak, m.days)} / {m.days} ngày</span>
                      <span>{Math.round(m.progress * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
