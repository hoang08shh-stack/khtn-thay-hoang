import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { ServerGradingResult } from '../../utils/quizScoringEngine.ts';
import { ClientQuestion } from '../../services/quizService.ts';

interface QuizResultViewProps {
  quizTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  result: ServerGradingResult;
  questions: ClientQuestion[];
  onRetake: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  quizTitle,
  lessonId,
  lessonTitle,
  result,
  questions,
  onRetake,
}) => {
  useEffect(() => {
    if (result.passed && result.score >= 7.0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [result.passed, result.score]);

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs.toString().padStart(2, '0')} giây`;
  };

  const percentage = Math.round((result.score / result.max_score) * 100);

  // Performance classification
  const getRating = (score: number) => {
    if (score >= 9.0) return { title: 'Xuất sắc', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (score >= 8.0) return { title: 'Giỏi', color: 'text-teal-500', bg: 'bg-teal-500/10' };
    if (score >= 6.5) return { title: 'Khá', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (score >= 5.0) return { title: 'Trung bình', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { title: 'Cần ôn luyện thêm', color: 'text-rose-500', bg: 'bg-rose-500/10' };
  };

  const rating = getRating(result.score);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Score Banner Card */}
      <div className="bg-gradient-to-br from-[#0B1F3A] via-[#102A4E] to-[#152E52] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  result.passed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {result.passed ? '✓ ĐẠT CHUẨN GDPT 2018' : '✕ CHƯA ĐẠT (CẦN ÔN LẠI)'}
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Đã chấm điểm an toàn bởi Supabase RPC
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">{quizTitle}</h1>
            {lessonTitle && (
              <p className="text-xs sm:text-sm text-slate-300">Bài học: {lessonTitle}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Thời gian: {formatTime(result.time_spent_seconds)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Đúng: <strong>{result.correct_count}</strong> / {result.total_questions} câu
                </span>
              </div>
            </div>
          </div>

          {/* Big Score Badge */}
          <div className="flex items-center gap-4 bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-700/80 backdrop-blur-md shadow-2xl">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-teal-400 font-mono tracking-tight">
                {result.score.toFixed(1)}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold mt-1">
                Thang điểm 10.0
              </div>
            </div>

            <div className="w-px h-12 bg-slate-700" />

            <div className="space-y-1">
              <div className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${rating.bg} ${rating.color}`}>
                Xếp loại: {rating.title}
              </div>
              <div className="text-xs text-slate-300 font-medium">Tỉ lệ: {percentage}%</div>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-700/80 flex flex-wrap items-center gap-3">
          <button
            onClick={onRetake}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold flex items-center gap-2 border border-white/20 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại bài kiểm tra</span>
          </button>

          {lessonId && (
            <Link
              to={`/bai-hoc/${lessonId}`}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Xem bài giảng lý thuyết</span>
            </Link>
          )}

          <Link
            to="/tien-do"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Vào Bảng tiến độ học tập</span>
          </Link>
        </div>
      </div>

      {/* Question Review Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Chi tiết từng câu hỏi & Lời giải thích khoa học</span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              {result.details.length} câu
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Học sinh được xem lời giải chi tiết và đối chiếu đáp án sau khi nộp bài thành công.
          </p>
        </div>
      </div>

      {/* Question Cards Breakdown */}
      <div className="space-y-6">
        {result.details.map((detail, idx) => {
          const originalQ = questions.find((q) => q.id === detail.question_id);
          const optionsList = originalQ?.options || [];

          return (
            <div
              key={detail.question_id}
              className={`rounded-3xl border-2 p-6 sm:p-8 space-y-4 transition ${
                detail.is_correct
                  ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/60'
              }`}
            >
              {/* Question Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center ${
                      detail.is_correct
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {detail.question_type === 'multiple_choice'
                      ? 'Nhiều lựa chọn'
                      : detail.question_type === 'true_false'
                      ? 'Đúng / Sai'
                      : 'Một lựa chọn'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      detail.is_correct
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                    }`}
                  >
                    {detail.is_correct ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Chính xác (+{detail.points_earned}đ)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Chưa chính xác (0đ)</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Question Title */}
              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {detail.question_text}
              </h4>

              {/* Options Evaluation List */}
              <div className="space-y-2.5 pt-2">
                {optionsList.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isSelected = detail.selected_option_ids.includes(opt.id);
                  const isCorrect = detail.correct_option_ids.includes(opt.id);

                  let cardStyle =
                    'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                  let icon = null;

                  if (isCorrect && isSelected) {
                    // Correctly picked by student
                    cardStyle =
                      'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-medium';
                    icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
                  } else if (isCorrect && !isSelected) {
                    // Correct answer missed by student
                    cardStyle =
                      'bg-emerald-50/70 dark:bg-emerald-950/40 border-dashed border-emerald-400 text-emerald-900 dark:text-emerald-200 font-medium';
                    icon = (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                        Đáp án đúng
                      </span>
                    );
                  } else if (!isCorrect && isSelected) {
                    // Incorrect option picked by student
                    cardStyle =
                      'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-950 dark:text-rose-100';
                    icon = <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm ${cardStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {letter}
                        </span>
                        <span>{opt.option_text}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">{icon}</div>
                    </div>
                  );
                })}
              </div>

              {/* Scientific Explanation Box */}
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 text-xs sm:text-sm text-teal-950 dark:text-teal-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-teal-800 dark:text-teal-300">
                  <Sparkles className="w-4 h-4" />
                  <span>Giải thích khoa học của Thầy Hoàng:</span>
                </div>
                <p className="leading-relaxed pl-5">{detail.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
