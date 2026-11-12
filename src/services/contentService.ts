import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { TOPICS, LESSONS, SIMULATIONS_3D, DOCUMENTS, VIDEOS } from '../data/mockData.ts';
import {
  getAdminTopicsSync,
  getAdminVideosSync,
  getAdminCatalogDocsSync,
  getInitialLocalLessons,
  getDeletedIdsRegistrySync,
  extractYouTubeId,
  normalizeVideoUrl,
  AdminLesson,
} from './adminService.ts';
import {
  getUnifiedResourcesForLesson,
  getUnifiedResourcesSync,
  inferDocumentSubCategory,
  formatFileSize,
} from '../utils/materialUploadEngine.ts';
import {
  Topic,
  Lesson,
  LessonSection,
  LessonAsset,
  Simulation3D,
  DocumentItem,
  VideoLesson,
  Grade,
  SubjectDomain,
} from '../types/index.ts';

function parseMarkdownSections(content: string, fallbackSections?: LessonSection[]): LessonSection[] {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    return (
      fallbackSections || [
        {
          title: '1. Nội dung kiến thức cốt lõi',
          content: ['Nội dung bài giảng đang được cập nhật.'],
        },
      ]
    );
  }

  // Split by ### or ## headings if present
  if (/^#{2,3}\s+/m.test(trimmed)) {
    const rawBlocks = trimmed
      .split(/(?=^#{2,3}\s+)/m)
      .map((b) => b.trim())
      .filter(Boolean);

    const parsed: LessonSection[] = rawBlocks.map((block, idx) => {
      const lines = block.split(/\r?\n/);
      const firstLine = lines[0].replace(/^#{2,3}\s+/, '').trim() || `Mục ${idx + 1}`;
      const rawBodyLines = lines
        .slice(1)
        .map((line) => line.trim())
        .filter(Boolean);

      // Extract inline "Công thức:", "Giải thích:", and "Ý chính:" if teacher wrote them in markdown
      const extractedFormulas: string[] = [];
      const extractedKeyPoints: string[] = [];
      let extractedMeaning = '';
      const bodyLines: string[] = [];

      rawBodyLines.forEach((line) => {
        const formulaLineMatch = line.match(/^(?:\*\*)?(?:Công thức|Phương trình)(?:\s*trọng tâm)?\s*:(?:\*\*)?\s*(.+)$/i);
        const meaningLineMatch = line.match(/^(?:\*\*)?(?:Giải thích(?:\s*kí hiệu)?|Trong đó)\s*:(?:\*\*)?\s*(.+)$/i);
        const keyPointLineMatch = line.match(/^(?:\*\*)?(?:Ý chính|Ghi nhớ)\s*:(?:\*\*)?\s*(.+)$/i);

        if (formulaLineMatch) {
          extractedFormulas.push(formulaLineMatch[1].trim());
        } else if (meaningLineMatch) {
          extractedMeaning = meaningLineMatch[1].trim();
        } else if (keyPointLineMatch) {
          extractedKeyPoints.push(keyPointLineMatch[1].trim());
        } else {
          bodyLines.push(line);
        }
      });

      // Match fallback section by index or title similarity
      const cleanFirst = firstLine.replace(/^\d+\.\s*/, '').toLowerCase();
      const matchedFallback =
        fallbackSections?.find((fs) => {
          const cleanFs = fs.title.replace(/^\d+\.\s*/, '').toLowerCase();
          return (
            fs.title.trim().toLowerCase() === firstLine.toLowerCase() ||
            cleanFs === cleanFirst ||
            cleanFs.includes(cleanFirst.slice(0, 18)) ||
            cleanFirst.includes(cleanFs.slice(0, 18))
          );
        }) || fallbackSections?.[idx];

      // If bodyLines are from an older unformatted cache (no a), b) subheadings or bolding) while matchedFallback has structured a), b) subheadings, prefer matchedFallback.content
      const bodyHasStructuredSubheadings = bodyLines.some((l) =>
        /^(?:[a-f]\)|•|\*\*)/i.test(l.trim())
      );
      const fallbackHasStructuredSubheadings = Boolean(
        matchedFallback?.content?.some((l) => /^(?:[a-f]\)|•|\*\*)/i.test(l.trim()))
      );

      const resolvedContent =
        !bodyHasStructuredSubheadings && fallbackHasStructuredSubheadings && matchedFallback
          ? matchedFallback.content
          : bodyLines.length > 0
          ? bodyLines
          : matchedFallback?.content || [firstLine];

      return {
        ...(matchedFallback || {}),
        title:
          !bodyHasStructuredSubheadings && fallbackHasStructuredSubheadings && matchedFallback
            ? matchedFallback.title
            : firstLine,
        content: resolvedContent,
        formula:
          extractedFormulas.length > 0
            ? extractedFormulas.join('   |   ')
            : matchedFallback?.formula,
        formulaMeaning: extractedMeaning || matchedFallback?.formulaMeaning,
        keyPoints:
          extractedKeyPoints.length > 0
            ? extractedKeyPoints
            : matchedFallback?.keyPoints,
      };
    });

    // If fallbackSections has more sections than an older 1-section cached markdown (e.g. upgraded from 1 section to 2 sections), append the new fallback sections
    if (
      fallbackSections &&
      fallbackSections.length > parsed.length &&
      parsed.every((p, i) => p.content === fallbackSections[i]?.content)
    ) {
      return fallbackSections;
    }

    if (parsed.length > 0) return parsed;
  }

  if (fallbackSections && fallbackSections.length > 0) {
    return fallbackSections;
  }

  return [
    {
      title: '1. Nội dung kiến thức cốt lõi',
      content: trimmed
        .split(/\r?\n+/)
        .map((p) => p.trim())
        .filter(Boolean),
    },
  ];
}

