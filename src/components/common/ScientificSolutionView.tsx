import React from 'react';
import { normalizeSolutionPresentation } from '../../utils/scientificSolution.ts';
import { formatChemicalAndScientificText } from '../../utils/wordQuestionParser.ts';

const REACTION_ARROW_CONDITION_REGEX =
  /^(→|⇄)\s*\(\s*((?:t°|t\^?[0o°]|xt|xúc\s*tác|đpdd|đpnc|đp|as|ánh\s*sáng|diệp\s*lục|men\s*giấm|lên\s*men|enzim|enzyme|p|áp\s*suất|H[2₂]SO[4₄]\s*đặc|Ni|Pt|Fe|V[2₂]O[5₅]|MnO[2₂]|Al[2₂]O[3₃]|HgSO[4₄]|[0-9]+\s*°C)(?:\s*[,;/+]\s*[^)]+)?)\s*\)$/i;

/**
 * Renders inline text with:
 * - Bold markdown (**...**) with nested scientific formatting
 * - Stacked chemical reaction arrows with conditions above the arrow (e.g. → (t°), → (t°, xt), ⇄ (xt, t°))
 * - Stacked fractions (\frac{a}{b}), square roots (\sqrt{x})
 * - Subscripts (_{...} or _x including Vietnamese subscripts like d_vật, d_lỏng, R_tđ), superscripts (^{...} or ^x)
 * - Automatic normalization of Vietnamese Unicode NFC, chemical formulas (H₂SO₄, Ca(OH)₂), and gas/precipitate arrows (↑, ↓)
 */
export function renderFormattedMathAndChem(text: string): React.ReactNode {
  if (!text) return null;
  const cleanText = formatChemicalAndScientificText(text).text;

  const tokenRegex =
    /(\*\*[^*\n]+\*\*|(?:→|⇄)\s*\(\s*(?:t°|t\^?[0o°]|xt|xúc\s*tác|đpdd|đpnc|đp|as|ánh\s*sáng|diệp\s*lục|men\s*giấm|lên\s*men|enzim|enzyme|p|áp\s*suất|H[2₂]SO[4₄]\s*đặc|Ni|Pt|Fe|V[2₂]O[5₅]|MnO[2₂]|Al[2₂]O[3₃]|HgSO[4₄]|[0-9]+\s*°C)(?:\s*[,;/+]\s*[^)]+)?\s*\)|\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\}|√\([^()]+\)|_\{[^{}]+\}|\^\{[^{}]+\}|_[A-Za-z0-9\u00C0-\u1EF9,+-]+|\^[0-9+-]+)/gi;
  const parts = cleanText.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Bold markdown **...**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const innerBold = part.slice(2, -2);
      return (
        <strong
          key={idx}
          className="font-black text-slate-950 dark:text-white"
        >
          {renderFormattedMathAndChem(innerBold)}
        </strong>
      );
    }

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

/**
 * Automatically wraps inline key labels & subheadings (e.g. "a) Khái niệm...:", "Các Acid quan trọng theo danh pháp IUPAC:", "Ví dụ:")
 * in **...** if not already bolded, so lesson paragraphs have clear textbook visual hierarchy.
 */
export function autoBoldInlineKeywords(line: string): string {
  let result = line;

  // 1. Leading subheading or label at start of line before colon (up to 85 chars, no '=' or '→' inside label)
  result = result.replace(
    /^((?:[a-fA-F][).]|[1-9]\.[1-9]\.?|[•\-+*])\s*)?([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][^*:\n=→⇄]{1,80}:)(\s+)/u,
    (full, prefix = '', label: string, space: string) => {
      if (full.includes('**')) return full;
      return `${prefix}**${label}**${space}`;
    }
  );

  // 2. Mid-sentence sub-headings / transition labels after a period or semicolon (e.g. ". Các Acid quan trọng theo danh pháp IUPAC:", "; Môi trường trung tính:")
  result = result.replace(
    /([.;]\s+)([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][^*:\n=→⇄\\]{2,72}:)(\s+)/gu,
    (full, sep: string, label: string, space: string) => {
      if (full.includes('**')) return full;
      // Avoid matching URLs or ratios like "Tỉ lệ 1: 2"
      if (/\d\s*:$/.test(label)) return full;
      return `${sep}**${label}**${space}`;
    }
  );

  return result;
}

/**
 * Helper for the "B In đậm" button on textareas:
 * Wraps or unwraps the selected text in **...**, or inserts **Chữ in đậm** if selection is empty.
 */
