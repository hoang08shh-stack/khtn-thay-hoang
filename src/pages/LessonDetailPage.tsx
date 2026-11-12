import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HERO_LAB_IMAGE, LESSONS, SIMULATIONS_3D, DOMAINS } from '../data/mockData.ts';
import {
  Lesson,
  LessonMiniQuizItem,
  LessonReviewQuestionType,
  TrueFalseStatement,
} from '../types/index.ts';
import { getLessonByIdOrSlug, getPublishedLessonsSync } from '../services/contentService.ts';
import { getYoutubeEmbedUrl } from '../lib/supabase.ts';
import {
  updateLessonMiniQuizSync,
  getInitialLocalLessons,
  saveAdminLesson,
  clearAdminLessonVideo,
  saveUploadedAssetToRepository,
  extractYouTubeId,
  getAdminQuestionsSync,
} from '../services/adminService.ts';
import { getUnifiedResourcesForLesson, inferDocumentSubCategory } from '../utils/materialUploadEngine.ts';
import { isRealUploadedFileUrl } from '../services/localFileStore.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { SimulationViewer } from '../components/simulations/SimulationViewer.tsx';
import {
  renderFormattedMathAndChem,
  renderStructuredTheoryParagraph,
  wrapSelectionWithBold,
  autoBoldAllSubheadingsInText,
} from '../components/common/ScientificSolutionView.tsx';
import { formatChemicalAndScientificText } from '../utils/wordQuestionParser.ts';
import { FormulaEditorModal } from '../components/admin/FormulaEditorModal.tsx';
import { LessonWordReviewConverter } from '../components/admin/LessonWordReviewConverter.tsx';
import {
  normalizeTrueFalseStatements,
  evaluateLessonReviewQuiz,
} from '../utils/lessonReviewQuizConverter.ts';
import {
  Clock,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  Atom,
  Award,
  ArrowRight,
  FileText,
  Sparkles,
  HelpCircle,
  Download,
  Video,
  CheckSquare,
  Plus,
  Edit3,
  Trash2,
  Sigma,
  ExternalLink,
  ClipboardPaste,
  RotateCcw,
  Eye,
  Upload,
  Bold,
  Save,
} from 'lucide-react';
import { toggleLessonCompletion, getStudentLessonProgress } from '../services/progressService.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { DocumentViewerModal } from '../components/common/DocumentViewerModal.tsx';
import {
  GeneratedDocumentData,
  createDocumentDataFromLessonAsset,
  triggerEducationalDocumentDownload,
} from '../utils/documentGenerator.ts';
import { uploadLessonDocument } from '../services/storageService.ts';

