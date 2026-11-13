import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSlug,
  extractYouTubeId,
  saveAdminLesson,
  updateLessonMiniQuizSync,
} from '../services/adminService.ts';
import { getYoutubeEmbedUrl } from '../lib/supabase.ts';
import { getLessonByIdOrSlug } from '../services/contentService.ts';
import { saveUnifiedLearningResource } from './materialUploadEngine.ts';
import { validateUploadFile } from '../services/storageService.ts';

test('generateSlug converts Vietnamese text to clean URL slugs', () => {
  const input1 = 'Bài 4: Cấu tạo nguyên tử và mô hình Rutherford - Bohr';
  assert.equal(generateSlug(input1), 'bai-4-cau-tao-nguyen-tu-va-mo-hinh-rutherford-bohr');

  const input2 = 'Định luật Ôm và Điện trở dẫn điện (Lớp 9)';
  assert.equal(generateSlug(input2), 'dinh-luat-om-va-dien-tro-dan-dien-lop-9');

  const input3 = '  Quang hợp ở thực vật & Hô hấp tế bào...  ';
  assert.equal(generateSlug(input3), 'quang-hop-o-thuc-vat-ho-hap-te-bao');
});

test('extractYouTubeId and getYoutubeEmbedUrl parse various YouTube links, shorts, iframe embeds, and clean k3_ prefix', () => {
  assert.equal(
    extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );

  assert.equal(
    extractYouTubeId('https://youtu.be/k3_Bohr1234'),
    'k3_Bohr1234'
  );

  // Clean legacy accidental 14-char k3_ prefix (k3_ + 11-char ID)
  assert.equal(
    extractYouTubeId('https://www.youtube.com/watch?v=k3_dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(
    getYoutubeEmbedUrl('https://www.youtube.com/watch?v=k3_dQw4w9WgXcQ'),
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
  );

  // Support YouTube Shorts and full <iframe> snippets
  assert.equal(
    extractYouTubeId('https://www.youtube.com/shorts/abcdefghijk?feature=share'),
    'abcdefghijk'
  );
  assert.equal(
    getYoutubeEmbedUrl('<iframe width="560" height="315" src="https://www.youtube.com/embed/abcdefghijk" allowfullscreen></iframe>'),
    'https://www.youtube.com/embed/abcdefghijk'
  );

  assert.equal(
    extractYouTubeId('12345678901'),
    '12345678901'
  );

  assert.equal(extractYouTubeId('https://google.com'), null);
  assert.equal(extractYouTubeId(''), null);
});

test('saveAdminLesson, updateLessonMiniQuizSync, and getLessonByIdOrSlug persist clean YouTube videoUrl and end-of-lesson miniQuiz', async () => {
  const saved = await saveAdminLesson(
    {
      id: 'lesson-test-youtube-quiz',
      topicId: 'cd8-2',
      grade: 8,
      domain: 'hoa-hoc',
      code: 'KHTN8-HH-99',
      title: 'Bài kiểm tra Video & Câu hỏi củng cố cuối bài',
      summary: 'Tóm tắt bài giảng hóa học 8',
      content: '### I. Trọng tâm\nPhương trình phản ứng của Acid.',
      durationMinutes: 45,
      orderIndex: 9,
      isPublished: true,
      videoUrl: 'https://youtu.be/p3St51F4kE8',
      miniQuiz: [
        {
          question: 'Dung dịch làm quỳ tím hóa đỏ là chất nào?',
          options: ['NaOH', 'H2SO4', 'NaCl', 'KOH'],
          correctIndex: 1,
          explanation: 'H2SO4 là acid nên làm quỳ tím hóa đỏ.',
        },
      ],
    },
    [],
    []
  );

  assert.equal(saved.videoUrl, 'https://www.youtube.com/watch?v=p3St51F4kE8');
  assert.equal(saved.miniQuiz?.length, 1);

  const loaded = await getLessonByIdOrSlug('lesson-test-youtube-quiz');
  assert.ok(loaded);
  assert.equal(getYoutubeEmbedUrl(loaded.videoUrl), 'https://www.youtube.com/embed/p3St51F4kE8');
  assert.equal(loaded.miniQuiz?.length, 1);
  assert.equal(loaded.miniQuiz?.[0].correctIndex, 1);

  // Add second review question via updateLessonMiniQuizSync
  updateLessonMiniQuizSync('lesson-test-youtube-quiz', [
    ...(loaded.miniQuiz || []),
    {
      question: 'Kim loại Zn tác dụng với dung dịch HCl sinh ra khí nào?',
      options: ['O2', 'H2', 'Cl2', 'SO2'],
      correctIndex: 1,
      explanation: 'PTHH: Zn + 2HCl → ZnCl2 + H2↑.',
    },
  ]);

  const reloaded = await getLessonByIdOrSlug('lesson-test-youtube-quiz');
  assert.equal(reloaded?.miniQuiz?.length, 2);
  assert.equal(reloaded?.miniQuiz?.[1].options[1], 'H2');
});

test('saveUnifiedLearningResource syncs uploaded YouTube video directly to the lesson', async () => {
  saveUnifiedLearningResource(
    {
      subject: 'khtn',
      grade: 8,
      textbook: 'ket-noi-tri-thuc',
      topicId: 'cd8-2',
      topicTitle: 'Acid - Base',
      lessonId: 'lesson-test-youtube-quiz',
      lessonTitle: 'Bài kiểm tra Video & Câu hỏi củng cố cuối bài',
    },
    {
      category: 'video',
      title: 'Video thí nghiệm mới từ 3 bước',
      videoSourceType: 'youtube',
      externalUrl: 'https://youtu.be/abcdefghijk',
      uploadProgress: 100,
      uploadStatus: 'ready',
    },
    'published'
  );

  const updatedLesson = await getLessonByIdOrSlug('lesson-test-youtube-quiz');
  assert.equal(updatedLesson?.videoUrl, 'https://www.youtube.com/watch?v=abcdefghijk');
  assert.equal(
    getYoutubeEmbedUrl(updatedLesson?.videoUrl),
    'https://www.youtube.com/embed/abcdefghijk'
  );
});

test('validateUploadFile enforces 50MB Supabase Free limit and MIME types', () => {
  // Mock file within limit
  const validFile = {
    name: 'giao_an_khtn7.pptx',
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 20 * 1024 * 1024, // 20 MB
  } as unknown as File;

  const validRes = validateUploadFile(validFile);
  assert.equal(validRes.valid, true);

  // Mock file exceeding 50MB
  const oversizedFile = {
    name: 'video_nang.mp4',
    type: 'video/mp4',
    size: 60 * 1024 * 1024, // 60 MB
  } as unknown as File;

  const oversizedRes = validateUploadFile(oversizedFile);
  assert.equal(oversizedRes.valid, false);
  assert.match(oversizedRes.error || '', /vượt quá giới hạn 50 MB/i);

  // Mock invalid file extension
  const invalidExtFile = {
    name: 'tro_choi.exe',
    type: 'application/x-msdownload',
    size: 5 * 1024 * 1024,
  } as unknown as File;

  const invalidExtRes = validateUploadFile(invalidExtFile);
  assert.equal(invalidExtRes.valid, false);
  assert.match(invalidExtRes.error || '', /không được hỗ trợ/i);
});

test('Document repository strictly resolves teacher-uploaded files and never auto-generates AI .doc files', async () => {
  const {
    createDocumentDataFromLessonAsset,
    createDocumentDataFromCatalogItem,
    triggerEducationalDocumentDownload,
  } = await import('./documentGenerator.ts');
  const { LESSONS } = await import('../data/mockData.ts');

  const sampleLesson = LESSONS.find((l) => l.id === 'khtn-8-bai-5') || LESSONS[0];

  // 1. Before teacher uploads a file, hasTeacherFile is false and download returns false (never generates AI file)
  const emptySlotDoc = createDocumentDataFromLessonAsset(
    {
      id: 'slot-test-1',
      title: `Giáo án điện tử - ${sampleLesson.title}`,
      format: 'pptx',
      type: 'Giáo án điện tử',
      fileSize: 'Chưa tải tệp lên',
      fileUrl: '#',
    },
    sampleLesson
  );
  assert.equal(emptySlotDoc.hasTeacherFile, false);
  const downloadResultBeforeUpload = await triggerEducationalDocumentDownload(emptySlotDoc);
  assert.equal(downloadResultBeforeUpload, false);

  // 2. Teacher uploads a real .pptx file via the 3-step upload wizard for this lesson
  const mockPptxDataUrl =
    'data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,UEsDBBQAAAAIA===';
  saveUnifiedLearningResource(
    {
      subject: 'khtn',
      grade: sampleLesson.grade,
      textbook: 'ket-noi-tri-thuc',
      topicId: sampleLesson.topicId,
      topicTitle: 'Phản ứng hóa học',
      lessonId: sampleLesson.id,
      lessonTitle: sampleLesson.title,
    },
    {
      category: 'lecture_doc',
      docSubType: 'Giáo án điện tử',
      title: `Giáo án điện tử - ${sampleLesson.title}`,
      fileName: 'Giao_an_Bai_5_Acid_Thay_Hoang.pptx',
      fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      fileSize: 4200000,
      fileDataUrl: mockPptxDataUrl,
      uploadProgress: 100,
      uploadStatus: 'ready',
    },
    'published'
  );

  // 3. Now resolving the lesson's Giáo án điện tử slot finds the exact file uploaded by the teacher!
  const resolvedAfterUpload = createDocumentDataFromLessonAsset(
    {
      id: 'slot-test-1',
      title: `Giáo án điện tử - ${sampleLesson.title}`,
      format: 'pptx',
      type: 'Giáo án điện tử',
      fileSize: 'Chưa tải tệp lên',
      fileUrl: '',
    },
    sampleLesson
  );
  assert.equal(resolvedAfterUpload.hasTeacherFile, true);
  assert.equal(resolvedAfterUpload.fileUrl, mockPptxDataUrl);
  assert.equal(resolvedAfterUpload.downloadFileName, 'Giao_an_Bai_5_Acid_Thay_Hoang.pptx');
  assert.equal(resolvedAfterUpload.format, 'pptx');

  // 4. Catalog items matching this lesson/type also resolve the teacher's uploaded file
  const catalogDoc = createDocumentDataFromCatalogItem({
    id: 'cat-test-1',
    title: `Giáo án điện tử - ${sampleLesson.title}`,
    grade: sampleLesson.grade,
    domain: sampleLesson.domain,
    type: 'Giáo án điện tử',
    format: 'pptx',
    fileSize: '4.2 MB',
    pageCount: 15,
    author: 'Thầy Hoàng KHTN',
    downloadUrl: '',
    downloadCount: 1,
    description: 'Tệp giáo án do GV tải lên',
    lessonId: sampleLesson.id,
  });
  assert.equal(catalogDoc.hasTeacherFile, true);
  assert.equal(catalogDoc.downloadFileName, 'Giao_an_Bai_5_Acid_Thay_Hoang.pptx');
});

test('Word-to-Lesson-Review Converter parses and converts Multiple Choice, True/False (a,b,c,d), and Essay questions accurately', async () => {
  const {
    SAMPLE_WORD_3_REVIEW_TYPES,
    parseWordToLessonReviewQuestions,
    convertReviewQuestionType,
    evaluateLessonReviewQuiz,
  } = await import('./lessonReviewQuizConverter.ts');

  const parsed = parseWordToLessonReviewQuestions(SAMPLE_WORD_3_REVIEW_TYPES, {
    defaultGrade: 8,
    defaultDomain: 'hoa-hoc',
    targetMode: 'auto',
  });

  // Should parse 4 questions: 2 single_choice, 1 true_false, 1 essay
  assert.equal(parsed.counts.total, 4);
  assert.equal(parsed.counts.singleChoice, 2);
  assert.equal(parsed.counts.trueFalse, 1);
  assert.equal(parsed.counts.essay, 1);

  const mc1 = parsed.items[0];
  assert.equal(mc1.questionType, 'single_choice');
  assert.equal(mc1.correctIndex, 1); // B. *NaOH

  const tfQ = parsed.items[2];
  assert.equal(tfQ.questionType, 'true_false');
  assert.equal(tfQ.trueFalseStatements?.length, 4);
  // a) Đúng, b) Sai, c) Đúng, d) Sai
  assert.deepEqual(
    tfQ.trueFalseStatements?.map((s) => s.isTrue),
    [true, false, true, false]
  );

  const essayQ = parsed.items[3];
  assert.equal(essayQ.questionType, 'essay');
  assert.ok((essayQ.sampleAnswer || '').includes('Zn + 2HCl'));

  // Test converting between question types
  const mcToTf = convertReviewQuestionType(mc1, 'true_false');
  assert.equal(mcToTf.questionType, 'true_false');
  assert.equal(mcToTf.trueFalseStatements?.length, 4);
  assert.equal(mcToTf.trueFalseStatements?.[1].isTrue, true);
  assert.equal(mcToTf.trueFalseStatements?.[0].isTrue, false);

  const mcToEssay = convertReviewQuestionType(mc1, 'essay');
  assert.equal(mcToEssay.questionType, 'essay');
  assert.ok((mcToEssay.sampleAnswer || '').length > 0);

  // Test grading all 3 types via evaluateLessonReviewQuiz
  const gradePerfect = evaluateLessonReviewQuiz(
    parsed.items,
    { 0: 1, 1: 2 },
    { 2: { a: true, b: false, c: true, d: false } },
    { 3: 'PTHH: Zn + 2HCl -> ZnCl2 + H2. Số mol Zn = 0,1 mol -> V = 2,479 lít.' }
  );
  assert.equal(gradePerfect.correctCount, 4);
  assert.equal(gradePerfect.totalGradable, 4);
});

test('Question Converter normalizes broken Vietnamese fonts, detached accents, chemical formulas, and reaction arrows without error', async () => {
  const { normalizeVietnameseUnicodeNFC, convertLegacyVietnameseToUnicode } = await import(
    './vietnameseFontFixer.ts'
  );
  const { formatChemicalAndScientificText, parseWordContentToQuestions } = await import(
    './wordQuestionParser.ts'
  );
  const {
    SAMPLE_BROKEN_FONT_CHEM_ARROWS_WORD,
    parseWordToLessonReviewQuestions,
  } = await import('./lessonReviewQuizConverter.ts');

  // 1. Detached accents with spaces and legacy TCVN3 tokens
  const brokenFontSample =
    'C©u 1: Cho dung dÞch tác dụng hoàn toàn, tính khô´ i l­îng châ´ t kết tủa biê´ t sô´ mol bă` ng 0,2 mol.';
  const fixedFont = convertLegacyVietnameseToUnicode(brokenFontSample);
  assert.equal(
    fixedFont,
    'Câu 1: Cho dung dịch tác dụng hoàn toàn, tính khối lượng chất kết tủa biết số mol bằng 0,2 mol.'
  );

  // 2. Symbol/Wingdings PUA characters (\uF0AE, \uF0E0, \uF0DB) & reaction arrows with conditions
  const brokenArrows =
    '2KClO 3 --(t^o, MnO2)--> 2KCl + 3O 2^ | N 2 + 3H 2 <==> 2NH 3 | BaCl 2 + H 2 SO 4 \uF0E0 BaSO 4(kết tủa) + 2HCl | 2H 2 O ⎯⎯đpdd→ 2H 2^ + O 2^';
  const formattedArrows = formatChemicalAndScientificText(
    normalizeVietnameseUnicodeNFC(brokenArrows)
  ).text;
  assert.ok(formattedArrows.includes('2KClO₃ → (t°, MnO₂) 2KCl + 3O₂↑'));
  assert.ok(formattedArrows.includes('N₂ + 3H₂ ⇄ 2NH₃'));
  assert.ok(formattedArrows.includes('BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl'));
  assert.ok(formattedArrows.includes('2H₂O → (đpdd) 2H₂↑ + O₂↑'));

  // 3. Spaced, underscored, hydrate, and polymer chemical formulas
  const brokenFormulas =
    'H 2 SO 4 + Al 2 ( SO 4 ) 3 + Ca ( OH ) 2 + H_2SO_4 + CuSO 4 . 5H 2 O + (-CH2-CH2-)n';
  const formattedFormulas = formatChemicalAndScientificText(brokenFormulas).text;
  assert.equal(
    formattedFormulas,
    'H₂SO₄ + Al₂(SO₄)₃ + Ca(OH)₂ + H₂SO₄ + CuSO₄·5H₂O + (-CH₂-CH₂-)ₙ'
  );

  // 4. End-to-end parse of SAMPLE_BROKEN_FONT_CHEM_ARROWS_WORD
  const brokenParsed = parseWordToLessonReviewQuestions(SAMPLE_BROKEN_FONT_CHEM_ARROWS_WORD);
  assert.equal(brokenParsed.counts.total, 3);
  assert.equal(brokenParsed.diagnostics.fontFixed, true);
  assert.ok(brokenParsed.diagnostics.formulasFixedCount > 10);
  assert.ok(brokenParsed.diagnostics.arrowsFixedCount >= 4);
  assert.ok(brokenParsed.items[0].question.includes('Nhiệt phân hoàn toàn Kalium chlorate (KClO₃)'));
  assert.ok(brokenParsed.items[0].options[1].includes('2KClO₃ → (t°, MnO₂) 2KCl + 3O₂↑'));
  assert.ok(brokenParsed.items[1].question.includes('Sulfuric acid (H₂SO₄) loãng'));
  assert.ok(brokenParsed.items[1].trueFalseStatements?.[0].text.includes('BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl'));
  assert.ok(brokenParsed.items[1].trueFalseStatements?.[3].text.includes('Khối lượng dung dịch'));

  // 5. parseWordContentToQuestions also auto-converts legacy TCVN3 strings directly
  const directWordParse = parseWordContentToQuestions(
    `C©u 1: Hßa tan hoµn toµn 6,5 gam Zn vµo dung dÞch H 2 SO 4 lo·ng:\nA. *Zn + H 2 SO 4 \uF0AE ZnSO 4 + H 2^\nB. Zn + H 2 SO 4 -> ZnO + H 2\nC. Zn + 2HCl -> ZnCl 2 + H 2\nC. Cu + H 2 SO 4 -> CuSO 4 + H 2`
  );
  assert.equal(directWordParse.questions.length, 1);
  assert.ok(directWordParse.questions[0].question.includes('Hòa tan hoàn toàn 6,5 gam Zn'));
  assert.ok(directWordParse.questions[0].options[0].includes('Zn + H₂SO₄ → ZnSO₄ + H₂↑'));
});

test('Every lesson in LESSONS and getInitialLocalLessons has 3-format end-of-lesson review questions (miniQuiz)', async () => {
  const { LESSONS } = await import('../data/mockData.ts');
  const { getInitialLocalLessons, saveAdminQuestionsBulk } = await import(
    '../services/adminService.ts'
  );
  const { getLessonByIdOrSlug } = await import('../services/contentService.ts');

  assert.ok(LESSONS.length >= 9);
  for (const lesson of LESSONS) {
    assert.ok(
      lesson.miniQuiz && lesson.miniQuiz.length >= 4,
      `Lesson ${lesson.id} must have at least 4 miniQuiz questions`
    );
    const hasSingleChoice = lesson.miniQuiz.some((q) => q.questionType === 'single_choice');
    const hasTrueFalse = lesson.miniQuiz.some(
      (q) => q.questionType === 'true_false' && q.trueFalseStatements?.length === 4
    );
    const hasEssay = lesson.miniQuiz.some((q) => q.questionType === 'essay' && q.sampleAnswer);
    assert.equal(hasSingleChoice, true, `Lesson ${lesson.id} missing single_choice`);
    assert.equal(hasTrueFalse, true, `Lesson ${lesson.id} missing true_false`);
    assert.equal(hasEssay, true, `Lesson ${lesson.id} missing essay`);
  }

  // Verify getLessonByIdOrSlug returns non-empty miniQuiz for all lessons
  const loadedLesson = await getLessonByIdOrSlug('khtn-8-bai-5');
  assert.ok(loadedLesson?.miniQuiz && loadedLesson.miniQuiz.length >= 4);

  // Verify saving bulk questions with lessonId automatically appends to that lesson's miniQuiz
  const countBefore = (await getLessonByIdOrSlug('khtn-8-bai-5'))?.miniQuiz?.length || 0;
  await saveAdminQuestionsBulk([
    {
      id: 'q-word-sync-test-1',
      lessonId: 'khtn-8-bai-5',
      grade: 8,
      domain: 'hoa-hoc',
      question: 'Câu hỏi kiểm tra đồng bộ tự động vào cuối bài học KHTN 8 Bài 5:',
      questionType: 'single_choice',
      options: ['pH < 7', 'pH = 7', 'pH > 7', 'pH = 14'],
      correctAnswer: 0,
      explanation: 'Dung dịch Acid có pH < 7.',
    },
  ]);
  const localAfter = getInitialLocalLessons().find((l) => l.id === 'khtn-8-bai-5');
  assert.ok((localAfter?.miniQuiz?.length || 0) >= countBefore + 1);
});

test('Core Knowledge Content (Nội dung kiến thức trọng tâm) sections have structured subheadings, formulas, and clean LaTeX/scientific normalization', async () => {
  const { LESSONS } = await import('../data/mockData.ts');
  const { getLessonByIdOrSlug } = await import('../services/contentService.ts');
  const { formatChemicalAndScientificText } = await import('./wordQuestionParser.ts');

  for (const lesson of LESSONS) {
    assert.ok(lesson.sections.length >= 2, `Lesson ${lesson.id} should have at least 2 structured sections`);
    const hasSubheadings = lesson.sections.some((sec) =>
      sec.content.some((p) => /^[a-d]\)\s+/i.test(p.trim()))
    );
    const hasFormula = lesson.sections.some((sec) => Boolean(sec.formula && sec.formula.trim()));
    assert.equal(hasSubheadings, true, `Lesson ${lesson.id} should have structured a), b) subheadings`);
    assert.equal(hasFormula, true, `Lesson ${lesson.id} should have core formulas in sections`);
  }

  // Verify getLessonByIdOrSlug preserves formula, formulaMeaning, keyPoints, and subheadings
  const loaded8 = await getLessonByIdOrSlug('khtn-8-bai-8');
  assert.ok(loaded8);
  assert.ok(loaded8.sections[0].formula?.includes('\\frac{F}{S}'));
  assert.ok(loaded8.sections[1].formula?.includes('F_A = d_lỏng × V_chìm'));

  // Verify LaTeX math & chemical formula normalization
  const rawLatex =
    'Công thức: $I = \\frac{U}{R} \\Rightarrow R = 12\\Omega$, $n_1 \\cdot \\sin(i) = n_2 \\cdot \\sin(r)$, H 2 SO 4 + BaCl 2 -> BaSO 4(r) + 2HCl';
  const normalized = formatChemicalAndScientificText(rawLatex).text;
  assert.ok(!normalized.includes('$'));
  assert.ok(normalized.includes('\\frac{U}{R}'));
  assert.ok(normalized.includes('⇒'));
  assert.ok(normalized.includes('Ω'));
  assert.ok(normalized.includes('H₂SO₄ + BaCl₂ → BaSO₄↓ + 2HCl'));

  // Verify subheading auto-bolding and Bold button selection helper
  const {
    wrapSelectionWithBold,
    autoBoldAllSubheadingsInText,
    autoBoldInlineKeywords,
  } = await import('../components/common/ScientificSolutionView.tsx');

  const inlineSample =
    'a) Khái niệm và tính chất hóa học của Acid: Acid phân li ra ion H+. Các Acid quan trọng theo danh pháp IUPAC: HCl, H2SO4.';
  const boldedInline = autoBoldInlineKeywords(inlineSample);
  assert.ok(boldedInline.includes('**Khái niệm và tính chất hóa học của Acid:**'));
  assert.ok(boldedInline.includes('**Các Acid quan trọng theo danh pháp IUPAC:**'));

  const multiLineSample =
    '### 1. Mục lớn\na) Đề mục nhỏ thứ nhất: Nội dung 1.\nb) Đề mục nhỏ thứ hai';
  const boldedMulti = autoBoldAllSubheadingsInText(multiLineSample);
  assert.ok(boldedMulti.includes('**a) Đề mục nhỏ thứ nhất:**'));
  assert.ok(boldedMulti.includes('**b) Đề mục nhỏ thứ hai**'));

  // Test wrapSelectionWithBold wrapping and unwrapping
  const wrapped = wrapSelectionWithBold(' Định luật Ohm ', 1, 14);
  assert.equal(wrapped.nextText, ' **Định luật Ohm** ');
  const unwrapped = wrapSelectionWithBold(wrapped.nextText, 1, 18);
  assert.equal(unwrapped.nextText, ' Định luật Ohm ');
});

