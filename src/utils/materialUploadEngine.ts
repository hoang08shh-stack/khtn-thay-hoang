import { Grade, Lesson, SubjectDomain, Topic } from '../types/index.ts';
import {
  getAdminTopicsSync,
  getInitialLocalLessons,
  getDeletedIdsRegistrySync,
  clearAdminLessonVideo,
  deleteAdminAsset,
  deleteAdminCatalogDoc,
  saveAdminTopic,
  saveAdminLesson,
  saveAdminVideo,
  saveAdminCatalogDoc,
  saveUploadedAssetToRepository,
  extractYouTubeId,
  generateSlug,
} from '../services/adminService.ts';

function getAdminLessonsSync(): Lesson[] {
  try {
    return getInitialLocalLessons() as unknown as Lesson[];
  } catch {
    return [];
  }
}

export type MaterialSubject = 'khtn' | 'hoa-hoc' | 'vat-li' | 'sinh-hoc';
export type MaterialGrade = 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type TextbookSeries =
  | 'ket-noi-tri-thuc'
  | 'chan-troi-sang-tao'
  | 'canh-dieu'
  | 'bo-sach-khac';

export type MaterialUploadCategory = 'lecture_doc' | 'video' | 'simulation';
export type MaterialPublishStatus = 'draft' | 'published';
export type DocumentSubCategory =
  | 'Giáo án điện tử'
  | 'Phiếu học tập'
  | 'Đề cương ôn tập'
  | 'Bài giảng & Tài liệu';

export const SUBJECT_LABELS: Record<MaterialSubject, string> = {
  khtn: 'Khoa học tự nhiên',
  'hoa-hoc': 'Hóa học',
  'vat-li': 'Vật lí',
  'sinh-hoc': 'Sinh học',
};

export const TEXTBOOK_LABELS: Record<TextbookSeries, string> = {
  'ket-noi-tri-thuc': 'Kết nối tri thức với cuộc sống',
  'chan-troi-sang-tao': 'Chân trời sáng tạo',
  'canh-dieu': 'Cánh diều',
  'bo-sach-khac': 'Bộ sách khác',
};

export const CATEGORY_LABELS: Record<MaterialUploadCategory, string> = {
  lecture_doc: 'Bài giảng & Tài liệu',
  video: 'Video',
  simulation: 'Mô phỏng',
};

export function inferDocumentSubCategory(
  title: string,
  fileName?: string,
  explicitSubType?: string
): DocumentSubCategory {
  if (
    explicitSubType === 'Giáo án điện tử' ||
    explicitSubType === 'Phiếu học tập' ||
    explicitSubType === 'Đề cương ôn tập'
  ) {
    return explicitSubType;
  }
  const combined = `${title || ''} ${fileName || ''}`.toLowerCase();
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';

  if (
    combined.includes('phiếu học tập') ||
    combined.includes('phieu hoc tap') ||
    combined.includes('phieu_hoc_tap') ||
    combined.includes('bài tập') ||
    combined.includes('bai tap')
  ) {
    return 'Phiếu học tập';
  }
  if (combined.includes('đề cương') || combined.includes('de cuong')) {
    return 'Đề cương ôn tập';
  }
  if (
    ext === 'ppt' ||
    ext === 'pptx' ||
    combined.includes('giáo án') ||
    combined.includes('giao an') ||
    combined.includes('bài giảng') ||
    combined.includes('bai giang') ||
    combined.includes('slide')
  ) {
    return 'Giáo án điện tử';
  }
  return 'Phiếu học tập';
}

export interface WizardStep1Data {
  subject: MaterialSubject;
  grade: MaterialGrade;
  textbook: TextbookSeries;
  topicId: string;
  topicTitle: string;
  lessonId: string;
  lessonTitle: string;
}

export interface WizardStep2Data {
  category: MaterialUploadCategory;
  docSubType?: DocumentSubCategory;
  title: string;
  description?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileDataUrl?: string;
  externalUrl?: string;
  videoSourceType?: 'upload_file' | 'youtube' | 'external_url';
  simulationType?: 'html_js' | '2d' | '2_5d' | '3d' | 'react_three' | 'external_embed';
  simulationHtml?: string;
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'ready' | 'error';
  errorMessage?: string;
}

