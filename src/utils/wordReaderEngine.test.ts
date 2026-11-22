import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CORE_WORD_ASSET_TYPE,
  convertDocxArrayBufferToWordHtml,
  highlightSearchInWordHtml,
  injectHeadingIdsIntoWordHtml,
  isCoreWordAssetType,
  resolveCoreWordDocFromLesson,
  sanitizeWordHtml,
  upsertCoreWordAssetInList,
} from './wordReaderEngine.ts';
import {
  getInitialLocalLessons,
  resetAllAdminDataToDefault,
  saveAdminLesson,
} from '../services/adminService.ts';
import { getLessonByIdOrSlug, getPublishedLessonsSync } from '../services/contentService.ts';
import { saveUnifiedLearningResource } from './materialUploadEngine.ts';

function buildMinimalValidDocxBuffer(paragraphs: string[]): ArrayBuffer {
  // Build an uncompressed (STORE) valid .docx ZIP archive containing minimal OOXML parts
  const encoder = new TextEncoder();

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  const crc32 = (bytes: Uint8Array): number => {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  };

  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const bodyXml = paragraphs
    .map((p, idx) =>
      idx === 0
        ? `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${escapeXml(p)}</w:t></w:r></w:p>`
        : `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(p)}</w:t></w:r></w:p>`
    )
    .join('');

  const files: Array<{ name: string; content: Uint8Array }> = [
    {
      name: '[Content_Types].xml',
      content: encoder.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
          '</Types>'
      ),
    },
    {
      name: '_rels/.rels',
      content: encoder.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
          '</Relationships>'
      ),
    },
    {
      name: 'word/document.xml',
      content: encoder.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
          `<w:body>${bodyXml}<w:sectPr/></w:body>` +
          '</w:document>'
      ),
    },
  ];

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const data = file.content;
    const crc = crc32(data);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8
    lv.setUint16(8, 0, true); // STORE
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralParts.reduce((acc, b) => acc + b.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalSize = offset + centralSize + eocd.length;
  const output = new Uint8Array(totalSize);
  let pos = 0;
  for (const p of [...localParts, ...centralParts, eocd]) {
    output.set(p, pos);
    pos += p.length;
  }
  return output.buffer;
}

test('sanitizeWordHtml removes scripts/events while keeping academic tags and chemical subscripts', () => {
  const dirty =
    '<h1>Định luật bảo toàn</h1><script>alert(1)</script><p onclick="evil()">Công thức H<sub>2</sub>SO<sub>4</sub> + 2NaOH &rarr; Na<sub>2</sub>SO<sub>4</sub></p><a href="javascript:alert(2)">Link</a>';
  const clean = sanitizeWordHtml(dirty);
  assert.ok(!clean.includes('<script'));
  assert.ok(!clean.includes('onclick'));
  assert.ok(!clean.includes('javascript:'));
  assert.ok(clean.includes('<h1>Định luật bảo toàn</h1>'));
  assert.ok(clean.includes('H<sub>2</sub>SO<sub>4</sub>'));
  assert.ok(clean.includes('rel="noopener noreferrer"'));
});

test('injectHeadingIdsIntoWordHtml extracts outline headings and highlightSearchInWordHtml highlights text safely', () => {
  const html = '<h2>I. Khái niệm Ethylic alcohol</h2><p data-tag="alcohol">Rượu etylic C<sub>2</sub>H<sub>5</sub>OH tan vô hạn trong nước.</p>';
  const { html: withIds, outline } = injectHeadingIdsIntoWordHtml(html);
  assert.equal(outline.length, 1);
  assert.equal(outline[0].id, 'word-sec-1');
  assert.equal(outline[0].text, 'I. Khái niệm Ethylic alcohol');
  assert.ok(withIds.includes('id="word-sec-1"'));

  const highlighted = highlightSearchInWordHtml(withIds, 'alcohol');
  assert.equal(highlighted.matchCount, 1);
  assert.ok(highlighted.html.includes('data-tag="alcohol"'));
  assert.ok(highlighted.html.includes('<mark class="word-search-hit">alcohol</mark>'));
});

test('convertDocxArrayBufferToWordHtml decodes a real .docx buffer via Mammoth', async () => {
  const docxBuffer = buildMinimalValidDocxBuffer([
    'I. Tính chất vật lí của Ethylene',
    'Ethylene (C2H4) là chất khí không màu, ít tan trong nước.',
  ]);
  const res = await convertDocxArrayBufferToWordHtml(docxBuffer);
  assert.ok(res.plainText.includes('Tính chất vật lí của Ethylene'));
  assert.ok(res.plainText.includes('C2H4'));
  assert.ok(res.htmlContent.includes('<h1'));
  assert.equal(res.outline.length, 1);
  assert.equal(res.outline[0].text, 'I. Tính chất vật lí của Ethylene');
});

