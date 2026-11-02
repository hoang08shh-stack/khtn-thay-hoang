import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lesson } from '../../types/index.ts';
import { DOMAINS } from '../../data/mockData.ts';
import {
  Clock,
  Eye,
  Atom,
  ArrowRight,
  Bookmark,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { getInitialUser, getInitialProgress, saveUserProgress } from '../../lib/supabase.ts';

interface LessonCardProps {
  lesson: Lesson;
  className?: string;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, className = '' }) => {
  const domain = DOMAINS.find((d) => d.id === lesson.domain);
  const currentUser = getInitialUser();
  const [progress, setProgress] = useState(() =>
    currentUser ? getInitialProgress(currentUser.id) : null
  );

  const isBookmarked = progress?.bookmarkedLessons.includes(lesson.id) || false;
  const isCompleted = progress?.completedLessons.includes(lesson.id) || false;

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || !progress) return;

    const updated = {
      ...progress,
      bookmarkedLessons: isBookmarked
        ? progress.bookmarkedLessons.filter((id) => id !== lesson.id)
        : [...progress.bookmarkedLessons, lesson.id],
    };
    setProgress(updated);
    saveUserProgress(updated);
  };

  const fallbackThumb =
    lesson.domain === 'hoa-hoc'
      ? 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8b4?auto=format&fit=crop&w=800&q=80'
      : lesson.domain === 'vat-li'
      ? 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
      : lesson.domain === 'sinh-hoc'
      ? 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80';

  const thumbUrl = lesson.thumbnailUrl || fallbackThumb;

  return (
    <div
      className={`group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-slate-950/50 hover:border-teal-500/50 dark:hover:border-teal-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1 ${className}`}
    >
      <div>
        {/* 16:9 Aspect Ratio Thumbnail Image Container */}
        <div className="relative w-full aspect-video overflow-hidden bg-slate-950">
          <img
            src={thumbUrl}
            alt={lesson.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out brightness-[0.92] group-hover:brightness-100"
          />

          {/* Top Badges Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg text-white shadow-md shadow-black/30 backdrop-blur-md"
                style={{ backgroundColor: domain?.color || '#0D9488' }}
              >
                {domain?.shortName}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-white border border-white/10 shadow-md">
                Lớp {lesson.grade}
              </span>
            </div>

            {/* Bookmark button */}
            <button
              onClick={handleToggleBookmark}
              className={`p-2 rounded-xl backdrop-blur-md border transition pointer-events-auto active:scale-90 ${
                isBookmarked
                  ? 'bg-amber-500 text-white border-amber-400 shadow-lg'
                  : 'bg-slate-950/70 hover:bg-slate-900 text-white/80 hover:text-white border-white/15'
              }`}
              title={isBookmarked ? 'Bỏ lưu bài học' : 'Lưu bài học để xem lại'}
              aria-label={isBookmarked ? 'Bỏ lưu bài học' : 'Lưu bài học'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Bottom Gradient Overlay with 3D Simulation Pill or Status */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-3 pt-6 flex items-center justify-between text-white text-[11px] font-medium pointer-events-none">
            <div className="flex items-center gap-2">
              {lesson.simulationId ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/30 text-teal-300 border border-teal-400/40 font-mono font-semibold">
                  <Atom className="w-3 h-3 text-teal-300 animate-spin [animation-duration:8s]" />
                  <span>Có Lab 3D</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <BookOpen className="w-3 h-3 text-teal-400" />
                  <span>Lý thuyết GDPT</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-300 font-mono text-[10px]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {lesson.durationMinutes}p
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                {lesson.viewCount}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800">
              {lesson.code}
            </span>
            {isCompleted && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                ✓ Đã hoàn thành
              </span>
            )}
          </div>

          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 leading-snug">
            {lesson.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {lesson.summary}
          </p>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-5 pt-0 mt-1">
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {lesson.quizCount} câu củng cố
          </span>
          <Link
            to={`/bai-hoc/${lesson.id}`}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 flex items-center gap-1 transition-transform group-hover:translate-x-0.5"
          >
            <span>Vào bài học</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