export interface UnifiedLearningResource {
  id: string;
  subject: MaterialSubject;
  domain: SubjectDomain;
  grade: MaterialGrade;
  textbook: TextbookSeries;
  topicId: string;
  topicTitle: string;
  lessonId: string;
  lessonTitle: string;
  category: MaterialUploadCategory;
  docSubType?: DocumentSubCategory;
  title: string;
  description?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileDataUrl?: string;
  externalUrl?: string;
  videoSourceType?: 'upload_file' | 'youtube' | 'external_url';
  simulationType?: string;
  simulationHtml?: string;
  status: MaterialPublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TopicOptionItem {
  id: string;
  grade: MaterialGrade;
  domain: SubjectDomain;
  title: string;
  code?: string;
}

export interface LessonOptionItem {
  id: string;
  topicId: string;
  grade: MaterialGrade;
  domain: SubjectDomain;
  title: string;
}

const UNIFIED_RESOURCES_KEY = 'khtn_unified_learning_resources_v2';
const CUSTOM_TOPICS_KEY = 'khtn_wizard_custom_topics_v1';
const CUSTOM_LESSONS_KEY = 'khtn_wizard_custom_lessons_v1';
const WIZARD_DRAFT_KEY = 'khtn_material_wizard_draft_v2';

const memoryStore = new Map<string, string>();

function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    }
    const mem = memoryStore.get(key);
    return mem ? (JSON.parse(mem) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, val: T): void {
  try {
    const str = JSON.stringify(val);
    memoryStore.set(key, str);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, str);
    }
  } catch {
    // ignore storage quota errors
  }
}

const HIGH_SCHOOL_DEFAULT_TOPICS: TopicOptionItem[] = [
  {
    id: 'hs-10-hoa-1',
    grade: 10,
    domain: 'hoa-hoc',
    title: 'Chương 1 (Lớp 10): Cấu tạo nguyên tử & Bảng tuần hoàn',
    code: 'H10-C1',
  },
  {
    id: 'hs-10-li-1',
    grade: 10,
    domain: 'vat-li',
    title: 'Chương 1 (Lớp 10): Động học chất điểm',
    code: 'L10-C1',
  },
  {
    id: 'hs-10-sinh-1',
    grade: 10,
    domain: 'sinh-hoc',
    title: 'Chương 1 (Lớp 10): Thành phần hóa học của tế bào',
    code: 'S10-C1',
  },
  {
    id: 'hs-11-hoa-1',
    grade: 11,
    domain: 'hoa-hoc',
    title: 'Chương 1 (Lớp 11): Cân bằng hóa học & Sự điện li',
    code: 'H11-C1',
  },
  {
    id: 'hs-11-li-1',
    grade: 11,
    domain: 'vat-li',
    title: 'Chương 1 (Lớp 11): Dao động cơ & Sóng',
    code: 'L11-C1',
  },
  {
    id: 'hs-12-hoa-1',
    grade: 12,
    domain: 'hoa-hoc',
    title: 'Chương 1 (Lớp 12): Ester – Lipid & Carbohydrate',
    code: 'H12-C1',
  },
];

const HIGH_SCHOOL_DEFAULT_LESSONS: LessonOptionItem[] = [
  {
    id: 'hs-lesson-10-1',
    topicId: 'hs-10-hoa-1',
    grade: 10,
    domain: 'hoa-hoc',
    title: 'Bài 1: Thành phần của nguyên tử',
  },
  {
    id: 'hs-lesson-10-2',
    topicId: 'hs-10-li-1',
    grade: 10,
    domain: 'vat-li',
    title: 'Bài 1: Độ dịch chuyển và quãng đường đi được',
  },
  {
    id: 'hs-lesson-11-1',
    topicId: 'hs-11-hoa-1',
    grade: 11,
    domain: 'hoa-hoc',
    title: 'Bài 1: Khái niệm về cân bằng hóa học',
  },
  {
    id: 'hs-lesson-12-1',
    topicId: 'hs-12-hoa-1',
    grade: 12,
    domain: 'hoa-hoc',
    title: 'Bài 1: Ester và Lipid',
  },
];

export function resolveDomainFromSubject(
  subject: MaterialSubject,
  fallback: SubjectDomain = 'hoa-hoc'
): SubjectDomain {
  if (subject === 'hoa-hoc') return 'hoa-hoc';
  if (subject === 'vat-li') return 'vat-li';
  if (subject === 'sinh-hoc') return 'sinh-hoc';
  return fallback;
}

/**
 * Lấy danh sách Chương/Chủ đề liên kết động theo đúng Môn học và Khối lớp đã chọn.
 */
export function getTopicsForSubjectAndGrade(
  subject: MaterialSubject,
  grade: MaterialGrade
): TopicOptionItem[] {
  const adminTopics: Topic[] = getAdminTopicsSync();
  const customTopics = readJson<TopicOptionItem[]>(CUSTOM_TOPICS_KEY, []);

  const mappedAdmin: TopicOptionItem[] = adminTopics.map((t) => ({
    id: t.id,
    grade: t.grade as MaterialGrade,
    domain: t.domain,
    title: t.title,
    code: t.code,
  }));

  const all = [...customTopics, ...mappedAdmin, ...HIGH_SCHOOL_DEFAULT_TOPICS];
  const filtered = all.filter((t) => {
    if (t.grade !== grade) return false;
    if (subject === 'khtn') return true;
    return t.domain === subject;
  });

  if (filtered.length > 0) return filtered;

  // Fallback topic if none exists for that combination
  const dom = resolveDomainFromSubject(subject);
  return [
    {
      id: `topic-auto-${subject}-${grade}`,
      grade,
      domain: dom,
      title: `Chuyên đề ${SUBJECT_LABELS[subject]} Lớp ${grade}`,
    },
  ];
}

