import React from 'react';
import {
  Trophy,
  Flame,
  Award,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  EyeOff,
  Target,
} from 'lucide-react';
import { Grade } from '../../types/index.ts';
import { calculateStudyPoints } from '../../utils/leaderboardEngine.ts';

interface GlobalLeaderboardProps {
  currentUserId: string;
  currentUserRawName?: string;
  currentUserStats?: {
    points?: number;
    streak?: number;
    minutes?: number;
    grade?: Grade;
    badgesCount?: number;
  };
}

interface CompetencyMilestone {
  id: string;
  level: string;
  title: string;
  requiredPoints: number;
  requiredMinutes: number;
  description: string;
  color: string;
}

const COMPETENCY_MILESTONES: CompetencyMilestone[] = [
  {
    id: 'milestone-1',
    level: 'Mức 1 • Làm Quen Khoa Học',
    title: 'Khởi Động Tư Duy Tự Học KHTN',
    requiredPoints: 200,
    requiredMinutes: 30,
    description: 'Hoàn thành các bài học mở đầu và làm quen với các mô hình trực quan 3D.',
    color: 'from-sky-500 to-teal-500',
  },
  {
    id: 'milestone-2',
    level: 'Mức 2 • Đạt Chuẩn GDPT 2018',
    title: 'Nắm Vững Kiến Thức Trọng Tâm & Danh Pháp IUPAC',
    requiredPoints: 600,
    requiredMinutes: 90,
    description: 'Nắm vững khái niệm cốt lõi Vật lí – Hóa học – Sinh học và đạt chuẩn bài tự kiểm tra.',
    color: 'from-teal-500 to-emerald-600',
  },
  {
    id: 'milestone-3',
    level: 'Mức 3 • Vận Dụng Thực Nghiệm',
    title: 'Thành Thạo Thí Nghiệm Ảo 3D & Giải Bài Tập Định Lượng',
    requiredPoints: 1000,
    requiredMinutes: 150,
    description: 'Vận dụng công thức tính toán, cân bằng phương trình hóa học và giải thích hiện tượng thực tiễn.',
    color: 'from-indigo-500 to-teal-600',
  },
  {
    id: 'milestone-4',
    level: 'Mức 4 • Vận Dụng Cao',
    title: 'Làm Chủ Phòng Thí Nghiệm Khoa Học Số KHTN',
    requiredPoints: 1600,
    requiredMinutes: 240,
    description: 'Hoàn thành xuất sắc chuỗi bài tập 4 dạng GDPT 2018 và duy trì thói quen tự học bền bỉ.',
    color: 'from-amber-500 to-teal-600',
  },
];

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  currentUserStats,
}) => {
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

  const nextMilestone =
    COMPETENCY_MILESTONES.find((m) => userPoints < m.requiredPoints) ||
    COMPETENCY_MILESTONES[COMPETENCY_MILESTONES.length - 1];

  const pointsToNext = Math.max(0, nextMilestone.requiredPoints - userPoints);

  return (
    <div className="space-y-6">
      {/* 1. Strict Privacy Protection Banner (No Public Ranking of Students) */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-3xl p-6 border border-teal-500/30 text-white space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-extrabold">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Bảo Mật Thành Tích Cá Nhân • Không Xếp Hạng Công Khai</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Cột Mốc Tự Rèn Luyện Năng Lực KHTN (Khối {userGrade})
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Tuân thủ quy định bảo vệ học sinh của nhà trường: Hệ thống{' '}
              <strong className="text-teal-200">
                tuyệt đối không hiển thị công khai thông tin cá nhân hay bảng xếp hạng thành tích của từng học sinh
              </strong>
              . Em chỉ tự đối chiếu tiến độ của chính mình trên thiết bị này với chuẩn năng lực chương trình GDPT 2018.
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center gap-3 shrink-0">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <div className="text-xs space-y-0.5">
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                Chế độ hiển thị
              </span>
              <span className="font-extrabold text-teal-300 block">
                🔒 Riêng tư 100% trên thiết bị
              </span>
              <span className="text-[11px] text-slate-400 block">
                Chỉ mình em xem được kết quả này
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Personal Self-Progress Summary Bar */}
      <div className="bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/15 border-2 border-teal-500/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                Mục tiêu tự rèn luyện tiếp theo:{' '}
                <strong className="text-teal-700 dark:text-teal-300">{nextMilestone.title}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold text-[10px]">
                Khối {userGrade}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {pointsToNext > 0 ? (
                <>
                  Em cần tích lũy thêm{' '}
                  <strong className="text-teal-700 dark:text-teal-300 font-mono">
                    {pointsToNext} điểm tự học
                  </strong>{' '}
                  trên thiết bị này để hoàn thành cột mốc tiếp theo.
                </>
              ) : (
                <>Chúc mừng! Em đã hoàn thành toàn bộ 4 cột mốc năng lực tự học KHTN!</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs font-mono shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-sans font-bold">
              Điểm tự rèn luyện
            </span>
            <span className="text-base font-extrabold text-teal-600 dark:text-teal-400">
              {userPoints.toLocaleString()} đ
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-sans font-bold">
              Chuỗi ngày học
            </span>
            <span className="text-base font-extrabold text-amber-500 flex items-center justify-end gap-1">
              <Flame className="w-4 h-4 fill-current" />
              {userStreak} ngày
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-sans font-bold">
              Huy hiệu
            </span>
            <span className="text-base font-extrabold text-purple-600 dark:text-purple-400 flex items-center justify-end gap-1">
              <Award className="w-4 h-4" />
              {userBadges}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Curriculum Competency Milestones Grid (Self-Benchmark Only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMPETENCY_MILESTONES.map((milestone) => {
          const unlocked = userPoints >= milestone.requiredPoints;
          const progressPct = Math.min(100, Math.round((userPoints / milestone.requiredPoints) * 100));

          return (
            <div
              key={milestone.id}
              className={`p-5 rounded-2xl border-2 transition flex flex-col justify-between gap-4 ${
                unlocked
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400/70 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white bg-gradient-to-r ${milestone.color}`}
                  >
                    {milestone.level}
                  </span>
                  {unlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      Đã đạt chuẩn
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                      Đang rèn luyện ({progressPct}%)
                    </span>
                  )}
                </div>

                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {milestone.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {milestone.description}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    Mốc điểm: {milestone.requiredPoints} đ
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    Thời lượng gợi ý: {milestone.requiredMinutes} phút
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${milestone.color} transition-all duration-500`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
