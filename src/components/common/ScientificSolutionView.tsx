import React from 'react';

export interface ScientificSolutionSection {
  heading: string;
  items: Array<
    | { type: 'text'; content: string }
    | { type: 'equation'; content: string }
  >;
}

export interface ParsedScientificSolution {
  givens: string[];
  sections: ScientificSolutionSection[];
}

/**
 * Formats chemical formulas, physical symbols with subscripts/superscripts, and stacked fractions
 * e.g. \frac{m_{Zn}}{M_{Zn}} = \frac{6,5}{65} = 0,1 mol
 * Supports nested braces inside \frac{...}{...} and never leaves raw underscores or tokens.
 */
export function renderFormattedMathAndChem(text: string): React.ReactNode {
  if (!text) return null;

  // Match \frac{num}{den} (allowing nested braces like m_{Zn}) or [[frac:num|den]]
  const fracRegex =
    /\\frac\{((?:[^{}]|\{[^{}]*\})+)\}\{((?:[^{}]|\{[^{}]*\})+)\}|\[\[frac:([^|\]]+)\|([^\]]+)\]\]/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = fracRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(
        <React.Fragment key={`t-${keyCounter++}`}>
          {renderSubscriptsAndChemTokens(text.slice(lastIdx, match.index))}
        </React.Fragment>
      );
    }
    const num = match[1] ?? match[3] ?? '';
    const den = match[2] ?? match[4] ?? '';
    parts.push(
      <span
        key={`frac-${keyCounter++}`}
        className="inline-flex flex-col items-center justify-center align-middle mx-1.5 px-1 leading-tight"
      >
        <span className="border-b border-slate-900 dark:border-slate-200 px-1.5 pb-0.5 text-center">
          {renderSubscriptsAndChemTokens(num)}
        </span>
        <span className="px-1.5 pt-0.5 text-center">
          {renderSubscriptsAndChemTokens(den)}
        </span>
      </span>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(
      <React.Fragment key={`t-${keyCounter++}`}>
        {renderSubscriptsAndChemTokens(text.slice(lastIdx))}
      </React.Fragment>
    );
  }

  return parts;
}

/**
 * Helper to render nested chemical subscripts inside a subscript (e.g. H₂ inside n_{H₂})
 */
function renderNestedSubContent(subText: string): React.ReactNode {
  const cleaned = subText
    .replace(/₀/g, '0')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/₅/g, '5')
    .replace(/₆/g, '6')
    .replace(/₇/g, '7')
    .replace(/₈/g, '8')
    .replace(/₉/g, '9');

  // If it's a chemical formula like H2, O2, CO2, FeCl2, ZnCl2, render the trailing number as a sub-subscript
  const chemSubMatch = cleaned.match(/^([A-Za-z()]+)(\d+)$/);
  if (chemSubMatch) {
    return (
      <>
        {chemSubMatch[1]}
        <sub className="text-[0.82em] leading-none">{chemSubMatch[2]}</sub>
      </>
    );
  }
  return cleaned;
}

/**
 * Converts unicode subscripts (₂, ₃, ₄, ₁, ₘ) and underscore subscripts (n_Zn, m_{Zn}, V_dd, R_tđ, C_M)
 * as well as standard chemical formulas (ZnCl2, FeCl2, H2SO4, H2O, CO2, O2, N2, H2, Ca(OH)2)
 * into clean HTML <sub> and <sup> elements.
 */