/**
 * Lấy danh sách Bài học liên kết động theo Chương/Chủ đề đã chọn, hỗ trợ tìm kiếm nhanh.
 */
export function getLessonsForTopic(
  topicId: string,
  grade: MaterialGrade,
  subject: MaterialSubject = 'khtn',
  searchQuery = ''
): LessonOptionItem[] {
  const adminLessons = getAdminLessonsSync();
  const customLessons = readJson<LessonOptionItem[]>(CUSTOM_LESSONS_KEY, []);

  const customMap = new Map(customLessons.map((c) => [c.id, c]));
  const mappedAdmin: LessonOptionItem[] = adminLessons.map((l) => {
    const customOverride = customMap.get(l.id);
    return {
      id: l.id,
      topicId: customOverride?.topicId || l.topicId,
      grade: l.grade as MaterialGrade,
      domain: l.domain,
      title: customOverride?.title || l.title,
    };
  });

  const adminIds = new Set(mappedAdmin.map((l) => l.id));
  const uniqueCustom = customLessons.filter((c) => !adminIds.has(c.id));
  const all = [...uniqueCustom, ...mappedAdmin, ...HIGH_SCHOOL_DEFAULT_LESSONS];
  let byTopic = all.filter((l) => l.topicId === topicId);

  if (byTopic.length === 0) {
    byTopic = all.filter((l) => l.grade === grade);
  }

  if (byTopic.length === 0) {
    byTopic = [
      {
        id: `lesson-auto-${topicId}-1`,
        topicId,
        grade,
        domain: resolveDomainFromSubject(subject),
        title: `Bài 1: Nội dung trọng tâm Khối ${grade}`,
      },
    ];
  }

  const q = searchQuery.trim().toLowerCase();
  if (!q) return byTopic;
  return byTopic.filter((l) => l.title.toLowerCase().includes(q));
}

/**
 * Tạo Chương/Chủ đề mới ngay trong Bước 1
 */
export function createInlineTopicForGrade(
  subject: MaterialSubject,
  grade: MaterialGrade,
  title: string
): TopicOptionItem {
  const cleanTitle = title.trim();
  const domain = resolveDomainFromSubject(subject);
  const newTopic: TopicOptionItem = {
    id: `topic-inline-${Date.now()}`,
    grade,
    domain,
    title: cleanTitle,
    code: `CD${grade}-${Date.now().toString().slice(-3)}`,
  };

  const customTopics = readJson<TopicOptionItem[]>(CUSTOM_TOPICS_KEY, []);
  customTopics.unshift(newTopic);
  writeJson(CUSTOM_TOPICS_KEY, customTopics);

  if (grade <= 9) {
    saveAdminTopic({
      id: newTopic.id,
      grade: grade as Grade,
      domain,
      code: newTopic.code,
      title: cleanTitle,
      description: `Chuyên đề ${SUBJECT_LABELS[subject]} Lớp ${grade}`,
    }).catch(() => {});
  }

  return newTopic;
}

/**
 * Tạo Bài học mới ngay trong Bước 1 ("Tạo bài mới")
 */
export function createInlineLessonForTopic(
  topicId: string,
  grade: MaterialGrade,
  title: string,
  subject: MaterialSubject = 'khtn'
): LessonOptionItem {
  const cleanTitle = title.trim();
  const domain = resolveDomainFromSubject(subject);
  const newLesson: LessonOptionItem = {
    id: `lesson-inline-${Date.now()}`,
    topicId,
    grade,
    domain,
    title: cleanTitle,
  };

  const customLessons = readJson<LessonOptionItem[]>(CUSTOM_LESSONS_KEY, []);
  customLessons.unshift(newLesson);
  writeJson(CUSTOM_LESSONS_KEY, customLessons);

  if (grade <= 9) {
    saveAdminLesson(
      {
        id: newLesson.id,
        topicId,
        grade: grade as Grade,
        domain,
        code: `B${grade}-${Date.now().toString().slice(-3)}`,
        slug: generateSlug(cleanTitle),
        title: cleanTitle,
        summary: `Bài học thuộc chương trình Lớp ${grade}.`,
        content: `### ${cleanTitle}`,
        durationMinutes: 45,
        orderIndex: 1,
        isPublished: true,
      },
      [],
      []
    ).catch(() => {});
  }

  return newLesson;
}

/**
 * Đổi tên Bài học ngay trong Bước 1 ("Sửa tên bài")
 */
