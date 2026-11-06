import React, { useState, useEffect } from 'react';
import {
  MaterialSubject,
  MaterialGrade,
  TextbookSeries,
  MaterialUploadCategory,
  MaterialPublishStatus,
  DocumentSubCategory,
  WizardStep1Data,
  WizardStep2Data,
  UnifiedLearningResource,
  SUBJECT_LABELS,
  TEXTBOOK_LABELS,
  CATEGORY_LABELS,
  inferDocumentSubCategory,
  getTopicsForSubjectAndGrade,
  getLessonsForTopic,
  createInlineTopicForGrade,
  createInlineLessonForTopic,
  renameInlineLesson,
  validateMaterialFileOrSource,
  validateSimulationHtmlSafety,
  formatFileSize,
  extractYoutubeEmbedUrl,
  saveUnifiedLearningResource,
  getUnifiedResourcesSync,
  updateUnifiedResourceTitle,
  moveUnifiedResourceToLesson,
  replaceUnifiedResourceFile,
  toggleUnifiedResourceStatus,
  deleteUnifiedResource,
  filterUnifiedResources,
  saveWizardAutoDraft,
  loadWizardAutoDraft,
  clearWizardAutoDraft,
} from '../../utils/materialUploadEngine.ts';
import { saveTeacherFileToRepo } from '../../services/localFileStore.ts';
import {
  buildEducationalDocumentData,
  triggerEducationalDocumentDownload,
} from '../../utils/documentGenerator.ts';
import {
  X,
  Upload,
  FileText,
  Video,
  Atom,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  Save,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Copy,
  RefreshCw,
  FolderTree,
  Search,
  Check,
  ExternalLink,
  EyeOff,
  ArrowRightLeft,
  Download,
} from 'lucide-react';

interface UnifiedMaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'wizard' | 'manager';
  onSavedResource?: (resource: UnifiedLearningResource) => void;
}

