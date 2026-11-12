import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { isSupabaseConfigured } from '../lib/supabase.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { SIMULATIONS_3D, DOMAINS } from '../data/mockData.ts';
import {
  Grade,
  SubjectDomain,
  Topic,
  QuizQuestion,
  QuizMeta,
  VideoLesson,
  DocumentItem,
  AppUser,
} from '../types/index.ts';
import {
  SciencePairItem,
  CrosswordRowItem,
  DetectivePuzzleItem,
} from '../utils/scienceGameEngine.ts';
import {
  AdminLesson,
  LessonAssetItem,
  SiteSettings,
  fetchAdminLessons,
  toggleLessonPublish,
  deleteAdminLesson,
  clearAdminLessonVideo,
  clearAllAdminLessonVideos,
  fetchAllAdminDocuments,
  deleteAdminAsset,
  fetchAdminTopics,
  saveAdminTopic,
  deleteAdminTopic,
  fetchAdminQuestions,
  saveAdminQuestion,
  deleteAdminQuestion,
  fetchAdminQuizzes,
  saveAdminQuiz,
  deleteAdminQuiz,
  fetchAdminVideos,
  saveAdminVideo,
  deleteAdminVideo,
  fetchAdminCatalogDocs,
  saveAdminCatalogDoc,
  deleteAdminCatalogDoc,
  getAdminGamePairsSync,
  saveAdminGamePair,
  deleteAdminGamePair,
  getAdminCrosswordsSync,
  saveAdminCrossword,
  deleteAdminCrossword,
  getAdminDetectivePuzzlesSync,
  saveAdminDetectivePuzzle,
  deleteAdminDetectivePuzzle,
  getAdminUsersSync,
  saveAdminUser,
  deleteAdminUser,
  getSiteSettingsSync,
  saveSiteSettingsSync,
  resetAllAdminDataToDefault,
  saveUploadedAssetToRepository,
} from '../services/adminService.ts';
import { uploadLessonDocument } from '../services/storageService.ts';
import {
  createDocumentDataFromCatalogItem,
  triggerEducationalDocumentDownload,
} from '../utils/documentGenerator.ts';
import { resolvePlayableOrDownloadableUrl, isRealUploadedFileUrl } from '../services/localFileStore.ts';
import { LessonFormModal } from '../components/admin/LessonFormModal.tsx';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal.tsx';
import { AssetUploader } from '../components/admin/AssetUploader.tsx';
import { SimulationManager } from '../components/admin/SimulationManager.tsx';
import {
  ScientificSolutionView,
  renderFormattedMathAndChem,
} from '../components/common/ScientificSolutionView.tsx';
import { WordQuestionImportModal } from '../components/admin/WordQuestionImportModal.tsx';
import { UnifiedMaterialUploadModal } from '../components/admin/UnifiedMaterialUploadModal.tsx';
import { FormulaEditorModal } from '../components/admin/FormulaEditorModal.tsx';
import {
  parseExplanationIntoSteps,
  generateStepByStepSolution,
  generateDetailedExplanation,
} from '../utils/wordQuestionParser.ts';
import {
  ShieldCheck,
  BookOpen,
  Atom,
  FileText,
  Plus,
  Trash2,
  Edit,
  Database,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Video,
  FileUp,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Clock,
  Layers,
  Lock,
  CheckSquare,
  Gamepad2,
  Users,
  Settings,
  FolderKanban,
  Download,
  RotateCcw,
  HelpCircle,
  Save,
  X,
  UserCheck,
} from 'lucide-react';

