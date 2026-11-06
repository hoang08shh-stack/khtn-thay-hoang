import type { Grade, QuestionType, SubjectDomain, TrueFalseStatement } from '../types/index.ts';

export interface SolutionInput {
  question: string;
  options: string[];
  correctAnswer?: number;
  questionType?: QuestionType;
  domain: SubjectDomain;
  grade: Grade;
  existingExplanation?: string;
  trueFalseStatements?: TrueFalseStatement[];
  shortAnswer?: string;
  shortAnswerUnit?: string;
}

export interface ScientificSolution {
  steps: string[];
  explanation: string;
  status: 'solved' | 'provided' | 'needs_review';
  warnings: string[];
  inferredAnswer: number | null;
  inferredNumeric?: {
    value: number;
    unit: string;
    formatted: string;
  };
}

type Result = { value: number; unit: string };
type Work = { steps: string[]; results?: Result[]; matches?: (option: string) => boolean; warning?: string };
const numberPattern = '([-+]?\\d+(?:[.,]\\d+)?)';
const num = (s: string) => Number(s.replace(',', '.'));
const fmt = (n: number) => Number(n.toPrecision(8)).toString().replace('.', ',');
const plain = (s: string) => s.normalize('NFKC').replace(/−/g, '-');
const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(1e-8, Math.abs(b) * 0.0005);
const review = (warning: string): Work => ({ steps: [], warning });
const hasSymbol = (text: string, symbol: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}_])${symbol}(?![\\p{L}\\p{N}_])`, 'u').test(text);

function quantity(q: string, label: string, units: Record<string, number>): number | null {
  const unitPattern = Object.keys(units)
    .sort((a, b) => b.length - a.length)
    .map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const re = new RegExp(
    `(?:^|[^\\p{L}\\p{N}_])(?:${label})\\s*(?:=|là|bằng|:)\\s*${numberPattern}\\s*(${unitPattern})(?![\\p{L}\\p{N}²³/])`,
    'giu'
  );
  const values = [...q.matchAll(re)].map((m) => num(m[1]) * units[m[2].toLowerCase()]);
  return values.length && values.every((v) => close(v, values[0])) ? values[0] : null;
}

function request(q: string): string {
  return (
    q.match(/(?:tính|xác định|hãy tìm)([\s\S]*)$/i)?.[1] ||
    q
      .split(/(?<=[.?!])\s+/)
      .filter(Boolean)
      .at(-1) ||
    q
  );
}

/**
 * Chuẩn hóa lời giải cũ (có "Bước 1", "Bước 2", "Phân tích dữ kiện", "Dữ kiện đề bài", "Phương pháp giải"...)
 * sang định dạng trình bày ngắn gọn, mạch lạc theo Quy định mới (Mục 10).
 * Giáo viên có thể xem trước và bấm xác nhận khi cần.
 */
export function normalizeSolutionPresentation(rawText: string): {
  normalizedText: string;
  normalizedSteps: string[];
  changed: boolean;
} {
  if (!rawText || !rawText.trim()) {
    return { normalizedText: '', normalizedSteps: [], changed: false };
  }

  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const cleanedLines: string[] = [];

  for (let line of lines) {
    // Bỏ các dòng tiêu đề thừa hoặc phân tích dữ kiện/phương pháp giải chung chung
    if (
      /^(?:Lời giải chi tiết|Lời giải từ tài liệu\/giáo viên|Hướng dẫn cần giáo viên kiểm tra)\s*:?\s*$/i.test(
        line
      )
    ) {
      continue;
    }
    if (
      /^(?:[-•+*]\s*)?(?:Bước\s*\d+\s*[.:)]?\s*)?(?:Phân tích dữ kiện|Phân tích đề bài|Dữ kiện đề bài|Dữ kiện|Yêu cầu bài toán|Phương pháp giải|Ta có các dữ kiện)\s*[:.-]?\s*/i.test(
        line
      )
    ) {
      // Nếu là dòng "Phương pháp giải: Áp dụng kiến thức chuẩn..." hoặc "Dữ kiện: ..." thì lược bỏ hoàn toàn
      if (
        /^(?:[-•+*]\s*)?(?:Bước\s*\d+\s*[.:)]?\s*)?(?:Dữ kiện|Dữ kiện đề bài|Phân tích dữ kiện|Phân tích đề bài|Yêu cầu bài toán|Phương pháp giải)/i.test(
          line
        )
      ) {
        continue;
      }
    }

    // Bỏ dòng "Đối chiếu từng phương án:" hoặc các dòng liệt kê lại 4 phương án A/B/C/D không khớp
    if (/^(?:Bước\s*\d+\s*[.:)]?\s*)?Đối chiếu từng phương án\s*:?$/i.test(line)) {
      continue;
    }
    if (/^[A-D]\.\s+.+:\s*không (?:khớp|đáp ứng)/i.test(line)) {
      continue;
    }

    // Xóa tiền tố "Bước 1:", "Bước 2 (a) ...):", "Thực hiện:", "Kết luận:" ở đầu dòng
    line = line
      .replace(/^[-•+*]\s*/, '')
      .replace(
        /^Bước\s*\d+\s*(?:\([a-d]\)\s*[^:)]*\)\s*)?[.:)\-]?\s*(?:Thực hiện(?:\s+phép\s+tính)?\s*:?\s*|Kết luận\s*:?\s*)?/i,
        ''
      )
      .replace(/^(?:a|b|c|d)\)\s+(?:Giải chi tiết|Phương pháp giải|Kết luận)\s*:?\s*/i, '')
      .replace(/^Vậy\s+chọn\s+đáp\s+án\s+([A-D])\b/i, 'Đáp án: $1')
      .trim();

    if (!line) continue;
    cleanedLines.push(line);
  }

  const normalizedText = cleanedLines.join('\n').trim();
  return {
    normalizedText,
    normalizedSteps: cleanedLines,
    changed: normalizedText !== rawText.trim(),
  };
}

function electrical(q: string): Work | null {
  if (!/điện trở|cường độ dòng điện|hiệu điện thế|ohm|mạch điện|công suất điện/i.test(q))
    return null;
  const U = quantity(q, 'U|hiệu điện thế', { kv: 1000, mv: 0.001, v: 1 });
  const R1 = quantity(q, 'R1', { 'kω': 1000, 'ω': 1, ohm: 1 });
  const R2 = quantity(q, 'R2', { 'kω': 1000, 'ω': 1, ohm: 1 });
  const singleR = quantity(q, 'R|điện trở', { 'kω': 1000, 'ω': 1, ohm: 1 });
  const givenI = quantity(q, 'I|cường độ dòng điện', { ma: 0.001, a: 1 });
  const tMatch = q.match(new RegExp(`${numberPattern}\\s*(phút|giây|s|giờ)(?!\\p{L})`, 'iu'));
  const t = tMatch
    ? num(tMatch[1]) * ({ phút: 60, giây: 1, s: 1, giờ: 3600 }[tMatch[2].toLowerCase()] || 1)
    : null;
  const ask = request(q);
  const pair = R1 !== null || R2 !== null;
  if (/R[3-9]|hỗn hợp|biến trở|điện trở trong/i.test(q))
    return review('Mạch có cấu trúc phức tạp; cần sơ đồ và cách nối đầy đủ để lập lời giải.');
  if (
    pair &&
    (R1 === null ||
      R2 === null ||
      !/nối tiếp|song song/i.test(q) ||
      (/nối tiếp/i.test(q) && /song song/i.test(q)))
  ) {
    return review(
      'Cần đủ R₁, R₂ và xác định rõ mắc nối tiếp hay song song; không tự giả định cách mắc.'
    );
  }
  if (
    [singleR, R1, R2].some((v) => v !== null && v <= 0) ||
    (U !== null && U < 0) ||
    (givenI !== null && givenI < 0) ||
    (t !== null && t <= 0)
  ) {
    return review('Điện trở và thời gian phải dương; kiểm tra lại dấu, giá trị và đơn vị trong đề.');
  }
  const parallel = /song song/i.test(q);
  const derivedR = !pair && singleR === null && U !== null && givenI !== null && givenI > 0;
  const R = pair
    ? parallel
      ? (R1! * R2!) / (R1! + R2!)
      : R1! + R2!
    : derivedR
    ? U! / givenI!
    : singleR;
  if (R === null || (U === null && givenI === null))
    return review(
      'Chưa đọc đủ dữ kiện điện học. Hãy ghi rõ U = … V, R = … Ω hoặc I = … A; kiểm tra cả dữ kiện trong hình.'
    );
  if (R <= 0)
    return review('Điện trở suy ra phải dương trong mô hình dây dẫn đang xét; cần kiểm tra lại U và I.');
  const voltage = U ?? givenI! * R;
  const I = voltage / R;
  if (givenI !== null && !close(givenI, I))
    return review('Các dữ kiện U, I, R không thỏa U = I × R; cần kiểm tra đề trước khi giải.');

  const steps: string[] = [];
  if (pair) {
    steps.push(
      parallel
        ? `R_{tđ} = \\frac{R₁ × R₂}{R₁ + R₂} = \\frac{${fmt(R1!)} × ${fmt(R2!)}}{${fmt(R1!)} + ${fmt(R2!)}} = ${fmt(R!)} Ω.`
        : `R_{tđ} = R₁ + R₂ = ${fmt(R1!)} + ${fmt(R2!)} = ${fmt(R!)} Ω.`
    );
  }
  steps.push(
    derivedR
      ? `R = \\frac{U}{I} = \\frac{${fmt(U!)}}{${fmt(givenI!)}} = ${fmt(R)} Ω.`
      : U !== null
      ? `I = \\frac{U}{${pair ? 'R_{tđ}' : 'R'}} = \\frac{${fmt(voltage)}}{${fmt(R!)}} = ${fmt(I)} A.`
      : `U = I × R = ${fmt(I)} × ${fmt(R!)} = ${fmt(voltage)} V.`
  );
  if (pair && /mỗi|từng|I1|I2|U1|U2/i.test(ask)) {
    steps.push(
      parallel
        ? `U₁ = U₂ = U = ${fmt(voltage)} V; I₁ = U/R₁ = ${fmt(voltage / R1!)} A; I₂ = U/R₂ = ${fmt(voltage / R2!)} A.`
        : `I₁ = I₂ = I = ${fmt(I)} A; U₁ = I × R₁ = ${fmt(I * R1!)} V; U₂ = I × R₂ = ${fmt(I * R2!)} V.`
    );
  }
  const results: Result[] = [];
  if (
    (pair && /điện trở tương đương|R_?\{?tđ/i.test(ask)) ||
    (derivedR && (/điện trở/i.test(ask) || hasSymbol(ask, 'R')))
  )
    results.push({ value: R!, unit: 'Ω' });
  if ((/cường độ|dòng điện/i.test(ask) || hasSymbol(ask, 'I')) && !/mỗi|từng|I1|I2/i.test(ask))
    results.push({ value: I, unit: 'A' });
  if ((/hiệu điện thế/i.test(ask) || hasSymbol(ask, 'U')) && !/mỗi|từng|U1|U2/i.test(ask))
    results.push({ value: voltage, unit: 'V' });
  if (/công suất/i.test(ask) || hasSymbol(ask, 'P')) {
    steps.push(`P = U × I = ${fmt(voltage)} × ${fmt(I)} = ${fmt(voltage * I)} W.`);
    results.push({ value: voltage * I, unit: 'W' });
  }
  if (/nhiệt lượng|điện năng/i.test(ask) || hasSymbol(ask, 'Q')) {
    if (t === null)
      return review(
        'Cần thời gian sử dụng để tính nhiệt lượng hoặc điện năng; ghi t bằng giây, phút hoặc giờ.'
      );
    steps.push(`Q = U × I × t = ${fmt(voltage)} × ${fmt(I)} × ${fmt(t)} = ${fmt(voltage * I * t)} J.`);
    results.push({ value: voltage * I * t, unit: 'J' });
  }
  return {
    steps,
    results,
    warning:
      /mỗi|từng|I1|I2|U1|U2/i.test(ask) && /công suất|nhiệt lượng/i.test(ask)
        ? 'Đề yêu cầu kết quả từng nhánh; phần tính P, Q trên đây là cho toàn mạch, cần bổ sung kết quả từng nhánh.'
        : !results.length && !/mỗi|từng|I1|I2|U1|U2/i.test(ask)
        ? 'Cần xác định rõ đại lượng đề yêu cầu; các phép tính trên chưa đủ để kết luận bài toán.'
        : undefined,
  };
}

function mechanics(q: string): Work | null {
  if (/tốc độ|quãng đường|chuyển động đều/i.test(q)) {
    const distances = [...q.matchAll(new RegExp(`${numberPattern}\\s*(km|m)(?![\\p{L}\\d/²³])`, 'giu'))];
    const times = [...q.matchAll(new RegExp(`${numberPattern}\\s*(phút|giây|giờ|s|h)(?![\\p{L}\\d/])`, 'giu'))];
    if (distances.length > 1 || times.length > 1)
      return review(
        'Đề có nhiều quãng đường hoặc thời gian. Cần xác định từng khoảng và tổng của chúng; không lấy riêng cặp số đầu tiên làm kết quả toàn hành trình.'
      );
    const sMatch = distances[0];
    const tMatch = times[0];
    if (!sMatch || !tMatch || /chặng|giai đoạn|nghỉ|gia tốc/i.test(q))
      return review(
        'Cần xác định tổng quãng đường và tổng thời gian (kể cả thời gian nghỉ nếu có); chưa đủ dữ kiện để tính một tốc độ duy nhất.'
      );
    const s = num(sMatch[1]) * (sMatch[2].toLowerCase() === 'km' ? 1000 : 1);
    const t =
      num(tMatch[1]) *
      ({ phút: 60, giây: 1, giờ: 3600, s: 1, h: 3600 }[tMatch[2].toLowerCase()] || 1);
    if (s < 0 || t <= 0) return review('Quãng đường phải không âm và thời gian phải lớn hơn 0.');
    const v = s / t;
    return {
      steps: [
        `v = \\frac{s}{t} = \\frac{${fmt(s)}}{${fmt(t)}} = ${fmt(v)} m/s (${fmt(v * 3.6)} km/h).`,
      ],
      results: [{ value: v, unit: 'm/s' }],
      warning: !/tốc độ|vận tốc/i.test(request(q))
        ? 'Phép tính trên tìm tốc độ; yêu cầu khác của bài cần giáo viên bổ sung.'
        : undefined,
    };
  }
  if (/áp suất|áp lực/i.test(q)) {
    const F = quantity(q, 'F|áp lực', { n: 1, kn: 1000 });
    const S = quantity(q, 'S|diện tích', { m2: 1, cm2: 0.0001, mm2: 0.000001 });
    if (F === null || S === null || F < 0 || S <= 0 || /chất lỏng|độ sâu|thủy tĩnh/i.test(q))
      return review(
        'Cần áp lực vuông góc F và diện tích tiếp xúc S dương để dùng p = F/S; áp suất chất lỏng cần công thức riêng.'
      );
    const p = F / S;
    return {
      steps: [`p = \\frac{F}{S} = \\frac{${fmt(F)}}{${fmt(S)}} = ${fmt(p)} Pa.`],
      results: [{ value: p, unit: 'Pa' }],
      warning: !/áp suất/i.test(request(q))
        ? 'Phép tính trên tìm áp suất; cần bổ sung lời giải cho đại lượng đề yêu cầu.'
        : undefined,
    };
  }
  return null;
}

function chemistry(q: string): Work | null {
  if (
    !/(?:HCl|H2SO4|hydrochloric|sulfuric|clohiđric|clohidric|sunfuric)/i.test(q) ||
    !/\d\s*(?:gam|g|mol|mL)(?!\p{L})/iu.test(q)
  )
    return null;
  const metals = [
    { re: /\bZn\b|zinc|kẽm/i, symbol: 'Zn', mass: 65, valence: 2 },
    { re: /\bFe\b|iron|sắt/i, symbol: 'Fe', mass: 56, valence: 2 },
    { re: /\bMg\b|magnesium|magie/i, symbol: 'Mg', mass: 24, valence: 2 },
    { re: /\bAl\b|aluminium|nhôm/i, symbol: 'Al', mass: 27, valence: 3 },
  ].filter((m) => m.re.test(q.replace(/\d\s*mg\b/g, '')));
  if (metals.length !== 1 || /hỗn hợp|hiệu suất|tạp chất/i.test(q))
    return review(
      'Cần xác định riêng kim loại, độ tinh khiết, hiệu suất và chất giới hạn; không lấy số gam đầu tiên để thay cho mọi chất.'
    );
  const metal = metals[0];
  const sulfate = /H2SO4|sulfuric|sunfuric/i.test(q);
  if (sulfate && (!/loãng/i.test(q) || /đặc/i.test(q)))
    return review(
      'Chỉ áp dụng phản ứng tạo H₂ với H₂SO₄ loãng. H₂SO₄ đặc có tính oxi hóa; cần điều kiện phản ứng cụ thể.'
    );
  if (sulfate && /HCl|hydrochloric|clohiđric|clohidric/i.test(q))
    return review('Đề có nhiều acid; cần xác định thành phần và chất giới hạn.');
  const massMatches = [
    ...q.matchAll(
      new RegExp(
        `${numberPattern}\\s*(?:gam|g)\\s+(?:${metal.symbol}\\b|zinc|iron|magnesium|aluminium|kẽm|sắt|magie|nhôm)`,
        'giu'
      )
    ),
  ];
  const m =
    massMatches.length === 1
      ? num(massMatches[0][1])
      : quantity(q, `m\\s*\\(?${metal.symbol}\\)?`, { g: 1, gam: 1 });
  if (m === null || m <= 0)
    return review('Chưa xác định được khối lượng kim loại; hãy ghi rõ số gam gắn với tên kim loại.');
  const acid = sulfate ? 'H₂SO₄' : 'HCl';
  const z = metal.valence;
  const ratio = sulfate ? z / 2 : z;
  const salt = sulfate
    ? z === 3
      ? 'Al₂(SO₄)₃'
      : `${metal.symbol}SO₄`
    : `${metal.symbol}Cl${z === 3 ? '₃' : '₂'}`;
  const eq = sulfate
    ? z === 3
      ? '2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂'
      : `${metal.symbol} + H₂SO₄ → ${salt} + H₂`
    : z === 3
    ? '2Al + 6HCl → 2AlCl₃ + 3H₂'
    : `${metal.symbol} + 2HCl → ${salt} + H₂`;
  const volumeMatch = q.match(new RegExp(`${numberPattern}\\s*(mL|L|lít)\\s*(?:dung dịch|dd)`, 'iu'));
  const volume = volumeMatch
    ? num(volumeMatch[1]) * (volumeMatch[2].toLowerCase() === 'ml' ? 0.001 : 1)
    : null;
  const cMatch = q.match(new RegExp(`${numberPattern}\\s*(?:mol/L|M)(?![\\p{L}\\d])`, 'iu'));
  const concentration = cMatch ? num(cMatch[1]) : null;
  if ((volume !== null && volume <= 0) || (concentration !== null && concentration <= 0))
    return review('Thể tích dung dịch và nồng độ phải dương.');
  const givenMass = q.match(
    new RegExp(`(?:M\\s*\\(\\s*${metal.symbol}\\s*\\)|(?<![\\p{L}\\p{N}])${metal.symbol})\\s*=\\s*${numberPattern}`, 'u')
  );
  const M = givenMass ? num(givenMass[1]) : metal.mass;
  if (M <= 0) return review('Khối lượng mol phải dương.');
  const n = m / M;
  const acidAvailable = volume !== null && concentration !== null ? volume * concentration : null;
  const complete =
    /vừa đủ|(?:acid|HCl|H2SO4|axit)(?:\s*\([^)]*\))?\s*(?:loãng\s*)?dư|dư\s+(?:dung dịch|HCl|H2SO4)|tan hết|hòa tan hoàn toàn/i.test(
      q
    );
  if (acidAvailable === null && !complete)
    return review(
      'Chưa biết lượng acid hoặc acid có dư/vừa đủ hay không; chưa thể kết luận toàn bộ kim loại phản ứng.'
    );
  const reacted = acidAvailable === null ? n : Math.min(n, acidAvailable / ratio);
  if (acidAvailable !== null && /vừa đủ/i.test(q) && !close(n * ratio, acidAvailable))
    return review('Dữ kiện nồng độ, thể tích acid mâu thuẫn với điều kiện phản ứng vừa đủ.');
  if (
    acidAvailable !== null &&
    complete &&
    acidAvailable < n * ratio &&
    !close(acidAvailable, n * ratio)
  )
    return review(
      'Lượng acid không đủ để toàn bộ kim loại phản ứng, mâu thuẫn với điều kiện acid dư hoặc kim loại tan hết.'
    );
  const h2 = (reacted * z) / 2;
  const saltN = reacted / (sulfate && z === 3 ? 2 : 1);
  const saltM = sulfate ? (z === 3 ? 2 * M + 3 * 96 : M + 96) : M + z * 35.5;

  // Trình bày ngắn gọn, mạch lạc đúng chuẩn Mục 10
  const steps: string[] = [
    eq,
    `n(${metal.symbol}) = \\frac{${fmt(m)}}{${fmt(M)}} = ${fmt(n)} mol.`,
  ];
  if (acidAvailable !== null) {
    steps.push(`n(${acid}) = ${fmt(concentration!)} × ${fmt(volume!)} = ${fmt(acidAvailable)} mol.`);
  }
  steps.push('Theo phương trình hóa học:');
  if (z === 2) {
    steps.push(`n(H₂) = n(${metal.symbol}) = ${fmt(h2)} mol.`);
  } else {
    steps.push(`n(H₂) = ${fmt(z / 2)} × n(${metal.symbol}) = ${fmt(h2)} mol.`);
  }

  const results: Result[] = [];
  const ask = request(q);
  let warning: string | undefined;
  if (/thể tích|bao nhiêu.*(?:lít|L)/i.test(ask)) {
    const vmMatch = q.match(new RegExp(`(?:Vm|V_m|Vₘ)\\s*=\\s*${numberPattern}\\s*(?:L|lít)/mol`, 'iu'));
    const modern = /đkc|điều kiện chuẩn|25\s*°?\s*C/i.test(q) && !/đktc|tiêu chuẩn/i.test(q);
    const standard = /đktc|điều kiện tiêu chuẩn|0\s*°\s*C/i.test(q);
    const vm = vmMatch ? num(vmMatch[1]) : modern ? 24.79 : standard ? 22.4 : null;
    const explicitOtherConditions = /(?:\d+(?:[.,]\d+)?)\s*(?:°\s*C|bar|atm)/gi;
    const conditions = [...q.matchAll(explicitOtherConditions)].map((m) =>
      m[0].replace(/\s/g, '').toLowerCase()
    );
    const conflictingConditions =
      /đkc|điều kiện chuẩn/i.test(q) && /đktc|điều kiện tiêu chuẩn/i.test(q);
    const supportedConditions =
      !conflictingConditions &&
      (vmMatch ||
        conditions.every((c) => (modern ? ['25°c', '1bar'].includes(c) : ['0°c', '1atm'].includes(c))));
    if (vm === null || vm <= 0 || !supportedConditions)
      warning =
        'Cần nhiệt độ, áp suất hoặc thể tích mol khí Vₘ; không tự dùng 24,79 L/mol cho mọi điều kiện.';
    else {
      const V = h2 * vm;
      const roundedV = Math.round(V * 100) / 100;
      const approxPart = !close(V, roundedV) ? ` ≈ ${fmt(roundedV)}` : '';
      steps.push(`V(H₂) = ${fmt(h2)} × ${fmt(vm)} = ${fmt(V)}${approxPart} L.`);
      results.push({ value: V, unit: 'L' });
    }
  }
  if (/khối lượng muối/i.test(ask)) {
    steps.push(
      `n(${salt}) = ${fmt(saltN)} mol ⇒ m(${salt}) = ${fmt(saltN)} × ${fmt(saltM)} = ${fmt(saltN * saltM)} g.`
    );
    results.push({ value: saltN * saltM, unit: 'g' });
  }
  if (/nồng độ/i.test(ask)) {
    if (volume === null || !/vừa đủ/i.test(q) || /sau phản ứng|phần trăm/i.test(ask))
      warning =
        'Chỉ suy ra nồng độ mol acid ban đầu từ lượng kim loại khi acid vừa đủ và biết thể tích dung dịch; yêu cầu khác cần bổ sung dữ kiện.';
    else {
      const c = (n * ratio) / volume;
      steps.push(
        `n(${acid}) = ${fmt(ratio)} × ${fmt(n)} = ${fmt(n * ratio)} mol ⇒ C_M(${acid}) = \\frac{${fmt(n * ratio)}}{${fmt(volume)}} = ${fmt(c)} mol/L.`
      );
      results.push({ value: c, unit: 'mol/L' });
    }
  }
  return { steps, results, warning };
}

function biologyAndAtoms(q: string): Work | null {
  const zMatch = q.match(/\bZ\s*=\s*([-+]?\d+(?:[.,]\d+)?)/i);
  if (zMatch && /nguyên tử|proton|electron|hạt nhân/i.test(q)) {
    const z = num(zMatch[1]);
    if (
      !Number.isInteger(z) ||
      z < 1 ||
      z > 20 ||
      /ion|điện tích\s*[+-]|mất|nhận thêm/i.test(q)
    )
      return review(
        'Phân bố electron tự động chỉ áp dụng cho nguyên tử trung hòa có Z nguyên từ 1 đến 20; ion và nguyên tố khác cần xét cấu hình riêng.'
      );
    const nMatch = q.match(/(?:\bn|neutron)\s*(?:=|là)\s*([-+]?\d+(?:[.,]\d+)?)/i);
    const n = nMatch ? num(nMatch[1]) : null;
    if (n !== null && (!Number.isInteger(n) || n < 0))
      return review('Số neutron phải là số nguyên không âm.');
    const shells = [
      Math.min(z, 2),
      Math.min(Math.max(z - 2, 0), 8),
      Math.min(Math.max(z - 10, 0), 8),
      Math.max(z - 18, 0),
    ].filter((v) => v > 0);
    const steps = [
      `Nguyên tử trung hòa về điện: p = e = Z = ${z}.`,
      `Phân bố electron trên các lớp: ${shells.join(' – ')}.`,
    ];
    if (n !== null) {
      steps.push(`Số khối: A = p + n = ${z} + ${n} = ${z + n} (khối lượng nguyên tử xấp xỉ ${z + n} amu).`);
    }
    return {
      steps,
      warning:
        n === null && /neutron|số khối|khối lượng/i.test(request(q))
          ? 'Chỉ biết Z chưa xác định được số neutron hoặc số khối; cần thêm thông tin đồng vị.'
          : undefined,
    };
  }
  if (/DNA|ADN/i.test(q) && /\bN\s*=/i.test(q)) {
    const N = num(q.match(/\bN\s*=\s*([-+]?\d+(?:[.,]\d+)?)/i)?.[1] || 'NaN');
    const A = num(q.match(/\bA\s*=\s*([-+]?\d+(?:[.,]\d+)?)/i)?.[1] || 'NaN');
    if (
      !/mạch kép|hai mạch/i.test(q) ||
      /một mạch|mạch đơn|%/i.test(q) ||
      !Number.isInteger(A) ||
      N <= 0 ||
      N % 2 !== 0 ||
      A < 0 ||
      A > N / 2
    )
      return review(
        'Cần N là tổng nucleotide của cả hai mạch DNA và A là số lượng trên cả phân tử (0 ≤ A ≤ N/2); không thay trực tiếp phần trăm hoặc số liệu một mạch.'
      );
    const G = N / 2 - A;
    return {
      steps: [
        `Theo nguyên tắc bổ sung: A = T = ${A} nucleotide; G = C = \\frac{N - 2A}{2} = \\frac{${N} - 2 × ${A}}{2} = ${G} nucleotide.`,
        `Số liên kết hydrogen: H = 2A + 3G = 2 × ${A} + 3 × ${G} = ${2 * A + 3 * G}.`,
      ],
    };
  }

  const concepts: Array<{
    when: boolean;
    answer: string;
    basis: string;
    matches: (o: string) => boolean;
  }> = [
    {
      when: /hạt.*mang điện tích âm/i.test(q) && /hạt nào|là gì/i.test(q),
      answer: 'Electron',
      basis:
        'Trong mô hình nguyên tử Rutherford – Bohr, electron ở lớp vỏ mang điện tích âm (−1e); proton mang điện tích dương (+1e); neutron không mang điện.',
      matches: (o) => /^(?:hạt\s+)?electron(?:\s*\(e\))?\.?$/i.test(o.trim()),
    },
    {
      when: /bào quan nào.*quang hợp/i.test(q),
      answer: 'Lục lạp',
      basis:
        'Lục lạp chứa chất diệp lục hấp thụ năng lượng ánh sáng để tổng hợp chất hữu cơ từ CO₂ và H₂O.',
      matches: (o) => /^(?:bào quan\s+)?lục lạp\.?$/i.test(o.trim()),
    },
    {
      when: /bào quan nào.*hô hấp tế bào/i.test(q),
      answer: 'Ti thể',
      basis:
        'Ở tế bào nhân thực, ti thể là nơi diễn ra hô hấp tế bào tạo năng lượng ATP cho hoạt động sống.',
      matches: (o) => /^(?:bào quan\s+)?ti thể\.?$/i.test(o.trim()),
    },
    {
      when: /kim loại nào.*phản ứng với dung dịch\s*(?:HCl|H2SO4|Hydrochloric|Sulfuric)\s*loãng.*giải phóng\s*(?:khí\s*)?H2/i.test(
        q
      ),
      answer: 'Zn',
      basis:
        'Kim loại đứng trước H trong dãy hoạt động hóa học (như Mg, Al, Zn, Fe) tác dụng với dung dịch HCl loãng giải phóng khí H₂ (Zn + 2HCl → ZnCl₂ + H₂).',
      matches: (o) => /^(?:Zn|Fe|Mg|Al|Kẽm|Sắt|Magie|Nhôm)\b/i.test(o.trim()),
    },
    {
      when: /H2SO4.*phân li.*SO4.*cation nào/i.test(q),
      answer: 'H⁺',
      basis: 'Phương trình điện li trong nước: H₂SO₄ → 2H⁺ + SO₄²⁻.',
      matches: (o) => /^H[⁺+]$|^H\^\+$/i.test(o.trim()),
    },
  ];
  const concept = concepts.find((c) => c.when);
  if (concept && !/không phải|sai|ngoại trừ/i.test(q)) {
    return {
      steps: [concept.basis],
      matches: concept.matches,
    };
  }
  if (/phenolphthalein|quỳ tím/i.test(q) && !/trộn|trung hòa|thêm.*(?:đến|dư)|chuẩn độ/i.test(q)) {
    if (/không phải|không đúng|sai|ngoại trừ|pH\s*[=<>]|nồng độ|mol\/L|\d\s*M\b/i.test(q))
      return review(
        'Cần xét chính xác yêu cầu phủ định, pH hoặc nồng độ và khoảng đổi màu chất chỉ thị; không chỉ dựa vào tên acid/base.'
      );
    const acid = /HCl|H2SO4|môi trường acid|môi trường axit/i.test(q);
    const base = /NaOH|KOH|Ca\(OH\)2|môi trường base|môi trường bazơ/i.test(q);
    if (acid === base)
      return review(
        'Cần xác định môi trường cuối cùng của dung dịch trước khi suy ra màu chất chỉ thị.'
      );
    const phenol = /phenolphthalein/i.test(q);
    const color = phenol ? (base ? 'hồng' : 'không màu') : base ? 'xanh' : 'đỏ';
    return {
      steps: [
        base
          ? 'Dung dịch kiềm phân li ra ion OH⁻ có môi trường base (pH > 7).'
          : 'Dung dịch acid phân li ra ion H⁺ có môi trường acid (pH < 7).',
        phenol
          ? `Phenolphthalein chuyển sang màu ${color} trong môi trường này.`
          : `Giấy quỳ tím chuyển sang màu ${color} trong môi trường này.`,
      ],
      matches: (o) =>
        new RegExp(color, 'i').test(o) && !/không.*hồng|không.*xanh|không.*đỏ/i.test(o),
    };
  }
  return null;
}

const hasUnsupportedArithmetic = (option: string) =>
  /10\s*\^|\d[eE][+-]?\d|\d\s*[/*×÷]\s*[-+]?\d/.test(plain(option));
function matchesResult(option: string, result: Result): boolean {
  if (hasUnsupportedArithmetic(option)) return false;
  const units: Record<string, Record<string, number>> = {
    A: { A: 1, mA: 0.001 },
    V: { V: 1, mV: 0.001, kV: 1000 },
    Ω: { Ω: 1, kΩ: 1000 },
    W: { W: 1, kW: 1000 },
    J: { J: 1, kJ: 1000 },
    Pa: { Pa: 1, kPa: 1000 },
    L: { L: 1, lít: 1, ml: 0.001, mL: 0.001 },
    g: { g: 1, gam: 1, kg: 1000 },
    'm/s': { 'm/s': 1, 'km/h': 1 / 3.6 },
    'mol/L': { 'mol/L': 1, M: 1 },
  };
  return Object.entries(units[result.unit] || {}).some(([unit, factor]) => {
    const re = new RegExp(`${numberPattern}\\s*${unit.replace('/', '\\/')}(?![\\p{L}\\p{N}/])`, 'gu');
    return [...plain(option).matchAll(re)].some((m) => close(num(m[1]) * factor, result.value));
  });
}

/**
 * Tách lời giải thành các dòng mạch lạc để hiển thị, TUYỆT ĐỐI KHÔNG tự chèn
 * "Bước 1", "Bước 2", "Dữ kiện:", "Phân tích dữ kiện", "Phương pháp giải".
 */
export function explanationSteps(text: string): string[] {
  if (!text || !text.trim()) return [];
  const cleaned = text
    .trim()
    .replace(/^(?:Lời giải chi tiết|Lời giải từ tài liệu\/giáo viên|Hướng dẫn cần giáo viên kiểm tra):\s*\n?/i, '')
    .replace(/^[ \t]*[-•*+]\s*/gm, '');
  return cleaned
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function generateScientificSolution(input: SolutionInput): ScientificSolution {
  const q = plain(input.question);
  const work = electrical(q) || mechanics(q) || chemistry(q) || biologyAndAtoms(q);
  const qType = input.questionType || (input.options.length === 0 ? 'essay' : 'single_choice');
  const isTrueFalse4 =
    qType === 'true_false' &&
    Array.isArray(input.trueFalseStatements) &&
    input.trueFalseStatements.length > 0;
  const isShortAnswer = qType === 'short_answer';
  const essay = qType === 'essay' || (!isTrueFalse4 && !isShortAnswer && input.options.length === 0);
  const key = input.correctAnswer ?? -1;
  const hasKey = Number.isInteger(key) && key >= 0 && key < input.options.length;
  const unparsedOption = Boolean(work?.results?.length && input.options.some(hasUnsupportedArithmetic));
  const matches =
    work && !work.warning && !unparsedOption && input.options.length > 0
      ? input.options.flatMap((o, i) =>
          work.matches?.(o) ||
          (work.results?.length && work.results.every((r) => matchesResult(o, r)))
            ? [i]
            : []
        )
      : [];
  const inferredAnswer = matches.length === 1 ? matches[0] : null;
  const primaryResult = work?.results?.[0];
  const inferredNumeric = primaryResult
    ? {
        value: primaryResult.value,
        unit: primaryResult.unit === 'L' ? 'lít' : primaryResult.unit,
        formatted: fmt(Math.round(primaryResult.value * 100) / 100),
      }
    : undefined;

  const warnings: string[] = [];
  const provided = input.existingExplanation?.trim();
  if (unparsedOption)
    warnings.push(
      'Phương án chứa biểu thức số chưa được tính tự động; cần viết kết quả số kèm đơn vị để đối chiếu chính xác.'
    );

  if (provided && !essay && !isTrueFalse4 && !isShortAnswer && hasKey) {
    const conclusions = [
      ...provided.matchAll(
        /(?:^|[\n:;.!?⇒]\s*)(?:(?:vậy|do đó|nên|suy ra)\s+)?(?:chọn(?:\s+đáp\s+án)?|đáp\s+án(?:\s+đúng)?(?:\s+là)?)\s+([A-D])(?!\p{L})/giu
      ),
    ];
    if (conclusions.some((m) => m[1].toUpperCase().charCodeAt(0) - 65 !== key)) {
      warnings.push(
        'PHÁT HIỆN ĐÁP ÁN KHÔNG KHỚP – CẦN GIÁO VIÊN KIỂM TRA. Kết luận chọn đáp án trong lời giải gốc khác với đáp án đang chọn (mâu thuẫn). Cần sửa hoặc kiểm tra lại lời giải gốc.'
      );
    }
  }
  if (work?.warning && !provided) warnings.push(work.warning);
  if (!essay && !isTrueFalse4 && !isShortAnswer && inferredAnswer !== null && hasKey && key !== inferredAnswer) {
    warnings.push(
      `PHÁT HIỆN ĐÁP ÁN KHÔNG KHỚP – CẦN GIÁO VIÊN KIỂM TRA. Đáp án đã chọn ${String.fromCharCode(65 + key)} mâu thuẫn với kết quả tính/kiến thức (${String.fromCharCode(65 + inferredAnswer)}). Hãy kiểm tra đề và đáp án.`
    );
  }

  if (isShortAnswer) {
    const rawAns = input.shortAnswer?.trim();
    if (!rawAns && !inferredNumeric) {
      warnings.push('Câu trả lời ngắn chưa có đáp án số hoặc từ khóa chuẩn; giáo viên cần nhập đáp án.');
    } else if (rawAns && inferredNumeric) {
      const parsedNum = Number(rawAns.replace(',', '.').replace(/[^\d.-]/g, ''));
      if (
        !Number.isNaN(parsedNum) &&
        Math.abs(parsedNum - inferredNumeric.value) > Math.max(0.05, Math.abs(inferredNumeric.value) * 0.02)
      ) {
        warnings.push(
          `PHÁT HIỆN ĐÁP ÁN KHÔNG KHỚP – CẦN GIÁO VIÊN KIỂM TRA. Đáp án trả lời ngắn (${rawAns}) mâu thuẫn với kết quả tính toán (${inferredNumeric.formatted} ${inferredNumeric.unit}).`
        );
      }
    }
  } else if (isTrueFalse4) {
    const missingTf = (input.trueFalseStatements || []).filter(
      (st) => st.isTrue === null || st.isTrue === undefined
    );
    if (missingTf.length > 0) {
      warnings.push(
        `Câu Đúng/Sai còn thiếu đáp án cho ý: ${missingTf.map((s) => `${s.label})`).join(', ')}. Giáo viên cần chọn Đúng hoặc Sai.`
      );
    }
  } else if (!essay) {
    if (!hasKey && inferredAnswer === null)
      warnings.push('Chưa xác định được đáp án đúng; giáo viên cần chọn đáp án, không mặc định phương án A.');
    if (work && !work.warning && (work.matches || work.results?.length) && inferredAnswer === null)
      warnings.push(
        'Chưa có một phương án duy nhất khớp kết quả và đơn vị; kiểm tra phương án, quy tắc làm tròn hoặc dữ kiện.'
      );
    if (work && !work.warning && !work.matches && !work.results?.length && !provided)
      warnings.push(
        'Đã lập các bước tính nhưng chưa đối chiếu được phương án; cần giáo viên bổ sung kết luận chính xác.'
      );
    if (!provided && !work)
      warnings.push(
        'Chưa có quy tắc giải đủ tin cậy cho câu này. Cần bổ sung lời giải hoặc đáp án mẫu từ giáo viên; không suy diễn lời giải chỉ từ phương án được chọn.'
      );
  } else if (!provided && !work) {
    warnings.push(
      'Chưa có quy tắc giải đủ tin cậy cho câu này. Cần bổ sung lời giải hoặc đáp án mẫu từ giáo viên; không suy diễn lời giải chỉ từ phương án được chọn.'
    );
  }

  let steps: string[];
  if (provided) {
    steps = explanationSteps(provided);
  } else if (isTrueFalse4 && input.trueFalseStatements) {
    // Đối với câu Đúng/Sai: tạo giải thích ngắn gọn cho từng ý, KHÔNG lặp lại "Bước 1..4" hay "a), b), c), d)"
    steps = input.trueFalseStatements.map((st) => {
      const verdict = st.isTrue === true ? 'Đúng' : st.isTrue === false ? 'Sai' : 'Chưa xác định';
      const cleanExp = (st.explanation || '')
        .replace(/^[a-d]\s*[.)]\s*/i, '')
        .trim();
      return cleanExp ? `${verdict}. ${cleanExp}` : `${verdict} theo kiến thức chuẩn KHTN Lớp ${input.grade}.`;
    });
  } else {
    const raw = work?.steps.length ? [...work.steps] : [];
    const targetIdx = hasKey ? key : inferredAnswer ?? -1;

    if (!essay && !isTrueFalse4 && !isShortAnswer && targetIdx >= 0 && input.options[targetIdx] && !warnings.length) {
      raw.push(`Đáp án: ${String.fromCharCode(65 + targetIdx)} (${input.options[targetIdx]}).`);
    } else if (isShortAnswer && (inferredNumeric || input.shortAnswer)) {
      const ansDisplay = input.shortAnswer?.trim() || (inferredNumeric ? `${inferredNumeric.formatted}` : '');
      const unitDisplay = input.shortAnswerUnit?.trim() || inferredNumeric?.unit || '';
      raw.push(`Đáp án: ${ansDisplay}${unitDisplay ? ` ${unitDisplay}` : ''}.`);
    } else if (raw.length === 0 && warnings.length > 0) {
      raw.push(warnings.join(' '));
    }
    steps = raw;
  }

  const status = warnings.length ? 'needs_review' : provided ? 'provided' : 'solved';
  const explanationLines = [...steps];
  if (warnings.length && !provided) {
    const mismatchWarn = warnings.find((w) => /PHÁT HIỆN ĐÁP ÁN KHÔNG KHỚP|mâu thuẫn/i.test(w));
    if (mismatchWarn && !explanationLines.some((l) => l.includes(mismatchWarn))) {
      explanationLines.push(`⚠️ ${mismatchWarn}`);
    }
  }

  return {
    steps,
    status,
    warnings,
    inferredAnswer,
    inferredNumeric,
    explanation: explanationLines.join('\n'),
  };
}
