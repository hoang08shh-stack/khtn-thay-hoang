import { Lesson, LessonAsset, DocumentItem } from '../types/index.ts';
import {
  getInitialLocalLessons,
  getGeneralUploadedAssetsSync,
  getAdminCatalogDocsSync,
} from '../services/adminService.ts';
import {
  getUnifiedResourcesSync,
  inferDocumentSubCategory,
  formatFileSize,
} from './materialUploadEngine.ts';
import {
  isRealUploadedFileUrl,
  resolvePlayableOrDownloadableUrl,
} from '../services/localFileStore.ts';

export interface GeneratedDocumentData {
  id: string;
  lessonId?: string;
  title: string;
  type: string; // 'Giáo án điện tử' | 'Phiếu học tập' | 'Đề cương ôn tập' | ...
  format: string; // 'pptx' | 'pdf' | 'docx' | 'doc'
  grade: number;
  lessonTitle?: string;
  fileSize?: string;
  fileUrl?: string;
  fileName?: string;
  hasTeacherFile: boolean;
  downloadFileName: string;
}

function sanitizeFileNameKeepExt(rawTitle: string, ext: string, originalFileName?: string): string {
  if (originalFileName && originalFileName.trim().length > 0) {
    const cleanOrig = originalFileName.trim();
    if (/\.[a-zA-Z0-9]{2,5}$/.test(cleanOrig)) {
      return cleanOrig;
    }
    return `${cleanOrig}.${ext}`;
  }
  const cleanBase = (rawTitle || 'Tai_lieu_KHTN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 75);
  const cleanExt = (ext || 'pdf').replace(/^\.+/, '').toLowerCase();
  return `${cleanBase || 'Tai_lieu_KHTN'}.${cleanExt}`;
}

function isMatchingDocCategory(candidateType: string, candidateTitle: string, targetType: string): boolean {
  const tTarget = (targetType || '').toLowerCase();
  const tCand = `${candidateType || ''} ${candidateTitle || ''}`.toLowerCase();
  if (tTarget.includes('giáo án') || tTarget.includes('bài giảng')) {
    return (
      tCand.includes('giáo án') ||
      tCand.includes('bài giảng') ||
      tCand.includes('slide') ||
      tCand.includes('pptx') ||
      tCand.includes('tài liệu')
    );
  }
  if (tTarget.includes('phiếu học tập') || tTarget.includes('bài tập')) {
    return (
      tCand.includes('phiếu học tập') ||
      tCand.includes('bài tập') ||
      tCand.includes('tài liệu')
    );
  }
  return true;
}

/**
 * Tìm file gốc mà Giáo viên đã tải lên kho bài giảng (trong bài học, công cụ tải 3 bước, hoặc kho chung)
 */
export function findTeacherUploadedFileInRepo(params: {
  id?: string;
  lessonId?: string;
  lessonTitle?: string;
  title: string;
  type: string;
  grade?: number;
  directFileUrl?: string;
  directFileName?: string;
  directFormat?: string;
  directFileSize?: string;
}): {
  fileUrl?: string;
  fileName?: string;
  format?: string;
  fileSize?: string;
  title?: string;
} | null {
  // 1. Nếu mục này đã gắn sẵn file thật do GV tải lên
  if (isRealUploadedFileUrl(params.directFileUrl)) {
    const extFromName = params.directFileName?.split('.').pop()?.toLowerCase();
    return {
      fileUrl: params.directFileUrl!.trim(),
      fileName: params.directFileName,
      format: extFromName || params.directFormat || 'pdf',
      fileSize: params.directFileSize,
      title: params.title,
    };
  }

  const normLessonTitle = (params.lessonTitle || '').trim().toLowerCase();
  const normDocTitle = (params.title || '').trim().toLowerCase();

  // 2. Tìm trong danh sách học liệu tải lên từ Công cụ 3 bước (UnifiedLearningResource)
  const unifiedList = getUnifiedResourcesSync().filter(
    (r) =>
      r.category === 'lecture_doc' &&
      (isRealUploadedFileUrl(r.fileDataUrl) || isRealUploadedFileUrl(r.externalUrl))
  );

  // Ưu tiên đúng bài học + đúng phân loại (Giáo án / Phiếu học tập)
  const unifiedForLesson = unifiedList.filter((r) => {
    if (params.lessonId && r.lessonId === params.lessonId) return true;
    if (normLessonTitle && r.lessonTitle?.trim().toLowerCase() === normLessonTitle) return true;
    if (normDocTitle && r.title.trim().toLowerCase() === normDocTitle) return true;
    return false;
  });

  const matchedUnifiedExact =
    unifiedForLesson.find((r) =>
      isMatchingDocCategory(
        r.docSubType || inferDocumentSubCategory(r.title, r.fileName),
        r.title,
        params.type
      )
    ) || unifiedForLesson[0];

  if (matchedUnifiedExact) {
    const ext = matchedUnifiedExact.fileName?.split('.').pop()?.toLowerCase() || 'pdf';
    return {
      fileUrl: (matchedUnifiedExact.fileDataUrl || matchedUnifiedExact.externalUrl)!.trim(),
      fileName: matchedUnifiedExact.fileName,
      format: ext,
      fileSize: formatFileSize(matchedUnifiedExact.fileSize || 1048576),
      title: matchedUnifiedExact.title,
    };
  }

  // 3. Tìm trong assets của bài giảng (khtn_admin_lessons_v2)
  const adminLessons = getInitialLocalLessons();
  const targetLesson = adminLessons.find(
    (l) =>
      (params.lessonId && l.id === params.lessonId) ||
      (normLessonTitle && l.title.trim().toLowerCase() === normLessonTitle)
  );

  if (targetLesson && Array.isArray(targetLesson.assets)) {
    const validAssets = targetLesson.assets.filter((a) => isRealUploadedFileUrl(a.fileUrl));
    const matchedAsset =
      validAssets.find((a) => isMatchingDocCategory(a.type, a.title, params.type)) ||
      validAssets[0];
    if (matchedAsset) {
      const ext = matchedAsset.fileName?.split('.').pop()?.toLowerCase() || matchedAsset.format || 'pdf';
      return {
        fileUrl: matchedAsset.fileUrl.trim(),
        fileName: matchedAsset.fileName,
        format: ext,
        fileSize: matchedAsset.fileSize,
        title: matchedAsset.title,
      };
    }
  }

  // 4. Tìm trong kho Tệp Đính kèm chung (khtn_admin_assets_v2) hoặc Kho Đề cương (khtn_admin_catalog_docs_v2)
  const generalAssets = getGeneralUploadedAssetsSync().filter((a) =>
    isRealUploadedFileUrl(a.fileUrl)
  );
  const matchedGeneral = generalAssets.find(
    (a) =>
      (params.lessonId && a.lessonId === params.lessonId) ||
      a.title.trim().toLowerCase() === normDocTitle
  );
  if (matchedGeneral) {
    return {
      fileUrl: matchedGeneral.fileUrl.trim(),
      fileName: matchedGeneral.fileName,
      format: matchedGeneral.format,
      fileSize: matchedGeneral.fileSize,
      title: matchedGeneral.title,
    };
  }

  const catalogDocs = getAdminCatalogDocsSync().filter(
    (d) => isRealUploadedFileUrl(d.fileUrl) || isRealUploadedFileUrl(d.downloadUrl)
  );
  const matchedCatalog = catalogDocs.find(
    (d) =>
      d.id === params.id ||
      (params.lessonId && d.lessonId === params.lessonId) ||
      d.title.trim().toLowerCase() === normDocTitle
  );
  if (matchedCatalog) {
    const url = (matchedCatalog.fileUrl || matchedCatalog.downloadUrl)!.trim();
    return {
      fileUrl: url,
      fileName: matchedCatalog.fileName,
      format: matchedCatalog.format,
      fileSize: matchedCatalog.fileSize,
      title: matchedCatalog.title,
    };
  }

  return null;
}

/**
 * Chuẩn bị thông tin tài liệu từ kho bài giảng của Giáo viên (Tuyệt đối KHÔNG dùng AI tự sinh nội dung giả)
 */
export function buildEducationalDocumentData(params: {
  id: string;
  lessonId?: string;
  title: string;
  type: string;
  format: string;
  grade?: number;
  fileSize?: string;
  fileUrl?: string;
  fileName?: string;
  lesson?: Lesson;
  description?: string;
}): GeneratedDocumentData {
  const grade = params.grade || params.lesson?.grade || 8;
  const lessonId = params.lessonId || params.lesson?.id;
  const lessonTitle = params.lesson?.title;

  const foundRepoFile = findTeacherUploadedFileInRepo({
    id: params.id,
    lessonId,
    lessonTitle,
    title: params.title,
    type: params.type,
    grade,
    directFileUrl: params.fileUrl,
    directFileName: params.fileName,
    directFormat: params.format,
    directFileSize: params.fileSize,
  });

  const finalFormat = (foundRepoFile?.format || params.format || 'pdf').toLowerCase();
  const finalFileName = foundRepoFile?.fileName || params.fileName;
  const finalFileUrl = foundRepoFile?.fileUrl;
  const hasTeacherFile = isRealUploadedFileUrl(finalFileUrl);
  const downloadFileName = sanitizeFileNameKeepExt(
    foundRepoFile?.title || params.title,
    finalFormat,
    finalFileName
  );

  return {
    id: params.id,
    lessonId,
    title: foundRepoFile?.title || params.title,
    type: params.type,
    format: finalFormat,
    grade,
    lessonTitle,
    fileSize: foundRepoFile?.fileSize || params.fileSize || '—',
    fileUrl: finalFileUrl,
    fileName: finalFileName,
    hasTeacherFile,
    downloadFileName,
  };
}

/**
 * Kích hoạt tải xuống đúng FILE GỐC mà giáo viên đã tải lên kho bài giảng.
 * TUYỆT ĐỐI KHÔNG tự sinh file .doc bằng AI.
 * Trả về true nếu đã tải file của giáo viên, false nếu giáo viên chưa tải file lên.
 */
export async function triggerEducationalDocumentDownload(
  docData: GeneratedDocumentData
): Promise<boolean> {
  // Kiểm tra lại trong kho bài giảng nếu lúc khởi tạo chưa có URL
  let targetUrl = docData.fileUrl;
  let targetFileName = docData.downloadFileName;

  if (!isRealUploadedFileUrl(targetUrl)) {
    const latest = findTeacherUploadedFileInRepo({
      id: docData.id,
      lessonId: docData.lessonId,
      lessonTitle: docData.lessonTitle,
      title: docData.title,
      type: docData.type,
      grade: docData.grade,
      directFileUrl: docData.fileUrl,
      directFileName: docData.fileName,
      directFormat: docData.format,
      directFileSize: docData.fileSize,
    });
    if (latest?.fileUrl) {
      targetUrl = latest.fileUrl;
      targetFileName = sanitizeFileNameKeepExt(
        latest.title || docData.title,
        latest.format || docData.format,
        latest.fileName || docData.fileName
      );
    }
  }

  if (!isRealUploadedFileUrl(targetUrl)) {
    return false;
  }

  const resolved = await resolvePlayableOrDownloadableUrl(targetUrl);
  if (!resolved || !resolved.url) {
    return false;
  }

  const finalDownloadName = resolved.fileName
    ? sanitizeFileNameKeepExt(docData.title, docData.format, resolved.fileName)
    : targetFileName;

  const link = document.createElement('a');
  link.href = resolved.url;
  link.download = finalDownloadName;
  if (resolved.url.startsWith('http://') || resolved.url.startsWith('https://')) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

/**
 * Helper chuyển LessonAsset sang GeneratedDocumentData
 */
export function createDocumentDataFromLessonAsset(
  asset: LessonAsset,
  lesson: Lesson
): GeneratedDocumentData {
  return buildEducationalDocumentData({
    id: asset.id,
    lessonId: lesson.id,
    title: asset.title,
    type: asset.type || (asset.format === 'pptx' ? 'Giáo án điện tử' : 'Phiếu học tập'),
    format: asset.format || 'pdf',
    grade: lesson.grade,
    fileSize: asset.fileSize,
    fileUrl: asset.fileUrl,
    fileName: asset.fileName,
    lesson,
  });
}

/**
 * Helper chuyển DocumentItem trong kho tài liệu sang GeneratedDocumentData
 */
export function createDocumentDataFromCatalogItem(doc: DocumentItem): GeneratedDocumentData {
  const resolvedUrl =
    doc.fileUrl && doc.fileUrl !== '#'
      ? doc.fileUrl
      : doc.downloadUrl && doc.downloadUrl !== '#'
      ? doc.downloadUrl
      : undefined;

  return buildEducationalDocumentData({
    id: doc.id,
    lessonId: doc.lessonId,
    title: doc.title,
    type: doc.type,
    format: doc.format,
    grade: doc.grade,
    fileSize: doc.fileSize,
    fileUrl: resolvedUrl,
    fileName: doc.fileName,
    description: doc.description,
  });
}