export function wrapSelectionWithBold(
  text: string,
  selectionStart: number,
  selectionEnd: number
): { nextText: string; nextCursorStart: number; nextCursorEnd: number } {
  const safeStart = Math.max(0, Math.min(selectionStart, text.length));
  const safeEnd = Math.max(safeStart, Math.min(selectionEnd, text.length));
  const before = text.slice(0, safeStart);
  const selected = text.slice(safeStart, safeEnd);
  const after = text.slice(safeEnd);

  if (selected.length > 0) {
    // If already wrapped in **...**, unwrap it
    if (selected.startsWith('**') && selected.endsWith('**') && selected.length > 4) {
      const unwrapped = selected.slice(2, -2);
      return {
        nextText: `${before}${unwrapped}${after}`,
        nextCursorStart: safeStart,
        nextCursorEnd: safeStart + unwrapped.length,
      };
    }
    if (before.endsWith('**') && after.startsWith('**')) {
      return {
        nextText: `${before.slice(0, -2)}${selected}${after.slice(2)}`,
        nextCursorStart: safeStart - 2,
        nextCursorEnd: safeEnd - 2,
      };
    }
    const wrapped = `**${selected}**`;
    return {
      nextText: `${before}${wrapped}${after}`,
      nextCursorStart: safeStart + 2,
      nextCursorEnd: safeEnd + 2,
    };
  }

  const placeholder = 'Đề mục in đậm';
  const inserted = `**${placeholder}**`;
  return {
    nextText: `${before}${inserted}${after}`,
    nextCursorStart: safeStart + 2,
    nextCursorEnd: safeStart + 2 + placeholder.length,
  };
}

/**
 * Automatically bolds all subheadings (a), b), c), 1.1, •, -) and key labels in a multi-line lesson content string.
 */
export function autoBoldAllSubheadingsInText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || /^#{1,4}\s+/.test(trimmed)) return line;

      // Clean existing duplicate ** around lettered subheadings before re-applying cleanly
      const matchLetteredColon = trimmed.match(
        /^(?:\*\*)?([a-fA-F][).]|[1-9]\.[1-9]\.?)\s+([^*:\n=→⇄]{2,80}:)(?:\*\*)?\s*([\s\S]*)$/u
      );
      if (matchLetteredColon) {
        const [, marker, subTitle, rest] = matchLetteredColon;
        const enhancedRest = autoBoldInlineKeywords(rest);
        return `**${marker} ${subTitle.trim()}**${enhancedRest ? ` ${enhancedRest}` : ''}`;
      }

      // Standalone short subheading line without colon (e.g. "a) Tính chất vật lí của Oxygen")
      if (
        /^(?:\*\*)?(?:[a-fA-F][).]|[1-9]\.[1-9]\.?|I{1,3}V?\.)\s+[^:\n]{2,85}$/u.test(trimmed) &&
        !trimmed.startsWith('**')
      ) {
        return `**${trimmed.replace(/\*\*/g, '')}**`;
      }

      return autoBoldInlineKeywords(trimmed);
    })
    .join('\n');
}

/**
 * Renders a theory paragraph or block in "Nội Dung Kiến Thức Trọng Tâm" with:
 * - Prominent bold subheadings (a), b), c), d), 1.1, •, -)
 * - Highlighted formula/equation blocks
 * - Proper chemical subscripts, stacked fractions (\frac{a}{b}), and reaction arrows
 */
