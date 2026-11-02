import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { QuizPlayer } from '../components/quiz/QuizPlayer.tsx';
import { QuizResultView } from '../components/quiz/QuizResultView.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { Grade, SubjectDomain, QuizMeta } from '../types/index.ts';
import { LESSONS } from '../data/mockData.ts';
import {
  ClientQuestion,
  QuizSubmissionItem,
  getLessonQuizzes,
  getQuizForLesson,
  getQuizQuestions,
  submitQuizAttemptSecurely,
  getStudentQuizAttempts,
} from '../services/quizService.ts';
import { ServerGradingResult } from '../utils/quizScoringEngine.ts';
import {
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
  Timer,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Flame,
  BookOpen,
  History,
  Filter,
  Play,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const QuizPracticePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const lessonIdParam = searchParams.get('lessonId');
  const quizIdParam = searchParams.get('quizId');
  const gradeParam = searchParams.get('grade');

  const { user: currentUser } = useAuth();

  // Filters
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>(
    gradeParam ? (parseInt(gradeParam, 10) as Grade) : 'all'
  );
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | 'all'>('all');
  const [mainTab, setMainTab] = useState<'quizzes' | 'history'>('quizzes');

  // Quizzes list & loading
  const [quizzesList, setQuizzesList] = useState<QuizMeta[]>([]);
  const [historyList, setHistoryList] = useState<ServerGradingResult[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // Active quiz state
  const [activeQuizMeta, setActiveQuizMeta] = useState<QuizMeta | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<ClientQuestion[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingResult, setGradingResult] = useState<ServerGradingResult | null>(null);

  // Load quizzes and history
  useEffect(() => {
    let mounted = true;
    async function init() {
      setIsLoadingList(true);
      try {
        const [quizzes, attempts] = await Promise.all([
          getLessonQuizzes(selectedGrade, selectedDomain),
          currentUser ? getStudentQuizAttempts(currentUser.id) : Promise.resolve([]),
        ]);
        if (mounted) {
          setQuizzesList(quizzes);
          setHistoryList(attempts);
        }
      } finally {
        if (mounted) setIsLoadingList(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [selectedGrade, selectedDomain, currentUser]);

  // Handle URL param autostart
  useEffect(() => {
    async function loadFromParam() {
      if (lessonIdParam) {
        setIsLoadingQuiz(true);
        const meta = await getQuizForLesson(lessonIdParam);
        if (meta) {
          setActiveQuizMeta(meta);
          const qs = await getQuizQuestions(meta.id);
          setActiveQuestions(qs);
        }
        setIsLoadingQuiz(false);
      } else if (quizIdParam) {
        setIsLoadingQuiz(true);
        const all = await getLessonQuizzes();
        const meta = all.find((q) => q.id === quizIdParam);
        if (meta) {
          setActiveQuizMeta(meta);
          const qs = await getQuizQuestions(meta.id);
          setActiveQuestions(qs);
        }
        setIsLoadingQuiz(false);
      }
    }
    loadFromParam();
  }, [lessonIdParam, quizIdParam]);

  // Start a quiz
  const handleStartQuiz = async (quiz: QuizMeta) => {
    setIsLoadingQuiz(true);
    setGradingResult(null);
    try {
      setActiveQuizMeta(quiz);
      const qs = await getQuizQuestions(quiz.id);
      setActiveQuestions(qs);
      setSearchParams({ quizId: quiz.id });
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Submit active quiz answers
  const handleSubmitAnswers = async (answers: QuizSubmissionItem[], timeSpentSeconds: number) => {
    if (!activeQuizMeta) return;
    setIsSubmitting(true);
    try {
      const result = await submitQuizAttemptSecurely(
        activeQuizMeta.id,
        answers,
        timeSpentSeconds,
        currentUser
      );
      setGradingResult(result);

      // Refresh attempts history
      if (currentUser) {
        const updatedAttempts = await getStudentQuizAttempts(currentUser.id);
        setHistoryList(updatedAttempts);
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retake quiz
  const handleRetake = () => {
    setGradingResult(null);
  };

  // Exit quiz
  const handleExitQuiz = () => {
    setActiveQuizMeta(null);
    setActiveQuestions([]);
    setGradingResult(null);
    setSearchParams({});
  };

  const domainNames: Record<SubjectDomain, string> = {
    'hoa-hoc': 'Hóa học',
    'vat-li': 'Vật lí',
    'sinh-hoc': 'Sinh học',
    'trai-dat-vu-tru': 'Trái Đất & Vũ trụ',
  };

  // 1. ACTIVE RESULT VIEW
  if (activeQuizMeta && gradingResult) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <Breadcrumbs
              items={[
                { label: 'Luyện tập trắc nghiệm', to: '/luyen-tap' },
                { label: activeQuizMeta.title },
                { label: 'Kết quả bài thi' },
              ]}
            />
            <button
              onClick={handleExitQuiz}
              className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
            >
              ← Về danh sách đề
            </button>
          </div>

          <QuizResultView
            quizTitle={activeQuizMeta.title}
            lessonId={activeQuizMeta.lessonId}
            lessonTitle={activeQuizMeta.lessonTitle}
            result={gradingResult}
            questions={activeQuestions}
            onRetake={handleRetake}
          />
        </div>
      </div>
    );
  }

  // 2. ACTIVE QUIZ TAKING VIEW
  if (activeQuizMeta && activeQuestions.length > 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <Breadcrumbs
              items={[
                { label: 'Luyện tập trắc nghiệm', to: '/luyen-tap' },
                { label: activeQuizMeta.title },
              ]}
            />
            <button
              onClick={handleExitQuiz}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 transition"
            >
              ✕ Thoát bài làm
            </button>
          </div>

          {isLoadingQuiz ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Đang tải đề thi & chuẩn bị phòng kiểm tra an toàn...</p>
            </div>
          ) : (
            <QuizPlayer
              quizTitle={activeQuizMeta.title}
              lessonTitle={activeQuizMeta.lessonTitle}
              durationMinutes={activeQuizMeta.durationMinutes}
              passScore={activeQuizMeta.passScore}
              questions={activeQuestions}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmitAnswers}
              onCancel={handleExitQuiz}
            />
          )}
        </div>
      </div>
    );
  }

  // 3. CATALOG & PRACTICE LIBRARY VIEW
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Luyện tập & Đánh giá năng lực KHTN' }]} />

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#152E52] rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold">
                Chuẩn Đánh Giá GDPT 2018
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Chấm điểm Server-side bảo mật
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Phòng Luyện Tập & Đánh Giá Năng Lực
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Hệ thống câu hỏi trắc nghiệm đa dạng (một lựa chọn, nhiều lựa chọn, đúng/sai) bám sát
              chương trình KHTN 6, 7, 8, 9. Tự động chấm điểm, lưu lịch sử và đánh dấu hoàn thành bài học.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/tien-do"
              className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-teal-600/30 transition hover:scale-105"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Xem tiến độ học sinh</span>
            </Link>
          </div>
        </div>

        {/* Main Tabs (Quizzes Catalog vs History) */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setMainTab('quizzes')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              mainTab === 'quizzes'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bộ đề trắc nghiệm theo bài học ({quizzesList.length})</span>
          </button>

          <button
            onClick={() => setMainTab('history')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              mainTab === 'history'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch sử làm bài của em ({historyList.length})</span>
          </button>
        </div>

        {/* TAB 1: QUIZZES CATALOG */}
        {mainTab === 'quizzes' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              {/* Grade Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs text-slate-400 font-semibold mr-1">Khối:</span>
                {(['all', 6, 7, 8, 9] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGrade(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedGrade === g
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {g === 'all' ? 'Tất cả khối' : `Lớp ${g}`}
                  </button>
                ))}
              </div>

              {/* Domain Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-xs text-slate-400 font-semibold mr-1">Phân môn:</span>
                {(['all', 'hoa-hoc', 'vat-li', 'sinh-hoc', 'trai-dat-vu-tru'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDomain(d)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedDomain === d
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {d === 'all' ? 'Tất cả' : domainNames[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quizzes Grid Cards */}
            {isLoadingList ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Đang tải danh mục bài kiểm tra...</p>
              </div>
            ) : quizzesList.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Chưa có bài kiểm tra phù hợp bộ lọc
                </h3>
                <p className="text-xs text-slate-500">
                  Hãy thử chọn khối lớp hoặc phân môn khác để xem thêm bài luyện tập.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzesList.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 shadow-sm hover:shadow-lg transition flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[11px] font-bold">
                          Lớp {quiz.grade} • {domainNames[quiz.domain]}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{quiz.durationMinutes} phút</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-snug">
                        {quiz.title}
                      </h3>

                      {quiz.lessonTitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          Gắn với: {quiz.lessonTitle}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                        <span>Đề chuẩn: <strong>{quiz.questionCount}</strong> câu</span>
                        <span>•</span>
                        <span>Điểm đạt: <strong>{quiz.passScore}/10</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-teal-600 dark:hover:bg-teal-500 text-white dark:text-slate-900 dark:hover:text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Bắt đầu làm bài thi</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STUDENT QUIZ ATTEMPTS HISTORY */}
        {mainTab === 'history' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Lịch Sử Các Lượt Kiểm Tra Đã Nộp
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lưu trữ kết quả thực tế trên hệ thống. Học sinh chỉ được xem kết quả của chính mình.
                </p>
              </div>
            </div>

            {historyList.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <History className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Em chưa nộp bài kiểm tra nào
                </h4>
                <p className="text-xs text-slate-400">
                  Hãy chọn một bài trắc nghiệm ở tab &quot;Bộ đề theo bài học&quot; để bắt đầu kiểm tra kiến thức.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Bài kiểm tra</th>
                      <th className="py-3 px-4 text-center">Thời gian hoàn thành</th>
                      <th className="py-3 px-4 text-center">Điểm số</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {historyList.map((attempt) => {
                      const quiz = quizzesList.find((q) => q.id === attempt.quiz_id);
                      return (
                        <tr
                          key={attempt.attempt_id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {quiz?.title || attempt.quiz_id}
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                            {new Date(attempt.completed_at).toLocaleDateString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-mono font-black text-sm text-teal-600 dark:text-teal-400">
                              {attempt.score.toFixed(1)} / 10
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {attempt.passed ? (
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đạt chuẩn</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-[11px] inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                <span>Chưa đạt</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                if (quiz) handleStartQuiz(quiz);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-600 text-slate-600 dark:text-slate-300 font-bold text-xs transition"
                            >
                              Làm lại
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
