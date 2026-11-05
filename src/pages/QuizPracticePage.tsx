import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Grade, SubjectDomain } from '../types/index.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import {
  getAllLessonQuizzes,
  getLessonQuizById,
  submitQuizAttemptSecure,
} from '../services/quizService.ts';
import {
  LessonQuizConfig,
  UserAnswerSelection,
  ServerGradingResult,
  UploadedEssayImage,
  shuffleQuestionOptions,
} from '../utils/quizScoringEngine.ts';
import { parseExplanationIntoSteps } from '../utils/wordQuestionParser.ts';
import {
  ScientificSolutionView,
  renderFormattedMathAndChem,
} from '../components/common/ScientificSolutionView.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HelpCircle,
  Clock,
  Lightbulb,
  BookOpen,
  ShieldCheck,
  Sparkles,
  CheckSquare,
  Circle,
  ArrowRight,
  Timer,
  BarChart3,
  AlertCircle,
  FileUp,
  ImagePlus,
  Trash2,
  Eye,
  ListChecks,
  FileText,
  X,
  Shuffle,
} from 'lucide-react';
import { WordQuestionImportModal } from '../components/admin/WordQuestionImportModal.tsx';

/**
 * Generates a realistic SVG notebook image Data URL so students/teachers can test essay image upload in 1 click
 */