test('Deleting built-in lessons, clearing lesson video links, and deleting grade videos persist across Grade pages', async () => {
  const {
    deleteAdminLesson,
    clearAdminLessonVideo,
    deleteAdminVideo,
    getAdminVideosSync,
    resetAllAdminDataToDefault,
  } = await import('../services/adminService.ts');
  const {
    getLessonsByGrade,
    getVideosByGrade,
    getPublishedLessonsSync,
  } = await import('../services/contentService.ts');

  resetAllAdminDataToDefault();

  // 1. Verify built-in Grade 6 lesson exists initially
  const initialGrade6 = await getLessonsByGrade(6);
  const targetLesson = initialGrade6[0];
  assert.ok(targetLesson, 'Grade 6 should have initial lessons');

  // 2. Clear video link on targetLesson -> must not fall back to baseMatch.videoUrl
  await clearAdminLessonVideo(targetLesson.id);
  const afterVideoClear = await getLessonByIdOrSlug(targetLesson.id);
  assert.equal(afterVideoClear?.videoUrl, undefined, 'Cleared videoUrl must stay undefined and not fall back to mockData');

  // 3. Delete the built-in lesson -> must not resurrect in getLessonsByGrade or getPublishedLessonsSync
  await deleteAdminLesson(targetLesson.id);
  const afterDeleteGrade6 = await getLessonsByGrade(6);
  assert.equal(
    afterDeleteGrade6.some((l) => l.id === targetLesson.id),
    false,
    'Deleted built-in lesson must not reappear in getLessonsByGrade(6)'
  );
  assert.equal(
    getPublishedLessonsSync(6).some((l) => l.id === targetLesson.id),
    false,
    'Deleted built-in lesson must not reappear in getPublishedLessonsSync(6)'
  );

  // 4. Delete all videos in Admin -> getVideosByGrade and getAdminVideosSync must return [] and not re-seed VIDEOS
  const allVideos = getAdminVideosSync();
  for (const vid of allVideos) {
    await deleteAdminVideo(vid.id);
  }
  assert.equal(getAdminVideosSync().length, 0, 'Deleting all videos must persist empty array instead of re-seeding');
  const grade6Videos = await getVideosByGrade(6);
  assert.equal(grade6Videos.length, 0, 'Grade 6 videos must be empty after deletion');

  // Restore clean state after test
  resetAllAdminDataToDefault();
});