export function renderStructuredTheoryParagraph(
  rawParagraph: string,
  keyPrefix: string | number = 0
): React.ReactNode {
  if (!rawParagraph || !rawParagraph.trim()) return null;

  const subLines = rawParagraph
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div key={keyPrefix} className="space-y-3">
      {subLines.map((line, lIdx) => {
        const cleanEq = line.replace(/^\[EQ\]\s*/i, '').trim();

        // 1. Pure equation or formula line
        if (isPureEquationLine(line) || /^(?:Công thức|PTHH|Phương trình hóa học)\s*:/i.test(line)) {
          return (
            <div
              key={lIdx}
              className="my-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-teal-50/90 via-sky-50/70 to-transparent dark:from-teal-950/50 dark:via-slate-800/70 border-l-4 border-teal-600 dark:border-teal-400 font-semibold text-slate-900 dark:text-white text-sm sm:text-base shadow-2xs overflow-x-auto"
            >
              {renderFormattedMathAndChem(autoBoldInlineKeywords(cleanEq))}
            </div>
          );
        }

        // 2. Pure standalone subheading line (e.g. "a) Tính chất vật lí của Oxygen" or "#### a) ..." without body text)
        const cleanSubLine = line.replace(/^#{4,6}\s+/, '').trim();
        const standaloneSubMatch = cleanSubLine.match(
          /^(?:\*\*)?((?:[a-fA-F][).]|[1-9]\.[1-9]\.?|I{1,3}V?\.)\s+.+?)(?:\*\*)?$/
        );
        if (standaloneSubMatch && !cleanSubLine.includes(':') && cleanSubLine.length <= 95) {
          return (
            <h4
              key={lIdx}
              className="pt-2 text-sm sm:text-base font-black text-teal-950 dark:text-teal-200 flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0" />
              <span>{renderFormattedMathAndChem(standaloneSubMatch[1].replace(/\*\*/g, ''))}</span>
            </h4>
          );
        }

        // 3. Lettered or numbered subheading with colon and body content
        // Matches both "a) Khái niệm: Nội dung..." and "**a) Khái niệm:** Nội dung..."
        const letteredSubheadingWithColon = cleanSubLine.match(
          /^(?:\*\*)?([a-fA-F][).]|[1-9]\.[1-9]\.?)\s*(?:\*\*)?\s*(?:\*\*)?([^*:\n=→⇄]{2,82}:)(?:\*\*)?\s*([\s\S]*)$/u
        );
        if (letteredSubheadingWithColon) {
          const [, marker, subheadingTitle, bodyRest] = letteredSubheadingWithColon;
          const bodyWithBold = bodyRest ? autoBoldInlineKeywords(bodyRest.trim()) : '';

          return (
            <div
              key={lIdx}
              className="rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 space-y-1.5 shadow-2xs"
            >
              <h4 className="text-sm sm:text-[15.5px] font-black text-teal-950 dark:text-teal-200 flex items-center gap-2 leading-snug">
                <span className="px-2 py-0.5 rounded-lg bg-teal-700 text-white font-mono font-black text-xs shrink-0 shadow-2xs">
                  {marker}
                </span>
                <span className="font-black text-slate-950 dark:text-white">
                  {renderFormattedMathAndChem(subheadingTitle.replace(/\*\*/g, ''))}
                </span>
              </h4>
              {bodyWithBold && (
                <div className="pl-1 sm:pl-2 text-slate-700 dark:text-slate-200 text-sm sm:text-[15px] leading-relaxed">
                  {renderFormattedMathAndChem(bodyWithBold)}
                </div>
              )}
            </div>
          );
        }

        // 4. Lettered sub-item without a short colon title (e.g. "a) Một vật nhúng vào chất lỏng...")
        const letteredPlainMatch = cleanSubLine.match(
          /^(?:\*\*)?([a-fA-F][).]|[1-9]\.[1-9]\.?)(?:\*\*)?\s+([\s\S]+)$/
        );
        if (letteredPlainMatch) {
          const bodyWithBold = autoBoldInlineKeywords(letteredPlainMatch[2]);
          return (
            <div
              key={lIdx}
              className="flex items-start gap-2.5 pl-1 sm:pl-2 text-slate-700 dark:text-slate-200 leading-relaxed"
            >
              <span className="px-2 py-0.5 rounded-lg bg-teal-700 text-white font-mono font-black text-xs shrink-0 mt-0.5">
                {letteredPlainMatch[1]}
              </span>
              <div className="flex-1">{renderFormattedMathAndChem(bodyWithBold)}</div>
            </div>
          );
        }

        // 5. Bullet line starting with •, -, +
        const bulletMatch = cleanSubLine.match(/^([•\-+])\s+([\s\S]+)$/);
        if (bulletMatch) {
          const bodyWithBold = autoBoldInlineKeywords(bulletMatch[2]);
          return (
            <div
              key={lIdx}
              className="flex items-start gap-2.5 pl-1 sm:pl-2 text-slate-700 dark:text-slate-200 leading-relaxed"
            >
              <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0 mt-2" />
              <div className="flex-1">{renderFormattedMathAndChem(bodyWithBold)}</div>
            </div>
          );
        }

        // 6. Standard paragraph with automatic bolding of leading & mid-sentence key labels
        const enhancedLine = autoBoldInlineKeywords(cleanSubLine);
        return (
          <p key={lIdx} className="text-slate-700 dark:text-slate-200 leading-relaxed">
            {renderFormattedMathAndChem(enhancedLine)}
          </p>
        );
      })}
    </div>
  );
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
