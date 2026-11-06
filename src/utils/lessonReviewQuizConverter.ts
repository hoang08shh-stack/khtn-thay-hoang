import {
  Grade,
  SubjectDomain,
  LessonMiniQuizItem,
  LessonReviewQuestionType,
  TrueFalseStatement,
} from '../types/index.ts';
import {
  parseWordContentToQuestions,
  ParsedWordQuestion,
  formatChemicalAndScientificText,
} from './wordQuestionParser.ts';
import {
  convertLegacyVietnameseToUnicode,
  normalizeVietnameseUnicodeNFC,
} from './vietnameseFontFixer.ts';

export type WordReviewConversionTarget = 'auto' | LessonReviewQuestionType;

export const SAMPLE_WORD_3_REVIEW_TYPES = `PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN
Câu 1: Cho các dung dịch: Hydrochloric acid (HCl), Sodium hydroxide (NaOH), Sodium chloride (NaCl) và Sulfuric acid (H2SO4). Dung dịch làm giấy quỳ tím chuyển sang màu xanh là:
A. HCl
B. *NaOH
C. NaCl
D. H2SO4
Lời giải: Sodium hydroxide (NaOH) là base tan (kiềm), phân li ra ion OH- trong nước nên làm quỳ tím hóa xanh.

Câu 2: Kim loại nào sau đây tác dụng được với dung dịch HCl loãng giải phóng khí Hydrogen (H2)?
A. Copper (Cu)
B. Silver (Ag)
C. *Zinc (Zn)
D. Gold (Au)
Đáp án: C
Lời giải: PTHH: Zn + 2HCl -> ZnCl2 + H2^. Kim loại Zinc (Zn) đứng trước Hydrogen trong dãy hoạt động hóa học.

PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI
Câu 3: Cho thí nghiệm nhỏ từ từ dung dịch Hydrochloric acid (HCl) vào ống nghiệm chứa viên kẽm (Zn). Xét tính đúng/sai của các phát biểu sau:
a) Có bọt khí không màu thoát ra trên bề mặt viên kẽm. (Đúng)
b) Khí thoát ra là khí Oxygen (O2) duy trì sự cháy. (Sai)
c) Dung dịch thu được sau phản ứng chứa muối Zinc chloride (ZnCl2). (Đúng)
d) Nếu thay viên kẽm (Zn) bằng mảnh đồng (Cu) thì hiện tượng xảy ra tương tự. (Sai)
Lời giải: Zn đứng trước H nên phản ứng với HCl tạo muối ZnCl2 và khí H2↑ không màu; Cu đứng sau H nên không phản ứng với HCl loãng.

PHẦN III. TỰ LUẬN
Câu 4 (Tự luận): Hòa tan hoàn toàn 6,5 gam Zinc (Zn = 65) vào 100 mL dung dịch Hydrochloric acid (HCl) vừa đủ. Viết phương trình hóa học xảy ra và tính thể tích khí Hydrogen (H2) thu được ở điều kiện chuẩn (25°C, 1 bar).
Lời giải:
Số mol Zinc phản ứng: n_Zn = \\frac{6,5}{65} = 0,1 mol.
Phương trình hóa học: Zn + 2HCl -> ZnCl2 + H2^
Theo phương trình hóa học: n_H2 = n_Zn = 0,1 mol.
Thể tích khí Hydrogen ở đkc: V_H2 = 0,1 × 24,79 = 2,479 lít.
Biểu điểm: Viết đúng PTHH (0,5đ); Tính đúng số mol Zn và thể tích khí H2 = 2,479 lít (0,5đ).`;