export function renameInlineLesson(
  lessonId: string,
  newTitle: string
): LessonOptionItem | null {
  const cleanTitle = newTitle.trim();
  if (!lessonId || !cleanTitle) return null;

  const customLessons = readJson<LessonOptionItem[]>(CUSTOM_LESSONS_KEY, []);
  const customIdx = customLessons.findIndex((l) => l.id === lessonId);
  const adminLessons = getInitialLocalLessons();
  const foundAdmin = adminLessons.find((l) => l.id === lessonId);

  if (foundAdmin) {
    saveAdminLesson(
      {
        id: foundAdmin.id,
        topicId: foundAdmin.topicId,
        grade: foundAdmin.grade,
        domain: foundAdmin.domain,
        code: foundAdmin.code,
        slug: generateSlug(cleanTitle),
        title: cleanTitle,
        summary: foundAdmin.summary,
        content: foundAdmin.content,
        durationMinutes: foundAdmin.durationMinutes,
        orderIndex: foundAdmin.orderIndex,
        isPublished: foundAdmin.isPublished,
        thumbnailUrl: foundAdmin.thumbnailUrl,
        videoUrl: foundAdmin.videoUrl,
        miniQuiz: foundAdmin.miniQuiz,
      },
      foundAdmin.assets || [],
      foundAdmin.simulationIds || []
    ).catch(() => {});
  }

  if (customIdx >= 0) {
    customLessons[customIdx] = { ...customLessons[customIdx], title: cleanTitle };
    writeJson(CUSTOM_LESSONS_KEY, customLessons);
    return customLessons[customIdx];
  }

  if (foundAdmin) {
    const updatedItem: LessonOptionItem = {
      id: foundAdmin.id,
      topicId: foundAdmin.topicId,
      grade: foundAdmin.grade as MaterialGrade,
      domain: foundAdmin.domain,
      title: cleanTitle,
    };
    customLessons.unshift(updatedItem);
    writeJson(CUSTOM_LESSONS_KEY, customLessons);
    return updatedItem;
  }

  return null;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function extractYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytId = extractYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}`;
  return null;
}

/**
 * Kiểm tra an toàn và cô lập mã HTML/JavaScript của mô phỏng trước khi nhúng vào <iframe sandbox="allow-scripts">
 */
export function validateSimulationHtmlSafety(rawHtml: string): {
  safe: boolean;
  sanitizedHtml: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  let sanitized = rawHtml || '';

  const dangerousPatterns: Array<{ regex: RegExp; reason: string }> = [
    { regex: /window\.parent/gi, reason: 'Đã chặn truy cập window.parent từ mô phỏng.' },
    { regex: /window\.top/gi, reason: 'Đã chặn truy cập window.top từ mô phỏng.' },
    { regex: /parent\.document/gi, reason: 'Đã chặn truy cập parent.document.' },
    { regex: /document\.cookie/gi, reason: 'Đã chặn truy cập document.cookie.' },
  ];

  for (const item of dangerousPatterns) {
    if (item.regex.test(sanitized)) {
      warnings.push(item.reason);
      sanitized = sanitized.replace(item.regex, '/* [SANDBOX_BLOCKED] */ null');
    }
  }

  const wrapped = /<html\b/i.test(sanitized)
    ? sanitized
    : `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>body{margin:0;padding:12px;font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;}</style>
