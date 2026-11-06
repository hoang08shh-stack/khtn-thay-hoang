import React from 'react';
import { normalizeSolutionPresentation } from '../../utils/scientificSolution.ts';
import { formatChemicalAndScientificText } from '../../utils/wordQuestionParser.ts';

const REACTION_ARROW_CONDITION_REGEX =
  /^(→|⇄)\s*\(\s*((?:t°|t\^?[0o°]|xt|xúc\s*tác|đpdd|đpnc|đp|as|ánh\s*sáng|diệp\s*lục|men\s*giấm|lên\s*men|enzim|enzyme|p|áp\s*suất|H[2₂]SO[4₄]\s*đặc|Ni|Pt|Fe|V[2₂]O[5₅]|MnO[2₂]|Al[2₂]O[3₃]|HgSO[4₄]|[0-9]+\s*°C)(?:\s*[,;/+]\s*[^)]+)?)\s*\)$/i;

/**
 * Renders inline text with:
 * - Stacked chemical reaction arrows with conditions above the arrow (e.g. → (t°), → (t°, xt), ⇄ (xt, t°))
 * - Stacked fractions (\frac{a}{b}), square roots (\sqrt{x})
 * - Subscripts (_{...} or _x), superscripts (^{...} or ^x)
 * - Automatic normalization of Vietnamese Unicode NFC, chemical formulas (H₂SO₄, Ca(OH)₂), and gas/precipitate arrows (↑, ↓)
 */
