import React, { useState, useEffect } from 'react';
import {
  X,
  Sigma,
  FlaskConical,
  Calculator,
  Sparkles,
  Check,
  RotateCcw,
  ArrowRightLeft,
} from 'lucide-react';
import { renderFormattedMathAndChem } from '../common/ScientificSolutionView.tsx';
import { formatChemicalAndScientificText } from '../../utils/wordQuestionParser.ts';

export type FormulaInsertTargetField =
  | { type: 'question'; label: string }
  | { type: 'option'; index: number; label: string }
  | { type: 'tf_statement'; index: number; label: string }
  | { type: 'short_answer'; label: string }
  | { type: 'explanation'; label: string };

interface FormulaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFormula?: string;
  targetFieldLabel?: string;
  targetLabel?: string;
  availableTargets?: FormulaInsertTargetField[];
  selectedTargetIndex?: number;
  onSelectTargetIndex?: (index: number) => void;
  onInsertFormula: (formattedFormula: string) => void;
}

interface FormulaTemplateGroup {
  id: 'chem_compounds' | 'chem_ions' | 'chem_arrows' | 'math_structures' | 'greek_physics';
  title: string;
  items: Array<{
    label: string;
    insert: string;
    description: string;
  }>;
}

const FORMULA_TEMPLATE_GROUPS: FormulaTemplateGroup[] = [
  {
    id: 'chem_compounds',
    title: 'Công thức Hóa học & Phân tử',
    items: [
      { label: 'H₂O', insert: 'H₂O', description: 'Nước' },
      { label: 'H₂SO₄', insert: 'H₂SO₄', description: 'Sulfuric acid' },
      { label: 'HCl', insert: 'HCl', description: 'Hydrochloric acid' },
      { label: 'HNO₃', insert: 'HNO₃', description: 'Nitric acid' },
      { label: 'Ca(OH)₂', insert: 'Ca(OH)₂', description: 'Calcium hydroxide' },
      { label: 'NaOH', insert: 'NaOH', description: 'Sodium hydroxide' },
      { label: 'Al₂(SO₄)₃', insert: 'Al₂(SO₄)₃', description: 'Aluminium sulfate' },
      { label: 'CuSO₄', insert: 'CuSO₄', description: 'Copper(II) sulfate' },
      { label: 'CaCO₃', insert: 'CaCO₃', description: 'Calcium carbonate' },
      { label: 'C₆H₁₂O₆', insert: 'C₆H₁₂O₆', description: 'Glucose' },
      { label: 'CH₃COOH', insert: 'CH₃COOH', description: 'Acetic acid' },
      { label: 'C₂H₅OH', insert: 'C₂H₅OH', description: 'Ethanol' },
    ],
  },
  {
    id: 'chem_ions',
    title: 'Ion, Điện tích & Hạt vi mô',
    items: [
      { label: 'Fe²⁺', insert: 'Fe²⁺', description: 'Ion Iron(II)' },
      { label: 'Fe³⁺', insert: 'Fe³⁺', description: 'Ion Iron(III)' },
      { label: 'Cu²⁺', insert: 'Cu²⁺', description: 'Ion Copper(II)' },
      { label: 'Zn²⁺', insert: 'Zn²⁺', description: 'Ion Zinc' },
      { label: 'Na⁺', insert: 'Na⁺', description: 'Ion Sodium' },
      { label: 'H⁺', insert: 'H⁺', description: 'Cation Hydrogen' },
      { label: 'Ag⁺', insert: 'Ag⁺', description: 'Ion Silver' },
      { label: 'NH₄⁺', insert: 'NH₄⁺', description: 'Ion Ammonium' },
      { label: 'Cl⁻', insert: 'Cl⁻', description: 'Ion Chloride' },
      { label: 'OH⁻', insert: 'OH⁻', description: 'Ion Hydroxide' },
      { label: 'NO₃⁻', insert: 'NO₃⁻', description: 'Ion Nitrate' },
      { label: 'HCO₃⁻', insert: 'HCO₃⁻', description: 'Ion Hydrogencarbonate' },
      { label: 'CO₃²⁻', insert: 'CO₃²⁻', description: 'Ion Carbonate' },
      { label: 'SO₄²⁻', insert: 'SO₄²⁻', description: 'Ion Sulfate' },
      { label: 'PO₄³⁻', insert: 'PO₄³⁻', description: 'Ion Phosphate' },
      { label: 'e⁻', insert: 'e⁻', description: 'Hạt Electron' },
    ],
  },
  {
    id: 'chem_arrows',
    title: 'Mũi tên phản ứng & Điều kiện',
    items: [
      { label: '→', insert: ' → ', description: 'Phản ứng một chiều' },
      { label: '⇌', insert: ' ⇄ ', description: 'Phản ứng thuận nghịch' },
      { label: '→ (t°)', insert: ' → (t°) ', description: 'Phản ứng cần đun nóng' },
      { label: '→ (xt, t°)', insert: ' → (xt, t°) ', description: 'Xúc tác, nhiệt độ' },
      { label: '↑', insert: '↑', description: 'Chất khí thoát ra' },
      { label: '↓', insert: '↓', description: 'Chất kết tủa' },
      { label: 'Δ', insert: 'Δ', description: 'Nhiệt phân / Biến thiên' },
      { label: '°C', insert: '°C', description: 'Độ Celsius' },
    ],
  },
  {
    id: 'math_structures',
    title: 'Phân số, Căn thức, Lũy thừa & Toán học',
    items: [
      { label: 'Phân số a/b', insert: '\\frac{a}{b}', description: 'Phân số chồng tầng' },
      { label: 'n = m/M', insert: 'n = \\frac{m}{M}', description: 'Công thức tính số mol' },
      { label: 'I = U/R', insert: 'I = \\frac{U}{R}', description: 'Định luật Ohm' },
      { label: 'C_M = n/V', insert: 'C_{M} = \\frac{n}{V}', description: 'Nồng độ mol' },
      { label: '√x (Căn bậc 2)', insert: '\\sqrt{x}', description: 'Căn bậc hai' },
      { label: 'x² (Bình phương)', insert: 'x²', description: 'Chỉ số trên bậc 2' },
      { label: 'x³ (Lập phương)', insert: 'x³', description: 'Chỉ số trên bậc 3' },
      { label: 'xⁿ (Mũ n)', insert: '^{n}', description: 'Chỉ số trên tùy chỉnh' },
      { label: 'x₁ (Chỉ số dưới)', insert: '_{1}', description: 'Chỉ số dưới tùy chỉnh' },
      { label: '∑ (Tổng)', insert: '∑', description: 'Ký hiệu tổng Sigma' },
      { label: '∫ (Tích phân)', insert: '∫', description: 'Ký hiệu tích phân' },
      { label: '≈ (Xấp xỉ)', insert: ' ≈ ', description: 'Dấu xấp xỉ bằng' },
      { label: '≤', insert: ' ≤ ', description: 'Nhỏ hơn hoặc bằng' },
      { label: '≥', insert: ' ≥ ', description: 'Lớn hơn hoặc bằng' },
      { label: '≠', insert: ' ≠ ', description: 'Khác' },
      { label: '±', insert: '±', description: 'Cộng trừ' },
    ],
  },
  {
    id: 'greek_physics',
    title: 'Ký hiệu Vật lí, Hy Lạp & Đơn vị',
    items: [
      { label: 'Ω (Ohm)', insert: 'Ω', description: 'Đơn vị điện trở Ohm' },
      { label: 'α (Alpha)', insert: 'α', description: 'Góc / Tia Alpha' },
      { label: 'β (Beta)', insert: 'β', description: 'Góc / Tia Beta' },
      { label: 'γ (Gamma)', insert: 'γ', description: 'Tia Gamma' },
      { label: 'π (Pi)', insert: 'π', description: 'Hằng số Pi' },
      { label: 'λ (Lambda)', insert: 'λ', description: 'Bước sóng' },
      { label: 'ρ (Rho)', insert: 'ρ', description: 'Điện trở suất / Khối lượng riêng' },
      { label: 'm/s²', insert: 'm/s²', description: 'Đơn vị gia tốc' },
      { label: 'mol/L', insert: 'mol/L', description: 'Đơn vị nồng độ mol' },
      { label: 'g/mol', insert: 'g/mol', description: 'Khối lượng mol' },
    ],
  },
];