function mapAdminLessonToLesson(l: AdminLesson): Lesson {
  const baseMatch = LESSONS.find((m) => m.id === l.id);
  const unifiedForLesson = getUnifiedResourcesForLesson(l.id, l.title);
  const deletedReg = getDeletedIdsRegistrySync();
  const isClearedVideo =
    deletedReg.clearedLessonVideoIds.includes(l.id) ||
    l.videoUrl === '' ||
    extractYouTubeId(l.videoUrl || '') === 'dQw4w9WgXcQ';

  // Determine videoUrl: if cleared by admin, never fall back to uploadedVideoRes or baseMatch.videoUrl
  const uploadedVideoRes = isClearedVideo
    ? undefined
    : unifiedForLesson.find(
        (r) =>
          r.category === 'video' &&
          (r.externalUrl || r.fileDataUrl) &&
          extractYouTubeId(r.externalUrl || '') !== 'dQw4w9WgXcQ'
      );
  const resolvedVideoUrl = isClearedVideo
    ? undefined
    : normalizeVideoUrl(l.videoUrl) ||
      normalizeVideoUrl(uploadedVideoRes?.externalUrl || uploadedVideoRes?.fileDataUrl) ||
      normalizeVideoUrl(baseMatch?.videoUrl);

  // Merge real teacher-uploaded assets from AdminLesson + uploaded lecture_doc resources
  const baseAssets: LessonAsset[] = (l.assets || [])
    .filter((a) => a.fileUrl && a.fileUrl.trim() !== '' && a.fileUrl.trim() !== '#')
    .map((a) => ({
      id: a.id,
      title: a.title,
      format:
        a.format === 'pptx' || a.format === 'docx' || a.format === 'pdf'
          ? a.format
          : 'pdf',
      type: a.type || inferDocumentSubCategory(a.title, a.fileName),
      fileSize: a.fileSize || '1.5 MB',
      fileUrl: a.fileUrl,
      fileName: a.fileName,
    }));

  const unifiedDocAssets: LessonAsset[] = unifiedForLesson
    .filter(
      (r) =>
        r.category === 'lecture_doc' &&
        ((r.fileDataUrl && r.fileDataUrl !== '#') || (r.externalUrl && r.externalUrl !== '#'))
    )
    .map((r) => {
      const ext = r.fileName?.split('.').pop()?.toLowerCase() || 'pdf';
      const fmt: 'pptx' | 'pdf' | 'docx' =
        ext === 'pptx' || ext === 'ppt'
          ? 'pptx'
          : ext === 'docx' || ext === 'doc'
          ? 'docx'
          : 'pdf';
      return {
        id: `unified-${r.id}`,
        title: r.title,
        format: fmt,
        type: r.docSubType || inferDocumentSubCategory(r.title, r.fileName),
        fileSize: formatFileSize(r.fileSize || 1048576),
        fileUrl: (r.fileDataUrl || r.externalUrl)!,
        fileName: r.fileName,
      };
    });

  const mergedAssetsMap = new Map<string, LessonAsset>();
  [...unifiedDocAssets, ...baseAssets].forEach((asset) => {
    const key = `${asset.title.trim().toLowerCase()}__${asset.fileName || ''}`;
    if (!mergedAssetsMap.has(key)) {
      mergedAssetsMap.set(key, asset);
    }
  });

  const resolvedMiniQuiz =
    l.miniQuiz && l.miniQuiz.length > 0
      ? l.miniQuiz
      : baseMatch?.miniQuiz || [];

  return {
    ...(baseMatch || {}),
    id: l.id,
    topicId: l.topicId,
    grade: l.grade,
    domain: l.domain,
    code: l.code,
    title: l.title,
    summary: l.summary,
    objectives: baseMatch?.objectives || [
      'Nắm vững kiến thức trọng tâm sách Kết nối tri thức với cuộc sống',
      'Thực hành mô phỏng trực quan và giải quyết vấn đề thực tiễn',
    ],
    durationMinutes: l.durationMinutes || 45,
    sections: parseMarkdownSections(l.content || l.summary, baseMatch?.sections),
    keyTakeaways: baseMatch?.keyTakeaways || [
      'Ghi nhớ định luật và khái niệm khoa học cốt lõi',
      'Vận dụng giải câu hỏi ôn tập, củng cố cuối bài',
    ],
    keyFormulas: baseMatch?.keyFormulas,
    miniQuiz: resolvedMiniQuiz,
    assets: Array.from(mergedAssetsMap.values()),
    thumbnailUrl: l.thumbnailUrl || baseMatch?.thumbnailUrl,
    simulationId: l.simulationIds?.[0] || baseMatch?.simulationId,
    videoUrl: resolvedVideoUrl,
    quizCount: resolvedMiniQuiz.length || 5,
    viewCount: l.viewCount || 120,
    author: 'KHOA HỌC SỐ KHTN',
  };
}