export const SAMPLE_BROKEN_FONT_CHEM_ARROWS_WORD = `PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN
C©u 1: Nhiệt phân hoàn toàn Kalium chlorate (KClO 3) có xúc tác MnO 2 theo phương trình phản ứng nào sau đây để điều chế khí Oxygen?
A. 2KClO 3 \uF0AE 2KCl + 3O 2
B. *2KClO 3 --(t^o, MnO2)--> 2KCl + 3O 2^
C. KClO 3 ⎯⎯t^o→ KCl + O 2^
D. 2KClO 3 <==> 2KCl + 3O 2
Lời giải: Khi đun nóng KClO 3 có mặt xúc tác MnO 2: 2KClO 3 --(t^o, MnO2)--> 2KCl + 3O 2^.

PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI
Câu 2: Cho dung dÞch Barium chloride (BaCl 2) tác dụng với dung dịch Sulfuric acid (H 2 SO 4) loãng. Biê´ t phản ứng tạo ra kết tủa trắng và dung dịch acid:
a) Phương trình hóa học của phản ứng là: BaCl 2 + H 2 SO 4 \uF0E0 BaSO 4(kết tủa) + 2HCl. (Đúng)
b) Châ´ t kết tủa màu trắng thu được là BaSO 4 không tan trong các dung dịch acid. (Đúng)
c) Phản ứng trên cần phải đun nóng ở nhiệt độ cao ⎯⎯t^o→ mới xảy ra. (Sai)
d) Khô´ i l­îng dung dịch sau phản ứng giảm đi so với tổng khô´ i l­îng hai dung dịch ban đầu. (Đúng)
Lời giải: PTHH: BaCl 2 + H 2 SO 4 -> BaSO 4(kết tủa) + 2HCl. Do BaSO 4 kết tủa tách khỏi dung dịch nên khô´ i l­îng dung dịch giảm.

PHẦN III. TỰ LUẬN
Câu 3 (Tự luận): Đốt cháy hoàn toàn sắt (Fe) trong bình chứa khí Oxygen (O 2) dư thu được 23,2 gam Iron(II,III) oxide (Fe 3 O 4). Viết phương trình hóa học và tính khô´ i l­îng sắt đã phản ứng.
Lời giải:
Phương trình hóa học: 3Fe + 2O 2 --(t^o)--> Fe 3 O 4
Sô´ mol Fe 3 O 4 thu được: n = \\frac{23,2}{232} = 0,1 mol.
Theo phương trình: n_Fe = 3 × 0,1 = 0,3 mol → m_Fe = 0,3 × 56 = 16,8 gam.`;

/**
 * Normalizes a single string for Vietnamese encoding, detached accents, chemical formulas, and reaction arrows.
 */
export function normalizeChemAndVietnameseText(input: string): string {
  if (!input) return '';
  const unicodeFixed = convertLegacyVietnameseToUnicode(input);
  return formatChemicalAndScientificText(normalizeVietnameseUnicodeNFC(unicodeFixed)).text;
}

/**
 * Deeply normalizes all text fields of a LessonMiniQuizItem (stem, options, True/False statements, sampleAnswer, explanation).
 */
export function normalizeReviewQuizItemChemAndFont(item: LessonMiniQuizItem): LessonMiniQuizItem {
  return {
    ...item,
    question: normalizeChemAndVietnameseText(item.question),
    options: (item.options || []).map((opt) => normalizeChemAndVietnameseText(opt)),
    trueFalseStatements: item.trueFalseStatements?.map((st) => ({
      ...st,
      text: normalizeChemAndVietnameseText(st.text),
      explanation: st.explanation ? normalizeChemAndVietnameseText(st.explanation) : undefined,
    })),
    sampleAnswer: item.sampleAnswer ? normalizeChemAndVietnameseText(item.sampleAnswer) : undefined,
    rubric: item.rubric ? normalizeChemAndVietnameseText(item.rubric) : undefined,
    explanation: normalizeChemAndVietnameseText(item.explanation || ''),
  };
}

/**
 * Ensures a True/False statement array always has 4 clean statements labeled a, b, c, d.
 */
export function normalizeTrueFalseStatements(
  statements?: TrueFalseStatement[],
  fallbackOptions?: string[],
  correctIndex = 0
): TrueFalseStatement[] {
  const labels: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
  if (statements && statements.length >= 2) {
    return labels.map((lbl, idx) => {
      const existing = statements[idx];
      if (existing) {
        return {
          id: existing.id || `tf_${lbl}`,
          label: lbl,
          text: normalizeChemAndVietnameseText(existing.text.replace(/^[a-d]\s*[.)]\s*/i, '').trim()),
          isTrue: existing.isTrue === null || existing.isTrue === undefined ? idx % 2 === 0 : Boolean(existing.isTrue),
          explanation: existing.explanation ? normalizeChemAndVietnameseText(existing.explanation) : undefined,
        };
      }
      return {
        id: `tf_${lbl}`,
        label: lbl,
        text: `Phát biểu ${lbl}`,
        isTrue: false,
      };
    });
  }

  // Convert from 4 MCQ options A, B, C, D into 4 True/False statements a, b, c, d
  const opts = fallbackOptions && fallbackOptions.length > 0 ? fallbackOptions : ['', '', '', ''];
  return labels.map((lbl, idx) => ({
    id: `tf_${lbl}`,
    label: lbl,
    text: normalizeChemAndVietnameseText((opts[idx] || `Phát biểu ${lbl}`).replace(/^[A-Da-d]\s*[.)]\s*/, '').trim()),
    isTrue: idx === correctIndex,
  }));
}