function renderSubscriptsAndChemTokens(input: string): React.ReactNode {
  if (!input) return null;

  // Step 1: Temporarily protect braced subscripts _{...} and unbraced symbol subscripts so inner ₂ doesn't collide
  const subPlaceholders: string[] = [];
  const storeSub = (content: string) => {
    const id = subPlaceholders.length;
    subPlaceholders.push(content);
    return `@@SUB_${id}@@`;
  };

  let working = input
    // Braced subscripts like n_{Zn}, V_{dd}, n_{H₂}
    .replace(/_\{([^{}]+)\}/g, (_m, inner) => storeSub(inner))
    // Unbraced underscore subscripts like n_Zn, m_Zn, M_Zn, n_HCl, V_dd, R_tđ, C_M, V_m, n_H₂
    .replace(
      /\b([nmMVICRPUQF])_([A-Za-z0-9đĐ₀₁₂₃₄₅₆₇₈₉()]+)\b/g,
      (_m, base, sub) => `${base}${storeSub(sub)}`
    )
    // Chemical formulas written with plain digits like ZnCl2, FeCl2, H2SO4, H2O, CO2, H2, O2, N2
    .replace(
      /\b(ZnCl|FeCl|CuCl|MgCl|CaCl|AlCl|NaCl|AgCl|BaCl|CuSO|FeSO|ZnSO|MgSO|Na2SO|H2SO|HNO|CaCO|Na2CO|CH3COOC2H|C2H5O|CH3COO|C6H12O|C12H22O|H|O|N|Cl|CO|SO|NO|CH|C)(\d+)\b/g,
      (_m, prefix, digits) => `${prefix}${storeSub(digits)}`
    )
    // Unicode subscript numbers and letters outside braced subscripts
    .replace(/₀/g, () => storeSub('0'))
    .replace(/₁/g, () => storeSub('1'))
    .replace(/₂/g, () => storeSub('2'))
    .replace(/₃/g, () => storeSub('3'))
    .replace(/₄/g, () => storeSub('4'))
    .replace(/₅/g, () => storeSub('5'))
    .replace(/₆/g, () => storeSub('6'))
    .replace(/₇/g, () => storeSub('7'))
    .replace(/₈/g, () => storeSub('8'))
    .replace(/₉/g, () => storeSub('9'))
    .replace(/ₘ/g, () => storeSub('m'))
    // Superscripts like m², cm², I², R², H⁺, OH⁻
    .replace(/²/g, '@@SUP_2@@')
    .replace(/³/g, '@@SUP_3@@')
    .replace(/⁺/g, '@@SUP_+@@')
    .replace(/⁻/g, '@@SUP_-@@');

  const tokenRegex = /@@(SUB|SUP)_([^@]+)@@/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let idx = 0;

  while ((m = tokenRegex.exec(working)) !== null) {
    if (m.index > lastIndex) {
      nodes.push(working.slice(lastIndex, m.index));
    }
    const kind = m[1];
    const payload = m[2];
    if (kind === 'SUB') {
      const subIdx = parseInt(payload, 10);
      const rawSub = Number.isFinite(subIdx) ? subPlaceholders[subIdx] || '' : payload;
      nodes.push(
        <sub key={`sub-${idx++}`} className="text-[0.76em] leading-none font-normal">
          {renderNestedSubContent(rawSub)}
        </sub>
      );
    } else {
      nodes.push(
        <sup key={`sup-${idx++}`} className="text-[0.75em] leading-none font-normal">
          {payload}
        </sup>
      );
    }
    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < working.length) {
    nodes.push(working.slice(lastIndex));
  }

  return nodes;
}

/**
 * Parses step strings into a structured textbook solution with:
 * - Dữ kiện table (2-column grid)
 * - Section headings (a), b), c) or Bước 1, Bước 2, Bước 3)
 * - Explanatory text lines & centered equation blocks
 */
export function parseStepsToScientificSolution(
  steps: string[],
  questionText?: string
): ParsedScientificSolution {
  const givens: string[] = [];
  const sections: ScientificSolutionSection[] = [];

  for (const rawStep of steps) {
    const trimmed = rawStep.trim();
    if (!trimmed) continue;

    // 1. Check if this step is a "Dữ kiện:" block
    if (/^(?:Bước\s*\d+\s*[:.-]?\s*)?Dữ\s*kiện\s*:/i.test(trimmed)) {
      const payload = trimmed.replace(/^(?:Bước\s*\d+\s*[:.-]?\s*)?Dữ\s*kiện\s*:\s*/i, '');
      const items = payload
        .split(/\s*\|\s*|\s*;\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
      givens.push(...items);
      continue;
    }

    // 2. Extract section heading from the start of the step block
    // Allows parentheses inside the title like: Bước 2 (b) Thể tích khí hydrogen (H₂) thu được):
    let heading = '';
    let bodyText = trimmed;

    const stepParenMatch = trimmed.match(
      /^Bước\s*(\d+)\s*\((.+?)\)\s*[:.-]\s*([\s\S]*)$/i
    );
    const stepSubheadMatch = trimmed.match(
      /^(?:Bước\s*\d+\s*[:.-]?\s*)?([a-d]\)\s*[^\n:]+?)\s*(?::|\n)\s*([\s\S]*)$/i
    );
    const plainStepMatch = trimmed.match(/^Bước\s*(\d+)\s*[:.-]\s*([\s\S]*)$/i);

    if (stepParenMatch) {
      const stepIdx = parseInt(stepParenMatch[1], 10);
      const rawTitle = stepParenMatch[2].trim();
      const letterPrefix = String.fromCharCode(96 + stepIdx);
      heading = /^[a-d]\)/i.test(rawTitle) ? rawTitle : `${letterPrefix}) ${rawTitle}`;
      bodyText = stepParenMatch[3].trim();
    } else if (stepSubheadMatch) {
      heading = stepSubheadMatch[1].trim();
      bodyText = stepSubheadMatch[2].trim();
    } else if (plainStepMatch) {
      const stepIdx = parseInt(plainStepMatch[1], 10);
      const letterPrefix = String.fromCharCode(96 + stepIdx);
      heading = `${letterPrefix}) Bước ${stepIdx}`;
      bodyText = plainStepMatch[2].trim();
    } else {
      const letterPrefix = String.fromCharCode(97 + sections.length);
      heading = `${letterPrefix}) Giải chi tiết`;
    }

    const contentLines = bodyText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const sectionItems: ScientificSolutionSection['items'] = [];
    for (const line of contentLines) {
      if (/^\[EQ\]\s*/i.test(line)) {
        sectionItems.push({
          type: 'equation',
          content: line.replace(/^\[EQ\]\s*/i, '').trim(),
        });
      } else {
        const parts = line.split(/\s*\[EQ\]\s*/i);
        if (parts.length > 1) {
          if (parts[0].trim()) {
            sectionItems.push({ type: 'text', content: parts[0].trim() });
          }
          for (let i = 1; i < parts.length; i++) {
            if (parts[i].trim()) {
              sectionItems.push({ type: 'equation', content: parts[i].trim() });
            }
          }
        } else {
          sectionItems.push({ type: 'text', content: line });
        }
      }
    }

    sections.push({
      heading,
      items: sectionItems,
    });
  }

  // Auto-extract givens from questionText if none explicitly provided and question has numbers
  if (givens.length === 0 && questionText) {
    const extracted = extractGivensFromQuestion(questionText);
    if (extracted.length > 0) {
      givens.push(...extracted);
    }
  }

  return { givens, sections };
}