</head>
<body>${sanitized}</body>
</html>`;

  return {
    safe: warnings.length === 0,
    sanitizedHtml: wrapped,
    warnings,
  };
}

/**
 * Kiểm tra tính hợp lệ của Học liệu ở Bước 2
 */
export function validateMaterialFileOrSource(step2: WizardStep2Data): {
  valid: boolean;
  error?: string;
} {
  if (!step2.title || !step2.title.trim()) {
    return { valid: false, error: 'Vui lòng nhập Tên hiển thị học liệu.' };
  }

  if (step2.category === 'lecture_doc') {
    if (!step2.fileName) {
      return {
        valid: false,
        error: 'Vui lòng chọn tệp Bài giảng hoặc Tài liệu (.ppt, .pptx, .pdf, .doc, .docx).',
      };
    }
    const ext = step2.fileName.split('.').pop()?.toLowerCase() || '';
    if (!['ppt', 'pptx', 'pdf', 'doc', 'docx'].includes(ext)) {
      return {
        valid: false,
        error: 'Định dạng không hỗ trợ. Chỉ nhận .ppt, .pptx, .pdf, .doc, .docx.',
      };
    }
    return { valid: true };
  }

  if (step2.category === 'video') {
    if (step2.videoSourceType === 'upload_file') {
      if (!step2.fileName) {
        return { valid: false, error: 'Vui lòng chọn tệp Video (.mp4, .webm).' };
      }
      const ext = step2.fileName.split('.').pop()?.toLowerCase() || '';
      if (!['mp4', 'webm'].includes(ext)) {
        return { valid: false, error: 'Định dạng video chỉ hỗ trợ .mp4 hoặc .webm.' };
      }
      return { valid: true };
    }
    if (!step2.externalUrl || !step2.externalUrl.trim()) {
      return {
        valid: false,
        error: 'Vui lòng nhập liên kết YouTube hoặc URL video bài giảng.',
      };
    }
    return { valid: true };
  }

  if (step2.category === 'simulation') {
    if (step2.simulationType === 'external_embed') {
      if (!step2.externalUrl || !step2.externalUrl.trim()) {
        return { valid: false, error: 'Vui lòng nhập đường dẫn URL mô phỏng.' };
      }
      return { valid: true };
    }
    if (!step2.simulationHtml?.trim() && !step2.fileName) {
      return {
        valid: false,
        error: 'Vui lòng tải lên tệp .html mô phỏng hoặc dán mã nguồn HTML/JavaScript.',
      };
    }
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Lấy danh sách toàn bộ học liệu thống nhất (khởi tạo dữ liệu mẫu thực tế nếu chưa có)
 */
export function getUnifiedResourcesSync(): UnifiedLearningResource[] {
  const deletedReg = getDeletedIdsRegistrySync();
  const deletedLessonSet = new Set(deletedReg.lessons);
  const clearedVideoSet = new Set(deletedReg.clearedLessonVideoIds);

  const existing = readJson<UnifiedLearningResource[] | null>(UNIFIED_RESOURCES_KEY, null);
  if (existing !== null && Array.isArray(existing)) {
    return existing.filter((r) => {
      if (deletedLessonSet.has(r.lessonId)) return false;
      if (r.category === 'video' && clearedVideoSet.has(r.lessonId)) return false;
      return true;
    });
  }

  const now = new Date().toISOString();
  const baseSeed: UnifiedLearningResource[] = [
    {
      id: 'res-seed-doc-8',
      subject: 'khtn',
      domain: 'hoa-hoc',
      grade: 8,
      textbook: 'ket-noi-tri-thuc',
      topicId: 'cd8-2',
      topicTitle: 'Acid – Base – pH – Oxide – Muối',
      lessonId: 'khtn8-hoa-2',
      lessonTitle: 'Acid và tính chất hóa học của Acid',
      category: 'lecture_doc',
      title: 'Bài giảng điện tử PowerPoint: Acid và Thang pH (KHTN 8)',
      fileName: 'Bai_Giang_Acid_Thang_pH_KHTN8.pptx',
      fileType: 'pptx',
      fileSize: 2621440,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'res-seed-vid-8',
      subject: 'khtn',
      domain: 'hoa-hoc',
      grade: 8,
      textbook: 'ket-noi-tri-thuc',
      topicId: 'cd8-2',
      topicTitle: 'Acid – Base – pH – Oxide – Muối',
      lessonId: 'khtn8-hoa-2',
      lessonTitle: 'Acid và tính chất hóa học của Acid',
      category: 'video',
      title: 'Video thí nghiệm: Kim loại Zn tác dụng với dung dịch H₂SO₄ loãng',
      videoSourceType: 'youtube',
      externalUrl: 'https://www.youtube.com/watch?v=p3St51F4kE8',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'res-seed-sim-8',
      subject: 'khtn',
      domain: 'hoa-hoc',
      grade: 8,
      textbook: 'ket-noi-tri-thuc',
      topicId: 'cd8-2',
      topicTitle: 'Acid – Base – pH – Oxide – Muối',
      lessonId: 'khtn8-hoa-2',
      lessonTitle: 'Acid và tính chất hóa học của Acid',
      category: 'simulation',
      title: 'Mô phỏng tương tác 2D: Đo pH các dung dịch bằng chất chỉ thị',
      simulationType: 'html_js',
      simulationHtml:
        '<div style="padding:16px;font-family:sans-serif;color:#f8fafc;background:#0f172a;border-radius:12px;"><h4>Mô phỏng Thang pH KHTN 8</h4><p>Dung dịch HCl: pH = 1.0 (Quỳ tím hóa đỏ)</p></div>',
      status: 'published',
      createdAt: now,
      updatedAt: now,
    },
  ];
  const initialSeed = baseSeed.filter((r) => {
    if (deletedLessonSet.has(r.lessonId)) return false;
    if (r.category === 'video' && clearedVideoSet.has(r.lessonId)) return false;
    return true;
  });

  writeJson(UNIFIED_RESOURCES_KEY, initialSeed);
  return initialSeed;
}

/**
 * Lưu học liệu mới (LƯU BẢN NHÁP hoặc XUẤT BẢN) từ Bước 3
 */
export function saveUnifiedLearningResource(
  step1: WizardStep1Data,
  step2: WizardStep2Data,
  status: MaterialPublishStatus
): UnifiedLearningResource {
  const list = getUnifiedResourcesSync();
  const now = new Date().toISOString();
  const domain = resolveDomainFromSubject(step1.subject);

  const sanitizedSim = step2.simulationHtml
    ? validateSimulationHtmlSafety(step2.simulationHtml).sanitizedHtml
    : undefined;

  const resolvedDocSubType =
    step2.category === 'lecture_doc'
      ? inferDocumentSubCategory(step2.title, step2.fileName, step2.docSubType)
      : undefined;

  // Smartly resolve target lesson if step2.title explicitly specifies a different "Bài <N>" than the preselected step1 lesson
  const safeGrade = (step1.grade <= 9 ? step1.grade : 9) as Grade;
  const adminLessons = getInitialLocalLessons();
  const extractBaiNum = (text?: string): number | null => {
    const m = (text || '').trim().match(/^bài\s*0?(\d+)\b/i);
    return m ? parseInt(m[1], 10) : null;
  };
  const step1BaiNum = extractBaiNum(step1.lessonTitle);
  const step2BaiNum = extractBaiNum(step2.title);

  let resolvedLessonId = step1.lessonId;
  let resolvedLessonTitle = step1.lessonTitle;

  if (step2BaiNum !== null && step1BaiNum !== step2BaiNum) {
    const matchByBaiNum = adminLessons.find(
      (l) => l.grade === safeGrade && extractBaiNum(l.title) === step2BaiNum
    );
    if (matchByBaiNum) {
      resolvedLessonId = matchByBaiNum.id;
      resolvedLessonTitle = matchByBaiNum.title;
    } else {
      resolvedLessonId = `lesson-upload-g${safeGrade}-b${step2BaiNum}-${Date.now()}`;
      resolvedLessonTitle = step2.title.trim();
    }
  } else if (/bảo toàn khối lượng/i.test(step2.title) && !/bảo toàn khối lượng/i.test(step1.lessonTitle)) {
    const btkl = adminLessons.find(
      (l) => l.id === 'khtn-8-bai-5-btkl' || /bảo toàn khối lượng/i.test(l.title)
    );
    if (btkl) {
      resolvedLessonId = btkl.id;
      resolvedLessonTitle = btkl.title;
    }
  }

  const newRes: UnifiedLearningResource = {
    id: `res-${step2.category}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    subject: step1.subject,
    domain,
    grade: step1.grade,
    textbook: step1.textbook,
    topicId: step1.topicId,
    topicTitle: step1.topicTitle,
    lessonId: resolvedLessonId,
    lessonTitle: resolvedLessonTitle,
    category: step2.category,
    docSubType: resolvedDocSubType,
    title: step2.title.trim(),
    description: step2.description,
    fileName: step2.fileName,
    fileType: step2.fileType,
    fileSize: step2.fileSize,
    fileDataUrl: step2.fileDataUrl,
    externalUrl: step2.externalUrl,
    videoSourceType: step2.videoSourceType,
    simulationType: step2.simulationType,
    simulationHtml: sanitizedSim,
    status,
    createdAt: now,
    updatedAt: now,
  };

  const next = [newRes, ...list];
  writeJson(UNIFIED_RESOURCES_KEY, next);

  // Sync directly into the target lesson in khtn_admin_lessons_v2 so LessonDetailPage and Grade pages display it immediately
  try {
    const matchedLesson = adminLessons.find(
      (l) =>
        l.id === resolvedLessonId ||
        (resolvedLessonTitle &&
          l.title?.trim().toLowerCase() === resolvedLessonTitle.trim().toLowerCase())
    );

    const existingAssets = (matchedLesson?.assets ? [...matchedLesson.assets] : []).filter(
      (a) => a.fileUrl && a.fileUrl !== '#'
    );
    let updatedVideoUrl = matchedLesson?.videoUrl;

    if (step2.category === 'video') {
      const candidateVideo = step2.externalUrl?.trim() || step2.fileDataUrl;
      if (candidateVideo) {
        const ytId = extractYouTubeId(candidateVideo);
        updatedVideoUrl = ytId
          ? `https://www.youtube.com/watch?v=${ytId}`
          : candidateVideo;
      }
    } else if (step2.category === 'lecture_doc') {
      const ext = step2.fileName?.split('.').pop()?.toLowerCase() || 'pdf';
      const fmt: 'pptx' | 'pdf' | 'docx' =
        ext === 'pptx' || ext === 'ppt'
          ? 'pptx'
          : ext === 'docx' || ext === 'doc'
          ? 'docx'
          : 'pdf';
      const resolvedUrl = step2.fileDataUrl || step2.externalUrl || '#';
      const assetObj = {
        id: `asset-${newRes.id}`,
        lessonId: matchedLesson?.id || resolvedLessonId,
        title: newRes.title,
        format: fmt,
        type: resolvedDocSubType || CATEGORY_LABELS[step2.category],
        fileSize: formatFileSize(step2.fileSize || 1048576),
        fileUrl: resolvedUrl,
        fileName: step2.fileName,
        lessonTitle: resolvedLessonTitle || matchedLesson?.title,
      };
      existingAssets.unshift(assetObj);
      saveUploadedAssetToRepository(assetObj).catch(() => {});
    }

    if (matchedLesson) {
      const finalLessonTitle =
        step1.lessonId === matchedLesson.id && step1.lessonTitle?.trim()
          ? step1.lessonTitle.trim()
          : matchedLesson.title;
      saveAdminLesson(
        {
          id: matchedLesson.id,
          topicId: matchedLesson.topicId || step1.topicId,
          grade: matchedLesson.grade || safeGrade,
          domain: matchedLesson.domain || domain,
          code: matchedLesson.code || `B${safeGrade}-01`,
          slug: matchedLesson.slug || generateSlug(finalLessonTitle),
          title: finalLessonTitle,
          summary: matchedLesson.summary || step2.description || finalLessonTitle,
          content: matchedLesson.content || `### ${finalLessonTitle}`,
          durationMinutes: matchedLesson.durationMinutes || 45,
          orderIndex: matchedLesson.orderIndex || 1,
          isPublished: true,
          thumbnailUrl: matchedLesson.thumbnailUrl,
          videoUrl: updatedVideoUrl,
          miniQuiz: matchedLesson.miniQuiz,
        },
        existingAssets,
        matchedLesson.simulationIds || []
      ).catch(() => {});
    } else if (resolvedLessonId && resolvedLessonTitle) {
      saveAdminLesson(
        {
          id: resolvedLessonId,
          topicId: step1.topicId,
          grade: safeGrade,
          domain,
          code: `KHTN${safeGrade}-B${step2BaiNum ? String(step2BaiNum).padStart(2, '0') : Date.now().toString().slice(-2)}`,
          slug: generateSlug(resolvedLessonTitle),
          title: resolvedLessonTitle,
          summary:
            step2.description ||
            `${resolvedLessonTitle} – Chương trình ${SUBJECT_LABELS[step1.subject]} Lớp ${step1.grade}.`,
          content: `### ${resolvedLessonTitle}\n${step2.description || newRes.title}`,
          durationMinutes: 45,
          orderIndex: step2BaiNum || 1,
          isPublished: true,
          videoUrl: updatedVideoUrl,
        },
        existingAssets,
        []
      ).catch(() => {});
    }
  } catch {
    // ignore lesson sync errors
  }

  // Sync to catalog/videos if published and grade <= 9
  if (status === 'published') {
    if (step2.category === 'lecture_doc') {
      const ext = step2.fileName?.split('.').pop()?.toLowerCase() || 'pdf';
      const resolvedUrl = step2.fileDataUrl || step2.externalUrl || '#';
      saveAdminCatalogDoc({
        id: `cat-${newRes.id}`,
        lessonId: resolvedLessonId,
        title: newRes.title,
        grade: safeGrade,
        domain,
        format: ext === 'pptx' || ext === 'ppt' ? 'pptx' : ext === 'docx' || ext === 'doc' ? 'docx' : 'pdf',
        type: resolvedDocSubType || CATEGORY_LABELS[step2.category],
        fileSize: formatFileSize(step2.fileSize || 1048576),
        downloadUrl: resolvedUrl,
        fileUrl: resolvedUrl !== '#' ? resolvedUrl : undefined,
        fileName: step2.fileName,
        description: `${step1.topicTitle} – ${resolvedLessonTitle} (${TEXTBOOK_LABELS[step1.textbook]})`,
      }).catch(() => {});
    } else if (step2.category === 'video' && step2.externalUrl) {
      const ytId = extractYouTubeId(step2.externalUrl) || 'dQw4w9WgXcQ';
      saveAdminVideo({
        title: newRes.title,
        grade: safeGrade,
        domain,
        youtubeId: ytId,
        description: `${step1.topicTitle} – ${resolvedLessonTitle}`,
      }).catch(() => {});
    }
  }

  return newRes;
}

