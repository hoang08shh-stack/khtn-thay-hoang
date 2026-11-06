import React, { useState, useRef } from 'react';
import * as mammoth from 'mammoth';
import {
  Grade,
  SubjectDomain,
  LessonMiniQuizItem,
  LessonReviewQuestionType,
} from '../../types/index.ts';
import {
  WordReviewConversionTarget,
  WordReviewParseDiagnostics,
  SAMPLE_WORD_3_REVIEW_TYPES,
  SAMPLE_BROKEN_FONT_CHEM_ARROWS_WORD,
  parseWordToLessonReviewQuestions,
  convertReviewQuestionType,
  normalizeTrueFalseStatements,
  normalizeChemAndVietnameseText,
  normalizeReviewQuizItemChemAndFont,
} from '../../utils/lessonReviewQuizConverter.ts';
import { renderFormattedMathAndChem } from '../common/ScientificSolutionView.tsx';
import {
  FileUp,
  FileText,
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  Wand2,
  ListChecks,
  CheckSquare,
  AlignLeft,
  X,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';

interface LessonWordReviewConverterProps {
  grade: Grade;
  domain: SubjectDomain;
  lessonTitle?: string;
  onImportQuestions: (questions: LessonMiniQuizItem[]) => void;
  onClose?: () => void;
}

const QUESTION_TYPE_META: Record<
  LessonReviewQuestionType,
  { label: string; shortLabel: string; badgeClass: string }
> = {
  single_choice: {
    label: 'Trắc nghiệm nhiều lựa chọn (A, B, C, D)',
    shortLabel: 'Trắc nghiệm A–D',
    badgeClass:
      'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800',
  },
  true_false: {
    label: 'Trắc nghiệm Đúng / Sai (a, b, c, d)',
    shortLabel: 'Đúng / Sai (a,b,c,d)',
    badgeClass:
      'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800',
  },
  essay: {
    label: 'Dạng Tự luận',
    shortLabel: 'Tự luận',
    badgeClass:
      'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-800',
  },
};

const QUICK_CHEM_ARROW_SNIPPETS: Array<{ label: string; snippet: string; title: string }> = [
  { label: '→', snippet: ' → ', title: 'Mũi tên phản ứng một chiều' },
  { label: '→ (t°)', snippet: ' → (t°) ', title: 'Mũi tên phản ứng có đun nóng (t° xếp trên mũi tên)' },
  { label: '→ (t°, xt)', snippet: ' → (t°, xt) ', title: 'Mũi tên phản ứng có nhiệt độ, xúc tác' },
  { label: '→ (đpdd)', snippet: ' → (đpdd) ', title: 'Mũi tên điện phân dung dịch' },
  { label: '⇄', snippet: ' ⇄ ', title: 'Mũi tên phản ứng thuận nghịch hai chiều' },
  { label: '↑ (Khí)', snippet: '↑', title: 'Mũi tên chất khí thoát ra' },
  { label: '↓ (Kết tủa)', snippet: '↓', title: 'Mũi tên chất kết tủa' },
  { label: 'H₂SO₄', snippet: 'H₂SO₄', title: 'Sulfuric acid' },
  { label: 'Ca(OH)₂', snippet: 'Ca(OH)₂', title: 'Calcium hydroxide' },
  { label: 'Al₂(SO₄)₃', snippet: 'Al₂(SO₄)₃', title: 'Aluminium sulfate' },
  { label: 'CuSO₄·5H₂O', snippet: 'CuSO₄·5H₂O', title: 'Tinh thể Copper(II) sulfate ngậm nước' },
  { label: 'Phân số a/b', snippet: '\\frac{a}{b}', title: 'Phân số chồng tầng' },
];

export const LessonWordReviewConverter: React.FC<LessonWordReviewConverterProps> = ({
  grade,
  domain,
  lessonTitle,
  onImportQuestions,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rawText, setRawText] = useState('');
  const [htmlContent, setHtmlContent] = useState<string | undefined>(undefined);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [targetMode, setTargetMode] = useState<WordReviewConversionTarget>('auto');
  const [parsedItems, setParsedItems] = useState<LessonMiniQuizItem[]>([]);
  const [diagnostics, setDiagnostics] = useState<WordReviewParseDiagnostics | null>(null);
  const [filterType, setFilterType] = useState<'all' | LessonReviewQuestionType>('all');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const runConversion = (
    textInput: string,
    htmlInput?: string,
    mode: WordReviewConversionTarget = targetMode
  ) => {
    if (!textInput.trim() && !htmlInput?.trim()) {
      setStatusMsg('Vui lòng tải file Word (.docx) hoặc dán nội dung câu hỏi để chuyển đổi.');
      return;
    }
    const res = parseWordToLessonReviewQuestions(textInput, {
      htmlContent: htmlInput,
      defaultGrade: grade,
      defaultDomain: domain,
      targetMode: mode,
    });
    setRawText(res.diagnostics.normalizedRawText);
    setDiagnostics(res.diagnostics);
    setParsedItems(res.items);
    if (res.items.length > 0) {
      setStatusMsg(
        `Đã chuẩn hóa & chuyển đổi thành công ${res.counts.total} câu hỏi (${res.counts.singleChoice} Trắc nghiệm A–D, ${res.counts.trueFalse} Đúng/Sai, ${res.counts.essay} Tự luận) • Đã chuẩn hóa ${res.diagnostics.formulasFixedCount} chỉ số CTHH & ${res.diagnostics.arrowsFixedCount} mũi tên phản ứng.`
      );
    } else {
      setStatusMsg('Không tìm thấy câu hỏi hợp lệ. Hãy kiểm tra lại định dạng "Câu 1: ...".');
    }
  };

  const handleNormalizeAllChemAndFont = () => {
    if (!rawText.trim() && parsedItems.length === 0) {
      setStatusMsg('Chưa có nội dung để chuẩn hóa. Hãy tải file Word hoặc nạp mẫu thử.');
      return;
    }
    if (rawText.trim()) {
      const normalizedRaw = normalizeChemAndVietnameseText(rawText);
      setRawText(normalizedRaw);
      runConversion(normalizedRaw, htmlContent, targetMode);
    } else if (parsedItems.length > 0) {
      setParsedItems((prev) => prev.map((it) => normalizeReviewQuizItemChemAndFont(it)));
      setStatusMsg('Đã chuẩn hóa toàn bộ Font Unicode NFC, Công thức Hóa học và Mũi tên PTHH!');
    }
  };

  const handleInsertQuickSnippet = (snippet: string) => {
    setRawText((prev) => `${prev}${prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : ''}${snippet}`);
  };

  const handleUploadWordFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingFile(true);
    setUploadedFileName(file.name);
    setStatusMsg(`Đang đọc tệp Word "${file.name}"...`);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'txt') {
        const text = await file.text();
        setRawText(text);
        setHtmlContent(undefined);
        runConversion(text, undefined, targetMode);
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const [rawResult, htmlResult] = await Promise.all([
          mammoth.extractRawText({ arrayBuffer }),
          mammoth.convertToHtml({ arrayBuffer }),
        ]);
        const extractedText = rawResult.value || '';
        const extractedHtml = htmlResult.value || '';
        setRawText(extractedText);
        setHtmlContent(extractedHtml);
        runConversion(extractedText, extractedHtml, targetMode);
      }
    } catch {
      setStatusMsg(
        'Không thể đọc trực tiếp tệp này. Hãy lưu dưới định dạng .docx hoặc dán nội dung vào ô bên dưới.'
      );
    } finally {
      setIsReadingFile(false);
      e.target.value = '';
    }
  };

  const handleLoadSample3Types = () => {
    setUploadedFileName('De_on_tap_mau_3_dang.docx');
    setRawText(SAMPLE_WORD_3_REVIEW_TYPES);
    setHtmlContent(undefined);
    runConversion(SAMPLE_WORD_3_REVIEW_TYPES, undefined, 'auto');
    setTargetMode('auto');
  };

  const handleLoadBrokenFontChemSample = () => {
    setUploadedFileName('De_Word_Loi_Font_CTHH_Mui_Ten.docx');
    setRawText(SAMPLE_BROKEN_FONT_CHEM_ARROWS_WORD);
    setHtmlContent(undefined);
    runConversion(SAMPLE_BROKEN_FONT_CHEM_ARROWS_WORD, undefined, 'auto');
    setTargetMode('auto');
  };

  const handleApplyBulkTargetMode = (mode: WordReviewConversionTarget) => {
    setTargetMode(mode);
    if (mode === 'auto') {
      if (rawText.trim() || htmlContent?.trim()) {
        runConversion(rawText, htmlContent, 'auto');
      }
      return;
    }
    if (parsedItems.length > 0) {
      setParsedItems((prev) => prev.map((item) => convertReviewQuestionType(item, mode)));
      setStatusMsg(
        `Đã chuyển toàn bộ ${parsedItems.length} câu sang ${QUESTION_TYPE_META[mode].label}!`
      );
    } else if (rawText.trim() || htmlContent?.trim()) {
      runConversion(rawText, htmlContent, mode);
    }
  };

  const handleChangeItemType = (idx: number, newType: LessonReviewQuestionType) => {
    setParsedItems((prev) =>
      prev.map((item, i) => (i === idx ? convertReviewQuestionType(item, newType) : item))
    );
  };

  const handleUpdateItem = (idx: number, patch: Partial<LessonMiniQuizItem>) => {
    setParsedItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const handleDeleteItem = (idx: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const counts = {
    total: parsedItems.length,
    singleChoice: parsedItems.filter((i) => (i.questionType || 'single_choice') === 'single_choice')
      .length,
    trueFalse: parsedItems.filter((i) => i.questionType === 'true_false').length,
    essay: parsedItems.filter((i) => i.questionType === 'essay').length,
  };

  const visibleItems = parsedItems
    .map((item, originalIdx) => ({ item, originalIdx }))
    .filter(({ item }) => {
      if (filterType === 'all') return true;
      return (item.questionType || 'single_choice') === filterType;
    });

  return (
    <div
      data-testid="lesson-word-review-converter"
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-teal-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-2 border-indigo-200 dark:border-indigo-800 shadow-sm space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-slate-800">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[11px] font-extrabold">
              <Wand2 className="w-3.5 h-3.5" />
              <span>CÔNG CỤ CHUYỂN ĐỔI CÂU HỎI KHTN CHUYÊN NGHIỆP (CHUẨN GDPT 2018)</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
              <ShieldCheck className="w-3 h-3" />
              Khử lỗi Font TCVN3/VNI • Chuẩn CTHH • Chuẩn Mũi tên PTHH
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            Chuyển đổi câu hỏi Word (.docx) sang Trắc nghiệm A–D, Đúng/Sai &amp; Tự luận (Không lỗi Font, Công thức &amp; Mũi tên phản ứng)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Tự động sửa lỗi dấu rời &amp; bảng mã cũ (<strong>khô´ i l­îng → khối lượng</strong>), chuẩn hóa công thức Hóa học bị cách chữ (<strong>H 2 SO 4 → H₂SO₄, Al 2 (SO 4) 3 → Al₂(SO₄)₃</strong>) và mũi tên phương trình phản ứng (<strong>--(t°, xt)--&gt;, ⎯⎯t°→, \uF0AE → ───►</strong>)
            {lessonTitle ? ` cho bài "${lessonTitle}"` : ''}.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
            title="Đóng công cụ chuyển Word"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3-Pillar Professional Protection Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900 border border-teal-200 dark:border-teal-800/70 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-snug">
            <strong className="text-slate-900 dark:text-white block">1. Không lỗi Font Tiếng Việt</strong>
            <span className="text-slate-600 dark:text-slate-400">
              Tự động chuyển mã TCVN3 (.VnTime), VNI-Windows, UTF-8 Mojibake &amp; gộp dấu rời (khô´ i → khối, châ´ t → chất).
            </span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/70 flex items-start gap-2">
          <FlaskConical className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-snug">
            <strong className="text-slate-900 dark:text-white block">2. Không lỗi Công thức Hóa học</strong>
            <span className="text-slate-600 dark:text-slate-400">
              Tự động liền khối và hạ chỉ số dưới cho H₂SO₄, Ca(OH)₂, Al₂(SO₄)₃, CuSO₄·5H₂O, điện tích ion Fe³⁺, SO₄²⁻.
            </span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900 border border-sky-200 dark:border-sky-800/70 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-snug">
            <strong className="text-slate-900 dark:text-white block">3. Không lỗi Mũi tên Phản ứng</strong>
            <span className="text-slate-600 dark:text-slate-400">
              Khử ô vuông Symbol/Wingdings, hiển thị điều kiện (t°, xt, đpdd, MnO₂) xếp chồng chuẩn SGK trên mũi tên ───► &amp; ⇄.
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Upload Word file or Paste + Choose Target Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: File Upload & Sample Loader (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-white/90 dark:bg-slate-900 hover:border-teal-500 transition cursor-pointer text-center space-y-2"
          >
            <FileUp className="w-7 h-7 text-indigo-600 dark:text-indigo-400 mx-auto" />
            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              {isReadingFile
                ? 'Đang đọc và phân tích file Word...'
                : uploadedFileName
                ? `Đã tải tệp: ${uploadedFileName}`
                : 'Bấm để chọn File Word (.docx, .txt) từ máy tính'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tự động chuẩn hóa công thức Hóa học (H₂SO₄, Ca(OH)₂), mũi tên phản ứng (───► t°) và sửa lỗi font TCVN3/VNI.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc,.txt"
              onChange={handleUploadWordFile}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              data-testid="load-sample-3-types-btn"
              onClick={handleLoadSample3Types}
              className="px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Nạp mẫu chuẩn 3 dạng</span>
            </button>

            <button
              type="button"
              data-testid="load-sample-broken-font-chem-btn"
              onClick={handleLoadBrokenFontChemSample}
              className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Nạp văn bản mẫu bị lỗi font TCVN3/dấu rời, lỗi cách khoảng trắng CTHH và lỗi mũi tên phản ứng để kiểm chứng tự động sửa lỗi"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Thử mẫu sửa lỗi Font &amp; PTHH</span>
            </button>
          </div>

          {/* Target Question Type Conversion Selector */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Chế độ chuyển đổi dạng câu hỏi:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'auto', label: 'Tự động nhận diện 3 dạng' },
                  { id: 'single_choice', label: 'Chuyển hết → Trắc nghiệm A–D' },
                  { id: 'true_false', label: 'Chuyển hết → Đúng/Sai (a,b,c,d)' },
                  { id: 'essay', label: 'Chuyển hết → Tự luận' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleApplyBulkTargetMode(m.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left border transition cursor-pointer ${
                    targetMode === m.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Paste Word Content Box (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hoặc dán trực tiếp nội dung câu hỏi từ Word vào đây:</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="normalize-all-chem-font-btn"
                onClick={handleNormalizeAllChemAndFont}
                className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs cursor-pointer"
                title="Chuẩn hóa ngay Font Unicode, Công thức Hóa học và Mũi tên phản ứng"
              >
                <Wand2 className="w-3 h-3" />
                <span>Chuẩn hóa Font, CTHH &amp; Mũi tên PTHH</span>
              </button>
              {rawText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setHtmlContent(undefined);
                    setParsedItems([]);
                    setDiagnostics(null);
                    setUploadedFileName(null);
                    setStatusMsg(null);
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  Xóa nội dung
                </button>
              )}
            </div>
          </div>

          {/* Quick Reaction Arrow & Chemical Formula Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-extrabold text-slate-500 mr-1">
              Chèn nhanh PTHH &amp; CTHH:
            </span>
            {QUICK_CHEM_ARROW_SNIPPETS.map((btn) => (
              <button
                key={btn.label}
                type="button"
                title={btn.title}
                onClick={() => handleInsertQuickSnippet(btn.snippet)}
                className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>

          <textarea
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Dán câu hỏi từ file Word hỗ trợ cả 3 dạng:\n• Dạng 1 (Trắc nghiệm nhiều lựa chọn): Câu 1: ... A. ... B. *... C. ... D. ...\n• Dạng 2 (Trắc nghiệm Đúng/Sai): Câu 2: ... a) ... (Đúng)  b) ... (Sai)  c) ... (Đúng)  d) ... (Sai)\n• Dạng 3 (Tự luận): Câu 3 (Tự luận): ... Lời giải: ...`}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">
              Gõ <code className="font-bold text-teal-700">--(t°, xt)--&gt;</code>, <code className="font-bold text-teal-700">&lt;==&gt;</code>, <code className="font-bold text-teal-700">H2^</code>, <code className="font-bold text-teal-700">BaSO4(kết tủa)</code> sẽ tự động chuyển thành mũi tên phản ứng chuẩn SGK.
            </span>
            <button
              type="button"
              data-testid="run-word-review-parse-btn"
              onClick={() => runConversion(rawText, htmlContent, targetMode)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Phân tích &amp; Chuyển đổi ngay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status feedback & Diagnostics */}
      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
          {diagnostics && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-extrabold">
                ✓ Font Unicode NFC
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 font-extrabold">
                ✓ {diagnostics.formulasFixedCount} chỉ số CTHH
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300 font-extrabold">
                ✓ {diagnostics.arrowsFixedCount} mũi tên PTHH
              </span>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Converted Questions Preview & Type Switcher */}
      {parsedItems.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-indigo-100 dark:border-slate-800">
          {/* Filter & Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Tất cả ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('single_choice')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition cursor-pointer ${
                  filterType === 'single_choice'
                    ? 'bg-teal-600 text-white'
                    : 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Trắc nghiệm nhiều lựa chọn ({counts.singleChoice})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('true_false')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition cursor-pointer ${
                  filterType === 'true_false'
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Trắc nghiệm Đúng / Sai ({counts.trueFalse})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('essay')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition cursor-pointer ${
                  filterType === 'essay'
                    ? 'bg-violet-600 text-white'
                    : 'bg-violet-50 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Tự luận ({counts.essay})</span>
              </button>
            </div>

            <button
              type="button"
              data-testid="confirm-import-review-questions-btn"
              onClick={() => {
                onImportQuestions(parsedItems);
                setParsedItems([]);
                setRawText('');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lưu {parsedItems.length} câu hỏi vào Ôn tập cuối bài</span>
            </button>
          </div>

          {/* Converted Questions List */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {visibleItems.map(({ item, originalIdx }) => {
              const qType: LessonReviewQuestionType = item.questionType || 'single_choice';
              const meta = QUESTION_TYPE_META[qType];

              return (
                <div
                  key={item.id || originalIdx}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs"
                >
                  {/* Top Bar: Question Index + Type Switcher Buttons + Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                        Câu {originalIdx + 1}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-extrabold ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 mr-1">
                        Đổi dạng câu này:
                      </span>
                      {(
                        [
                          { id: 'single_choice', label: 'Trắc nghiệm A–D' },
                          { id: 'true_false', label: 'Đúng / Sai' },
                          { id: 'essay', label: 'Tự luận' },
                        ] as const
                      ).map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => handleChangeItemType(originalIdx, btn.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition cursor-pointer ${
                            qType === btn.id
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(originalIdx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa câu này khỏi danh sách nhập"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Stem */}
                  <div>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => handleUpdateItem(originalIdx, { question: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
                    />
                    <div className="mt-1 text-xs text-slate-500">
                      Hiển thị chuẩn KHTN: {renderFormattedMathAndChem(item.question)}
                    </div>
                  </div>

                  {/* Type 1: Multiple Choice Options A, B, C, D */}
                  {qType === 'single_choice' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[0, 1, 2, 3].map((optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isCorrect = item.correctIndex === optIdx;
                        const optVal = item.options[optIdx] || '';
                        return (
                          <div
                            key={optIdx}
                            className={`flex flex-col gap-1 p-2.5 rounded-xl border ${
                              isCorrect
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(originalIdx, { correctIndex: optIdx })}
                                className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 cursor-pointer ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-300'
                                }`}
                                title="Đặt làm đáp án đúng"
                              >
                                {letter}
                              </button>
                              <input
                                type="text"
                                value={optVal}
                                onChange={(e) => {
                                  const nextOpts = [...item.options];
                                  nextOpts[optIdx] = e.target.value;
                                  handleUpdateItem(originalIdx, { options: nextOpts });
                                }}
                                className="flex-1 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                              />
                            </div>
                            {/[→⇄↑↓₀-₉⁺⁻]|\\frac|\\sqrt/.test(optVal) && (
                              <div className="pl-8 text-[11px] text-slate-600 dark:text-slate-300">
                                {renderFormattedMathAndChem(optVal)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Type 2: True / False Statements a, b, c, d */}
                  {qType === 'true_false' && (
                    <div className="space-y-2 p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                      <span className="block text-[11px] font-extrabold text-sky-900 dark:text-sky-300">
                        Các phát biểu Đúng / Sai (Bấm Đúng hoặc Sai để chỉnh đáp án chuẩn):
                      </span>
                      {normalizeTrueFalseStatements(
                        item.trueFalseStatements,
                        item.options,
                        item.correctIndex
                      ).map((stmt, sIdx) => (
                        <div key={stmt.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 text-xs font-extrabold text-sky-700 dark:text-sky-300">
                              {stmt.label})
                            </span>
                            <input
                              type="text"
                              value={stmt.text}
                              onChange={(e) => {
                                const currentStmts = normalizeTrueFalseStatements(
                                  item.trueFalseStatements,
                                  item.options,
                                  item.correctIndex
                                );
                                currentStmts[sIdx] = { ...stmt, text: e.target.value };
                                handleUpdateItem(originalIdx, { trueFalseStatements: currentStmts });
                              }}
                              className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                            />
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const currentStmts = normalizeTrueFalseStatements(
                                    item.trueFalseStatements,
                                    item.options,
                                    item.correctIndex
                                  );
                                  currentStmts[sIdx] = { ...stmt, isTrue: true };
                                  handleUpdateItem(originalIdx, { trueFalseStatements: currentStmts });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                                  stmt.isTrue === true
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200'
                                }`}
                              >
                                Đúng
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentStmts = normalizeTrueFalseStatements(
                                    item.trueFalseStatements,
                                    item.options,
                                    item.correctIndex
                                  );
                                  currentStmts[sIdx] = { ...stmt, isTrue: false };
                                  handleUpdateItem(originalIdx, { trueFalseStatements: currentStmts });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                                  stmt.isTrue === false
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200'
                                }`}
                              >
                                Sai
                              </button>
                            </div>
                          </div>
                          {/[→⇄↑↓₀-₉⁺⁻]|\\frac|\\sqrt/.test(stmt.text) && (
                            <div className="pl-8 text-[11px] text-slate-600 dark:text-slate-300">
                              Hiển thị: {renderFormattedMathAndChem(stmt.text)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Type 3: Essay Sample Answer & Rubric */}
                  {qType === 'essay' && (
                    <div className="space-y-2 p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                      <label className="block text-[11px] font-extrabold text-violet-900 dark:text-violet-300">
                        Đáp án mẫu &amp; Hướng dẫn chấm Tự luận:
                      </label>
                      <textarea
                        rows={3}
                        value={item.sampleAnswer || item.explanation || ''}
                        onChange={(e) =>
                          handleUpdateItem(originalIdx, {
                            sampleAnswer: e.target.value,
                            explanation: e.target.value,
                          })
                        }
                        placeholder="Nhập lời giải chi tiết, phương trình hóa học hoặc biểu điểm chấm tự luận..."
                        className="w-full px-3 py-2 rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                      />
                      {(item.sampleAnswer || item.explanation) && (
                        <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900 border border-violet-200/70 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line">
                          <span className="font-extrabold text-[11px] text-violet-700 dark:text-violet-300 block mb-1">
                            Hiển thị lời giải chuẩn KHTN:
                          </span>
                          {renderFormattedMathAndChem(item.sampleAnswer || item.explanation || '')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation line for MCQ / TrueFalse */}
                  {qType !== 'essay' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 shrink-0">
                          Lời giải:
                        </span>
                        <input
                          type="text"
                          value={item.explanation}
                          onChange={(e) =>
                            handleUpdateItem(originalIdx, { explanation: e.target.value })
                          }
                          className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
                        />
                      </div>
                      {item.explanation && /[→⇄↑↓₀-₉⁺⁻]|\\frac|\\sqrt/.test(item.explanation) && (
                        <div className="pl-14 text-[11px] text-slate-600 dark:text-slate-300">
                          {renderFormattedMathAndChem(item.explanation)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