function createSampleEssayNotebookDataUrl(questionTitle: string, sampleText?: string): string {
  const safeQuestion = (questionTitle || 'Bài làm Tự luận KHTN')
    .replace(/\n+/g, ' ')
    .slice(0, 72)
    .replace(/[<>&"']/g, '');
  const lines = (
    sampleText ||
    'a) PTHH: Zn + 2HCl → ZnCl₂ + H₂↑ ; n(Zn) = 6,5 / 65 = 0,1 mol\nb) V(H₂) = 0,1 × 24,79 = 2,479 L (25°C, 1 bar)\nc) n(HCl) = 0,2 mol ⇒ CM(HCl) = 0,2 / 0,200 = 1 M'
  )
    .split('\n')
    .slice(0, 4)
    .map((l) =>
      l
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2')
        .replace(/_\{([^}]+)\}/g, '($1)')
        .replace(/_([A-Za-z0-9đĐ]+)/g, '($1)')
        .replace(/[<>&"']/g, '')
    );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="420" viewBox="0 0 760 420">
    <rect width="760" height="420" rx="16" fill="#fffef7" stroke="#cbd5e1" stroke-width="3"/>
    <!-- Notebook horizontal lines -->
    <g stroke="#e2e8f0" stroke-width="1">
      <line x1="0" y1="70" x2="760" y2="70"/>
      <line x1="0" y1="115" x2="760" y2="115"/>
      <line x1="0" y1="160" x2="760" y2="160"/>
      <line x1="0" y1="205" x2="760" y2="205"/>
      <line x1="0" y1="250" x2="760" y2="250"/>
      <line x1="0" y1="295" x2="760" y2="295"/>
      <line x1="0" y1="340" x2="760" y2="340"/>
      <line x1="0" y1="385" x2="760" y2="385"/>
    </g>
    <!-- Red margin line -->
    <line x1="68" y1="0" x2="68" y2="420" stroke="#fda4af" stroke-width="2"/>
    <!-- Header badge -->
    <rect x="85" y="18" width="640" height="38" rx="8" fill="#f0fdfa" stroke="#5eead4" stroke-width="1.5"/>
    <text x="100" y="42" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f766e">
      BÀI LÀM TỰ LUẬN KHOA HỌC TỰ NHIÊN (Ảnh chụp vở học sinh)
    </text>
    <text x="85" y="102" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0d4f7c">
      Đề bài: ${safeQuestion}...
    </text>
    <text x="85" y="148" font-family="serif" font-size="16" font-weight="bold" fill="#0d4f7c">
      Bài giải chi tiết:
    </text>
    ${lines
      .map(
        (line, idx) =>
          `<text x="95" y="${192 + idx * 45}" font-family="serif" font-size="15" fill="#0f172a">• ${line}</text>`
      )
      .join('')}
    <rect x="520" y="348" width="205" height="44" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
    <text x="538" y="375" font-family="sans-serif" font-size="14" font-weight="bold" fill="#047857">
      ✓ Đã hoàn thành bài giải
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const QuizPracticePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialLessonId = searchParams.get('lessonId');
  const initialQuizId = searchParams.get('quizId');
  const initialGradeParam = searchParams.get('grade');

  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<LessonQuizConfig[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>(
    initialGradeParam ? (parseInt(initialGradeParam) as Grade) : 'all'
  );
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | 'all'>('all');

  const [activeQuiz, setActiveQuiz] = useState<LessonQuizConfig | null>(null);
  const [userSelections, setUserSelections] = useState<Record<string, UserAnswerSelection>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [revealedStepGuides, setRevealedStepGuides] = useState<Record<string, boolean>>({});
  const [previewImageModal, setPreviewImageModal] = useState<UploadedEssayImage | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingResult, setGradingResult] = useState<ServerGradingResult | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isWordImportOpen, setIsWordImportOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const all = await getAllLessonQuizzes();
      if (!mounted) return;
      setQuizzes(all);

      let targetQuiz = all[0] || null;
      if (initialQuizId) {
        const found = await getLessonQuizById(initialQuizId);
        if (found) targetQuiz = found;
      } else if (initialLessonId) {
        const found = all.find((q) => q.lessonId === initialLessonId);
        if (found) targetQuiz = found;
      }
      if (targetQuiz) {
        startQuiz(targetQuiz);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [initialLessonId, initialQuizId]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const startQuiz = (quiz: LessonQuizConfig) => {
    setActiveQuiz(quiz);
    setUserSelections({});
    setRevealedHints({});
    setRevealedStepGuides({});
    setGradingResult(null);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
  };

  const handleSelectSingle = (questionId: string, optionId: string) => {
    if (gradingResult) return;
    setUserSelections((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        selectedOptionId: optionId,
      },
    }));
  };

  const handleToggleMulti = (questionId: string, optionId: string) => {
    if (gradingResult) return;
    setUserSelections((prev) => {
      const current = prev[questionId]?.selectedOptionIds || [];
      const exists = current.includes(optionId);
      const next = exists
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          questionId,
          selectedOptionIds: next,
        },
      };
    });
  };

  const handleEssayTextChange = (questionId: string, text: string) => {
    if (gradingResult) return;
    setUserSelections((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        essayText: text,
      },
    }));
  };

  const handleEssayImageUpload = (
    questionId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (gradingResult) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) return;
        const sizeKB = Math.max(1, Math.round(file.size / 1024));
        const newImg: UploadedEssayImage = {
          id: `essay-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          dataUrl,
          sizeLabel: sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`,
        };
        setUserSelections((prev) => {
          const existingImgs = prev[questionId]?.essayImages || [];
          return {
            ...prev,
            [questionId]: {
              ...prev[questionId],
              questionId,
              essayImages: [...existingImgs, newImg],
            },
          };
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleAttachSampleEssayImage = (
    questionId: string,
    questionText: string,
    sampleAnswer?: string
  ) => {
    if (gradingResult) return;
    const dataUrl = createSampleEssayNotebookDataUrl(questionText, sampleAnswer);
    const sampleImg: UploadedEssayImage = {
      id: `essay-sample-${Date.now()}`,
      name: `Bai_giai_tu_luan_${questionId}.png`,
      dataUrl,
      sizeLabel: '145 KB',
    };
    setUserSelections((prev) => {
      const existingImgs = prev[questionId]?.essayImages || [];
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          questionId,
          essayImages: [...existingImgs, sampleImg],
          essayText:
            prev[questionId]?.essayText ||
            sampleAnswer ||
            'Em đã chụp ảnh bài giải tự luận chi tiết đính kèm ở trên.',
        },
      };
    });
  };

  const handleRemoveEssayImage = (questionId: string, imageId: string) => {
    if (gradingResult) return;
    setUserSelections((prev) => {
      const existingImgs = prev[questionId]?.essayImages || [];
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          questionId,
          essayImages: existingImgs.filter((img) => img.id !== imageId),
        },
      };
    });
  };

  const handleSelectTrueFalseStatement = (
    questionId: string,
    statementId: string,
    value: boolean
  ) => {
    if (gradingResult) return;
    setUserSelections((prev) => {
      const prevMap = prev[questionId]?.trueFalseAnswers || {};
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          questionId,
          trueFalseAnswers: {
            ...prevMap,
            [statementId]: value,
          },
        },
      };
    });
  };

  const handleShortAnswerChange = (questionId: string, text: string) => {
    if (gradingResult) return;
    setUserSelections((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        shortAnswerText: text,
      },
    }));
  };

  const handleShuffleQuizOptions = () => {
    if (!activeQuiz || gradingResult) return;
    setActiveQuiz({
      ...activeQuiz,
      questions: activeQuiz.questions.map((q) => shuffleQuestionOptions(q)),
    });
  };

  const toggleHint = (questionId: string) => {
    setRevealedHints((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const toggleStepGuide = (questionId: string) => {
    setRevealedStepGuides((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmitAttempt = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    setIsTimerRunning(false);

    try {
      const selectionsList = Object.values(userSelections);
      const result = await submitQuizAttemptSecure(
        activeQuiz.id,
        selectionsList,
        elapsedSeconds,
        user?.id || 'user_student_demo'
      );

      setGradingResult(result);

      if (result.passed) {
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredQuizzes = quizzes.filter((q) => {
    if (selectedGrade !== 'all' && q.grade !== selectedGrade) return false;
    if (selectedDomain !== 'all' && q.domain !== selectedDomain) return false;
    return true;
  });

  const isQuestionAnswered = (q: LessonQuizConfig['questions'][number]): boolean => {
    const sel = userSelections[q.id];
    if (!sel) return false;
    if (q.type === 'essay') {
      return (
        Boolean(sel.essayText && sel.essayText.trim().length > 0) ||
        Boolean(sel.essayImages && sel.essayImages.length > 0)
      );
    }
    if (q.type === 'short_answer') {
      return Boolean(sel.shortAnswerText && sel.shortAnswerText.trim().length > 0);
    }
    if (q.type === 'true_false' && q.trueFalseStatements && q.trueFalseStatements.length > 0) {
      return Object.keys(sel.trueFalseAnswers || {}).length > 0;
    }
    if (q.type === 'multiple_choice') {
      return (sel.selectedOptionIds || []).length > 0;
    }
    return Boolean(sel.selectedOptionId);
  };

  const answeredCount = activeQuiz
    ? activeQuiz.questions.filter((q) => isQuestionAnswered(q)).length
    : 0;

  const domainLabels: Record<SubjectDomain, string> = {
    'hoa-hoc': 'Hóa học',
    'vat-li': 'Vật lí',
    'sinh-hoc': 'Sinh học',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Hệ Thống Kiểm Tra & Chấm Điểm KHTN' }]} />

        {/* Top Banner */}
        <div className="bg-gradient-to-r from-teal-700 via-sky-700 to-indigo-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>KHOA HỌC SỐ KHTN • Bộ sách Kết nối tri thức với cuộc sống</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              Phòng Luyện Tập Trắc Nghiệm & Tự Luận KHTN
            </h1>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              Kết hợp câu hỏi <strong>Trắc nghiệm</strong> và <strong>Tự luận (cho phép học sinh chụp & tải file ảnh bài làm lên)</strong> kèm <strong>Hướng dẫn giải từng bước chi tiết</strong> chuẩn danh pháp quốc tế IUPAC.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsWordImportOpen(true)}
              data-testid="practice-word-import-btn"
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Tải câu hỏi từ file Word (.docx)</span>
            </button>

            <Link
              to="/tien-do"
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-xs font-extrabold text-white flex items-center gap-2 transition"
            >
              <BarChart3 className="w-4 h-4 text-amber-300" />
              <span>Xem Bảng Tiến Độ Học Sinh</span>
            </Link>
          </div>
        </div>

        {/* Main 2-Column Layout: Left Quiz Selector (4 cols), Right Active Exam Paper (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Quiz List & Filter */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  <span>Chọn Bộ Đề Theo Bài Học</span>
                </h2>
                <span className="text-xs text-slate-500 font-bold">{filteredQuizzes.length} đề</span>
              </div>

              {/* Grade Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {(['all', 6, 7, 8, 9] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGrade(g)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      selectedGrade === g
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {g === 'all' ? 'Tất cả' : `Lớp ${g}`}
                  </button>
                ))}
              </div>

              {/* 3 Domain Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                {(
                  [
                    { id: 'all', label: 'Tất cả 3 phân môn' },
                    { id: 'vat-li', label: 'Vật lí' },
                    { id: 'hoa-hoc', label: 'Hóa học' },
                    { id: 'sinh-hoc', label: 'Sinh học' },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDomain(d.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedDomain === d.id
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Quiz Cards */}
              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                {filteredQuizzes.map((q) => {
                  const isSelected = activeQuiz?.id === q.id;
                  const essayCount = q.questions.filter((item) => item.type === 'essay').length;
                  return (
                    <button
                      key={q.id}
                      data-testid={`select-quiz-${q.id}`}
                      onClick={() => startQuiz(q)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition flex flex-col gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-500 shadow-sm'
                          : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/70 hover:border-teal-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/15 text-teal-700 dark:text-teal-300">
                          Lớp {q.grade} • {domainLabels[q.domain]}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {q.timeLimitMinutes}p
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2">
                        {q.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <span>
                          {q.questions.length} câu hỏi{' '}
                          {essayCount > 0 && (
                            <strong className="text-violet-600 dark:text-violet-400">
                              ({essayCount} tự luận nộp ảnh)
                            </strong>
                          )}
                        </span>
                        <span className="text-teal-600 dark:text-teal-400 font-bold">
                          Đạt: ≥{q.passingScore}/10
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Active Quiz Assessment Area */}
          <div className="lg:col-span-8 space-y-6">
            {activeQuiz ? (
              <>
                {/* Sticky Quiz Status Header */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border-2 border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 sticky top-20 z-20">
                  <div>
                    <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">
                      Đề kiểm tra Lớp {activeQuiz.grade} • {domainLabels[activeQuiz.domain]}
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      {activeQuiz.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {!gradingResult && (
                      <button
                        type="button"
                        onClick={handleShuffleQuizOptions}
                        data-testid="shuffle-options-btn"
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Trộn thứ tự phương án A, B, C, D mà vẫn giữ nguyên đáp án đúng"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-teal-600" />
                        <span>Trộn phương án</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                      <Timer className="w-4 h-4 text-teal-500" />
                      <span>{formatTime(elapsedSeconds)}</span>
                    </div>

                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Đã làm:{' '}
                      <span className="text-teal-600 dark:text-teal-400 font-extrabold">
                        {answeredCount}/{activeQuiz.questions.length}
                      </span>
                    </div>

                    {gradingResult && (
                      <button
                        onClick={() => startQuiz(activeQuiz)}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Làm lại đề</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Navigation Palette */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mr-1">
                      Bản đồ câu hỏi:
                    </span>
                    {activeQuiz.questions.map((q, idx) => {
                      const answered = isQuestionAnswered(q);
                      const fb = gradingResult?.details.find((d) => d.question_id === q.id);
                      let btnCls =
                        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                      if (gradingResult && fb) {
                        btnCls = fb.is_correct
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : (fb.earned_points || 0) > 0
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-rose-600 text-white border-rose-600';
                      } else if (answered) {
                        btnCls = 'bg-teal-600 text-white border-teal-600';
                      }
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(`quiz-question-${idx + 1}`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className={`w-8 h-8 rounded-xl text-xs font-extrabold border transition cursor-pointer flex items-center justify-center ${btnCls}`}
                          title={`Chuyển tới Câu ${idx + 1}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" /> Đã trả lời
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" /> Chưa làm
                    </span>
                  </div>
                </div>

                {/* Grading Result Summary Card */}
                {gradingResult && (
                  <div
                    className={`rounded-3xl p-6 sm:p-8 border-2 shadow-lg space-y-4 ${
                      gradingResult.passed
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700'
                        : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                          <Sparkles className="w-4 h-4" />
                          <span>Kết Quả Chấm Điểm & Hướng Dẫn Giải Chi Tiết Từng Bước</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                          {gradingResult.passed
                            ? 'Chúc mừng! Em đã hoàn thành xuất sắc bài học!'
                            : 'Em hãy xem kỹ các bước giải chi tiết bên dưới để nắm vững bài nhé!'}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                          Hoàn thành đúng <strong>{gradingResult.correct_count}</strong> /{' '}
                          <strong>{gradingResult.total_questions}</strong> câu hỏi • Thời gian hoàn thành:{' '}
                          <strong>{formatTime(gradingResult.time_spent_seconds)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="text-center">
                          <span className="text-[11px] font-bold text-slate-400 uppercase block">
                            Điểm số
                          </span>
                          <span
                            className={`text-3xl font-black font-mono ${
                              gradingResult.passed
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {gradingResult.score.toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-400 font-bold"> / 10</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-xs">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        Kết quả và ảnh bài làm tự luận đã được lưu kèm lời giải từng bước dưới đây.
                      </span>

                      <div className="flex items-center gap-2">
                        {activeQuiz.lessonId && (
                          <Link
                            to={`/bai-hoc/${activeQuiz.lessonId}`}
                            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:border-teal-500 transition"
                          >
                            Xem lại bài giảng lý thuyết
                          </Link>
                        )}
                        <Link
                          to="/tien-do"
                          className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1 transition"
                        >
                          <span>Mở Bảng Tiến Độ</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions List */}
                <div className="space-y-5">
                  {activeQuiz.questions.map((q, qIdx) => {
                    const sel = userSelections[q.id];
                    const itemFeedback = gradingResult?.details.find((it) => it.question_id === q.id);
                    const isEssay = q.type === 'essay';
                    const isShortAnswer = q.type === 'short_answer';
                    const isFourStatementTF =
                      q.type === 'true_false' &&
                      Array.isArray(q.trueFalseStatements) &&
                      q.trueFalseStatements.length > 0;

                    const typeBadge = isEssay
                      ? 'Dạng 4 • Tự luận (Nộp ảnh & trình bày lời giải)'
                      : isShortAnswer
                      ? 'Dạng 3 • Trả lời ngắn (Điền đáp số)'
                      : isFourStatementTF
                      ? 'Dạng 2 • Trắc nghiệm Đúng / Sai (4 ý a, b, c, d)'
                      : q.type === 'multiple_choice'
                      ? 'Chọn nhiều đáp án đúng'
                      : q.type === 'true_false'
                      ? 'Đúng / Sai'
                      : 'Dạng 1 • Trắc nghiệm nhiều lựa chọn (A, B, C, D)';

                    const stepsToDisplay = parseExplanationIntoSteps(
                      itemFeedback?.explanation || q.explanation || '',
                      itemFeedback?.solution_steps || q.solutionSteps,
                      {
                        question: q.question,
                        options: q.options.map((o) => o.content),
                        questionType: q.type,
                        domain: activeQuiz.domain,
                        grade: activeQuiz.grade,
                      }
                    );

                    const showStepByStepBox = Boolean(gradingResult || revealedStepGuides[q.id]);

                    return (
                      <div
                        key={q.id}
                        id={`quiz-question-${qIdx + 1}`}
                        data-testid={`question-card-${qIdx + 1}`}
                        className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border-2 shadow-sm space-y-4 ${
                          isEssay
                            ? 'border-violet-200/80 dark:border-violet-900/60'
                            : isShortAnswer
                            ? 'border-amber-200/80 dark:border-amber-900/60'
                            : isFourStatementTF
                            ? 'border-sky-200/80 dark:border-sky-900/60'
                            : 'border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-lg font-extrabold text-xs border ${
                                isEssay
                                  ? 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                                  : isShortAnswer
                                  ? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  : isFourStatementTF
                                  ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                  : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                              }`}
                            >
                              Câu {qIdx + 1}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isEssay
                                  ? 'bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200'
                                  : isShortAnswer
                                  ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                                  : isFourStatementTF
                                  ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {typeBadge}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              • Mức độ: {q.difficulty}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {q.hint && !gradingResult && (
                              <button
                                type="button"
                                onClick={() => toggleHint(q.id)}
                                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Lightbulb className="w-3.5 h-3.5" />
                                <span>{revealedHints[q.id] ? 'Ẩn gợi ý' : 'Xem gợi ý'}</span>
                              </button>
                            )}

                            {!gradingResult && (
                              <button
                                type="button"
                                onClick={() => toggleStepGuide(q.id)}
                                data-testid={`toggle-step-guide-${qIdx + 1}`}
                                className="text-xs font-extrabold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <ListChecks className="w-3.5 h-3.5" />
                                <span>
                                  {revealedStepGuides[q.id]
                                    ? 'Ẩn lời giải chi tiết'
                                    : 'Xem lời giải chi tiết'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <h4 className="font-serif font-bold text-[#0d4f7c] dark:text-sky-300 text-base sm:text-[17px]">
                            Đề bài
                          </h4>
                          <div className="font-serif text-slate-900 dark:text-slate-100 text-[15px] sm:text-[16.5px] leading-relaxed whitespace-pre-line">
                            {renderFormattedMathAndChem(q.question)}
                          </div>

                          {/* Embedded Question Images from Word / Question Bank */}
                          {q.questionImages && q.questionImages.length > 0 && (
                            <div className="flex flex-wrap gap-3 pt-2">
                              {q.questionImages.map((imgSrc, imgIdx) => (
                                <img
                                  key={imgIdx}
                                  src={imgSrc}
                                  alt={`Hình minh họa câu ${qIdx + 1} - ${imgIdx + 1}`}
                                  className="max-h-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-2 object-contain shadow-xs"
                                />
                              ))}
                            </div>
                          )}

                          {/* Embedded Question Tables from Word */}
                          {q.questionTables && q.questionTables.length > 0 && (
                            <div className="space-y-2 pt-2 overflow-x-auto">
                              {q.questionTables.map((tblHtml, tblIdx) => (
                                <div
                                  key={tblIdx}
                                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs sm:text-sm [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-600 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-600 [&_th]:p-2 [&_th]:bg-slate-100 dark:[&_th]:bg-slate-700"
                                  dangerouslySetInnerHTML={{ __html: tblHtml }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {revealedHints[q.id] && q.hint && !gradingResult && (
                          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <strong>Gợi ý phương pháp giải:</strong> {renderFormattedMathAndChem(q.hint)}
                            </div>
                          </div>
                        )}

                        {/* ========================================================== */}
                        {/* DẠNG 4: ESSAY QUESTION WORKSPACE (IMAGE UPLOAD + TEXT)      */}
                        {/* ========================================================== */}
                        {isEssay ? (
                          <div className="space-y-4 pt-1">
                            {/* Image Upload Dropzone for Essay */}
                            <div className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-violet-400/70 dark:border-violet-700/70 bg-violet-50/40 dark:bg-violet-950/20 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-violet-600/15 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0">
                                    <ImagePlus className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                                      1. Tải file ảnh chụp bài làm tự luận của học sinh (.jpg, .png, .webp)
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Học sinh chụp ảnh vở ghi, sơ đồ thí nghiệm hoặc giấy nháp trình bày các bước giải rồi tải lên đây.
                                    </p>
                                  </div>
                                </div>

                                {!gradingResult && (
                                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition">
                                      <ImagePlus className="w-4 h-4" />
                                      <span>Tải ảnh bài làm lên</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        data-testid={`upload-essay-image-input-${q.id}`}
                                        onChange={(e) => handleEssayImageUpload(q.id, e)}
                                        className="hidden"
                                      />
                                    </label>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAttachSampleEssayImage(q.id, q.question, q.sampleAnswer)
                                      }
                                      data-testid={`attach-sample-essay-image-${q.id}`}
                                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100/60 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>Đính kèm ảnh bài giải mẫu</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Uploaded Essay Images Gallery */}
                              {(sel?.essayImages || []).length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                  {(sel?.essayImages || []).map((img) => (
                                    <div
                                      key={img.id}
                                      data-testid="uploaded-essay-image-card"
                                      className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 shadow-sm flex items-center gap-3"
                                    >
                                      <img
                                        src={img.dataUrl}
                                        alt={img.name}
                                        onClick={() => setPreviewImageModal(img)}
                                        className="w-20 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition shrink-0"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-extrabold text-slate-800 dark:text-white truncate">
                                          {img.name}
                                        </p>
                                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>Đã tải ảnh lên ({img.sizeLabel || 'Ảnh bài làm'})</span>
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setPreviewImageModal(img)}
                                          className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-slate-800 cursor-pointer"
                                          title="Phóng to ảnh bài làm"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        {!gradingResult && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveEssayImage(q.id, img.id)}
                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 cursor-pointer"
                                            title="Xóa ảnh này"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Optional Written Solution Textarea */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-violet-600" />
                                <span>
                                  2. Nhập lời giải tự luận hoặc ghi chú kết quả (có thể kết hợp cùng ảnh bài làm ở trên):
                                </span>
                              </label>
                              <textarea
                                rows={3}
                                disabled={Boolean(gradingResult)}
                                value={sel?.essayText || ''}
                                onChange={(e) => handleEssayTextChange(q.id, e.target.value)}
                                placeholder="Trình bày tóm tắt các bước giải, phương trình hóa học hoặc kết quả tính toán của em tại đây..."
                                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        ) : isShortAnswer ? (
                          /* ========================================================== */
                          /* DẠNG 3: SHORT ANSWER QUESTION WORKSPACE                    */
                          /* ========================================================== */
                          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/70 space-y-3">
                            <label className="block text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-200">
                              Điền kết quả trả lời ngắn của em (chấp nhận cả dấu phẩy &ldquo;,&rdquo; hoặc dấu chấm &ldquo;.&rdquo; thập phân):
                            </label>
                            <div className="flex flex-wrap items-center gap-3">
                              <input
                                type="text"
                                disabled={Boolean(gradingResult)}
                                data-testid={`short-answer-input-${q.id}`}
                                value={sel?.shortAnswerText || ''}
                                onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                                placeholder="Ví dụ: 2,48 hoặc 12.5..."
                                className="w-full sm:w-72 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700 text-sm sm:text-base font-mono font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                              />
                              {q.shortAnswerUnit && (
                                <span className="px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-extrabold">
                                  Đơn vị: {renderFormattedMathAndChem(q.shortAnswerUnit)}
                                </span>
                              )}
                            </div>

                            {gradingResult && itemFeedback && (
                              <div
                                className={`p-3 rounded-xl border text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2 ${
                                  itemFeedback.is_correct
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 font-bold">
                                  {itemFeedback.is_correct ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                  )}
                                  <span>
                                    Câu trả lời của em:{' '}
                                    <strong className="font-mono">
                                      {itemFeedback.student_short_answer || '(Chưa điền)'}
                                    </strong>
                                  </span>
                                </div>
                                <div className="font-extrabold">
                                  Đáp án chuẩn:{' '}
                                  <span className="font-mono text-emerald-700 dark:text-emerald-300">
                                    {itemFeedback.correct_short_answer}
                                    {q.shortAnswerUnit ? ` ${q.shortAnswerUnit}` : ''}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : isFourStatementTF ? (
                          /* ========================================================== */
                          /* DẠNG 2: 4-STATEMENT TRUE / FALSE (a, b, c, d)              */
                          /* ========================================================== */
                          <div className="space-y-2.5 pt-1">
                            <div className="text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-50/80 dark:bg-sky-950/40 px-3.5 py-2 rounded-xl border border-sky-200/70 dark:border-sky-800/70 flex flex-wrap items-center justify-between gap-2">
                              <span>
                                Chọn <strong>Đúng</strong> hoặc <strong>Sai</strong> cho từng phát biểu a), b), c), d):
                              </span>
                              <span className="text-[11px] text-sky-700 dark:text-sky-400">
                                Thang điểm GDPT 2018: 1 ý = 10% • 2 ý = 25% • 3 ý = 50% • 4 ý = 100%
                              </span>
                            </div>

                            {(q.trueFalseStatements || []).map((stmt) => {
                              const chosenVal = sel?.trueFalseAnswers?.[stmt.id];
                              const stmtResult = itemFeedback?.true_false_results?.find(
                                (r) => r.statement_id === stmt.id || r.label === stmt.label
                              );

                              return (
                                <div
                                  key={stmt.id}
                                  data-testid={`tf-statement-row-${q.id}-${stmt.label}`}
                                  className={`p-3.5 sm:p-4 rounded-2xl border transition space-y-2 ${
                                    gradingResult && stmtResult
                                      ? stmtResult.is_correct
                                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400'
                                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-400'
                                      : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="font-serif text-xs sm:text-[15px] text-slate-900 dark:text-slate-100 leading-relaxed flex-1">
                                      <strong className="font-sans text-sky-700 dark:text-sky-300 mr-1.5">
                                        {stmt.label})
                                      </strong>
                                      {renderFormattedMathAndChem(stmt.text)}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        disabled={Boolean(gradingResult)}
                                        data-testid={`tf-btn-${q.id}-${stmt.label}-true`}
                                        onClick={() =>
                                          handleSelectTrueFalseStatement(q.id, stmt.id, true)
                                        }
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                                          chosenVal === true
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                                        }`}
                                      >
                                        Đúng
                                      </button>
                                      <button
                                        type="button"
                                        disabled={Boolean(gradingResult)}
                                        data-testid={`tf-btn-${q.id}-${stmt.label}-false`}
                                        onClick={() =>
                                          handleSelectTrueFalseStatement(q.id, stmt.id, false)
                                        }
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                                          chosenVal === false
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-rose-500'
                                        }`}
                                      >
                                        Sai
                                      </button>
                                    </div>
                                  </div>

                                  {gradingResult && stmtResult && (
                                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 text-xs flex flex-wrap items-center justify-between gap-2">
                                      <span
                                        className={`font-bold flex items-center gap-1 ${
                                          stmtResult.is_correct
                                            ? 'text-emerald-700 dark:text-emerald-300'
                                            : 'text-rose-700 dark:text-rose-300'
                                        }`}
                                      >
                                        {stmtResult.is_correct ? (
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                        ) : (
                                          <XCircle className="w-3.5 h-3.5" />
                                        )}
                                        Đáp án đúng ý {stmt.label}):{' '}
                                        <strong>{stmtResult.correct_answer ? 'Đúng' : 'Sai'}</strong>
                                      </span>
                                      {stmtResult.explanation && (
                                        <span className="text-slate-600 dark:text-slate-300 italic">
                                          Giải thích: {renderFormattedMathAndChem(stmtResult.explanation)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* ========================================================== */
                          /* DẠNG 1: MULTIPLE-CHOICE OPTIONS (A, B, C, D)               */
                          /* ========================================================== */
                          <div className="grid grid-cols-1 gap-2.5 pt-1">
                            {q.options.map((opt, optIdx) => {
                              const isMulti = q.type === 'multiple_choice';
                              const isSelected = isMulti
                                ? (sel?.selectedOptionIds || []).includes(opt.id)
                                : sel?.selectedOptionId === opt.id;

                              const isCorrectOption = (itemFeedback?.correct_option_ids || []).includes(opt.id);

                              let optionStyle =
                                'bg-slate-50/70 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-teal-400';

                              if (gradingResult) {
                                if (isCorrectOption) {
                                  optionStyle =
                                    'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                                } else if (isSelected && !isCorrectOption) {
                                  optionStyle =
                                    'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-200';
                                }
                              } else if (isSelected) {
                                optionStyle =
                                  'bg-teal-50 dark:bg-teal-950/70 border-teal-600 text-teal-950 dark:text-teal-200 font-bold shadow-sm';
                              }

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() =>
                                    isMulti
                                      ? handleToggleMulti(q.id, opt.id)
                                      : handleSelectSingle(q.id, opt.id)
                                  }
                                  className={`text-left px-4 py-3.5 rounded-2xl border text-xs sm:text-sm transition flex items-center justify-between gap-3 cursor-pointer ${optionStyle}`}
                                >
                                  <div className="flex items-center gap-3">
                                    {isMulti ? (
                                      <CheckSquare
                                        className={`w-4 h-4 shrink-0 ${
                                          isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'
                                        }`}
                                      />
                                    ) : (
                                      <Circle
                                        className={`w-4 h-4 shrink-0 ${
                                          isSelected
                                            ? 'text-teal-600 dark:text-teal-400 fill-current'
                                            : 'text-slate-400'
                                        }`}
                                      />
                                    )}
                                    <span className="font-serif text-[14.5px] sm:text-[15.5px]">
                                      <strong className="font-sans mr-1.5">
                                        {String.fromCharCode(65 + optIdx)}.
                                      </strong>
                                      {renderFormattedMathAndChem(opt.content)}
                                    </span>
                                  </div>

                                  {gradingResult && isCorrectOption && (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  )}
                                  {gradingResult && isSelected && !isCorrectOption && (
                                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* ========================================================== */}
                        {/* TEXTBOOK WORKED-OUT SOLUTION (MATCHING REFERENCE IMAGE)     */}
                        {/* ========================================================== */}
                        {showStepByStepBox && (
                          <div
                            data-testid={`step-by-step-explanation-${qIdx + 1}`}
                            className="p-5 sm:p-6 rounded-2xl border-2 border-[#c8dfee] dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm space-y-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#d5e6f2] dark:border-slate-800">
                              <div className="font-extrabold flex items-center gap-2 text-xs sm:text-sm">
                                {gradingResult && itemFeedback ? (
                                  itemFeedback.is_correct ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                      <span className="text-emerald-800 dark:text-emerald-300">
                                        {isEssay
                                          ? `Đã ghi nhận bài làm tự luận & ảnh đính kèm (+${(itemFeedback.earned_points ?? q.points).toFixed(2)} điểm)`
                                          : `Chính xác hoàn toàn! (+${(itemFeedback.earned_points ?? q.points).toFixed(2)} điểm)`}
                                      </span>
                                    </>
                                  ) : (itemFeedback.earned_points || 0) > 0 ? (
                                    <>
                                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                      <span className="text-amber-800 dark:text-amber-300">
                                        Đúng một phần (+{(itemFeedback.earned_points || 0).toFixed(2)} / {q.points} điểm) — Xem lời giải chi tiết bên dưới
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                      <span className="text-rose-700 dark:text-rose-300">
                                        {isEssay
                                          ? 'Chưa nộp bài làm tự luận — Xem lời giải chi tiết bên dưới'
                                          : 'Chưa chính xác — Xem lời giải chi tiết bên dưới'}
                                      </span>
                                    </>
                                  )
                                ) : (
                                  <>
                                    <ListChecks className="w-4 h-4 text-[#0d4f7c] dark:text-sky-400" />
                                    <span className="text-[#0d4f7c] dark:text-sky-300 tracking-wide">
                                      LỜI GIẢI CHI TIẾT BÀI TẬP
                                    </span>
                                  </>
                                )}
                              </div>

                              <span className="px-2.5 py-0.5 rounded-full bg-[#eaf3f8] dark:bg-slate-800 text-[#0d4f7c] dark:text-sky-300 text-[11px] font-extrabold">
                                Chuẩn công thức & Kí hiệu KHTN
                              </span>
                            </div>

                            <ScientificSolutionView
                              steps={stepsToDisplay}
                              questionText={q.question}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!gradingResult && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-slate-100 dark:border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Hãy kiểm tra kỹ các câu trắc nghiệm và ảnh bài làm tự luận trước khi nộp bài.
                    </div>
                    <button
                      onClick={handleSubmitAttempt}
                      disabled={isSubmitting || answeredCount === 0}
                      data-testid="submit-quiz-btn"
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? 'Đang chấm điểm...'
                          : `Nộp bài & Chấm điểm (${answeredCount}/${activeQuiz.questions.length})`}
                      </span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
                <HelpCircle className="w-10 h-10 text-teal-500 mx-auto mb-3" />
                <p className="text-sm font-bold">Vui lòng chọn một bộ đề kiểm tra ở cột bên trái.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Previewing Student Uploaded Essay Image */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Ảnh bài làm tự luận: {previewImageModal.name}
              </h3>
              <button
                onClick={() => setPreviewImageModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
              <img
                src={previewImageModal.dataUrl}
                alt={previewImageModal.name}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <WordQuestionImportModal
        isOpen={isWordImportOpen}
        onClose={() => setIsWordImportOpen(false)}
        onImported={async ({ createdQuiz }) => {
          const all = await getAllLessonQuizzes();
          setQuizzes(all);
          if (createdQuiz) {
            const newlyCreated = all.find((q) => q.id === createdQuiz.id);
            if (newlyCreated) {
              startQuiz(newlyCreated);
            }
          }
        }}
      />
    </div>
  );
};