test('Bài 5: Định luật bảo toàn khối lượng is published on Grade 8 and smartly binds uploaded files from Wizard or General Storage', async () => {
  const {
    resetAllAdminDataToDefault,
    saveUploadedAssetToRepository,
  } = await import('../services/adminService.ts');
  const {
    getPublishedLessonsSync,
    getLessonByIdOrSlug,
    getAllDocumentsSync,
  } = await import('../services/contentService.ts');
  const {
    saveUnifiedLearningResource,
    renameInlineLesson,
  } = await import('./materialUploadEngine.ts');

  resetAllAdminDataToDefault();

  // 1. Verify Bài 5: Định luật bảo toàn khối lượng is present and ordered first in Grade 8
  const grade8Lessons = getPublishedLessonsSync(8);
  const btklLesson = grade8Lessons.find((l) => l.id === 'khtn-8-bai-5-btkl');
  assert.ok(btklLesson, 'Bài 5: Định luật bảo toàn khối lượng must exist in Grade 8 published lessons');
  assert.match(btklLesson.title, /Bài 5.*Định luật bảo toàn khối lượng/i);
  assert.equal(btklLesson.code, 'KHTN8-B05');
  assert.equal(btklLesson.simulationId, 'sim-chemical-equation-3d');
  assert.ok(btklLesson.miniQuiz && btklLesson.miniQuiz.length >= 4);

  // Verify natural ordering: Bài 5 comes before Bài 8 and Bài 16
  const idxBai5 = grade8Lessons.findIndex((l) => l.id === 'khtn-8-bai-5-btkl');
  const idxBai8 = grade8Lessons.findIndex((l) => l.id === 'khtn-8-bai-5');
  assert.ok(idxBai5 < idxBai8, 'Bài 5 must appear before Bài 8 on Grade 8 page');

  // 2. Verify catalog document for Bài 5 exists in Grade 8 documents
  const grade8Docs = getAllDocumentsSync(8);
  assert.ok(
    grade8Docs.some((d) => /Định luật bảo toàn khối lượng/i.test(d.title)),
    'Grade 8 documents must include Bài 5. Định luật bảo toàn khối lượng'
  );

  // 3. Even if teacher leaves Step 1 on "Bài 8: Acid - Base..." and uploads "Bài 5. Định luật bảo toàn khối lượng" in Step 2, it smartly binds to khtn-8-bai-5-btkl
  const samplePdfUrl = 'data:application/pdf;base64,JVBERi0xLjQK';
  const savedRes = saveUnifiedLearningResource(
    {
      subject: 'khtn',
      grade: 8,
      textbook: 'ket-noi-tri-thuc',
      topicId: 't8-1',
      topicTitle: 'Phản ứng hóa học & Bảo toàn khối lượng',
      lessonId: 'khtn-8-bai-5',
      lessonTitle: 'Bài 8: Acid - Base - Thang pH - Oxide - Muối (Danh pháp IUPAC)',
    },
    {
      category: 'lecture_doc',
      title: 'Bài 5. Định luật bảo toàn khối lượng',
      fileName: 'Bai_5_Dinh_luat_bao_toan_khoi_luong.pdf',
      fileType: 'application/pdf',
      fileSize: 1500000,
      fileDataUrl: samplePdfUrl,
      uploadProgress: 100,
      uploadStatus: 'ready',
    },
    'published'
  );
  assert.equal(savedRes.lessonId, 'khtn-8-bai-5-btkl');

  const loadedBtkl = await getLessonByIdOrSlug('khtn-8-bai-5-btkl');
  assert.ok(
    loadedBtkl?.assets?.some((a) => a.fileName === 'Bai_5_Dinh_luat_bao_toan_khoi_luong.pdf'),
    'Uploaded file for Bài 5 must be attached to khtn-8-bai-5-btkl'
  );

  // 4. Uploading to general-library with title "Bài 5. Định luật bảo toàn khối lượng" also links to khtn-8-bai-5-btkl and surfaces in getAllDocumentsSync(8)
  await saveUploadedAssetToRepository({
    id: 'asset-gen-btkl-1',
    lessonId: 'general-library',
    title: 'Bài 5. Định luật bảo toàn khối lượng - Phiếu học tập',
    format: 'docx',
    type: 'Phiếu học tập',
    fileSize: '1.2 MB',
    fileUrl: samplePdfUrl,
    fileName: 'PHT_Bai_5_BTKL.docx',
  });
  const docsAfterGenUpload = getAllDocumentsSync(8);
  assert.ok(
    docsAfterGenUpload.some((d) => d.id === 'asset-gen-btkl-1'),
    'General library upload for Bài 5 must appear in Grade 8 documents'
  );

  // 5. Renaming a lesson via renameInlineLesson persists to getPublishedLessonsSync
  renameInlineLesson(
    'khtn-8-bai-5-btkl',
    'Bài 5. Định luật bảo toàn khối lượng và phương trình hóa học'
  );
  const afterRename = getPublishedLessonsSync(8).find((l) => l.id === 'khtn-8-bai-5-btkl');
  assert.equal(
    afterRename?.title,
    'Bài 5. Định luật bảo toàn khối lượng và phương trình hóa học'
  );

  // 6. Cross-computer sync: Computer 1 builds CMS snapshot -> Computer 2 (empty localStorage) applies snapshot and sees the uploaded lesson & material
  const { buildCmsSnapshotPayload, applyCmsSnapshotToLocalStorage } = await import(
    '../services/adminService.ts'
  );
  const computer1Snapshot = buildCmsSnapshotPayload();
  assert.ok(Array.isArray(computer1Snapshot.lessons));
  assert.ok(Array.isArray(computer1Snapshot.unifiedResources));

  // Simulate Computer 2 with empty localStorage
  resetAllAdminDataToDefault();
  const appliedOnComputer2 = applyCmsSnapshotToLocalStorage(computer1Snapshot, true);
  assert.equal(appliedOnComputer2, true);

  const computer2Btkl = await getLessonByIdOrSlug('khtn-8-bai-5-btkl');
  assert.ok(
    computer2Btkl?.assets?.some((a) => a.fileName === 'Bai_5_Dinh_luat_bao_toan_khoi_luong.pdf'),
    'Computer 2 must see the uploaded document on Bài 5 after applying CMS snapshot from Computer 1'
  );
  const computer2Docs = getAllDocumentsSync(8);
  assert.ok(
    computer2Docs.some((d) => d.id === 'asset-gen-btkl-1'),
    'Computer 2 must see the general uploaded document in Grade 8 documents'
  );

  resetAllAdminDataToDefault();
});

