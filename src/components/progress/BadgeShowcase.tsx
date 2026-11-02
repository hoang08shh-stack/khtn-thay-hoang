import React, { useState } from 'react';
import {
  Award,
  Sparkles,
  Zap,
  FlaskConical,
  Microscope,
  Compass,
  Clock,
  Droplets,
  CheckCircle2,
  Lock,
  ChevronRight,
  X,
  Flame,
  Info,
} from 'lucide-react';
import { BadgeDefinition, BadgeTier, BadgeCategory, BadgeProgressInfo } from '../../utils/badgeEngine.ts';

interface BadgeShowcaseProps {
  badges: BadgeDefinition[];
  earnedBadgesMap: Record<string, { earnedAt?: string }>;
  progressMap: Record<string, BadgeProgressInfo>;
  onSelectBadge?: (badge: BadgeDefinition) => void;
}

export const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({
  badges,
  earnedBadgesMap,
  progressMap,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalBadge, setActiveModalBadge] = useState<BadgeDefinition | null>(null);

  // Icon mapper
  const getBadgeIcon = (iconName: string, className = 'w-6 h-6') => {
    switch (iconName) {
      case 'Zap':
        return <Zap className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'FlaskConical':
        return <FlaskConical className={className} />;
      case 'Microscope':
        return <Microscope className={className} />;
      case 'Droplets':
        return <Droplets className={className} />;
      case 'Clock':
        return <Clock className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      case 'Award':
      default:
        return <Award className={className} />;
    }
  };

  // Tier color styling
  const getTierStyles = (tier: BadgeTier, isEarned: boolean) => {
    if (!isEarned) {
      return {
        cardBorder: 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-70 hover:opacity-100',
        iconBg: 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500',
        pill: 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
        pillText: 'Chưa mở khóa',
      };
    }

    switch (tier) {
      case 'diamond':
        return {
          cardBorder: 'border-sky-300 dark:border-sky-700/80 bg-gradient-to-br from-sky-50/80 to-indigo-50/40 dark:from-sky-950/30 dark:to-indigo-950/20 shadow-md shadow-sky-500/10',
          iconBg: 'bg-gradient-to-tr from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/30',
          pill: 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700',
          pillText: 'Kim Cương',
        };
      case 'gold':
        return {
          cardBorder: 'border-amber-300 dark:border-amber-700/80 bg-gradient-to-br from-amber-50/80 to-yellow-50/40 dark:from-amber-950/30 dark:to-yellow-950/20 shadow-md shadow-amber-500/10',
          iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-lg shadow-amber-500/30',
          pill: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700',
          pillText: 'Vàng Hoàng Gia',
        };
      case 'silver':
        return {
          cardBorder: 'border-slate-300 dark:border-slate-600 bg-gradient-to-br from-slate-100/80 to-slate-50/40 dark:from-slate-800/40 dark:to-slate-900/30 shadow-sm',
          iconBg: 'bg-gradient-to-tr from-slate-400 to-slate-300 text-slate-900 shadow-md',
          pill: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600',
          pillText: 'Bạc Danh Dự',
        };
      case 'bronze':
      default:
        return {
          cardBorder: 'border-orange-200 dark:border-orange-900/60 bg-gradient-to-br from-orange-50/60 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10 shadow-sm',
          iconBg: 'bg-gradient-to-tr from-orange-600 to-amber-600 text-white shadow-md',
          pill: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800',
          pillText: 'Đồng Khởi Điểm',
        };
    }
  };

  const categories = [
    { id: 'all', label: 'Tất cả huy hiệu' },
    { id: 'simulation', label: 'Thí nghiệm 3D' },
    { id: 'physics', label: 'Vật lí' },
    { id: 'chemistry', label: 'Hóa học' },
    { id: 'biology', label: 'Sinh học' },
    { id: 'quiz', label: 'Trắc nghiệm' },
  ];

  const filteredBadges = badges.filter((b) => {
    if (selectedCategory === 'all') return true;
    return b.category === selectedCategory;
  });

  const earnedCount = badges.filter((b) => Boolean(earnedBadgesMap[b.id])).length;
  const totalPoints = badges
    .filter((b) => Boolean(earnedBadgesMap[b.id]))
    .reduce((acc, b) => acc + b.pointsReward, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-teal-900/30 via-slate-900/50 to-indigo-900/30 border border-teal-500/30 backdrop-blur-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Hệ Thống Huy Hiệu Năng Lực KHTN</span>
              <span className="text-xs font-normal text-teal-300 px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40">
                GDPT 2018
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Chinh phục các danh hiệu danh giá như <strong>Master of Physics</strong>, <strong>Lab Pioneer</strong> khi học tập và thực hành.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Đã mở khóa</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {earnedCount} <span className="text-xs text-slate-400 font-normal">/ {badges.length}</span>
            </span>
          </div>
          <div className="h-8 w-px bg-slate-700/80" />
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Điểm thưởng</span>
            <span className="text-lg font-black text-teal-400 font-mono">
              +{totalPoints} <span className="text-xs text-slate-400 font-normal">pts</span>
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === c.id
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-500/50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const isEarned = Boolean(earnedBadgesMap[badge.id]);
          const tierStyle = getTierStyles(badge.tier, isEarned);
          const progress = progressMap[badge.id] || {
            progressPercent: isEarned ? 100 : 0,
            progressLabel: 'Chưa bắt đầu',
          };

          return (
            <div
              key={badge.id}
              onClick={() => setActiveModalBadge(badge)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between hover:scale-[1.01] hover:shadow-lg ${tierStyle.cardBorder}`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6 ${tierStyle.iconBg}`}>
                  {getBadgeIcon(badge.icon, 'w-6 h-6')}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierStyle.pill}`}>
                      {tierStyle.pillText}
                    </span>
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                      +{badge.pointsReward} đ
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1 flex items-center gap-1.5">
                    <span>{badge.name}</span>
                    {isEarned && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 fill-current" />
                    )}
                  </h4>

                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 italic block">
                    {badge.titleEn}
                  </span>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">
                    {isEarned ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành xuất sắc
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Lock className="w-3 h-3" /> {progress.progressLabel}
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {progress.progressPercent}%
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isEarned
                        ? 'bg-emerald-500'
                        : badge.tier === 'diamond'
                        ? 'bg-sky-500'
                        : badge.tier === 'gold'
                        ? 'bg-amber-500'
                        : 'bg-teal-500'
                    }`}
                    style={{ width: `${progress.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {activeModalBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setActiveModalBadge(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Emblem Header */}
            {(() => {
              const isEarned = Boolean(earnedBadgesMap[activeModalBadge.id]);
              const tierStyle = getTierStyles(activeModalBadge.tier, isEarned);
              const progress = progressMap[activeModalBadge.id] || {
                progressPercent: isEarned ? 100 : 0,
                progressLabel: 'Chưa hoàn thành',
              };

              return (
                <div className="space-y-4">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${tierStyle.iconBg} shadow-xl`}>
                      {getBadgeIcon(activeModalBadge.icon, 'w-10 h-10')}
                    </div>
                    <div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${tierStyle.pill}`}>
                        {tierStyle.pillText} • +{activeModalBadge.pointsReward} điểm
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                        {activeModalBadge.name}
                      </h3>
                      <p className="text-xs font-mono text-teal-600 dark:text-teal-400 italic">
                        "{activeModalBadge.titleEn}"
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-center leading-relaxed">
                    {activeModalBadge.description}
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <Info className="w-4 h-4 text-teal-500" />
                      <span>Điều kiện đạt chuẩn GDPT 2018:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 pl-5">
                      {activeModalBadge.requiredCriteria}
                    </p>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500 dark:text-slate-400">Tiến độ hiện tại:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                          {progress.progressLabel} ({progress.progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all"
                          style={{ width: `${progress.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-center">
                    <button
                      onClick={() => setActiveModalBadge(null)}
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition shadow-md shadow-teal-600/20"
                    >
                      Đã hiểu
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
