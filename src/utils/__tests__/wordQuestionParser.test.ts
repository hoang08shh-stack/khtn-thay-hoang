import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeChemicalNomenclature,
  detectDomainAndGrade,
  generateDetailedExplanation,
  parseWordContentToQuestions,
  SAMPLE_WORD_QUIZ_TEXT,
} from '../wordQuestionParser.ts';

describe('wordQuestionParser', () => {
  it('normalizes legacy Vietnamese chemical terms to IUPAC standard', () => {
    const res = normalizeChemicalNomenclature(
      'Cho kim loại natri tác dụng với axit clohidric và khí oxi.'
    );
    assert.equal(res.changed, true);
    assert.match(res.text, /Sodium \(Na\)/);
    assert.match(res.text, /Hydrochloric acid \(HCl\)/);
    assert.match(res.text, /Oxygen/);
  });

  it('detects domain, grade, and difficulty accurately from question text', () => {
    const phys = detectDomainAndGrade(
      'Tính cường độ dòng điện chạy qua điện trở R = 10 Ω theo định luật Ohm lớp 9.'
    );
    assert.equal(phys.domain, 'vat-li');
    assert.equal(phys.grade, 9);
    assert.equal(phys.difficulty, 'Vận dụng');

    const bio = detectDomainAndGrade(
      'Bào quan nào thực hiện chức năng quang hợp trong tế bào thực vật lớp 6?'
    );
    assert.equal(bio.domain, 'sinh-hoc');
    assert.equal(bio.grade, 6);
  });

  it('generates detailed scientific explanations when explanation is missing', () => {
    const exp = generateDetailedExplanation({
      question: 'Trong mô hình nguyên tử Rutherford - Bohr, hạt mang điện tích âm là hạt nào?',
      options: ['Proton', 'Neutron', 'Electron', 'Hạt nhân'],
      correctAnswer: 2,
      domain: 'hoa-hoc',
      grade: 7,
    });
    assert.match(exp, /Đáp án đúng là C \(Electron\)/);
    assert.match(exp, /Rutherford – Bohr/);
  });

  it('parses SAMPLE_WORD_QUIZ_TEXT with multiple-choice, essay questions, and step-by-step explanations', () => {
    const result = parseWordContentToQuestions(SAMPLE_WORD_QUIZ_TEXT, {
      defaultGrade: 8,
      defaultDomain: 'hoa-hoc',
      autoStandardizeIupac: true,
    });

    assert.equal(result.questions.length, 6);
    assert.equal(result.questions[0].correctAnswer, 0); // *A
    assert.equal(result.questions[1].correctAnswer, 1); // Đáp án: B
    assert.equal(result.questions[2].correctAnswer, 1); // Đáp án: B
    assert.equal(result.questions[3].correctAnswer, 1); // *B

    // Questions 5 and 6 are Essay questions (Tự luận) with image upload enabled
    assert.equal(result.questions[4].questionType, 'essay');
    assert.equal(result.questions[4].allowImageUpload, true);
    assert.equal(result.questions[5].questionType, 'essay');
    assert.equal(result.questions[5].allowImageUpload, true);

    // Every parsed question has a detailed explanation and multi-step solutionSteps
    for (const q of result.questions) {
      assert.ok(q.explanation.length > 40, `Expected detailed explanation for: ${q.question}`);
      assert.ok(
        Array.isArray(q.solutionSteps) && q.solutionSteps.length >= 2,
        `Expected step-by-step solutionSteps for: ${q.question}`
      );
    }

    // Legacy chemical names in Q2 were standardized to IUPAC and Q5 has Zn + 2HCl
    assert.match(result.questions[1].question, /Sodium hydroxide \(NaOH\)/);
    assert.match(result.questions[4].question, /ZnCl₂/);
    assert.match(result.questions[4].explanation, /\\frac\{6,5\}\{65\} = 0,1 mol/);
  });

  it('parses global BẢNG ĐÁP ÁN at the bottom of a Word document', () => {
    const docText = `
Câu 1: Công thức định luật Ohm là gì?
A. I = U . R
B. I = U / R
C. I = R / U
D. U = I / R

Câu 2: Môi trường Acid có giá trị pH như thế nào?
A. pH = 7
B. pH > 7
C. pH < 7
D. pH = 14

BẢNG ĐÁP ÁN
1.B   2-C
`;
    const result = parseWordContentToQuestions(docText);
    assert.equal(result.questions.length, 2);
    assert.equal(result.questions[0].correctAnswer, 1); // B
    assert.equal(result.questions[1].correctAnswer, 2); // C
    assert.equal(result.questions[0].detectedAnswerSource, 'answer_table');
    assert.equal(result.questions[1].detectedAnswerSource, 'answer_table');
  });

  it('concretely solves specific physics, chemistry, and biology exercises with actual numbers and stacked fractions', () => {
    const ohmExp = generateDetailedExplanation({
      question:
        'Đặt hiệu điện thế U = 24 V vào hai đầu đoạn mạch gồm R₁ = 4 Ω và R₂ = 8 Ω mắc nối tiếp. Tính cường độ dòng điện và công suất.',
      options: ['I = 2 A và P = 48 W', 'I = 3 A và P = 72 W'],
      correctAnswer: 0,
      domain: 'vat-li',
      grade: 9,
    });
    assert.match(ohmExp, /Dữ kiện:/);
    assert.match(ohmExp, /R_\{tđ\} = R₁ \+ R₂ = 4 \+ 8 = 12 Ω/);
    assert.match(ohmExp, /I = \\frac\{U\}\{R_\{tđ\}\} = \\frac\{24\}\{12\} = 2 A/);
    assert.match(ohmExp, /P = U × I = 24 × 2 = 48 W/);

    const chemExp = generateDetailedExplanation({
      question:
        'Cho 13 gam Zinc (Zn = 65) tác dụng với dung dịch Hydrochloric acid (HCl) dư. Tính thể tích khí Hydrogen ở đkc.',
      options: ['4,958 lít', '2,479 lít'],
      correctAnswer: 0,
      domain: 'hoa-hoc',
      grade: 8,
    });
    assert.match(chemExp, /Dữ kiện: m\(Zn\) = 13 g/);
    assert.match(chemExp, /\\frac\{13\}\{65\} = 0,2 mol/);
    assert.match(chemExp, /0,2 × 24,79 = 4,958 L/);
  });

  it('verifies all 6 acceptance criteria: Ohm inference, edit & regenerate, conflict detection, preserve provided vs single regenerate, and missing data', async () => {
    const { regenerateImportedQuestion, generateScientificSolution } = await import('../wordQuestionParser.ts');

    // 1. U = 12 V, R = 6 Ω -> options 1 A, 2 A, 3 A, 4 A -> inferred B (index 1), I = U/R = 12/6 = 2 A
    const raw1 = `Câu 1: Đặt hiệu điện thế U = 12 V vào hai đầu dây dẫn có điện trở R = 6 Ω. Hỏi cường độ dòng điện là bao nhiêu?
A. 1 A
B. 2 A
C. 3 A
D. 4 A`;
    const parsed1 = parseWordContentToQuestions(raw1).questions[0];
    assert.equal(parsed1.correctAnswer, 1); // B
    assert.equal(parsed1.solutionStatus, 'solved');
    assert.match(parsed1.explanation, /I = \\frac\{U\}\{R\} = \\frac\{12\}\{6\} = 2 A/);
    assert.match(parsed1.explanation, /Đối chiếu từng phương án:/);
    assert.match(parsed1.explanation, /Kết luận: Chọn B\./);

    // 2. Edit U from 12 V to 6 V -> regenerate -> inferred A (index 0, 1 A)
    const editedQ = {
      ...parsed1,
      question: parsed1.question.replace('U = 12 V', 'U = 6 V'),
    };
    const regenQ = regenerateImportedQuestion(editedQ, false);
    assert.equal(regenQ.correctAnswer, 0); // A (1 A)
    assert.equal(regenQ.solutionStatus, 'solved');
    assert.match(regenQ.explanation, /\\frac\{6\}\{6\} = 1 A/);

    // 3. Teacher selects conflicting answer (e.g., C = 3 A when calculation is 2 A)
    const conflictSol = generateScientificSolution({
      question: parsed1.question,
      options: parsed1.options,
      correctAnswer: 2, // C
      domain: 'vat-li',
      grade: 9,
    });
    assert.equal(conflictSol.status, 'needs_review');
    assert.ok(conflictSol.warnings.some((w) => w.includes('mâu thuẫn')));

    // 4. Bulk regenerate preserves Word/teacher explanation, while single regenerate replaces it
    const withTeacherExp = parseWordContentToQuestions(`${raw1}\nĐáp án: B\nLời giải: Ta có I = U/R = 12/6 = 2 A. Chọn B.`).questions[0];
    assert.equal(withTeacherExp.autoGeneratedExplanation, false);
    const bulkKept = regenerateImportedQuestion(withTeacherExp, true);
    assert.equal(bulkKept.autoGeneratedExplanation, false);
    assert.match(bulkKept.explanation, /Lời giải từ tài liệu\/giáo viên:/);
    const singleReplaced = regenerateImportedQuestion(withTeacherExp, false);
    assert.equal(singleReplaced.autoGeneratedExplanation, true);
    assert.match(singleReplaced.explanation, /Đáp án đúng là B \(2 A\)\./);

    // 5. Missing data or unsupported question -> needs_review, correctAnswer = -1 (not defaulting to A)
    const unsupportedRaw = `Câu 2: Một mạch điện có hiệu điện thế U = 12 V nhưng chưa biết điện trở. Cường độ dòng điện là bao nhiêu?
A. 1 A
B. 2 A
C. 3 A
D. 4 A`;
    const unsupportedQ = parseWordContentToQuestions(unsupportedRaw).questions[0];
    assert.equal(unsupportedQ.correctAnswer, -1);
    assert.equal(unsupportedQ.solutionStatus, 'needs_review');
    assert.ok(unsupportedQ.solutionWarnings && unsupportedQ.solutionWarnings.length > 0);
  });

  it('normalizes subscripts, superscripts, complex chemical formulas, ions, physical units, and reaction equations from Word', async () => {
    const {
      formatChemicalAndScientificText,
      extractFormattedTextFromMammothHtml,
    } = await import('../wordQuestionParser.ts');

    // 1. Plain-text chemical formulas & reaction equations
    const eqRes = formatChemicalAndScientificText(
      'Phương trình: 2Al + 3H2SO4 -> Al2(SO4)3 + 3H2^ và CH3COOH + C2H5OH <=> CH3COOC2H5 + H2O'
    );
    assert.equal(eqRes.changed, true);
    assert.match(eqRes.text, /2Al \+ 3H₂SO₄ → Al₂\(SO₄\)₃ \+ 3H₂↑/);
    assert.match(eqRes.text, /CH₃COOH \+ C₂H₅OH ⇄ CH₃COOC₂H₅ \+ H₂O/);

    // 2. Parenthetical bases/salts, ions, and physical units
    const ionRes = formatChemicalAndScientificText(
      'Dung dịch Ca(OH)2 và (NH4)2SO4 chứa các ion Ca2+, OH-, NH4+, SO42-, Fe3+, PO43- trên diện tích S = 25 cm2 với R1 = 6 Ω.'
    );
    assert.match(ionRes.text, /Ca\(OH\)₂/);
    assert.match(ionRes.text, /\(NH₄\)₂SO₄/);
    assert.match(ionRes.text, /Ca²⁺/);
    assert.match(ionRes.text, /OH⁻/);
    assert.match(ionRes.text, /NH₄⁺/);
    assert.match(ionRes.text, /SO₄²⁻/);
    assert.match(ionRes.text, /Fe³⁺/);
    assert.match(ionRes.text, /PO₄³⁻/);
    assert.match(ionRes.text, /25 cm²/);
    assert.match(ionRes.text, /R₁ = 6 Ω/);

    // 3. Mammoth HTML <sub> and <sup> extraction from .docx
    const mammothHtml =
      '<p>Câu 1: Cho 5,4 gam Al tác dụng vừa đủ với dung dịch H<sub>2</sub>SO<sub>4</sub> loãng tạo thành muối Al<sub>2</sub>(SO<sub>4</sub>)<sub>3</sub> và ion Al<sup>3+</sup>, SO<sub>4</sub><sup>2-</sup> ở 25<sup>o</sup>C.</p>' +
      '<p>*A. 2Al + 3H<sub>2</sub>SO<sub>4</sub> &rarr; Al<sub>2</sub>(SO<sub>4</sub>)<sub>3</sub> + 3H<sub>2</sub></p>' +
      '<p>B. Al + H<sub>2</sub>SO<sub>4</sub> &rarr; AlSO<sub>4</sub> + H<sub>2</sub></p>';
    const extracted = extractFormattedTextFromMammothHtml(mammothHtml);
    assert.match(extracted, /H₂SO₄/);
    assert.match(extracted, /Al₂\(SO₄\)₃/);
    assert.match(extracted, /Al³⁺/);
    assert.match(extracted, /SO₄²⁻/);
    assert.match(extracted, /25°C/);

    const parsedDocx = parseWordContentToQuestions(extracted, { htmlContent: mammothHtml });
    assert.equal(parsedDocx.questions.length, 1);
    assert.match(parsedDocx.questions[0].question, /H₂SO₄/);
    assert.match(parsedDocx.questions[0].options[0], /2Al \+ 3H₂SO₄ → Al₂\(SO₄\)₃ \+ 3H₂/);
  });

  // =========================================================================
  // 15 BÀI KIỂM THỬ BẮT BUỘC THEO PROMPT MASTER (TEST 01 -> TEST 15)
  // =========================================================================

  it('Test 01: File Word chỉ có 20 câu trắc nghiệm A, B, C, D', () => {
    const lines: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ansChar = ['A', 'B', 'C', 'D'][(i - 1) % 4];
      lines.push(
        `Câu ${i}. Kim loại số ${i} nào sau đây phản ứng với dung dịch HCl loãng giải phóng H2?\n` +
          `A. Cu\nB. Ag\nC. Zn\nD. Au\nĐáp án: ${ansChar}`
      );
    }
    const res = parseWordContentToQuestions(lines.join('\n\n'));
    assert.equal(res.questions.length, 20);
    res.questions.forEach((q, idx) => {
      assert.equal(q.questionType, 'single_choice');
      assert.equal(q.options.length, 4);
      assert.equal(q.correctAnswer, idx % 4);
      assert.match(q.question, /H₂/);
    });
  });

  it('Test 02: File Word có 10 câu đúng/sai với 4 ý a, b, c, d', () => {
    const blocks: string[] = ['PHẦN II. TRẮC NGHIỆM ĐÚNG SAI'];
    for (let i = 1; i <= 10; i++) {
      blocks.push(
        `Câu ${i}. Cho các phát biểu về kim loại (nhóm ${i}):\n` +
          `a) Kim loại có khả năng dẫn điện.\n` +
          `b) Tất cả kim loại đều phản ứng với nước ở nhiệt độ thường.\n` +
          `c) Kim loại có xu hướng nhường electron (e-) khi phản ứng.\n` +
          `d) Đồng (Cu) phản ứng với dung dịch HCl loãng giải phóng khí H2.\n` +
          `Đáp án: a-Đ, b-S, c-Đ, d-S`
      );
    }
    const res = parseWordContentToQuestions(blocks.join('\n\n'));
    assert.equal(res.questions.length, 10);
    for (const q of res.questions) {
      assert.equal(q.questionType, 'true_false');
      assert.ok(Array.isArray(q.trueFalseStatements));
      assert.equal(q.trueFalseStatements!.length, 4);
      assert.deepEqual(
        q.trueFalseStatements!.map((s) => s.isTrue),
        [true, false, true, false]
      );
      assert.match(q.trueFalseStatements![2].text, /e⁻/);
      assert.match(q.trueFalseStatements![3].text, /H₂/);
    }
  });

  it('Test 03: File Word có 10 câu trả lời ngắn', () => {
    const blocks: string[] = ['PHẦN III. TRẮC NGHIỆM TRẢ LỜI NGẮN'];
    for (let i = 1; i <= 10; i++) {
      const val = (i * 1.25).toFixed(2).replace('.', ',');
      blocks.push(
        `Câu ${i} (Trả lời ngắn): Cho phản ứng hóa học tạo ra thể tích khí ở thí nghiệm ${i}. Kết quả thu được là bao nhiêu lít?\n` +
          `Đáp án: ${val} lít`
      );
    }
    const res = parseWordContentToQuestions(blocks.join('\n\n'));
    assert.equal(res.questions.length, 10);
    res.questions.forEach((q, idx) => {
      assert.equal(q.questionType, 'short_answer');
      const expected = ((idx + 1) * 1.25).toFixed(2).replace('.', ',');
      assert.equal(q.shortAnswer, expected);
      assert.equal(q.shortAnswerUnit, 'lít');
    });
  });

  it('Test 04: File Word có 5 câu tự luận', () => {
    const blocks: string[] = ['PHẦN IV. TỰ LUẬN'];
    for (let i = 1; i <= 5; i++) {
      blocks.push(
        `Câu ${i} (Tự luận): Viết các phương trình hóa học thực hiện chuỗi biến hóa số ${i}: Fe -> FeCl2 -> Fe(OH)2.\n` +
          `Lời giải: 1) Fe + 2HCl -> FeCl2 + H2^ ; 2) FeCl2 + 2NaOH -> Fe(OH)2v + 2NaCl.`
      );
    }
    const res = parseWordContentToQuestions(blocks.join('\n\n'));
    assert.equal(res.questions.length, 5);
    for (const q of res.questions) {
      assert.equal(q.questionType, 'essay');
      assert.equal(q.allowImageUpload, true);
      assert.match(q.question, /Fe → FeCl₂ → Fe\(OH\)₂/);
      assert.match(q.explanation, /FeCl₂/);
    }
  });

  it('Test 05: File Word trộn cả 4 dạng câu hỏi (SAMPLE_WORD_4_TYPES_TEXT)', async () => {
    const { SAMPLE_WORD_4_TYPES_TEXT } = await import('../wordQuestionParser.ts');
    const res = parseWordContentToQuestions(SAMPLE_WORD_4_TYPES_TEXT);
    assert.equal(res.questions.length, 5);
    assert.equal(res.questions[0].questionType, 'single_choice');
    assert.equal(res.questions[1].questionType, 'single_choice');
    assert.equal(res.questions[2].questionType, 'true_false');
    assert.equal(res.questions[2].trueFalseStatements?.length, 4);
    assert.equal(res.questions[3].questionType, 'short_answer');
    assert.equal(res.questions[3].shortAnswer, '2,48');
    assert.equal(res.questions[4].questionType, 'essay');
  });

  it('Test 06: File Hóa học có H₂SO₄, Ca(OH)₂, Fe³⁺, SO₄²⁻, H⁺, e⁻, phương trình phản ứng', () => {
    const rawChem = `Câu 1: Cho dung dịch H2SO4 tác dụng với Ca(OH)2, trong dung dịch có các ion Fe3+, SO42-, H+ và quá trình nhường nhận e-: Fe2+ -> Fe3+ + e-. Phương trình nào đúng?
A. H2SO4 + Ca(OH)2 -> CaSO4 + 2H2O
B. H2SO4 + Ca(OH)2 -> CaSO3 + H2O
C. Fe + H2SO4 -> Fe2(SO4)3 + H2^
D. N2 + 3H2 <=> 2NH3
Đáp án: A`;
    const res = parseWordContentToQuestions(rawChem);
    assert.equal(res.questions.length, 1);
    const q = res.questions[0];
    assert.match(q.question, /H₂SO₄/);
    assert.match(q.question, /Ca\(OH\)₂/);
    assert.match(q.question, /Fe³⁺/);
    assert.match(q.question, /SO₄²⁻/);
    assert.match(q.question, /H⁺/);
    assert.match(q.question, /e⁻/);
    assert.match(q.options[0], /H₂SO₄ \+ Ca\(OH\)₂ → CaSO₄ \+ 2H₂O/);
    assert.match(q.options[3], /N₂ \+ 3H₂ ⇄ 2NH₃/);
  });

  it('Test 07: File Word có hình ảnh minh họa (nhúng base64 <img>)', async () => {
    const { extractFormattedTextFromMammothHtml } = await import('../wordQuestionParser.ts');
    const htmlWithImg = `
      <p>Câu 1. Quan sát sơ đồ thí nghiệm điều chế khí H<sub>2</sub> dưới đây:</p>
      <p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" /></p>
      <p>A. Thu khí bằng phương pháp đẩy nước</p>
      <p>B. Thu khí bằng phương pháp đặt ngửa bình</p>
      <p>C. Không thu được khí</p>
      <p>D. Khí H<sub>2</sub> nặng hơn không khí</p>
      <p>Đáp án: A</p>
    `;
    const extracted = extractFormattedTextFromMammothHtml(htmlWithImg);
    const res = parseWordContentToQuestions(extracted, { htmlContent: htmlWithImg });
    assert.equal(res.questions.length, 1);
    assert.ok(res.questions[0].questionImages && res.questions[0].questionImages.length === 1);
    assert.match(res.questions[0].questionImages![0], /^data:image\/png;base64,/);
    assert.equal(res.questions[0].correctAnswer, 0);
  });

  it('Test 08: File Word có bảng số liệu (<table>) và phương án trình bày trong bảng', async () => {
    const { extractFormattedTextFromMammothHtml } = await import('../wordQuestionParser.ts');
    const htmlWithTable = `
      <p>Câu 1. Cho bảng số liệu kết quả đo hiệu điện thế và cường độ dòng điện:</p>
      <table>
        <tr><th>Lần đo</th><th>U (V)</th><th>I (A)</th></tr>
        <tr><td>1</td><td>6</td><td>0,5</td></tr>
        <tr><td>2</td><td>12</td><td>1,0</td></tr>
      </table>
      <table>
        <tr><td>A. R = 12 &Omega;</td><td>B. R = 6 &Omega;</td></tr>
        <tr><td>C. R = 24 &Omega;</td><td>D. R = 3 &Omega;</td></tr>
      </table>
      <p>Đáp án: A</p>
    `;
    const extracted = extractFormattedTextFromMammothHtml(htmlWithTable);
    const res = parseWordContentToQuestions(extracted, { htmlContent: htmlWithTable });
    assert.equal(res.questions.length, 1);
    assert.ok(res.questions[0].questionTables && res.questions[0].questionTables.length >= 1);
    assert.equal(res.questions[0].options.length, 4);
    assert.equal(res.questions[0].correctAnswer, 0);
  });

  it('Test 09: File có đáp án và lời giải ở cuối tài liệu cho cả Trắc nghiệm, Đúng/Sai và Trả lời ngắn', () => {
    const rawDoc = `
Câu 1. Kim loại nào dẫn điện tốt nhất?
A. Cu
B. Ag
C. Au
D. Al

Câu 2. Cho các phát biểu sau:
a) Khí H2 nhẹ hơn không khí.
b) Khí O2 duy trì sự cháy.
c) Dung dịch HCl làm quỳ tím hóa xanh.
d) Ca(OH)2 là một base.

Câu 3 (Trả lời ngắn): Tính số mol của 6,5 gam Zn (M = 65).

BẢNG ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI
1. B
Câu 2: a-Đ, b-Đ, c-S, d-Đ
Câu 3: 0,1
Lời giải Câu 1: Bạc (Ag) là kim loại dẫn điện tốt nhất tiếp theo là Cu, Au, Al.
Lời giải Câu 3: Áp dụng n = m / M = 6,5 / 65 = 0,1 mol.
`;
    const res = parseWordContentToQuestions(rawDoc);
    assert.equal(res.questions.length, 3);
    assert.equal(res.questions[0].correctAnswer, 1); // B
    assert.match(res.questions[0].explanation, /Bạc \(Ag\) là kim loại dẫn điện tốt nhất/);
    assert.deepEqual(
      res.questions[1].trueFalseStatements?.map((s) => s.isTrue),
      [true, true, false, true]
    );
    assert.equal(res.questions[2].questionType, 'short_answer');
    assert.equal(res.questions[2].shortAnswer, '0,1');
  });

  it('Test 10: File không có đáp án -> hệ thống đánh dấu Thiếu đáp án (missing_answer), tuyệt đối không tự gán A sai', () => {
    const rawNoAns = `
Câu 1. Chất nào sau đây là muối trung hòa?
A. NaHCO3
B. NaHSO4
C. Na2SO4
D. Ca(HCO3)2
`;
    const res = parseWordContentToQuestions(rawNoAns);
    assert.equal(res.questions.length, 1);
    assert.equal(res.questions[0].correctAnswer, -1);
    assert.equal(res.questions[0].validationStatus, 'missing_answer');
  });

  it('Test 11: File có định dạng không đồng nhất (Câu 1., Question 2:, 3), phương án cùng dòng & nhiều dòng)', () => {
    const mixedFormat = `
Câu 1. Phương án nằm trên cùng một dòng:
A. H2SO4 B. HCl C. HNO3 D. H3PO4
Đáp án: B

Question 2: Phương án dùng dấu ngoặc đơn:
A) Fe2+   B) Fe3+
C) Cu2+   D) Zn2+
Answer: B

3) Câu đánh số kiểu 3):
A. NaOH
B. KOH
C. Ca(OH)2
D. Ba(OH)2
Đáp án: C
`;
    const res = parseWordContentToQuestions(mixedFormat);
    assert.equal(res.questions.length, 3);
    assert.equal(res.questions[0].options.length, 4);
    assert.equal(res.questions[0].correctAnswer, 1);
    assert.equal(res.questions[1].options.length, 4);
    assert.equal(res.questions[1].correctAnswer, 1);
    assert.equal(res.questions[2].options.length, 4);
    assert.equal(res.questions[2].correctAnswer, 2);
  });

  it('Test 12: Giáo viên chỉnh sửa, lưu câu hỏi vào ngân hàng câu hỏi và tải lại', async () => {
    const { saveAdminQuestionsBulk, getAdminQuestionsSync } = await import('../../services/adminService.ts');
    const parsed = parseWordContentToQuestions(`
Câu 1 (Trả lời ngắn): Tính khối lượng muối thu được khi cô cạn dung dịch.
Đáp án: 15,8 gam
`).questions;
    assert.equal(parsed.length, 1);
    // Teacher edits the shortAnswer and approves solution
    parsed[0].shortAnswer = '16,5';
    parsed[0].approvalStatus = 'approved';

    const savedList = await saveAdminQuestionsBulk(parsed);
    const reloaded = getAdminQuestionsSync();
    const found = reloaded.find((q) => q.question.includes('Tính khối lượng muối thu được khi cô cạn'));
    assert.ok(found);
    assert.equal(found!.questionType, 'short_answer');
    assert.equal(found!.shortAnswer, '16,5');
    assert.equal(found!.approvalStatus, 'approved');
    assert.ok(savedList.length > 0);
  });

  it('Test 13: Học sinh làm bài kiểm tra gồm cả 4 dạng câu hỏi và nộp bài chấm điểm tự động', async () => {
    const { gradeQuizSubmission } = await import('../quizScoringEngine.ts');
    const quizConfig = {
      id: 'test-4-types-quiz',
      lessonId: 'khtn8-hoa-1',
      title: 'Đề kiểm tra 4 dạng câu hỏi GDPT 2018',
      grade: 8 as const,
      domain: 'hoa-hoc' as const,
      timeLimitMinutes: 45,
      passingScore: 5.0,
      questions: [
        {
          id: 'q1',
          type: 'single_choice' as const,
          question: 'Kim loại nào phản ứng với HCl?',
          options: [
            { id: 'q1_opt_0', content: 'Cu' },
            { id: 'q1_opt_1', content: 'Zn' },
          ],
          correctOptionIds: ['q1_opt_1'],
          points: 2.0,
          explanation: 'Zn đứng trước H.',
          difficulty: 'Nhận biết' as const,
        },
        {
          id: 'q2',
          type: 'true_false' as const,
          question: 'Xét các phát biểu sau:',
          options: [],
          correctOptionIds: [],
          trueFalseStatements: [
            { id: 's_a', label: 'a' as const, text: 'Ý a', isTrue: true },
            { id: 's_b', label: 'b' as const, text: 'Ý b', isTrue: false },
            { id: 's_c', label: 'c' as const, text: 'Ý c', isTrue: true },
            { id: 's_d', label: 'd' as const, text: 'Ý d', isTrue: false },
          ],
          points: 4.0,
          explanation: 'Đ-S-Đ-S',
          difficulty: 'Thông hiểu' as const,
        },
        {
          id: 'q3',
          type: 'short_answer' as const,
          question: 'Thể tích khí H2 (đkc) là bao nhiêu lít?',
          options: [],
          correctOptionIds: [],
          shortAnswer: '2,48',
          shortAnswerUnit: 'lít',
          points: 2.0,
          explanation: 'V = 0,1 * 24,79 = 2,48 L',
          difficulty: 'Vận dụng' as const,
        },
        {
          id: 'q4',
          type: 'essay' as const,
          question: 'Viết PTHH của Zn + HCl.',
          options: [],
          correctOptionIds: [],
          points: 2.0,
          explanation: 'Zn + 2HCl -> ZnCl2 + H2',
          difficulty: 'Vận dụng' as const,
        },
      ],
    };

    // Student gets Q1 right (2.0 pts), Q2 3/4 statements right (50% of 4.0 = 2.0 pts), Q3 right using dot "2.48" (2.0 pts), Q4 submitted (2.0 pts) => Total 8.0 / 10
    const result = gradeQuizSubmission(
      quizConfig,
      [
        { questionId: 'q1', selectedOptionId: 'q1_opt_1' },
        {
          questionId: 'q2',
          trueFalseAnswers: { s_a: true, s_b: false, s_c: true, s_d: true }, // 3/4 correct -> 50%
        },
        { questionId: 'q3', shortAnswerText: '2.48' }, // matches '2,48'
        { questionId: 'q4', essayText: 'Zn + 2HCl -> ZnCl2 + H2' },
      ],
      300
    );

    assert.equal(result.score, 8.0);
    assert.equal(result.passed, true);
    assert.equal(result.details[1].earned_points, 2.0); // 50% of 4.0
    assert.equal(result.details[2].is_correct, true);
  });

  it('Test 14: Trộn câu hỏi và trộn phương án không làm sai lệch đáp án đúng', async () => {
    const { shuffleQuestionOptions, gradeQuizSubmission } = await import('../quizScoringEngine.ts');
    const originalQuestion = {
      id: 'q_shuffle',
      type: 'single_choice' as const,
      question: 'Hạt mang điện tích âm trong nguyên tử là:',
      options: [
        { id: 'q_shuffle_opt_0', content: 'Proton' },
        { id: 'q_shuffle_opt_1', content: 'Neutron' },
        { id: 'q_shuffle_opt_2', content: 'Electron' },
        { id: 'q_shuffle_opt_3', content: 'Hạt nhân' },
      ],
      correctOptionIds: ['q_shuffle_opt_2'],
      points: 10,
      explanation: 'Electron mang điện tích âm.',
      difficulty: 'Nhận biết' as const,
    };

    const shuffled = shuffleQuestionOptions(originalQuestion, () => 0.1);
    const electronOpt = shuffled.options.find((o) => o.content === 'Electron');
    assert.ok(electronOpt);
    assert.equal(electronOpt!.id, 'q_shuffle_opt_2');

    const res = gradeQuizSubmission(
      {
        id: 'quiz_shuf',
        lessonId: 'l1',
        title: 'Test Shuffle',
        grade: 7,
        domain: 'hoa-hoc',
        timeLimitMinutes: 15,
        passingScore: 5,
        questions: [shuffled],
      },
      [{ questionId: 'q_shuffle', selectedOptionId: electronOpt!.id }],
      60
    );
    assert.equal(res.score, 10);
    assert.equal(res.details[0].is_correct, true);
  });

  it('Test 15: Tạo lời giải bằng nút AI TẠO LỜI GIẢI (4 bước chuẩn), phát hiện đáp án không khớp và duyệt lời giải', async () => {
    const { generateStructured4StepSolution, computeQuestionValidationStatus } = await import(
      '../wordQuestionParser.ts'
    );
    const rawConflict = `Câu 1: Đặt hiệu điện thế U = 12 V vào hai đầu điện trở R = 6 Ω. Cường độ dòng điện chạy qua điện trở là:
A. 1 A
B. 2 A
C. 3 A
D. 4 A
Đáp án: C`;
    const q = parseWordContentToQuestions(rawConflict).questions[0];
    // Original answer C (index 2) is preserved, NOT silently overwritten!
    assert.equal(q.correctAnswer, 2);

    const afterAiSolve = generateStructured4StepSolution(q);
    // Original answer C is still preserved
    assert.equal(afterAiSolve.correctAnswer, 2);
    // Warning explicitly alerts teacher of mismatch
    assert.ok(
      afterAiSolve.solutionWarnings?.some((w) =>
        w.includes('PHÁT HIỆN ĐÁP ÁN KHÔNG KHỚP – CẦN GIÁO VIÊN KIỂM TRA.')
      )
    );
    assert.equal(computeQuestionValidationStatus(afterAiSolve), 'needs_review');
    // Structured 4-step solution is generated
    assert.match(afterAiSolve.explanation, /Bước 1\. Phân tích đề bài/);
    assert.match(afterAiSolve.explanation, /Bước 2\. Phương pháp giải/);
    assert.match(afterAiSolve.explanation, /Bước 3\. Thực hiện/);
    assert.match(afterAiSolve.explanation, /Bước 4\. Kết luận/);

    // Teacher fixes answer to B (index 1) and approves solution
    const fixedByTeacher = generateStructured4StepSolution({
      ...afterAiSolve,
      correctAnswer: 1,
    });
    fixedByTeacher.approvalStatus = 'approved';
    assert.equal(computeQuestionValidationStatus(fixedByTeacher), 'has_explanation');
  });
});




