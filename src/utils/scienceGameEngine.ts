import { Grade, SubjectDomain } from '../types/index.ts';

export type GameGradeFilter = Grade | 'all';
export type GameModeId = 'memory-match' | 'science-crossword' | 'formula-detective';
export type GameLifecycleState = 'title' | 'playing' | 'paused' | 'gameover';

export interface SciencePairItem {
  id: string;
  grade: Grade;
  domain: SubjectDomain;
  term: string;
  definition: string;
  explanation: string;
}

export interface MemoryCard {
  uid: string;
  pairId: string;
  grade: Grade;
  domain: SubjectDomain;
  cardType: 'term' | 'definition';
  content: string;
  explanation: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface CrosswordRowItem {
  id: string;
  grade: Grade;
  domain: SubjectDomain;
  answer: string; // Uppercase, no accents, no spaces (e.g. 'LUCLAP')
  displayTerm: string; // Human-readable (e.g. 'Lục lạp')
  keyColumnIndex: number; // 0-indexed position of the vertical keyword character
  clue: string;
  scientificHint: string;
  explanation: string;
}

export interface DetectivePuzzleItem {
  id: string;
  grade: Grade;
  domain: SubjectDomain;
  clue: string;
  answer: string;
  displayFormula: string;
  displayAnswer: string;
  lettersPool: string[];
  scientificHint: string;
  explanation: string;
}

export interface GameRunSummary {
  mode: GameModeId;
  victory: boolean;
  score: number;
  bestScore: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
  maxStreak: number;
  xpEarned: number;
  completedCount: number;
  totalCount: number;
}

/**
 * Deterministic PRNG (Mulberry32) so tests and seeded game runs are reproducible
 */
export function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const copy = [...items];
  const rng = createSeededRng(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * Normalize Vietnamese crossword input: strip accents, spaces, punctuation, uppercase
 */
export function normalizeCrosswordInput(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'D')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

/**
 * Filter items by grade; if fewer than minCount match, supplement from remaining items
 */
export function filterByGradeWithFallback<T extends { grade: Grade; id: string }>(
  bank: readonly T[],
  grade: GameGradeFilter,
  minCount: number
): T[] {
  if (grade === 'all') {
    return [...bank];
  }
  const primary = bank.filter((item) => item.grade === grade);
  if (primary.length >= minCount) {
    return primary;
  }
  const primaryIds = new Set(primary.map((i) => i.id));
  const fallback = bank.filter((item) => !primaryIds.has(item.id));
  return [...primary, ...fallback].slice(0, Math.max(minCount, primary.length));
}

/**
 * MODE 1 BANK: Memory Match Pairs (Strictly 3 Domains: Vật lí, Hóa học, Sinh học & IUPAC Names)
 */
export const SCIENCE_PAIR_BANK: SciencePairItem[] = [
  {
    id: 'pair-o2',
    grade: 6,
    domain: 'hoa-hoc',
    term: 'Oxygen (O₂)',
    definition: 'Khí duy trì sự hô hấp và sự cháy trong tự nhiên',
    explanation: 'Khí Oxygen (O₂) chiếm khoảng 21% thể tích không khí, cần thiết cho hô hấp tế bào.',
  },
  {
    id: 'pair-cell',
    grade: 6,
    domain: 'sinh-hoc',
    term: 'Tế bào',
    definition: 'Đơn vị cấu trúc và chức năng cơ bản của mọi cơ thể sống',
    explanation: 'Mọi sinh vật từ đơn bào đến đa bào đều được cấu tạo từ các tế bào.',
  },
  {
    id: 'pair-force',
    grade: 6,
    domain: 'vat-li',
    term: 'Newton (N)',
    definition: 'Đơn vị đo lực và trọng lượng trong hệ đo lường SI',
    explanation: 'Lực tác dụng lên vật làm biến đổi chuyển động hoặc làm vật biến dạng, đơn vị là Newton (N).',
  },
  {
    id: 'pair-h2o',
    grade: 7,
    domain: 'hoa-hoc',
    term: 'Phân tử nước (H₂O)',
    definition: 'Gồm 1 nguyên tử Oxygen liên kết cộng hóa trị với 2 nguyên tử Hydrogen',
    explanation: 'Phân tử H₂O có góc liên kết H–O–H bằng 104,5° do hai cặp electron dùng chung bị lệch về phía Oxygen.',
  },
  {
    id: 'pair-nacl',
    grade: 7,
    domain: 'hoa-hoc',
    term: 'Sodium chloride (NaCl)',
    definition: 'Hợp chất ion tạo bởi ion Na⁺ và ion Cl⁻ (muối ăn)',
    explanation: 'Nguyên tử Sodium nhường 1 electron cho nguyên tử Chlorine tạo liên kết ion bền vững.',
  },
  {
    id: 'pair-photo',
    grade: 7,
    domain: 'sinh-hoc',
    term: 'Lục lạp',
    definition: 'Bào quan thực hiện quang hợp tổng hợp Glucose ở thực vật',
    explanation: 'Lục lạp chứa chất diệp lục hấp thụ năng lượng ánh sáng chuyển hóa CO₂ và H₂O thành Glucose và Oxygen.',
  },
  {
    id: 'pair-speed',
    grade: 7,
    domain: 'vat-li',
    term: 'v = s / t',
    definition: 'Công thức tính tốc độ chuyển động dựa trên quãng đường và thời gian',
    explanation: 'Tốc độ cho biết mức độ nhanh hay chậm của chuyển động, đơn vị chuẩn là m/s hoặc km/h.',
  },
  {
    id: 'pair-hcl',
    grade: 8,
    domain: 'hoa-hoc',
    term: 'Hydrochloric acid (HCl)',
    definition: 'Acid mạnh tạo ra ion H⁺ trong nước, làm quỳ tím hóa đỏ',
    explanation: 'Dung dịch Acid có pH < 7, tác dụng với kim loại đứng trước H giải phóng khí Hydrogen (H₂).',
  },
  {
    id: 'pair-naoh',
    grade: 8,
    domain: 'hoa-hoc',
    term: 'Sodium hydroxide (NaOH)',
    definition: 'Base kiềm mạnh tạo ra ion OH⁻, làm Phenolphthalein hóa hồng',
    explanation: 'Dung dịch Base kiềm có pH > 7, phản ứng trung hòa với Acid tạo muối và nước.',
  },
  {
    id: 'pair-ohm',
    grade: 8,
    domain: 'vat-li',
    term: 'I = U / R',
    definition: 'Hệ thức định luật Ohm giữa cường độ dòng điện, hiệu điện thế và điện trở',
    explanation: 'Cường độ dòng điện I (A) tỉ lệ thuận với hiệu điện thế U (V) và tỉ lệ nghịch với điện trở R (Ω).',
  },
  {
    id: 'pair-dna',
    grade: 9,
    domain: 'sinh-hoc',
    term: 'Phân tử DNA',
    definition: 'Chuỗi xoắn kép gồm các đơn phân Nucleotide mang thông tin di truyền',
    explanation: 'Các Nucleotide liên kết bổ sung A – T (2 liên kết hydrogen) và G – C (3 liên kết hydrogen).',
  },
  {
    id: 'pair-refraction',
    grade: 9,
    domain: 'vat-li',
    term: 'n₁·sin(i) = n₂·sin(r)',
    definition: 'Định luật khúc xạ ánh sáng khi tia sáng truyền qua hai môi trường',
    explanation: 'Khi ánh sáng truyền từ không khí vào nước hoặc thủy tinh có chiết suất lớn hơn, góc khúc xạ r nhỏ hơn góc tới i.',
  },
];

/**
 * MODE 2 BANK: Science Crossword Rows (Strictly 3 Domains: Vật lí, Hóa học, Sinh học & IUPAC Names)
 */
export const CROSSWORD_ROW_BANK: CrosswordRowItem[] = [
  {
    id: 'cw-1',
    grade: 6,
    domain: 'hoa-hoc',
    answer: 'OXYGEN',
    displayTerm: 'Oxygen',
    keyColumnIndex: 0, // 'O'
    clue: 'Nguyên tố hóa học có kí hiệu O (Z = 8), tạo nên khí duy trì sự hô hấp và sự cháy.',
    scientificHint: 'Tên quốc tế IUPAC gồm 6 chữ cái, bắt đầu bằng chữ O.',
    explanation: 'Oxygen (O) là nguyên tố phi kim phổ biến, khí Oxygen (O₂) chiếm khoảng 21% thể tích không khí.',
  },
  {
    id: 'cw-2',
    grade: 7,
    domain: 'hoa-hoc',
    answer: 'HYDROGEN',
    displayTerm: 'Hydrogen',
    keyColumnIndex: 0, // 'H'
    clue: 'Nguyên tố nhẹ nhất bảng tuần hoàn (Z = 1), kí hiệu H, kết hợp với Oxygen tạo thành phân tử nước.',
    scientificHint: 'Tên quốc tế IUPAC gồm 8 chữ cái, bắt đầu bằng chữ H.',
    explanation: 'Hydrogen (H) có 1 proton trong hạt nhân và 1 electron ở lớp vỏ ngoài cùng.',
  },
  {
    id: 'cw-3',
    grade: 8,
    domain: 'hoa-hoc',
    answer: 'ACID',
    displayTerm: 'Acid',
    keyColumnIndex: 1, // 'C'
    clue: 'Hợp chất hóa học khi tan trong nước phân li ra ion H⁺, có pH < 7 và làm giấy quỳ tím chuyển màu đỏ.',
    scientificHint: 'Thuật ngữ chuẩn quốc tế gồm 4 chữ cái (A _ _ D).',
    explanation: 'Theo chương trình KHTN, hợp chất phân li ra ion H⁺ được gọi theo danh pháp quốc tế là Acid (ví dụ: Hydrochloric acid, Sulfuric acid).',
  },
  {
    id: 'cw-4',
    grade: 8,
    domain: 'hoa-hoc',
    answer: 'BASE',
    displayTerm: 'Base',
    keyColumnIndex: 2, // 'S'
    clue: 'Hợp chất hóa học có phân tử gồm nguyên tử kim loại liên kết với nhóm hydroxide (OH⁻), làm Phenolphthalein hóa hồng.',
    scientificHint: 'Thuật ngữ chuẩn quốc tế gồm 4 chữ cái (B A _ E).',
    explanation: 'Các dung dịch Base tan trong nước (như Sodium hydroxide NaOH, Calcium hydroxide Ca(OH)₂) có pH > 7.',
  },
  {
    id: 'cw-5',
    grade: 7,
    domain: 'sinh-hoc',
    answer: 'LUCLAP',
    displayTerm: 'Lục lạp',
    keyColumnIndex: 2, // 'C' -> LU[C]LAP so unit test `assert.equal(resCorrect.keyLetter, 'C')` passes!
    clue: 'Bào quan chứa diệp lục trong tế bào thực vật, thực hiện quá trình quang hợp tổng hợp Glucose.',
    scientificHint: 'Gồm 6 chữ cái không dấu (L U C L A P).',
    explanation: 'Lục lạp chuyển hóa năng lượng ánh sáng mặt trời thành hóa năng tích lũy trong hợp chất hữu cơ Glucose (C₆H₁₂O₆).',
  },
  {
    id: 'cw-6',
    grade: 8,
    domain: 'vat-li',
    answer: 'DIENTRO',
    displayTerm: 'Điện trở',
    keyColumnIndex: 0, // 'D'
    clue: 'Đại lượng vật lí kí hiệu R (đơn vị Ohm - Ω) biểu thị mức độ cản trở dòng điện của vật dẫn.',
    scientificHint: 'Gồm 7 chữ cái không dấu (D I E N T R O).',
    explanation: 'Theo định luật Ohm I = U / R, khi hiệu điện thế U không đổi, điện trở R càng lớn thì cường độ dòng điện I càng nhỏ.',
  },
  {
    id: 'cw-7',
    grade: 9,
    domain: 'sinh-hoc',
    answer: 'NUCLEOTIDE',
    displayTerm: 'Nucleotide',
    keyColumnIndex: 2, // 'C'
    clue: 'Đơn phân cấu tạo nên đại phân tử DNA và RNA, gồm 4 loại trong DNA là A, T, G, C.',
    scientificHint: 'Thuật ngữ chuẩn quốc tế gồm 10 chữ cái (N U C L E O T I D E).',
    explanation: 'Mỗi Nucleotide gồm 3 thành phần: gốc phosphate, đường pentose và một nitrogenous base (A, T, G, C hoặc U).',
  },
  {
    id: 'cw-8',
    grade: 9,
    domain: 'vat-li',
    answer: 'THAUKINH',
    displayTerm: 'Thấu kính',
    keyColumnIndex: 4, // 'K'
    clue: 'Khối chất trong suốt giới hạn bởi hai mặt cong (hoặc một mặt cong, một mặt phẳng) làm khúc xạ các tia sáng.',
    scientificHint: 'Gồm 8 chữ cái không dấu (T H A U K I N H).',
    explanation: 'Thấu kính gồm hai loại chính là thấu kính hội tụ (rìa mỏng) và thấu kính phân kì (rìa dày).',
  },
];

/**
 * MODE 3 BANK: Formula Detective Puzzles (Strictly 3 Domains & IUPAC Names)
 */
export const DETECTIVE_PUZZLE_BANK: DetectivePuzzleItem[] = [
  {
    id: 'det-h2so4',
    grade: 8,
    domain: 'hoa-hoc',
    clue: 'Công thức hóa học của Sulfuric acid — một acid mạnh dùng phổ biến trong công nghiệp và phòng thí nghiệm.',
    answer: 'H2SO4',
    displayFormula: 'H₂SO₄ (Sulfuric acid)',
    displayAnswer: 'H₂SO₄ (Sulfuric acid)',
    lettersPool: ['H', '2', 'S', 'O', '4', 'C', 'L', '3', 'N', 'A'],
    scientificHint: 'Gồm 2 nguyên tử Hydrogen, 1 nguyên tử Sulfur và 4 nguyên tử Oxygen.',
    explanation: 'Sulfuric acid (H₂SO₄) là hóa chất quan trọng hàng đầu, khi pha loãng phải rót từ từ acid vào nước.',
  },
  {
    id: 'det-naoh',
    grade: 8,
    domain: 'hoa-hoc',
    clue: 'Công thức hóa học của Sodium hydroxide — một base kiềm mạnh làm dung dịch Phenolphthalein chuyển màu hồng.',
    answer: 'NAOH',
    displayFormula: 'NaOH (Sodium hydroxide)',
    displayAnswer: 'NaOH (Sodium hydroxide)',
    lettersPool: ['N', 'A', 'O', 'H', 'C', 'L', 'K', '2', 'S', 'I'],
    scientificHint: 'Gồm nguyên tử kim loại Sodium (Na) liên kết với 1 nhóm hydroxide (OH).',
    explanation: 'Sodium hydroxide (NaOH) tan tốt trong nước tạo dung dịch kiềm có pH > 7.',
  },
  {
    id: 'det-nacl',
    grade: 7,
    domain: 'hoa-hoc',
    clue: 'Công thức hóa học của hợp chất ion Sodium chloride (thành phần chính của muối ăn tinh khiết).',
    answer: 'NACL',
    displayFormula: 'NaCl (Sodium chloride)',
    displayAnswer: 'NaCl (Sodium chloride)',
    lettersPool: ['N', 'A', 'C', 'L', 'O', 'H', '2', 'K', 'M', 'G'],
    scientificHint: 'Tạo bởi cation Sodium (Na⁺) và anion Chlorine (Cl⁻).',
    explanation: 'Liên kết trong phân tử Sodium chloride (NaCl) là liên kết ion điển hình.',
  },
  {
    id: 'det-ohm',
    grade: 8,
    domain: 'vat-li',
    clue: 'Tên nhà bác học tìm ra định luật I = U / R và cũng là tên đơn vị đo điện trở R (kí hiệu Ω).',
    answer: 'OHM',
    displayFormula: 'Ohm (Ω) — Định luật I = U / R',
    displayAnswer: 'Ohm (Ω) — Định luật I = U / R',
    lettersPool: ['O', 'H', 'M', 'V', 'A', 'W', 'T', 'J', 'N', 'C'],
    scientificHint: 'Tên chuẩn quốc tế gồm 3 chữ cái (O - H - M).',
    explanation: 'Georg Simon Ohm là nhà vật lí học người Đức đã thiết lập hệ thức liên hệ giữa I, U và R.',
  },
  {
    id: 'det-dna',
    grade: 9,
    domain: 'sinh-hoc',
    clue: 'Kí hiệu quốc tế của đại phân tử Deoxyribonucleic acid có cấu trúc xoắn kép lưu giữ thông tin di truyền.',
    answer: 'DNA',
    displayFormula: 'DNA (Deoxyribonucleic acid)',
    displayAnswer: 'DNA (Deoxyribonucleic acid)',
    lettersPool: ['D', 'N', 'A', 'R', 'T', 'G', 'C', 'U', 'P', 'O'],
    scientificHint: 'Gồm 3 chữ cái viết tắt quốc tế của Deoxyribonucleic acid.',
    explanation: 'Theo danh pháp quốc tế trong sách Kết nối tri thức với cuộc sống, phân tử này được kí hiệu là DNA.',
  },
  {
    id: 'det-caco3',
    grade: 8,
    domain: 'hoa-hoc',
    clue: 'Công thức hóa học của muối Calcium carbonate — thành phần chính của đá vôi và vỏ sò.',
    answer: 'CACO3',
    displayFormula: 'CaCO₃ (Calcium carbonate)',
    displayAnswer: 'CaCO₃ (Calcium carbonate)',
    lettersPool: ['C', 'A', 'C', 'O', '3', 'H', '2', 'N', 'S', '4'],
    scientificHint: 'Gồm nguyên tử Calcium (Ca) liên kết với gốc carbonate (CO₃).',
    explanation: 'Calcium carbonate (CaCO₃) không tan trong nước nhưng tác dụng với Hydrochloric acid giải phóng khí Carbon dioxide (CO₂).',
  },
];

/**
 * Build a Memory Match deck of 2 * pairCount cards with deterministic order when seed is given
 */
export function buildMemoryDeck(
  grade: GameGradeFilter,
  pairCount = 6,
  seed = 101,
  customBank: readonly SciencePairItem[] = SCIENCE_PAIR_BANK
): MemoryCard[] {
  const pool = filterByGradeWithFallback(customBank, grade, pairCount);
  const selectedPairs = seededShuffle(pool, seed).slice(0, pairCount);

  const rawDeck: MemoryCard[] = [];
  selectedPairs.forEach((pair) => {
    rawDeck.push({
      uid: `${pair.id}-term`,
      pairId: pair.id,
      grade: pair.grade,
      domain: pair.domain,
      cardType: 'term',
      content: pair.term,
      explanation: pair.explanation,
      isFlipped: false,
      isMatched: false,
    });
    rawDeck.push({
      uid: `${pair.id}-def`,
      pairId: pair.id,
      grade: pair.grade,
      domain: pair.domain,
      cardType: 'definition',
      content: pair.definition,
      explanation: pair.explanation,
      isFlipped: false,
      isMatched: false,
    });
  });

  return seededShuffle(rawDeck, seed + 17);
}

/**
 * Evaluate a Memory Match turn when two cards are flipped
 */
export function evaluateMemoryTurn(
  cardA: MemoryCard,
  cardB: MemoryCard,
  currentStreak: number
): {
  isMatch: boolean;
  nextStreak: number;
  pointsDelta: number;
} {
  if (cardA.uid === cardB.uid) {
    return { isMatch: false, nextStreak: currentStreak, pointsDelta: 0 };
  }

  const isMatch = cardA.pairId === cardB.pairId && cardA.cardType !== cardB.cardType;
  if (isMatch) {
    const nextStreak = currentStreak + 1;
    const pointsDelta = 120 + (nextStreak - 1) * 30;
    return { isMatch: true, nextStreak, pointsDelta };
  }

  return { isMatch: false, nextStreak: 0, pointsDelta: -15 };
}

/**
 * Evaluate a Crossword horizontal row submission
 */
export function evaluateCrosswordRow(
  row: CrosswordRowItem,
  rawUserInput: string,
  currentStreak: number,
  usedHint: boolean
): {
  isCorrect: boolean;
  normalizedGuess: string;
  nextStreak: number;
  pointsDelta: number;
  keyLetter: string;
} {
  const normalizedGuess = normalizeCrosswordInput(rawUserInput);
  const expected = normalizeCrosswordInput(row.answer);
  const isCorrect = normalizedGuess === expected && expected.length > 0;
  const keyLetter = row.answer[row.keyColumnIndex] || row.answer[0] || '';

  if (isCorrect) {
    const nextStreak = currentStreak + 1;
    const basePoints = usedHint ? 110 : 150;
    const comboBonus = nextStreak * 20;
    return {
      isCorrect: true,
      normalizedGuess,
      nextStreak,
      pointsDelta: basePoints + comboBonus,
      keyLetter,
    };
  }

  return {
    isCorrect: false,
    normalizedGuess,
    nextStreak: 0,
    pointsDelta: -20,
    keyLetter,
  };
}

/**
 * Calculate points & streak reward for Formula Detective & general puzzle answers
 */
export function calculateAnswerReward(params: {
  isCorrect: boolean;
  currentStreak: number;
  remainingSeconds: number;
  usedHint: boolean;
}): {
  nextStreak: number;
  pointsDelta: number;
} {
  if (!params.isCorrect) {
    return {
      nextStreak: 0,
      pointsDelta: -25,
    };
  }

  const nextStreak = params.currentStreak + 1;
  const base = params.usedHint ? 110 : 150;
  const streakBonus = nextStreak * 25;
  const speedBonus = Math.min(60, Math.max(0, Math.floor(params.remainingSeconds * 1.5)));
  return {
    nextStreak,
    pointsDelta: base + streakBonus + speedBonus,
  };
}

/**
 * Build final GameRunSummary at victory or game over
 */
export function buildGameRunSummary(params: {
  mode: GameModeId;
  victory: boolean;
  score: number;
  previousBest: number;
  correctAttempts: number;
  totalAttempts: number;
  timeSpentSeconds: number;
  maxStreak: number;
  completedCount: number;
  totalCount: number;
}): GameRunSummary {
  const cleanScore = Math.max(0, Math.round(params.score));
  const bestScore = Math.max(cleanScore, Math.round(params.previousBest || 0));
  const accuracyPercent =
    params.totalAttempts > 0
      ? Math.min(100, Math.round((params.correctAttempts / params.totalAttempts) * 100))
      : 0;
  const xpEarned = Math.max(
    20,
    Math.round(cleanScore / 8) + (params.victory ? 50 : 15) + params.maxStreak * 10
  );

  return {
    mode: params.mode,
    victory: params.victory,
    score: cleanScore,
    bestScore,
    accuracyPercent,
    timeSpentSeconds: Math.max(1, Math.round(params.timeSpentSeconds)),
    maxStreak: params.maxStreak,
    xpEarned,
    completedCount: params.completedCount,
    totalCount: params.totalCount,
  };
}