test('CMS Sync JSON paste/import round-trips snapshot payload and rejects invalid JSON cleanly', async () => {
  const {
    resetAllAdminDataToDefault,
    buildCmsSnapshotPayload,
    importCmsSnapshotFromJson,
    saveAdminLesson,
  } = await import('../services/adminService.ts');
  const { getLessonByIdOrSlug, getPublishedLessonsSync } = await import('../services/contentService.ts');

  resetAllAdminDataToDefault();

  // 1. Invalid JSON returns ok: false without throwing
  const invalidResult = importCmsSnapshotFromJson('{not-valid-json');
  assert.equal(invalidResult.ok, false);

  // 2. Computer 1 adds a lesson and exports JSON string (copy/paste or file)
  await saveAdminLesson(
    {
      id: 'lesson-json-sync-check',
      topicId: 't8-1',
      grade: 8,
      domain: 'hoa-hoc',
      code: 'KHTN8-SYNC',
      title: 'Bài kiểm tra đồng bộ qua dán JSON',
      summary: 'Tóm tắt kiểm tra',
      content: '### 1. Nội dung\na) Mục nhỏ: Kiểm tra đồng bộ.',
      durationMinutes: 45,
      orderIndex: 10,
      isPublished: true,
    },
    [],
    []
  );

  const jsonString = JSON.stringify(buildCmsSnapshotPayload());

  // 3. Computer 2 resets to default, then pastes the JSON string into CmsSyncModal
  resetAllAdminDataToDefault();
  assert.equal(
    getPublishedLessonsSync(8).some((l) => l.id === 'lesson-json-sync-check'),
    false
  );

  const importRes = importCmsSnapshotFromJson(jsonString);
  assert.equal(importRes.ok, true);

  assert.equal(
    getPublishedLessonsSync(8).some((l) => l.id === 'lesson-json-sync-check'),
    true
  );
  const syncedLesson = await getLessonByIdOrSlug('lesson-json-sync-check');
  assert.ok(syncedLesson, 'Computer 2 must immediately see the lesson after pasting JSON');
  assert.equal(syncedLesson.id, 'lesson-json-sync-check');
  assert.equal(syncedLesson.title, 'Bài kiểm tra đồng bộ qua dán JSON');

  resetAllAdminDataToDefault();
});

