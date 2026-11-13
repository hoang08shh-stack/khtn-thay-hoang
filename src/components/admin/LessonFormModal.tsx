import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Video,
  Atom,
  Layers,
  Sparkles,
  Trash2,
  RefreshCw,
  Clock,
  Plus,
  Edit3,
  HelpCircle,
  Sigma,
  ClipboardPaste,
  Bold,
} from 'lucide-react';
import {
  LessonReviewQuestionType,
  TrueFalseStatement,
  Grade,
  SubjectDomain,
  LessonMiniQuizItem,
} from '../../types/index.ts';
import { DOMAINS, SIMULATIONS_3D, LESSONS } from '../../data/mockData.ts';
import {
  AdminLesson,
  LessonAssetItem,
  generateSlug,
  checkSlugAvailable,
  extractYouTubeId,
  saveAdminLesson,
  getAdminTopicsSync,
} from '../../services/adminService.ts';
import { AssetUploader } from './AssetUploader.tsx';
import { FormulaEditorModal } from './FormulaEditorModal.tsx';
import { LessonWordReviewConverter } from './LessonWordReviewConverter.tsx';
import {
  renderFormattedMathAndChem,
  renderStructuredTheoryParagraph,
  wrapSelectionWithBold,
  autoBoldAllSubheadingsInText,
} from '../common/ScientificSolutionView.tsx';
import { normalizeTrueFalseStatements } from '../../utils/lessonReviewQuizConverter.ts';
import { formatChemicalAndScientificText } from '../../utils/wordQuestionParser.ts';

interface LessonFormModalProps {
  lesson?: AdminLesson | null;
  isOpen: boolean;
  initialTab?: 'info' | 'content' | 'media' | 'assets' | 'miniquiz';
  onClose: () => void;
  onSaved: (savedLesson: AdminLesson) => void;
}

