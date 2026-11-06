import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { AppUser, UserProgress, Grade, SubjectDomain } from '../types/index.ts';
import { LESSONS, SIMULATIONS_3D } from '../data/mockData.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { TeacherAnalyticsView } from '../components/progress/TeacherAnalyticsView.tsx';
import { BadgeShowcase } from '../components/progress/BadgeShowcase.tsx';
import { DailyStreakVisualizer } from '../components/progress/DailyStreakVisualizer.tsx';
import { GlobalLeaderboard } from '../components/progress/GlobalLeaderboard.tsx';
import { useNotification } from '../context/NotificationContext.tsx';
import {
  BadgeDefinition,
  SYSTEM_BADGES,
  BadgeProgressInfo,
  UserBadgeProgressState,
  evaluateStudentBadges,
} from '../utils/badgeEngine.ts';
import {
  getBadgesCatalog,
  getUserEarnedBadges,
  checkAndAwardBadges,
} from '../services/badgeService.ts';
import {
  getStudentLessonProgress,
  toggleLessonCompletion,
  LessonProgressRecord,
} from '../services/progressService.ts';
import { getStudentQuizAttempts } from '../services/quizService.ts';
import { ServerGradingResult } from '../utils/quizScoringEngine.ts';
import {
  Award,
  BookOpen,
  Atom,
  Clock,
  CheckCircle2,
  XCircle,
  Bookmark,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Sparkles,
  History,
  CheckSquare,
  Square,
  ShieldCheck,
  BarChart3,
  ExternalLink,
  Flame,
  Trophy,
} from 'lucide-react';

interface StudentProgressPageProps {
  currentUser: AppUser | null;
  progress: UserProgress | null;
}