test('Supabase sync diagnostics clearly report unconfigured state and video upload extensions are allowed', async () => {
  const { getSupabaseSyncDiagnostics } = await import('../services/adminService.ts');
  const diag = await getSupabaseSyncDiagnostics();
  assert.equal(diag.supabaseConfigured, false);
  assert.equal(diag.reason, 'supabase_not_configured');
  assert.equal(diag.target, 'local_only');

  const mp4File = {
    name: 'thi_nghiem_hoa_hoc.mp4',
    type: 'video/mp4',
    size: 12 * 1024 * 1024,
  } as unknown as File;
  const mp4Validation = validateUploadFile(mp4File);
  assert.equal(mp4Validation.valid, true);
});

test('Grade 9 lesson creation and 3-step upload sync lessons, documents, and review questions cleanly with zero duplicate question IDs', async () => {
  const {
    resetAllAdminDataToDefault,
    getAdminQuestionsSync,
    saveAdminLesson,
    getAdminTopicsSync,
  } = await import('../services/adminService.ts');
  const {
    getPublishedLessonsSync,
    getAllDocumentsSync,
    getLessonByIdOrSlug,
  } = await import('../services/contentService.ts');
  const {
    createInlineTopicForGrade,
    createInlineLessonForTopic,
    saveUnifiedLearningResource,
  } = await import('./materialUploadEngine.ts');

  resetAllAdminDataToDefault();

  // 1. Verify getAdminQuestionsSync never returns duplicate IDs
  const initialQs = getAdminQuestionsSync();
  const uniqueIds = new Set(initialQs.map((q) => q.id));
  assert.equal(
    initialQs.length,
    uniqueIds.size,
    'getAdminQuestionsSync() must deduplicate all built-in & snapshot question IDs'
  );

  // 2. Create a Grade 9 lesson via saveAdminLesson with miniQuiz -> syncs to Grade 9 lessons AND question bank
  const createdG9 = await saveAdminLesson(
    {
      id: 'lesson-g9-custom-sync-1',
      topicId: 'cd9-1',
      grade: 9,
      domain: 'vat-li',
      code: 'KHTN9-VL-99',
      title: 'Bài kiểm tra đồng bộ Lớp 9 (Năng lượng cơ học)',
      summary: 'Bài giảng đồng bộ đầy đủ vào khối lớp 9.',
      content: '### 1. Động năng\nCông thức: $W_d = \\frac{1}{2} m v^2$.',
      durationMinutes: 45,
      orderIndex: 99,
      isPublished: true,
      miniQuiz: [
        {
          questionType: 'single_choice',
          question: 'Đơn vị của động năng trong hệ SI là gì?',
          options: ['Newton (N)', 'Joule (J)', 'Watt (W)', 'Pascal (Pa)'],
          correctIndex: 1,
          explanation: 'Động năng là một dạng năng lượng nên có đơn vị là Joule (J).',
        },
      ],
    },
    [],
    []
  );

  assert.ok(
    getPublishedLessonsSync(9).some((l) => l.id === createdG9.id),
    'Created Grade 9 lesson must appear in Grade 9 published lessons'
  );
  assert.ok(
    getAdminQuestionsSync().some(
      (q) => q.grade === 9 && q.lessonId === createdG9.id && q.question.includes('động năng')
    ),
    'Lesson miniQuiz created via LessonFormModal must sync into Grade 9 question bank'
  );

  // 3. Create inline Topic & Lesson in Grade 9 via 3-step Wizard and upload document + review questions
  const inlineTopic = createInlineTopicForGrade('khtn', 9, 'Chủ đề Quang học Lớp 9 (Test)');
  assert.ok(
    getAdminTopicsSync().some((t) => t.id === inlineTopic.id && t.grade === 9),
    'Inline topic must appear in getAdminTopicsSync() for Grade 9'
  );

  const inlineLesson = createInlineLessonForTopic(
    inlineTopic.id,
    9,
    'Bài 10. Kính lúp và sự tạo ảnh',
    'khtn'
  );

  const savedRes = saveUnifiedLearningResource(
    {
      subject: 'khtn',
      grade: 9,
      textbook: 'ket-noi-tri-thuc',
      topicId: inlineTopic.id,
      topicTitle: inlineTopic.title,
      lessonId: inlineLesson.id,
      lessonTitle: inlineLesson.title,
    },
    {
      category: 'lecture_doc',
      title: 'Bài 5. Phiếu thực hành Kính lúp',
      fileName: 'Phieu_thuc_hanh_Kinh_lup_9.pdf',
      fileType: 'application/pdf',
      fileSize: 512000,
      fileDataUrl: 'data:application/pdf;base64,JVBERi0xLjQK',
      uploadProgress: 100,
      uploadStatus: 'ready',
      lessonSummary: 'Tìm hiểu tiêu cự và số bội giác của kính lúp.',
      lessonContent: '### 1. Cấu tạo kính lúp\nKính lúp là thấu kính hội tụ có tiêu cự ngắn.',
      reviewQuestions: [
        {
          questionType: 'single_choice',
          question: 'Kính lúp thực chất là loại thấu kính nào?',
          options: [
            'Thấu kính phân kì có tiêu cự ngắn',
            'Thấu kính hội tụ có tiêu cự ngắn',
            'Gương cầu lồi',
            'Lăng kính tam giác',
          ],
          correctIndex: 1,
          explanation: 'Kính lúp là thấu kính hội tụ có tiêu cự ngắn (f cỡ vài cm đến vài chục cm).',
        },
      ],
    },
    'published'
  );

  assert.equal(
    savedRes.lessonId,
    inlineLesson.id,
    'Inline-created lesson ID must be preserved even if resource title starts with Bài 5'
  );

  const g9LessonLoaded = await getLessonByIdOrSlug(inlineLesson.id);
  assert.ok(g9LessonLoaded, 'Uploaded Grade 9 lesson must load cleanly');
  assert.ok(
    (g9LessonLoaded.assets || []).some((a) => a.fileName === 'Phieu_thuc_hanh_Kinh_lup_9.pdf'),
    'Uploaded document must attach to the inline Grade 9 lesson'
  );
  assert.ok(
    (g9LessonLoaded.miniQuiz || []).some((q) => q.question.includes('Kính lúp thực chất')),
    'Review questions added in 3-step Wizard must appear in lesson miniQuiz'
  );
  assert.ok(
    getAllDocumentsSync(9).some((d) => d.lessonId === inlineLesson.id),
    'Uploaded Grade 9 document must appear in Grade 9 documents'
  );
  assert.ok(
    getAdminQuestionsSync().some(
      (q) => q.grade === 9 && q.lessonId === inlineLesson.id && q.question.includes('Kính lúp')
    ),
    'Review questions added in 3-step Wizard must sync to Grade 9 question bank'
  );

  resetAllAdminDataToDefault();
});