export const UnifiedMaterialUploadModal: React.FC<UnifiedMaterialUploadModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'wizard',
  onSavedResource,
}) => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'manager'>(initialTab);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1 State
  const [step1, setStep1] = useState<WizardStep1Data>(() => {
    const saved = loadWizardAutoDraft();
    if (saved?.step1) return saved.step1;
    const initialTopics = getTopicsForSubjectAndGrade('khtn', 8);
    const firstTopic = initialTopics[0];
    const initialLessons = firstTopic ? getLessonsForTopic(firstTopic.id, 8, 'khtn') : [];
    const firstLesson = initialLessons[0];
    return {
      subject: 'khtn',
      grade: 8,
      textbook: 'ket-noi-tri-thuc',
      topicId: firstTopic?.id || '',
      topicTitle: firstTopic?.title || '',
      lessonId: firstLesson?.id || '',
      lessonTitle: firstLesson?.title || '',
    };
  });

  // Step 2 State
  const [step2, setStep2] = useState<WizardStep2Data>(() => {
    const saved = loadWizardAutoDraft();
    if (saved?.step2) return saved.step2;
    return {
      category: 'lecture_doc',
      title: '',
      description: '',
      fileName: '',
      fileType: '',
      fileSize: 0,
      uploadProgress: 0,
      uploadStatus: 'idle',
      videoSourceType: 'youtube',
      simulationType: 'html_js',
    };
  });

  // Inline creation / rename states in Step 1
  const [lessonSearchQuery, setLessonSearchQuery] = useState('');
  const [isCreatingNewLesson, setIsCreatingNewLesson] = useState(false);
  const [newLessonInput, setNewLessonInput] = useState('');
  const [isRenamingLesson, setIsRenamingLesson] = useState(false);
  const [renameLessonInput, setRenameLessonInput] = useState('');
  const [isCreatingNewTopic, setIsCreatingNewTopic] = useState(false);
  const [newTopicInput, setNewTopicInput] = useState('');

  // Status & Validation messages
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardToast, setWizardToast] = useState<string | null>(null);

  // Post-Upload Resource Manager State
  const [resources, setResources] = useState<UnifiedLearningResource[]>(() =>
    getUnifiedResourcesSync()
  );
  const [filterSubject, setFilterSubject] = useState<MaterialSubject | 'all'>('all');
  const [filterGrade, setFilterGrade] = useState<MaterialGrade | 'all'>('all');
  const [filterTopicId, setFilterTopicId] = useState<string>('all');
  const [filterLessonId, setFilterLessonId] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<MaterialUploadCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<MaterialPublishStatus | 'all'>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

  // Resource Manager action states
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');
  const [movingResourceId, setMovingResourceId] = useState<string | null>(null);
  const [moveTargetTopicId, setMoveTargetTopicId] = useState<string>('');
  const [moveTargetLessonId, setMoveTargetLessonId] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewResource, setPreviewResource] = useState<UnifiedLearningResource | null>(null);

  // Dynamic lists for Step 1
  const availableTopics = getTopicsForSubjectAndGrade(step1.subject, step1.grade);
  const availableLessons = getLessonsForTopic(
    step1.topicId,
    step1.grade,
    step1.subject,
    lessonSearchQuery
  );

  // Keep auto-draft saved whenever Step 1 or Step 2 changes
  useEffect(() => {
    saveWizardAutoDraft({ step: currentStep, step1, step2 });
  }, [currentStep, step1, step2]);

  useEffect(() => {
    if (isOpen) {
      setResources(getUnifiedResourcesSync());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Linked Selector Handlers (Step 1)
  const handleSubjectOrGradeChange = (newSubject: MaterialSubject, newGrade: MaterialGrade) => {
    const topics = getTopicsForSubjectAndGrade(newSubject, newGrade);
    const firstTopic = topics[0];
    const lessons = firstTopic ? getLessonsForTopic(firstTopic.id, newGrade, newSubject) : [];
    const firstLesson = lessons[0];
    setStep1((prev) => ({
      ...prev,
      subject: newSubject,
      grade: newGrade,
      topicId: firstTopic?.id || '',
      topicTitle: firstTopic?.title || '',
      lessonId: firstLesson?.id || '',
      lessonTitle: firstLesson?.title || '',
    }));
    setWizardError(null);
  };

  const handleTopicChange = (newTopicId: string) => {
    const foundTopic = availableTopics.find((t) => t.id === newTopicId);
    const lessons = getLessonsForTopic(newTopicId, step1.grade, step1.subject);
    const firstLesson = lessons[0];
    setStep1((prev) => ({
      ...prev,
      topicId: newTopicId,
      topicTitle: foundTopic?.title || '',
      lessonId: firstLesson?.id || '',
      lessonTitle: firstLesson?.title || '',
    }));
    setWizardError(null);
  };

  const handleLessonChange = (newLessonId: string) => {
    const foundLesson = availableLessons.find((l) => l.id === newLessonId);
    setStep1((prev) => ({
      ...prev,
      lessonId: newLessonId,
      lessonTitle: foundLesson?.title || '',
    }));
    setWizardError(null);
  };

  const handleCreateNewTopicInline = () => {
    if (!newTopicInput.trim()) return;
    const created = createInlineTopicForGrade(step1.subject, step1.grade, newTopicInput);
    const lessons = getLessonsForTopic(created.id, step1.grade, step1.subject);
    setStep1((prev) => ({
      ...prev,
      topicId: created.id,
      topicTitle: created.title,
      lessonId: lessons[0]?.id || '',
      lessonTitle: lessons[0]?.title || '',
    }));
    setNewTopicInput('');
    setIsCreatingNewTopic(false);
    setWizardToast(`Đã tạo chương/chủ đề mới: "${created.title}"`);
  };

  const handleCreateNewLessonInline = () => {
    if (!newLessonInput.trim() || !step1.topicId) return;
    const created = createInlineLessonForTopic(step1.topicId, step1.grade, newLessonInput);
    setStep1((prev) => ({
      ...prev,
      lessonId: created.id,
      lessonTitle: created.title,
    }));
    setNewLessonInput('');
    setIsCreatingNewLesson(false);
    setWizardToast(`Đã tạo bài học mới: "${created.title}"`);
  };

  const handleRenameCurrentLessonInline = () => {
    if (!renameLessonInput.trim() || !step1.lessonId) return;
    const updated = renameInlineLesson(step1.lessonId, renameLessonInput);
    if (updated) {
      setStep1((prev) => ({
        ...prev,
        lessonTitle: updated.title,
      }));
      setWizardToast(`Đã đổi tên bài học thành: "${updated.title}"`);
    }
    setRenameLessonInput('');
    setIsRenamingLesson(false);
  };

  // File Upload Handler (Step 2)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
    e.target.value = '';
  };

  const processUploadedFile = (file: File) => {
    setWizardError(null);
    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
    const inferredSubType = inferDocumentSubCategory(baseName, file.name);

    setStep2((prev) => ({
      ...prev,
      title: prev.title.trim() || baseName,
      docSubType: prev.docSubType || inferredSubType,
      fileName: file.name,
      fileType: file.type || file.name.split('.').pop() || 'file',
      fileSize: file.size,
      uploadProgress: 35,
      uploadStatus: 'uploading',
    }));

    const isHtmlFile = /\.html?$/i.test(file.name);
    if (step2.category === 'simulation' && isHtmlFile) {
      const textReader = new FileReader();
      textReader.onload = () => {
        const htmlText = typeof textReader.result === 'string' ? textReader.result : '';
        setStep2((prev) => ({
          ...prev,
          simulationHtml: htmlText,
          uploadProgress: 100,
          uploadStatus: 'ready',
        }));
      };
      textReader.readAsText(file, 'utf-8');
      return;
    }

    // For files > 300KB, store binary directly in IndexedDB to avoid 5MB localStorage QuotaExceededError
    if (file.size > 300 * 1024) {
      saveTeacherFileToRepo(file)
        .then((saved) => {
          setStep2((prev) => ({
            ...prev,
            fileDataUrl: saved.fileUrl,
            uploadProgress: 100,
            uploadStatus: 'ready',
          }));
        })
        .catch(() => {
          setStep2((prev) => ({
            ...prev,
            uploadProgress: 0,
            uploadStatus: 'error',
            errorMessage: 'Không thể lưu tệp vào kho lưu trữ.',
          }));
        });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      saveTeacherFileToRepo(file).catch(() => {});
      setStep2((prev) => ({
        ...prev,
        fileDataUrl: resultStr,
        uploadProgress: 100,
        uploadStatus: 'ready',
      }));
    };
    reader.onerror = () => {
      saveTeacherFileToRepo(file)
        .then((saved) => {
          setStep2((prev) => ({
            ...prev,
            fileDataUrl: saved.fileUrl,
            uploadProgress: 100,
            uploadStatus: 'ready',
          }));
        })
        .catch(() => {
          setStep2((prev) => ({
            ...prev,
            uploadProgress: 0,
            uploadStatus: 'error',
            errorMessage: 'Không thể đọc tệp đã chọn.',
          }));
        });
    };
    reader.readAsDataURL(file);
  };

  // Step Navigation
  const handleNextStep = () => {
    setWizardError(null);
    if (currentStep === 1) {
      if (!step1.topicId || !step1.lessonId) {
        setWizardError('Vui lòng chọn đầy đủ Chương/chủ đề và Tên bài học trước khi tiếp tục.');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const validation = validateMaterialFileOrSource(step2);
      if (!validation.valid) {
        setWizardError(validation.error || 'Dữ liệu học liệu chưa hợp lệ.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setWizardError(null);
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  // Publish or Save Draft (Step 3)
  const handleSaveMaterial = (status: MaterialPublishStatus) => {
    setWizardError(null);
    const validation = validateMaterialFileOrSource(step2);
    if (!validation.valid) {
      setWizardError(validation.error || 'Dữ liệu học liệu chưa hợp lệ.');
      return;
    }

    const saved = saveUnifiedLearningResource(step1, step2, status);
    const updatedList = getUnifiedResourcesSync();
    setResources(updatedList);
    clearWizardAutoDraft();

    if (onSavedResource) {
      onSavedResource(saved);
    }

    setWizardToast(
      status === 'published'
        ? `Đã xuất bản học liệu "${saved.title}" vào "${saved.lessonTitle}"!`
        : `Đã lưu bản nháp học liệu "${saved.title}"!`
    );
    setActiveTab('manager');
  };

  // Post-Upload Manager Handlers
  const handleConfirmRenameResource = (resourceId: string) => {
    if (!editingTitleValue.trim()) return;
    const updated = updateUnifiedResourceTitle(resourceId, editingTitleValue);
    setResources(updated);
    setEditingResourceId(null);
    setEditingTitleValue('');
    setWizardToast('Đã cập nhật tên học liệu.');
  };

  const handleConfirmMoveResource = (resource: UnifiedLearningResource) => {
    if (!moveTargetTopicId || !moveTargetLessonId) return;
    const topics = getTopicsForSubjectAndGrade(resource.subject, resource.grade);
    const targetTopic = topics.find((t) => t.id === moveTargetTopicId);
    const lessons = getLessonsForTopic(moveTargetTopicId, resource.grade, resource.subject);
    const targetLesson = lessons.find((l) => l.id === moveTargetLessonId);
    if (!targetTopic || !targetLesson) return;

    const updated = moveUnifiedResourceToLesson(
      resource.id,
      targetTopic.id,
      targetTopic.title,
      targetLesson.id,
      targetLesson.title
    );
    setResources(updated);
    setMovingResourceId(null);
    setWizardToast(`Đã chuyển học liệu sang bài "${targetLesson.title}".`);
  };

  const handleReplaceFileInManager = (
    resourceId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) {
      saveTeacherFileToRepo(file).then((saved) => {
        const updated = replaceUnifiedResourceFile(resourceId, {
          fileName: file.name,
          fileType: file.type || file.name.split('.').pop() || 'file',
          fileSize: file.size,
          fileDataUrl: saved.fileUrl,
        });
        setResources(updated);
        setWizardToast(`Đã thay thế tệp gốc mới "${file.name}".`);
      });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      saveTeacherFileToRepo(file).catch(() => {});
      const updated = replaceUnifiedResourceFile(resourceId, {
        fileName: file.name,
        fileType: file.type || file.name.split('.').pop() || 'file',
        fileSize: file.size,
        fileDataUrl: dataUrl,
      });
      setResources(updated);
      setWizardToast(`Đã thay thế tệp mới "${file.name}".`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleStatusInManager = (resourceId: string) => {
    const updated = toggleUnifiedResourceStatus(resourceId);
    setResources(updated);
    setWizardToast('Đã cập nhật trạng thái hiển thị của học liệu.');
  };

  const handleDeleteInManager = (resourceId: string) => {
    const updated = deleteUnifiedResource(resourceId);
    setResources(updated);
    setConfirmDeleteId(null);
    setWizardToast('Đã xóa học liệu khỏi hệ thống.');
  };

  const handleCopyLink = (res: UnifiedLearningResource) => {
    const link =
      res.externalUrl ||
      `${window.location.origin}/bai-giang?grade=${res.grade}&lesson=${res.lessonId}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setWizardToast(`Đã sao chép liên kết học liệu: ${res.title}`);
  };

  // Filtered resources for Manager
  const filteredResources = filterUnifiedResources(resources, {
    subject: filterSubject,
    grade: filterGrade,
    topicId: filterTopicId,
    lessonId: filterLessonId,
    category: filterCategory,
    status: filterStatus,
    searchQuery: filterSearch,
  });

  // Group filtered resources by Lesson (`Môn học → Lớp → Chương → Bài học → 3 nhóm Tài nguyên`)
  const groupedByLesson = filteredResources.reduce<
    Record<
      string,
      {
        lessonKey: string;
        subject: MaterialSubject;
        grade: MaterialGrade;
        textbook: TextbookSeries;
        topicTitle: string;
        lessonTitle: string;
        items: UnifiedLearningResource[];
      }
    >
  >((acc, item) => {
    const key = `${item.subject}_${item.grade}_${item.topicId}_${item.lessonId}`;
    if (!acc[key]) {
      acc[key] = {
        lessonKey: key,
        subject: item.subject,
        grade: item.grade,
        textbook: item.textbook,
        topicTitle: item.topicTitle,
        lessonTitle: item.lessonTitle,
        items: [],
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  // Render Live Preview for Step 3 or Manager Preview Modal
  const renderResourcePreviewContent = (data: {
    category: MaterialUploadCategory;
    title: string;
    fileName?: string;
    fileType?: string;
    fileDataUrl?: string;
    externalUrl?: string;
    videoSourceType?: 'upload_file' | 'youtube' | 'external_url';
    simulationType?: string;
    simulationHtml?: string;
  }) => {
    if (data.category === 'lecture_doc') {
      const isPdf =
        data.fileName?.toLowerCase().endsWith('.pdf') ||
        data.fileType?.toLowerCase().includes('pdf');
      if (isPdf && data.fileDataUrl) {
        return (
          <iframe
            title={`Xem trước PDF ${data.title}`}
            src={data.fileDataUrl}
            className="w-full h-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
          />
        );
      }
      return (
        <div
          data-testid="pptx-docx-fallback-preview"
          className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-2"
        >
          <FileText className="w-10 h-10 text-amber-600 mx-auto" />
          <h5 className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
            Tệp tài liệu / Bài giảng: {data.fileName || data.title}
          </h5>
          <p className="text-xs text-amber-800 dark:text-amber-300 max-w-xl mx-auto">
            Trình duyệt không hỗ trợ xem trực tiếp tệp PowerPoint/Word (.ppt, .pptx, .doc, .docx) cục bộ. Sau khi xuất bản, giáo viên và học sinh có thể tải xuống hoặc mở trực tiếp tệp học liệu này.
          </p>
        </div>
      );
    }

    if (data.category === 'video') {
      if (data.videoSourceType === 'upload_file' && data.fileDataUrl) {
        return (
          <video
            controls
            src={data.fileDataUrl}
            className="w-full max-h-72 rounded-xl bg-black border border-slate-800"
          />
        );
      }
      const ytEmbed = extractYoutubeEmbedUrl(data.externalUrl || '');
      if (ytEmbed) {
        return (
          <iframe
            title={`Video ${data.title}`}
            src={ytEmbed}
            className="w-full h-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
      return (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-between">
          <span>Nguồn phát Video ngoài: {data.externalUrl}</span>
          {data.externalUrl && (
            <a
              href={data.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-teal-600 hover:underline flex items-center gap-1"
            >
              <span>Mở liên kết</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      );
    }

    if (data.category === 'simulation') {
      const safety = data.simulationHtml
        ? validateSimulationHtmlSafety(data.simulationHtml)
        : { sanitizedHtml: '' };

      if (safety.sanitizedHtml) {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-300">
              <span>Khung chạy mô phỏng cô lập an toàn (iframe sandbox="allow-scripts"):</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Đã bật Sandbox bảo mật
              </span>
            </div>
            <iframe
              title={`Mô phỏng ${data.title}`}
              data-testid="simulation-sandbox-iframe"
              sandbox="allow-scripts"
              srcDoc={safety.sanitizedHtml}
              className="w-full h-72 rounded-xl border-2 border-teal-500/40 bg-slate-950"
            />
          </div>
        );
      }

      if (data.externalUrl) {
        return (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
              Mô phỏng nhúng qua liên kết (iframe sandbox="allow-scripts"):
            </div>
            <iframe
              title={`Mô phỏng ${data.title}`}
              data-testid="simulation-sandbox-iframe"
              sandbox="allow-scripts"
              src={data.externalUrl}
              className="w-full h-72 rounded-xl border-2 border-teal-500/40 bg-white"
            />
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 via-teal-700 to-sky-800 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <Upload className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Hệ Thống Tải & Quản Lý Học Liệu Thống Nhất (Quy Trình 3 Bước)
              </h2>
              <p className="text-xs text-teal-100">
                Bài giảng PowerPoint, PDF, Word • Video bài giảng & thí nghiệm • Mô phỏng tương tác 2D/2.5D/3D (HTML/JS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-black/20 p-1 border border-white/15">
              <button
                type="button"
                data-testid="tab-upload-wizard-btn"
                onClick={() => setActiveTab('wizard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                  activeTab === 'wizard'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-white/85 hover:text-white'
                }`}
              >
                + Tải Học Liệu (3 Bước)
              </button>
              <button
                type="button"
                data-testid="tab-resource-manager-btn"
                onClick={() => setActiveTab('manager')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'manager'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-white/85 hover:text-white'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Quản Lý Học Liệu ({resources.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {wizardToast && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-200 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{wizardToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setWizardToast(null)}
              className="text-emerald-700 hover:underline text-[11px] cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Error Notification */}
        {wizardError && (
          <div
            role="alert"
            className="px-6 py-2.5 bg-red-50 dark:bg-red-950/80 border-b border-red-200 dark:border-red-800 flex items-center justify-between text-xs font-bold text-red-700 dark:text-red-200 shrink-0"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{wizardError}</span>
            </div>
            <button
              type="button"
              onClick={() => setWizardError(null)}
              className="text-red-700 hover:underline text-[11px] cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'wizard' ? (
            <div className="space-y-6">
              {/* 3-Step Progress Bar (`1. Chọn bài học → 2. Tải học liệu → 3. Xuất bản`) */}
              <div
                data-testid="upload-wizard-stepper"
                className="grid grid-cols-3 gap-2 sm:gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                {[
                  { step: 1, title: '1. Chọn bài học', subtitle: 'Môn • Lớp • Bộ sách • Bài' },
                  { step: 2, title: '2. Tải học liệu', subtitle: 'Tài liệu • Video • Mô phỏng' },
                  { step: 3, title: '3. Xuất bản', subtitle: 'Xem trước & Lưu' },
                ].map((item) => {
                  const isActive = currentStep === item.step;
                  const isDone = currentStep > item.step;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      data-testid={`wizard-step-indicator-${item.step}`}
                      onClick={() => {
                        if (item.step < currentStep) setCurrentStep(item.step as 1 | 2 | 3);
                      }}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                          : isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full font-extrabold text-xs flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-white text-teal-800'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : item.step}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs sm:text-sm truncate">
                          {item.title}
                        </div>
                        <div
                          className={`text-[10px] truncate hidden sm:block ${
                            isActive ? 'text-teal-100' : 'text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* STEP 1: CHỌN VỊ TRÍ BÀI HỌC */}
              {currentStep === 1 && (
                <div
                  data-testid="wizard-step-1-panel"
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5"
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                      BƯỚC 1 – CHỌN VỊ TRÍ BÀI HỌC
                    </h3>
                    <p className="text-xs text-slate-500">
                      Các trường liên kết động: chọn Môn học & Khối lớp sẽ tự động lọc đúng Chương và Bài học tương ứng.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* 1. Môn học */}
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                        1. Môn học
                      </label>
                      <select
                        value={step1.subject}
                        data-testid="step1-subject-select"
                        onChange={(e) =>
                          handleSubjectOrGradeChange(
                            e.target.value as MaterialSubject,
                            step1.grade
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white"
                      >
                        {(Object.keys(SUBJECT_LABELS) as MaterialSubject[]).map((subj) => (
                          <option key={subj} value={subj}>
                            {SUBJECT_LABELS[subj]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Khối lớp */}
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                        2. Khối lớp (Ưu tiên KHTN 6–9)
                      </label>
                      <select
                        value={step1.grade}
                        data-testid="step1-grade-select"
                        onChange={(e) =>
                          handleSubjectOrGradeChange(
                            step1.subject,
                            Number(e.target.value) as MaterialGrade
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white"
                      >
                        {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                          <option key={g} value={g}>
                            Lớp {g} {g <= 9 ? '(Trọng tâm THCS)' : '(Mở rộng THPT)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Bộ sách */}
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                        3. Bộ sách
                      </label>
                      <select
                        value={step1.textbook}
                        data-testid="step1-textbook-select"
                        onChange={(e) =>
                          setStep1((prev) => ({
                            ...prev,
                            textbook: e.target.value as TextbookSeries,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white"
                      >
                        {(Object.keys(TEXTBOOK_LABELS) as TextbookSeries[]).map((tb) => (
                          <option key={tb} value={tb}>
                            {TEXTBOOK_LABELS[tb]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4. Chương hoặc chủ đề */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        4. Chương hoặc chủ đề (Tự động lọc theo {SUBJECT_LABELS[step1.subject]} – Lớp {step1.grade})
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewTopic((v) => !v)}
                        className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tạo chương/chủ đề mới</span>
                      </button>
                    </div>

                    {isCreatingNewTopic && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
                        <input
                          type="text"
                          value={newTopicInput}
                          onChange={(e) => setNewTopicInput(e.target.value)}
                          placeholder="Nhập tên chương/chủ đề mới..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={handleCreateNewTopicInline}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 text-white font-bold text-xs cursor-pointer"
                        >
                          Lưu chương
                        </button>
                      </div>
                    )}

                    <select
                      value={step1.topicId}
                      data-testid="step1-topic-select"
                      onChange={(e) => handleTopicChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white"
                    >
                      {availableTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Tên bài học */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                        5. Tên bài học (Thuộc "{step1.topicTitle}")
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          data-testid="step1-create-lesson-toggle-btn"
                          onClick={() => {
                            setIsCreatingNewLesson((v) => !v);
                            setIsRenamingLesson(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tạo bài mới</span>
                        </button>

                        <button
                          type="button"
                          data-testid="step1-rename-lesson-toggle-btn"
                          onClick={() => {
                            setIsRenamingLesson((v) => !v);
                            setIsCreatingNewLesson(false);
                            setRenameLessonInput(step1.lessonTitle);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa tên bài</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick search input for lessons */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={lessonSearchQuery}
                        onChange={(e) => setLessonSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm nhanh bài học trong chương..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>

                    {isCreatingNewLesson && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
                        <input
                          type="text"
                          data-testid="step1-new-lesson-input"
                          value={newLessonInput}
                          onChange={(e) => setNewLessonInput(e.target.value)}
                          placeholder="Nhập tên bài học mới (VD: Bài 15: Thực hành đo khối lượng riêng)..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                        />
                        <button
                          type="button"
                          data-testid="step1-save-new-lesson-btn"
                          onClick={handleCreateNewLessonInline}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 text-white font-bold text-xs cursor-pointer"
                        >
                          Tạo bài
                        </button>
                      </div>
                    )}

                    {isRenamingLesson && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                        <input
                          type="text"
                          data-testid="step1-rename-lesson-input"
                          value={renameLessonInput}
                          onChange={(e) => setRenameLessonInput(e.target.value)}
                          placeholder="Nhập tên mới cho bài học hiện tại..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                        />
                        <button
                          type="button"
                          data-testid="step1-save-rename-lesson-btn"
                          onClick={handleRenameCurrentLessonInline}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs cursor-pointer"
                        >
                          Lưu tên mới
                        </button>
                      </div>
                    )}

                    <select
                      value={step1.lessonId}
                      data-testid="step1-lesson-select"
                      onChange={(e) => handleLessonChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white"
                    >
                      {availableLessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: CHỌN LOẠI HỌC LIỆU VÀ TẢI LÊN */}
              {currentStep === 2 && (
                <div
                  data-testid="wizard-step-2-panel"
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5"
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                      BƯỚC 2 – CHỌN LOẠI HỌC LIỆU VÀ TẢI LÊN
                    </h3>
                    <p className="text-xs text-slate-500">
                      Đang tải vào: <strong>{SUBJECT_LABELS[step1.subject]} • Lớp {step1.grade} • {step1.lessonTitle}</strong>
                    </p>
                  </div>

                  {/* 3 Horizontal Category Cards (A, B, C) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {[
                      {
                        id: 'lecture_doc' as MaterialUploadCategory,
                        title: 'A. Bài giảng & Tài liệu',
                        desc: 'Hỗ trợ PowerPoint (.ppt, .pptx), PDF (.pdf), Word (.doc, .docx)',
                        icon: FileText,
                        badge: 'PPTX • PDF • DOCX',
                      },
                      {
                        id: 'video' as MaterialUploadCategory,
                        title: 'B. Video',
                        desc: 'Tải file video (.mp4, .webm) hoặc dán liên kết YouTube / Video nhúng',
                        icon: Video,
                        badge: 'MP4 • WEBM • YOUTUBE',
                      },
                      {
                        id: 'simulation' as MaterialUploadCategory,
                        title: 'C. Mô phỏng',
                        desc: 'Mô phỏng tương tác HTML/JS, React/Three.js, 2D/2.5D/3D (chạy trong Sandbox)',
                        icon: Atom,
                        badge: 'HTML/JS • 2D/3D • SANDBOX',
                      },
                    ].map((card) => {
                      const Icon = card.icon;
                      const selected = step2.category === card.id;
                      return (
                        <button
                          key={card.id}
                          type="button"
                          data-testid={`step2-category-card-${card.id}`}
                          onClick={() => {
                            setWizardError(null);
                            setStep2((prev) => ({
                              ...prev,
                              category: card.id,
                            }));
                          }}
                          className={`p-4 rounded-2xl border-2 text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                            selected
                              ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-600 shadow-sm'
                              : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                selected
                                  ? 'bg-teal-700 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-teal-800 dark:text-teal-300">
                              {card.badge}
                            </span>
                          </div>
                          <div>
                            <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {card.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {card.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Common Title Input */}
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Tên hiển thị học liệu *
                    </label>
                    <input
                      type="text"
                      data-testid="step2-title-input"
                      value={step2.title}
                      onChange={(e) => setStep2((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder={`Nhập tên ${CATEGORY_LABELS[step2.category]} (VD: Slide bài giảng ${step1.lessonTitle})...`}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Category-Specific Upload / Source Inputs */}
                  {step2.category === 'lecture_doc' && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          Phân loại tài liệu trong bài học:
                        </span>
                        {(
                          [
                            'Giáo án điện tử',
                            'Phiếu học tập',
                            'Đề cương ôn tập',
                          ] as DocumentSubCategory[]
                        ).map((subType) => {
                          const isSelected =
                            (step2.docSubType ||
                              inferDocumentSubCategory(step2.title, step2.fileName)) === subType;
                          return (
                            <button
                              key={subType}
                              type="button"
                              onClick={() =>
                                setStep2((prev) => ({ ...prev, docSubType: subType }))
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                                isSelected
                                  ? 'bg-teal-700 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50'
                              }`}
                            >
                              {subType}
                            </button>
                          );
                        })}
                      </div>

                      <div className="border-2 border-dashed border-teal-500/60 rounded-2xl p-5 bg-teal-50/30 dark:bg-teal-950/20 text-center space-y-3">
                        <Upload className="w-8 h-8 text-teal-700 dark:text-teal-300 mx-auto" />
                        <div>
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                            Kéo thả tệp vào đây hoặc bấm nút chọn tệp từ máy tính
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Định dạng hỗ trợ: PowerPoint (.ppt, .pptx), PDF (.pdf), Word (.doc, .docx)
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <label className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-xs cursor-pointer inline-flex items-center gap-1.5">
                            <Upload className="w-4 h-4" />
                            <span>{step2.fileName ? 'Thay file khác' : 'Chọn tệp từ máy tính'}</span>
                            <input
                              type="file"
                              data-testid="step2-file-input"
                              accept=".ppt,.pptx,.pdf,.doc,.docx"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            data-testid="step2-load-sample-pptx-btn"
                            onClick={() => {
                              setStep2((prev) => ({
                                ...prev,
                                title: prev.title.trim() || `Slide bài giảng ${step1.lessonTitle}`,
                                docSubType: 'Giáo án điện tử',
                                fileName: 'Bai_Giang_Dien_Tu_KHTN.pptx',
                                fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                fileSize: 2458624,
                                uploadProgress: 100,
                                uploadStatus: 'ready',
                              }));
                            }}
                            className="px-3 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs cursor-pointer"
                          >
                            Dùng thử tệp .pptx mẫu
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {step2.category === 'video' && (
                    <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          data-testid="video-source-youtube-btn"
                          onClick={() =>
                            setStep2((prev) => ({ ...prev, videoSourceType: 'youtube' }))
                          }
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                            step2.videoSourceType !== 'upload_file'
                              ? 'bg-teal-700 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          Dán liên kết YouTube / Video nhúng (Không tải về máy chủ)
                        </button>
                        <button
                          type="button"
                          data-testid="video-source-upload-btn"
                          onClick={() =>
                            setStep2((prev) => ({ ...prev, videoSourceType: 'upload_file' }))
                          }
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer ${
                            step2.videoSourceType === 'upload_file'
                              ? 'bg-teal-700 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          Tải tệp Video (.mp4, .webm) từ máy tính
                        </button>
                      </div>

                      {step2.videoSourceType === 'upload_file' ? (
                        <div className="border-2 border-dashed border-teal-500/60 rounded-2xl p-4 text-center space-y-2">
                          <label className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-xs cursor-pointer inline-flex items-center gap-1.5">
                            <Upload className="w-4 h-4" />
                            <span>{step2.fileName ? 'Thay file video khác' : 'Chọn file Video (.mp4, .webm)'}</span>
                            <input
                              type="file"
                              data-testid="step2-video-file-input"
                              accept=".mp4,.webm,video/mp4,video/webm"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                            Liên kết YouTube hoặc URL Video bài giảng / thí nghiệm:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              data-testid="step2-video-url-input"
                              value={step2.externalUrl || ''}
                              onChange={(e) =>
                                setStep2((prev) => ({
                                  ...prev,
                                  externalUrl: e.target.value,
                                  uploadProgress: 100,
                                  uploadStatus: 'ready',
                                }))
                              }
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                            />
                            <button
                              type="button"
                              data-testid="step2-sample-youtube-btn"
                              onClick={() =>
                                setStep2((prev) => ({
                                  ...prev,
                                  title:
                                    prev.title.trim() ||
                                    `Video thí nghiệm ${step1.lessonTitle}`,
                                  externalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                                  uploadProgress: 100,
                                  uploadStatus: 'ready',
                                }))
                              }
                              className="px-3 py-2 rounded-xl bg-sky-700 text-white font-bold text-xs cursor-pointer shrink-0"
                            >
                              Dùng link mẫu
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step2.category === 'simulation' && (
                    <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Loại mô phỏng khoa học:
                          </label>
                          <select
                            value={step2.simulationType || 'html_js'}
                            data-testid="step2-simulation-type-select"
                            onChange={(e) =>
                              setStep2((prev) => ({
                                ...prev,
                                simulationType: e.target.value as any,
                              }))
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-xs"
                          >
                            <option value="html_js">Mô phỏng tương tác HTML/JavaScript</option>
                            <option value="2d">Mô phỏng khoa học 2D</option>
                            <option value="2_5d">Mô phỏng khoa học 2.5D</option>
                            <option value="3d">Mô phỏng không gian 3D / Three.js</option>
                            <option value="react_three">Component React / Three.js</option>
                            <option value="external_embed">Liên kết mô phỏng ngoài (PhET / URL)</option>
                          </select>
                        </div>

                        <div className="flex items-end gap-2">
                          <label className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Tải file .html mô phỏng</span>
                            <input
                              type="file"
                              accept=".html,.htm"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            data-testid="step2-sample-simulation-btn"
                            onClick={() =>
                              setStep2((prev) => ({
                                ...prev,
                                title:
                                  prev.title.trim() ||
                                  `Mô phỏng tương tác ${step1.lessonTitle}`,
                                fileName: 'Mo_Phong_Thi_Nghiem_KHTN.html',
                                fileType: 'text/html',
                                fileSize: 4096,
                                simulationHtml: `<div style="font-family:sans-serif;padding:18px;color:#e2e8f0;background:#0f172a;border-radius:12px;">
  <h3 style="margin:0 0 8px;color:#38bdf8;">Mô phỏng KHTN: ${step1.lessonTitle}</h3>
  <p style="font-size:13px;margin:0 0 12px;">Kéo thanh trượt để thay đổi thông số thí nghiệm:</p>
  <input type="range" min="10" max="100" value="50" oninput="document.getElementById('val').innerText = this.value + ' °C'" />
  <strong id="val" style="margin-left:10px;color:#4ade80;">50 °C</strong>
</div>`,
                                uploadProgress: 100,
                                uploadStatus: 'ready',
                              }))
                            }
                            className="px-3 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                          >
                            Nạp mô phỏng HTML mẫu
                          </button>
                        </div>
                      </div>

                      {step2.simulationType === 'external_embed' ? (
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            URL liên kết mô phỏng ngoài (sẽ chạy trong iframe sandbox="allow-scripts"):
                          </label>
                          <input
                            type="url"
                            value={step2.externalUrl || ''}
                            onChange={(e) =>
                              setStep2((prev) => ({
                                ...prev,
                                externalUrl: e.target.value,
                                uploadProgress: 100,
                                uploadStatus: 'ready',
                              }))
                            }
                            placeholder="https://phet.colorado.edu/sims/html/..."
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Mã nguồn HTML/JavaScript mô phỏng (tự động cô lập trong &lt;iframe sandbox="allow-scripts"&gt;):
                          </label>
                          <textarea
                            rows={5}
                            data-testid="step2-simulation-html-input"
                            value={step2.simulationHtml || ''}
                            onChange={(e) =>
                              setStep2((prev) => ({
                                ...prev,
                                simulationHtml: e.target.value,
                                uploadProgress: 100,
                                uploadStatus: 'ready',
                              }))
                            }
                            placeholder="Dán mã HTML/Canvas/Three.js của mô phỏng vào đây..."
                            className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* File Metadata & Upload Progress Card */}
                  {(step2.fileName || step2.externalUrl || step2.simulationHtml) && (
                    <div
                      data-testid="step2-file-status-card"
                      className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 font-bold text-emerald-950 dark:text-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Tên nguồn / tệp:{' '}
                            <strong>
                              {step2.fileName || step2.externalUrl || 'Mã nguồn HTML/JS trực tiếp'}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
                          {step2.fileType && <span>Loại: {step2.fileType}</span>}
                          {step2.fileSize ? (
                            <span>Dung lượng: {formatFileSize(step2.fileSize)}</span>
                          ) : null}
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                            {step2.uploadStatus === 'uploading' ? 'Đang tải...' : 'Sẵn sàng'}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-emerald-200/70 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${step2.uploadProgress || 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: XEM TRƯỚC VÀ XUẤT BẢN */}
              {currentStep === 3 && (
                <div
                  data-testid="wizard-step-3-panel"
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5"
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                      BƯỚC 3 – XEM TRƯỚC VÀ XUẤT BẢN
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kiểm tra lại thông tin tóm tắt và khung xem trước học liệu trước khi Lưu bản nháp hoặc Xuất bản.
                    </p>
                  </div>

                  {/* Summary Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Môn học & Khối lớp</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {SUBJECT_LABELS[step1.subject]} – Lớp {step1.grade}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Bộ sách</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {TEXTBOOK_LABELS[step1.textbook]}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Chương / Chủ đề</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {step1.topicTitle}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Bài học</span>
                      <span className="font-extrabold text-teal-700 dark:text-teal-300">
                        {step1.lessonTitle}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">Tên học liệu hiển thị</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {step2.title}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Loại học liệu</span>
                      <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                        {CATEGORY_LABELS[step2.category]}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tệp / Nguồn liên kết</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 truncate block">
                        {step2.fileName || step2.externalUrl || 'Mã HTML/JS tương tác'}
                      </span>
                    </div>
                  </div>

                  {/* Live Preview Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-teal-600" />
                      <span>Xem trước trực tiếp trên trình duyệt:</span>
                    </h4>
                    {renderResourcePreviewContent(step2)}
                  </div>

                  {/* Publish / Save Draft Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      data-testid="step3-save-draft-btn"
                      onClick={() => handleSaveMaterial('draft')}
                      className="px-5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-extrabold text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>LƯU BẢN NHÁP</span>
                    </button>

                    <button
                      type="button"
                      data-testid="step3-publish-btn"
                      onClick={() => handleSaveMaterial('published')}
                      className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>XUẤT BẢN</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Step Navigation (`Quay lại` / `Tiếp tục`) */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  data-testid="wizard-prev-btn"
                  disabled={currentStep === 1}
                  onClick={handlePrevStep}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>

                {currentStep < 3 && (
                  <button
                    type="button"
                    data-testid="wizard-next-btn"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Tiếp tục (Bước {currentStep + 1}/3)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* POST-UPLOAD HIERARCHICAL RESOURCE MANAGER (Section 4) */
            <div data-testid="post-upload-resource-manager" className="space-y-5">
              {/* Filter Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="all">Tất cả môn học</option>
                  {(Object.keys(SUBJECT_LABELS) as MaterialSubject[]).map((s) => (
                    <option key={s} value={s}>
                      {SUBJECT_LABELS[s]}
                    </option>
                  ))}
                </select>

                <select
                  value={filterGrade}
                  data-testid="manager-filter-grade"
                  onChange={(e) =>
                    setFilterGrade(
                      e.target.value === 'all' ? 'all' : (Number(e.target.value) as MaterialGrade)
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="all">Tất cả khối lớp</option>
                  {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Lớp {g}
                    </option>
                  ))}
                </select>

                <select
                  value={filterCategory}
                  data-testid="manager-filter-category"
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="all">Tất cả loại học liệu</option>
                  <option value="lecture_doc">Bài giảng & Tài liệu</option>
                  <option value="video">Video</option>
                  <option value="simulation">Mô phỏng</option>
                </select>

                <select
                  value={filterStatus}
                  data-testid="manager-filter-status"
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="all">Mọi trạng thái</option>
                  <option value="published">Đã xuất bản</option>
                  <option value="draft">Bản nháp (Ẩn)</option>
                </select>

                <div className="sm:col-span-2 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Tìm theo tên học liệu, tên bài học, chương..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              {/* Hierarchical Tree: Môn học → Lớp → Chương → Bài học → 3 Nhóm Tài Nguyên */}
              {Object.values(groupedByLesson).length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <FolderTree className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Chưa có học liệu nào khớp với bộ lọc hiện tại
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('wizard')}
                    className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold text-xs cursor-pointer"
                  >
                    + Tải học liệu mới theo 3 bước
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.values(groupedByLesson).map((group) => {
                    const docs = group.items.filter((i) => i.category === 'lecture_doc');
                    const videos = group.items.filter((i) => i.category === 'video');
                    const sims = group.items.filter((i) => i.category === 'simulation');

                    return (
                      <div
                        key={group.lessonKey}
                        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                      >
                        {/* Breadcrumb Header: Môn học → Lớp → Chương → Bài học */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="px-2.5 py-0.5 rounded-lg bg-teal-700 text-white font-extrabold">
                              {SUBJECT_LABELS[group.subject]}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold">
                              Lớp {group.grade}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {group.topicTitle}
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-extrabold text-teal-800 dark:text-teal-300">
                              {group.lessonTitle}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            { TEXTBOOK_LABELS[group.textbook] }
                          </span>
                        </div>

                        {/* 3 Sections inside each Lesson: Bài giảng & tài liệu | Video | Mô phỏng */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {[
                            {
                              catKey: 'lecture_doc',
                              label: 'Bài giảng & tài liệu',
                              items: docs,
                              icon: FileText,
                            },
                            {
                              catKey: 'video',
                              label: 'Video',
                              items: videos,
                              icon: Video,
                            },
                            {
                              catKey: 'simulation',
                              label: 'Mô phỏng',
                              items: sims,
                              icon: Atom,
                            },
                          ].map((sec) => {
                            const SecIcon = sec.icon;
                            return (
                              <div
                                key={sec.catKey}
                                className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-2.5"
                              >
                                <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                  <span className="flex items-center gap-1.5">
                                    <SecIcon className="w-3.5 h-3.5 text-teal-600" />
                                    <span>{sec.label}</span>
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-[10px]">
                                    {sec.items.length}
                                  </span>
                                </div>

                                {sec.items.length === 0 ? (
                                  <div className="text-[11px] text-slate-400 italic py-2">
                                    Chưa có {sec.label.toLowerCase()}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {sec.items.map((res) => (
                                      <div
                                        key={res.id}
                                        data-testid={`managed-resource-item-${res.id}`}
                                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="min-w-0">
                                            <div className="font-bold text-slate-900 dark:text-white truncate">
                                              {res.title}
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate">
                                              {res.fileName || res.externalUrl || 'Mô phỏng HTML/JS'}
                                            </div>
                                          </div>
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                                              res.status === 'published'
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                            }`}
                                          >
                                            {res.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                                          </span>
                                        </div>

                                        {/* Inline Rename Box */}
                                        {editingResourceId === res.id && (
                                          <div className="flex items-center gap-1.5 pt-1">
                                            <input
                                              type="text"
                                              value={editingTitleValue}
                                              onChange={(e) => setEditingTitleValue(e.target.value)}
                                              className="flex-1 px-2 py-1 rounded border border-slate-300 text-xs"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleConfirmRenameResource(res.id)}
                                              className="px-2 py-1 rounded bg-teal-700 text-white font-bold text-[10px] cursor-pointer"
                                            >
                                              Lưu
                                            </button>
                                          </div>
                                        )}

                                        {/* Inline Move to another lesson Box */}
                                        {movingResourceId === res.id && (
                                          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-1.5">
                                            <div className="text-[10px] font-bold">
                                              Chuyển sang bài học khác:
                                            </div>
                                            <select
                                              value={moveTargetTopicId}
                                              onChange={(e) => {
                                                const tId = e.target.value;
                                                setMoveTargetTopicId(tId);
                                                const ls = getLessonsForTopic(
                                                  tId,
                                                  res.grade,
                                                  res.subject
                                                );
                                                setMoveTargetLessonId(ls[0]?.id || '');
                                              }}
                                              className="w-full px-2 py-1 rounded border text-[11px]"
                                            >
                                              {getTopicsForSubjectAndGrade(
                                                res.subject,
                                                res.grade
                                              ).map((t) => (
                                                <option key={t.id} value={t.id}>
                                                  {t.title}
                                                </option>
                                              ))}
                                            </select>
                                            <select
                                              value={moveTargetLessonId}
                                              onChange={(e) => setMoveTargetLessonId(e.target.value)}
                                              className="w-full px-2 py-1 rounded border text-[11px]"
                                            >
                                              {getLessonsForTopic(
                                                moveTargetTopicId,
                                                res.grade,
                                                res.subject
                                              ).map((l) => (
                                                <option key={l.id} value={l.id}>
                                                  {l.title}
                                                </option>
                                              ))}
                                            </select>
                                            <div className="flex justify-end gap-1">
                                              <button
                                                type="button"
                                                onClick={() => handleConfirmMoveResource(res)}
                                                className="px-2 py-1 rounded bg-teal-700 text-white font-bold text-[10px] cursor-pointer"
                                              >
                                                Xác nhận chuyển
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setMovingResourceId(null)}
                                                className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[10px] cursor-pointer"
                                              >
                                                Hủy
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Confirm Delete Box */}
                                        {confirmDeleteId === res.id && (
                                          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-red-800 dark:text-red-200">
                                              Xác nhận xóa học liệu này?
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <button
                                                type="button"
                                                data-testid={`confirm-delete-resource-${res.id}`}
                                                onClick={() => handleDeleteInManager(res.id)}
                                                className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] cursor-pointer"
                                              >
                                                Xóa
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] cursor-pointer"
                                              >
                                                Hủy
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Action Bar for Resource */}
                                        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                                          <button
                                            type="button"
                                            onClick={() => setPreviewResource(res)}
                                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                            title="Xem trước"
                                          >
                                            <Eye className="w-3 h-3" />
                                            <span>Xem</span>
                                          </button>

                                          {res.category === 'lecture_doc' &&
                                            (res.fileDataUrl || res.externalUrl) && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const ext =
                                                    res.fileName?.split('.').pop()?.toLowerCase() ||
                                                    'pdf';
                                                  const dData = buildEducationalDocumentData({
                                                    id: res.id,
                                                    lessonId: res.lessonId,
                                                    title: res.title,
                                                    type:
                                                      res.docSubType ||
                                                      inferDocumentSubCategory(
                                                        res.title,
                                                      res.fileName
                                                      ),
                                                    format: ext,
                                                    grade: res.grade,
                                                    fileUrl: res.fileDataUrl || res.externalUrl,
                                                    fileName: res.fileName,
                                                  });
                                                  triggerEducationalDocumentDownload(dData).then(
                                                    (ok) => {
                                                      if (ok) {
                                                        setWizardToast(
                                                          `Đang tải xuống tệp gốc: ${res.fileName || res.title}`
                                                        );
                                                      }
                                                    }
                                                  );
                                                }}
                                                className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                                title="Tải tệp gốc về máy"
                                              >
                                                <Download className="w-3 h-3" />
                                                <span>Tải về</span>
                                              </button>
                                            )}

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingResourceId(res.id);
                                              setEditingTitleValue(res.title);
                                            }}
                                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                            title="Chỉnh sửa tên"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                            <span>Sửa tên</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setMovingResourceId(res.id);
                                              setMoveTargetTopicId(res.topicId);
                                              setMoveTargetLessonId(res.lessonId);
                                            }}
                                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                            title="Chuyển tài nguyên sang bài học khác"
                                          >
                                            <ArrowRightLeft className="w-3 h-3" />
                                            <span>Chuyển bài</span>
                                          </button>

                                          <label
                                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                            title="Thay thế file"
                                          >
                                            <RefreshCw className="w-3 h-3" />
                                            <span>Thay file</span>
                                            <input
                                              type="file"
                                              onChange={(e) =>
                                                handleReplaceFileInManager(res.id, e)
                                              }
                                              className="hidden"
                                            />
                                          </label>

                                          <button
                                            type="button"
                                            onClick={() => handleToggleStatusInManager(res.id)}
                                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                            title="Ẩn / Hiện học liệu"
                                          >
                                            <EyeOff className="w-3 h-3" />
                                            <span>
                                              {res.status === 'published' ? 'Ẩn' : 'Xuất bản'}
                                            </span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleCopyLink(res)}
                                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                            title="Sao chép liên kết"
                                          >
                                            <Copy className="w-3 h-3" />
                                            <span>Link</span>
                                          </button>

                                          <button
                                            type="button"
                                            data-testid={`delete-resource-btn-${res.id}`}
                                            onClick={() => setConfirmDeleteId(res.id)}
                                            className="px-2 py-1 rounded bg-red-50 dark:bg-red-950/50 text-red-600 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                            title="Xóa học liệu"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Modal for a Managed Resource */}
        {previewResource && (
          <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Xem trước: {previewResource.title}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {SUBJECT_LABELS[previewResource.subject]} • Lớp {previewResource.grade} •{' '}
                    {previewResource.lessonTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewResource(null)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderResourcePreviewContent(previewResource)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