test('saveAdminLesson, contentService, and saveUnifiedLearningResource persist and resolve coreWordDoc cleanly', async () => {
  resetAllAdminDataToDefault();
  const targetLesson = getInitialLocalLessons().find((l) => l.id === 'khtn-8-bai-8');
  assert.ok(targetLesson, 'Expected khtn-8-bai-8 to exist');

  const coreDoc = {
    id: 'core-test-1',
    fileName: 'Bai_8_Ap_suat_cot_loi.docx',
    fileUrl: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBAo=',
    fileSize: '42 KB',
    htmlContent: '<h2>Áp suất chất lỏng</h2><p>Công thức p = d × h</p>',
    uploadedAt: '2026-11-13T10:00:00.000Z',
  };

  await saveAdminLesson(
    {
      ...targetLesson,
      coreWordDoc: coreDoc,
    },
    targetLesson.assets || [],
    targetLesson.simulationIds || [],
    targetLesson.miniQuiz || []
  );

  const hydrated = await getLessonByIdOrSlug('khtn-8-bai-8');
  assert.ok(hydrated?.coreWordDoc);
  assert.equal(hydrated?.coreWordDoc?.fileName, 'Bai_8_Ap_suat_cot_loi.docx');
  assert.ok(hydrated?.assets?.some((a) => isCoreWordAssetType(a.type)));

  // Removing coreWordDoc clears both coreWordDoc and mirrored CORE_WORD_ASSET_TYPE asset
  await saveAdminLesson(
    {
      ...targetLesson,
      coreWordDoc: null,
    },
    (hydrated?.assets || []).map((a) => ({ ...a, lessonId: targetLesson.id })),
    targetLesson.simulationIds || [],
    targetLesson.miniQuiz || []
  );
  const afterClear = await getLessonByIdOrSlug('khtn-8-bai-8');
  assert.equal(afterClear?.coreWordDoc, undefined);
  assert.equal(
    afterClear?.assets?.some((a) => a.type === CORE_WORD_ASSET_TYPE),
    false
  );

  // Verify Unified upload attaches coreWordDoc to target grade lesson
  const res = saveUnifiedLearningResource(
    {
      subject: 'hoa-hoc',
      grade: 9,
      textbook: 'ket-noi-tri-thuc',
      topicId: 'topic-9-hh',
      topicTitle: 'Hóa học hữu cơ',
      lessonId: 'khtn-9-bai-12',
      lessonTitle: 'Bài 12: Alkene - Ethylene',
    },
    {
      category: 'lecture_doc',
      title: 'Tài liệu Word trọng tâm Ethylene',
      uploadProgress: 100,
      uploadStatus: 'ready',
      coreWordDoc: {
        fileName: 'Ethylene_cot_loi.docx',
        fileUrl: 'https://example.com/Ethylene_cot_loi.docx',
        fileSize: '65 KB',
        htmlContent: '<h1>Ethylene C2H4</h1>',
      },
    },
    'published'
  );
  assert.ok(res.id);
  const grade9Lessons = getPublishedLessonsSync(9);
  const matching = grade9Lessons.find((l) => l.id === 'khtn-9-bai-12');
  assert.ok(matching?.coreWordDoc);
  assert.equal(matching?.coreWordDoc?.fileName, 'Ethylene_cot_loi.docx');

  // Verify upsertCoreWordAssetInList preserves slides & worksheets untouched
  const mixedAssets = upsertCoreWordAssetInList(
    [
      {
        id: 'slide-1',
        lessonId: 'l1',
        title: 'Giáo án slide',
        format: 'pptx',
        type: 'Giáo án điện tử',
        fileSize: '2 MB',
        fileUrl: 'https://example.com/slide.pptx',
      },
    ],
    'l1',
    'Bài 1',
    coreDoc
  );
  assert.equal(mixedAssets.length, 2);
  assert.equal(mixedAssets[0].type, CORE_WORD_ASSET_TYPE);
  assert.equal(mixedAssets[1].type, 'Giáo án điện tử');

  const resolvedFromAssetsOnly = resolveCoreWordDocFromLesson({ assets: mixedAssets });
  assert.ok(resolvedFromAssetsOnly);
  assert.equal(resolvedFromAssetsOnly?.fileName, 'Bai_8_Ap_suat_cot_loi.docx');

  // Verify Core Word asset never leaks into empty Giáo án điện tử / Phiếu học tập slots
  const { buildEducationalDocumentData } = await import('./documentGenerator.ts');
  const emptySlideSlot = buildEducationalDocumentData({
    id: 'slot-giao-an-khtn-9-bai-12',
    lessonId: 'khtn-9-bai-12',
    title: 'Giáo án điện tử - Bài 12: Alkene - Ethylene',
    type: 'Giáo án điện tử',
    format: 'pptx',
    grade: 9,
  });
  assert.equal(emptySlideSlot.hasTeacherFile, false);
});
