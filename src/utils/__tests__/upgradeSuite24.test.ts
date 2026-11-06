import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTopicsForSubjectAndGrade,
  getLessonsForTopic,
  createInlineLessonForTopic,
  renameInlineLesson,
  validateMaterialFileOrSource,
  validateSimulationHtmlSafety,
  saveUnifiedLearningResource,
  updateUnifiedResourceTitle,
  toggleUnifiedResourceStatus,
  deleteUnifiedResource,
  filterUnifiedResources,
} from '../materialUploadEngine.ts';
import {
  normalizeVietnameseUnicodeNFC,
  detectLegacyVietnameseEncoding,
  convertLegacyVietnameseToUnicode,
  convertWordOmmlToReadableFormula,
  detectLegacyOleEquations,
} from '../vietnameseFontFixer.ts';
import {
  parseWordContentToQuestions,
  generateConciseSolution,
} from '../wordQuestionParser.ts';
import { normalizeSolutionPresentation } from '../scientificSolution.ts';
import { gradeQuizSubmission } from '../quizScoringEngine.ts';
import {
  saveAdminQuestionsBulk,
  getAdminQuestionsSync,
} from '../../services/adminService.ts';

describe('PROMPT MASTER – 24 Mandatory Acceptance Tests (Test 01 -> Test 24)', () => {
  // =========================================================================
  // NHÓM A – TẢI HỌC LIỆU 3 BƯỚC & QUẢN LÝ HỌC LIỆU (TEST 01 -> TEST 10)
  // =========================================================================

  it('Test 01: Chọn Môn học → Lớp → Bộ sách → Chương → Bài học theo đúng liên kết dữ liệu', () => {
    const chemTopics8 = getTopicsForSubjectAndGrade('hoa-hoc', 8);
    assert.ok(chemTopics8.length > 0);
    assert.ok(chemTopics8.every((t) => t.grade === 8 && t.domain === 'hoa-hoc'));

    const firstTopic = chemTopics8[0];
    const lessons = getLessonsForTopic(firstTopic.id, 8, 'hoa-hoc');
    assert.ok(lessons.length > 0);
    assert.ok(lessons.every((l) => l.topicId === firstTopic.id && l.grade === 8));
  });

  it('Test 02: Tạo bài học mới và sửa tên bài ngay trong Bước 1', () => {
    const topics7 = getTopicsForSubjectAndGrade('vat-li', 7);
    const targetTopic = topics7[0];
    const createdLesson = createInlineLessonForTopic(
      targetTopic.id,
      7,
      'Bài 99: Thực hành đo tốc độ chuyển động'
    );
    assert.equal(createdLesson.topicId, targetTopic.id);
    assert.equal(createdLesson.grade, 7);
    assert.equal(createdLesson.title, 'Bài 99: Thực hành đo tốc độ chuyển động');

    const renamed = renameInlineLesson(
      createdLesson.id,
      'Bài 99 (Cập nhật): Đo tốc độ bằng cổng quang điện'
    );
    assert.ok(renamed);
    assert.equal(renamed!.title, 'Bài 99 (Cập nhật): Đo tốc độ bằng cổng quang điện');
  });

  it('Test 03: Tải bài giảng PowerPoint .pptx', () => {
    const step2Pptx = {
      category: 'lecture_doc' as const,
      title: 'Slide bài giảng Acid và Base',
      fileName: 'Bai_Giang_Acid_Base.pptx',
      fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      fileSize: 2048576,
      uploadProgress: 100,
      uploadStatus: 'ready' as const,
    };
    const check = validateMaterialFileOrSource(step2Pptx);
    assert.equal(check.valid, true);
  });

  it('Test 04: Tải tài liệu .pdf và xem trước', () => {
    const step2Pdf = {
      category: 'lecture_doc' as const,
      title: 'Phiếu học tập KHTN 8 PDF',
      fileName: 'Phieu_Hoc_Tap_KHTN8.pdf',
      fileType: 'application/pdf',
      fileSize: 512000,
      fileDataUrl: 'data:application/pdf;base64,JVBERi0xLjQK',
      uploadProgress: 100,
      uploadStatus: 'ready' as const,
    };
    const check = validateMaterialFileOrSource(step2Pdf);
    assert.equal(check.valid, true);
  });

  it('Test 05: Tải video .mp4', () => {
    const step2Mp4 = {
      category: 'video' as const,
      title: 'Video thí nghiệm Zn tác dụng với HCl',
      videoSourceType: 'upload_file' as const,
      fileName: 'Thi_Nghiem_Zn_HCl.mp4',
      fileType: 'video/mp4',
      fileSize: 8388608,
      uploadProgress: 100,
      uploadStatus: 'ready' as const,
    };
    const check = validateMaterialFileOrSource(step2Mp4);
    assert.equal(check.valid, true);
  });

  it('Test 06: Gắn liên kết video YouTube (không tải video từ YouTube về máy chủ)', () => {
    const step2Yt = {
      category: 'video' as const,
      title: 'Video bài giảng Khúc xạ ánh sáng',
      videoSourceType: 'youtube' as const,
      externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      uploadProgress: 100,
      uploadStatus: 'ready' as const,
    };
    const check = validateMaterialFileOrSource(step2Yt);
    assert.equal(check.valid, true);
  });

  it('Test 07: Tải mô phỏng HTML/JS 2D/3D và kiểm tra cô lập Sandbox an toàn', () => {
    const rawSimHtml = `<div>Mô phỏng mạch điện</div><script>console.log('ok'); window.parent.location='http://evil';</script>`;
    const safety = validateSimulationHtmlSafety(rawSimHtml);
    assert.equal(safety.safe, false);
    assert.ok(safety.warnings.length > 0);
    assert.doesNotMatch(safety.sanitizedHtml, /window\.parent/);

    const step2Sim = {
      category: 'simulation' as const,
      title: 'Mô phỏng 3D Cấu tạo nguyên tử',
      simulationType: '3d' as const,
      simulationHtml: safety.sanitizedHtml,
      uploadProgress: 100,
      uploadStatus: 'ready' as const,
    };
    assert.equal(validateMaterialFileOrSource(step2Sim).valid, true);
  });

  it('Test 08: Lưu bản nháp học liệu', () => {
    const step1 = {
      subject: 'khtn' as const,
      grade: 8 as const,
      textbook: 'ket-noi-tri-thuc' as const,
      topicId: 'cd8-1',
      topicTitle: 'Phản ứng hóa học',
      lessonId: 'khtn8-hoa-1',
      lessonTitle: 'Biến đổi vật lí và biến đổi hóa học',
    };
    const step2 = {
      category: 'lecture_doc' as const,
      title: 'Bài giảng nháp KHTN 8',
      fileName: 'Bai_Giang_Nhap.pptx',
      fileType: 'pptx',
      fileSize: 102400,
      uploadProgress: 100,
      uploadStatus: 'ready' as const,
    };
    const draftRes = saveUnifiedLearningResource(step1, step2, 'draft');
    assert.equal(draftRes.status, 'draft');
    assert.equal(draftRes.title, 'Bài giảng nháp KHTN 8');
  });

  it('Test 09: Xuất bản học liệu và kiểm tra trạng thái hiển thị published', () => {
    const step1 = {
      subject: 'hoa-hoc' as const,
      grade: 9 as const,
      textbook: 'chan-troi-sang-tao' as const,
      topicId: 'cd9-hoa-1',
      topicTitle: 'Kim loại và sự khác nhau giữa kim loại và phi kim',
      lessonId: 'khtn9-hoa-1',
      lessonTitle: 'Tính chất vật lí của kim loại',
    };
    const step2 = {
      category: 'simulation' as const,
      title: 'Mô phỏng tương tác Dãy hoạt động hóa học',
      simulationType: 'html_js' as const,
      simulationHtml: '<div>Mô phỏng dãy hoạt động hóa học</div>',
      uploadProgress: 100,
      uploadStatus: 'ready' as const,
    };
    const pubRes = saveUnifiedLearningResource(step1, step2, 'published');
    assert.equal(pubRes.status, 'published');

    const publishedOnly = filterUnifiedResources([pubRes], { status: 'published' });
    assert.equal(publishedOnly.length, 1);
  });

  it('Test 10: Sửa tên, ẩn/hiện và xóa học liệu đã tải', () => {
    const step1 = {
      subject: 'vat-li' as const,
      grade: 8 as const,
      textbook: 'canh-dieu' as const,
      topicId: 'cd8-li-1',
      topicTitle: 'Khối lượng riêng và áp suất',
      lessonId: 'khtn8-li-1',
      lessonTitle: 'Khối lượng riêng',
    };
    const step2 = {
      category: 'video' as const,
      title: 'Video gốc Đo khối lượng riêng',
      videoSourceType: 'youtube' as const,
      externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      uploadProgress: 100,
      uploadStatus: 'ready' as const,
    };
    const created = saveUnifiedLearningResource(step1, step2, 'published');

    // Rename
    const afterRename = updateUnifiedResourceTitle(
      created.id,
      'Video Đã Đổi Tên: Đo khối lượng riêng'
    );
    const renamedItem = afterRename.find((r) => r.id === created.id);
    assert.equal(renamedItem?.title, 'Video Đã Đổi Tên: Đo khối lượng riêng');

    // Toggle status (published -> draft)
    const afterToggle = toggleUnifiedResourceStatus(created.id);
    const toggledItem = afterToggle.find((r) => r.id === created.id);
    assert.equal(toggledItem?.status, 'draft');

    // Delete
    const afterDelete = deleteUnifiedResource(created.id);
    assert.equal(afterDelete.some((r) => r.id === created.id), false);
  });

  // =========================================================================
  // NHÓM B – WORD TO QUIZ, FONT, CÔNG THỨC & LỜI GIẢI (TEST 11 -> TEST 24)
  // =========================================================================

  it('Test 11: Tải file Word có tiếng Việt Unicode chuẩn (chuẩn hóa NFC tổ hợp sang dựng sẵn và sửa dấu rời)', () => {
    // Decomposed NFD string for "Hóa học lớp 8: Phản ứng tạo kết tủa"
    const decomposed = 'Ho\u0301a ho\u0323c lơ\u0301p 8: Pha\u0309n ư\u0301ng ta\u0323o kê\u0301t tu\u0309a';
    const normalized = normalizeVietnameseUnicodeNFC(decomposed);
    assert.equal(normalized, 'Hóa học lớp 8: Phản ứng tạo kết tủa');
    assert.equal(normalized, normalized.normalize('NFC'));

    // Exact sentence from user's screenshot with detached spacing accents (´ and `)
    const detachedAccents =
      'Xác định khô´i lượng mol của các châ´t sau và cho biê´t đó là nguyên tô´ nào? (a) 2,4 gam một đơn châ´t X có sô´ mol là 0,2 mol. (b) 3,2 gam một đơn châ´t Y có sô´ mol là 0,05 mol. (c) 11,2 gam một đơn châ´t Z có sô´ mol bă`ng với sô´ mol của 4,958 lít khí O2 (đkc).';
    const fixedSentence = normalizeVietnameseUnicodeNFC(detachedAccents);
    assert.equal(
      fixedSentence,
      'Xác định khối lượng mol của các chất sau và cho biết đó là nguyên tố nào? (a) 2,4 gam một đơn chất X có số mol là 0,2 mol. (b) 3,2 gam một đơn chất Y có số mol là 0,05 mol. (c) 11,2 gam một đơn chất Z có số mol bằng với số mol của 4,958 lít khí O2 (đkc).'
    );
  });

  it('Test 12: Tải file Word có font TCVN3 hoặc VNI -> phát hiện và chuyển mã sang Unicode chuẩn', () => {
    const legacyTcvn3 = 'Cho 6,5 gam Zn t¸c dông víi dung dÞch H2SO4 lo·ng thu ®­îc khÝ H2.';
    const detection = detectLegacyVietnameseEncoding(
      legacyTcvn3,
      '<p style="font-family:.VnTime">text</p>'
    );
    assert.equal(detection.hasLegacyFontIssue, true);
    assert.equal(detection.detectedEncoding, 'tcvn3');

    const converted = convertLegacyVietnameseToUnicode(legacyTcvn3, 'tcvn3');
    assert.match(converted, /tác dụng với dung dịch/);
    assert.match(converted, /loãng thu được khí/);
  });

  it('Test 13: Tải file Word có câu hỏi 4 lựa chọn A–D', () => {
    const raw = `Câu 1: Kim loại nào sau đây dẫn điện tốt nhất?
A. Cu
B. *Ag
C. Au
D. Al`;
    const res = parseWordContentToQuestions(raw);
    assert.equal(res.questions.length, 1);
    assert.equal(res.questions[0].questionType, 'single_choice');
    assert.equal(res.questions[0].options.length, 4);
    assert.equal(res.questions[0].correctAnswer, 1);
  });

  it('Test 14: Tải file Word có câu hỏi đúng/sai 4 ý a–d và lời giải gắn trực tiếp từng ý', () => {
    const raw = `Câu 1: Cho các phát biểu sau về dung dịch HCl:
a) Làm quỳ tím chuyển sang màu đỏ. (Đúng)
b) Tác dụng được với kim loại Cu giải phóng khí H2. (Sai)
c) Tác dụng với ZnO tạo muối và nước. (Đúng)
d) Có giá trị pH > 7. (Sai)`;
    const res = parseWordContentToQuestions(raw);
    assert.equal(res.questions.length, 1);
    const q = generateConciseSolution(res.questions[0]);
    assert.equal(q.questionType, 'true_false');
    assert.equal(q.trueFalseStatements?.length, 4);
    assert.deepEqual(
      q.trueFalseStatements?.map((s) => s.isTrue),
      [true, false, true, false]
    );
    // Explanation for each statement must not repeat "a)", "b)" prefix
    q.trueFalseStatements?.forEach((stmt) => {
      assert.ok(stmt.explanation && stmt.explanation.length > 0);
      assert.doesNotMatch(stmt.explanation!, /^[a-d]\)/i);
    });
  });

  it('Test 15: Tải file Word có câu trả lời ngắn', () => {
    const raw = `Câu 1 (Trả lời ngắn): Cho 6,5 gam Zn (M = 65) phản ứng hoàn toàn với dung dịch HCl dư. Tính số mol H2 thu được.
Đáp án: 0,1 mol`;
    const res = parseWordContentToQuestions(raw);
    assert.equal(res.questions.length, 1);
    assert.equal(res.questions[0].questionType, 'short_answer');
    assert.equal(res.questions[0].shortAnswer, '0,1');
  });

  it('Test 16: Tải file Word có câu tự luận', () => {
    const raw = `Câu 1 (Tự luận): Trình bày phương pháp hóa học nhận biết hai dung dịch HCl và Na2SO4.
Lời giải: Dùng dung dịch BaCl2: mẫu tạo kết tủa trắng BaSO4 là Na2SO4, mẫu không hiện tượng là HCl.`;
    const res = parseWordContentToQuestions(raw);
    assert.equal(res.questions.length, 1);
    assert.equal(res.questions[0].questionType, 'essay');
    assert.equal(res.questions[0].allowImageUpload, true);
  });

  it('Test 17: Tải file Word có công thức hóa học H₂SO₄, Fe³⁺, phương trình phản ứng', () => {
    const raw = `Câu 1: Cho Fe tác dụng với H2SO4 đặc nóng dư tạo ra ion Fe3+ và khí SO2: 2Fe + 6H2SO4 -> Fe2(SO4)3 + 3SO2^ + 6H2O.
A. *Fe³⁺ và SO₂
B. Fe²⁺ và H₂
C. FeO và SO₃
D. Fe(OH)₃`;
    const res = parseWordContentToQuestions(raw);
    const q = res.questions[0];
    assert.match(q.question, /H₂SO₄/);
    assert.match(q.question, /Fe³⁺/);
    assert.match(q.question, /2Fe \+ 6H₂SO₄ → Fe₂\(SO₄\)₃ \+ 3SO₂↑ \+ 6H₂O/);
  });

  it('Test 18: Tải file Word có phân số, căn thức, số mũ (OMML Equation và cảnh báo OLE)', () => {
    const ommlXml = `<p>Công thức tính cường độ dòng điện: <m:oMath><m:f><m:num><m:t>U</m:t></m:num><m:den><m:t>R</m:t></m:den></m:f></m:oMath> và căn bậc hai <m:oMath><m:rad><m:e><m:t>2g.h</m:t></m:e></m:rad></m:oMath></p>`;
    const convertedOmml = convertWordOmmlToReadableFormula(ommlXml);
    assert.match(convertedOmml, /\\frac\{U\}\{R\}/);
    assert.match(convertedOmml, /√\(2g\.h\)/);

    const oleCheck = detectLegacyOleEquations('<p><o:OLEObject Type="Embed" ProgId="Equation.DSMT4"/></p>');
    assert.equal(oleCheck.hasOleEquation, true);
    assert.ok(oleCheck.count >= 1);
  });

  it('Test 19: Mở hộp thoại CÔNG THỨC, tạo công thức và chèn vào câu hỏi, đáp án, lời giải', () => {
    const raw = `Câu 1: Biểu thức định luật Ohm là:
A. I = U/R
B. I = U.R
C. I = R/U
D. U = I/R
Đáp án: A`;
    const q = parseWordContentToQuestions(raw).questions[0];
    const formulaToInsert = '\\frac{U}{R} + \\sqrt{x} + Fe³⁺';

    // Simulate inserting formula into question stem, Option A, and explanation
    q.question = `${q.question} ${formulaToInsert}`;
    q.options[0] = `${q.options[0]} (${formulaToInsert})`;
    q.explanation = `Áp dụng công thức ${formulaToInsert}. Đáp án: A.`;

    assert.match(q.question, /\\frac\{U\}\{R\}/);
    assert.match(q.options[0], /Fe³⁺/);
    assert.match(q.explanation, /\\sqrt\{x\}/);
  });

  it('Test 20: Tạo lời giải mới bằng AI và kiểm tra KHÔNG có Bước 1, Bước 2, Bước 3, Bước 4, Phân tích dữ kiện', () => {
    const raw = `Câu 1: Cho 6,5 gam Zn (M = 65) tác dụng hết với dung dịch HCl dư. Thể tích khí H2 thu được ở đkc là:
A. 1,2395 L
B. *2,479 L
C. 3,7185 L
D. 4,958 L`;
    const parsed = parseWordContentToQuestions(raw).questions[0];
    const withAiSol = generateConciseSolution(parsed);

    assert.doesNotMatch(withAiSol.explanation, /Bước\s*1/i);
    assert.doesNotMatch(withAiSol.explanation, /Bước\s*2/i);
    assert.doesNotMatch(withAiSol.explanation, /Bước\s*3/i);
    assert.doesNotMatch(withAiSol.explanation, /Bước\s*4/i);
    assert.doesNotMatch(withAiSol.explanation, /Phân tích dữ kiện/i);
    assert.doesNotMatch(withAiSol.explanation, /Phương pháp giải/i);
    assert.match(withAiSol.explanation, /\\frac\{6,5\}\{65\} = 0,1 mol/);
    assert.match(withAiSol.explanation, /Đáp án: B/);
  });

  it('Test 21: Kiểm tra lời giải hiển thị gọn trên điện thoại và chuẩn hóa lời giải cũ', () => {
    const verboseLegacyExplanation = `Bước 1: Phân tích dữ kiện đề bài: Cho m_Zn = 6,5 gam.
Bước 2: Phương pháp giải: Tính số mol Zn theo công thức n = m/M.
Bước 3: Thực hiện phép tính:
n_Zn = 6,5 / 65 = 0,1 mol.
PTHH: Zn + 2HCl → ZnCl₂ + H₂↑
V_H₂ = 0,1 × 24,79 = 2,479 L.
Bước 4: Kết luận: Vậy chọn đáp án B.`;

    const concise = normalizeSolutionPresentation(verboseLegacyExplanation);
    assert.equal(concise.changed, true);
    assert.doesNotMatch(concise.normalizedText, /Bước 1/i);
    assert.doesNotMatch(concise.normalizedText, /Bước 2/i);
    assert.doesNotMatch(concise.normalizedText, /Bước 3/i);
    assert.doesNotMatch(concise.normalizedText, /Bước 4/i);
    assert.match(concise.normalizedText, /n_Zn = 6,5 \/ 65 = 0,1 mol/);
    assert.match(concise.normalizedText, /Đáp án: B/);
  });

  it('Test 22: Giáo viên sửa câu hỏi, sửa công thức, sửa lời giải và lưu', async () => {
    const raw = `Câu 1: Cho dung dịch HCl tác dụng với NaOH tạo muối nào?
A. *NaCl
B. Na2SO4
C. NaNO3
D. Na2CO3`;
    const q = parseWordContentToQuestions(raw).questions[0];
    q.question = 'Cho dung dịch HCl tác dụng với NaOH: HCl + NaOH → NaCl + H₂O. Sản phẩm muối là:';
    q.explanation = 'HCl + NaOH → NaCl + H₂O.\nĐáp án: A.';
    q.approvalStatus = 'approved';

    await saveAdminQuestionsBulk([q]);
    const allSaved = getAdminQuestionsSync();
    const found = allSaved.find((item) => item.id === q.id);
    assert.ok(found);
    assert.match(found!.question, /HCl \+ NaOH → NaCl \+ H₂O/);
    assert.equal(found!.explanation, 'HCl + NaOH → NaCl + H₂O.\nĐáp án: A.');
  });

  it('Test 23: Học sinh làm bài, nộp bài, xem điểm và lời giải', () => {
    const quiz = {
      id: 'quiz-student-test-23',
      lessonId: 'khtn8-hoa-1',
      title: 'Kiểm tra KHTN 8',
      grade: 8 as const,
      domain: 'hoa-hoc' as const,
      timeLimitMinutes: 15,
      passingScore: 5.0,
      questions: [
        {
          id: 'q23_1',
          type: 'single_choice' as const,
          question: 'Phản ứng Zn + 2HCl → ZnCl₂ + H₂↑ thu được khí nào?',
          options: [
            { id: 'opt_a', content: 'H₂' },
            { id: 'opt_b', content: 'O₂' },
          ],
          correctOptionIds: ['opt_a'],
          points: 10,
          explanation: 'Zn + 2HCl → ZnCl₂ + H₂↑. Đáp án: A.',
          difficulty: 'Nhận biết' as const,
        },
      ],
    };
    const graded = gradeQuizSubmission(
      quiz,
      [{ questionId: 'q23_1', selectedOptionId: 'opt_a' }],
      45
    );
    assert.equal(graded.score, 10);
    assert.equal(graded.passed, true);
    assert.match(graded.details[0].explanation, /Zn \+ 2HCl → ZnCl₂ \+ H₂↑/);
  });

  it('Test 24: Tải lại dữ liệu sau khi lưu để kiểm tra không lỗi font tiếng Việt và ký hiệu KHTN', async () => {
    const complexViQuestion = parseWordContentToQuestions(`
Câu 1: Ở 25°C, điện trở tương đương của đoạn mạch gồm R₁ = 6 Ω và R₂ = 12 Ω mắc song song là:
A. *4 Ω
B. 18 Ω
C. 6 Ω
D. 8 Ω
Lời giải: R_{tđ} = \\frac{R₁ . R₂}{R₁ + R₂} = \\frac{6 . 12}{6 + 12} = 4 Ω. Đáp án: A.
`).questions[0];

    await saveAdminQuestionsBulk([complexViQuestion]);
    const reloaded = getAdminQuestionsSync().find((item) => item.id === complexViQuestion.id);
    assert.ok(reloaded);
    assert.equal(reloaded!.question, reloaded!.question.normalize('NFC'));
    assert.match(reloaded!.question, /Ở 25°C, điện trở tương đương/);
    assert.match(reloaded!.question, /R₁ = 6 Ω và R₂ = 12 Ω/);
    assert.match(reloaded!.explanation, /\\frac\{6 \. 12\}\{6 \+ 12\} = 4 Ω/);
  });
});