export const StudentProgressPage: React.FC<StudentProgressPageProps> = ({
  currentUser,
  progress: initialProgress,
}) => {
  const { dailyProgress } = useNotification();
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'lessons' | 'quizzes' | 'teacher'>('overview');
  const [lessonRecords, setLessonRecords] = useState<LessonProgressRecord[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<ServerGradingResult[]>([]);
  const [lessonGradeFilter, setLessonGradeFilter] = useState<Grade | 'all'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Badge System State
  const [badges, setBadges] = useState<BadgeDefinition[]>(SYSTEM_BADGES);
  const [earnedBadgesMap, setEarnedBadgesMap] = useState<Record<string, { earnedAt?: string }>>({});
  const [badgeProgressMap, setBadgeProgressMap] = useState<Record<string, BadgeProgressInfo>>({});
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<BadgeDefinition | null>(null);

  const userId = currentUser?.id || 'user_student_demo';
  const isTeacherOrAdmin = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  // Load progress, quiz attempts and badges
  useEffect(() => {
    let mounted = true;
    async function load() {
      const [lessons, attempts, catalog, userBadges] = await Promise.all([
        getStudentLessonProgress(userId),
        getStudentQuizAttempts(userId),
        getBadgesCatalog(),
        getUserEarnedBadges(userId),
      ]);

      if (mounted) {
        setLessonRecords(lessons);
        setQuizAttempts(attempts);
        setBadges(catalog);

        const earnedMap: Record<string, { earnedAt?: string }> = {};
        userBadges.forEach((b) => {
          earnedMap[b.badgeId] = { earnedAt: b.earnedAt };
        });

        const completedLessonIds = lessons.filter((l) => l.completed).map((l) => l.lessonId);
        const quizScoresMap: Record<string, any> = {};
        attempts.forEach((a) => {
          quizScoresMap[a.quiz_id] = {
            score: a.score,
            total: a.max_score,
            domain: a.quiz_id.includes('circuit')
              ? 'vat-li'
              : a.quiz_id.includes('atom')
              ? 'hoa-hoc'
              : undefined,
          };
        });

        const progressState: UserBadgeProgressState = {
          userId,
          completedLessons: completedLessonIds,
          completedSimulations: initialProgress?.completedSimulations || [
            'sim-water-molecule',
            'sim-electric-circuit',
          ],
          quizScores: quizScoresMap,
          studyTimeMinutes: initialProgress?.studyTimeMinutes || 145,
          earnedBadgeIds: Object.keys(earnedMap),
        };

        const evalRes = evaluateStudentBadges(progressState, catalog);

        // Auto-award any new badges upon initial load
        if (evalRes.newlyAwardedBadges.length > 0) {
          checkAndAwardBadges(userId, progressState);
          evalRes.newlyAwardedBadges.forEach((b) => {
            earnedMap[b.id] = { earnedAt: new Date().toISOString() };
          });
        }

        setEarnedBadgesMap(earnedMap);
        setBadgeProgressMap(evalRes.allProgress);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Handle toggling lesson completion
  const handleToggleLesson = async (lessonId: string, currentCompleted: boolean) => {
    const nextState = !currentCompleted;
    const updatedLessons = lessonRecords.map((r) =>
      r.lessonId === lessonId ? { ...r, completed: nextState } : r
    );
    setLessonRecords(updatedLessons);

    const ok = await toggleLessonCompletion(userId, lessonId, nextState);
    if (ok) {
      showToast(
        nextState
          ? 'Đã đánh dấu hoàn thành bài học!'
          : 'Đã hủy đánh dấu hoàn thành bài học.'
      );

      // Re-evaluate badges dynamically
      const completedLessonIds = updatedLessons.filter((l) => l.completed).map((l) => l.lessonId);
      const quizScoresMap: Record<string, any> = {};
      quizAttempts.forEach((a) => {
        quizScoresMap[a.quiz_id] = {
          score: a.score,
          total: a.max_score,
          domain: a.quiz_id.includes('circuit') ? 'vat-li' : a.quiz_id.includes('atom') ? 'hoa-hoc' : undefined,
        };
      });

      const progressState: UserBadgeProgressState = {
        userId,
        completedLessons: completedLessonIds,
        completedSimulations: initialProgress?.completedSimulations || [
          'sim-water-molecule',
          'sim-electric-circuit',
        ],
        quizScores: quizScoresMap,
        studyTimeMinutes: initialProgress?.studyTimeMinutes || 145,
        earnedBadgeIds: Object.keys(earnedBadgesMap),
      };

      const awardResult = await checkAndAwardBadges(userId, progressState);
      if (awardResult.newlyAwarded.length > 0) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        const firstNew = awardResult.newlyAwarded[0];
        setNewlyUnlockedBadge(firstNew);
        setEarnedBadgesMap((prev) => {
          const next = { ...prev };
          awardResult.newlyAwarded.forEach((b) => {
            next[b.id] = { earnedAt: new Date().toISOString() };
          });
          return next;
        });
        showToast(`🎉 Chúc mừng! Bạn vừa mở khóa huy hiệu: ${firstNew.name} (${firstNew.titleEn})`);
      }
      setBadgeProgressMap(awardResult.allProgress);
    }
  };

  // Compute metrics
  const completedCount = lessonRecords.filter((r) => r.completed).length;
  const totalLessons = LESSONS.length;
  const completionPercent = Math.round((completedCount / (totalLessons || 1)) * 100);

  // Compute average quiz score
  const avgScore =
    quizAttempts.length > 0
      ? Math.round(
          (quizAttempts.reduce((acc, curr) => acc + curr.score, 0) / quizAttempts.length) * 10
        ) / 10
      : 8.5;

  const filteredLessons = lessonRecords.filter((l) => {
    if (lessonGradeFilter !== 'all' && l.grade !== lessonGradeFilter) return false;
    return true;
  });

  const domainNames: Record<SubjectDomain, string> = {
    'hoa-hoc': 'Hóa học',
    'vat-li': 'Vật lí',
    'sinh-hoc': 'Sinh học',
  };

  const earnedBadgeCount = Object.keys(earnedBadgesMap).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Sổ tay tự theo dõi tiến độ cá nhân (Riêng tư trên thiết bị)' }]} />

        {/* Anonymous Local Student Header Card (No Student Personal Data Displayed) */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#152E52] rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-teal-500 text-slate-950 font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              {isTeacherOrAdmin ? 'GV' : `K${currentUser?.grade || 8}`}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {isTeacherOrAdmin
                    ? 'Giáo viên Quản trị KHTN'
                    : `Sổ Tay Tự Học KHTN Khối ${currentUser?.grade || 8} (Chế Độ Ẩn Danh)`}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold">
                  {isTeacherOrAdmin
                    ? 'Quản trị viên'
                    : '🔒 Riêng tư trên thiết bị • Không cần tài khoản'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                {isTeacherOrAdmin
                  ? 'Quản lý học liệu và thống kê tổng hợp chương trình GDPT 2018'
                  : 'Hệ thống không thu thập họ tên, email hay trường lớp của học sinh • Không công khai điểm số cá nhân'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-current" />
                  {earnedBadgeCount} Huy hiệu tự rèn luyện
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-teal-300 font-medium">
                  Bảo vệ dữ liệu học sinh THCS & dưới 13 tuổi
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/luyen-tap"
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/30 transition hover:scale-105"
            >
              Làm bài luyện tập mới
            </Link>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white border border-teal-500 text-xs font-bold shadow-2xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* 4 Overview Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Bài học hoàn thành</span>
              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {completedCount} <span className="text-sm font-sans font-normal text-slate-400">/ {totalLessons}</span>
            </div>
            <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
              Đạt {completionPercent}% chương trình
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Mô phỏng 3D đã làm</span>
              <Atom className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {initialProgress?.completedSimulations.length || 2}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Thực hành tương tác</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Điểm trắc nghiệm TB</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {avgScore} <span className="text-sm font-sans font-normal text-slate-400">/ 10</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {quizAttempts.length} lượt kiểm tra
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Thời gian học</span>
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {initialProgress?.studyTimeMinutes || 145}{' '}
              <span className="text-sm font-sans font-normal text-slate-500 dark:text-slate-400">phút</span>
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Chăm chỉ mỗi ngày</div>
          </div>
        </div>

        {/* Daily Study Streak Visualizer (Engagement Driver) */}
        <DailyStreakVisualizer userId={userId} />

        {/* 5 Main Nav Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Huy hiệu năng lực ({earnedBadgeCount}/{badges.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Cột mốc năng lực cá nhân (Riêng tư)</span>
          </button>

          <button
            onClick={() => setActiveTab('lessons')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'lessons'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tiến độ từng bài học ({completedCount}/{totalLessons})</span>
          </button>

          <button
            onClick={() => setActiveTab('quizzes')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'quizzes'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử tự luyện trên thiết bị ({quizAttempts.length})</span>
          </button>

          {isTeacherOrAdmin && (
            <button
              onClick={() => setActiveTab('teacher')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === 'teacher'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span>Góc Giáo Viên (Thống Kê Chuyên Đề Ẩn Danh)</span>
            </button>
          )}
        </div>

        {/* TAB 1: BADGE SYSTEM SHOWCASE */}
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <BadgeShowcase
              badges={badges}
              earnedBadgesMap={earnedBadgesMap}
              progressMap={badgeProgressMap}
            />
          </div>
        )}

        {/* TAB: PERSONAL COMPETENCY MILESTONES (PRIVATE ON DEVICE) */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <GlobalLeaderboard
              currentUserId={userId}
              currentUserStats={{
                points: undefined,
                streak: dailyProgress?.streakDays ?? 4,
                minutes: initialProgress?.studyTimeMinutes ?? 145,
                grade: (currentUser?.grade as Grade) ?? 8,
                badgesCount: earnedBadgeCount,
              }}
            />
          </div>
        )}

        {/* TAB 2: LESSONS CHECKLIST (TOGGLE COMPLETION) */}
        {activeTab === 'lessons' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Danh Mục Bài Học & Trạng Thái Hoàn Thành
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Em có thể tự đánh dấu hoàn thành bài học sau khi đọc lý thuyết hoặc đạt điểm bài kiểm tra.
                </p>
              </div>

              {/* Grade Filter */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setLessonGradeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    lessonGradeFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Tất cả
                </button>
                {[6, 7, 8, 9].map((g) => (
                  <button
                    key={g}
                    onClick={() => setLessonGradeFilter(g as Grade)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      lessonGradeFilter === g
                        ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Lớp {g}
                  </button>
                ))}
              </div>
            </div>

            {/* List of lessons */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLessons.map((record) => (
                <div
                  key={record.lessonId}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-xl transition"
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => handleToggleLesson(record.lessonId, record.completed)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition border ${
                        record.completed
                          ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                          : 'border-slate-300 dark:border-slate-600 hover:border-teal-500'
                      }`}
                      title={record.completed ? 'Bấm để hủy hoàn thành' : 'Bấm để đánh dấu hoàn thành'}
                    >
                      {record.completed && <CheckCircle2 className="w-4 h-4 fill-current" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          Lớp {record.grade} • {record.lessonCode}
                        </span>
                        <span className="text-xs text-slate-400">
                          {domainNames[record.domain]}
                        </span>
                      </div>
                      <Link
                        to={`/bai-hoc/${record.lessonId}`}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition"
                      >
                        {record.lessonTitle}
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-9 sm:pl-0">
                    {record.quizScore !== undefined ? (
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Điểm thi: {record.quizScore}/10
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Chưa thi trắc nghiệm</span>
                    )}

                    <Link
                      to={`/bai-hoc/${record.lessonId}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
                    >
                      Học bài
                    </Link>
                    <Link
                      to={`/luyen-tap?lessonId=${record.lessonId}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 transition shadow-sm"
                    >
                      Thi
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: QUIZ ATTEMPTS HISTORY */}
        {activeTab === 'quizzes' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Lịch Sử Tự Luyện Trên Thiết Bị Cá Nhân ({quizAttempts.length} lượt làm bài)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toàn bộ kết quả tự luyện được chấm bằng thuật toán sư phạm nội bộ và chỉ lưu cục bộ trên trình duyệt thiết bị của em (tuyệt đối không công khai điểm số cá nhân).
              </p>
            </div>

            {quizAttempts.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <History className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
                <p className="text-xs text-slate-500">Chưa có lượt kiểm tra nào được ghi nhận.</p>
                <Link
                  to="/luyen-tap"
                  className="inline-block px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                >
                  Bắt đầu làm bài thi ngay
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {quizAttempts.map((attempt) => (
                  <div
                    key={attempt.attempt_id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            attempt.passed
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                          }`}
                        >
                          {attempt.passed ? 'ĐẠT CHUẨN' : 'CẦN CỐ GẮNG'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(attempt.completed_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Mã đề: {attempt.quiz_id}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Đúng: {attempt.correct_count}/{attempt.total_questions} câu • Thời gian làm bài:{' '}
                        {Math.floor(attempt.time_spent_seconds / 60)} phút {attempt.time_spent_seconds % 60} giây
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Điểm số</span>
                        <span
                          className={`text-xl font-extrabold font-mono ${
                            attempt.passed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {attempt.score.toFixed(1)}{' '}
                          <span className="text-xs font-normal text-slate-400">/ 10</span>
                        </span>
                      </div>
                      <Link
                        to={`/luyen-tap?quizId=${attempt.quiz_id}`}
                        className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-sm"
                      >
                        Làm lại
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TEACHER & ADMIN CLASS ANALYTICS */}
        {activeTab === 'teacher' && (
          <TeacherAnalyticsView initialGrade="all" />
        )}
      </div>
    </div>
  );
};