export function renderFormattedMathAndChem(text: string): React.ReactNode {
  if (!text) return null;
  const cleanText = formatChemicalAndScientificText(text).text;

  const tokenRegex =
    /((?:→|⇄)\s*\(\s*(?:t°|t\^?[0o°]|xt|xúc\s*tác|đpdd|đpnc|đp|as|ánh\s*sáng|diệp\s*lục|men\s*giấm|lên\s*men|enzim|enzyme|p|áp\s*suất|H[2₂]SO[4₄]\s*đặc|Ni|Pt|Fe|V[2₂]O[5₅]|MnO[2₂]|Al[2₂]O[3₃]|HgSO[4₄]|[0-9]+\s*°C)(?:\s*[,;/+]\s*[^)]+)?\s*\)|\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\}|√\([^()]+\)|_\{[^{}]+\}|\^\{[^{}]+\}|_[A-Za-z0-9đĐ,+-]+|\^[0-9+-]+)/gi;
  const parts = cleanText.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Stacked chemical reaction arrow with condition above arrow
    const arrowMatch = part.match(REACTION_ARROW_CONDITION_REGEX);
    if (arrowMatch) {
      const arrowType = arrowMatch[1];
      const conditionText = arrowMatch[2].trim();
      return (
        <span
          key={idx}
          data-testid="stacked-reaction-arrow"
          className="inline-flex flex-col items-center justify-center align-middle mx-1.5 px-1 leading-none select-all"
          title={`Mũi tên phản ứng (${conditionText})`}
        >
          <span className="text-[0.72em] font-extrabold text-teal-700 dark:text-teal-300 px-1 pb-0.5 border-b border-teal-600/80 dark:border-teal-400/80 whitespace-nowrap">
            {conditionText}
          </span>
          <span className="text-[0.95em] font-black text-teal-700 dark:text-teal-300 -mt-1 tracking-tighter">
            {arrowType === '⇄' ? '⇄' : '───►'}
          </span>
        </span>
      );
    }

    if (part.startsWith('\\frac{')) {
      const m = part.match(/^\\frac\{([^{}]+)\}\{([^{}]+)\}$/);
      if (m) {
        return (
          <span
            key={idx}
            className="inline-flex flex-col items-center align-middle mx-1.5 px-1 text-[0.95em] leading-tight select-all"
          >
            <span className="border-b border-current px-1.5 pb-0.5 font-semibold">
              {renderFormattedMathAndChem(m[1])}
            </span>
            <span className="px-1.5 pt-0.5 font-semibold">
              {renderFormattedMathAndChem(m[2])}
            </span>
          </span>
        );
      }
    }

    if (part.startsWith('\\sqrt{') || part.startsWith('√(')) {
      const inner = part.startsWith('\\sqrt{')
        ? part.slice(6, -1)
        : part.slice(2, -1);
      return (
        <span key={idx} className="inline-flex items-baseline mx-0.5 font-semibold">
          <span className="text-[1.05em] mr-0.5">√</span>
          <span className="border-t border-current px-1">
            {renderFormattedMathAndChem(inner)}
          </span>
        </span>
      );
    }

    if (part.startsWith('_{') && part.endsWith('}')) {
      const subContent = part.slice(2, -1);
      return (
        <sub key={idx} className="text-[0.76em] leading-none align-baseline font-medium">
          {subContent}
        </sub>
      );
    }

    if (part.startsWith('^{') && part.endsWith('}')) {
      const supContent = part.slice(2, -1);
      return (
        <sup key={idx} className="text-[0.76em] leading-none align-super font-medium">
          {supContent}
        </sup>
      );
    }

    if (part.startsWith('_') && part.length > 1) {
      return (
        <sub key={idx} className="text-[0.76em] leading-none align-baseline font-medium">
          {part.slice(1)}
        </sub>
      );
    }

    if (part.startsWith('^') && part.length > 1) {
      return (
        <sup key={idx} className="text-[0.76em] leading-none align-super font-medium">
          {part.slice(1)}
        </sup>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function isPureEquationLine(line: string): boolean {
  const t = line.trim();
  if (t.startsWith('[EQ]')) return true;
  if (/\\frac\{/.test(t) && t.length < 130 && !/^(?:Vì|Do|Theo|Thay|Áp dụng|Từ)/i.test(t)) {
    return true;
  }
  if (/^[A-Za-z0-9₀-₉⁺⁻()[\]\s+.,*/=×÷−-]+→[A-Za-z0-9₀-₉⁺⁻()[\]\s+.,*/=×÷↑↓t°xt-]+$/.test(t)) {
    return true;
  }
  return false;
}

export interface ScientificSolutionViewProps {
  steps: string[];
  questionText?: string;
  compact?: boolean;
}

/**
 * Hiển thị lời giải ngắn gọn, mạch lạc, chính xác theo Quy định mới (Mục 10):
 * - KHÔNG hiển thị bảng "Dữ kiện", "Phân tích dữ kiện", "Yêu cầu bài toán", "Phương pháp giải".
 * - KHÔNG đánh số "Bước 1", "Bước 2", "Bước 3" hay tiêu đề phụ "a) Giải chi tiết".
 */
export const ScientificSolutionView: React.FC<ScientificSolutionViewProps> = ({
  steps,
  compact = false,
}) => {
  const rawJoined = (steps || []).join('\n');
  const { normalizedSteps } = normalizeSolutionPresentation(rawJoined);
  const linesToRender = normalizedSteps.length > 0 ? normalizedSteps : steps.filter(Boolean);

  if (linesToRender.length === 0) {
    return null;
  }

  return (
    <div
      className={`font-sans text-slate-900 dark:text-slate-100 ${
        compact ? 'text-[14px] space-y-1.5' : 'text-[15.5px] sm:text-[16.5px] space-y-2'
      } leading-relaxed`}
    >
      {linesToRender.map((rawLine, idx) => {
        const cleanLine = rawLine.replace(/^\[EQ\]\s*/i, '').trim();
        if (!cleanLine) return null;

        const isConclusion = /^(?:Đáp án|Chọn đáp án|Đáp số|Vậy)\b/i.test(cleanLine);
        const isWarning = /^⚠️|PHÁT HIỆN ĐÁP ÁN KHÔNG KHỚP/i.test(cleanLine);
        const isEq = isPureEquationLine(rawLine);

        if (isWarning) {
          return (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-sans text-xs font-bold"
            >
              {cleanLine}
            </div>
          );
        }

        if (isConclusion) {
          return (
            <div
              key={idx}
              className="pt-1 font-bold text-[#0d4f7c] dark:text-sky-300"
            >
              {renderFormattedMathAndChem(cleanLine)}
            </div>
          );
        }

        if (isEq) {
          return (
            <div
              key={idx}
              className="py-1 pl-2 sm:pl-3 border-l-2 border-sky-400/70 dark:border-sky-500/60 font-semibold text-slate-900 dark:text-white overflow-x-auto"
            >
              {renderFormattedMathAndChem(cleanLine)}
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-800 dark:text-slate-100">
            {renderFormattedMathAndChem(cleanLine)}
          </p>
        );
      })}
    </div>
  );
};