type AdminTabId =
  | 'overview'
  | 'topics'
  | 'lessons'
  | 'sims'
  | 'quizzes'
  | 'games'
  | 'videos'
  | 'docs'
  | 'users';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');

  // 1. Lessons State
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');

  // 2. Topics State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicFilterGrade, setTopicFilterGrade] = useState<Grade | 'all'>('all');
  const [topicFilterDomain, setTopicFilterDomain] = useState<SubjectDomain | 'all'>('all');
  const [editingTopic, setEditingTopic] = useState<Partial<Topic> | null>(null);

  // 3. Quizzes & Questions State
  const [quizSubTab, setQuizSubTab] = useState<'questions' | 'exams'>('questions');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizzes, setQuizzes] = useState<QuizMeta[]>([]);
  const [questionFilterGrade, setQuestionFilterGrade] = useState<Grade | 'all'>('all');
  const [questionFilterDomain, setQuestionFilterDomain] = useState<SubjectDomain | 'all'>('all');
  const [editingQuestion, setEditingQuestion] = useState<Partial<QuizQuestion> | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Partial<QuizMeta> | null>(null);
  const [isWordImportOpen, setIsWordImportOpen] = useState(false);
  const [isUnifiedUploadOpen, setIsUnifiedUploadOpen] = useState(false);
  const [unifiedUploadInitialTab, setUnifiedUploadInitialTab] = useState<'wizard' | 'manager'>('wizard');
  const [isAdminFormulaOpen, setIsAdminFormulaOpen] = useState(false);
  const [adminFormulaTarget, setAdminFormulaTarget] = useState<'question' | 'explanation'>('question');

  // 4. Games State
  const [gameSubTab, setGameSubTab] = useState<'pairs' | 'crosswords' | 'detective'>('pairs');
  const [gamePairs, setGamePairs] = useState<SciencePairItem[]>([]);
  const [crosswords, setCrosswords] = useState<CrosswordRowItem[]>([]);
  const [detectivePuzzles, setDetectivePuzzles] = useState<DetectivePuzzleItem[]>([]);
  const [editingPair, setEditingPair] = useState<Partial<SciencePairItem> | null>(null);
  const [editingCrossword, setEditingCrossword] = useState<Partial<CrosswordRowItem> | null>(null);
  const [editingDetective, setEditingDetective] = useState<Partial<DetectivePuzzleItem> | null>(null);

  // 5. Videos State
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [videoFilterGrade, setVideoFilterGrade] = useState<Grade | 'all'>('all');
  const [editingVideo, setEditingVideo] = useState<Partial<VideoLesson> | null>(null);

  // 6. Documents State (Catalog + Storage)
  const [docSubTab, setDocSubTab] = useState<'catalog' | 'storage'>('catalog');
  const [catalogDocs, setCatalogDocs] = useState<DocumentItem[]>([]);
  const [documents, setDocuments] = useState<LessonAssetItem[]>([]);
  const [docFormatFilter, setDocFormatFilter] = useState<'all' | 'pptx' | 'pdf' | 'docx' | 'image'>('all');
  const [editingCatalogDoc, setEditingCatalogDoc] = useState<Partial<DocumentItem> | null>(null);

  // 7. Users State
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [editingUser, setEditingUser] = useState<Partial<AppUser> | null>(null);

  // 8. Site Settings & Reset Confirmation
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => getSiteSettingsSync());
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Modals State for Lessons & Delete Confirmation
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null);
  const [lessonFormInitialTab, setLessonFormInitialTab] = useState<
    'info' | 'content' | 'media' | 'assets' | 'miniquiz'
  >('info');

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    itemType: string;
    id: string;
    name: string;
    storagePath?: string;
    onCustomDelete?: () => Promise<void>;
  }>({
    isOpen: false,
    itemType: 'bài học',
    id: '',
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load All System Data
  const loadAllData = async () => {
    setIsLoadingLessons(true);
    try {
      const [
        lessonsData,
        docsData,
        topicsData,
        questionsData,
        quizzesData,
        videosData,
        catalogDocsData,
      ] = await Promise.all([
        fetchAdminLessons(),
        fetchAllAdminDocuments(),
        fetchAdminTopics(),
        fetchAdminQuestions(),
        fetchAdminQuizzes(),
        fetchAdminVideos(),
        fetchAdminCatalogDocs(),
      ]);
      setLessons(lessonsData);
      setDocuments(docsData);
      setTopics(topicsData);
      setQuestions(questionsData);
      setQuizzes(quizzesData);
      setVideos(videosData);
      setCatalogDocs(catalogDocsData);
      setGamePairs(getAdminGamePairsSync());
      setCrosswords(getAdminCrosswordsSync());
      setDetectivePuzzles(getAdminDetectivePuzzlesSync());
      setUsersList(getAdminUsersSync());
      setSiteSettings(getSiteSettingsSync());
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Lesson handlers
  const handleTogglePublish = async (lesson: AdminLesson) => {
    const newStatus = !lesson.isPublished;
    setLessons((prev) =>
      prev.map((l) => (l.id === lesson.id ? { ...l, isPublished: newStatus } : l))
    );
    const success = await toggleLessonPublish(lesson.id, newStatus);
    if (success) {
      showToast(
        newStatus
          ? `Đã xuất bản bài: "${lesson.title}".`
          : `Đã chuyển sang Bản nháp: "${lesson.title}".`
      );
    } else {
      showToast('Không thể cập nhật trạng thái xuất bản.', 'error');
      loadAllData();
    }
  };

  const handleOpenCreateLesson = () => {
    setEditingLesson(null);
    setLessonFormInitialTab('info');
    setIsFormModalOpen(true);
  };

  const handleOpenEditLesson = (
    lesson: AdminLesson,
    initialTab: 'info' | 'content' | 'media' | 'assets' | 'miniquiz' = 'info'
  ) => {
    setEditingLesson(lesson);
    setLessonFormInitialTab(initialTab);
    setIsFormModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModalState.onCustomDelete) {
        await deleteModalState.onCustomDelete();
      } else if (deleteModalState.itemType === 'bài học') {
        const success = await deleteAdminLesson(deleteModalState.id);
        if (success) {
          showToast(`Đã xóa bài học: "${deleteModalState.name}"`);
          setLessons((prev) => prev.filter((l) => l.id !== deleteModalState.id));
        }
      } else if (deleteModalState.itemType === 'tài liệu') {
        const success = await deleteAdminAsset(
          deleteModalState.id,
          deleteModalState.storagePath
        );
        if (success) {
          showToast(`Đã xóa tệp học liệu khỏi kho lưu trữ.`);
          setDocuments((prev) => prev.filter((d) => d.id !== deleteModalState.id));
        }
      }
    } finally {
      setIsDeleting(false);
      setDeleteModalState({ isOpen: false, itemType: 'bài học', id: '', name: '' });
      loadAllData();
    }
  };

  // Export System Data as JSON
  const handleExportAllData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      siteSettings,
      topics,
      lessons,
      questions,
      quizzes,
      videos,
      catalogDocs,
      games: {
        pairs: gamePairs,
        crosswords,
        detectivePuzzles,
      },
      users: usersList,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khtn-cms-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất tệp sao lưu toàn bộ dữ liệu hệ thống (.JSON)!');
  };

  const handleResetAllToDefault = () => {
    resetAllAdminDataToDefault();
    setConfirmResetOpen(false);
    loadAllData();
    showToast('Đã khôi phục toàn bộ dữ liệu về mặc định gốc!');
  };

  // Switch active user account in localStorage
  const handleSwitchUserAccount = (targetUser: AppUser) => {
    try {
      localStorage.setItem('khtn_hoang_user', JSON.stringify(targetUser));
      showToast(`Đã chuyển phiên tài khoản sang: ${targetUser.fullName} (${targetUser.role})`);
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch {
      showToast('Không thể chuyển tài khoản.', 'error');
    }
  };

  // Filtered Lists
  const filteredLessons = lessons.filter((l) => {
    if (selectedGrade !== 'all' && l.grade !== selectedGrade) return false;
    if (selectedDomain !== 'all' && l.domain !== selectedDomain) return false;
    if (selectedStatus === 'published' && !l.isPublished) return false;
    if (selectedStatus === 'draft' && l.isPublished) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        (l.slug || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredTopics = topics.filter((t) => {
    if (topicFilterGrade !== 'all' && t.grade !== topicFilterGrade) return false;
    if (topicFilterDomain !== 'all' && t.domain !== topicFilterDomain) return false;
    return true;
  });

  const filteredQuestions = questions.filter((q) => {
    if (questionFilterGrade !== 'all' && q.grade !== questionFilterGrade) return false;
    if (questionFilterDomain !== 'all' && q.domain !== questionFilterDomain) return false;
    return true;
  });

  const filteredVideos = videos.filter((v) => {
    if (videoFilterGrade !== 'all' && v.grade !== videoFilterGrade) return false;
    return true;
  });

  const filteredDocuments = documents.filter((doc) => {
    if (docFormatFilter === 'all') return true;
    if (docFormatFilter === 'image') return ['png', 'jpg', 'jpeg', 'webp'].includes(doc.format);
    return doc.format === docFormatFilter;
  });

  // Counts
  const totalLessonsCount = lessons.length;
  const publishedCount = lessons.filter((l) => l.isPublished).length;
  const draftCount = totalLessonsCount - publishedCount;
  const totalGamesItems = gamePairs.length + crosswords.length + detectivePuzzles.length;

  const navTabs: { id: AdminTabId; label: string; count?: number; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Tổng quan & Cài đặt', icon: Layers },
    { id: 'topics', label: 'Chủ đề (Lớp 6–9)', count: topics.length, icon: FolderKanban },
    { id: 'lessons', label: 'Bài giảng', count: totalLessonsCount, icon: BookOpen },
    { id: 'sims', label: 'Mô phỏng 3D', count: SIMULATIONS_3D.length, icon: Atom },
    { id: 'quizzes', label: 'Câu hỏi & Đề thi', count: questions.length, icon: CheckSquare },
    { id: 'games', label: 'Trò chơi KHTN', count: totalGamesItems, icon: Gamepad2 },
    { id: 'videos', label: 'Video', count: videos.length, icon: Video },
    { id: 'docs', label: 'Tài liệu & Đề cương', count: catalogDocs.length + documents.length, icon: FileText },
    { id: 'users', label: 'Học sinh & Tài khoản', count: usersList.length, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumbs items={[{ label: 'Trung Tâm Quản Trị Hệ Thống Toàn Diện (CMS)' }]} />

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold ml-4"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Admin Dashboard Hero Header */}
        <div className="bg-gradient-to-br from-[#0B1F3A] via-[#122B4A] to-[#0F3443] rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-700/80 space-y-6">
          {/* Top Row: Identity & System Utilities */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            <div className="space-y-2.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-teal-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Trung tâm Quản trị Học liệu &amp; Nội dung số (Full CMS)</span>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="text-slate-300">
                  Quản trị viên: <strong className="text-white">{user?.fullName || 'Quản trị viên KHTN'}</strong> ({siteSettings.email})
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Quản Trị {siteSettings.siteName} — {siteSettings.labName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Quản lý tập trung tất cả Chủ đề, Bài giảng (Lớp 6–9), Mô phỏng 3D, Ngân hàng câu hỏi trắc nghiệm, Trò chơi học tập, Video thí nghiệm, Tài liệu và Tài khoản người dùng. Mọi thay đổi được lưu và cập nhật trực tiếp lên trang web.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
              <Link
                to="/"
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-teal-300" />
                <span>Xem trang học sinh</span>
              </Link>

              <a
                href="/khtn-source-code.zip"
                download="KHTN-Khoa-Hoc-So-Source-Code.zip"
                className="px-3.5 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-1.5 shadow-sm"
                title="Tải toàn bộ mã nguồn dự án về máy (.ZIP)"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Tải mã nguồn (.ZIP)</span>
              </a>

              <button
                onClick={handleExportAllData}
                className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-600/80 transition flex items-center gap-1.5 cursor-pointer"
                title="Tải xuống toàn bộ dữ liệu dạng JSON"
              >
                <Database className="w-3.5 h-3.5 text-sky-400" />
                <span>Sao lưu JSON</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: 4 Primary Teacher Action Cards */}
          <div className="pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => {
                setUnifiedUploadInitialTab('wizard');
                setIsUnifiedUploadOpen(true);
              }}
              data-testid="open-unified-upload-wizard-btn"
              className="group p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-left transition shadow-sm flex items-start gap-3.5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <FileUp className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs sm:text-sm text-white">
                  Tải Học Liệu (3 Bước)
                </div>
                <div className="text-[11px] text-emerald-100 mt-0.5 leading-snug">
                  Up Giáo án PPTX, Phiếu PDF/Word, Video &amp; Mô phỏng
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setUnifiedUploadInitialTab('manager');
                setIsUnifiedUploadOpen(true);
              }}
              data-testid="open-unified-resource-manager-btn"
              className="group p-4 rounded-2xl bg-sky-700 hover:bg-sky-600 text-white text-left transition shadow-sm flex items-start gap-3.5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs sm:text-sm text-white">
                  Quản Lý Học Liệu Theo Bài
                </div>
                <div className="text-[11px] text-sky-100 mt-0.5 leading-snug">
                  Duyệt kho tài nguyên theo Lớp → Chương → Bài học
                </div>
              </div>
            </button>

            <button
              onClick={handleOpenCreateLesson}
              className="group p-4 rounded-2xl bg-teal-700 hover:bg-teal-600 text-white text-left transition shadow-sm flex items-start gap-3.5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs sm:text-sm text-white">
                  Soạn Bài Học Mới
                </div>
                <div className="text-[11px] text-teal-100 mt-0.5 leading-snug">
                  Tạo bài giảng, nhúng YouTube &amp; câu hỏi cuối bài
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('quizzes');
                setIsWordImportOpen(true);
              }}
              className="group p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-left transition flex items-start gap-3.5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5 text-indigo-200" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs sm:text-sm text-white">
                  Chuyển Câu Hỏi Word (.docx)
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Tách câu hỏi Trắc nghiệm A–D, Đúng/Sai &amp; Tự luận
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Multi-Module Navigation Tabs */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            {navTabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-[#0B1F3A] dark:bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-teal-300 dark:text-white' : 'text-slate-400'}`} />
                  <span>{t.label}</span>
                  {typeof t.count === 'number' && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW & SYSTEM CONFIGURATION */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 8 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab('topics')}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-left hover:border-teal-500 transition flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Chủ đề KHTN (Lớp 6–9)
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {topics.length}
                  </div>
                  <div className="text-[11px] text-teal-700 dark:text-teal-400 font-bold pt-1">
                    Quản lý chuyên đề →
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('lessons')}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-left hover:border-teal-500 transition flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Bài giảng lý thuyết
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {totalLessonsCount}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    {publishedCount} xuất bản · {draftCount} nháp
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/70 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('sims')}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-left hover:border-teal-500 transition flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Phòng thí nghiệm 3D
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {SIMULATIONS_3D.length}
                  </div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-bold pt-1">
                    Quản lý mô phỏng 3D →
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 flex items-center justify-center shrink-0">
                  <Atom className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('quizzes')}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-left hover:border-teal-500 transition flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Ngân hàng Câu hỏi &amp; Đề
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {questions.length}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    {quizzes.length} bộ đề kiểm tra trực tuyến
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('games')}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-left hover:border-teal-500 transition flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Dữ liệu Trò chơi KHTN
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {totalGamesItems}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    {gamePairs.length} thẻ · {crosswords.length} ô chữ · {detectivePuzzles.length} mật mã
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('videos')}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-left hover:border-teal-500 transition flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Video Bài giảng &amp; TN
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {videos.length}
                  </div>
                  <div className="text-[11px] text-rose-700 dark:text-rose-400 font-bold pt-1">
                    Quản lý kho video →
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/70 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('docs')}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-left hover:border-teal-500 transition flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Kho Giáo án &amp; Học liệu
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {catalogDocs.length + documents.length}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    {catalogDocs.length} danh mục · {documents.length} tệp đính kèm
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-left hover:border-teal-500 transition flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Tài khoản &amp; Phân quyền
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {usersList.length}
                  </div>
                  <div className="text-[11px] text-teal-700 dark:text-teal-400 font-bold pt-1">
                    Quản lý giáo viên &amp; học sinh →
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
              </button>
            </div>

            {/* Grade 6-9 Curriculum Distribution Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
                    Phân Bố Học Liệu Theo Khối Lớp (KHTN 6 – 9)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bấm vào từng khối lớp để lọc và quản lý danh sách bài giảng của khối đó.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setUnifiedUploadInitialTab('manager');
                    setIsUnifiedUploadOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center transition cursor-pointer"
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Mở cây thư mục học liệu</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {([6, 7, 8, 9] as const).map((g) => {
                  const gradeLessons = lessons.filter((l) => l.grade === g);
                  const gradeTopics = topics.filter((t) => t.grade === g);
                  const gradeQuestions = questions.filter((q) => q.grade === g);
                  const gradeVideos = videos.filter((v) => v.grade === g);
                  return (
                    <div
                      key={g}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Khoa học tự nhiên {g}
                        </span>
                        <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                          {gradeLessons.length} bài
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200/70 dark:border-slate-700/70 text-center">
                        <div>
                          <div className="text-sm font-extrabold text-slate-800 dark:text-white font-mono tabular-nums">
                            {gradeTopics.length}
                          </div>
                          <div className="text-[10px] text-slate-500">Chủ đề</div>
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-800 dark:text-white font-mono tabular-nums">
                            {gradeQuestions.length}
                          </div>
                          <div className="text-[10px] text-slate-500">Câu hỏi</div>
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-800 dark:text-white font-mono tabular-nums">
                            {gradeVideos.length}
                          </div>
                          <div className="text-[10px] text-slate-500">Video</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <button
                          onClick={() => {
                            setSelectedGrade(g);
                            setActiveTab('lessons');
                          }}
                          className="font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                        >
                          Quản lý bài giảng Lớp {g} →
                        </button>
                        <Link
                          to={`/lop-${g}`}
                          className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-[11px]"
                        >
                          Xem trang
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Site Configuration Form */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-teal-600" />
                    Cấu Hình Thông Tin Website & Liên Hệ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Quản lý thông tin thương hiệu, bộ sách, địa điểm và thông tin liên hệ trên toàn hệ thống.
                  </p>
                </div>
                <button
                  onClick={() => {
                    saveSiteSettingsSync(siteSettings);
                    showToast('Đã lưu cấu hình thông tin website thành công!');
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-center shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu cấu hình</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Tên Website chính</label>
                  <input
                    type="text"
                    value={siteSettings.siteName}
                    onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Tên Phòng thí nghiệm số</label>
                  <input
                    type="text"
                    value={siteSettings.labName}
                    onChange={(e) => setSiteSettings({ ...siteSettings, labName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Bộ sách chuẩn</label>
                  <input
                    type="text"
                    value={siteSettings.bookSeries}
                    onChange={(e) => setSiteSettings({ ...siteSettings, bookSeries: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Địa điểm</label>
                  <input
                    type="text"
                    value={siteSettings.location}
                    onChange={(e) => setSiteSettings({ ...siteSettings, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Email liên hệ</label>
                  <input
                    type="email"
                    value={siteSettings.email}
                    onChange={(e) => setSiteSettings({ ...siteSettings, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 dark:text-slate-300">Số Zalo hỗ trợ</label>
                  <input
                    type="text"
                    value={siteSettings.zalo}
                    onChange={(e) => setSiteSettings({ ...siteSettings, zalo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold"
                  />
                </div>
              </div>

              {/* System Reset Box */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Muốn khôi phục toàn bộ bài học, chủ đề, câu hỏi, trò chơi về dữ liệu gốc ban đầu?
                </div>
                {!confirmResetOpen ? (
                  <button
                    onClick={() => setConfirmResetOpen(true)}
                    className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục dữ liệu mặc định</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600">Xác nhận đặt lại tất cả?</span>
                    <button
                      onClick={handleResetAllToDefault}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
                    >
                      Đồng ý Reset
                    </button>
                    <button
                      onClick={() => setConfirmResetOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TOPICS (CHỦ ĐỀ LỚP 6–9) MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'topics' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Khối lớp:</span>
                {(['all', 6, 7, 8, 9] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setTopicFilterGrade(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      topicFilterGrade === g
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {g === 'all' ? 'Tất cả' : `Lớp ${g}`}
                  </button>
                ))}
                <select
                  value={topicFilterDomain}
                  onChange={(e) => setTopicFilterDomain(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="all">Tất cả 3 phân môn</option>
                  {DOMAINS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.shortName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() =>
                  setEditingTopic({
                    grade: 8,
                    domain: 'hoa-hoc',
                    code: `CD8-0${topics.length + 1}`,
                    title: '',
                    description: '',
                    lessonCount: 6,
                    experimentCount: 2,
                  })
                }
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-center"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm chủ đề mới</span>
              </button>
            </div>

            {editingTopic && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-teal-600/60 shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {editingTopic.id ? 'Chỉnh sửa Chủ đề' : 'Thêm Chủ đề KHTN mới'}
                  </h4>
                  <button onClick={() => setEditingTopic(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300">Mã chủ đề</label>
                    <input
                      type="text"
                      value={editingTopic.code || ''}
                      onChange={(e) => setEditingTopic({ ...editingTopic, code: e.target.value })}
                      placeholder="VD: CD8-04"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300">Khối lớp</label>
                    <select
                      value={editingTopic.grade || 8}
                      onChange={(e) => setEditingTopic({ ...editingTopic, grade: Number(e.target.value) as Grade })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value={6}>Lớp 6</option>
                      <option value={7}>Lớp 7</option>
                      <option value={8}>Lớp 8</option>
                      <option value={9}>Lớp 9</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300">Phân môn KHTN</label>
                    <select
                      value={editingTopic.domain || 'hoa-hoc'}
                      onChange={(e) => setEditingTopic({ ...editingTopic, domain: e.target.value as SubjectDomain })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      {DOMAINS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.shortName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300">Tên Chủ đề</label>
                    <input
                      type="text"
                      value={editingTopic.title || ''}
                      onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                      placeholder="Nhập tên chủ đề theo sách Kết nối tri thức..."
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 dark:text-slate-300">Mô tả trọng tâm</label>
                    <textarea
                      rows={2}
                      value={editingTopic.description || ''}
                      onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                      placeholder="Mô tả tóm tắt nội dung chủ đề..."
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingTopic(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingTopic.title?.trim()) {
                        showToast('Vui lòng nhập tên chủ đề!', 'error');
                        return;
                      }
                      await saveAdminTopic({
                        ...editingTopic,
                        title: editingTopic.title,
                        grade: (editingTopic.grade as Grade) || 8,
                        domain: (editingTopic.domain as SubjectDomain) || 'hoa-hoc',
                      });
                      setEditingTopic(null);
                      await loadAllData();
                      showToast('Đã lưu chủ đề học tập thành công!');
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold"
                  >
                    Lưu chủ đề
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopics.map((t) => {
                const dom = DOMAINS.find((d) => d.id === t.domain);
                return (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono text-[11px] font-bold">
                            {t.code}
                          </span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            Lớp {t.grade} • {dom?.shortName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingTopic(t)}
                            className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/60"
                            title="Sửa chủ đề"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteModalState({
                                isOpen: true,
                                itemType: 'chủ đề',
                                id: t.id,
                                name: t.title,
                                onCustomDelete: async () => {
                                  await deleteAdminTopic(t.id);
                                  showToast(`Đã xóa chủ đề "${t.title}"`);
                                },
                              })
                            }
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60"
                            title="Xóa chủ đề"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{t.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t.description}</p>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>{t.lessonCount} bài học • {t.experimentCount} thí nghiệm</span>
                      <Link to="/chu-de" className="text-teal-600 font-bold hover:underline">
                        Xem trên trang Chủ đề →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: LESSONS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'lessons' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm theo tiêu đề bài học, mã bài hoặc slug..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Khối:
                  </span>
                  {(['all', 6, 7, 8, 9] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGrade(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        selectedGrade === g
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {g === 'all' ? 'Tất cả' : `Lớp ${g}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-500">Phân môn:</span>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="all">Tất cả 3 phân môn</option>
                    {DOMAINS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.shortName}
                      </option>
                    ))}
                  </select>

                  <span className="font-semibold text-slate-500 ml-2">Trạng thái:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="all">Tất cả ({totalLessonsCount})</option>
                    <option value="published">Đã xuất bản ({publishedCount})</option>
                    <option value="draft">Bản nháp ({draftCount})</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    Hiển thị <strong>{filteredLessons.length}</strong> bài học
                  </span>
                  {filteredLessons.some((l) => Boolean(l.videoUrl && l.videoUrl.trim())) && (
                    <button
                      onClick={async () => {
                        const targetGrade = selectedGrade === 'all' ? undefined : selectedGrade;
                        await clearAllAdminLessonVideos(targetGrade);
                        await loadAllData();
                        showToast(
                          targetGrade
                            ? `Đã xóa toàn bộ link video trong các bài giảng Lớp ${targetGrade}.`
                            : 'Đã xóa toàn bộ link video trong tất cả các bài giảng.'
                        );
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      title="Gỡ toàn bộ link video khỏi các bài giảng đang hiển thị"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {selectedGrade === 'all'
                          ? 'Xóa tất cả link Video'
                          : `Xóa link Video Lớp ${selectedGrade}`}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setUnifiedUploadInitialTab('wizard');
                      setIsUnifiedUploadOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5" /> Tải học liệu 3 bước
                  </button>
                  <button
                    onClick={handleOpenCreateLesson}
                    className="px-3 py-1.5 rounded-xl bg-teal-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm bài giảng
                  </button>
                </div>
              </div>
            </div>

            {isLoadingLessons ? (
              <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
                <p className="text-xs">Đang tải dữ liệu bài học...</p>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Không còn bài giảng nào trong bộ lọc này.
                </p>
                <p className="text-xs text-slate-400">
                  Bấm &quot;Thêm bài giảng&quot; ở góc trên nếu bạn muốn soạn bài học mới.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLessons.map((l) => {
                  const domainInfo = DOMAINS.find((d) => d.id === l.domain);
                  const hasVideo = Boolean(l.videoUrl && l.videoUrl.trim());
                  return (
                    <div
                      key={l.id}
                      className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono">
                            {l.code}
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Lớp {l.grade} • {domainInfo?.shortName}
                          </span>
                          <span className="text-xs text-slate-400">• {l.durationMinutes} phút</span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              l.isPublished
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {l.isPublished ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Đã xuất bản
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" /> Bản nháp
                              </>
                            )}
                          </span>
                          {hasVideo && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                              <Video className="w-3 h-3" /> Đang gắn link Video
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white truncate">
                          {l.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{l.summary}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                        {hasVideo && (
                          <button
                            onClick={async () => {
                              await clearAdminLessonVideo(l.id);
                              setLessons((prev) =>
                                prev.map((item) =>
                                  item.id === l.id ? { ...item, videoUrl: '' } : item
                                )
                              );
                              showToast(`Đã xóa link video khỏi bài: "${l.title}".`);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
                            title="Gỡ link video khỏi bài giảng này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa link Video</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditLesson(l, 'miniquiz')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 flex items-center gap-1 cursor-pointer"
                          title="Thêm / Sửa câu hỏi ôn tập, củng cố cuối bài"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Câu hỏi cuối bài ({(l.miniQuiz || []).length})</span>
                        </button>
                        <button
                          onClick={() => handleTogglePublish(l)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {l.isPublished ? 'Chuyển nháp' : 'Xuất bản'}
                        </button>
                        <Link
                          to={`/bai-hoc/${l.id}`}
                          className="p-2 rounded-xl text-slate-500 hover:text-teal-600 border border-slate-200 dark:border-slate-700"
                          title="Xem bài học"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditLesson(l, 'info')}
                          className="p-2 rounded-xl text-teal-600 border border-teal-200 dark:border-teal-800 hover:bg-teal-50"
                          title="Sửa bài học"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteModalState({
                              isOpen: true,
                              itemType: 'bài học',
                              id: l.id,
                              name: l.title,
                            })
                          }
                          className="p-2 rounded-xl text-red-600 border border-red-200 dark:border-red-900 hover:bg-red-50"
                          title="Xóa bài học"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: 3D SIMULATIONS */}
        {/* ============================================================== */}
        {activeTab === 'sims' && (
          <SimulationManager lessons={lessons} showToast={showToast} />
        )}

        {/* ============================================================== */}
        {/* TAB 5: QUIZZES & QUESTIONS BANK */}
        {/* ============================================================== */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuizSubTab('questions')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    quizSubTab === 'questions'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Ngân hàng Câu hỏi ({questions.length})
                </button>
                <button
                  onClick={() => setQuizSubTab('exams')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    quizSubTab === 'exams'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Bộ Đề Kiểm Tra ({quizzes.length})
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsWordImportOpen(true)}
                  data-testid="open-word-import-btn"
                  className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Nhập câu hỏi từ file Word (.docx)</span>
                </button>

                {quizSubTab === 'questions' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        setEditingQuestion({
                          grade: 8,
                          domain: 'hoa-hoc',
                          questionType: 'single_choice',
                          question: '',
                          options: ['', '', '', ''],
                          correctAnswer: 0,
                          explanation: '',
                          difficulty: 'Thông hiểu',
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm câu hỏi trắc nghiệm</span>
                    </button>

                    <button
                      onClick={() =>
                        setEditingQuestion({
                          grade: 8,
                          domain: 'hoa-hoc',
                          questionType: 'essay',
                          allowImageUpload: true,
                          question: '',
                          options: [],
                          explanation: '',
                          difficulty: 'Vận dụng',
                          points: 3.0,
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm câu hỏi tự luận (Nộp ảnh)</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setEditingQuiz({
                        grade: 8,
                        domain: 'hoa-hoc',
                        title: '',
                        durationMinutes: 15,
                        passScore: 6.0,
                        questionCount: 5,
                        isPublished: true,
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo đề kiểm tra mới</span>
                  </button>
                )}
              </div>
            </div>

            {quizSubTab === 'questions' && (
              <>
                {/* Filter bar for questions */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {(['all', 6, 7, 8, 9] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setQuestionFilterGrade(g)}
                      className={`px-3 py-1.5 rounded-xl font-bold ${
                        questionFilterGrade === g
                          ? 'bg-teal-700 text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600'
                      }`}
                    >
                      {g === 'all' ? 'Tất cả khối' : `Lớp ${g}`}
                    </button>
                  ))}
                  <select
                    value={questionFilterDomain}
                    onChange={(e) => setQuestionFilterDomain(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                  >
                    <option value="all">Tất cả phân môn</option>
                    {DOMAINS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                {editingQuestion && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-teal-600/60 shadow-md space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold">
                        {editingQuestion.id
                          ? 'Chỉnh sửa Câu hỏi'
                          : editingQuestion.questionType === 'essay'
                          ? 'Thêm Câu hỏi Tự luận (Cho phép học sinh tải file ảnh bài làm)'
                          : 'Thêm Câu hỏi Trắc nghiệm mới'}
                      </h4>
                      <button onClick={() => setEditingQuestion(null)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="font-bold">Loại câu hỏi</label>
                        <select
                          value={editingQuestion.questionType || 'single_choice'}
                          onChange={(e) => {
                            const nextType = e.target.value as any;
                            setEditingQuestion({
                              ...editingQuestion,
                              questionType: nextType,
                              allowImageUpload: nextType === 'essay' ? true : undefined,
                              options:
                                nextType === 'essay' || nextType === 'short_answer'
                                  ? []
                                  : editingQuestion.options && editingQuestion.options.length >= 2
                                  ? editingQuestion.options
                                  : ['', '', '', ''],
                              trueFalseStatements:
                                nextType === 'true_false'
                                  ? editingQuestion.trueFalseStatements &&
                                    editingQuestion.trueFalseStatements.length > 0
                                    ? editingQuestion.trueFalseStatements
                                    : [
                                        { id: 'tf_a', label: 'a', text: '', isTrue: true },
                                        { id: 'tf_b', label: 'b', text: '', isTrue: false },
                                        { id: 'tf_c', label: 'c', text: '', isTrue: true },
                                        { id: 'tf_d', label: 'd', text: '', isTrue: false },
                                      ]
                                  : undefined,
                            });
                          }}
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                        >
                          <option value="single_choice">Dạng 1: Trắc nghiệm (4 đáp án A, B, C, D)</option>
                          <option value="true_false">Dạng 2: Đúng / Sai (4 ý a, b, c, d)</option>
                          <option value="short_answer">Dạng 3: Trả lời ngắn (Điền đáp số)</option>
                          <option value="essay">Dạng 4: Tự luận (Học sinh tải ảnh bài làm)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold">Khối lớp</label>
                        <select
                          value={editingQuestion.grade || 8}
                          onChange={(e) =>
                            setEditingQuestion({ ...editingQuestion, grade: Number(e.target.value) as Grade })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          <option value={6}>Lớp 6</option>
                          <option value={7}>Lớp 7</option>
                          <option value={8}>Lớp 8</option>
                          <option value={9}>Lớp 9</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold">Phân môn</label>
                        <select
                          value={editingQuestion.domain || 'hoa-hoc'}
                          onChange={(e) =>
                            setEditingQuestion({ ...editingQuestion, domain: e.target.value as SubjectDomain })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          {DOMAINS.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.shortName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-bold">Mức độ</label>
                        <select
                          value={editingQuestion.difficulty || 'Thông hiểu'}
                          onChange={(e) =>
                            setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          <option value="Nhận biết">Nhận biết</option>
                          <option value="Thông hiểu">Thông hiểu</option>
                          <option value="Vận dụng">Vận dụng</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="font-bold">Nội dung câu hỏi (Chuẩn danh pháp IUPAC)</label>
                        <button
                          type="button"
                          data-testid="admin-open-formula-editor-btn"
                          onClick={() => {
                            setAdminFormulaTarget('question');
                            setIsAdminFormulaOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <span>∑ CÔNG THỨC</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={editingQuestion.question || ''}
                        onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                        placeholder={
                          editingQuestion.questionType === 'essay'
                            ? 'Nhập đề bài tự luận (yêu cầu học sinh trình bày lời giải hoặc chụp ảnh bài làm)...'
                            : 'Nhập câu hỏi...'
                        }
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                      />
                    </div>

                    {editingQuestion.questionType === 'essay' ? (
                      <div className="p-3.5 rounded-2xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-200 flex items-center justify-between gap-3">
                        <div>
                          <span className="font-extrabold block">
                            Định dạng Câu hỏi Tự luận: Hỗ trợ học sinh tải file ảnh bài giải (.jpg, .png, .webp)
                          </span>
                          <span className="text-[11px] text-violet-700 dark:text-violet-300">
                            Khi làm bài trên trang Luyện tập, học sinh sẽ có khung tải lên ảnh chụp bài làm viết tay và ô nhập lời giải tự luận.
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-violet-600 text-white font-bold text-[11px] shrink-0">
                          Cho phép up ảnh
                        </span>
                      </div>
                    ) : editingQuestion.questionType === 'short_answer' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <div>
                          <label className="font-bold block mb-1">Đáp án chuẩn (Số hoặc biểu thức ngắn)</label>
                          <input
                            type="text"
                            value={editingQuestion.shortAnswer || ''}
                            onChange={(e) =>
                              setEditingQuestion({ ...editingQuestion, shortAnswer: e.target.value })
                            }
                            placeholder="Ví dụ: 2,48"
                            className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-bold block mb-1">Đơn vị (tùy chọn)</label>
                          <input
                            type="text"
                            value={editingQuestion.shortAnswerUnit || ''}
                            onChange={(e) =>
                              setEditingQuestion({ ...editingQuestion, shortAnswerUnit: e.target.value })
                            }
                            placeholder="Ví dụ: lít, gam, mol, Ω..."
                            className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    ) : editingQuestion.questionType === 'true_false' &&
                      editingQuestion.trueFalseStatements &&
                      editingQuestion.trueFalseStatements.length > 0 ? (
                      <div className="space-y-2 p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
                        <label className="font-extrabold block text-sky-900 dark:text-sky-200">
                          Các phát biểu Đúng / Sai (a, b, c, d):
                        </label>
                        {editingQuestion.trueFalseStatements.map((stmt, sIdx) => (
                          <div key={stmt.id} className="flex items-center gap-2">
                            <span className="font-extrabold w-6 text-sky-700">{stmt.label})</span>
                            <input
                              type="text"
                              value={stmt.text}
                              onChange={(e) => {
                                const nextStmts = [...(editingQuestion.trueFalseStatements || [])];
                                nextStmts[sIdx] = { ...stmt, text: e.target.value };
                                setEditingQuestion({
                                  ...editingQuestion,
                                  trueFalseStatements: nextStmts,
                                });
                              }}
                              placeholder={`Nội dung phát biểu ${stmt.label})...`}
                              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextStmts = [...(editingQuestion.trueFalseStatements || [])];
                                nextStmts[sIdx] = { ...stmt, isTrue: true };
                                setEditingQuestion({
                                  ...editingQuestion,
                                  trueFalseStatements: nextStmts,
                                });
                              }}
                              className={`px-2.5 py-1 rounded-lg font-bold ${
                                stmt.isTrue === true
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-600'
                              }`}
                            >
                              Đúng
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextStmts = [...(editingQuestion.trueFalseStatements || [])];
                                nextStmts[sIdx] = { ...stmt, isTrue: false };
                                setEditingQuestion({
                                  ...editingQuestion,
                                  trueFalseStatements: nextStmts,
                                });
                              }}
                              className={`px-2.5 py-1 rounded-lg font-bold ${
                                stmt.isTrue === false
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-600'
                              }`}
                            >
                              Sai
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(editingQuestion.options || ['', '', '', '']).map((opt, idx) => (
                          <div key={idx} className="space-y-1">
                            <label className="font-bold flex items-center justify-between">
                              <span>Phương án {String.fromCharCode(65 + idx)}</span>
                              <label className="flex items-center gap-1 text-teal-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name="correctOption"
                                  checked={(editingQuestion.correctAnswer ?? 0) === idx}
                                  onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: idx })}
                                />
                                <span>Đáp án đúng</span>
                              </label>
                            </label>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const nextOpts = [...(editingQuestion.options || ['', '', '', ''])];
                                nextOpts[idx] = e.target.value;
                                setEditingQuestion({ ...editingQuestion, options: nextOpts });
                              }}
                              placeholder={`Nội dung đáp án ${String.fromCharCode(65 + idx)}...`}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="font-bold">
                          Lời giải ngắn gọn, mạch lạc (Đi thẳng vào công thức, phép tính và đáp án)
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminFormulaTarget('explanation');
                              setIsAdminFormulaOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 font-bold text-[11px] hover:bg-teal-50 cursor-pointer"
                          >
                            ∑ Chèn công thức vào lời giải
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const qText = editingQuestion.question || 'Bài tập Khoa học tự nhiên';
                              const opts = editingQuestion.options || [];
                              const cIdx = editingQuestion.correctAnswer ?? 0;
                              const dom = (editingQuestion.domain as SubjectDomain) || 'hoa-hoc';
                              const gr = (editingQuestion.grade as Grade) || 8;
                              const qType = editingQuestion.questionType || 'single_choice';
                              const steps = generateStepByStepSolution({
                                question: qText,
                                options: opts,
                                correctAnswer: cIdx,
                                questionType: qType,
                                domain: dom,
                                grade: gr,
                              });
                              const exp = generateDetailedExplanation({
                                question: qText,
                                options: opts,
                                correctAnswer: cIdx,
                                questionType: qType,
                                domain: dom,
                                grade: gr,
                              });
                              setEditingQuestion({
                                ...editingQuestion,
                                explanation: exp,
                                solutionSteps: steps,
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-[11px] hover:bg-teal-200 transition cursor-pointer"
                          >
                            ✨ Tạo lời giải ngắn gọn
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={4}
                        value={editingQuestion.explanation || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingQuestion({
                            ...editingQuestion,
                            explanation: val,
                            solutionSteps: parseExplanationIntoSteps(val, undefined, {
                              question: editingQuestion.question || '',
                              options: editingQuestion.options || [],
                              correctAnswer: editingQuestion.correctAnswer,
                              questionType: editingQuestion.questionType,
                              domain: editingQuestion.domain as SubjectDomain,
                              grade: editingQuestion.grade as Grade,
                            }),
                          });
                        }}
                        placeholder={`Nhập lời giải ngắn gọn, mạch lạc:\nn_Zn = 6,5 / 65 = 0,1 mol.\nPTHH: Zn + H₂SO₄ → ZnSO₄ + H₂↑\nĐáp án: B.`}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingQuestion(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={async () => {
                          if (!editingQuestion.question?.trim()) {
                            showToast('Vui lòng nhập nội dung câu hỏi!', 'error');
                            return;
                          }
                          const qType = editingQuestion.questionType || 'single_choice';
                          const dom = (editingQuestion.domain as SubjectDomain) || 'hoa-hoc';
                          const gr = (editingQuestion.grade as Grade) || 8;
                          const steps = parseExplanationIntoSteps(
                            editingQuestion.explanation || '',
                            editingQuestion.solutionSteps,
                            {
                              question: editingQuestion.question,
                              options: editingQuestion.options || [],
                              correctAnswer: editingQuestion.correctAnswer,
                              questionType: qType,
                              domain: dom,
                              grade: gr,
                            }
                          );
                          await saveAdminQuestion({
                            ...editingQuestion,
                            question: editingQuestion.question,
                            grade: gr,
                            domain: dom,
                            questionType: qType,
                            allowImageUpload: qType === 'essay' ? true : undefined,
                            solutionSteps: steps,
                            explanation:
                              editingQuestion.explanation?.trim() ||
                              generateDetailedExplanation({
                                question: editingQuestion.question,
                                options: editingQuestion.options || [],
                                correctAnswer: editingQuestion.correctAnswer ?? 0,
                                questionType: qType,
                                domain: dom,
                                grade: gr,
                              }),
                          });
                          setEditingQuestion(null);
                          await loadAllData();
                          showToast('Đã lưu câu hỏi kèm lời giải chi tiết vào ngân hàng đề!');
                        }}
                        className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold"
                      >
                        Lưu câu hỏi
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {filteredQuestions.map((q, index) => {
                    const isEssay = q.questionType === 'essay';
                    const isShortAnswer = q.questionType === 'short_answer';
                    const isFourStatementTF =
                      q.questionType === 'true_false' &&
                      Array.isArray(q.trueFalseStatements) &&
                      q.trueFalseStatements.length > 0;
                    const stepsList = parseExplanationIntoSteps(q.explanation, q.solutionSteps, {
                      question: q.question,
                      options: q.options,
                      correctAnswer: q.correctAnswer,
                      questionType: q.questionType,
                      domain: q.domain,
                      grade: q.grade,
                    });
                    return (
                      <div
                        key={q.id}
                        className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold">
                                Câu #{index + 1}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                  isEssay
                                    ? 'bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300'
                                    : isShortAnswer
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                    : isFourStatementTF
                                    ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                                    : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                                }`}
                              >
                                {isEssay
                                  ? 'Dạng 4: Tự luận'
                                  : isShortAnswer
                                  ? 'Dạng 3: Trả lời ngắn'
                                  : isFourStatementTF
                                  ? 'Dạng 2: Đúng/Sai (4 ý)'
                                  : 'Dạng 1: Trắc nghiệm'}
                              </span>
                              <span className="font-bold text-teal-700 dark:text-teal-400">
                                Lớp {q.grade} • {DOMAINS.find((d) => d.id === q.domain)?.shortName}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[11px] font-bold">
                                {q.difficulty}
                              </span>
                            </div>
                            <h4 className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-white whitespace-pre-line">
                              {renderFormattedMathAndChem(q.question)}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setEditingQuestion(q)}
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50"
                              title="Sửa câu hỏi"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteModalState({
                                  isOpen: true,
                                  itemType: 'câu hỏi',
                                  id: q.id,
                                  name: q.question,
                                  onCustomDelete: async () => {
                                    await deleteAdminQuestion(q.id);
                                    showToast('Đã xóa câu hỏi.');
                                  },
                                })
                              }
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                              title="Xóa câu hỏi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {isEssay ? (
                          <div className="px-3.5 py-2 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-xs text-violet-800 dark:text-violet-200 font-semibold">
                            📷 Định dạng Tự luận: Học sinh được tải lên file ảnh bài làm (.jpg, .png) và nhập lời giải chi tiết.
                          </div>
                        ) : isShortAnswer ? (
                          <div className="px-3.5 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-bold">
                            Đáp án trả lời ngắn:{' '}
                            <span className="font-mono text-emerald-700 dark:text-emerald-300">
                              {q.shortAnswer || '(Chưa nhập)'}
                            </span>
                            {q.shortAnswerUnit ? ` (${q.shortAnswerUnit})` : ''}
                          </div>
                        ) : isFourStatementTF ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {(q.trueFalseStatements || []).map((stmt) => (
                              <div
                                key={stmt.id}
                                className="px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 flex items-center justify-between gap-2 font-serif"
                              >
                                <span>
                                  <strong>{stmt.label})</strong> {renderFormattedMathAndChem(stmt.text)}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded font-sans font-extrabold text-[10px] ${
                                    stmt.isTrue === true
                                      ? 'bg-emerald-600 text-white'
                                      : stmt.isTrue === false
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-amber-500 text-white'
                                  }`}
                                >
                                  {stmt.isTrue === true ? 'Đúng' : stmt.isTrue === false ? 'Sai' : '?'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {q.options.map((opt, idx) => {
                              const isCorrect =
                                q.correctAnswer === idx ||
                                (Array.isArray(q.correctAnswers) && q.correctAnswers.includes(idx));
                              return (
                                <div
                                  key={idx}
                                  className={`px-3 py-1.5 rounded-xl border font-serif ${
                                    isCorrect
                                      ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  {String.fromCharCode(65 + idx)}. {renderFormattedMathAndChem(opt)} {isCorrect && '✓'}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {stepsList.length > 0 && (
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#c8dfee] dark:border-slate-700">
                            <ScientificSolutionView
                              steps={stepsList}
                              questionText={q.question}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {quizSubTab === 'exams' && (
              <div className="space-y-4">
                {editingQuiz && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-teal-600/60 shadow-md space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold">
                        {editingQuiz.id ? 'Chỉnh sửa Đề kiểm tra' : 'Tạo Bộ Đề Kiểm Tra mới'}
                      </h4>
                      <button onClick={() => setEditingQuiz(null)}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="font-bold">Tiêu đề Đề kiểm tra</label>
                        <input
                          type="text"
                          value={editingQuiz.title || ''}
                          onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                          placeholder="VD: Kiểm tra 15 phút - Acid, Base và Thang pH"
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="font-bold">Thời gian (phút)</label>
                        <input
                          type="number"
                          value={editingQuiz.durationMinutes || 15}
                          onChange={(e) =>
                            setEditingQuiz({ ...editingQuiz, durationMinutes: Number(e.target.value) })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="font-bold">Khối lớp</label>
                        <select
                          value={editingQuiz.grade || 8}
                          onChange={(e) =>
                            setEditingQuiz({ ...editingQuiz, grade: Number(e.target.value) as Grade })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          <option value={6}>Lớp 6</option>
                          <option value={7}>Lớp 7</option>
                          <option value={8}>Lớp 8</option>
                          <option value={9}>Lớp 9</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold">Phân môn</label>
                        <select
                          value={editingQuiz.domain || 'hoa-hoc'}
                          onChange={(e) =>
                            setEditingQuiz({ ...editingQuiz, domain: e.target.value as SubjectDomain })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          {DOMAINS.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.shortName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-bold">Điểm đạt chuẩn (/10)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={editingQuiz.passScore || 6.0}
                          onChange={(e) =>
                            setEditingQuiz({ ...editingQuiz, passScore: Number(e.target.value) })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingQuiz(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={async () => {
                          if (!editingQuiz.title?.trim()) {
                            showToast('Vui lòng nhập tên đề kiểm tra!', 'error');
                            return;
                          }
                          await saveAdminQuiz({
                            ...editingQuiz,
                            title: editingQuiz.title,
                            grade: (editingQuiz.grade as Grade) || 8,
                            domain: (editingQuiz.domain as SubjectDomain) || 'hoa-hoc',
                          });
                          setEditingQuiz(null);
                          await loadAllData();
                          showToast('Đã lưu đề kiểm tra!');
                        }}
                        className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold"
                      >
                        Lưu đề kiểm tra
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizzes.map((qz) => (
                    <div
                      key={qz.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-teal-700 dark:text-teal-400">
                          Lớp {qz.grade} • {DOMAINS.find((d) => d.id === qz.domain)?.shortName} • {qz.durationMinutes} phút
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{qz.title}</h4>
                        <div className="text-[11px] text-slate-400">
                          Điểm đạt: {qz.passScore}/10 • <Link to="/luyen-tap" className="text-sky-600 hover:underline">Mở trang Luyện tập →</Link>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingQuiz(qz)}
                          className="p-2 rounded-xl text-teal-600 hover:bg-teal-50 border border-teal-200 dark:border-teal-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteModalState({
                              isOpen: true,
                              itemType: 'đề kiểm tra',
                              id: qz.id,
                              name: qz.title,
                              onCustomDelete: async () => {
                                await deleteAdminQuiz(qz.id);
                                showToast('Đã xóa đề kiểm tra.');
                              },
                            })
                          }
                          className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 dark:border-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: SCIENCE GAMES (GHÉP THẺ, Ô CHỮ, THÁM TỬ) MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'games' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setGameSubTab('pairs')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    gameSubTab === 'pairs'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  1. Ghép Thẻ Tri Thức ({gamePairs.length})
                </button>
                <button
                  onClick={() => setGameSubTab('crosswords')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    gameSubTab === 'crosswords'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  2. Giải Mã Ô Chữ ({crosswords.length})
                </button>
                <button
                  onClick={() => setGameSubTab('detective')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    gameSubTab === 'detective'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  3. Thám Tử Công Thức ({detectivePuzzles.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/tro-choi"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Chơi thử
                </Link>
                {gameSubTab === 'pairs' && (
                  <button
                    onClick={() =>
                      setEditingPair({ grade: 8, domain: 'hoa-hoc', term: '', definition: '', explanation: '' })
                    }
                    className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Thêm cặp thẻ
                  </button>
                )}
                {gameSubTab === 'crosswords' && (
                  <button
                    onClick={() =>
                      setEditingCrossword({
                        grade: 8,
                        domain: 'hoa-hoc',
                        displayTerm: '',
                        answer: '',
                        clue: '',
                        scientificHint: '',
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Thêm hàng ô chữ
                  </button>
                )}
                {gameSubTab === 'detective' && (
                  <button
                    onClick={() =>
                      setEditingDetective({
                        grade: 8,
                        domain: 'hoa-hoc',
                        clue: '',
                        displayAnswer: '',
                        displayFormula: '',
                        scientificHint: '',
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Thêm mật mã thám tử
                  </button>
                )}
              </div>
            </div>

            {/* Sub-tab 1: Memory Match Pairs */}
            {gameSubTab === 'pairs' && (
              <div className="space-y-4">
                {editingPair && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-teal-600/60 space-y-3 text-xs">
                    <h4 className="font-extrabold text-sm">
                      {editingPair.id ? 'Chỉnh sửa Cặp thẻ' : 'Thêm Cặp thẻ Ghép đôi mới'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold">Mặt A (Thuật ngữ / Ký hiệu / Công thức)</label>
                        <input
                          type="text"
                          value={editingPair.term || ''}
                          onChange={(e) => setEditingPair({ ...editingPair, term: e.target.value })}
                          placeholder="VD: NaOH"
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold">Mặt B (Tên chuẩn IUPAC / Định nghĩa)</label>
                        <input
                          type="text"
                          value={editingPair.definition || ''}
                          onChange={(e) => setEditingPair({ ...editingPair, definition: e.target.value })}
                          placeholder="VD: Sodium hydroxide (Base kiềm mạnh)"
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="font-bold">Khối lớp</label>
                        <select
                          value={editingPair.grade || 8}
                          onChange={(e) => setEditingPair({ ...editingPair, grade: Number(e.target.value) as Grade })}
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          <option value={6}>Lớp 6</option>
                          <option value={7}>Lớp 7</option>
                          <option value={8}>Lớp 8</option>
                          <option value={9}>Lớp 9</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold">Phân môn</label>
                        <select
                          value={editingPair.domain || 'hoa-hoc'}
                          onChange={(e) => setEditingPair({ ...editingPair, domain: e.target.value as SubjectDomain })}
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          {DOMAINS.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.shortName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingPair(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={async () => {
                          if (!editingPair.term?.trim() || !editingPair.definition?.trim()) {
                            showToast('Vui lòng nhập đủ 2 mặt thẻ!', 'error');
                            return;
                          }
                          await saveAdminGamePair({
                            ...editingPair,
                            term: editingPair.term,
                            definition: editingPair.definition,
                            grade: (editingPair.grade as Grade) || 8,
                            domain: (editingPair.domain as SubjectDomain) || 'hoa-hoc',
                          });
                          setEditingPair(null);
                          await loadAllData();
                          showToast('Đã lưu cặp thẻ trò chơi!');
                        }}
                        className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold"
                      >
                        Lưu cặp thẻ
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gamePairs.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 text-xs">
                        <span className="font-bold text-teal-700 dark:text-teal-400">
                          Lớp {p.grade} • {DOMAINS.find((d) => d.id === p.domain)?.shortName}
                        </span>
                        <div className="font-extrabold text-sm text-slate-800 dark:text-white">
                          {p.term} ↔ <span className="text-sky-700 dark:text-sky-300">{p.definition}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{p.explanation}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingPair(p)}
                          className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            await deleteAdminGamePair(p.id);
                            await loadAllData();
                            showToast('Đã xóa cặp thẻ.');
                          }}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-tab 2: Crosswords */}
            {gameSubTab === 'crosswords' && (
              <div className="space-y-4">
                {editingCrossword && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-teal-600/60 space-y-3 text-xs">
                    <h4 className="font-extrabold text-sm">
                      {editingCrossword.id ? 'Chỉnh sửa Hàng Ô Chữ' : 'Thêm Hàng Ô Chữ KHTN mới'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold">Từ khóa hiển thị</label>
                        <input
                          type="text"
                          value={editingCrossword.displayTerm || ''}
                          onChange={(e) => setEditingCrossword({ ...editingCrossword, displayTerm: e.target.value })}
                          placeholder="VD: Oxygen (O₂)"
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold">Khối lớp</label>
                        <select
                          value={editingCrossword.grade || 8}
                          onChange={(e) =>
                            setEditingCrossword({ ...editingCrossword, grade: Number(e.target.value) as Grade })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          <option value={6}>Lớp 6</option>
                          <option value={7}>Lớp 7</option>
                          <option value={8}>Lớp 8</option>
                          <option value={9}>Lớp 9</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold">Phân môn</label>
                        <select
                          value={editingCrossword.domain || 'hoa-hoc'}
                          onChange={(e) =>
                            setEditingCrossword({ ...editingCrossword, domain: e.target.value as SubjectDomain })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          {DOMAINS.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.shortName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="font-bold">Câu hỏi gợi ý mở ô chữ</label>
                      <input
                        type="text"
                        value={editingCrossword.clue || ''}
                        onChange={(e) => setEditingCrossword({ ...editingCrossword, clue: e.target.value })}
                        placeholder="Nhập câu hỏi gợi ý..."
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingCrossword(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={async () => {
                          if (!editingCrossword.displayTerm?.trim() || !editingCrossword.clue?.trim()) {
                            showToast('Vui lòng nhập từ khóa và gợi ý!', 'error');
                            return;
                          }
                          await saveAdminCrossword({
                            ...editingCrossword,
                            displayTerm: editingCrossword.displayTerm,
                            clue: editingCrossword.clue,
                            grade: (editingCrossword.grade as Grade) || 8,
                            domain: (editingCrossword.domain as SubjectDomain) || 'hoa-hoc',
                          });
                          setEditingCrossword(null);
                          await loadAllData();
                          showToast('Đã lưu hàng ô chữ KHTN!');
                        }}
                        className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold"
                      >
                        Lưu ô chữ
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {crosswords.map((cw) => (
                    <div
                      key={cw.id}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono font-bold">
                            {cw.answer}
                          </span>
                          <span className="font-bold text-slate-600">
                            ({cw.displayTerm}) • Lớp {cw.grade}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{cw.clue}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingCrossword(cw)}
                          className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            await deleteAdminCrossword(cw.id);
                            await loadAllData();
                            showToast('Đã xóa hàng ô chữ.');
                          }}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-tab 3: Formula Detective */}
            {gameSubTab === 'detective' && (
              <div className="space-y-4">
                {editingDetective && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-teal-600/60 space-y-3 text-xs">
                    <h4 className="font-extrabold text-sm">
                      {editingDetective.id ? 'Chỉnh sửa Mật mã Thám tử' : 'Thêm Mật mã Thám tử mới'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold">Đáp án thuật ngữ (IUPAC)</label>
                        <input
                          type="text"
                          value={editingDetective.displayAnswer || ''}
                          onChange={(e) =>
                            setEditingDetective({ ...editingDetective, displayAnswer: e.target.value })
                          }
                          placeholder="VD: SODIUM"
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold">Công thức / Ký hiệu hiển thị</label>
                        <input
                          type="text"
                          value={editingDetective.displayFormula || ''}
                          onChange={(e) =>
                            setEditingDetective({ ...editingDetective, displayFormula: e.target.value })
                          }
                          placeholder="VD: Na (Z = 11)"
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label className="font-bold">Khối lớp</label>
                        <select
                          value={editingDetective.grade || 8}
                          onChange={(e) =>
                            setEditingDetective({ ...editingDetective, grade: Number(e.target.value) as Grade })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          <option value={6}>Lớp 6</option>
                          <option value={7}>Lớp 7</option>
                          <option value={8}>Lớp 8</option>
                          <option value={9}>Lớp 9</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="font-bold">Dữ kiện thực nghiệm / Hiện tượng</label>
                      <input
                        type="text"
                        value={editingDetective.clue || ''}
                        onChange={(e) => setEditingDetective({ ...editingDetective, clue: e.target.value })}
                        placeholder="Nhập dữ kiện hiện tượng khoa học..."
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingDetective(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={async () => {
                          if (!editingDetective.displayAnswer?.trim() || !editingDetective.clue?.trim()) {
                            showToast('Vui lòng nhập đáp án và dữ kiện!', 'error');
                            return;
                          }
                          await saveAdminDetectivePuzzle({
                            ...editingDetective,
                            displayAnswer: editingDetective.displayAnswer,
                            clue: editingDetective.clue,
                            grade: (editingDetective.grade as Grade) || 8,
                            domain: (editingDetective.domain as SubjectDomain) || 'hoa-hoc',
                          });
                          setEditingDetective(null);
                          await loadAllData();
                          showToast('Đã lưu mật mã Thám tử!');
                        }}
                        className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold"
                      >
                        Lưu mật mã
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detectivePuzzles.map((det) => (
                    <div
                      key={det.id}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                            {det.answer}
                          </span>
                          <span className="font-bold text-slate-600">
                            {det.displayFormula} • Lớp {det.grade}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{det.clue}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setEditingDetective(det)}
                          className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            await deleteAdminDetectivePuzzle(det.id);
                            await loadAllData();
                            showToast('Đã xóa mật mã thám tử.');
                          }}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: VIDEOS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'videos' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 6, 7, 8, 9] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setVideoFilterGrade(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      videoFilterGrade === g
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {g === 'all' ? 'Tất cả khối' : `Lớp ${g}`}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setEditingVideo({
                    grade: 8,
                    domain: 'hoa-hoc',
                    title: '',
                    youtubeId: 'dQw4w9WgXcQ',
                    duration: '12:45',
                    experimentType: 'Thí nghiệm thực hành',
                    instructor: 'KHOA HỌC SỐ KHTN',
                    description: '',
                  })
                }
                className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm Video mới
              </button>
            </div>

            {editingVideo && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-teal-600/60 shadow-md space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold">
                    {editingVideo.id ? 'Chỉnh sửa Video' : 'Thêm Video Bài giảng / Thí nghiệm mới'}
                  </h4>
                  <button onClick={() => setEditingVideo(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-bold">Tiêu đề Video</label>
                    <input
                      type="text"
                      value={editingVideo.title || ''}
                      onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                      placeholder="Nhập tiêu đề video thí nghiệm..."
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold">YouTube URL hoặc ID</label>
                    <input
                      type="text"
                      value={editingVideo.youtubeId || ''}
                      onChange={(e) => setEditingVideo({ ...editingVideo, youtubeId: e.target.value })}
                      placeholder="VD: dQw4w9WgXcQ"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Khối lớp</label>
                    <select
                      value={editingVideo.grade || 8}
                      onChange={(e) => setEditingVideo({ ...editingVideo, grade: Number(e.target.value) as Grade })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value={6}>Lớp 6</option>
                      <option value={7}>Lớp 7</option>
                      <option value={8}>Lớp 8</option>
                      <option value={9}>Lớp 9</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold">Phân môn</label>
                    <select
                      value={editingVideo.domain || 'hoa-hoc'}
                      onChange={(e) =>
                        setEditingVideo({ ...editingVideo, domain: e.target.value as SubjectDomain })
                      }
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      {DOMAINS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.shortName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold">Thời lượng</label>
                    <input
                      type="text"
                      value={editingVideo.duration || '12:30'}
                      onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold">Mô tả nội dung video</label>
                  <input
                    type="text"
                    value={editingVideo.description || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                    placeholder="Mô tả tóm tắt nội dung thí nghiệm..."
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingVideo(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingVideo.title?.trim()) {
                        showToast('Vui lòng nhập tiêu đề video!', 'error');
                        return;
                      }
                      await saveAdminVideo({
                        ...editingVideo,
                        title: editingVideo.title,
                        grade: (editingVideo.grade as Grade) || 8,
                        domain: (editingVideo.domain as SubjectDomain) || 'hoa-hoc',
                        youtubeId: editingVideo.youtubeId || 'dQw4w9WgXcQ',
                      });
                      setEditingVideo(null);
                      await loadAllData();
                      showToast('Đã lưu video thành công!');
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold"
                  >
                    Lưu Video
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVideos.map((v) => (
                <div
                  key={v.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between gap-3"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                        {v.experimentType}
                      </span>
                      <span className="font-bold text-slate-600">
                        Lớp {v.grade} • {DOMAINS.find((d) => d.id === v.domain)?.shortName} • {v.duration}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{v.title}</h4>
                    <p className="text-slate-500 line-clamp-2">{v.description}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingVideo(v)}
                      className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteModalState({
                          isOpen: true,
                          itemType: 'video',
                          id: v.id,
                          name: v.title,
                          onCustomDelete: async () => {
                            await deleteAdminVideo(v.id);
                            showToast('Đã xóa video.');
                          },
                        })
                      }
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: DOCUMENTS & STORAGE */}
        {/* ============================================================== */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDocSubTab('catalog')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    docSubTab === 'catalog'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  Đề cương & Tài liệu Học tập ({catalogDocs.length})
                </button>
                <button
                  onClick={() => setDocSubTab('storage')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    docSubTab === 'storage'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  Tệp Đính kèm Bài giảng ({documents.length})
                </button>
              </div>

              {docSubTab === 'catalog' && (
                <button
                  onClick={() =>
                    setEditingCatalogDoc({
                      grade: 8,
                      domain: 'hoa-hoc',
                      title: '',
                      format: 'pdf',
                      type: 'Đề cương ôn tập',
                      pageCount: 15,
                      fileSize: '3.2 MB',
                      description: '',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Thêm đề cương mới
                </button>
              )}
            </div>

            {docSubTab === 'catalog' && (
              <div className="space-y-4">
                {editingCatalogDoc && (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-teal-600/60 space-y-4 text-xs">
                    <h4 className="font-extrabold text-sm">
                      {editingCatalogDoc.id ? 'Chỉnh sửa Tài liệu' : 'Thêm Tài liệu / Giáo án / Phiếu học tập mới'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="font-bold">Tên Tài liệu / Giáo án / Phiếu học tập</label>
                        <input
                          type="text"
                          value={editingCatalogDoc.title || ''}
                          onChange={(e) => setEditingCatalogDoc({ ...editingCatalogDoc, title: e.target.value })}
                          placeholder="Nhập tên tài liệu..."
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="font-bold">Phân loại học liệu</label>
                        <select
                          value={editingCatalogDoc.type || 'Giáo án điện tử'}
                          onChange={(e) => setEditingCatalogDoc({ ...editingCatalogDoc, type: e.target.value as any })}
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                        >
                          <option value="Giáo án điện tử">Giáo án điện tử</option>
                          <option value="Phiếu học tập">Phiếu học tập</option>
                          <option value="Đề cương ôn tập">Đề cương ôn tập</option>
                          <option value="Sổ tay công thức">Sổ tay công thức</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold">Định dạng</label>
                        <select
                          value={editingCatalogDoc.format || 'pdf'}
                          onChange={(e) => setEditingCatalogDoc({ ...editingCatalogDoc, format: e.target.value as any })}
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          <option value="pdf">PDF</option>
                          <option value="pptx">PPTX (PowerPoint)</option>
                          <option value="docx">DOCX (Word)</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold">Khối lớp</label>
                        <select
                          value={editingCatalogDoc.grade || 8}
                          onChange={(e) =>
                            setEditingCatalogDoc({ ...editingCatalogDoc, grade: Number(e.target.value) as Grade })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          <option value={6}>Lớp 6</option>
                          <option value={7}>Lớp 7</option>
                          <option value={8}>Lớp 8</option>
                          <option value={9}>Lớp 9</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold">Phân môn</label>
                        <select
                          value={editingCatalogDoc.domain || 'hoa-hoc'}
                          onChange={(e) =>
                            setEditingCatalogDoc({ ...editingCatalogDoc, domain: e.target.value as SubjectDomain })
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          {DOMAINS.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.shortName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-bold block">Tải tệp gốc từ máy tính (.pptx, .pdf, .docx)</label>
                        <div className="mt-1 flex items-center gap-2">
                          <label className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-extrabold flex items-center gap-1.5 cursor-pointer transition shrink-0">
                            <FileUp className="w-4 h-4" />
                            <span>Chọn tệp từ máy tính</span>
                            <input
                              type="file"
                              accept=".ppt,.pptx,.pdf,.doc,.docx"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const uploaded = await uploadLessonDocument(
                                    file,
                                    editingCatalogDoc.lessonId || 'general-library'
                                  );
                                  if (uploaded) {
                                    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
                                    const fmt: 'pptx' | 'pdf' | 'docx' =
                                      ext === 'pptx' || ext === 'ppt'
                                        ? 'pptx'
                                        : ext === 'docx' || ext === 'doc'
                                        ? 'docx'
                                        : 'pdf';
                                    setEditingCatalogDoc((prev) => ({
                                      ...prev,
                                      title: prev?.title?.trim()
                                        ? prev.title
                                        : file.name.replace(/\.[^/.]+$/, ''),
                                      format: fmt,
                                      fileSize: uploaded.sizeFormatted,
                                      fileUrl: uploaded.publicUrl,
                                      downloadUrl: uploaded.publicUrl,
                                      fileName: uploaded.fileName || file.name,
                                    }));
                                    showToast(`Đã đính kèm tệp "${file.name}" (${uploaded.sizeFormatted})`);
                                  }
                                } catch (err: any) {
                                  showToast(err?.message || 'Lỗi tải tệp lên', 'error');
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <span className="text-[11px] text-slate-500 truncate">
                            {editingCatalogDoc.fileName
                              ? `Đã chọn: ${editingCatalogDoc.fileName} (${editingCatalogDoc.fileSize})`
                              : isRealUploadedFileUrl(editingCatalogDoc.fileUrl || editingCatalogDoc.downloadUrl)
                              ? 'Đã có tệp gốc đính kèm'
                              : 'Chưa chọn tệp'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="font-bold">Mô tả tài liệu</label>
                      <input
                        type="text"
                        value={editingCatalogDoc.description || ''}
                        onChange={(e) => setEditingCatalogDoc({ ...editingCatalogDoc, description: e.target.value })}
                        placeholder="Mô tả nội dung tài liệu..."
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingCatalogDoc(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={async () => {
                          if (!editingCatalogDoc.title?.trim()) {
                            showToast('Vui lòng nhập tên tài liệu!', 'error');
                            return;
                          }
                          await saveAdminCatalogDoc({
                            ...editingCatalogDoc,
                            title: editingCatalogDoc.title,
                            grade: (editingCatalogDoc.grade as Grade) || 8,
                            domain: (editingCatalogDoc.domain as SubjectDomain) || 'hoa-hoc',
                          });
                          setEditingCatalogDoc(null);
                          await loadAllData();
                          showToast('Đã lưu tài liệu vào kho học liệu!');
                        }}
                        className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold"
                      >
                        Lưu tài liệu
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catalogDocs.map((doc) => {
                    const docData = createDocumentDataFromCatalogItem(doc);
                    const hasRealFile = docData.hasTeacherFile;
                    return (
                      <div
                        key={doc.id}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 text-xs min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 font-bold uppercase">
                              {docData.format}
                            </span>
                            <span className="font-bold text-slate-600">
                              Lớp {doc.grade} • {doc.type} • {docData.fileSize}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                hasRealFile
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {hasRealFile ? `Đã có file (${docData.downloadFileName})` : 'Chưa tải file lên'}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
                            {doc.title}
                          </h4>
                          <p className="text-slate-500 line-clamp-1">{doc.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasRealFile && (
                            <button
                              onClick={() => triggerEducationalDocumentDownload(docData)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                              title={`Tải tệp gốc "${docData.downloadFileName}"`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingCatalogDoc(doc)}
                            className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50"
                            title="Sửa / Đính kèm tệp gốc"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              await deleteAdminCatalogDoc(doc.id);
                              await loadAllData();
                              showToast('Đã xóa tài liệu.');
                            }}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {docSubTab === 'storage' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-teal-600" />
                    Tải Lên Tệp Đính Kèm Kho Bài Giảng (PPTX, PDF, DOCX, Hình ảnh)
                  </h3>
                  <AssetUploader
                    lessonId="general-library"
                    onAssetUploaded={async (newDoc) => {
                      await saveUploadedAssetToRepository(newDoc);
                      setDocuments((prev) => [newDoc, ...prev]);
                      showToast(`Đã tải lên kho bài giảng: "${newDoc.fileName || newDoc.title}"`);
                      await loadAllData();
                    }}
                  />
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Danh sách tệp đính kèm trong kho ({filteredDocuments.length})</h3>
                    <div className="flex items-center gap-1.5 text-xs">
                      {(['all', 'pptx', 'pdf', 'docx', 'image'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setDocFormatFilter(fmt)}
                          className={`px-2.5 py-1 rounded-lg font-bold uppercase ${
                            docFormatFilter === fmt
                              ? 'bg-teal-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                          }`}
                        >
                          {fmt === 'all' ? 'Tất cả' : fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm truncate">
                            {doc.fileName || doc.title}
                          </h4>
                          <div className="text-[11px] text-slate-400">
                            {doc.format.toUpperCase()} • {doc.type} • {doc.fileSize}{' '}
                            {doc.lessonTitle && `• Bài: ${doc.lessonTitle}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isRealUploadedFileUrl(doc.fileUrl) && (
                            <button
                              type="button"
                              onClick={async () => {
                                const resolved = await resolvePlayableOrDownloadableUrl(doc.fileUrl);
                                if (!resolved) return;
                                const a = document.createElement('a');
                                a.href = resolved.url;
                                a.download =
                                  resolved.fileName || doc.fileName || `${doc.title}.${doc.format}`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1"
                              title="Tải tệp gốc về máy"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Tải về</span>
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setDeleteModalState({
                                isOpen: true,
                                itemType: 'tài liệu',
                                id: doc.id,
                                name: doc.title,
                                storagePath: doc.storagePath,
                              })
                            }
                            className="p-2 rounded-xl text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 9: USERS & ROLES MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Quản Lý Phân Quyền Giáo Viên & Chính Sách Bảo Vệ Dữ Liệu Học Sinh
                </h3>
                <p className="text-xs text-slate-500">
                  Học sinh (nhất là dưới 13 tuổi) sử dụng chế độ ẩn danh cục bộ trên thiết bị, tuyệt đối không tạo tài khoản bên ngoài, không thu thập dữ liệu cá nhân vào AI và không công khai thành tích.
                </p>
              </div>
              <button
                onClick={() =>
                  setEditingUser({
                    fullName: '',
                    email: '',
                    role: 'teacher',
                    grade: 8,
                    school: 'Đà Nẵng, Việt Nam',
                  })
                }
                className="px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-center"
              >
                <Plus className="w-4 h-4" /> Thêm tài khoản Giáo viên
              </button>
            </div>

            {editingUser && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-teal-600/60 space-y-4 text-xs">
                <h4 className="font-extrabold text-sm">
                  {editingUser.id ? 'Chỉnh sửa Tài khoản' : 'Thêm Tài khoản mới'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold">Họ và tên</label>
                    <input
                      type="text"
                      value={editingUser.fullName || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                      placeholder="VD: Trần Minh Khoa"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Email đăng nhập</label>
                    <input
                      type="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      placeholder="email@gmail.com"
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="font-bold">Vai trò hệ thống</label>
                    <select
                      value={editingUser.role || 'student'}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="admin">Quản trị viên (Admin)</option>
                      <option value="teacher">Giáo viên (Teacher)</option>
                      <option value="student">Học sinh (Student)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold">Khối lớp</label>
                    <select
                      value={editingUser.grade || 8}
                      onChange={(e) => setEditingUser({ ...editingUser, grade: Number(e.target.value) as Grade })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value={6}>Lớp 6</option>
                      <option value={7}>Lớp 7</option>
                      <option value={8}>Lớp 8</option>
                      <option value={9}>Lớp 9</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingUser.fullName?.trim() || !editingUser.email?.trim()) {
                        showToast('Vui lòng nhập họ tên và email!', 'error');
                        return;
                      }
                      await saveAdminUser({
                        ...editingUser,
                        fullName: editingUser.fullName,
                        email: editingUser.email,
                        role: (editingUser.role as any) || 'student',
                      });
                      setEditingUser(null);
                      await loadAllData();
                      showToast('Đã lưu thông tin tài khoản!');
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold"
                  >
                    Lưu tài khoản
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usersList.map((u) => {
                const isCurrent = user?.email === u.email;
                return (
                  <div
                    key={u.id}
                    className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-teal-600 dark:border-teal-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                            u.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              : u.role === 'teacher'
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? 'Giáo viên' : `Học sinh Lớp ${u.grade || 8}`}
                        </span>
                        {isCurrent && (
                          <span className="text-[11px] font-bold text-teal-600">• Đang sử dụng</span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{u.fullName}</h4>
                      <div className="text-slate-500">{u.email} • {u.school || 'Đà Nẵng, Việt Nam'}</div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isCurrent && (
                        <button
                          onClick={() => handleSwitchUserAccount(u)}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold flex items-center gap-1"
                          title="Chuyển sang tài khoản này"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Dùng TK
                        </button>
                      )}
                      <button
                        onClick={() => setEditingUser(u)}
                        className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!isCurrent && (
                        <button
                          onClick={async () => {
                            await deleteAdminUser(u.id);
                            await loadAllData();
                            showToast('Đã xóa tài khoản.');
                          }}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lesson Create / Edit Modal */}
      <LessonFormModal
        isOpen={isFormModalOpen}
        lesson={editingLesson}
        initialTab={lessonFormInitialTab}
        onClose={() => setIsFormModalOpen(false)}
        onSaved={(savedLesson) => {
          showToast(
            editingLesson
              ? `Đã cập nhật bài học: "${savedLesson.title}"`
              : `Đã tạo mới bài học: "${savedLesson.title}"`
          );
          loadAllData();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title={`Xác nhận xóa ${deleteModalState.itemType}`}
        itemName={deleteModalState.name}
        itemType={deleteModalState.itemType as any}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteModalState({ isOpen: false, itemType: 'bài học', id: '', name: '' })
        }
      />

      {/* Word Question Import Modal */}
      <WordQuestionImportModal
        isOpen={isWordImportOpen}
        onClose={() => setIsWordImportOpen(false)}
        onImported={async ({ savedQuestions, createdQuiz }) => {
          await loadAllData();
          showToast(
            createdQuiz
              ? `Đã nhập ${savedQuestions.length} câu hỏi từ Word và tạo đề "${createdQuiz.title}"!`
              : `Đã nhập thành công ${savedQuestions.length} câu hỏi kèm lời giải ngắn gọn từ Word!`
          );
        }}
      />

      {/* Unified 3-Step Material Upload & Resource Manager Modal */}
      <UnifiedMaterialUploadModal
        isOpen={isUnifiedUploadOpen}
        initialTab={unifiedUploadInitialTab}
        onClose={() => setIsUnifiedUploadOpen(false)}
        onSavedResource={() => {
          loadAllData();
        }}
      />

      {/* Formula Editor Modal for Admin Single Question Editor */}
      <FormulaEditorModal
        isOpen={isAdminFormulaOpen}
        onClose={() => setIsAdminFormulaOpen(false)}
        targetLabel={
          adminFormulaTarget === 'question' ? 'Nội dung câu hỏi' : 'Lời giải bài tập'
        }
        onInsertFormula={(formula) => {
          if (!editingQuestion) return;
          if (adminFormulaTarget === 'question') {
            const current = editingQuestion.question || '';
            setEditingQuestion({
              ...editingQuestion,
              question: `${current}${current.endsWith(' ') || !current ? '' : ' '}${formula}`,
            });
          } else {
            const current = editingQuestion.explanation || '';
            const nextExp = `${current}${current.endsWith(' ') || !current ? '' : ' '}${formula}`;
            setEditingQuestion({
              ...editingQuestion,
              explanation: nextExp,
              solutionSteps: parseExplanationIntoSteps(nextExp),
            });
          }
        }}
      />
    </div>
  );
};