export function getUnifiedResourcesForLesson(
  lessonId: string,
  lessonTitle?: string
): UnifiedLearningResource[] {
  const list = getUnifiedResourcesSync();
  const normTitle = lessonTitle?.trim().toLowerCase() || '';
  return list.filter((r) => {
    if (r.lessonId === lessonId) return true;
    if (normTitle && r.lessonTitle?.trim().toLowerCase() === normTitle) return true;
    return false;
  });
}

export function updateUnifiedResourceTitle(
  resourceId: string,
  newTitle: string
): UnifiedLearningResource[] {
  const list = getUnifiedResourcesSync();
  const next = list.map((item) =>
    item.id === resourceId
      ? { ...item, title: newTitle.trim(), updatedAt: new Date().toISOString() }
      : item
  );
  writeJson(UNIFIED_RESOURCES_KEY, next);
  return next;
}

export function moveUnifiedResourceToLesson(
  resourceId: string,
  newTopicId: string,
  newTopicTitle: string,
  newLessonId: string,
  newLessonTitle: string
): UnifiedLearningResource[] {
  const list = getUnifiedResourcesSync();
  const next = list.map((item) =>
    item.id === resourceId
      ? {
          ...item,
          topicId: newTopicId,
          topicTitle: newTopicTitle,
          lessonId: newLessonId,
          lessonTitle: newLessonTitle,
          updatedAt: new Date().toISOString(),
        }
      : item
  );
  writeJson(UNIFIED_RESOURCES_KEY, next);
  return next;
}