/**
 * Fetch all published topics
 */
export async function getTopics(grade?: Grade, domain?: SubjectDomain): Promise<Topic[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('topics').select('*').order('order_index', { ascending: true });
      if (grade) query = query.eq('grade', grade);
      if (domain) query = query.eq('domain', domain);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((t: any) => ({
          id: t.id,
          grade: t.grade as Grade,
          domain: t.domain as SubjectDomain,
          code: t.code,
          chapterNumber: t.code,
          title: t.title,
          description: t.description,
          lessonCount: 4,
          lessonsCount: 4,
          experimentCount: 2,
          icon: 'BookOpen',
          order: t.order_index,
        }));
      }
    } catch (err) {
      console.warn('Supabase getTopics failed, falling back to mock:', err);
    }
  }

  const allTopics = getAdminTopicsSync();
  return allTopics.filter((t) => {
    if (grade && t.grade !== grade) return false;
    if (domain && t.domain !== domain) return false;
    return true;
  });
}

/**
 * Synchronously get published lessons (respecting deleted lessons & cleared videos)
 */
export function getPublishedLessonsSync(grade?: Grade, domain?: SubjectDomain): Lesson[] {
  const deletedLessonSet = new Set(getDeletedIdsRegistrySync().lessons);
  const localAdminLessons = getInitialLocalLessons();
  const published = localAdminLessons
    .filter((l) => l.isPublished === true && !deletedLessonSet.has(l.id))
    .map(mapAdminLessonToLesson);

  return published.filter((l) => {
    if (grade && l.grade !== grade) return false;
    if (domain && l.domain !== domain) return false;
    return true;
  });
}

/**
 * Fetch all published lessons
 */
export async function getLessons(grade?: Grade, domain?: SubjectDomain): Promise<Lesson[]> {
  return getPublishedLessonsSync(grade, domain);
}

export async function getPublishedLessons(): Promise<Lesson[]> {
  return getPublishedLessonsSync();
}

export async function getLessonsByGrade(grade: Grade): Promise<Lesson[]> {
  return getPublishedLessonsSync(grade);
}

export async function getLessonByIdOrSlug(idOrSlug: string): Promise<Lesson | null> {
  const cleanKey = (idOrSlug || '').trim().toLowerCase();
  const deletedLessonSet = new Set(getDeletedIdsRegistrySync().lessons);
  const localAdminLessons = getInitialLocalLessons().filter(
    (l) => !deletedLessonSet.has(l.id)
  );
  const matchedAdmin = localAdminLessons.find(
    (l) =>
      l.id.toLowerCase() === cleanKey ||
      (l.slug && l.slug.toLowerCase() === cleanKey) ||
      (l.code && l.code.toLowerCase() === cleanKey)
  );
  if (matchedAdmin) {
    return mapAdminLessonToLesson(matchedAdmin);
  }

  const all = await getLessons();
  return (
    all.find(
      (l) =>
        l.id.toLowerCase() === cleanKey ||
        l.code.toLowerCase() === cleanKey
    ) ||
    all[0] ||
    null
  );
}

