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
});