export function replaceUnifiedResourceFile(
  resourceId: string,
  filePatch: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileDataUrl?: string;
  }
): UnifiedLearningResource[] {
  const list = getUnifiedResourcesSync();
  let updatedTarget: UnifiedLearningResource | undefined;
  const next = list.map((item) => {
    if (item.id === resourceId) {
      updatedTarget = {
        ...item,
        ...filePatch,
        updatedAt: new Date().toISOString(),
      };
      return updatedTarget;
    }
    return item;
  });
  writeJson(UNIFIED_RESOURCES_KEY, next);

  if (updatedTarget && updatedTarget.category === 'lecture_doc' && filePatch.fileDataUrl) {
    const ext = filePatch.fileName.split('.').pop()?.toLowerCase() || 'pdf';
    const fmt: 'pptx' | 'pdf' | 'docx' =
      ext === 'pptx' || ext === 'ppt'
        ? 'pptx'
        : ext === 'docx' || ext === 'doc'
        ? 'docx'
        : 'pdf';
    saveUploadedAssetToRepository({
      id: `asset-${updatedTarget.id}`,
      lessonId: updatedTarget.lessonId,
      title: updatedTarget.title,
      format: fmt,
      type:
        updatedTarget.docSubType ||
        inferDocumentSubCategory(updatedTarget.title, filePatch.fileName),
      fileSize: formatFileSize(filePatch.fileSize),
      fileUrl: filePatch.fileDataUrl,
      fileName: filePatch.fileName,
      lessonTitle: updatedTarget.lessonTitle,
    }).catch(() => {});
  }

  return next;
}

