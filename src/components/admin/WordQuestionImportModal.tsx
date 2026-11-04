import React, { useState } from 'react';
import * as mammoth from 'mammoth';
import { Grade, SubjectDomain, QuizQuestion, QuizMeta, QuestionType } from '../../types/index.ts';
import {
  ParsedWordQuestion,
  parseWordContentToQuestions,
  generateDetailedExplanation,
  generateStepByStepSolution,
  parseExplanationIntoSteps,
  SAMPLE_WORD_QUIZ_TEXT,
} from '../../utils/wordQuestionParser.ts';
import {
  saveAdminQuestionsBulk,
  saveAdminQuiz,
} from '../../services/adminService.ts';
import { ScientificSolutionView } from '../common/ScientificSolutionView.tsx';
import {
  X,
  FileUp,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Save,
  Download,
  BookOpen,
  Wand2,
  Check,
  ImagePlus,
  ListChecks,
} from 'lucide-react';

interface WordQuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGrade?: Grade;
  defaultDomain?: SubjectDomain;
  onImported: (result: {
    savedQuestions: QuizQuestion[];
    createdQuiz?: QuizMeta;
  }) => void;
}

export const WordQuestionImportModal: React.FC<WordQuestionImportModalProps> = ({
  isOpen,
  onClose,
  defaultGrade = 8,
  defaultDomain = 'hoa-hoc',
  onImported,
}) => {
  const [rawText, setRawText] = useState('');
  const [htmlContent, setHtmlContent] = useState<string | undefined>(undefined);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Conversion settings
  const [fallbackGrade, setFallbackGrade] = useState<Grade>(defaultGrade);
  const [fallbackDomain, setFallbackDomain] = useState<SubjectDomain>(defaultDomain);
  const [autoStandardizeIupac, setAutoStandardizeIupac] = useState(true);

  // Parsed questions preview state
  const [parsedQuestions, setParsedQuestions] = useState<ParsedWordQuestion[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parseStats, setParseStats] = useState<{
    totalParsed: number;
    autoExplainedCount: number;
    iupacNormalizedCount: number;
    essayCount?: number;
  } | null>(null);

  // Option to also create a new QuizMeta exam
  const [createNewExam, setCreateNewExam] = useState(true);
  const [newExamTitle, setNewExamTitle] = useState('Đề kiểm tra KHTN (Nhập từ Word)');
  const [newExamDuration, setNewExamDuration] = useState(15);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const runParse = (
    textToParse: string,
    htmlToParse?: string,
    gradeOverride = fallbackGrade,
    domainOverride = fallbackDomain,
    iupacOverride = autoStandardizeIupac
  ) => {
    const res = parseWordContentToQuestions(textToParse, {
      htmlContent: htmlToParse,
      defaultGrade: gradeOverride,
      defaultDomain: domainOverride,
      autoStandardizeIupac: iupacOverride,
    });
    setParsedQuestions(res.questions);
    setParseWarnings(res.warnings);
    setParseStats(res.stats);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setIsReadingFile(true);
    setUploadedFileName(file.name);

    const baseTitle = file.name.replace(/\.(docx|doc|txt)$/i, '').replace(/[_-]+/g, ' ');
    if (baseTitle.trim()) {
      setNewExamTitle(`Đề KHTN: ${baseTitle.trim()}`);
    }

    try {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const [rawResult, htmlResult] = await Promise.all([
          mammoth.extractRawText({ arrayBuffer }),
          mammoth.convertToHtml({ arrayBuffer }),
        ]);
        const extractedText = rawResult.value || '';
        const extractedHtml = htmlResult.value || '';
        setRawText(extractedText);
        setHtmlContent(extractedHtml);
        runParse(extractedText, extractedHtml);
      } else {
        const text = await file.text();
        setRawText(text);
        setHtmlContent(undefined);
        runParse(text, undefined);
      }
    } catch (err: any) {
      console.error('Error reading Word file:', err);
      setFileError(
        'Không thể đọc tệp trực tiếp. Vui lòng đảm bảo tệp có định dạng .docx chuẩn hoặc sao chép nội dung từ Word dán vào ô bên dưới.'
      );
    } finally {
      setIsReadingFile(false);
      e.target.value = '';
    }
  };

  const handleLoadSampleWord = () => {
    setFileError(null);
    setUploadedFileName('De_Kiem_Tra_KHTN_Trac_Nghiem_Tu_Luan_Mau.docx');
    setNewExamTitle('Đề Kiểm Tra KHTN Tổng Hợp (Trắc Nghiệm + Tự Luận Từ Word)');
    setRawText(SAMPLE_WORD_QUIZ_TEXT);
    setHtmlContent(undefined);
    runParse(SAMPLE_WORD_QUIZ_TEXT, undefined);
  };

  const handleDownloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_WORD_QUIZ_TEXT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_De_KHTN_Trac_Nghiem_Va_Tu_Luan.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateQuestionField = (
    idx: number,
    patch: Partial<ParsedWordQuestion>,
    regenerateExp = false
  ) => {
    setParsedQuestions((prev) => {
      const next = [...prev];
      const updated = { ...next[idx], ...patch };

      // Ensure options exist if switched from essay to single_choice
      if (
        patch.questionType &&
        patch.questionType !== 'essay' &&
        (!updated.options || updated.options.length === 0)
      ) {
        updated.options = ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];
      }
      if (patch.questionType === 'essay') {
        updated.allowImageUpload = true;
        updated.detectedAnswerSource = 'essay_rubric';
      }

      if (regenerateExp) {
        const steps = generateStepByStepSolution({
          question: updated.question,
          options: updated.options,
          correctAnswer: updated.correctAnswer ?? 0,
          questionType: updated.questionType,
          domain: updated.domain,
          grade: updated.grade,
        });
        updated.solutionSteps = steps;
        updated.explanation = generateDetailedExplanation({
          question: updated.question,
          options: updated.options,
          correctAnswer: updated.correctAnswer ?? 0,
          questionType: updated.questionType,
          domain: updated.domain,
          grade: updated.grade,
        });
        updated.autoGeneratedExplanation = true;
      }
      next[idx] = updated;
      return next;
    });
  };

  const handleRegenerateAllExplanations = () => {
    setParsedQuestions((prev) =>
      prev.map((q) => {
        const steps = generateStepByStepSolution({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer ?? 0,
          questionType: q.questionType,
          domain: q.domain,
          grade: q.grade,
        });
        return {
          ...q,
          solutionSteps: steps,
          explanation: generateDetailedExplanation({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer ?? 0,
            questionType: q.questionType,
            domain: q.domain,
            grade: q.grade,
          }),
          autoGeneratedExplanation: true,
        };
      })
    );
  };

  const handleRemoveQuestion = (idx: number) => {
    setParsedQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAll = async () => {
    if (parsedQuestions.length === 0) return;
    setIsSaving(true);
    try {
      let createdQuiz: QuizMeta | undefined;
      const targetQuizId = createNewExam ? `quiz-word-${Date.now()}` : undefined;

      const questionsToSave = parsedQuestions.map((q, idx) => {
        const qType = q.questionType || 'single_choice';
        const steps = parseExplanationIntoSteps(q.explanation, q.solutionSteps, {
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          questionType: qType,
          domain: q.domain,
          grade: q.grade,
        });
        return {
          id: q.id || `q-word-${Date.now()}-${idx + 1}`,
          topicId: targetQuizId,
          grade: q.grade,
          domain: q.domain,
          question: q.question,
          questionType: qType,
          options: qType === 'essay' ? [] : q.options,
          correctAnswer: q.correctAnswer ?? 0,
          explanation:
            q.explanation?.trim() ||
            generateDetailedExplanation({
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer ?? 0,
              questionType: qType,
              domain: q.domain,
              grade: q.grade,
            }),
          solutionSteps: steps,
          sampleAnswer: q.sampleAnswer || (qType === 'essay' ? steps.join('\n') : undefined),
          allowImageUpload: qType === 'essay' ? true : q.allowImageUpload,
          difficulty: q.difficulty,
          hint: q.hint,
          points: qType === 'essay' ? 2.5 : 1.5,
        };
      });

      const savedQuestions = await saveAdminQuestionsBulk(questionsToSave);

      if (createNewExam && targetQuizId) {
        const primaryGrade = savedQuestions[0]?.grade || fallbackGrade;
        const primaryDomain = savedQuestions[0]?.domain || fallbackDomain;
        createdQuiz = await saveAdminQuiz({
          id: targetQuizId,
          title: newExamTitle.trim() || `Đề kiểm tra KHTN (${savedQuestions.length} câu)`,
          grade: primaryGrade,
          domain: primaryDomain,
          durationMinutes: newExamDuration || 15,
          passScore: 6.0,
          questionCount: savedQuestions.length,
          description: `Bộ đề được chuyển đổi tự động từ file Word (${
            uploadedFileName || 'Văn bản Word'
          }) kèm hướng dẫn giải từng bước và câu hỏi tự luận nộp ảnh.`,
          isPublished: true,
        });
      }

      onImported({ savedQuestions, createdQuiz });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const sourceBadges: Record<ParsedWordQuestion['detectedAnswerSource'], { label: string; color: string }> = {
    explicit_key: { label: 'Từ dòng Đáp án', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    asterisk: { label: 'Từ dấu * trong Word', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' },
    formatting: { label: 'Từ chữ In đậm/Gạch chân', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
    answer_table: { label: 'Từ Bảng đáp án cuối file', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
    knowledge_inference: { label: 'Tự nhận diện kiến thức KHTN', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    essay_rubric: { label: 'Tự luận (Học sinh tải ảnh bài làm)', color: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300' },
    default_first: { label: 'Mặc định A (chọn lại nếu cần)', color: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 via-sky-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <FileUp className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>Nhập Câu Hỏi Từ File Word (.docx) & Tạo Hướng Dẫn Giải Từng Bước</span>
              </h2>
              <p className="text-xs text-teal-100/90">
                Hỗ trợ cả Trắc nghiệm & Tự luận (cho phép học sinh tải ảnh bài làm), chuẩn hóa IUPAC và hướng dẫn giải từng bước
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-700 dark:text-slate-200">
          {/* Step 1: Upload Word File or Paste */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Upload Box (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="border-2 border-dashed border-teal-500/60 dark:border-teal-600/50 rounded-2xl p-5 bg-teal-50/40 dark:bg-teal-950/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600/15 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto">
                  {isReadingFile ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <FileUp className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    1. Tải lên tệp Word (.docx, .txt)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tự động nhận diện câu hỏi <strong>Trắc nghiệm</strong> (A, B, C, D) và câu hỏi <strong>Tự luận</strong> (cho phép học sinh chụp ảnh bài làm tải lên)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition">
                    <FileUp className="w-4 h-4" />
                    <span>{isReadingFile ? 'Đang đọc file Word...' : 'Chọn file Word (.docx)'}</span>
                    <input
                      type="file"
                      accept=".docx,.doc,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleLoadSampleWord}
                    data-testid="load-sample-word-btn"
                    className="px-3.5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Dùng thử Đề Word mẫu (6 câu)</span>
                  </button>
                </div>

                {uploadedFileName && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Đã nạp: {uploadedFileName}</span>
                  </div>
                )}

                {fileError && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[11px]">
                    {fileError}
                  </div>
                )}
              </div>

              {/* Default Metadata & IUPAC Settings */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 dark:text-white">
                    Cấu hình chuyển đổi tự động
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadSampleTemplate}
                    className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải file mẫu</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Khối lớp mặc định
                    </label>
                    <select
                      value={fallbackGrade}
                      onChange={(e) => {
                        const g = Number(e.target.value) as Grade;
                        setFallbackGrade(g);
                        if (rawText.trim()) runParse(rawText, htmlContent, g, fallbackDomain, autoStandardizeIupac);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
                    >
                      <option value={6}>KHTN Lớp 6</option>
                      <option value={7}>KHTN Lớp 7</option>
                      <option value={8}>KHTN Lớp 8</option>
                      <option value={9}>KHTN Lớp 9</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Phân môn mặc định
                    </label>
                    <select
                      value={fallbackDomain}
                      onChange={(e) => {
                        const d = e.target.value as SubjectDomain;
                        setFallbackDomain(d);
                        if (rawText.trim()) runParse(rawText, htmlContent, fallbackGrade, d, autoStandardizeIupac);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
                    >
                      <option value="hoa-hoc">Hóa học</option>
                      <option value="vat-li">Vật lí</option>
                      <option value="sinh-hoc">Sinh học</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={autoStandardizeIupac}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAutoStandardizeIupac(checked);
                      if (rawText.trim()) runParse(rawText, htmlContent, fallbackGrade, fallbackDomain, checked);
                    }}
                    className="rounded accent-teal-600 w-4 h-4"
                  />
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Tự động chuẩn hóa tên Hóa học sang chuẩn quốc tế IUPAC (GDPT 2018)
                  </span>
                </label>
              </div>
            </div>

            {/* Right Text Paste / Raw Content Area (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-800 dark:text-white">
                  2. Nội dung văn bản từ Word (có thể dán trực tiếp hoặc chỉnh sửa nhanh):
                </label>
                <button
                  type="button"
                  onClick={() => runParse(rawText, htmlContent)}
                  className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Phân tích & Tạo hướng dẫn giải từng bước</span>
                </button>
              </div>

              <textarea
                rows={10}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                }}
                placeholder={`Dán nội dung câu hỏi copy từ Word vào đây hoặc bấm "Chọn file Word (.docx)" ở bên trái...\nHỗ trợ cả Trắc nghiệm (A, B, C, D) và Tự luận (Câu 5 (Tự luận): ...)`}
                className="w-full flex-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Step 2: Parsed Questions & Step-by-Step Explanations Preview */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              {/* Summary Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                      Đã chuyển đổi thành công {parsedQuestions.length} câu hỏi sang chuẩn Web!
                    </h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Trắc nghiệm: <strong>{parsedQuestions.filter((q) => q.questionType !== 'essay').length}</strong> câu • Tự luận (cho phép tải ảnh): <strong>{parsedQuestions.filter((q) => q.questionType === 'essay').length}</strong> câu • Hướng dẫn giải từng bước: <strong>{parsedQuestions.length}</strong> câu.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRegenerateAllExplanations}
                  className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>Làm giàu hướng dẫn giải từng bước tất cả câu</span>
                </button>
              </div>

              {parseWarnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 space-y-1">
                  {parseWarnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Create Exam Option Box */}
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createNewExam}
                    onChange={(e) => setCreateNewExam(e.target.checked)}
                    className="rounded accent-teal-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">
                      Đồng thời tạo thành 1 Bộ Đề Kiểm Tra mới trên trang Luyện tập (/luyen-tap)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Học sinh có thể làm trắc nghiệm, tải ảnh bài giải tự luận và xem hướng dẫn giải từng bước ngay sau khi nộp bài
                    </span>
                  </div>
                </label>

                {createNewExam && (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={newExamTitle}
                      onChange={(e) => setNewExamTitle(e.target.value)}
                      placeholder="Tên bộ đề kiểm tra..."
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs w-64"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={5}
                        max={90}
                        value={newExamDuration}
                        onChange={(e) => setNewExamDuration(Number(e.target.value))}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs w-16 text-center"
                      />
                      <span className="text-[11px] font-semibold text-slate-500">phút</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {parsedQuestions.map((q, qIdx) => {
                  const badge = sourceBadges[q.detectedAnswerSource] || sourceBadges.default_first;
                  const isEssay = q.questionType === 'essay';
                  const stepsList = parseExplanationIntoSteps(q.explanation, q.solutionSteps, {
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    questionType: q.questionType,
                    domain: q.domain,
                    grade: q.grade,
                  });

                  return (
                    <div
                      key={q.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-teal-700 text-white font-mono font-extrabold text-xs">
                            Câu {qIdx + 1}
                          </span>

                          {/* Question Type Selector */}
                          <select
                            value={q.questionType || 'single_choice'}
                            onChange={(e) =>
                              handleUpdateQuestionField(
                                qIdx,
                                { questionType: e.target.value as QuestionType },
                                true
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg border font-extrabold text-xs ${
                              isEssay
                                ? 'bg-violet-50 dark:bg-violet-950/70 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-200'
                                : 'bg-teal-50 dark:bg-teal-950/70 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200'
                            }`}
                          >
                            <option value="single_choice">Trắc nghiệm (4 lựa chọn)</option>
                            <option value="essay">Tự luận (Học sinh tải ảnh bài làm)</option>
                            <option value="true_false">Đúng / Sai</option>
                          </select>

                          <select
                            value={q.grade}
                            onChange={(e) =>
                              handleUpdateQuestionField(
                                qIdx,
                                { grade: Number(e.target.value) as Grade },
                                true
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                          >
                            <option value={6}>Lớp 6</option>
                            <option value={7}>Lớp 7</option>
                            <option value={8}>Lớp 8</option>
                            <option value={9}>Lớp 9</option>
                          </select>

                          <select
                            value={q.domain}
                            onChange={(e) =>
                              handleUpdateQuestionField(
                                qIdx,
                                { domain: e.target.value as SubjectDomain },
                                true
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs"
                          >
                            <option value="hoa-hoc">Hóa học</option>
                            <option value="vat-li">Vật lí</option>
                            <option value="sinh-hoc">Sinh học</option>
                          </select>

                          <select
                            value={q.difficulty}
                            onChange={(e) =>
                              handleUpdateQuestionField(qIdx, {
                                difficulty: e.target.value as any,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs"
                          >
                            <option value="Nhận biết">Nhận biết</option>
                            <option value="Thông hiểu">Thông hiểu</option>
                            <option value="Vận dụng">Vận dụng</option>
                          </select>

                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                          title="Xóa câu này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Question Stem */}
                      <div>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) =>
                            handleUpdateQuestionField(qIdx, { question: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
                        />
                      </div>

                      {/* Options or Essay Image Upload Indicator */}
                      {isEssay ? (
                        <div className="p-3.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 text-violet-900 dark:text-violet-200">
                            <ImagePlus className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
                            <div>
                              <span className="font-extrabold block text-xs">
                                Chế độ Câu hỏi Tự luận: Cho phép học sinh tải file ảnh bài giải (.jpg, .png) & nhập lời giải
                              </span>
                              <span className="text-[11px] text-violet-700 dark:text-violet-300">
                                Học sinh có thể chụp ảnh vở làm bài tự luận tải lên và đối chiếu trực tiếp với các bước giải bên dưới.
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-violet-600 text-white font-bold text-[11px] shrink-0">
                            Hỗ trợ tải ảnh bài làm
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = (q.correctAnswer ?? 0) === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                                  isCorrect
                                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700'
                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateQuestionField(
                                      qIdx,
                                      {
                                        correctAnswer: optIdx,
                                        detectedAnswerSource: 'explicit_key',
                                      },
                                      true
                                    )
                                  }
                                  className={`w-6 h-6 rounded-lg font-extrabold text-xs flex items-center justify-center shrink-0 transition cursor-pointer ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-teal-600 hover:text-white'
                                  }`}
                                  title="Bấm để chọn làm đáp án đúng"
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </button>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const nextOpts = [...q.options];
                                    nextOpts[optIdx] = e.target.value;
                                    handleUpdateQuestionField(qIdx, { options: nextOpts });
                                  }}
                                  className="flex-1 bg-transparent border-0 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none"
                                />
                                {isCorrect && (
                                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Detailed Step-by-Step Explanation Box */}
                      <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                            <ListChecks className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            <span>
                              Lời giải chi tiết bài tập{' '}
                              {q.autoGeneratedExplanation ? '(Đã tự động giải bài tập)' : '(Trích xuất lời giải từ Word)'}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestionField(qIdx, {}, true)}
                            className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Wand2 className="w-3 h-3" />
                            <span>
                              {isEssay
                                ? 'Giải lại chi tiết bài tự luận này'
                                : `Giải lại chi tiết theo đáp án ${String.fromCharCode(65 + (q.correctAnswer ?? 0))}`}
                            </span>
                          </button>
                        </div>

                        {/* Visual Textbook Solution Preview */}
                        {stepsList.length > 0 && (
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#c8dfee] dark:border-slate-700">
                            <ScientificSolutionView
                              steps={stepsList}
                              questionText={q.question}
                            />
                          </div>
                        )}

                        <textarea
                          rows={3}
                          value={q.explanation}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateQuestionField(qIdx, {
                              explanation: val,
                              solutionSteps: parseExplanationIntoSteps(val, undefined, {
                                question: q.question,
                                options: q.options,
                                correctAnswer: q.correctAnswer,
                                questionType: q.questionType,
                                domain: q.domain,
                                grade: q.grade,
                              }),
                              autoGeneratedExplanation: false,
                            });
                          }}
                          placeholder="Nhập các bước giải (Bước 1: ..., Bước 2: ..., Bước 3: ...)..."
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-teal-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>
              {parsedQuestions.length > 0
                ? `Sẵn sàng lưu ${parsedQuestions.length} câu hỏi có hướng dẫn giải từng bước vào hệ thống.`
                : 'Hãy chọn tệp Word (.docx) hoặc bấm "Dùng thử Đề Word mẫu (6 câu)" để bắt đầu.'}
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={parsedQuestions.length === 0 || isSaving}
              onClick={handleSaveAll}
              data-testid="save-imported-word-questions-btn"
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Đang lưu...'
                  : createNewExam
                  ? `Lưu ${parsedQuestions.length} câu hỏi & Tạo Bộ Đề`
                  : `Lưu ${parsedQuestions.length} câu hỏi vào Ngân hàng`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