const LessonFormModalContent: React.FC<Omit<LessonFormModalProps, 'isOpen'>> = ({
  lesson,
  initialTab = 'info',
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(lesson?.id);
  const baseLesson = lesson?.id ? LESSONS.find((m) => m.id === lesson.id) : undefined;

  // Form states
  const [title, setTitle] = useState(lesson?.title || '');
  const [slug, setSlug] = useState(lesson?.slug || '');
  const [grade, setGrade] = useState<Grade>(lesson?.grade || 7);
  const [domain, setDomain] = useState<SubjectDomain>(lesson?.domain || 'hoa-hoc');
  const [topicId, setTopicId] = useState(lesson?.topicId || '');
  const [code, setCode] = useState(lesson?.code || '');
  const [orderIndex, setOrderIndex] = useState(lesson?.orderIndex ?? 1);
  const [durationMinutes, setDurationMinutes] = useState(lesson?.durationMinutes || 45);
  const [summary, setSummary] = useState(lesson?.summary || '');
  const [content, setContent] = useState(lesson?.content || '');
  const [isPublished, setIsPublished] = useState(lesson?.isPublished ?? true);
  const [videoInput, setVideoInput] = useState(lesson?.videoUrl || '');
  const [selectedSimulations, setSelectedSimulations] = useState<string[]>(
    lesson?.simulationIds || []
  );
  const [assets, setAssets] = useState<LessonAssetItem[]>(lesson?.assets || []);
  const [miniQuiz, setMiniQuiz] = useState<LessonMiniQuizItem[]>(
    lesson?.miniQuiz && lesson.miniQuiz.length > 0
      ? [...lesson.miniQuiz]
      : baseLesson?.miniQuiz
      ? [...baseLesson.miniQuiz]
      : []
  );

  // Mini-quiz editor states
  const [editingQuizIdx, setEditingQuizIdx] = useState<number | null>(null);
  const [quizType, setQuizType] = useState<LessonReviewQuestionType>('single_choice');
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState<string[]>(['', '', '', '']);
  const [quizCorrectIdx, setQuizCorrectIdx] = useState<number>(0);
  const [quizTfStatements, setQuizTfStatements] = useState<TrueFalseStatement[]>([
    { id: 'tf_a', label: 'a', text: '', isTrue: true },
    { id: 'tf_b', label: 'b', text: '', isTrue: false },
    { id: 'tf_c', label: 'c', text: '', isTrue: true },
    { id: 'tf_d', label: 'd', text: '', isTrue: false },
  ]);
  const [quizSampleAnswer, setQuizSampleAnswer] = useState('');
  const [quizExplanation, setQuizExplanation] = useState('');
  const [quickPasteOpen, setQuickPasteOpen] = useState(false);
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [formulaTarget, setFormulaTarget] = useState<'question' | 'explanation' | 'content'>(
    'question'
  );
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleApplyBoldToContent = () => {
    const el = contentTextareaRef.current;
    if (!el) return;
    const { nextText, nextCursorStart, nextCursorEnd } = wrapSelectionWithBold(
      content,
      el.selectionStart ?? content.length,
      el.selectionEnd ?? content.length
    );
    setContent(nextText);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextCursorStart, nextCursorEnd);
    });
  };

  // UI / Status states
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'media' | 'assets' | 'miniquiz'>(
    initialTab
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Filter topics based on selected grade and domain (including custom topics created in Admin or Upload Wizard)
  const availableTopics = getAdminTopicsSync().filter(
    (t) => t.grade === grade && t.domain === domain
  );

  // Automatically adjust topic when grade/domain change if current topic not in list
  useEffect(() => {
    if (availableTopics.length > 0) {
      const match = availableTopics.find((t) => t.id === topicId);
      if (!match) {
        setTopicId(availableTopics[0].id);
      }
    } else {
      setTopicId('');
    }
  }, [grade, domain]);

  // Suggest lesson code if empty
  useEffect(() => {
    if (!isEditing && !code) {
      const domainShort =
        domain === 'hoa-hoc'
          ? 'HH'
          : domain === 'vat-li'
          ? 'VL'
          : domain === 'sinh-hoc'
          ? 'SH'
          : 'TV';
      setCode(`KHTN${grade}-${domainShort}-0${orderIndex}`);
    }
  }, [grade, domain, orderIndex]);

  // Auto generate slug when title changes (if not manually edited or new)
  const handleAutoSlug = () => {
    const generated = generateSlug(title);
    setSlug(generated);
    checkSlug(generated);
  };

  const checkSlug = async (value: string) => {
    if (!value || value.length < 2) return;
    setSlugStatus({ checking: true });
    const result = await checkSlugAvailable(value, lesson?.id);
    setSlugStatus({
      checking: false,
      available: result.available,
      message: result.reason,
    });
  };

  // YouTube parser
  const parsedYouTubeId = extractYouTubeId(videoInput);

  const resetQuizDraft = () => {
    setEditingQuizIdx(null);
    setQuizType('single_choice');
    setQuizQuestion('');
    setQuizOptions(['', '', '', '']);
    setQuizCorrectIdx(0);
    setQuizTfStatements([
      { id: 'tf_a', label: 'a', text: '', isTrue: true },
      { id: 'tf_b', label: 'b', text: '', isTrue: false },
      { id: 'tf_c', label: 'c', text: '', isTrue: true },
      { id: 'tf_d', label: 'd', text: '', isTrue: false },
    ]);
    setQuizSampleAnswer('');
    setQuizExplanation('');
  };

  const handleSaveQuizItem = () => {
    if (!quizQuestion.trim()) {
      setErrorMessage('Vui lòng nhập nội dung câu hỏi ôn tập cuối bài.');
      return;
    }
    const existingItemId =
      editingQuizIdx !== null && miniQuiz[editingQuizIdx]?.id
        ? miniQuiz[editingQuizIdx].id
        : `q-lesson-${lesson?.id || 'draft'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let newItem: LessonMiniQuizItem;
    if (quizType === 'true_false') {
      const normalizedStmts = normalizeTrueFalseStatements(quizTfStatements, quizOptions);
      const tfSummary = normalizedStmts
        .map((s) => `${s.label}) ${s.isTrue ? 'Đúng' : 'Sai'}`)
        .join(' | ');
      newItem = {
        id: existingItemId,
        questionType: 'true_false',
        question: quizQuestion.trim(),
        options: normalizedStmts.map((s) => s.text),
        correctIndex: 0,
        trueFalseStatements: normalizedStmts,
        explanation: quizExplanation.trim() || `Đáp án Đúng/Sai: ${tfSummary}.`,
      };
    } else if (quizType === 'essay') {
      const cleanSample =
        quizSampleAnswer.trim() ||
        quizExplanation.trim() ||
        'Học sinh trình bày lập luận khoa học, viết phương trình / công thức và kết luận.';
      newItem = {
        id: existingItemId,
        questionType: 'essay',
        question: quizQuestion.trim(),
        options: [],
        correctIndex: 0,
        sampleAnswer: cleanSample,
        rubric:
          'Nêu đúng kiến thức trọng tâm hoặc công thức / PTHH (0,5đ); Trình bày rõ các bước biến đổi và đơn vị đo (0,5đ).',
        explanation: quizExplanation.trim() || cleanSample,
      };
    } else {
      const cleanOptions = quizOptions.map(
        (o, i) => o.trim() || `Phương án ${String.fromCharCode(65 + i)}`
      );
      newItem = {
        id: existingItemId,
        questionType: 'single_choice',
        question: quizQuestion.trim(),
        options: cleanOptions,
        correctIndex: quizCorrectIdx,
        explanation:
          quizExplanation.trim() ||
          `Đáp án đúng là ${String.fromCharCode(65 + quizCorrectIdx)}: ${cleanOptions[quizCorrectIdx]}.`,
      };
    }

    if (editingQuizIdx !== null && editingQuizIdx >= 0 && editingQuizIdx < miniQuiz.length) {
      setMiniQuiz((prev) => prev.map((item, idx) => (idx === editingQuizIdx ? newItem : item)));
    } else {
      setMiniQuiz((prev) => [...prev, newItem]);
    }
    setErrorMessage(null);
    resetQuizDraft();
  };

  const handleEditQuizItem = (idx: number) => {
    const item = miniQuiz[idx];
    if (!item) return;
    setEditingQuizIdx(idx);
    const qType: LessonReviewQuestionType = item.questionType || 'single_choice';
    setQuizType(qType);
    setQuizQuestion(item.question);
    const padded = [...(item.options || [])];
    while (padded.length < 4) padded.push('');
    setQuizOptions(padded.slice(0, 4));
    setQuizCorrectIdx(item.correctIndex >= 0 && item.correctIndex < 4 ? item.correctIndex : 0);
    setQuizTfStatements(normalizeTrueFalseStatements(item.trueFalseStatements, item.options));
    setQuizSampleAnswer(item.sampleAnswer || item.explanation || '');
    setQuizExplanation(item.explanation || '');
  };

  const handleDeleteQuizItem = (idx: number) => {
    setMiniQuiz((prev) => prev.filter((_, i) => i !== idx));
    if (editingQuizIdx === idx) resetQuizDraft();
  };

  // Handle save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề bài học.');
      setActiveTab('info');
      return;
    }

    if (!code.trim()) {
      setErrorMessage('Vui lòng nhập mã bài học (VD: KHTN7-HH-01).');
      setActiveTab('info');
      return;
    }

    if (!slug.trim()) {
      const auto = generateSlug(title);
      setSlug(auto);
    }

    // Slug check
    const slugCheck = await checkSlugAvailable(slug.trim(), lesson?.id);
    if (!slugCheck.available) {
      setErrorMessage(slugCheck.reason || 'Đường dẫn (slug) đã bị trùng lặp.');
      setActiveTab('info');
      return;
    }

    setIsSubmitting(true);

    try {
      const saved = await saveAdminLesson(
        {
          id: lesson?.id,
          topicId,
          grade,
          domain,
          code: code.trim(),
          slug: slug.trim(),
          title: title.trim(),
          summary: summary.trim() || 'Nội dung bài học KHTN chuẩn GDPT 2018.',
          content: content.trim() || 'Kiến thức trọng tâm bài học.',
          durationMinutes: Number(durationMinutes) || 45,
          orderIndex: Number(orderIndex) || 1,
          isPublished,
          videoUrl: parsedYouTubeId
            ? `https://www.youtube.com/watch?v=${parsedYouTubeId}`
            : videoInput.trim() || undefined,
          miniQuiz,
        },
        assets,
        selectedSimulations,
        miniQuiz
      );

      onSaved(saved);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể lưu bài học.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSimulation = (simId: string) => {
    setSelectedSimulations((prev) =>
      prev.includes(simId) ? prev.filter((id) => id !== simId) : [...prev, simId]
    );
  };

  const removeAsset = (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {isEditing ? 'Cập nhật bài học' : 'Soạn bài học mới'}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1F3A] dark:text-white">
              {isEditing ? title || 'Chỉnh sửa bài học' : 'Thêm bài giảng số GDPT 2018'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Thông tin chung</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'content'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Tóm tắt & Nội dung</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'media'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>3. YouTube & Trạm 3D</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assets')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'assets'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>4. Tài liệu PPT/PDF ({assets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('miniquiz')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'miniquiz'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>5. Câu hỏi củng cố ({miniQuiz.length})</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium flex-1">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Tiêu đề bài học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => {
                      if (!slug) handleAutoSlug();
                    }}
                    placeholder="VD: Bài 4: Cấu tạo nguyên tử và mô hình Rutherford - Bohr"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>

                {/* Slug with duplication checker */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Đường dẫn định danh (Slug) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoSlug}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Tự động tạo từ tiêu đề
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        checkSlug(e.target.value);
                      }}
                      placeholder="cau-tao-nguyen-tu-rutherford-bohr"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 pr-24"
                    />
                    <div className="absolute right-3 top-2.5 text-[11px] flex items-center gap-1">
                      {slugStatus.checking ? (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Kiểm tra...
                        </span>
                      ) : slugStatus.available === true ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                        </span>
                      ) : slugStatus.available === false ? (
                        <span className="text-red-500 flex items-center gap-1 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" /> Đã trùng
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {slugStatus.message && (
                    <p className="text-[11px] text-red-500 mt-1">{slugStatus.message}</p>
                  )}
                </div>

                {/* Khối lớp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Khối lớp (GDPT 2018)
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value) as Grade)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={6}>KHTN Lớp 6</option>
                    <option value={7}>KHTN Lớp 7</option>
                    <option value={8}>KHTN Lớp 8</option>
                    <option value={9}>KHTN Lớp 9</option>
                  </select>
                </div>

                {/* Mạch kiến thức */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Mạch kiến thức KHTN
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as SubjectDomain)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.shortName} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic / Chủ đề */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Chủ đề tương ứng
                  </label>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {availableTopics.length > 0 ? (
                      availableTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.code}: {t.title}
                        </option>
                      ))
                    ) : (
                      <option value="">Chủ đề mở rộng (Mặc định)</option>
                    )}
                  </select>
                </div>

                {/* Mã bài học */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Mã bài học (Code)
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VD: KHTN7-HH-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Thứ tự hiển thị & Thời lượng */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Thứ tự sắp xếp bài (Order Index)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Thời lượng dự kiến (Phút)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Status toggle Draft vs Published */}
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-slate-800/80 border border-teal-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Trạng thái xuất bản (Status)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isPublished
                      ? 'Đang ở trạng thái ĐÃ XUẤT BẢN. Học sinh có thể tìm kiếm và xem bài học.'
                      : 'Đang ở trạng thái BẢN NHÁP (Draft). Chỉ Admin và Giáo viên mới thấy bài này.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isPublished
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-amber-600 text-white shadow-sm'
                  }`}
                >
                  {isPublished ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Đã Xuất Bản
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" /> Bản Nháp (Draft)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Tóm tắt bài học (Summary)
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Mô tả ngắn gọn nội dung cốt lõi và mục tiêu cần đạt..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Nội dung chi tiết bài học (Hỗ trợ cấu trúc đề mục in đậm &amp; Công thức KHTN)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleApplyBoldToContent}
                      title="Bôi đen văn bản rồi bấm để In đậm (Ctrl+B)"
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Bold className="w-3 h-3 stroke-[3]" />
                      <span>B In đậm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContent((prev) => autoBoldAllSubheadingsInText(prev))}
                      className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>In đậm các đề mục nhỏ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setContent((prev) =>
                          `${prev}${prev ? '\n\n' : ''}### 1. Tiêu đề đề mục trọng tâm\n`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-slate-700 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      + Đề mục lớn (###)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setContent((prev) =>
                          `${prev}${prev ? '\n' : ''}**a) Khái niệm trọng tâm:** Nội dung giải thích chi tiết...`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-slate-700 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      + Đề mục nhỏ in đậm (a, b)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setContent((prev) =>
                          `${prev}${prev ? '\n' : ''}Công thức: I = \\frac{U}{R}   |   P = U × I`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                    >
                      + Hộp Công thức (\frac)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormulaTarget('content');
                        setFormulaModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-[11px] font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sigma className="w-3 h-3" /> Chèn Công thức / PTHH
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setContent((prev) =>
                          autoBoldAllSubheadingsInText(formatChemicalAndScientificText(prev).text)
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold shadow-xs cursor-pointer"
                    >
                      Chuẩn hóa Công thức &amp; Đề mục
                    </button>
                  </div>
                </div>
                <textarea
                  ref={contentTextareaRef}
                  rows={9}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                      e.preventDefault();
                      handleApplyBoldToContent();
                    }
                  }}
                  placeholder="Nhập nội dung bài giảng: dùng '### 1. Tên mục' cho đề mục lớn, '**a) Khái niệm:** ...' cho đề mục con in đậm, hoặc bôi đen chữ rồi bấm nút B In đậm..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                {/* Live Preview of Formatted Core Knowledge Content */}
                {content.trim() && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-slate-700 space-y-2.5 max-h-60 overflow-y-auto">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Xem trước hiển thị Nội dung kiến thức trọng tâm (Không lỗi công thức)</span>
                    </div>
                    <div className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                      {content
                        .split(/\r?\n/)
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line, idx) =>
                          /^#{2,3}\s+/.test(line) ? (
                            <h4
                              key={idx}
                              className="font-black text-teal-900 dark:text-teal-300 text-sm pt-2 border-t border-slate-100 dark:border-slate-800 first:border-none first:pt-0"
                            >
                              {renderFormattedMathAndChem(line.replace(/^#{2,3}\s+/, ''))}
                            </h4>
                          ) : (
                            renderStructuredTheoryParagraph(line, idx)
                          )
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA (YouTube & 3D Simulations) */}
          {activeTab === 'media' && (
            <div className="space-y-5 animate-fadeIn">
              {/* YouTube Embedding */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-500" />
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Nhúng Video Bài giảng / Thí nghiệm từ YouTube
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60">
                    Tiết kiệm băng thông Supabase
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Quy định kiến trúc: Không tải video dài trực tiếp lên Supabase Storage để tránh cạn kiệt dung lượng miễn phí. Hãy nhập đường dẫn video YouTube (VD: <code>https://youtu.be/...</code> hoặc Video ID 11 ký tự).
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="Dán link YouTube (VD: https://www.youtube.com/watch?v=... hoặc để trống nếu không có video)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {videoInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setVideoInput('')}
                      className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Xóa liên kết video khỏi bài giảng này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa link Video</span>
                    </button>
                  )}
                </div>

                {/* Video Preview */}
                {parsedYouTubeId ? (
                  <div className="mt-3 aspect-video rounded-xl overflow-hidden bg-black border border-slate-700 shadow-md">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${parsedYouTubeId}`}
                      title="YouTube Video Preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : videoInput ? (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Nếu không phải link YouTube chuẩn, hệ thống sẽ phát trực tiếp dưới dạng tệp video (.mp4 / .webm).
                  </div>
                ) : null}
              </div>

              {/* 3D Simulations selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Atom className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Gắn Trạm Mô phỏng 3D tương tác (Three.js WebGL)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chọn các trạm thực hành ảo để học sinh tương tác trực tiếp trong bài học này:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SIMULATIONS_3D.map((sim) => {
                    const isSelected = selectedSimulations.includes(sim.id);
                    return (
                      <div
                        key={sim.id}
                        onClick={() => toggleSimulation(sim.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                          isSelected
                            ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 dark:border-teal-400 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by parent div
                          className="mt-1 rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase">
                              Lớp {sim.grade} • {sim.category}
                            </span>
                            <span className="text-[10px] text-slate-400">{sim.difficulty}</span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                            {sim.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {sim.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ASSETS (PPTX, PDF, Documents) */}
          {activeTab === 'assets' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Asset Uploader */}
              <AssetUploader
                lessonId={lesson?.id || 'new-lesson'}
                onAssetUploaded={(newAsset) => setAssets((prev) => [...prev, newAsset])}
              />

              {/* Current attached assets list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Danh sách học liệu đã gắn với bài học ({assets.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Lưu metadata vào bảng <code>lesson_assets</code>
                  </span>
                </div>

                {assets.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                    Chưa có học liệu nào được đính kèm. Sử dụng khung tải lên ở trên để thêm Slide PPTX hoặc Phiếu học tập PDF.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
                            {asset.format}
                          </span>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {asset.title}
                            </h5>
                            <span className="text-[10px] text-slate-400">
                              {asset.type} • {asset.fileSize}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAsset(asset.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          title="Gỡ tài liệu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MINI QUIZ (Câu hỏi ôn tập, củng cố kiến thức cuối bài) */}
          {activeTab === 'miniquiz' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Editor Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      {editingQuizIdx !== null
                        ? `Đang chỉnh sửa Câu ${editingQuizIdx + 1}`
                        : 'Thêm câu hỏi ôn tập cuối bài (Trắc nghiệm A–D / Đúng-Sai / Tự luận)'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Hỗ trợ đầy đủ 3 dạng câu hỏi chuẩn GDPT 2018: Nhiều lựa chọn, Đúng/Sai 4 ý và Tự luận.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickPasteOpen((v) => !v)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      {quickPasteOpen
                        ? 'Đóng công cụ chuyển File Word'
                        : 'Công cụ chuyển File Word (.docx) sang 3 dạng'}
                    </button>
                  </div>
                </div>

                {/* Word to 3-Types Converter */}
                {quickPasteOpen && (
                  <LessonWordReviewConverter
                    grade={grade}
                    domain={domain}
                    onImportQuestions={(items: LessonMiniQuizItem[]) => {
                      setMiniQuiz((prev) => [...prev, ...items]);
                      setQuickPasteOpen(false);
                      setErrorMessage(null);
                    }}
                    onClose={() => setQuickPasteOpen(false)}
                  />
                )}

                {/* Question Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    Chọn dạng câu hỏi ôn tập cuối bài:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      [
                        {
                          id: 'single_choice',
                          label: '1. Trắc nghiệm nhiều lựa chọn (A, B, C, D)',
                        },
                        {
                          id: 'true_false',
                          label: '2. Trắc nghiệm Đúng / Sai (4 mệnh đề a, b, c, d)',
                        },
                        {
                          id: 'essay',
                          label: '3. Câu hỏi Tự luận & Hướng dẫn giải',
                        },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setQuizType(t.id)}
                        className={`px-3 py-2 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                          quizType === t.id
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question stem */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Nội dung câu hỏi <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormulaTarget('question');
                        setFormulaModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold flex items-center gap-1 hover:bg-teal-100 cursor-pointer"
                    >
                      <Sigma className="w-3 h-3" /> Chèn công thức / Hóa học
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={quizQuestion}
                    onChange={(e) => setQuizQuestion(e.target.value)}
                    placeholder="Nhập câu hỏi ôn tập cuối bài (VD: Cho 6,5 gam Zn tác dụng hết với dung dịch H2SO4 loãng...)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Type 1: 4 Options A, B, C, D */}
                {quizType === 'single_choice' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Các phương án lựa chọn (Bấm vào chữ cái A, B, C, D để chọn đáp án đúng)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[0, 1, 2, 3].map((optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isCorrect = quizCorrectIdx === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                              isCorrect
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setQuizCorrectIdx(optIdx)}
                              title={`Chọn ${letter} làm đáp án đúng`}
                              className={`w-7 h-7 rounded-lg font-extrabold text-xs flex items-center justify-center shrink-0 transition cursor-pointer ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-100'
                              }`}
                            >
                              {letter}
                            </button>
                            <input
                              type="text"
                              value={quizOptions[optIdx] || ''}
                              onChange={(e) => {
                                const next = [...quizOptions];
                                next[optIdx] = e.target.value;
                                setQuizOptions(next);
                              }}
                              placeholder={`Phương án ${letter}...`}
                              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Type 2: True / False 4 statements */}
                {quizType === 'true_false' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Các mệnh đề a), b), c), d) và đáp án Đúng / Sai cho từng ý:
                    </label>
                    <div className="space-y-2">
                      {quizTfStatements.map((stmt, sIdx) => (
                        <div
                          key={stmt.label}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        >
                          <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {stmt.label})
                          </span>
                          <input
                            type="text"
                            value={stmt.text}
                            onChange={(e) => {
                              const next = [...quizTfStatements];
                              next[sIdx] = { ...next[sIdx], text: e.target.value };
                              setQuizTfStatements(next);
                            }}
                            placeholder={`Nội dung mệnh đề ${stmt.label})...`}
                            className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...quizTfStatements];
                                next[sIdx] = { ...next[sIdx], isTrue: true };
                                setQuizTfStatements(next);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                                stmt.isTrue
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              Đúng
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...quizTfStatements];
                                next[sIdx] = { ...next[sIdx], isTrue: false };
                                setQuizTfStatements(next);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                                !stmt.isTrue
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type 3: Essay Sample Answer */}
                {quizType === 'essay' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Đáp án chuẩn / Hướng dẫn chấm tự luận:
                    </label>
                    <textarea
                      rows={3}
                      value={quizSampleAnswer}
                      onChange={(e) => setQuizSampleAnswer(e.target.value)}
                      placeholder="Nhập các bước giải tự luận, PTHH hoặc công thức tính..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}

                {/* Concise Explanation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Giải thích ngắn gọn / Trọng tâm kiến thức
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormulaTarget('explanation');
                        setFormulaModalOpen(true);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-slate-300 cursor-pointer"
                    >
                      <Sigma className="w-3 h-3" /> Chèn công thức
                    </button>
                  </div>
                  <input
                    type="text"
                    value={quizExplanation}
                    onChange={(e) => setQuizExplanation(e.target.value)}
                    placeholder="VD: PTHH: Zn + H2SO4 → ZnSO4 + H2↑. Theo định luật bảo toàn mol..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {editingQuizIdx !== null && (
                    <button
                      type="button"
                      onClick={resetQuizDraft}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    >
                      Hủy sửa
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveQuizItem}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {editingQuizIdx !== null
                      ? `Cập nhật Câu ${editingQuizIdx + 1}`
                      : 'Thêm vào danh sách câu hỏi cuối bài'}
                  </button>
                </div>
              </div>

              {/* List of current miniQuiz items */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Danh sách câu hỏi củng cố của bài học ({miniQuiz.length} câu)
                  </h4>
                </div>

                {miniQuiz.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                    Chưa có câu hỏi ôn tập cuối bài nào. Hãy nhập ở khung trên hoặc bấm &quot;Công cụ chuyển File Word (.docx) sang 3 dạng&quot;.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {miniQuiz.map((item, idx) => {
                      const qType: LessonReviewQuestionType = item.questionType || 'single_choice';
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400">
                                Câu {idx + 1}:
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                  qType === 'true_false'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : qType === 'essay'
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : 'bg-sky-50 text-sky-800 border-sky-200'
                                }`}
                              >
                                {qType === 'true_false'
                                  ? 'Trắc nghiệm Đúng / Sai'
                                  : qType === 'essay'
                                  ? 'Tự luận'
                                  : 'Trắc nghiệm nhiều lựa chọn'}
                              </span>
                            </div>

                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                              {renderFormattedMathAndChem(item.question)}
                            </div>

                            {qType === 'single_choice' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                {(item.options || []).map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className={`text-[11px] px-2.5 py-1 rounded-lg border ${
                                      oIdx === item.correctIndex
                                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold'
                                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    <span className="font-extrabold mr-1">
                                      {String.fromCharCode(65 + oIdx)}.
                                    </span>
                                    {renderFormattedMathAndChem(opt)}
                                  </div>
                                ))}
                              </div>
                            )}

                            {qType === 'true_false' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                {normalizeTrueFalseStatements(
                                  item.trueFalseStatements,
                                  item.options
                                ).map((stmt) => (
                                  <div
                                    key={stmt.label}
                                    className="text-[11px] px-2.5 py-1 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2"
                                  >
                                    <span className="truncate">
                                      <strong className="mr-1">{stmt.label})</strong>
                                      {renderFormattedMathAndChem(stmt.text)}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                                        stmt.isTrue
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-rose-600 text-white'
                                      }`}
                                    >
                                      {stmt.isTrue ? 'Đúng' : 'Sai'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {qType === 'essay' && (
                              <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-200">
                                <strong>Đáp án chuẩn:</strong>{' '}
                                {renderFormattedMathAndChem(
                                  item.sampleAnswer || item.explanation || ''
                                )}
                              </div>
                            )}

                            {item.explanation && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                                <strong className="text-teal-700 dark:text-teal-300">
                                  Giải thích:
                                </strong>{' '}
                                {renderFormattedMathAndChem(item.explanation)}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditQuizItem(idx)}
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/60"
                              title="Sửa câu hỏi này"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuizItem(idx)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60"
                              title="Xóa câu hỏi này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              * Đừng quên bấm &quot;{isEditing ? 'Cập nhật bài học' : 'Lưu và Xuất bản'}&quot; để lưu toàn bộ thay đổi
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Cập nhật bài học' : 'Lưu và Xuất bản'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <FormulaEditorModal
        isOpen={formulaModalOpen}
        onClose={() => setFormulaModalOpen(false)}
        onInsertFormula={(formulaText: string) => {
          if (formulaTarget === 'question') {
            setQuizQuestion((prev) => `${prev}${prev ? ' ' : ''}${formulaText}`);
          } else if (formulaTarget === 'content') {
            setContent((prev) => `${prev}${prev ? '\n' : ''}${formulaText}`);
          } else {
            setQuizExplanation((prev) => `${prev}${prev ? ' ' : ''}${formulaText}`);
          }
          setFormulaModalOpen(false);
        }}
      />
    </div>
  );
};

export const LessonFormModal: React.FC<LessonFormModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <LessonFormModalContent
      lesson={props.lesson}
      initialTab={props.initialTab}
      onClose={props.onClose}
      onSaved={props.onSaved}
    />
  );
};