export function toggleUnifiedResourceStatus(
  resourceId: string
): UnifiedLearningResource[] {
  const list = getUnifiedResourcesSync();
  const next = list.map((item) =>
    item.id === resourceId
      ? {
          ...item,
          status: (item.status === 'published' ? 'draft' : 'published') as MaterialPublishStatus,
          updatedAt: new Date().toISOString(),
        }
      : item
  );
  writeJson(UNIFIED_RESOURCES_KEY, next);
  return next;
}

export function deleteUnifiedResource(resourceId: string): UnifiedLearningResource[] {
  const list = getUnifiedResourcesSync();
  const target = list.find((item) => item.id === resourceId);
  const next = list.filter((item) => item.id !== resourceId);
  writeJson(UNIFIED_RESOURCES_KEY, next);

  if (target) {
    if (target.category === 'video' && target.lessonId) {
      clearAdminLessonVideo(target.lessonId).catch(() => {});
    } else if (target.category === 'lecture_doc') {
      deleteAdminAsset(`asset-${resourceId}`).catch(() => {});
      deleteAdminCatalogDoc(`cat-${resourceId}`).catch(() => {});
    }
  }
  return next;
}

export function filterUnifiedResources(
  list: UnifiedLearningResource[],
  filters: {
    subject?: MaterialSubject | 'all';
    grade?: MaterialGrade | 'all';
    topicId?: string | 'all';
    lessonId?: string | 'all';
    category?: MaterialUploadCategory | 'all';
    status?: MaterialPublishStatus | 'all';
    searchQuery?: string;
  }
): UnifiedLearningResource[] {
  return list.filter((r) => {
    if (filters.subject && filters.subject !== 'all' && r.subject !== filters.subject) {
      return false;
    }
    if (filters.grade && filters.grade !== 'all' && r.grade !== filters.grade) {
      return false;
    }
    if (filters.topicId && filters.topicId !== 'all' && r.topicId !== filters.topicId) {
      return false;
    }
    if (filters.lessonId && filters.lessonId !== 'all' && r.lessonId !== filters.lessonId) {
      return false;
    }
    if (filters.category && filters.category !== 'all' && r.category !== filters.category) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && r.status !== filters.status) {
      return false;
    }
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      const match =
        r.title.toLowerCase().includes(q) ||
        r.lessonTitle.toLowerCase().includes(q) ||
        r.topicTitle.toLowerCase().includes(q) ||
        (r.fileName && r.fileName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });
}

export function saveWizardAutoDraft(draft: {
  step: 1 | 2 | 3;
  step1: WizardStep1Data;
  step2: WizardStep2Data;
}): void {
  writeJson(WIZARD_DRAFT_KEY, draft);
}

export function loadWizardAutoDraft(): {
  step: 1 | 2 | 3;
  step1: WizardStep1Data;
  step2: WizardStep2Data;
} | null {
  return readJson(WIZARD_DRAFT_KEY, null);
}

export function clearWizardAutoDraft(): void {
  memoryStore.delete(WIZARD_DRAFT_KEY);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(WIZARD_DRAFT_KEY);
    }
  } catch {
    // ignore
  }
}