/**
 * Converts a single ParsedWordQuestion from wordQuestionParser into a LessonMiniQuizItem
 * supporting all 3 types: 'single_choice', 'true_false', and 'essay'.
 */
export function mapParsedWordQuestionToLessonQuizItem(
  q: ParsedWordQuestion,
  targetMode: WordReviewConversionTarget = 'auto'
): LessonMiniQuizItem {
  let detectedType: LessonReviewQuestionType = 'single_choice';
  if (q.questionType === 'true_false') {
    detectedType = 'true_false';
  } else if (q.questionType === 'essay' || q.questionType === 'short_answer') {
    detectedType = 'essay';
  } else {
    detectedType = 'single_choice';
  }

  const rawOpts =
    q.options && q.options.length >= 2
      ? q.options.slice(0, 4).map((o) => normalizeChemAndVietnameseText(o.replace(/^[A-D]\s*[.)]\s*/i, '').trim()))
      : ['Đúng', 'Sai', 'Chưa đủ dữ kiện', 'Cả A và B'];
  while (rawOpts.length < 4) {
    rawOpts.push(`Phương án ${String.fromCharCode(65 + rawOpts.length)}`);
  }

  const safeCorrectIdx =
    typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < rawOpts.length
      ? q.correctAnswer
      : 0;

  const baseExplanation = normalizeChemAndVietnameseText(
    q.explanation?.trim() ||
      (detectedType === 'single_choice'
        ? `Đáp án đúng: ${String.fromCharCode(65 + safeCorrectIdx)}. ${rawOpts[safeCorrectIdx]}`
        : 'Xem hướng dẫn giải chi tiết.')
  );

  const baseSampleAnswer = normalizeChemAndVietnameseText(
    q.sampleAnswer?.trim() ||
      (q.shortAnswer
        ? `Đáp số: ${q.shortAnswer}${q.shortAnswerUnit ? ` ${q.shortAnswerUnit}` : ''}.\n${baseExplanation}`
        : baseExplanation)
  );

  const initialItem: LessonMiniQuizItem = {
    id: q.id || `review-q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    questionType: detectedType,
    question: normalizeChemAndVietnameseText(q.question.trim()),
    options: rawOpts,
    correctIndex: safeCorrectIdx,
    correctIndices: q.correctAnswers,
    trueFalseStatements:
      detectedType === 'true_false'
        ? normalizeTrueFalseStatements(q.trueFalseStatements, rawOpts, safeCorrectIdx)
        : undefined,
    sampleAnswer: detectedType === 'essay' ? baseSampleAnswer : undefined,
    rubric: q.rubric?.trim() ? normalizeChemAndVietnameseText(q.rubric.trim()) : undefined,
    explanation: baseExplanation,
  };

  if (targetMode !== 'auto' && targetMode !== detectedType) {
    return convertReviewQuestionType(initialItem, targetMode);
  }
  return initialItem;
}

/**
 * Converts a LessonMiniQuizItem between the 3 review question types:
 * - 'single_choice' (Trắc nghiệm nhiều lựa chọn A, B, C, D)
 * - 'true_false' (Trắc nghiệm Đúng / Sai 4 ý a, b, c, d)
 * - 'essay' (Dạng Tự luận có đáp án mẫu)
 */
export function convertReviewQuestionType(
  item: LessonMiniQuizItem,
  targetType: LessonReviewQuestionType
): LessonMiniQuizItem {
  const normalizedItem = normalizeReviewQuizItemChemAndFont(item);
  const currentType: LessonReviewQuestionType = normalizedItem.questionType || 'single_choice';
  if (currentType === targetType) {
    if (targetType === 'true_false' && (!normalizedItem.trueFalseStatements || normalizedItem.trueFalseStatements.length === 0)) {
      return {
        ...normalizedItem,
        questionType: 'true_false',
        trueFalseStatements: normalizeTrueFalseStatements(undefined, normalizedItem.options, normalizedItem.correctIndex),
      };
    }
    return { ...normalizedItem, questionType: targetType };
  }

  const formattedQuestion = normalizedItem.question;

  if (targetType === 'true_false') {
    const tfStatements = normalizeTrueFalseStatements(
      normalizedItem.trueFalseStatements,
      normalizedItem.options,
      normalizedItem.correctIndex
    );
    const tfSummary = tfStatements
      .map((s) => `${s.label}) ${s.isTrue ? 'Đúng' : 'Sai'}`)
      .join(' • ');
    return {
      ...normalizedItem,
      question: formattedQuestion,
      questionType: 'true_false',
      trueFalseStatements: tfStatements,
      explanation: normalizedItem.explanation?.trim() || `Đáp án Đúng/Sai: ${tfSummary}.`,
    };
  }

  if (targetType === 'essay') {
    let generatedSample = normalizedItem.sampleAnswer?.trim() || '';
    if (!generatedSample) {
      if (currentType === 'true_false' && normalizedItem.trueFalseStatements?.length) {
        const lines = normalizedItem.trueFalseStatements.map(
          (st) => `${st.label}) ${st.text} → ${st.isTrue ? 'Đúng' : 'Sai'}${st.explanation ? ` (${st.explanation})` : ''}`
        );
        generatedSample = [...lines, normalizedItem.explanation].filter(Boolean).join('\n');
      } else if (normalizedItem.options && normalizedItem.options[normalizedItem.correctIndex]) {
        generatedSample = `${normalizedItem.explanation || ''}\nKết luận: ${normalizedItem.options[normalizedItem.correctIndex]}`.trim();
      } else {
        generatedSample = normalizedItem.explanation || 'Học sinh trình bày lời giải chi tiết và viết phương trình (nếu có).';
      }
    }
    return {
      ...normalizedItem,
      question: formattedQuestion,
      questionType: 'essay',
      sampleAnswer: generatedSample,
      explanation: normalizedItem.explanation?.trim() || generatedSample,
    };
  }

  // Target is 'single_choice' (Trắc nghiệm nhiều lựa chọn A, B, C, D)
  let nextOptions =
    normalizedItem.options && normalizedItem.options.length >= 2 ? [...normalizedItem.options.slice(0, 4)] : [];
  let nextCorrectIdx =
    normalizedItem.correctIndex >= 0 && normalizedItem.correctIndex < 4 ? normalizedItem.correctIndex : 0;

  if (
    (nextOptions.length < 2 || nextOptions.every((o) => /^Phương án [A-D]$/.test(o))) &&
    normalizedItem.trueFalseStatements &&
    normalizedItem.trueFalseStatements.length >= 2
  ) {
    nextOptions = normalizedItem.trueFalseStatements.slice(0, 4).map((st) => st.text);
    const firstTrue = normalizedItem.trueFalseStatements.findIndex((st) => st.isTrue === true);
    nextCorrectIdx = firstTrue >= 0 ? firstTrue : 0;
  }

  if (nextOptions.length < 2 && normalizedItem.sampleAnswer) {
    const firstLine = normalizedItem.sampleAnswer.split('\n')[0].trim();
    nextOptions = [
      firstLine.slice(0, 120) || 'Đáp án A',
      'Phương án nhiễu B',
      'Phương án nhiễu C',
      'Phương án nhiễu D',
    ];
    nextCorrectIdx = 0;
  }

  while (nextOptions.length < 4) {
    nextOptions.push(`Phương án ${String.fromCharCode(65 + nextOptions.length)}`);
  }

  return {
    ...normalizedItem,
    question: formattedQuestion,
    questionType: 'single_choice',
    options: nextOptions,
    correctIndex: nextCorrectIdx,
    explanation:
      normalizedItem.explanation?.trim() ||
      `Đáp án đúng: ${String.fromCharCode(65 + nextCorrectIdx)}. ${nextOptions[nextCorrectIdx]}`,
  };
}

export interface WordReviewParseDiagnostics {
  fontFixed: boolean;
  formulasFixedCount: number;
  arrowsFixedCount: number;
  normalizedRawText: string;
}

export interface WordReviewParseResult {
  items: LessonMiniQuizItem[];
  warnings: string[];
  counts: {
    total: number;
    singleChoice: number;
    trueFalse: number;
    essay: number;
  };
  diagnostics: WordReviewParseDiagnostics;
}

/**
 * Parses Word content (raw text + optional Mammoth HTML) into end-of-lesson review questions
 * across all 3 question types: Multiple Choice, True/False, and Essay.
 */
export function parseWordToLessonReviewQuestions(
  rawText: string,
  options: {
    htmlContent?: string;
    defaultGrade?: Grade;
    defaultDomain?: SubjectDomain;
    targetMode?: WordReviewConversionTarget;
  } = {}
): WordReviewParseResult {
  const {
    htmlContent,
    defaultGrade = 8,
    defaultDomain = 'hoa-hoc',
    targetMode = 'auto',
  } = options;

  const unicodeText = normalizeVietnameseUnicodeNFC(convertLegacyVietnameseToUnicode(rawText || ''));
  const fontFixed = unicodeText !== (rawText || '');

  const chemResult = formatChemicalAndScientificText(unicodeText);
  const fixedText = chemResult.text;
  const fixedHtml = htmlContent
    ? formatChemicalAndScientificText(convertLegacyVietnameseToUnicode(htmlContent)).text
    : undefined;

  const formulasFixedCount = (fixedText.match(/[₀-₉⁺⁻]/g) || []).length;
  const arrowsFixedCount = (fixedText.match(/[→⇄↑↓]/g) || []).length;

  const parsed = parseWordContentToQuestions(fixedText, {
    htmlContent: fixedHtml,
    defaultGrade,
    defaultDomain,
    autoStandardizeIupac: true,
  });

  const items = parsed.questions
    .filter((q) => q.question && q.question.trim().length > 0)
    .map((q) => mapParsedWordQuestionToLessonQuizItem(q, targetMode));

  const counts = {
    total: items.length,
    singleChoice: items.filter((i) => (i.questionType || 'single_choice') === 'single_choice').length,
    trueFalse: items.filter((i) => i.questionType === 'true_false').length,
    essay: items.filter((i) => i.questionType === 'essay').length,
  };

  return {
    items,
    warnings: parsed.warnings,
    counts,
    diagnostics: {
      fontFixed,
      formulasFixedCount,
      arrowsFixedCount,
      normalizedRawText: fixedText,
    },
  };
}

/**
 * Evaluates a student's answers across all 3 question types in the End-of-Lesson Review section.
 */
export function evaluateLessonReviewQuiz(
  quizItems: LessonMiniQuizItem[],
  selectedMcq: Record<number, number>,
  selectedTrueFalse: Record<number, Record<string, boolean>>,
  essayResponses: Record<number, string>
): {
  correctCount: number;
  totalGradable: number;
  perQuestionCorrect: Record<number, boolean>;
} {
  let correctCount = 0;
  const perQuestionCorrect: Record<number, boolean> = {};

  quizItems.forEach((q, qIdx) => {
    const qType = q.questionType || 'single_choice';
    if (qType === 'true_false' && q.trueFalseStatements && q.trueFalseStatements.length > 0) {
      const userMap = selectedTrueFalse[qIdx] || {};
      const allMatched = q.trueFalseStatements.every((st) => {
        const expected = st.isTrue !== false;
        return userMap[st.label] !== undefined && userMap[st.label] === expected;
      });
      perQuestionCorrect[qIdx] = allMatched;
      if (allMatched) correctCount++;
    } else if (qType === 'essay') {
      const text = (essayResponses[qIdx] || '').trim();
      const hasWritten = text.length >= 3;
      perQuestionCorrect[qIdx] = hasWritten;
      if (hasWritten) correctCount++;
    } else {
      const chosen = selectedMcq[qIdx];
      const isOk = chosen !== undefined && chosen === q.correctIndex;
      perQuestionCorrect[qIdx] = isOk;
      if (isOk) correctCount++;
    }
  });

  return {
    correctCount,
    totalGradable: quizItems.length,
    perQuestionCorrect,
  };
}