/**
 * Fetch 3D Simulations
 */
export async function getSimulations(
  grade?: Grade,
  domain?: SubjectDomain
): Promise<Simulation3D[]> {
  return SIMULATIONS_3D.filter((s) => {
    if (grade && s.grade !== grade) return false;
    if (domain && s.domain !== domain) return false;
    return true;
  });
}

export async function getAllDocuments(): Promise<DocumentItem[]> {
  const catalogDocs = getAdminCatalogDocsSync();
  const localLessons = getInitialLocalLessons();
  const unifiedDocs = getUnifiedResourcesSync().filter(
    (r) =>
      r.category === 'lecture_doc' &&
      ((r.fileDataUrl && r.fileDataUrl !== '#') || (r.externalUrl && r.externalUrl !== '#'))
  );

  const merged: DocumentItem[] = [];
  const seenKeys = new Set<string>();

  // 1. Put teacher-uploaded files from lessons first
  localLessons.forEach((l) => {
    (l.assets || []).forEach((a) => {
      if (a.fileUrl && a.fileUrl.trim() !== '' && a.fileUrl.trim() !== '#') {
        const key = `${a.title.trim().toLowerCase()}__${l.id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          merged.push({
            id: a.id,
            lessonId: l.id,
            title: a.title,
            grade: l.grade,
            domain: l.domain,
            format:
              a.format === 'pptx' || a.format === 'docx' || a.format === 'pdf'
                ? a.format
                : 'pdf',
            type: a.type || inferDocumentSubCategory(a.title, a.fileName),
            pageCount: 10,
            fileSize: a.fileSize || '1.8 MB',
            description: `Học liệu bài giảng: ${l.title} (Khối lớp ${l.grade})`,
            author: 'Giáo viên tải lên',
            downloadCount: a.downloadsCount || 15,
            downloadUrl: a.fileUrl,
            fileUrl: a.fileUrl,
            fileName: a.fileName,
          });
        }
      }
    });
  });

  // 2. Put teacher-uploaded files from 3-Step Wizard
  unifiedDocs.forEach((r) => {
    const safeGrade = (r.grade >= 6 && r.grade <= 9 ? r.grade : 8) as Grade;
    const key = `${r.title.trim().toLowerCase()}__${r.lessonId}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      const ext = r.fileName?.split('.').pop()?.toLowerCase() || 'pdf';
      const fmt: 'pptx' | 'pdf' | 'docx' =
        ext === 'pptx' || ext === 'ppt'
          ? 'pptx'
          : ext === 'docx' || ext === 'doc'
          ? 'docx'
          : 'pdf';
      const resolvedUrl = (r.fileDataUrl || r.externalUrl)!;
      merged.push({
        id: `doc-uni-${r.id}`,
        lessonId: r.lessonId,
        title: r.title,
        grade: safeGrade,
        domain: r.domain,
        format: fmt,
        type: r.docSubType || inferDocumentSubCategory(r.title, r.fileName),
        pageCount: 12,
        fileSize: formatFileSize(r.fileSize || 1048576),
        description: `${r.topicTitle} – ${r.lessonTitle}`,
        author: 'Giáo viên tải lên',
        downloadCount: 12,
        downloadUrl: resolvedUrl,
        fileUrl: resolvedUrl,
        fileName: r.fileName,
      });
    }
  });

  // 3. Append catalog documents
  catalogDocs.forEach((d) => {
    const key = `${d.title.trim().toLowerCase()}__${d.lessonId || d.grade}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      merged.push(d);
    }
  });

  return merged;
}

export async function getDocumentsByGrade(grade: Grade): Promise<DocumentItem[]> {
  const all = await getAllDocuments();
  return all.filter((d) => d.grade === grade);
}

export async function getAllVideos(): Promise<VideoLesson[]> {
  return getAdminVideosSync();
}

export async function getVideosByGrade(grade: Grade): Promise<VideoLesson[]> {
  return getAdminVideosSync().filter((v) => v.grade === grade);
}
