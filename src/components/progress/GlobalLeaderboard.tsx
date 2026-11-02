import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Medal,
  Award,
  Crown,
  Search,
  Filter,
  ShieldCheck,
  Edit3,
  Check,
  X,
  Sparkles,
  Clock,
  BookOpen,
  ArrowUp,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { Grade } from '../../types/index.ts';
import {
  LeaderboardEntry,
  RankedLeaderboardEntry,
  LeaderboardFilter,
  LeaderboardMetric,
  filterAndRankLeaderboard,
  getCurrentUserRank,
  generateSeedLeaderboard,
  anonymizeStudentName,
  getScientificMoniker,
} from '../../utils/leaderboardEngine.ts';

interface GlobalLeaderboardProps {
  currentUserId: string;
  currentUserRawName: string;
  currentUserStats?: {
    points?: number;
    streak?: number;
    minutes?: number;
    grade?: Grade;
    badgesCount?: number;
  };
}

const LOCAL_STORAGE_NICKNAME_KEY = 'khtn_student_display_name';

const SUGGESTED_NICKNAMES = [
  '🧪 Nhà Hóa Học Tương Lai',
  '⚡ Kĩ Sư Mạch Điện KHTN',
  '🔬 Chuyên Gia Tế Bào',
  '🔭 Nhà Thiên Văn Nhí',
  '🌟 Thám Hiểm Gia Khoa Học',
];

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  currentUserId,
  currentUserRawName,
  currentUserStats,
}) => {
  // Load or save custom display nickname
  const [customNickname, setCustomNickname] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_NICKNAME_KEY);
      if (saved) return saved;
    } catch {}
    return '';
  });

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(customNickname);

  // Filter state
  const [selectedMetric, setSelectedMetric] = useState<LeaderboardMetric>('points');
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Save nickname
  const handleSaveNickname = (name: string) => {
    const trimmed = name.trim();
    setCustomNickname(trimmed);
    setNicknameInput(trimmed);
    setIsEditingNickname(false);
    try {
      if (trimmed) {
        localStorage.setItem(LOCAL_STORAGE_NICKNAME_KEY, trimmed);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_NICKNAME_KEY);
      }
    } catch {}
  };

  // Generate or update raw leaderboard entries
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => {
    return generateSeedLeaderboard(
      currentUserId,
      currentUserRawName,
      customNickname,
      currentUserStats
    );
  });

  // Re-generate entries whenever stats or nickname changes
  useEffect(() => {
    setEntries(
      generateSeedLeaderboard(
        currentUserId,
        currentUserRawName,
        customNickname,
        currentUserStats
      )
    );
  }, [currentUserId, currentUserRawName, customNickname, currentUserStats]);

  const filter: LeaderboardFilter = {
    metric: selectedMetric,
    grade: selectedGrade,
    timeframe: 'all',
    searchQuery,
  };

  const rankedEntries = filterAndRankLeaderboard(entries, filter);
  const userRankInfo = getCurrentUserRank(rankedEntries, currentUserId);

  // Top 3 Podium
  const top1 = rankedEntries.find((e) => e.rank === 1);
  const top2 = rankedEntries.find((e) => e.rank === 2);
  const top3 = rankedEntries.find((e) => e.rank === 3);
  const remainingEntries = rankedEntries.filter((e) => e.rank > 3);

  return (
    <div className="space-y-6">
      {/* 1. Header & Privacy Protection Banner */}
      <div className="bg-gradient-to-r from-teal-900/40 via-slate-900 to-indigo-950/40 rounded-3xl p-6 border border-teal-500/30 text-white space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Bảng Vinh Danh KHTN Toàn Hệ Thống
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Thi đua học tập tích cực, rèn luyện tư duy khoa học và giữ vững chuỗi ngày kiên trì.
            </p>
          </div>

          {/* Privacy Moniker Tag & Editor */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                  Biệt danh hiển thị của bạn
                </span>
                <span className="font-bold text-teal-300">
                  {anonymizeStudentName(currentUserRawName, customNickname)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setNicknameInput(customNickname);
                setIsEditingNickname(!isEditingNickname);
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500/40 text-teal-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingNickname ? 'Hủy' : 'Đổi biệt danh'}</span>
            </button>
          </div>
        </div>

        {/* Inline Nickname Editor Modal/Drawer */}
        {isEditingNickname && (
          <div className="p-4 bg-slate-850 rounded-2xl border border-teal-500/50 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-300">
                🔒 Tùy chỉnh Biệt danh riêng tư (Không hiển thị tên thật)
              </span>
              <button
                onClick={() => setIsEditingNickname(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Nhập biệt danh yêu thích (ví dụ: Nhà Vật Lí Nhí)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                maxLength={30}
              />
              <button
                onClick={() => handleSaveNickname(nicknameInput)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-md shadow-teal-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu</span>
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Gợi ý nhanh:</span>
              {SUGGESTED_NICKNAMES.map((name) => (
                <button
                  key={name}
                  onClick={() => handleSaveNickname(name)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-teal-300 border border-slate-700 transition"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Current User Standing Sticky Bar */}
      {userRankInfo.userEntry && (
        <div className="bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-teal-500/15 border-2 border-teal-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-md shadow-teal-500/30">
              #{userRankInfo.rank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Vị trí của bạn: <strong className="text-teal-600 dark:text-teal-400">Hạng #{userRankInfo.rank}</strong> trên {userRankInfo.totalParticipants} bạn học
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold text-[10px]">
                  Khối {userRankInfo.userEntry.grade}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {userRankInfo.aheadEntry ? (
                  <>
                    Chỉ còn <strong className="text-amber-500 font-mono">{userRankInfo.pointsToNextRank} điểm</strong> nữa để vượt qua bạn xếp trên (<span className="text-slate-700 dark:text-slate-300 font-medium">{userRankInfo.aheadEntry.displayName}</span>)!
                  </>
                ) : (
                  <>🎉 Xuất sắc! Bạn đang dẫn đầu bảng xếp hạng!</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Điểm tích lũy</span>
              <span className="text-base font-extrabold text-teal-600 dark:text-teal-400">
                {userRankInfo.userEntry.studyPoints.toLocaleString()} đ
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Chuỗi ngày</span>
              <span className="text-base font-extrabold text-amber-500 flex items-center gap-1">
                <Flame className="w-4 h-4 fill-current" />
                {userRankInfo.userEntry.streakDays}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Metric Selection & Grade Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Metric Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
          <button
            onClick={() => setSelectedMetric('points')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              selectedMetric === 'points'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Tổng điểm rèn luyện</span>
          </button>

          <button
            onClick={() => setSelectedMetric('streak')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              selectedMetric === 'streak'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-500 fill-current" />
            <span>Chuỗi ngày liên tục</span>
          </button>

          <button
            onClick={() => setSelectedMetric('time')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              selectedMetric === 'time'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-purple-500" />
            <span>Thời gian học</span>
          </button>
        </div>

        {/* Grade Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Grade Selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedGrade('all')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                selectedGrade === 'all'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Toàn trường
            </button>
            {[6, 7, 8, 9].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g as Grade)}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  selectedGrade === g
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Lớp {g}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bạn học..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-400 w-32 sm:w-40"
            />
          </div>
        </div>
      </div>

      {/* 4. Top 3 Podium (Only when at least 3 entries exist) */}
      {rankedEntries.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 pb-2 items-end max-w-2xl mx-auto">
          {/* Rank 2 (Silver) */}
          {top2 && (
            <div className="flex flex-col items-center space-y-2 order-1">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 dark:from-slate-600 dark:to-slate-400 p-0.5 shadow-lg flex items-center justify-center text-slate-900 font-black text-xl">
                  {top2.avatarSeed}
                </div>
                <div className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white font-mono font-bold text-xs flex items-center justify-center border-2 border-white dark:border-slate-900 shadow">
                  2
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {top2.displayName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Khối {top2.grade}
                </span>
                <div className="pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-extrabold text-[11px]">
                    {selectedMetric === 'points'
                      ? `${top2.studyPoints.toLocaleString()} đ`
                      : selectedMetric === 'streak'
                      ? `🔥 ${top2.streakDays} ngày`
                      : `${top2.studyTimeMinutes}p`}
                  </span>
                </div>
              </div>

              {/* Podium base */}
              <div className="w-full h-20 rounded-t-2xl bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700/60 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 text-xl">
                🥈
              </div>
            </div>
          )}

          {/* Rank 1 (Gold - Champion) */}
          {top1 && (
            <div className="flex flex-col items-center space-y-2 order-2">
              <div className="relative">
                <Crown className="w-7 h-7 text-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce-short" />
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center text-slate-950 font-black text-2xl">
                  {top1.avatarSeed}
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono font-black text-[10px] shadow">
                  TOP 1
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <span className="text-xs sm:text-base font-black text-slate-900 dark:text-white line-clamp-1">
                  {top1.displayName}
                </span>
                <span className="text-[10px] text-amber-500 font-bold block">
                  {getScientificMoniker(top1.grade, 1)}
                </span>
                <div className="pt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 font-mono font-black text-xs">
                    {selectedMetric === 'points'
                      ? `${top1.studyPoints.toLocaleString()} đ`
                      : selectedMetric === 'streak'
                      ? `🔥 ${top1.streakDays} ngày`
                      : `${top1.studyTimeMinutes}p`}
                  </span>
                </div>
              </div>

              {/* Podium base */}
              <div className="w-full h-28 rounded-t-2xl bg-gradient-to-t from-amber-200 via-amber-100 to-amber-50 dark:from-amber-950/40 dark:via-amber-900/30 dark:to-slate-800 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center font-black text-amber-500 text-2xl shadow-lg">
                🥇
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3 && (
            <div className="flex flex-col items-center space-y-2 order-3">
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 p-0.5 shadow-lg flex items-center justify-center text-white font-black text-xl">
                  {top3.avatarSeed}
                </div>
                <div className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-mono font-bold text-xs flex items-center justify-center border-2 border-white dark:border-slate-900 shadow">
                  3
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {top3.displayName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Khối {top3.grade}
                </span>
                <div className="pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono font-extrabold text-[11px]">
                    {selectedMetric === 'points'
                      ? `${top3.studyPoints.toLocaleString()} đ`
                      : selectedMetric === 'streak'
                      ? `🔥 ${top3.streakDays} ngày`
                      : `${top3.studyTimeMinutes}p`}
                  </span>
                </div>
              </div>

              {/* Podium base */}
              <div className="w-full h-16 rounded-t-2xl bg-gradient-to-t from-amber-100 to-slate-100 dark:from-amber-950/20 dark:to-slate-800 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center font-black text-amber-700 dark:text-amber-500 text-xl">
                🥉
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Ranked Table List (#4 onwards or all if search) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(searchQuery ? rankedEntries : remainingEntries).map((entry) => {
            const isMe = entry.isCurrentUser;

            return (
              <div
                key={entry.id}
                className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition ${
                  isMe
                    ? 'bg-teal-50/80 dark:bg-teal-950/30 border-l-4 border-teal-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Left: Rank & Avatar & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 text-center font-mono font-black text-xs sm:text-sm ${
                      entry.rank <= 3
                        ? 'text-amber-500'
                        : entry.rank <= 10
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-slate-400'
                    }`}
                  >
                    #{entry.rank}
                  </div>

                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${entry.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    {entry.avatarSeed}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {entry.displayName}
                      </span>
                      {isMe && (
                        <span className="px-1.5 py-0.2 rounded bg-teal-500 text-slate-950 font-black text-[9px] uppercase">
                          Bạn
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                        Lớp {entry.grade}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {getScientificMoniker(entry.grade, entry.rank)}
                      {entry.schoolMoniker ? ` • ${entry.schoolMoniker}` : ''}
                    </span>
                  </div>
                </div>

                {/* Right: Metrics & Badges */}
                <div className="flex items-center gap-3 sm:gap-6 font-mono text-xs shrink-0">
                  <div className="hidden sm:flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    <span>{entry.badgesCount} huy hiệu</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{entry.streakDays}n</span>
                  </div>

                  <div className="w-20 sm:w-24 text-right">
                    <span className="font-extrabold text-teal-600 dark:text-teal-400 text-xs sm:text-sm block">
                      {selectedMetric === 'points'
                        ? `${entry.studyPoints.toLocaleString()} đ`
                        : selectedMetric === 'streak'
                        ? `${entry.streakDays} ngày`
                        : `${entry.studyTimeMinutes} phút`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {rankedEntries.length === 0 && (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
              <p className="text-xs sm:text-sm">Không tìm thấy bạn học nào phù hợp với bộ lọc hiện tại.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