export const FormulaEditorModal: React.FC<FormulaEditorModalProps> = ({
  isOpen,
  onClose,
  initialFormula = '',
  targetFieldLabel = 'Nội dung câu hỏi',
  availableTargets,
  selectedTargetIndex = 0,
  onSelectTargetIndex,
  onInsertFormula,
}) => {
  const [formulaText, setFormulaText] = useState(initialFormula);
  const [activeGroup, setActiveGroup] = useState<FormulaTemplateGroup['id']>('chem_compounds');
  const [numInput, setNumInput] = useState('6,5');
  const [denInput, setDenInput] = useState('65');

  useEffect(() => {
    if (isOpen) {
      setFormulaText(initialFormula || '');
    }
  }, [isOpen, initialFormula]);

  if (!isOpen) return null;

  const autoFormattedPreview = formatChemicalAndScientificText(formulaText).text;

  const handleAppendToken = (token: string) => {
    setFormulaText((prev) => `${prev}${token}`);
  };

  const handleInsertFractionBuilder = () => {
    const numClean = numInput.trim() || 'a';
    const denClean = denInput.trim() || 'b';
    handleAppendToken(`\\frac{${numClean}}{${denClean}}`);
  };

  const handleAutoNormalizeInput = () => {
    setFormulaText((prev) => formatChemicalAndScientificText(prev).text);
  };

  const handleConfirmInsert = () => {
    const finalFormula = formatChemicalAndScientificText(formulaText).text.trim();
    if (!finalFormula) return;
    onInsertFormula(finalFormula);
    onClose();
  };

  const currentGroup =
    FORMULA_TEMPLATE_GROUPS.find((g) => g.id === activeGroup) || FORMULA_TEMPLATE_GROUPS[0];

  return (
    <div
      data-testid="formula-editor-modal"
      className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border-2 border-teal-500/40 dark:border-teal-700 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-700 via-teal-600 to-sky-700 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Sigma className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-wide">
                TRÌNH SOẠN THẢO CÔNG THỨC KHOA HỌC (MATHTYPE KHTN)
              </h3>
              <p className="text-[11px] text-teal-100">
                Hỗ trợ phân số, căn thức, chỉ số trên/dưới, ion, phương trình hóa học & ký hiệu Vật lí
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trình soạn công thức"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Target Field Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/70 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Vị trí chèn công thức:
            </span>
            {availableTargets && availableTargets.length > 0 && onSelectTargetIndex ? (
              <select
                aria-label="Chọn vị trí chèn công thức"
                value={selectedTargetIndex}
                onChange={(e) => onSelectTargetIndex(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-400 dark:border-teal-700 text-xs font-extrabold text-teal-800 dark:text-teal-300"
              >
                {availableTargets.map((t, idx) => (
                  <option key={idx} value={idx}>
                    {t.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-extrabold">
                {targetFieldLabel}
              </span>
            )}
          </div>

          {/* Group Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
            {FORMULA_TEMPLATE_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(group.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  activeGroup === group.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700'
                }`}
              >
                {group.title}
              </button>
            ))}
          </div>

          {/* Template Palette Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {currentGroup.items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAppendToken(item.insert)}
                title={item.description}
                data-testid={`formula-template-${item.label}`}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/40 text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5"
              >
                <span className="font-sans font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {renderFormattedMathAndChem(item.label)}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-full">
                  {item.description}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Fraction Builder */}
          <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-sky-900 dark:text-sky-200">
              <Calculator className="w-4 h-4 text-sky-600" />
              <span>Tạo nhanh phân số (Tử số / Mẫu số):</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                aria-label="Tử số"
                value={numInput}
                onChange={(e) => setNumInput(e.target.value)}
                placeholder="Tử số (VD: 6,5)"
                className="w-24 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 text-xs font-bold text-center"
              />
              <span className="font-bold text-sky-700">/</span>
              <input
                type="text"
                aria-label="Mẫu số"
                value={denInput}
                onChange={(e) => setDenInput(e.target.value)}
                placeholder="Mẫu số (VD: 65)"
                className="w-24 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 text-xs font-bold text-center"
              />
              <button
                type="button"
                onClick={handleInsertFractionBuilder}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold cursor-pointer"
              >
                + Chèn phân số
              </button>
            </div>
          </div>

          {/* Keyboard Formula Input */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="formula-editor-textarea"
                className="text-xs font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                <span>Nhập công thức bằng bàn phím (gõ H2SO4, Fe^3+, SO4^2-, -&gt;, \frac&#123;a&#125;&#123;b&#125;, \sqrt&#123;x&#125;):</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAutoNormalizeInput}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Chuẩn hóa chỉ số tự động</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormulaText('')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa trắng</span>
                </button>
              </div>
            </div>
            <textarea
              id="formula-editor-textarea"
              data-testid="formula-editor-input"
              rows={3}
              value={formulaText}
              onChange={(e) => setFormulaText(e.target.value)}
              placeholder="Ví dụ: Zn + 2HCl -> ZnCl2 + H2 hoặc n(Zn) = \frac{6,5}{65} = 0,1 mol..."
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          {/* Live Visual Preview */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/25 border-2 border-emerald-300/80 dark:border-emerald-800/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Xem trước hiển thị trực tiếp (Live Preview)</span>
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                Unicode NFC • Chuẩn công thức KHTN
              </span>
            </div>
            <div
              data-testid="formula-live-preview"
              className="min-h-[52px] p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 font-sans font-semibold text-base sm:text-lg text-slate-900 dark:text-white flex items-center flex-wrap gap-1"
            >
              {autoFormattedPreview ? (
                renderFormattedMathAndChem(autoFormattedPreview)
              ) : (
                <span className="text-xs font-sans text-slate-400 italic">
                  Công thức xem trước sẽ hiển thị ngay tại đây khi thầy/cô nhập hoặc chọn mẫu...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            data-testid="formula-confirm-insert-btn"
            disabled={!autoFormattedPreview.trim()}
            onClick={handleConfirmInsert}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Chèn công thức vào {targetFieldLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