export const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson>(() => {
    const published = getPublishedLessonsSync();
    return (
      published.find((l) => l.id === lessonId || l.code === lessonId) ||
      published[0] ||
      LESSONS.find((l) => l.id === lessonId) ||
      LESSONS[0]
    );
  });
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [selectedTrueFalse, setSelectedTrueFalse] = useState<
    Record<number, Record<string, boolean>>
  >({});
  const [essayAnswers, setEssayAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Video switcher & quick video link updater
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isEditingVideoUrl, setIsEditingVideoUrl] = useState(false);
  const [quickVideoInput, setQuickVideoInput] = useState('');

  // End-of-lesson review questions editor & Word converter state
  const [isWordConverterOpen, setIsWordConverterOpen] = useState(false);
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  const [editingQuizIdx, setEditingQuizIdx] = useState<number | null>(null);
  const [draftQuestionType, setDraftQuestionType] =
    useState<LessonReviewQuestionType>('single_choice');
  const [draftQuestion, setDraftQuestion] = useState('');
  const [draftOptions, setDraftOptions] = useState<string[]>(['', '', '', '']);
  const [draftCorrectIdx, setDraftCorrectIdx] = useState<number>(0);
  const [draftTrueFalseStatements, setDraftTrueFalseStatements] = useState<
    TrueFalseStatement[]
  >(() => normalizeTrueFalseStatements());
  const [draftSampleAnswer, setDraftSampleAnswer] = useState('');
  const [draftExplanation, setDraftExplanation] = useState('');
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [formulaTarget, setFormulaTarget] = useState<'question' | 'explanation' | 'core_content'>(
    'question'
  );
  const [quizFeedbackMsg, setQuizFeedbackMsg] = useState<string | null>(null);

  // Core Knowledge Content inline editor & Bold function state
  const [isEditingCoreContent, setIsEditingCoreContent] = useState(false);
  const [coreContentDraft, setCoreContentDraft] = useState('');
  const [coreContentFeedback, setCoreContentFeedback] = useState<string | null>(null);
  const coreTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Document viewer & inline upload state for Giáo án điện tử & Phiếu học tập
  const [previewDocData, setPreviewDocData] = useState<GeneratedDocumentData | null>(null);
  const [downloadedAssetId, setDownloadedAssetId] = useState<string | null>(null);
  const [docUploadFeedback, setDocUploadFeedback] = useState<string | null>(null);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [docRefreshKey, setDocRefreshKey] = useState(0);

  const userId = user?.id || 'local_student_device';

  useEffect(() => {
    let mounted = true;
    if (lessonId) {
      getLessonByIdOrSlug(lessonId).then((found) => {
        if (mounted && found) {
          setLesson(found);
          setQuickVideoInput(found.videoUrl || '');
          setSelectedAnswers({});
          setSelectedTrueFalse({});
          setEssayAnswers({});
          setShowResults(false);
          setActiveVideoIndex(0);
        }
      });

      getStudentLessonProgress(userId).then((records) => {
        if (mounted) {
          const rec = records.find((r) => r.lessonId === lessonId);
          setIsCompleted(Boolean(rec?.completed));
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [lessonId, userId]);

  const handleToggleCompleted = async () => {
    const next = !isCompleted;
    setIsCompleted(next);
    await toggleLessonCompletion(userId, lesson.id, next);
  };

  const domainInfo = DOMAINS.find((d) => d.id === lesson.domain);
  const [activeSimIndex, setActiveSimIndex] = useState(0);

  useEffect(() => {
    setActiveSimIndex(0);
  }, [lesson.id]);

  const relatedSimulationsList = useMemo(() => {
    const list: typeof SIMULATIONS_3D = [];
    const seen = new Set<string>();
    if (lesson.simulationId) {
      const primary = SIMULATIONS_3D.find((s) => s.id === lesson.simulationId);
      if (primary) {
        seen.add(primary.id);
        list.push(primary);
      }
    }
    SIMULATIONS_3D.forEach((s) => {
      if (s.relatedLessonId === lesson.id && !seen.has(s.id)) {
        seen.add(s.id);
        list.push(s);
      }
    });
    return list;
  }, [lesson.id, lesson.simulationId]);

  const relatedSimulation =
    relatedSimulationsList[activeSimIndex] || relatedSimulationsList[0] || null;

  const relatedLessons = LESSONS.filter(
    (l) => l.grade === lesson.grade && l.id !== lesson.id
  ).slice(0, 3);

  // Collect all videos & documents for this lesson (primary lesson.videoUrl + any resources uploaded via 3-step wizard)
  const unifiedResources = useMemo(
    () => getUnifiedResourcesForLesson(lesson.id, lesson.title),
    [lesson.id, lesson.title, lesson.videoUrl, docRefreshKey]
  );

  const videoPlaylist = useMemo(() => {
    const items: Array<{ id: string; title: string; url: string }> = [];
    const seenUrls = new Set<string>();

    if (lesson.videoUrl && lesson.videoUrl.trim()) {
      const cleanUrl = lesson.videoUrl.trim();
      const embed = getYoutubeEmbedUrl(cleanUrl) || cleanUrl;
      seenUrls.add(embed);
      items.push({
        id: 'primary-lesson-video',
        title: `Video bài giảng: ${lesson.title}`,
        url: cleanUrl,
      });
    }

    unifiedResources
      .filter((r) => r.category === 'video' && (r.externalUrl || r.fileDataUrl))
      .forEach((r) => {
        const rawUrl = (r.externalUrl || r.fileDataUrl || '').trim();
        if (!rawUrl) return;
        const embedKey = getYoutubeEmbedUrl(rawUrl) || rawUrl;
        if (!seenUrls.has(embedKey)) {
          seenUrls.add(embedKey);
          items.push({
            id: r.id,
            title: r.title,
            url: rawUrl,
          });
        }
      });

    return items;
  }, [lesson.videoUrl, lesson.title, unifiedResources]);

  const uploadedSimulations = useMemo(
    () =>
      unifiedResources.filter(
        (r) => r.category === 'simulation' && (r.simulationHtml || r.externalUrl)
      ),
    [unifiedResources]
  );

  // Build list of teacher-uploaded lesson assets + slots for Giáo án điện tử & Phiếu học tập
  const effectiveLessonAssets = useMemo(() => {
    const realUploaded: Array<{
      id: string;
      title: string;
      format: 'pptx' | 'pdf' | 'docx';
      type: string;
      fileSize: string;
      fileUrl: string;
      fileName?: string;
    }> = [];
    const seenUrls = new Set<string>();

    (lesson.assets || []).forEach((a) => {
      if (isRealUploadedFileUrl(a.fileUrl)) {
        seenUrls.add(a.fileUrl);
        realUploaded.push({
          id: a.id,
          title: a.title,
          format: a.format,
          type: a.type,
          fileSize: a.fileSize,
          fileUrl: a.fileUrl,
          fileName: a.fileName,
        });
      }
    });

    unifiedResources
      .filter((r) => r.category === 'lecture_doc' && isRealUploadedFileUrl(r.fileDataUrl || r.externalUrl))
      .forEach((r) => {
        const url = (r.fileDataUrl || r.externalUrl || '').trim();
        if (!url || seenUrls.has(url)) return;
        seenUrls.add(url);
        const ext = (r.fileName || '').split('.').pop()?.toLowerCase() || '';
        const fmt: 'pptx' | 'pdf' | 'docx' =
          ext === 'pptx' || ext === 'ppt'
            ? 'pptx'
            : ext === 'docx' || ext === 'doc'
            ? 'docx'
            : 'pdf';
        realUploaded.push({
          id: r.id,
          title: r.title,
          format: fmt,
          type: r.docSubType || inferDocumentSubCategory(r.title, r.fileName),
          fileSize: r.fileSize ? `${Math.max(1, Math.round(r.fileSize / 1024))} KB` : 'Tệp tải lên',
          fileUrl: url,
          fileName: r.fileName,
        });
      });

    const hasGiaoAn = realUploaded.some((a) =>
      (a.type || '').toLowerCase().includes('giáo án') ||
      (a.title || '').toLowerCase().includes('giáo án') ||
      a.format === 'pptx'
    );
    const hasPhieuHocTap = realUploaded.some((a) =>
      (a.type || '').toLowerCase().includes('phiếu học tập') ||
      (a.title || '').toLowerCase().includes('phiếu học tập')
    );

    const result = [...realUploaded];
    if (!hasGiaoAn) {
      result.push({
        id: `slot-giao-an-${lesson.id}`,
        title: `Giáo án điện tử - ${lesson.title}`,
        format: 'pptx',
        type: 'Giáo án điện tử',
        fileSize: 'Chưa tải tệp lên',
        fileUrl: '',
      });
    }
    if (!hasPhieuHocTap) {
      result.push({
        id: `slot-phieu-hoc-tap-${lesson.id}`,
        title: `Phiếu học tập - ${lesson.title}`,
        format: 'pdf',
        type: 'Phiếu học tập',
        fileSize: 'Chưa tải tệp lên',
        fileUrl: '',
      });
    }
    return result;
  }, [lesson.assets, lesson.id, lesson.title, unifiedResources, docRefreshKey]);

  const handleAttachCustomDocumentFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docTypeLabel: 'Giáo án điện tử' | 'Phiếu học tập'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAsset(true);
    try {
      const uploaded = await uploadLessonDocument(file, lesson.id);
      if (uploaded) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
        const fmt: 'pptx' | 'pdf' | 'docx' =
          ext === 'pptx' || ext === 'ppt'
            ? 'pptx'
            : ext === 'docx' || ext === 'doc'
            ? 'docx'
            : 'pdf';
        const newAssetItem = {
          id: `asset-${lesson.id}-${Date.now()}`,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          title: `${docTypeLabel}: ${file.name.replace(/\.[^/.]+$/, '')}`,
          format: fmt,
          type: docTypeLabel,
          fileSize: uploaded.sizeFormatted,
          fileUrl: uploaded.publicUrl,
          fileName: uploaded.fileName || file.name,
          storagePath: uploaded.path,
          downloadsCount: 0,
        };

        await saveUploadedAssetToRepository(newAssetItem);

        const allLocal = getInitialLocalLessons();
        const found = allLocal.find((l) => l.id === lesson.id || l.code === lesson.code);
        const existingRealAssets = (found?.assets || []).filter((a) =>
          isRealUploadedFileUrl(a.fileUrl)
        );
        const updatedAssets = [newAssetItem, ...existingRealAssets];

        if (found) {
          await saveAdminLesson(
            found,
            updatedAssets,
            found.simulationIds || [],
            found.miniQuiz || lesson.miniQuiz || []
          );
        }

        setLesson((prev) => ({
          ...prev,
          assets: updatedAssets.map((a) => ({
            id: a.id,
            title: a.title,
            format: (a.format === 'pptx' || a.format === 'docx' ? a.format : 'pdf') as
              | 'pptx'
              | 'pdf'
              | 'docx',
            type: a.type,
            fileSize: a.fileSize,
            fileUrl: a.fileUrl,
            fileName: a.fileName,
          })),
        }));
        setDocRefreshKey((k) => k + 1);

        setDocUploadFeedback(
          `Đã tải tệp gốc "${file.name}" lên Kho bài giảng (${docTypeLabel})!`
        );
        setTimeout(() => setDocUploadFeedback(null), 4500);
      }
    } catch (err: any) {
      setDocUploadFeedback(err?.message || 'Không thể tải tệp lên.');
      setTimeout(() => setDocUploadFeedback(null), 4000);
    } finally {
      setIsUploadingAsset(false);
      e.target.value = '';
    }
  };

  // Combine lesson.miniQuiz + any bank questions assigned to lesson.id (with fallback to grade/domain if empty)
  const combinedMiniQuiz = useMemo(() => {
    const normalizeStemKey = (text: string) =>
      (text || '')
        .replace(/^\[(tự luận|trắc nghiệm|đúng\/sai)\]\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .slice(0, 90);

    const baseQuiz: LessonMiniQuizItem[] = [...(lesson.miniQuiz || [])];
    const seenStems = new Set(baseQuiz.map((q) => normalizeStemKey(q.question)));

    const pushBankQuestion = (bq: any) => {
      const key = normalizeStemKey(bq.question);
      if (!seenStems.has(key)) {
        seenStems.add(key);
        const mappedType: LessonReviewQuestionType =
          bq.questionType === 'true_false'
            ? 'true_false'
            : bq.questionType === 'essay' || bq.questionType === 'short_answer'
            ? 'essay'
            : 'single_choice';
        baseQuiz.push({
          id: bq.id,
          questionType: mappedType,
          question: bq.question,
          options:
            bq.options && bq.options.length >= 2
              ? bq.options.slice(0, 4)
              : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
          correctIndex:
            typeof bq.correctAnswer === 'number' && bq.correctAnswer >= 0
              ? bq.correctAnswer
              : 0,
          trueFalseStatements:
            mappedType === 'true_false'
              ? normalizeTrueFalseStatements(bq.trueFalseStatements, bq.options, 0)
              : undefined,
          sampleAnswer:
            mappedType === 'essay'
              ? bq.sampleAnswer || bq.shortAnswer || bq.explanation
              : undefined,
          rubric: bq.rubric,
          explanation: bq.explanation || 'Xem lại kiến thức trọng tâm trong bài học.',
        });
      }
    };

    try {
      const allBank = getAdminQuestionsSync();
      const lessonMatched = allBank.filter(
        (q) =>
          q.lessonId === lesson.id ||
          (lesson.code && q.lessonId?.toLowerCase() === lesson.code.toLowerCase())
      );
      lessonMatched.forEach(pushBankQuestion);

      // If a newly created custom lesson still has 0 review questions, fallback to same grade & domain
      if (baseQuiz.length === 0) {
        const gradeDomainMatched = allBank
          .filter((q) => q.grade === lesson.grade && q.domain === lesson.domain)
          .slice(0, 4);
        gradeDomainMatched.forEach(pushBankQuestion);
      }
    } catch {
      // ignore
    }
    return baseQuiz;
  }, [lesson.miniQuiz, lesson.id, lesson.code, lesson.grade, lesson.domain]);

  const currentVideo = videoPlaylist[activeVideoIndex] || videoPlaylist[0] || null;
  const currentYoutubeEmbed = currentVideo ? getYoutubeEmbedUrl(currentVideo.url) : null;

  const handleSaveQuickVideoUrl = async () => {
    const raw = quickVideoInput.trim();
    if (!raw) {
      await clearAdminLessonVideo(lesson.id);
      setLesson((prev) => ({
        ...prev,
        videoUrl: undefined,
      }));
      setDocRefreshKey((k) => k + 1);
      setIsEditingVideoUrl(false);
      setActiveVideoIndex(0);
      return;
    }

    const ytId = extractYouTubeId(raw);
    const normalizedUrl = ytId ? `https://www.youtube.com/watch?v=${ytId}` : raw || '';

    const allLocal = getInitialLocalLessons();
    const found = allLocal.find((l) => l.id === lesson.id || l.code === lesson.code);
    if (found) {
      await saveAdminLesson(
        {
          ...found,
          videoUrl: normalizedUrl,
        },
        found.assets || [],
        found.simulationIds || [],
        found.miniQuiz || lesson.miniQuiz || []
      );
    }
    setLesson((prev) => ({
      ...prev,
      videoUrl: normalizedUrl || undefined,
    }));
    setDocRefreshKey((k) => k + 1);
    setIsEditingVideoUrl(false);
    setActiveVideoIndex(0);
  };

  const handleClearLessonVideo = async () => {
    await clearAdminLessonVideo(lesson.id);
    setQuickVideoInput('');
    setLesson((prev) => ({
      ...prev,
      videoUrl: undefined,
    }));
    setDocRefreshKey((k) => k + 1);
    setIsEditingVideoUrl(false);
    setActiveVideoIndex(0);
  };

  const serializeSectionsToMarkdown = (targetLesson: Lesson): string => {
    return (targetLesson.sections || [])
      .map((s) => {
        const lines: string[] = [`### ${s.title}`];
        (s.content || []).forEach((p) => lines.push(p));
        if (s.formula) lines.push(`Công thức: ${s.formula}`);
        if (s.formulaMeaning) lines.push(`Giải thích: ${s.formulaMeaning}`);
        (s.keyPoints || []).forEach((kp) => lines.push(`Ý chính: ${kp}`));
        return lines.join('\n');
      })
      .join('\n\n');
  };

  const persistCoreContentMarkdown = async (markdownText: string, feedbackText: string) => {
    const allLocal = getInitialLocalLessons();
    const found = allLocal.find((l) => l.id === lesson.id || l.code === lesson.code);
    if (found) {
      await saveAdminLesson(
        {
          ...found,
          content: markdownText,
        },
        found.assets || [],
        found.simulationIds || [],
        found.miniQuiz || lesson.miniQuiz || []
      );
    }
    const refreshed = await getLessonByIdOrSlug(lesson.id);
    if (refreshed) {
      setLesson(refreshed);
    }
    setCoreContentFeedback(feedbackText);
    setTimeout(() => setCoreContentFeedback(null), 4000);
  };

  const handleApplyBoldToCoreTextarea = () => {
    const el = coreTextareaRef.current;
    if (!el) return;
    const { nextText, nextCursorStart, nextCursorEnd } = wrapSelectionWithBold(
      coreContentDraft,
      el.selectionStart ?? coreContentDraft.length,
      el.selectionEnd ?? coreContentDraft.length
    );
    setCoreContentDraft(nextText);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextCursorStart, nextCursorEnd);
    });
  };

  const handleHeaderBoldButtonClick = async () => {
    // 1. If the inline textarea editor is currently open, apply bold to the textarea selection
    if (isEditingCoreContent) {
      handleApplyBoldToCoreTextarea();
      return;
    }

    // 2. If user highlighted text directly inside the Core Knowledge section on the page, bold that text immediately!
    const selectionText = window.getSelection()?.toString().trim() || '';
    if (selectionText && selectionText.length >= 2 && selectionText.length <= 160) {
      const currentMd = serializeSectionsToMarkdown(lesson);
      if (currentMd.includes(selectionText) && !currentMd.includes(`**${selectionText}**`)) {
        const updatedMd = currentMd.replace(selectionText, `**${selectionText}**`);
        setCoreContentDraft(updatedMd);
        await persistCoreContentMarkdown(
          updatedMd,
          `Đã in đậm cụm từ "${selectionText.slice(0, 45)}${selectionText.length > 45 ? '...' : ''}"!`
        );
        window.getSelection()?.removeAllRanges();
        return;
      }
    }

    // 3. Otherwise open the inline editor with all subheadings bolded and focus the textarea
    const initialMd = autoBoldAllSubheadingsInText(serializeSectionsToMarkdown(lesson));
    setCoreContentDraft(initialMd);
    setIsEditingCoreContent(true);
    setTimeout(() => {
      coreTextareaRef.current?.focus();
    }, 50);
  };

  const resetQuizDraft = () => {
    setEditingQuizIdx(null);
    setDraftQuestionType('single_choice');
    setDraftQuestion('');
    setDraftOptions(['', '', '', '']);
    setDraftCorrectIdx(0);
    setDraftTrueFalseStatements(normalizeTrueFalseStatements());
    setDraftSampleAnswer('');
    setDraftExplanation('');
  };

  const persistMiniQuizList = (nextList: LessonMiniQuizItem[], feedback: string) => {
    updateLessonMiniQuizSync(lesson.id, nextList);
    setLesson((prev) => ({
      ...prev,
      miniQuiz: nextList,
      quizCount: nextList.length,
    }));
    setQuizFeedbackMsg(feedback);
    setTimeout(() => setQuizFeedbackMsg(null), 4000);
  };

  const handleSaveReviewQuestion = () => {
    if (!draftQuestion.trim()) return;
    const cleanOptions = draftOptions.map(
      (opt, i) => opt.trim() || `Phương án ${String.fromCharCode(65 + i)}`
    );

    const newItem: LessonMiniQuizItem = {
      id: `review-${Date.now()}`,
      questionType: draftQuestionType,
      question: draftQuestion.trim(),
      options: cleanOptions,
      correctIndex: draftCorrectIdx,
      trueFalseStatements:
        draftQuestionType === 'true_false'
          ? normalizeTrueFalseStatements(draftTrueFalseStatements, cleanOptions, draftCorrectIdx)
          : undefined,
      sampleAnswer:
        draftQuestionType === 'essay'
          ? draftSampleAnswer.trim() || draftExplanation.trim() || 'Học sinh trình bày lời giải chi tiết.'
          : undefined,
      explanation:
        draftExplanation.trim() ||
        (draftQuestionType === 'essay'
          ? draftSampleAnswer.trim() || 'Xem hướng dẫn giải chi tiết.'
          : draftQuestionType === 'true_false'
          ? `Đáp án Đúng/Sai: ${draftTrueFalseStatements
              .map((s) => `${s.label}) ${s.isTrue ? 'Đúng' : 'Sai'}`)
              .join(' • ')}`
          : `Đáp án đúng là ${String.fromCharCode(65 + draftCorrectIdx)}: ${cleanOptions[draftCorrectIdx]}.`),
    };

    const currentList = [...(lesson.miniQuiz || [])];
    if (editingQuizIdx !== null && editingQuizIdx >= 0 && editingQuizIdx < currentList.length) {
      currentList[editingQuizIdx] = newItem;
      persistMiniQuizList(currentList, `Đã cập nhật Câu ${editingQuizIdx + 1} thành công!`);
    } else {
      currentList.push(newItem);
      persistMiniQuizList(currentList, `Đã thêm Câu ${currentList.length} vào cuối bài giảng!`);
    }
    resetQuizDraft();
  };

  const handleEditReviewQuestion = (idx: number) => {
    const target = combinedMiniQuiz[idx];
    if (!target) return;
    setIsQuizEditorOpen(true);
    setEditingQuizIdx(idx);
    const qType: LessonReviewQuestionType = target.questionType || 'single_choice';
    setDraftQuestionType(qType);
    setDraftQuestion(target.question);
    const padded = [...(target.options || [])];
    while (padded.length < 4) padded.push('');
    setDraftOptions(padded.slice(0, 4));
    setDraftCorrectIdx(target.correctIndex >= 0 && target.correctIndex < 4 ? target.correctIndex : 0);
    setDraftTrueFalseStatements(
      normalizeTrueFalseStatements(target.trueFalseStatements, padded, target.correctIndex)
    );
    setDraftSampleAnswer(target.sampleAnswer || target.explanation || '');
    setDraftExplanation(target.explanation || '');
  };

  const handleDeleteReviewQuestion = (idx: number) => {
    const baseList = [...(lesson.miniQuiz || combinedMiniQuiz)];
    const nextList = baseList.filter((_, i) => i !== idx);
    persistMiniQuizList(nextList, 'Đã xóa câu hỏi ôn tập khỏi bài học.');
    if (editingQuizIdx === idx) resetQuizDraft();
  };

  const handleImportConvertedWordQuestions = (importedItems: LessonMiniQuizItem[]) => {
    if (!importedItems.length) return;
    const nextList = [...(lesson.miniQuiz || []), ...importedItems];
    const scCount = importedItems.filter(
      (i) => (i.questionType || 'single_choice') === 'single_choice'
    ).length;
    const tfCount = importedItems.filter((i) => i.questionType === 'true_false').length;
    const esCount = importedItems.filter((i) => i.questionType === 'essay').length;

    persistMiniQuizList(
      nextList,
      `Đã chuyển đổi và thêm ${importedItems.length} câu hỏi từ Word vào cuối bài (${scCount} Trắc nghiệm A–D, ${tfCount} Đúng/Sai, ${esCount} Tự luận)!`
    );
    setIsWordConverterOpen(false);
  };

  const handleSelectOption = (qIndex: number, optIndex: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSelectTrueFalse = (qIndex: number, label: string, val: boolean) => {
    if (showResults) return;
    setSelectedTrueFalse((prev) => ({
      ...prev,
      [qIndex]: {
        ...(prev[qIndex] || {}),
        [label]: val,
      },
    }));
  };

  const reviewEvaluation = useMemo(
    () =>
      evaluateLessonReviewQuiz(
        combinedMiniQuiz,
        selectedAnswers,
        selectedTrueFalse,
        essayAnswers
      ),
    [combinedMiniQuiz, selectedAnswers, selectedTrueFalse, essayAnswers]
  );

  const correctAnsweredCount = reviewEvaluation.correctCount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs
          items={[
            { label: `Lớp ${lesson.grade}`, to: `/lop-${lesson.grade}` },
            { label: domainInfo?.shortName || 'Chuyên đề', to: '/chuyen-de' },
            { label: lesson.title },
          ]}
        />

        {/* Top Lesson Banner Header with Visual Cover */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border-2 border-teal-100 dark:border-slate-800 shadow-md space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 font-mono font-extrabold text-xs border border-teal-200">
                  {lesson.code}
                </span>
                <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 font-bold text-xs">
                  Khối lớp {lesson.grade} • Phân môn {domainInfo?.shortName}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> {lesson.durationMinutes} phút học
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                {lesson.title}
              </h1>

              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                {renderFormattedMathAndChem(lesson.summary)}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleToggleCompleted}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition border cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 hover:border-teal-500'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>{isCompleted ? 'Đã hoàn thành bài học' : 'Đánh dấu hoàn thành bài học'}</span>
                </button>

                <span className="text-xs text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-teal-200">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>KHOA HỌC SỐ KHTN • Sách Kết nối tri thức với cuộc sống</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-4">
              <img
                src={lesson.thumbnailUrl || domainInfo?.image || HERO_LAB_IMAGE}
                alt={lesson.title}
                className="w-full h-52 object-cover rounded-2xl border-2 border-teal-100 shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Main Lesson Content & Embedded 3D Lab (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Learning Objectives Box */}
            <div className="bg-gradient-to-br from-teal-50/90 to-sky-50/70 dark:from-slate-900 dark:to-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-teal-200/80 dark:border-slate-800 space-y-4">
              <h2 className="text-base sm:text-lg font-extrabold text-teal-950 dark:text-teal-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span>Mục Tiêu Cần Đạt (Sách Kết nối tri thức với cuộc sống)</span>
              </h2>
              <ul className="space-y-2.5">
                {lesson.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="leading-relaxed font-medium">
                      {renderFormattedMathAndChem(obj)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Theory Sections with Visual Illustrations */}
            <div
              id="lesson-core-knowledge-section"
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-teal-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      Nội Dung Kiến Thức Trọng Tâm
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Trình bày chuẩn Sách giáo khoa Kết nối tri thức với cuộc sống • Đề mục nhỏ in đậm &amp; Công thức chuẩn
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="btn-bold-core-content"
                    onClick={handleHeaderBoldButtonClick}
                    title="Bôi đen văn bản bất kỳ rồi bấm In đậm (hoặc mở trình chỉnh sửa in đậm đề mục)"
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Bold className="w-3.5 h-3.5 stroke-[3]" />
                    <span>In đậm (B)</span>
                  </button>

                  <button
                    type="button"
                    data-testid="btn-edit-core-content"
                    onClick={() => {
                      if (!isEditingCoreContent) {
                        setCoreContentDraft(serializeSectionsToMarkdown(lesson));
                      }
                      setIsEditingCoreContent((v) => !v);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer ${
                      isEditingCoreContent
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-teal-50 dark:bg-slate-800 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-slate-700 hover:bg-teal-100'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingCoreContent ? 'Đóng khung sửa' : 'Sửa & Định dạng đề mục'}</span>
                  </button>
                </div>
              </div>

              {coreContentFeedback && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{coreContentFeedback}</span>
                </div>
              )}

              {/* Inline Core Knowledge Editor with Bold Button & Formatting Toolbar */}
              {isEditingCoreContent && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-teal-300 dark:border-teal-700 space-y-3 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-teal-900 dark:text-teal-300">
                      Thanh công cụ Định dạng &amp; In đậm Đề mục kiến thức trọng tâm:
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Mẹo: Bôi đen chữ trong ô rồi bấm <strong>B In đậm</strong> (hoặc nhấn <code>Ctrl + B</code>)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleApplyBoldToCoreTextarea}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer"
                      title="In đậm đoạn văn bản đang bôi đen (Ctrl+B)"
                    >
                      <Bold className="w-3.5 h-3.5 stroke-[3]" />
                      <span>B In đậm</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCoreContentDraft((prev) => autoBoldAllSubheadingsInText(prev))
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>In đậm tất cả đề mục nhỏ (a, b, c)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCoreContentDraft((prev) =>
                          `${prev}${prev ? '\n\n' : ''}### ${lesson.sections.length + 1}. Đề mục lớn mới\n`
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-teal-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      + Đề mục lớn (###)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCoreContentDraft((prev) =>
                          `${prev}${prev ? '\n' : ''}**a) Tên đề mục nhỏ in đậm:** Nội dung chi tiết...`
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-teal-50 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      + Đề mục nhỏ in đậm (a, b)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCoreContentDraft((prev) =>
                          `${prev}${prev ? '\n' : ''}Công thức: I = \\frac{U}{R}`
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                    >
                      + Hộp Công thức (\frac)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormulaTarget('core_content');
                        setFormulaModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sigma className="w-3.5 h-3.5" /> Chèn Công thức
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCoreContentDraft((prev) =>
                          autoBoldAllSubheadingsInText(formatChemicalAndScientificText(prev).text)
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs cursor-pointer"
                    >
                      Chuẩn hóa Công thức &amp; Đề mục
                    </button>
                  </div>

                  <textarea
                    ref={coreTextareaRef}
                    rows={10}
                    value={coreContentDraft}
                    onChange={(e) => setCoreContentDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                        e.preventDefault();
                        handleApplyBoldToCoreTextarea();
                      }
                    }}
                    placeholder="Sử dụng **...** để in đậm đề mục hoặc từ khóa quan trọng..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCoreContent(false)}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await persistCoreContentMarkdown(
                          coreContentDraft,
                          'Đã lưu nội dung kiến thức trọng tâm và định dạng in đậm!'
                        );
                        setIsEditingCoreContent(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu nội dung trọng tâm</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {lesson.sections.map((sec, idx) => {
                  const cleanTitle = sec.title.replace(/^\d+\.\s*/, '').trim();
                  const formulaItems = sec.formula
                    ? sec.formula
                        .split(/\s*\|\s*/)
                        .map((f) => f.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <section
                      key={idx}
                      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-b from-slate-50/70 to-white dark:from-slate-900/90 dark:to-slate-900 p-5 sm:p-6 shadow-xs space-y-4"
                    >
                      {/* Section Heading with Numbered Badge */}
                      <div className="flex items-start gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                        <span className="px-2.5 py-1 rounded-xl bg-teal-700 text-white font-mono font-black text-xs sm:text-sm shrink-0 shadow-xs mt-0.5">
                          Mục {idx + 1}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-teal-950 dark:text-teal-300 leading-snug">
                          {renderFormattedMathAndChem(cleanTitle || sec.title)}
                        </h3>
                      </div>

                      {/* Structured Paragraphs with Bold Subheadings & Bullet Points */}
                      <div className="space-y-3 text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed">
                        {sec.content.map((p, pIdx) => renderStructuredTheoryParagraph(p, pIdx))}
                      </div>

                      {/* Core Formula & Chemical Equation Callout Card */}
                      {formulaItems.length > 0 && (
                        <div className="rounded-2xl bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-teal-50/80 dark:from-indigo-950/40 dark:via-slate-900 dark:to-teal-950/40 border-2 border-indigo-200/80 dark:border-indigo-800/70 p-4 sm:p-5 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                            <Sigma className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>Công Thức &amp; Phương Trình Trọng Tâm</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            {formulaItems.map((fItem, fIdx) => (
                              <div
                                key={fIdx}
                                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-xs text-sm sm:text-base font-extrabold text-indigo-950 dark:text-indigo-200 tracking-wide"
                              >
                                {renderFormattedMathAndChem(fItem)}
                              </div>
                            ))}
                          </div>

                          {sec.formulaMeaning && (
                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-1 border-t border-indigo-200/60 dark:border-indigo-800/50">
                              <strong className="font-extrabold text-indigo-900 dark:text-indigo-300">
                                Giải thích kí hiệu &amp; Ý nghĩa:{' '}
                              </strong>
                              {renderFormattedMathAndChem(sec.formulaMeaning)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Key Points Summary Box inside Section */}
                      {sec.keyPoints && sec.keyPoints.length > 0 && (
                        <div className="rounded-2xl bg-emerald-50/75 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/70 p-4 sm:p-5 space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Ý Chính Cần Ghi Nhớ</span>
                          </div>
                          <ul className="space-y-2">
                            {sec.keyPoints.map((kp, kpIdx) => (
                              <li
                                key={kpIdx}
                                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
                              >
                                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                  {kpIdx + 1}
                                </span>
                                <div className="flex-1 font-medium">
                                  {renderFormattedMathAndChem(kp)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Visual Figure Illustration */}
                      {sec.imageUrl && (
                        <figure className="my-2 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                          <img
                            src={sec.imageUrl}
                            alt={sec.imageCaption || sec.title}
                            className="w-full max-h-72 object-cover"
                          />
                          {sec.imageCaption && (
                            <figcaption className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 text-center">
                              Hình minh họa: {renderFormattedMathAndChem(sec.imageCaption)}
                            </figcaption>
                          )}
                        </figure>
                      )}

                      {/* Highlight Note Box */}
                      {sec.highlightBox && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800 flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                              {renderFormattedMathAndChem(sec.highlightBox.title)}
                            </span>
                            <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 font-medium leading-relaxed">
                              {renderFormattedMathAndChem(sec.highlightBox.text)}
                            </p>
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>

            {/* Embedded 3D Interactive Lab (if available) */}
            {relatedSimulation && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Atom className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      Thực Hành KHOA HỌC SỐ KHTN 3D Ngay Trong Bài Học ({relatedSimulationsList.length} mô phỏng)
                    </h2>
                  </div>
                  <Link
                    to={`/mo-phong/${relatedSimulation.id}`}
                    className="text-xs font-extrabold text-teal-600 hover:underline flex items-center gap-1"
                  >
                    <span>Mở rộng toàn trang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {relatedSimulationsList.length > 1 && (
                  <div className="flex flex-wrap gap-2 p-2.5 rounded-2xl bg-teal-50/80 dark:bg-slate-900 border border-teal-200/80 dark:border-slate-800">
                    {relatedSimulationsList.map((simItem, idx) => (
                      <button
                        key={simItem.id}
                        type="button"
                        onClick={() => setActiveSimIndex(idx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                          activeSimIndex === idx
                            ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-100/70 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Atom className="w-3.5 h-3.5 shrink-0" />
                        <span>{idx + 1}. {simItem.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                <SimulationViewer key={relatedSimulation.id} simulation={relatedSimulation} />
              </div>
            )}

            {/* Uploaded HTML/JS Interactive Simulations from 3-Step Upload Wizard */}
            {uploadedSimulations.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Atom className="w-5 h-5 text-teal-600" />
                    <span>Mô Phỏng Tương Tác Đính Kèm ({uploadedSimulations.length})</span>
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 font-bold">
                    Chế độ Sandbox An toàn
                  </span>
                </div>
                <div className="space-y-4">
                  {uploadedSimulations.map((sim) => (
                    <div
                      key={sim.id}
                      className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950"
                    >
                      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{sim.title}</span>
                        <span className="text-[10px] text-teal-400 font-mono uppercase">
                          {sim.simulationType || 'HTML/JS'}
                        </span>
                      </div>
                      {sim.simulationHtml ? (
                        <iframe
                          title={sim.title}
                          sandbox="allow-scripts"
                          srcDoc={sim.simulationHtml}
                          className="w-full h-80 bg-slate-950"
                        />
                      ) : sim.externalUrl ? (
                        <iframe
                          title={sim.title}
                          sandbox="allow-scripts allow-same-origin"
                          src={sim.externalUrl}
                          className="w-full h-80 bg-slate-950"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Embedded Video Player (YouTube or Direct MP4/WebM) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-rose-500" />
                  <span>Video Bài Giảng & Thí Nghiệm Trực Quan</span>
                </h2>
                <div className="flex items-center gap-2">
                  {currentVideo && currentYoutubeEmbed && (
                    <a
                      href={`https://www.youtube.com/watch?v=${extractYouTubeId(currentVideo.url) || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1 hover:bg-rose-100 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mở trên YouTube</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setQuickVideoInput(lesson.videoUrl || '');
                      setIsEditingVideoUrl((v) => !v);
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 hover:bg-teal-50 hover:text-teal-700 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{currentVideo ? 'Đổi link Video' : '+ Nhúng link YouTube'}</span>
                  </button>
                  {currentVideo && (
                    <button
                      type="button"
                      onClick={handleClearLessonVideo}
                      className="text-xs px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 font-bold flex items-center gap-1 hover:bg-red-100 transition cursor-pointer"
                      title="Xóa liên kết video khỏi bài giảng này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Video</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick inline YouTube URL editor */}
              {isEditingVideoUrl && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-teal-200 dark:border-teal-800 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Dán liên kết Video YouTube (hoặc xóa trống rồi bấm Lưu để gỡ video):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={quickVideoInput}
                      onChange={(e) => setQuickVideoInput(e.target.value)}
                      placeholder="VD: https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <div className="flex items-center gap-2">
                      {quickVideoInput.trim() && (
                        <button
                          type="button"
                          onClick={handleClearLessonVideo}
                          className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa link</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsEditingVideoUrl(false)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveQuickVideoUrl}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-sm cursor-pointer"
                      >
                        {quickVideoInput.trim() ? 'Lưu & Phát Video' : 'Lưu (Gỡ Video)'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Playlist Tabs if multiple videos exist */}
              {videoPlaylist.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {videoPlaylist.map((vid, idx) => (
                    <button
                      key={vid.id}
                      type="button"
                      onClick={() => setActiveVideoIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        activeVideoIndex === idx
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50'
                      }`}
                    >
                      {idx + 1}. {vid.title}
                    </button>
                  ))}
                </div>
              )}

              {currentVideo ? (
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
                  {currentYoutubeEmbed ? (
                    <iframe
                      key={currentYoutubeEmbed}
                      src={currentYoutubeEmbed}
                      title={currentVideo.title || lesson.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      key={currentVideo.url}
                      src={currentVideo.url}
                      controls
                      className="w-full h-full object-contain bg-black"
                    >
                      Trình duyệt của bạn không hỗ trợ phát video trực tiếp.
                    </video>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <Video className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                    Bài học này chưa có video được gắn kết.
                  </p>
                  <p className="text-xs text-slate-400">
                    Bấm nút <strong>&quot;+ Nhúng link YouTube&quot;</strong> ở góc trên để thêm video bài giảng hoặc thí nghiệm.
                  </p>
                </div>
              )}
            </div>

            {/* Attached Lesson Assets (PPTX, PDF, Worksheets) */}
            <div
              id="lesson-documents-section"
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    <span>Giáo Án Điện Tử &amp; Phiếu Học Tập Kho Bài Giảng</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tải xuống trực tiếp <strong>tệp gốc (.pptx, .pdf, .docx) do giáo viên đã tải lên kho bài giảng</strong> (không tự sinh file bằng AI).
                  </p>
                </div>
              </div>

              {docUploadFeedback && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{docUploadFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {effectiveLessonAssets.map((asset) => {
                  const docData = createDocumentDataFromLessonAsset(asset, lesson);
                  const isDownloaded = downloadedAssetId === asset.id;
                  const hasRealFile = docData.hasTeacherFile;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setPreviewDocData(docData)}
                      className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition cursor-pointer group ${
                        hasRealFile
                          ? 'bg-slate-50 dark:bg-slate-800/80 border-teal-200 dark:border-teal-800/80 hover:border-teal-500 hover:shadow-md'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-dashed border-slate-200 dark:border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              docData.format === 'pptx'
                                ? 'bg-orange-100 text-orange-700'
                                : docData.format === 'docx'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {docData.format}
                          </span>
                          <span className="text-[11px] text-teal-700 dark:text-teal-300 font-bold">
                            {asset.type}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              hasRealFile
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                            }`}
                          >
                            {hasRealFile ? `Đã có file (${docData.fileSize})` : 'Chưa tải file lên kho'}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 group-hover:text-teal-600 transition truncate">
                          {hasRealFile ? docData.downloadFileName || asset.title : asset.title}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                          <Eye className="w-3 h-3" />{' '}
                          {hasRealFile
                            ? `Tệp gốc GV: ${docData.downloadFileName}`
                            : 'Bấm để tải tệp từ máy tính lên kho bài giảng'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDocData(docData);
                          }}
                          className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-teal-50 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700 text-xs font-extrabold flex items-center gap-1 transition cursor-pointer"
                          title="Xem thông tin tệp gốc trong kho"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Xem</span>
                        </button>

                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const ok = await triggerEducationalDocumentDownload(docData);
                            if (ok) {
                              setDownloadedAssetId(asset.id);
                              setTimeout(() => setDownloadedAssetId(null), 3000);
                            } else {
                              setPreviewDocData(docData);
                            }
                          }}
                          className={`px-3 py-2 rounded-xl text-white text-xs font-extrabold flex items-center gap-1 transition shadow-sm cursor-pointer ${
                            isDownloaded
                              ? 'bg-emerald-600'
                              : hasRealFile
                              ? 'bg-teal-600 hover:bg-teal-500'
                              : 'bg-amber-600 hover:bg-amber-500'
                          }`}
                          title={
                            hasRealFile
                              ? `Tải tệp gốc "${docData.downloadFileName}"`
                              : 'Giáo viên chưa tải tệp lên kho - Bấm để tải tệp lên'
                          }
                        >
                          {isDownloaded ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã tải</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Tải về</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* End-of-Lesson Review & Consolidation Questions (Câu hỏi ôn tập, củng cố kiến thức cuối bài) */}
            <div
              id="lesson-review-quiz-section"
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-teal-600" />
                    <span>Câu Hỏi Ôn Tập, Củng Cố Kiến Thức Cuối Bài</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Hỗ trợ đầy đủ 3 dạng câu hỏi chuẩn GDPT 2018:{' '}
                    <strong>Trắc nghiệm nhiều lựa chọn (A–D)</strong> •{' '}
                    <strong>Trắc nghiệm Đúng / Sai (a, b, c, d)</strong> •{' '}
                    <strong>Tự luận</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold">
                    {combinedMiniQuiz.length} câu hỏi
                  </span>
                </div>
              </div>

              {quizFeedbackMsg && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{quizFeedbackMsg}</span>
                </div>
              )}

              {/* Word-to-3-Question-Types Converter Tool */}
              {isWordConverterOpen && (
                <LessonWordReviewConverter
                  grade={lesson.grade}
                  domain={lesson.domain}
                  lessonTitle={lesson.title}
                  onImportQuestions={handleImportConvertedWordQuestions}
                  onClose={() => setIsWordConverterOpen(false)}
                />
              )}

              {/* Inline Teacher Editor for End-of-Lesson Review Questions (All 3 Types) */}
              {isQuizEditorOpen && (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-teal-200 dark:border-teal-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>
                        {editingQuizIdx !== null
                          ? `Chỉnh sửa Câu hỏi số ${editingQuizIdx + 1}`
                          : 'Soạn câu hỏi ôn tập cuối bài mới'}
                      </span>
                    </h3>

                    {/* 3 Question Type Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { id: 'single_choice', label: '1. Trắc nghiệm nhiều lựa chọn (A–D)' },
                          { id: 'true_false', label: '2. Trắc nghiệm Đúng / Sai (a,b,c,d)' },
                          { id: 'essay', label: '3. Dạng Tự luận' },
                        ] as const
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setDraftQuestionType(t.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                            draftQuestionType === t.id
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-400'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Nội dung câu hỏi <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormulaTarget('question');
                          setFormulaModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold flex items-center gap-1 hover:bg-teal-100 cursor-pointer"
                      >
                        <Sigma className="w-3 h-3" /> Chèn công thức / Hóa học
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={draftQuestion}
                      onChange={(e) => setDraftQuestion(e.target.value)}
                      placeholder="Nhập nội dung câu hỏi ôn tập cuối bài..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Type 1: Multiple Choice Options A, B, C, D */}
                  {draftQuestionType === 'single_choice' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                        4 phương án lựa chọn (Bấm chọn chữ cái A, B, C, D tương ứng với đáp án đúng):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[0, 1, 2, 3].map((optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isCorrect = draftCorrectIdx === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                                isCorrect
                                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setDraftCorrectIdx(optIdx)}
                                className={`w-7 h-7 rounded-lg font-extrabold text-xs flex items-center justify-center shrink-0 transition cursor-pointer ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-100'
                                }`}
                              >
                                {letter}
                              </button>
                              <input
                                type="text"
                                value={draftOptions[optIdx] || ''}
                                onChange={(e) => {
                                  const next = [...draftOptions];
                                  next[optIdx] = e.target.value;
                                  setDraftOptions(next);
                                }}
                                placeholder={`Nhập phương án ${letter}...`}
                                className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Type 2: True / False Statements a, b, c, d */}
                  {draftQuestionType === 'true_false' && (
                    <div className="space-y-2.5 p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                      <label className="block text-xs font-extrabold text-sky-900 dark:text-sky-200">
                        4 mệnh đề Đúng / Sai (a, b, c, d) — Chọn đáp án chuẩn Đúng hoặc Sai cho từng ý:
                      </label>
                      {draftTrueFalseStatements.map((stmt, sIdx) => (
                        <div key={stmt.id} className="flex items-center gap-2">
                          <span className="w-6 text-xs font-extrabold text-sky-700 dark:text-sky-300">
                            {stmt.label})
                          </span>
                          <input
                            type="text"
                            value={stmt.text}
                            onChange={(e) => {
                              const next = [...draftTrueFalseStatements];
                              next[sIdx] = { ...stmt, text: e.target.value };
                              setDraftTrueFalseStatements(next);
                            }}
                            placeholder={`Nhập nội dung mệnh đề ${stmt.label})...`}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...draftTrueFalseStatements];
                                next[sIdx] = { ...stmt, isTrue: true };
                                setDraftTrueFalseStatements(next);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                                stmt.isTrue === true
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200'
                              }`}
                            >
                              Đúng
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...draftTrueFalseStatements];
                                next[sIdx] = { ...stmt, isTrue: false };
                                setDraftTrueFalseStatements(next);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold cursor-pointer ${
                                stmt.isTrue === false
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 border border-slate-200'
                              }`}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Type 3: Essay Sample Answer */}
                  {draftQuestionType === 'essay' && (
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                      <label className="block text-xs font-extrabold text-violet-900 dark:text-violet-200">
                        Đáp án mẫu &amp; Hướng dẫn chấm Tự luận:
                      </label>
                      <textarea
                        rows={3}
                        value={draftSampleAnswer}
                        onChange={(e) => setDraftSampleAnswer(e.target.value)}
                        placeholder="Nhập lời giải chi tiết, phương trình phản ứng hoặc thang điểm chấm tự luận..."
                        className="w-full px-3 py-2 rounded-xl border border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Giải thích ngắn gọn / Trọng tâm kiến thức
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormulaTarget('explanation');
                          setFormulaModalOpen(true);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-slate-300 cursor-pointer"
                      >
                        <Sigma className="w-3 h-3" /> Chèn công thức
                      </button>
                    </div>
                    <input
                      type="text"
                      value={draftExplanation}
                      onChange={(e) => setDraftExplanation(e.target.value)}
                      placeholder="Nhập lời giải ngắn gọn hiển thị khi học sinh kiểm tra đáp án..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    {editingQuizIdx !== null && (
                      <button
                        type="button"
                        onClick={resetQuizDraft}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                      >
                        Hủy sửa
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveReviewQuestion}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {editingQuizIdx !== null
                          ? `Lưu cập nhật Câu ${editingQuizIdx + 1}`
                          : 'Lưu câu hỏi vào cuối bài'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {combinedMiniQuiz.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                    Chưa có câu hỏi ôn tập cuối bài cho bài giảng này.
                  </p>
                  <p className="text-xs text-slate-400">
                    Giáo viên có thể cập nhật câu hỏi ôn tập cuối bài trong trang Quản trị (/quan-tri).
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {combinedMiniQuiz.map((q, qIdx) => {
                    const qType: LessonReviewQuestionType = q.questionType || 'single_choice';
                    const userSelected = selectedAnswers[qIdx];
                    const userTfMap = selectedTrueFalse[qIdx] || {};
                    const userEssayText = essayAnswers[qIdx] || '';

                    return (
                      <div
                        key={q.id || qIdx}
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-3.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-teal-600 text-white text-xs font-extrabold">
                                Câu {qIdx + 1}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold border ${
                                  qType === 'true_false'
                                    ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/70 dark:text-sky-300'
                                    : qType === 'essay'
                                    ? 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/70 dark:text-violet-300'
                                    : 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300'
                                }`}
                              >
                                {qType === 'true_false'
                                  ? 'Trắc nghiệm Đúng / Sai'
                                  : qType === 'essay'
                                  ? 'Tự luận'
                                  : 'Trắc nghiệm nhiều lựa chọn'}
                              </span>
                            </div>

                            <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-relaxed">
                              {renderFormattedMathAndChem(q.question)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditReviewQuestion(qIdx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-700 transition"
                              title="Sửa câu hỏi này"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReviewQuestion(qIdx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 transition"
                              title="Xóa câu hỏi này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* DẠNG 1: TRẮC NGHIỆM NHIỀU LỰA CHỌN (A, B, C, D) */}
                        {qType === 'single_choice' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = userSelected === optIdx;
                              const isCorrect = q.correctIndex === optIdx;

                              let btnStyle =
                                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-teal-400';
                              if (showResults) {
                                if (isCorrect) {
                                  btnStyle =
                                    'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                                } else if (isSelected && !isCorrect) {
                                  btnStyle =
                                    'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-800 dark:text-rose-200';
                                }
                              } else if (isSelected) {
                                btnStyle =
                                  'bg-teal-50 dark:bg-teal-950/60 border-teal-600 text-teal-900 dark:text-teal-200 font-bold';
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectOption(qIdx, optIdx)}
                                  className={`text-left px-4 py-3 rounded-xl border text-xs sm:text-sm transition cursor-pointer ${btnStyle}`}
                                >
                                  <span className="font-extrabold mr-1.5">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  {renderFormattedMathAndChem(opt)}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* DẠNG 2: TRẮC NGHIỆM ĐÚNG / SAI (a, b, c, d) */}
                        {qType === 'true_false' && (
                          <div className="space-y-2">
                            {normalizeTrueFalseStatements(
                              q.trueFalseStatements,
                              q.options,
                              q.correctIndex
                            ).map((stmt) => {
                              const chosenVal = userTfMap[stmt.label];
                              const expectedVal = stmt.isTrue !== false;
                              const isMatched =
                                chosenVal !== undefined && chosenVal === expectedVal;

                              return (
                                <div
                                  key={stmt.id}
                                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                    showResults
                                      ? isMatched
                                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400'
                                        : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
                                    <span className="font-extrabold text-sky-700 dark:text-sky-400 mr-1.5">
                                      {stmt.label})
                                    </span>
                                    {renderFormattedMathAndChem(stmt.text)}
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                    <button
                                      type="button"
                                      onClick={() => handleSelectTrueFalse(qIdx, stmt.label, true)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                                        chosenVal === true
                                          ? 'bg-emerald-600 text-white border-emerald-600'
                                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                                      }`}
                                    >
                                      Đúng
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectTrueFalse(qIdx, stmt.label, false)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                                        chosenVal === false
                                          ? 'bg-rose-600 text-white border-rose-600'
                                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'
                                      }`}
                                    >
                                      Sai
                                    </button>
                                    {showResults && (
                                      <span
                                        className={`ml-1 text-[11px] font-extrabold px-2 py-0.5 rounded ${
                                          expectedVal
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        ĐA: {expectedVal ? 'Đúng' : 'Sai'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* DẠNG 3: TỰ LUẬN */}
                        {qType === 'essay' && (
                          <div className="space-y-2">
                            <textarea
                              rows={3}
                              value={userEssayText}
                              onChange={(e) =>
                                setEssayAnswers((prev) => ({ ...prev, [qIdx]: e.target.value }))
                              }
                              placeholder="Trình bày lời giải tự luận, viết phương trình hóa học hoặc các bước tính toán tại đây..."
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                          </div>
                        )}

                        {/* Kết quả & Lời giải khi bấm Kiểm tra đáp án */}
                        {showResults && (
                          <div className="p-3.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 mt-2 space-y-1">
                            {qType === 'single_choice' && (
                              <div>
                                <strong>
                                  Đáp án đúng: {String.fromCharCode(65 + q.correctIndex)}.
                                </strong>{' '}
                                {renderFormattedMathAndChem(q.explanation)}
                              </div>
                            )}
                            {qType === 'true_false' && (
                              <div>
                                <strong>Giải thích Đúng / Sai:</strong>{' '}
                                {renderFormattedMathAndChem(q.explanation)}
                              </div>
                            )}
                            {qType === 'essay' && (
                              <div className="space-y-1">
                                <strong className="block text-violet-900 dark:text-violet-300">
                                  Đáp án mẫu &amp; Hướng dẫn giải Tự luận:
                                </strong>
                                <div className="whitespace-pre-line leading-relaxed">
                                  {renderFormattedMathAndChem(q.sampleAnswer || q.explanation)}
                                </div>
                                {q.rubric && (
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-teal-200/60">
                                    <strong>Biểu điểm:</strong> {renderFormattedMathAndChem(q.rubric)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {combinedMiniQuiz.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowResults(true)}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
                    >
                      Kiểm tra đáp án
                    </button>
                    {showResults && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAnswers({});
                          setSelectedTrueFalse({});
                          setEssayAnswers({});
                          setShowResults(false);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Làm lại</span>
                      </button>
                    )}
                  </div>

                  {showResults && (
                    <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
                      Kết quả ôn tập: Hoàn thành đúng {correctAnsweredCount} / {combinedMiniQuiz.length} câu
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Key Takeaways, Formulas & Related Lessons (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Key Takeaways Summary Card */}
            <div className="bg-gradient-to-br from-sky-900 via-indigo-950 to-teal-950 text-white rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-teal-300 font-extrabold text-sm uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Ghi nhớ cốt lõi sau bài học</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                {lesson.keyTakeaways.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 pb-2.5 border-b border-white/10 last:border-none last:pb-0"
                  >
                    <span className="text-amber-300 font-extrabold font-mono">0{index + 1}.</span>
                    <span className="leading-relaxed">{renderFormattedMathAndChem(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Formulas Card */}
            {(() => {
              const sidebarFormulas =
                lesson.keyFormulas && lesson.keyFormulas.length > 0
                  ? lesson.keyFormulas
                  : lesson.sections.flatMap((s) =>
                      s.formula
                        ? s.formula
                            .split(/\s*\|\s*/)
                            .map((f) => f.trim())
                            .filter(Boolean)
                        : []
                    );
              if (sidebarFormulas.length === 0) return null;
              return (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Sigma className="w-4 h-4 text-teal-600" />
                    <span>Công thức &amp; Phương trình cần nhớ</span>
                  </h3>
                  <div className="space-y-2">
                    {sidebarFormulas.map((f, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-teal-50/70 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 text-xs sm:text-sm font-bold text-teal-950 dark:text-teal-300 text-center"
                      >
                        {renderFormattedMathAndChem(f)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Quick Links to Resources */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Tài nguyên bổ trợ bài học
              </h3>
              <Link
                to={`/luyen-tap?lessonId=${lesson.id}`}
                className="flex items-center justify-between p-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition text-xs font-extrabold shadow-md"
              >
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-300" />
                  Vào phòng luyện tập & kiểm tra bài này
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  const targetAsset =
                    effectiveLessonAssets.find((a) =>
                      a.type?.toLowerCase().includes('phiếu học tập')
                    ) || effectiveLessonAssets[0];
                  if (targetAsset) {
                    setPreviewDocData(createDocumentDataFromLessonAsset(targetAsset, lesson));
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 transition text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Xem &amp; Tải Phiếu học tập, Giáo án điện tử
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Related Lessons */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Bài học cùng khối Lớp {lesson.grade}
              </h3>
              <div className="space-y-3">
                {relatedLessons.map((rl) => (
                  <Link
                    key={rl.id}
                    to={`/bai-hoc/${rl.id}`}
                    className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 transition space-y-1"
                  >
                    <span className="text-[10px] font-mono font-bold text-teal-600">
                      {rl.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                      {rl.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DocumentViewerModal
        docData={previewDocData}
        onClose={() => setPreviewDocData(null)}
        onUploadedSuccess={() => {
          setDocRefreshKey((k) => k + 1);
          if (lessonId) {
            getLessonByIdOrSlug(lessonId).then((found) => {
              if (found) setLesson(found);
            });
          }
        }}
      />

      <FormulaEditorModal
        isOpen={formulaModalOpen}
        onClose={() => setFormulaModalOpen(false)}
        onInsertFormula={(formulaText: string) => {
          if (formulaTarget === 'question') {
            setDraftQuestion((prev) => `${prev}${prev ? ' ' : ''}${formulaText}`);
          } else if (formulaTarget === 'core_content') {
            setCoreContentDraft((prev) => `${prev}${prev ? '\n' : ''}${formulaText}`);
          } else {
            setDraftExplanation((prev) => `${prev}${prev ? ' ' : ''}${formulaText}`);
          }
          setFormulaModalOpen(false);
        }}
      />
    </div>
  );
};

