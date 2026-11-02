import React, { useState, useEffect } from 'react';
import {
  Timer,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Send,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { ClientQuestion, QuizSubmissionItem } from '../../services/quizService.ts';
import { QuestionType } from '../../utils/quizScoringEngine.ts';

interface QuizPlayerProps {
  quizTitle: string;
  lessonTitle?: string;
  durationMinutes: number;
  passScore: number;
  questions: ClientQuestion[];
  isSubmitting: boolean;
  onSubmit: (answers: QuizSubmissionItem[], timeSpentSeconds: number) => void;
  onCancel?: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quizTitle,
  lessonTitle,
  durationMinutes,
  passScore,
  questions,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, { single?: string; multi?: string[] }>
  >({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const currentAnswers = selectedAnswers[currentQ.id] || {};

  // Format time MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if a question has been answered
  const isQuestionAnswered = (qId: string) => {
    const ans = selectedAnswers[qId];
    if (!ans) return false;
    if (ans.single) return true;
    if (Array.isArray(ans.multi) && ans.multi.length > 0) return true;
    return false;
  };

  const answeredCount = questions.filter((q) => isQuestionAnswered(q.id)).length;
  const isAllAnswered = answeredCount === questions.length;

  // Handle single choice and true/false selection
  const handleSelectSingle = (optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: { single: optionId },
    }));
  };

  // Handle multiple choice selection (toggle in array)
  const handleToggleMulti = (optionId: string) => {
    const currentList = currentAnswers.multi || [];
    const exists = currentList.includes(optionId);
    const updated = exists
      ? currentList.filter((id) => id !== optionId)
      : [...currentList, optionId];

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: { multi: updated },
    }));
  };

  // Collect answers and trigger submission
  const handleFinalSubmit = () => {
    setShowConfirmModal(false);
    const submissionPayload: QuizSubmissionItem[] = questions.map((q) => {
      const ans = selectedAnswers[q.id] || {};
      if (q.question_type === 'multiple_choice') {
        return {
          question_id: q.id,
          selected_option_ids: ans.multi || [],
        };
      }
      return {
        question_id: q.id,
        selected_option_id: ans.single || null,
      };
    });

    onSubmit(submissionPayload, timerSeconds);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold">
              GDPT 2018
            </span>
            {lessonTitle && (
              <span className="text-xs text-slate-400 truncate max-w-xs">{lessonTitle}</span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white mt-1">{quizTitle}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Display */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-teal-400 font-mono text-sm font-bold shadow-inner">
            <Timer className="w-4 h-4 text-teal-400 animate-pulse" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          {/* Quick Submit Button */}
          <button
            onClick={() => (isAllAnswered ? handleFinalSubmit() : setShowConfirmModal(true))}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition hover:scale-105 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài thi'}</span>
          </button>
        </div>
      </div>

      {/* Question Navigation Bubbles */}
      <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {questions.map((q, idx) => {
            const answered = isQuestionAnswered(q.id);
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                  isCurrent
                    ? 'bg-teal-600 text-white ring-2 ring-teal-400 ring-offset-2 dark:ring-offset-slate-900 shadow-md'
                    : answered
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={`Câu ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
          Đã làm: <strong className="text-teal-600 dark:text-teal-400">{answeredCount}</strong> /{' '}
          {questions.length} câu
        </div>
      </div>

      {/* Main Question Body */}
      <div className="p-6 sm:p-10 space-y-6">
        {/* Question Type & Difficulty Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
              Câu {currentIndex + 1} / {questions.length}
            </span>

            {currentQ.question_type === 'single_choice' && (
              <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                Một lựa chọn
              </span>
            )}
            {currentQ.question_type === 'multiple_choice' && (
              <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
                Nhiều lựa chọn (Chọn tất cả đáp án đúng)
              </span>
            )}
            {currentQ.question_type === 'true_false' && (
              <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
                Đúng / Sai
              </span>
            )}

            {currentQ.difficulty && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                {currentQ.difficulty}
              </span>
            )}
          </div>

          {currentQ.hint && (
            <button
              onClick={() =>
                setShowHint((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))
              }
              className="px-2.5 py-1 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-1 hover:bg-amber-100 transition"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Gợi ý</span>
            </button>
          )}
        </div>

        {/* Question Text */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
          {currentQ.question_text}
        </h3>

        {/* Optional Hint Banner */}
        {showHint[currentQ.id] && currentQ.hint && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2 animate-fadeIn">
            <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Gợi ý suy luận:</strong> {currentQ.hint}
            </div>
          </div>
        )}

        {/* Interactive Options Area */}
        <div className="space-y-3 pt-2">
          {currentQ.question_type === 'true_false' ? (
            /* True / False Dual Cards */
            <div className="grid grid-cols-2 gap-4">
              {currentQ.options.map((opt) => {
                const isSelected = currentAnswers.single === opt.id;
                const isTrueOpt = opt.option_text.toLowerCase().includes('đúng');
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectSingle(opt.id)}
                    className={`p-5 rounded-2xl border-2 text-left transition flex items-center justify-between ${
                      isSelected
                        ? isTrueOpt
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-100 shadow-md ring-2 ring-rose-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? isTrueOpt
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-rose-500 bg-rose-500 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </div>
                      <span className="font-bold text-base sm:text-lg">{opt.option_text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : currentQ.question_type === 'multiple_choice' ? (
            /* Multiple Choice Checkboxes */
            currentQ.options.map((opt, optIdx) => {
              const isChecked = (currentAnswers.multi || []).includes(opt.id);
              const letter = String.fromCharCode(65 + optIdx);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleToggleMulti(opt.id)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-center gap-4 ${
                    isChecked
                      ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-950 dark:text-purple-100 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${
                      isChecked
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 text-slate-500'
                    }`}
                  >
                    {isChecked ? '✓' : letter}
                  </div>
                  <span className="text-sm sm:text-base leading-relaxed">{opt.option_text}</span>
                </button>
              );
            })
          ) : (
            /* Single Choice Radio Options */
            currentQ.options.map((opt, optIdx) => {
              const isSelected = currentAnswers.single === opt.id;
              const letter = String.fromCharCode(65 + optIdx);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectSingle(opt.id)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-center gap-4 ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-950 dark:text-teal-100 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 text-slate-500'
                    }`}
                  >
                    {letter}
                  </div>
                  <span className="text-sm sm:text-base leading-relaxed">{opt.option_text}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Câu trước</span>
        </button>

        <div className="flex items-center gap-3">
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:opacity-90 shadow-sm transition"
            >
              <span>Câu kế tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => (isAllAnswered ? handleFinalSubmit() : setShowConfirmModal(true))}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/30 transition hover:scale-105 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài thi'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal if Unanswered Questions Exist */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Chưa hoàn thành tất cả câu hỏi
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Em mới hoàn thành{' '}
                <strong className="text-amber-600 dark:text-amber-400">{answeredCount}</strong> /{' '}
                {questions.length} câu. Các câu chưa làm sẽ bị tính 0 điểm.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition"
              >
                Vẫn nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