function extractGivensFromQuestion(question: string): string[] {
  const result: string[] = [];
  const qLower = question.toLowerCase();

  // Chemistry mass & volume
  const znMatch = question.match(/(\d+(?:[.,]\d+)?)\s*gam\s*(?:kim\s*loại\s*)?(?:Zinc|Kẽm|Zn)/i);
  if (znMatch) {
    result.push(`m(Zn) = ${znMatch[1]} g`, `M(Zn) = 65 g/mol`);
  }
  const feMatch = question.match(/(\d+(?:[.,]\d+)?)\s*gam\s*(?:kim\s*loại\s*)?(?:Iron|sắt|Fe)/i);
  if (feMatch) {
    result.push(`m(Fe) = ${feMatch[1]} g`, `M(Fe) = 56 g/mol`);
  }
  const vMlMatch = question.match(/(\d+(?:[.,]\d+)?)\s*mL\s*dung\s*dịch\s*([A-Za-z0-9()₂₃₄]+)/i);
  if (vMlMatch) {
    const ml = parseFloat(vMlMatch[1].replace(',', '.'));
    const lStr = (ml / 1000).toFixed(3).replace('.', ',');
    result.push(`V(dd HCl) = ${vMlMatch[1]} mL = ${lStr} L`);
  }
  if (/điều\s*kiện\s*chuẩn|đkc|24,79/i.test(qLower)) {
    result.push(`Vₘ = 24,79 L/mol (25°C, 1 bar)`);
  }

  // Atomic Z & N
  const zMatch = question.match(/Z\s*=\s*(\d+)/i);
  const nMatch = question.match(/Neutron(?:\s+trong\s+hạt\s+nhân)?\s+là\s+(\d+)/i);
  if (zMatch) {
    result.push(`Số đơn vị ĐTHN: Z = ${zMatch[1]}`, `p = e = Z = ${zMatch[1]} hạt`);
  }
  if (nMatch) {
    result.push(`Số hạt Neutron: n = ${nMatch[1]} hạt`);
  }

  // Physics U, R1, R2, F, S, s, t
  const r1Match = question.match(/R[₁1]\s*=\s*(\d+(?:[.,]\d+)?)\s*Ω/i);
  const r2Match = question.match(/R[₂2]\s*=\s*(\d+(?:[.,]\d+)?)\s*Ω/i);
  const rMatch = question.match(/\bR\s*=\s*(\d+(?:[.,]\d+)?)\s*Ω/i);
  const uMatch = question.match(/U\s*=\s*(\d+(?:[.,]\d+)?)\s*V/i);
  const tMinMatch = question.match(/(\d+(?:[.,]\d+)?)\s*phút/i);
  if (r1Match) result.push(`R₁ = ${r1Match[1]} Ω`);
  if (r2Match) result.push(`R₂ = ${r2Match[1]} Ω`);
  if (rMatch && !r1Match) result.push(`R = ${rMatch[1]} Ω`);
  if (uMatch) result.push(`U = ${uMatch[1]} V`);
  if (tMinMatch) {
    const min = parseFloat(tMinMatch[1].replace(',', '.'));
    result.push(`t = ${tMinMatch[1]} phút = ${Math.round(min * 60)} s`);
  }

  const fMatch = question.match(/F\s*=\s*(\d+(?:[.,]\d+)?)\s*N/i);
  const areaMatch = question.match(/S\s*=\s*(\d+(?:[.,]\d+)?)\s*m[²2]/i);
  if (fMatch) result.push(`Áp lực F = ${fMatch[1]} N`);
  if (areaMatch) result.push(`Diện tích S = ${areaMatch[1]} m²`);

  const sKmMatch = question.match(/(\d+(?:[.,]\d+)?)\s*km/i);
  if (sKmMatch) {
    const km = parseFloat(sKmMatch[1].replace(',', '.'));
    result.push(`s = ${sKmMatch[1]} km = ${Math.round(km * 1000)} m`);
  }

  // Biology DNA
  const nTotalMatch = question.match(/N\s*=\s*(\d+)/i);
  const aMatch = question.match(/Adenine\s*\(A\)\s*=\s*(\d+)/i);
  if (nTotalMatch) result.push(`Tổng số Nucleotide: N = ${nTotalMatch[1]}`);
  if (aMatch) result.push(`A = T = ${aMatch[1]} Nucleotide`);

  return result;
}

