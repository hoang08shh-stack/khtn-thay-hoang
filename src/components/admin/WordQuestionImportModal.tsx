import React, { useState, useRef } from 'react';
import * as mammoth from 'mammoth';
import {
  Grade,
  SubjectDomain,
  QuizQuestion,
  QuizMeta,
  QuestionType,
  TrueFalseStatement,
} from '../../types/index.ts';
import {
  ParsedWordQuestion,
  QuestionValidationStatus,
  computeQuestionValidationStatus,
  regenerateImportedQuestion,
  generateStructured4StepSolution,
  parseWordContentToQuestions,
  generateDetailedExplanation,
  generateScientificSolution,
  parseExplanationIntoSteps,
  extractFormattedTextFromMammothHtml,
  formatChemicalAndScientificText,
  SAMPLE_WORD_QUIZ_TEXT,
  SAMPLE_WORD_4_TYPES_TEXT,
} from '../../utils/wordQuestionParser.ts';
import {
  saveAdminQuestion,
  saveAdminQuestionsBulk,
  saveAdminQuiz,
} from '../../services/adminService.ts';
import {
  ScientificSolutionView,
  renderFormattedMathAndChem,
} from '../common/ScientificSolutionView.tsx';
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
  Eye,
  ShieldCheck,
  Table,
  Plus,
  CheckSquare,
  Square,
  Edit3,
  Layers,
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

const VALIDATION_BADGES: Record<
  QuestionValidationStatus,
  { label: string; color: string; dotColor: string }