interface ScientificSolutionViewProps {
  steps: string[];
  questionText?: string;
  compact?: boolean;
}

export const ScientificSolutionView: React.FC<ScientificSolutionViewProps> = ({
  steps,
  questionText,
  compact = false,
}) => {
  const parsed = parseStepsToScientificSolution(steps, questionText);

  // Pair givens into rows of 2 columns
  const givenRows: Array<[string, string?]> = [];
  for (let i = 0; i < parsed.givens.length; i += 2) {
    givenRows.push([parsed.givens[i], parsed.givens[i + 1]]);
  }

  return (
    <div
      className={`${
        compact ? 'space-y-3' : 'space-y-5'
      } text-slate-900 dark:text-slate-100 font-serif`}
    >
      {/* 1. Dữ kiện Table (matches textbook style in reference image) */}
      {givenRows.length > 0 && (
        <div className="space-y-2">
          <h5 className="font-serif text-[16px] sm:text-[17.5px] font-bold text-[#0d4f7c] dark:text-sky-300">
            Dữ kiện
          </h5>
          <div className="overflow-hidden border border-[#dcebf5] dark:border-slate-800">
            <table className="w-full text-left border-collapse text-[14.5px] sm:text-[16px]">
              <tbody>
                {givenRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={
                      rIdx % 2 === 0
                        ? 'bg-[#eaf3f8] dark:bg-sky-950/40'
                        : 'bg-[#f4f9fc] dark:bg-slate-800/50'
                    }
                  >
                    <td className="py-2 px-3.5 sm:px-4 font-serif text-slate-900 dark:text-slate-100 w-1/2 border-b border-white dark:border-slate-800">
                      {renderFormattedMathAndChem(row[0])}
                    </td>
                    <td className="py-2 px-3.5 sm:px-4 font-serif text-slate-900 dark:text-slate-100 w-1/2 border-b border-white dark:border-slate-800">
                      {row[1] ? renderFormattedMathAndChem(row[1]) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Worked-out Solution Sections: a), b), c)... */}
      <div className={compact ? 'space-y-3.5' : 'space-y-5'}>
        {parsed.sections.map((sec, sIdx) => (
          <div key={sIdx} className="space-y-2.5">
            <h5 className="font-serif text-[16px] sm:text-[17.5px] font-bold text-[#0d4f7c] dark:text-sky-300">
              {renderFormattedMathAndChem(sec.heading)}
            </h5>

            <div className="space-y-2.5">
              {sec.items.map((item, iIdx) =>
                item.type === 'equation' ? (
                  <div
                    key={iIdx}
                    className="py-1.5 px-3 text-center font-serif text-[15.5px] sm:text-[17.5px] text-slate-950 dark:text-white overflow-x-auto"
                  >
                    {renderFormattedMathAndChem(item.content)}
                  </div>
                ) : (
                  <p
                    key={iIdx}
                    className="text-[14.5px] sm:text-[16px] font-serif text-slate-900 dark:text-slate-200 leading-relaxed"
                  >
                    {renderFormattedMathAndChem(item.content)}
                  </p>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