> = {
  valid: {
    label: 'Hợp lệ',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  has_explanation: {
    label: 'Có lời giải',
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    dotColor: 'bg-teal-500',
  },
  missing_answer: {
    label: 'Thiếu đáp án',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-500',
  },
  needs_review: {
    label: 'Cần kiểm tra',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    dotColor: 'bg-orange-500',
  },
  format_error: {
    label: 'Lỗi định dạng',
    color: 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800',
    dotColor: 'bg-red-500',
  },
};

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: 'Dạng 1: Trắc nghiệm A-D',
  multiple_choice: 'Dạng 1: Chọn nhiều ĐA',
  true_false: 'Dạng 2: Đúng/Sai (a,b,c,d)',
  short_answer: 'Dạng 3: Trả lời ngắn',
  essay: 'Dạng 4: Tự luận',
};

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
  const [parseProgress, setParseProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Conversion settings
  const [fallbackGrade, setFallbackGrade] = useState<Grade>(defaultGrade);
  const [fallbackDomain, setFallbackDomain] = useState<SubjectDomain>(defaultDomain);
  const [autoStandardizeIupac, setAutoStandardizeIupac] = useState(true);

  // Parsed questions preview state
  const [parsedQuestions, setParsedQuestions] = useState<ParsedWordQuestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'two_pane' | 'all_list'>('two_pane');
  const [showRawWordSource, setShowRawWordSource] = useState<Record<string, boolean>>({});
  const [savedSingleIds, setSavedSingleIds] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Bulk assignment controls
  const [bulkGrade, setBulkGrade] = useState<Grade>(defaultGrade);
  const [bulkDomain, setBulkDomain] = useState<SubjectDomain>(defaultDomain);
  const [bulkDifficulty, setBulkDifficulty] = useState<'Nhận biết' | 'Thông hiểu' | 'Vận dụng'>('Thông hiểu');
  const [bulkPoints, setBulkPoints] = useState<number>(1.0);

  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parseStats, setParseStats] = useState<{
    totalParsed: number;
    autoExplainedCount: number;
    iupacNormalizedCount: number;
    essayCount?: number;
    trueFalseCount?: number;
    shortAnswerCount?: number;
    mcqCount?: number;
  } | null>(null);

  // Option to also create a new QuizMeta exam
  const [createNewExam, setCreateNewExam] = useState(true);
  const [newExamTitle, setNewExamTitle] = useState('Đề kiểm tra KHTN (Nhập từ Word)');
  const [newExamDuration, setNewExamDuration] = useState(15);
  const [isSaving, setIsSaving] = useState(false);

  const questionInputRef = useRef<HTMLTextAreaElement | null>(null);

  if (!isOpen) return null;

  const isQuestionValidToSave = (q: ParsedWordQuestion): boolean => {
    const status = computeQuestionValidationStatus(q);
    return status === 'valid' || status === 'has_explanation';
  };

  const pendingReviewCount = parsedQuestions.filter((q) => !isQuestionValidToSave(q)).length;
  const validQuestionsCount = parsedQuestions.filter((q) => isQuestionValidToSave(q)).length;

  const runParse = (
    textToParse: string,
    htmlToParse?: string,
    gradeOverride = fallbackGrade,
    domainOverride = fallbackDomain,
    iupacOverride = autoStandardizeIupac,
    docName = uploadedFileName
  ) => {
    setParseProgress(40);
    setStatusMessage('Đang phân tích cấu trúc câu hỏi, công thức Hóa học và đáp án...');
    const res = parseWordContentToQuestions(textToParse, {
      htmlContent: htmlToParse,
      defaultGrade: gradeOverride,
      defaultDomain: domainOverride,
      autoStandardizeIupac: iupacOverride,
      sourceDocumentName: docName || 'Văn bản Word',
    });
    setParsedQuestions(res.questions);
    setSelectedIdx(0);
    setSelectedIds(new Set(res.questions.map((q) => q.id)));
    setHasUnsavedChanges(res.questions.length > 0);
    setParseWarnings(
      res.warnings.filter(
        (warning) =>
          !res.questions.some((q) =>
            q.solutionWarnings?.some((message) => warning.endsWith(message))
          )
      )
    );
    setParseStats(res.stats);
    setParseProgress(100);
    setStatusMessage(`Đã bóc tách thành công ${res.questions.length} câu hỏi từ tài liệu.`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setIsReadingFile(true);
    setParseProgress(15);
    setStatusMessage(`Đang đọc tệp ${file.name}...`);
    setUploadedFileName(file.name);

    const baseTitle = file.name.replace(/\.(docx|doc|txt)$/i, '').replace(/[_-]+/g, ' ');
    if (baseTitle.trim()) {
      setNewExamTitle(`Đề KHTN: ${baseTitle.trim()}`);
    }

    try {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        setParseProgress(35);
        const [rawResult, htmlResult] = await Promise.all([
          mammoth.extractRawText({ arrayBuffer }),
          mammoth.convertToHtml({ arrayBuffer }),
        ]);
        const extractedHtml = htmlResult.value || '';
        const extractedText = extractFormattedTextFromMammothHtml(
          extractedHtml,
          rawResult.value || ''
        );
        const formattedRaw = formatChemicalAndScientificText(extractedText).text;
        setRawText(formattedRaw);
        setHtmlContent(extractedHtml);
        runParse(formattedRaw, extractedHtml, fallbackGrade, fallbackDomain, autoStandardizeIupac, file.name);
      } else {
        const text = await file.text();
        const formattedRaw = formatChemicalAndScientificText(text).text;
        setRawText(formattedRaw);
        setHtmlContent(undefined);
        runParse(formattedRaw, undefined, fallbackGrade, fallbackDomain, autoStandardizeIupac, file.name);
      }
    } catch (err: any) {
      console.error('Error reading Word file:', err);
      setFileError(
        'Không thể đọc tệp trực tiếp. Vui lòng đảm bảo tệp có định dạng .docx chuẩn hoặc sao chép nội dung từ Word dán vào ô bên dưới.'
      );
      setParseProgress(0);
      setStatusMessage(null);
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
    runParse(SAMPLE_WORD_QUIZ_TEXT, undefined, fallbackGrade, fallbackDomain, autoStandardizeIupac, 'De_Kiem_Tra_KHTN_Trac_Nghiem_Tu_Luan_Mau.docx');
  };

  const handleLoadSample4Types = () => {
    setFileError(null);
    setUploadedFileName('De_KHTN_4_Dang_GDPT_2018_Mau.docx');
    setNewExamTitle('Đề Kiểm Tra KHTN Đầy Đủ 4 Dạng Chuẩn GDPT 2018');
    setRawText(SAMPLE_WORD_4_TYPES_TEXT);
    setHtmlContent(undefined);
    runParse(SAMPLE_WORD_4_TYPES_TEXT, undefined, fallbackGrade, fallbackDomain, autoStandardizeIupac, 'De_KHTN_4_Dang_GDPT_2018_Mau.docx');
  };

  const handleDownloadSampleTemplate = () => {
    const blob = new Blob([SAMPLE_WORD_4_TYPES_TEXT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_De_KHTN_4_Dang_GDPT_2018.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateQuestionField = (
    idx: number,
    patch: Partial<ParsedWordQuestion>,
    regenerateExp = false
  ) => {
    setHasUnsavedChanges(true);
    setParsedQuestions((prev) => {
      const next = [...prev];
      if (!next[idx]) return prev;
      const current = next[idx];
      const updated: ParsedWordQuestion = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      // Handle questionType transitions cleanly
      if (patch.questionType && patch.questionType !== current.questionType) {
        if (patch.questionType === 'single_choice' || patch.questionType === 'multiple_choice') {
          if (!updated.options || updated.options.length < 2) {
            updated.options = ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];
          }
          if (typeof updated.correctAnswer !== 'number' || updated.correctAnswer < 0) {
            updated.correctAnswer = 0;
          }
        } else if (patch.questionType === 'true_false') {
          if (!updated.trueFalseStatements || updated.trueFalseStatements.length === 0) {
            const labels: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
            updated.trueFalseStatements = labels.map((lbl, i) => ({
              id: `${updated.id}_tf_${lbl}`,
              label: lbl,
              text: updated.options?.[i] || `Phát biểu ${lbl}`,
              isTrue: i % 2 === 0,
              explanation: '',
            }));
          }
          updated.options = updated.trueFalseStatements.map((s) => `${s.label}) ${s.text}`);
        } else if (patch.questionType === 'short_answer') {
          updated.options = [];
          updated.shortAnswer = updated.shortAnswer || '';
          updated.shortAnswerTolerance = updated.shortAnswerTolerance ?? 0.02;
        } else if (patch.questionType === 'essay') {
          updated.options = [];
          updated.allowImageUpload = true;
          updated.detectedAnswerSource = 'essay_rubric';
          updated.rubric =
            updated.rubric ||
            'Nêu đúng công thức/phương trình: 40% điểm; Thay số và đổi đơn vị đúng: 40% điểm; Kết luận chính xác kèm đơn vị: 20% điểm.';
        }
      }

      const contentChanged =
        patch.question !== undefined ||
        patch.options !== undefined ||
        patch.trueFalseStatements !== undefined ||
        patch.shortAnswer !== undefined;

      if (regenerateExp) {
        next[idx] = regenerateImportedQuestion(updated, Object.keys(patch).length > 0);
        return next;
      }

      if (contentChanged) {
        updated.solutionStatus = 'needs_review';
        updated.solutionWarnings = [
          'Đề hoặc phương án đã thay đổi. Hãy tạo lại và kiểm tra lời giải trước khi lưu.',
        ];
      }
      updated.validationStatus = computeQuestionValidationStatus(updated);
      next[idx] = updated;
      return next;
    });
  };

  const handleGenerateAiSolutionForQuestion = (idx: number) => {
    setHasUnsavedChanges(true);
    setParsedQuestions((prev) => {
      const next = [...prev];
      if (!next[idx]) return prev;
      next[idx] = generateStructured4StepSolution(next[idx]);
      return next;
    });
  };

  const handleApproveSolutionForQuestion = (idx: number) => {
    setHasUnsavedChanges(true);
    setParsedQuestions((prev) => {
      const next = [...prev];
      if (!next[idx]) return prev;
      const q = { ...next[idx], approvalStatus: 'approved' as const };
      if (q.explanation?.trim() && !q.hasAnswerMismatch) {
        q.solutionStatus = 'provided';
        q.solutionWarnings = [];
      }
      q.validationStatus = computeQuestionValidationStatus(q);
      next[idx] = q;
      return next;
    });
  };

  const handleRegenerateAllExplanations = () => {
    setHasUnsavedChanges(true);
    setParsedQuestions((prev) =>
      prev.map((q) =>
        !q.autoGeneratedExplanation && q.solutionStatus === 'needs_review'
          ? q
          : generateStructured4StepSolution(q)
      )
    );
    setStatusMessage('Đã tạo lời giải chi tiết 4 bước cho toàn bộ danh sách câu hỏi.');
  };

  const handleBulkApplyMetadata = () => {
    if (selectedIds.size === 0) return;
    setHasUnsavedChanges(true);
    setParsedQuestions((prev) =>
      prev.map((q) =>
        selectedIds.has(q.id)
          ? {
              ...q,
              grade: bulkGrade,
              domain: bulkDomain,
              difficulty: bulkDifficulty,
              points: bulkPoints,
            }
          : q
      )
    );
    setStatusMessage(`Đã gán thuộc tính hàng loạt cho ${selectedIds.size} câu hỏi đã chọn.`);
  };

  const handleBulkApproveSolutions = () => {
    setHasUnsavedChanges(true);
    setParsedQuestions((prev) =>
      prev.map((q) => {
        if (!selectedIds.has(q.id) && selectedIds.size > 0) return q;
        const updated: ParsedWordQuestion = {
          ...q,
          approvalStatus: 'approved',
          solutionStatus: q.explanation?.trim() && !q.hasAnswerMismatch ? 'provided' : q.solutionStatus,
          solutionWarnings: q.explanation?.trim() && !q.hasAnswerMismatch ? [] : q.solutionWarnings,
        };
        updated.validationStatus = computeQuestionValidationStatus(updated);
        return updated;
      })
    );
    setStatusMessage('Đã duyệt lời giải các câu hỏi được chọn.');
  };

  const handleSaveSingleQuestion = async (idx: number) => {
    const q = parsedQuestions[idx];
    if (!q) return;
    const saved = await saveAdminQuestion({
      ...q,
      approvalStatus: 'approved',
    });
    setSavedSingleIds((prev) => new Set([...prev, saved.id]));
    setStatusMessage(`Đã lưu Câu ${idx + 1} vào Ngân hàng câu hỏi!`);
  };

  const handleRemoveQuestion = (idx: number) => {
    setHasUnsavedChanges(true);
    setParsedQuestions((prev) => {
      const removed = prev[idx];
      const next = prev.filter((_, i) => i !== idx);
      if (removed) {
        setSelectedIds((old) => {
          const copy = new Set(old);
          copy.delete(removed.id);
          return copy;
        });
      }
      if (selectedIdx >= next.length) {
        setSelectedIdx(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const insertFormattingIntoQuestion = (idx: number, snippet: string) => {
    const q = parsedQuestions[idx];
    if (!q) return;
    const nextText = `${q.question}${q.question.endsWith(' ') || !q.question ? '' : ' '}${snippet}`;
    handleUpdateQuestionField(idx, { question: nextText });
    if (questionInputRef.current) {
      questionInputRef.current.focus();
    }
  };

  const handleAddImageToQuestion = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (dataUrl) {
        const currentImages = parsedQuestions[idx]?.questionImages || [];
        const updatedImages = [...currentImages, dataUrl];
        handleUpdateQuestionField(idx, {
          imageUrl: updatedImages[0],
          questionImages: updatedImages,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInsertSampleTableToQuestion = (idx: number) => {
    const sampleTableHtml = `<table><thead><tr><th>Chất / Đại lượng</th><th>Giá trị ban đầu</th><th>Sau phản ứng</th></tr></thead><tbody><tr><td>Zn (g)</td><td>6,5</td><td>0</td></tr><tr><td>H₂ (L, đkc)</td><td>0</td><td>2,479</td></tr></tbody></table>`;
    const currentTables = parsedQuestions[idx]?.questionTables || [];
    handleUpdateQuestionField(idx, {
      questionTables: [...currentTables, sampleTableHtml],
    });
  };

  const buildQuestionsPayload = (list: ParsedWordQuestion[], targetQuizId?: string) => {
    return list.map((q, idx) => {
      const qType = q.questionType || 'single_choice';
      const steps = parseExplanationIntoSteps(q.explanation, q.solutionSteps, {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        questionType: qType,
        domain: q.domain,
        grade: q.grade,
        trueFalseStatements: q.trueFalseStatements,
        shortAnswer: q.shortAnswer,
        shortAnswerUnit: q.shortAnswerUnit,
      });
      return {
        id: q.id || `q-word-${Date.now()}-${idx + 1}`,
        topicId: targetQuizId,
        grade: q.grade,
        domain: q.domain,
        question: q.question,
        questionType: qType,
        options:
          qType === 'essay' || qType === 'short_answer'
            ? []
            : qType === 'true_false' && q.trueFalseStatements?.length
            ? q.trueFalseStatements.map((st) => `${st.label}) ${st.text}`)
            : q.options,
        correctAnswer: q.correctAnswer ?? 0,
        correctAnswers: q.correctAnswers,
        trueFalseStatements: q.trueFalseStatements,
        shortAnswer: q.shortAnswer,
        shortAnswerUnit: q.shortAnswerUnit,
        shortAnswerTolerance: q.shortAnswerTolerance,
        explanation:
          q.explanation?.trim() ||
          generateDetailedExplanation({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer ?? 0,
            questionType: qType,
            domain: q.domain,
            grade: q.grade,
            trueFalseStatements: q.trueFalseStatements,
            shortAnswer: q.shortAnswer,
            shortAnswerUnit: q.shortAnswerUnit,
          }),
        solutionSteps: steps,
        sampleAnswer: q.sampleAnswer || (qType === 'essay' ? steps.join('\n') : undefined),
        rubric: q.rubric,
        allowImageUpload: qType === 'essay' ? true : q.allowImageUpload,
        imageUrl: q.imageUrl || q.questionImages?.[0],
        questionImages: q.questionImages,
        questionTables: q.questionTables,
        rawSourceBlock: q.rawSourceBlock,
        approvalStatus: q.approvalStatus || 'approved',
        sourceDocument: q.sourceDocument || uploadedFileName || 'Tài liệu Word',
        difficulty: q.difficulty,
        hint: q.hint,
        points:
          q.points ||
          (qType === 'essay'
            ? 2.5
            : qType === 'true_false'
            ? 1.0
            : qType === 'short_answer'
            ? 0.5
            : 0.25),
      };
    });
  };

  const handleSaveAll = async (onlyValid = false) => {
    const candidates = onlyValid
      ? parsedQuestions.filter((q) => isQuestionValidToSave(q))
      : parsedQuestions;

    if (candidates.length === 0) return;
    if (!onlyValid && pendingReviewCount > 0) return;

    setIsSaving(true);
    try {
      let createdQuiz: QuizMeta | undefined;
      const targetQuizId = createNewExam ? `quiz-word-${Date.now()}` : undefined;
      const questionsToSave = buildQuestionsPayload(candidates, targetQuizId);
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
          }) hỗ trợ 4 dạng câu hỏi chuẩn GDPT 2018 kèm hướng dẫn giải chi tiết.`,
          isPublished: true,
        });
      }

      setHasUnsavedChanges(false);
      onImported({ savedQuestions, createdQuiz });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestClose = () => {
    if (hasUnsavedChanges && parsedQuestions.length > 0) {
      setShowCloseConfirm(true);
      return;
    }
    onClose();
  };

  const sourceBadges: Record<
    ParsedWordQuestion['detectedAnswerSource'],
    { label: string; color: string }
  > = {
    explicit_key: {
      label: 'Từ dòng Đáp án',
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
    asterisk: {
      label: 'Từ dấu * / (Đ)/(S)',
      color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    },
    formatting: {
      label: 'Từ chữ In đậm/Gạch chân',
      color: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    },
    answer_table: {
      label: 'Từ Bảng đáp án cuối file',
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    },
    knowledge_inference: {
      label: 'Tự nhận diện kiến thức KHTN',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    essay_rubric: {
      label: 'Tự luận (Có biểu điểm & tải ảnh)',
      color: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
    },
    default_first: {
      label: 'Chưa xác định đáp án',
      color: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
  };

  const renderQuestionInspector = (q: ParsedWordQuestion, qIdx: number) => {
    const badge = sourceBadges[q.detectedAnswerSource] || sourceBadges.default_first;
    const valStatus = computeQuestionValidationStatus(q);
    const valBadge = VALIDATION_BADGES[valStatus];
    const isEssay = q.questionType === 'essay';
    const isTrueFalse = q.questionType === 'true_false';
    const isShortAnswer = q.questionType === 'short_answer';
    const isMcq = q.questionType === 'single_choice' || q.questionType === 'multiple_choice';

    const stepsList = parseExplanationIntoSteps(q.explanation, q.solutionSteps, {
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      questionType: q.questionType,
      domain: q.domain,
      grade: q.grade,
      trueFalseStatements: q.trueFalseStatements,
      shortAnswer: q.shortAnswer,
      shortAnswerUnit: q.shortAnswerUnit,
    });

    return (
      <div
        key={q.id}
        data-testid={`parsed-question-card-${qIdx + 1}`}
        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
      >
        {/* Top Metadata & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-teal-700 text-white font-mono font-extrabold text-xs">
              Câu {qIdx + 1}
            </span>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border flex items-center gap-1.5 ${valBadge.color}`}
            >
              <span className={`w-2 h-2 rounded-full ${valBadge.dotColor}`} />
              {valBadge.label}
            </span>

            {/* Question Type Selector (All 4 GDPT 2018 types) */}
            <select
              value={q.questionType || 'single_choice'}
              data-testid={`question-type-select-${qIdx + 1}`}
              onChange={(e) =>
                handleUpdateQuestionField(
                  qIdx,
                  { questionType: e.target.value as QuestionType },
                  true
                )
              }
              className="px-2.5 py-1 rounded-lg border font-extrabold text-xs bg-teal-50 dark:bg-teal-950/70 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200"
            >
              <option value="single_choice">Dạng 1: Trắc nghiệm nhiều lựa chọn (A-D)</option>
              <option value="true_false">Dạng 2: Trắc nghiệm Đúng/Sai (a, b, c, d)</option>
              <option value="short_answer">Dạng 3: Trắc nghiệm Trả lời ngắn</option>
              <option value="essay">Dạng 4: Tự luận (Có tải ảnh & Biểu điểm)</option>
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

          {/* Action Buttons per Question (Section 6.2) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => questionInputRef.current?.focus()}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="Chỉnh sửa nội dung câu hỏi"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>CHỈNH SỬA</span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateQuestionField(qIdx, {}, true)}
              className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="Kiểm tra sự khớp nhau giữa đáp án và dữ kiện khoa học"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>KIỂM TRA ĐÁP ÁN</span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerateAiSolutionForQuestion(qIdx)}
              data-testid={`ai-generate-solution-btn-${qIdx + 1}`}
              className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
              title="Tạo lời giải chi tiết 4 bước chuẩn sư phạm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>AI TẠO LỜI GIẢI</span>
            </button>

            <button
              type="button"
              onClick={() => handleApproveSolutionForQuestion(qIdx)}
              data-testid={`approve-solution-btn-${qIdx + 1}`}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer ${
                q.approvalStatus === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{q.approvalStatus === 'approved' ? 'ĐÃ DUYỆT' : 'DUYỆT LỜI GIẢI'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setShowRawWordSource((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
              }
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="Xem đoạn văn bản gốc từ file Word để đối chiếu"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>WORD GỐC</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveSingleQuestion(qIdx)}
              data-testid={`save-single-question-btn-${qIdx + 1}`}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSingleIds.has(q.id) ? 'ĐÃ LƯU' : 'LƯU CÂU HỎI'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleRemoveQuestion(qIdx)}
              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
              title="Xóa câu hỏi"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Raw Word Source Excerpt Comparison */}
        {showRawWordSource[q.id] && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 space-y-1">
            <div className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
              Đoạn văn bản gốc trong file Word:
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap text-slate-800 dark:text-slate-200">
              {q.rawSourceBlock || q.question}
            </pre>
          </div>
        )}

        {/* Rich Scientific Formatting Toolbar (Section 7) */}
        <div className="flex flex-wrap items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-1.5">
            Công cụ KHTN:
          </span>
          {[
            { label: 'H₂SO₄', snippet: 'H₂SO₄' },
            { label: 'Ca(OH)₂', snippet: 'Ca(OH)₂' },
            { label: 'Fe³⁺', snippet: 'Fe³⁺' },
            { label: 'SO₄²⁻', snippet: 'SO₄²⁻' },
            { label: 'H⁺', snippet: 'H⁺' },
            { label: 'e⁻', snippet: 'e⁻' },
            { label: '→', snippet: ' → ' },
            { label: '⇄', snippet: ' ⇄ ' },
            { label: '↑', snippet: '↑' },
            { label: '↓', snippet: '↓' },
            { label: 't°', snippet: '(t°)' },
            { label: 'Phân số a/b', snippet: '\\frac{a}{b}' },
            { label: 'Căn √x', snippet: '√(x)' },
            { label: 'x²', snippet: '²' },
            { label: 'x₂', snippet: '₂' },
          ].map((tool) => (
            <button
              key={tool.label}
              type="button"
              onClick={() => insertFormattingIntoQuestion(qIdx, tool.snippet)}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {tool.label}
            </button>
          ))}

          <label className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-teal-50 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1 cursor-pointer">
            <ImagePlus className="w-3.5 h-3.5" />
            <span>Chèn ảnh</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleAddImageToQuestion(qIdx, e)}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => handleInsertSampleTableToQuestion(qIdx)}
            className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-teal-50 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <Table className="w-3.5 h-3.5" />
            <span>Chèn bảng</span>
          </button>
        </div>

        {/* Question Stem Editor & Live Scientific Preview */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block">
            Nội dung câu hỏi (tự động bảo toàn công thức Hóa học, ion và phương trình):
          </label>
          <textarea
            ref={questionInputRef}
            rows={2}
            value={q.question}
            data-testid={`question-stem-input-${qIdx + 1}`}
            onChange={(e) =>
              handleUpdateQuestionField(qIdx, { question: e.target.value })
            }
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
          />
          <div className="px-3 py-2 rounded-lg bg-sky-50/60 dark:bg-slate-800/50 border border-sky-200/70 dark:border-slate-700/80 text-xs sm:text-sm font-serif text-slate-900 dark:text-slate-100">
            <span className="font-sans text-[11px] font-bold text-teal-700 dark:text-teal-400 mr-1.5">
              Hiển thị Web:
            </span>
            {renderFormattedMathAndChem(q.question)}
          </div>
        </div>

        {/* Embedded Question Images Preview */}
        {q.questionImages && q.questionImages.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
              Hình ảnh minh họa / Đồ thị đi kèm câu hỏi ({q.questionImages.length} ảnh):
            </div>
            <div className="flex flex-wrap gap-3">
              {q.questionImages.map((imgSrc, imgIdx) => (
                <div
                  key={imgIdx}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white p-1.5"
                >
                  <img
                    src={imgSrc}
                    alt={`Hình câu ${qIdx + 1} - ${imgIdx + 1}`}
                    className="max-h-36 object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nextImgs = q.questionImages!.filter((_, i) => i !== imgIdx);
                      handleUpdateQuestionField(qIdx, {
                        questionImages: nextImgs.length ? nextImgs : undefined,
                        imageUrl: nextImgs[0],
                      });
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-600 text-white opacity-80 hover:opacity-100 text-[10px] cursor-pointer"
                    title="Xóa ảnh này"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Embedded Question Tables Preview */}
        {q.questionTables && q.questionTables.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
              Bảng số liệu đính kèm câu hỏi ({q.questionTables.length} bảng):
            </div>
            {q.questionTables.map((tblHtml, tblIdx) => (
              <div
                key={tblIdx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-x-auto space-y-2"
              >
                <div
                  className="prose prose-xs max-w-none [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-2.5 [&_th]:py-1.5 [&_td]:border [&_td]:border-slate-300 [&_td]:px-2.5 [&_td]:py-1.5"
                  dangerouslySetInnerHTML={{ __html: tblHtml }}
                />
              </div>
            ))}
          </div>
        )}

        {/* TYPE-SPECIFIC ANSWER & OPTIONS EDITOR */}
        {/* DẠNG 1: TRẮC NGHIỆM NHIỀU LỰA CHỌN (A, B, C, D) */}
        {isMcq && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                Các phương án lựa chọn (Bấm vào chữ cái A, B, C, D để chọn Đáp án đúng):
              </span>
              <button
                type="button"
                onClick={() =>
                  handleUpdateQuestionField(qIdx, {
                    options: [
                      ...q.options,
                      `Phương án ${String.fromCharCode(65 + q.options.length)}`,
                    ],
                  })
                }
                className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm phương án</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {q.options.map((opt, optIdx) => {
                const isCorrect = (q.correctAnswer ?? -1) === optIdx;
                return (
                  <div
                    key={optIdx}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition ${
                      isCorrect
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      data-testid={`select-correct-option-${qIdx + 1}-${String.fromCharCode(65 + optIdx)}`}
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
                      className={`w-7 h-7 rounded-lg font-extrabold text-xs flex items-center justify-center shrink-0 transition cursor-pointer ${
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
          </div>
        )}

        {/* DẠNG 2: TRẮC NGHIỆM ĐÚNG / SAI (4 Ý a, b, c, d) */}
        {isTrueFalse && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
                Dạng 2 – Các mệnh đề Đúng / Sai (Mỗi ý a, b, c, d có đáp án Đúng/Sai và giải thích riêng):
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                Thang điểm GDPT 2018: Đúng 1 ý (10%) • 2 ý (25%) • 3 ý (50%) • 4 ý (100%)
              </span>
            </div>

            <div className="space-y-2.5">
              {(q.trueFalseStatements || []).map((stmt, sIdx) => (
                <div
                  key={stmt.id || sIdx}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-slate-700 space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-mono font-extrabold text-xs flex items-center justify-center shrink-0">
                      {stmt.label})
                    </span>
                    <input
                      type="text"
                      value={stmt.text}
                      onChange={(e) => {
                        const nextStmts = [...(q.trueFalseStatements || [])];
                        nextStmts[sIdx] = { ...stmt, text: e.target.value };
                        handleUpdateQuestionField(qIdx, {
                          trueFalseStatements: nextStmts,
                          options: nextStmts.map((s) => `${s.label}) ${s.text}`),
                        });
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        data-testid={`tf-toggle-${qIdx + 1}-${stmt.label}-true`}
                        onClick={() => {
                          const nextStmts = [...(q.trueFalseStatements || [])];
                          nextStmts[sIdx] = { ...stmt, isTrue: true };
                          handleUpdateQuestionField(
                            qIdx,
                            { trueFalseStatements: nextStmts, detectedAnswerSource: 'explicit_key' },
                            true
                          );
                        }}
                        className={`px-3 py-1 rounded-lg font-extrabold text-xs cursor-pointer transition ${
                          stmt.isTrue === true
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100'
                        }`}
                      >
                        ĐÚNG
                      </button>
                      <button
                        type="button"
                        data-testid={`tf-toggle-${qIdx + 1}-${stmt.label}-false`}
                        onClick={() => {
                          const nextStmts = [...(q.trueFalseStatements || [])];
                          nextStmts[sIdx] = { ...stmt, isTrue: false };
                          handleUpdateQuestionField(
                            qIdx,
                            { trueFalseStatements: nextStmts, detectedAnswerSource: 'explicit_key' },
                            true
                          );
                        }}
                        className={`px-3 py-1 rounded-lg font-extrabold text-xs cursor-pointer transition ${
                          stmt.isTrue === false
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-100'
                        }`}
                      >
                        SAI
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={stmt.explanation || ''}
                    onChange={(e) => {
                      const nextStmts = [...(q.trueFalseStatements || [])];
                      nextStmts[sIdx] = { ...stmt, explanation: e.target.value };
                      handleUpdateQuestionField(qIdx, { trueFalseStatements: nextStmts });
                    }}
                    placeholder={`Giải thích riêng cho ý ${stmt.label})...`}
                    className="w-full px-2.5 py-1 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DẠNG 3: TRẮC NGHIỆM TRẢ LỜI NGẮN */}
        {isShortAnswer && (
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-extrabold text-amber-950 dark:text-amber-200 block mb-1">
                Đáp án chuẩn (Số hoặc từ khóa ngắn):
              </label>
              <input
                type="text"
                value={q.shortAnswer || ''}
                data-testid={`short-answer-input-${qIdx + 1}`}
                onChange={(e) =>
                  handleUpdateQuestionField(
                    qIdx,
                    { shortAnswer: e.target.value, detectedAnswerSource: 'explicit_key' },
                    true
                  )
                }
                placeholder="VD: 2,48 hoặc 2.48"
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-extrabold text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-amber-950 dark:text-amber-200 block mb-1">
                Đơn vị (nếu có):
              </label>
              <input
                type="text"
                value={q.shortAnswerUnit || ''}
                onChange={(e) =>
                  handleUpdateQuestionField(qIdx, { shortAnswerUnit: e.target.value })
                }
                placeholder="VD: L, gam, mol/L, Ω, A..."
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-bold text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-amber-950 dark:text-amber-200 block mb-1">
                Sai số cho phép (±):
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={q.shortAnswerTolerance ?? 0.02}
                onChange={(e) =>
                  handleUpdateQuestionField(qIdx, {
                    shortAnswerTolerance: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-bold text-xs"
              />
            </div>
          </div>
        )}

        {/* DẠNG 4: TỰ LUẬN (RUBRIC & STUDENT IMAGE UPLOAD) */}
        {isEssay && (
          <div className="p-3.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-violet-900 dark:text-violet-200">
                <ImagePlus className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
                <div>
                  <span className="font-extrabold block text-xs">
                    Chế độ Câu hỏi Tự luận: Hỗ trợ học sinh trình bày lời giải & tải ảnh bài làm (.jpg, .png)
                  </span>
                  <span className="text-[11px] text-violet-700 dark:text-violet-300">
                    Giáo viên có thể thiết lập biểu điểm (Rubric) và đáp án mẫu bên dưới.
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-violet-600 text-white font-bold text-[11px] shrink-0">
                Có Biểu điểm & Tải ảnh
              </span>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-violet-950 dark:text-violet-200 block mb-1">
                Thang điểm / Biểu điểm chấm tự luận (Rubric):
              </label>
              <input
                type="text"
                value={q.rubric || ''}
                onChange={(e) => handleUpdateQuestionField(qIdx, { rubric: e.target.value })}
                placeholder="VD: Viết đúng PTHH: 1,0đ; Tính đúng số mol: 0,75đ; Tính đúng thể tích: 0,75đ"
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-violet-300 dark:border-violet-700 text-xs font-semibold"
              />
            </div>
          </div>
        )}

        {/* Detailed Step-by-Step Explanation Box */}
        <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>
                Lời giải chi tiết bài tập{' '}
                {q.solutionStatus === 'needs_review'
                  ? '(Cần kiểm tra)'
                  : q.autoGeneratedExplanation
                  ? '(AI / Hệ thống tạo 4 bước)'
                  : '(Từ Word / Giáo viên đã duyệt)'}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerateAiSolutionForQuestion(qIdx)}
                className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Wand2 className="w-3 h-3" />
                <span>Tạo lời giải 4 bước từ dữ kiện đề bài</span>
              </button>
            </div>
          </div>

          {q.solutionStatus === 'needs_review' && (
            <div
              role="alert"
              className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 space-y-2"
            >
              <strong>
                {q.hasAnswerMismatch
                  ? '⚠️ PHÁT HIỆN ĐÁP ÁN KHÔNG KHỚP – CẦN GIÁO VIÊN KIỂM TRA.'
                  : 'Cần kiểm tra trước khi lưu'}
              </strong>
              <ul className="list-disc pl-4">
                {q.solutionWarnings?.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
              <p>
                Hệ thống giữ nguyên đáp án gốc của đề. Giáo viên hãy kiểm tra lại dữ kiện, chọn lại đáp án đúng hoặc bấm{' '}
                <strong>"DUYỆT LỜI GIẢI"</strong> nếu xác nhận nội dung đã chính xác.
              </p>
            </div>
          )}

          {/* Visual Textbook Solution Preview */}
          {stepsList.length > 0 && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#c8dfee] dark:border-slate-700">
              <ScientificSolutionView steps={stepsList} questionText={q.question} />
            </div>
          )}

          <textarea
            rows={7}
            value={q.explanation}
            onChange={(e) => {
              const val = e.target.value;
              const checked = generateScientificSolution({
                ...q,
                existingExplanation: val,
              });
              handleUpdateQuestionField(qIdx, {
                explanation: val,
                solutionSteps: val.trim() ? parseExplanationIntoSteps(val) : [],
                sampleAnswer: q.questionType === 'essay' ? val : q.sampleAnswer,
                solutionStatus: val.trim() ? checked.status : 'needs_review',
                solutionWarnings: val.trim() ? checked.warnings : ['Cần bổ sung lời giải.'],
                autoGeneratedExplanation: false,
              });
            }}
            placeholder="Nhập các bước giải (Bước 1. Phân tích đề bài..., Bước 2. Phương pháp giải..., Bước 3. Thực hiện..., Bước 4. Kết luận...)..."
            className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/80 dark:border-teal-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 via-sky-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <FileUp className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>Nhập Câu Hỏi Từ File Word (.docx) – Chuẩn GDPT 2018 (4 Dạng Câu Hỏi)</span>
              </h2>
              <p className="text-xs text-teal-100/90">
                Hỗ trợ Trắc nghiệm A-D, Đúng/Sai 4 ý (a,b,c,d), Trả lời ngắn & Tự luận • Bảo toàn công thức Hóa học, ion, bảng biểu và hình ảnh
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Unsaved Close Confirmation Banner */}
        {showCloseConfirm && (
          <div className="px-6 py-3 bg-amber-100 dark:bg-amber-950 border-b border-amber-300 dark:border-amber-800 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Bạn đang có {parsedQuestions.length} câu hỏi vừa chuyển đổi chưa lưu vào ngân hàng. Bạn có chắc chắn muốn đóng không?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCloseConfirm(false);
                  setHasUnsavedChanges(false);
                  onClose();
                }}
                className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-xs cursor-pointer"
              >
                Đóng không lưu
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar & Status Notification (Section 3.1) */}
        {(isReadingFile || parseProgress > 0) && (
          <div className="px-6 py-2 bg-teal-950/5 dark:bg-teal-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300">
              {isReadingFile ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>{statusMessage || 'Sẵn sàng xử lý tài liệu.'}</span>
            </div>
            <div className="w-48 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-300"
                style={{ width: `${parseProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-700 dark:text-slate-200">
          {/* Step 1: Upload Word File or Paste */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Upload Box (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="border-2 border-dashed border-teal-500/60 dark:border-teal-600/50 rounded-2xl p-4 bg-teal-50/40 dark:bg-teal-950/20 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-600/15 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto">
                  {isReadingFile ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileUp className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    1. Tải lên tệp Word (.docx, .txt)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tự động nhận diện đủ <strong>4 dạng câu hỏi GDPT 2018</strong>: Nhiều lựa chọn (A-D), Đúng/Sai (a,b,c,d), Trả lời ngắn & Tự luận
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition">
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
                    className="px-3 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Dùng thử Đề Word mẫu (6 câu)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSample4Types}
                    data-testid="load-sample-4-types-btn"
                    className="px-3 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-amber-200" />
                    <span>Đề mẫu 4 dạng GDPT 2018</span>
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
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
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
                    <span>Tải file mẫu 4 dạng</span>
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
                        if (rawText.trim())
                          runParse(rawText, htmlContent, g, fallbackDomain, autoStandardizeIupac);
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
                        if (rawText.trim())
                          runParse(rawText, htmlContent, fallbackGrade, d, autoStandardizeIupac);
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
                      if (rawText.trim())
                        runParse(rawText, htmlContent, fallbackGrade, fallbackDomain, checked);
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
            <div className="lg:col-span-7 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-800 dark:text-white">
                  2. Nội dung văn bản từ Word (có thể dán trực tiếp hoặc chỉnh sửa nhanh):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const normalizedRaw = formatChemicalAndScientificText(rawText).text;
                    setRawText(normalizedRaw);
                    runParse(normalizedRaw, htmlContent);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Phân tích & Tạo hướng dẫn giải từng bước</span>
                </button>
              </div>

              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setHtmlContent(undefined);
                }}
                placeholder={`Dán nội dung câu hỏi copy từ Word vào đây hoặc bấm "Chọn file Word (.docx)" ở bên trái...\nHỗ trợ:\n- Dạng 1: Trắc nghiệm A. B. C. D.\n- Dạng 2: Đúng/Sai a) b) c) d)\n- Dạng 3: Trả lời ngắn (Đáp án: 2,48)\n- Dạng 4: Tự luận`}
                className="w-full flex-1 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Step 2: Two-Pane Preview & Edit Interface (Section 6) */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              {/* Summary & View Mode Toggle Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                      Đã chuyển đổi thành công {parsedQuestions.length} câu hỏi sang chuẩn Web!
                    </h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Nhiều lựa chọn:{' '}
                      <strong>
                        {parsedQuestions.filter((q) => q.questionType === 'single_choice' || q.questionType === 'multiple_choice').length}
                      </strong>{' '}
                      • Đúng/Sai (a,b,c,d):{' '}
                      <strong>{parsedQuestions.filter((q) => q.questionType === 'true_false').length}</strong>{' '}
                      • Trả lời ngắn:{' '}
                      <strong>{parsedQuestions.filter((q) => q.questionType === 'short_answer').length}</strong>{' '}
                      • Tự luận:{' '}
                      <strong>{parsedQuestions.filter((q) => q.questionType === 'essay').length}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-emerald-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setViewMode('two_pane')}
                      className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                        viewMode === 'two_pane'
                          ? 'bg-teal-700 text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Chế độ 2 khung (Danh sách + Chi tiết)
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('all_list')}
                      className={`px-3 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                        viewMode === 'all_list'
                          ? 'bg-teal-700 text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Xem tất cả ({parsedQuestions.length} câu)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegenerateAllExplanations}
                    data-testid="bulk-ai-generate-solutions-btn"
                    className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>AI Tạo lời giải 4 bước hàng loạt</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkApproveSolutions}
                    data-testid="bulk-approve-solutions-btn"
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Duyệt lời giải hàng loạt</span>
                  </button>
                </div>
              </div>

              {/* Bulk Edit Toolbar (Section 6.4) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedIds.size === parsedQuestions.length) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(parsedQuestions.map((q) => q.id)));
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {selectedIds.size === parsedQuestions.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>Đã chọn {selectedIds.size}/{parsedQuestions.length} câu</span>
                  </button>

                  <select
                    value={bulkGrade}
                    onChange={(e) => setBulkGrade(Number(e.target.value) as Grade)}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs"
                  >
                    <option value={6}>Gán Lớp 6</option>
                    <option value={7}>Gán Lớp 7</option>
                    <option value={8}>Gán Lớp 8</option>
                    <option value={9}>Gán Lớp 9</option>
                  </select>

                  <select
                    value={bulkDomain}
                    onChange={(e) => setBulkDomain(e.target.value as SubjectDomain)}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs"
                  >
                    <option value="hoa-hoc">Gán Hóa học</option>
                    <option value="vat-li">Gán Vật lí</option>
                    <option value="sinh-hoc">Gán Sinh học</option>
                  </select>

                  <select
                    value={bulkDifficulty}
                    onChange={(e) => setBulkDifficulty(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs"
                  >
                    <option value="Nhận biết">Mức: Nhận biết</option>
                    <option value="Thông hiểu">Mức: Thông hiểu</option>
                    <option value="Vận dụng">Mức: Vận dụng</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleBulkApplyMetadata}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Áp dụng cho {selectedIds.size} câu đã chọn
                  </button>
                </div>

                {validQuestionsCount > 0 && pendingReviewCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSaveAll(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu nhanh {validQuestionsCount} câu hợp lệ</span>
                  </button>
                )}
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
                      Học sinh có thể làm đủ 4 dạng câu hỏi, tải ảnh tự luận và xem lời giải đã duyệt sau khi nộp bài
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

              {/* TWO-PANE LAYOUT vs ALL-LIST LAYOUT */}
              {viewMode === 'two_pane' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left Sidebar: Question List & Status Badges (4 cols) */}
                  <div className="lg:col-span-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 space-y-2 max-h-[680px] overflow-y-auto">
                    <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200 dark:border-slate-800">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                        Danh sách câu hỏi ({parsedQuestions.length})
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Bấm chọn để kiểm tra
                      </span>
                    </div>

                    {parsedQuestions.map((q, idx) => {
                      const st = computeQuestionValidationStatus(q);
                      const stBadge = VALIDATION_BADGES[st];
                      const isActive = idx === selectedIdx;
                      const isChecked = selectedIds.has(q.id);

                      return (
                        <div
                          key={q.id}
                          onClick={() => setSelectedIdx(idx)}
                          data-testid={`left-pane-question-item-${idx + 1}`}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                            isActive
                              ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-500 shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) next.add(q.id);
                              else next.delete(q.id);
                              setSelectedIds(next);
                            }}
                            className="mt-1 rounded accent-teal-600"
                          />

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-extrabold text-xs text-teal-800 dark:text-teal-300">
                                Câu {idx + 1}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stBadge.color}`}
                              >
                                {stBadge.label}
                              </span>
                            </div>

                            <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                              {q.question}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
                                {QUESTION_TYPE_LABELS[q.questionType || 'single_choice']}
                              </span>
                              {q.approvalStatus === 'approved' && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                                  Đã duyệt LG
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Inspector: Selected Question Editor (8 cols) */}
                  <div className="lg:col-span-8">
                    {parsedQuestions[selectedIdx] &&
                      renderQuestionInspector(parsedQuestions[selectedIdx], selectedIdx)}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {parsedQuestions.map((q, qIdx) => renderQuestionInspector(q, qIdx))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>
              {parsedQuestions.length > 0
                ? pendingReviewCount > 0
                  ? `Còn ${pendingReviewCount} câu cần kiểm tra dữ kiện, đáp án hoặc lời giải trước khi lưu toàn bộ.`
                  : `Sẵn sàng lưu ${parsedQuestions.length} câu hỏi có hướng dẫn giải từng bước vào hệ thống.`
                : 'Hãy chọn tệp Word (.docx) hoặc bấm "Dùng thử Đề Word mẫu" để bắt đầu.'}
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={parsedQuestions.length === 0 || isSaving || pendingReviewCount > 0}
              onClick={() => handleSaveAll(false)}
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
