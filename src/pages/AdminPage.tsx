import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { isSupabaseConfigured } from '../lib/supabase.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { SIMULATIONS_3D, DOMAINS } from '../data/mockData.ts';
import { Grade, SubjectDomain } from '../types/index.ts';
import {
  AdminLesson,
  LessonAssetItem,
  fetchAdminLessons,
  toggleLessonPublish,
  deleteAdminLesson,
  fetchAllAdminDocuments,
  deleteAdminAsset,
  updateAssetMetadata,
} from '../services/adminService.ts';
import { LessonFormModal } from '../components/admin/LessonFormModal.tsx';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal.tsx';
import { AssetUploader } from '../components/admin/AssetUploader.tsx';
import { SimulationManager } from '../components/admin/SimulationManager.tsx';
import {
  ShieldCheck,
  BookOpen,
  Atom,
  FileText,
  Plus,
  Trash2,
  Edit,
  Database,
  Cloud,
  CheckCircle2,
  Copy,
  Search,
  Filter,
  Eye,
  Video,
  UploadCloud,
  FileUp,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Clock,
  Layers,
  ArrowUpDown,
  Lock,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, role } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'docs' | 'sims' | 'schema'>('lessons');

  // Lessons state
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Documents state
  const [documents, setDocuments] = useState<LessonAssetItem[]>([]);
  const [docFormatFilter, setDocFormatFilter] = useState<'all' | 'pptx' | 'pdf' | 'docx' | 'image'>('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    itemType: 'bài học' | 'tài liệu' | 'mô phỏng';
    id: string;
    name: string;
    storagePath?: string;
  }>({
    isOpen: false,
    itemType: 'bài học',
    id: '',
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // SQL Migration active view
  const [activeSqlTab, setActiveSqlTab] = useState<'000' | '001' | '002' | '003' | '004' | '005' | '006'>('006');
  const [copiedSql, setCopiedSql] = useState(false);

  // Load data
  const loadLessons = async () => {
    setIsLoadingLessons(true);
    try {
      const data = await fetchAdminLessons();
      setLessons(data);
      const docs = await fetchAllAdminDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading admin lessons:', err);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle publish
  const handleTogglePublish = async (lesson: AdminLesson) => {
    const newStatus = !lesson.isPublished;
    // Optimistic update
    setLessons((prev) =>
      prev.map((l) => (l.id === lesson.id ? { ...l, isPublished: newStatus } : l))
    );

    const success = await toggleLessonPublish(lesson.id, newStatus);
    if (success) {
      showToast(
        newStatus
          ? `Đã xuất bản bài: "${lesson.title}". Học sinh có thể xem ngay.`
          : `Đã chuyển sang Bản nháp: "${lesson.title}". Chỉ giáo viên/admin mới thấy.`
      );
    } else {
      showToast('Không thể cập nhật trạng thái xuất bản.', 'error');
      loadLessons();
    }
  };

  // Open create form
  const handleOpenCreate = () => {
    setEditingLesson(null);
    setIsFormModalOpen(true);
  };

  // Open edit form
  const handleOpenEdit = (lesson: AdminLesson) => {
    setEditingLesson(lesson);
    setIsFormModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModalState.itemType === 'bài học') {
        const success = await deleteAdminLesson(deleteModalState.id);
        if (success) {
          showToast(`Đã xóa bài học: "${deleteModalState.name}"`);
          setLessons((prev) => prev.filter((l) => l.id !== deleteModalState.id));
        } else {
          showToast('Lỗi khi xóa bài học.', 'error');
        }
      } else if (deleteModalState.itemType === 'tài liệu') {
        const success = await deleteAdminAsset(
          deleteModalState.id,
          deleteModalState.storagePath
        );
        if (success) {
          showToast(`Đã xóa tài liệu khỏi Storage và CSDL.`);
          setDocuments((prev) => prev.filter((d) => d.id !== deleteModalState.id));
        } else {
          showToast('Lỗi khi xóa tài liệu.', 'error');
        }
      }
    } finally {
      setIsDeleting(false);
      setDeleteModalState({ isOpen: false, itemType: 'bài học', id: '', name: '' });
      loadLessons();
    }
  };

  // Filter lessons
  const filteredLessons = lessons.filter((l) => {
    if (selectedGrade !== 'all' && l.grade !== selectedGrade) return false;
    if (selectedDomain !== 'all' && l.domain !== selectedDomain) return false;
    if (selectedStatus === 'published' && !l.isPublished) return false;
    if (selectedStatus === 'draft' && l.isPublished) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchCode = l.code.toLowerCase().includes(q);
      const matchSlug = (l.slug || '').toLowerCase().includes(q);
      return matchTitle || matchCode || matchSlug;
    }
    return true;
  });

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    if (docFormatFilter === 'all') return true;
    if (docFormatFilter === 'image') return ['png', 'jpg', 'jpeg', 'webp'].includes(doc.format);
    return doc.format === docFormatFilter;
  });

  // Calculate stats
  const totalLessonsCount = lessons.length;
  const publishedCount = lessons.filter((l) => l.isPublished).length;
  const draftCount = totalLessonsCount - publishedCount;
  const totalDocsCount = documents.length;

  const sqlSnippets: Record<string, string> = {
    '000': `-- 20261029000000_schema_and_rls.sql
-- Khởi tạo 14 bảng dữ liệu, Enum và Row Level Security:
-- profiles, user_roles, topics, lessons, lesson_assets,
-- simulations, lesson_simulations, quizzes, questions,
-- question_options, answer_keys, quiz_attempts, attempt_answers, lesson_progress.
-- Trigger handle_new_user() tự động gán role = 'student' không thể tự nâng quyền.
-- RPC public.submit_quiz_attempt() chấm điểm bảo mật tại máy chủ DB.`,
    '001': `-- 20261029000001_seed_data.sql
-- Nạp dữ liệu chuẩn Chương trình Giáo dục Phổ thông 2018:
-- Chuyên đề Hóa học, Vật lí, Sinh học, Thiên văn lớp 6, 7, 8, 9.
-- 6 trạm mô phỏng 3D WebGL Three.js.
-- Đề trắc nghiệm và câu hỏi kèm đáp án an toàn trong bảng answer_keys.`,
    '002': `-- 20261029000002_storage_setup.sql
-- Tạo các Storage Buckets công khai & chính sách bảo vệ RLS:
-- 1. science-assets (Ảnh bìa, mô hình GLTF 3D)
-- 2. lesson-documents (Giáo án PPTX, Phiếu học tập PDF, DOCX)
-- 3. avatars (Ảnh đại diện theo thư mục auth.uid())
-- Chỉ teacher và admin được phép upload/xóa tài liệu bài học.`,
    '003': `-- 20261029000003_admin_enhancements.sql
-- Mở rộng trường quản trị bài học:
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS order_index INT NOT NULL DEFAULT 0;

-- Giới hạn Supabase Free tối đa 50MB (52,428,800 bytes):
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id IN ('lesson-documents', 'science-assets');

-- Function kiểm tra trùng lặp slug:
CREATE OR REPLACE FUNCTION public.check_slug_available(p_slug TEXT, p_exclude_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.lessons
    WHERE (slug = p_slug OR code = p_slug) AND (p_exclude_id IS NULL OR id != p_exclude_id)
  );
END; $$;`,
    '004': `-- 20261030000004_simulations_management.sql
-- Bảng simulations và chính sách RLS phân quyền Chế độ 1 (GLB) & Chế độ 2 (TSX):
CREATE TABLE IF NOT EXISTS public.simulations (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  mode TEXT NOT NULL DEFAULT 'declarative_glb' CHECK (mode IN ('declarative_glb', 'custom_tsx')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  grade INTEGER NOT NULL CHECK (grade BETWEEN 6 AND 9),
  domain TEXT NOT NULL CHECK (domain IN ('hoa-hoc', 'vat-li', 'sinh-hoc', 'trai-dat-vu-tru')),
  category TEXT NOT NULL DEFAULT 'Mô hình 3D',
  difficulty TEXT NOT NULL DEFAULT 'Cơ bản',
  curriculum_code TEXT,
  summary TEXT NOT NULL,
  thumbnail_url TEXT,
  model_url TEXT,
  manifest_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Học sinh chỉ xem published, giáo viên/admin toàn quyền quản trị
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view published simulations" ON public.simulations FOR SELECT
USING (status = 'published' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Admins teachers manage simulations" ON public.simulations FOR ALL
TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));`,
    '005': `-- 20261031000005_quiz_and_progress_system.sql
-- Hệ thống trắc nghiệm đa dạng (single_choice, multiple_choice, true_false) & Chấm điểm Server-side:
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'single_choice'
  CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false')),
  ADD COLUMN IF NOT EXISTS hint TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Thông hiểu';

-- Hỗ trợ mảng đáp án đúng cho multiple_choice:
ALTER TABLE public.answer_keys DROP CONSTRAINT IF EXISTS answer_keys_question_id_key;
ALTER TABLE public.answer_keys ADD COLUMN IF NOT EXISTS correct_option_ids UUID[];

-- RLS: Học sinh TUYỆT ĐỐI không có quyền SELECT answer_keys
ALTER TABLE public.answer_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only teachers and admins can view answer keys"
  ON public.answer_keys FOR SELECT TO authenticated USING (public.is_teacher_or_admin());

-- RPC Chấm điểm Server-side bảo mật:
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(p_quiz_id UUID, p_answers JSONB, p_time_spent_seconds INT DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
... (Chấm điểm tại DB, ghi nhận quiz_attempts, tự động cập nhật lesson_progress) ...
$$;`,
    '006': `-- 20261031000006_badge_system.sql
-- Hệ thống Huy Hiệu Năng Lực Học Sinh (Master of Physics, Lab Pioneer, Science Explorer):
CREATE TABLE IF NOT EXISTS public.badges (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  title_en VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'Award',
  category VARCHAR(30) NOT NULL DEFAULT 'general',
  tier VARCHAR(20) NOT NULL DEFAULT 'bronze',
  required_criteria TEXT NOT NULL,
  points_reward INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id VARCHAR(50) NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  progress_snapshot JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_id)
);

-- RLS: Public xem danh mục, Học sinh chỉ xem huy hiệu của chính mình
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view badges catalog" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_or_teacher());

-- Server-side RPC đánh giá tự động: evaluate_and_award_badges(p_user_id UUID)
CREATE OR REPLACE FUNCTION public.evaluate_and_award_badges(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
... (Đánh giá tiến độ bài học, mô phỏng 3D, điểm số và tự động trao huy hiệu) ...
$$;`,
  };

  const copySql = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumbs items={[{ label: 'Bảng Điều Khiển Quản Trị Giáo Viên' }]} />

        {/* Toast alert */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-fadeIn ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Admin Dashboard Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0B1F3A] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                {role === 'admin' ? 'Quyền Quản Trị Viên (Admin)' : 'Quyền Giáo Viên (Teacher)'}
              </span>
              <span className="text-xs text-slate-400">
                • Người dùng: <strong className="text-white">{user?.fullName || 'Thầy Hoàng'}</strong> ({user?.email})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Quản Trị Phòng Thí Nghiệm & Bài Giảng KHTN
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Quản lý toàn diện bài học GDPT 2018 (lớp 6–9), phân loại mạch kiến thức, xuất bản bài viết, tải lên tài liệu PPT/PDF vào Supabase Storage (giới hạn 50MB) và nhúng video YouTube.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Database className="w-4 h-4 text-teal-400" />
                <span>
                  Supabase: {isSupabaseConfigured ? 'Kết nối trực tiếp' : 'Đồng bộ Bộ nhớ Cache'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bảo vệ RLS: Học sinh không xem được Bản nháp</span>
              </div>
            </div>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Soạn bài học mới</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'lessons'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Quản lý Bài học ({totalLessonsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Kho Tài liệu Storage ({totalDocsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tổng quan hệ thống</span>
          </button>
          <button
            onClick={() => setActiveTab('sims')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'sims'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Atom className="w-4 h-4" />
            <span>Trạm Mô phỏng 3D ({SIMULATIONS_3D.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === 'schema'
                ? 'bg-slate-800 dark:bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cơ sở Dữ liệu & RLS</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: LESSONS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'lessons' && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm theo tiêu đề bài học, mã bài hoặc slug..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Grade Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Khối:
                  </span>
                  {(['all', 6, 7, 8, 9] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGrade(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        selectedGrade === g
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {g === 'all' ? 'Tất cả' : `Lớp ${g}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-filters: Domain & Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Mạch KHTN:</span>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">Tất cả các mạch</option>
                    {DOMAINS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.shortName}
                      </option>
                    ))}
                  </select>

                  <span className="font-semibold text-slate-500 dark:text-slate-400 ml-2">Trạng thái:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">Tất cả ({totalLessonsCount})</option>
                    <option value="published">Đã xuất bản ({publishedCount})</option>
                    <option value="draft">Bản nháp ({draftCount})</option>
                  </select>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Hiển thị <strong>{filteredLessons.length}</strong> bài học</span>
                  <button
                    onClick={loadLessons}
                    className="p-1 rounded text-slate-400 hover:text-teal-600 transition"
                    title="Tải lại danh sách"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Lesson Cards / Rows */}
            {isLoadingLessons ? (
              <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
                <p className="text-xs">Đang tải dữ liệu bài học...</p>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Không tìm thấy bài học nào phù hợp bộ lọc
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn &quot;Tất cả&quot; khối lớp.
                </p>
                <button
                  onClick={handleOpenCreate}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md hover:bg-teal-500 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo bài học mới</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLessons.map((l) => {
                  const domainInfo = DOMAINS.find((d) => d.id === l.domain);
                  const hasVideo = Boolean(l.videoUrl);
                  const hasSims = (l.simulationIds && l.simulationIds.length > 0);
                  const assetCount = l.assets ? l.assets.length : 0;

                  return (
                    <div
                      key={l.id}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 ${
                        l.isPublished
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-800'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-amber-200 dark:border-amber-950/80'
                      } flex flex-col md:flex-row md:items-center justify-between gap-4`}
                    >
                      {/* Left: Code, Title, Badges */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Order Index */}
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            #{l.orderIndex}
                          </span>

                          {/* Code */}
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono">
                            {l.code}
                          </span>

                          {/* Grade */}
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Lớp {l.grade}
                          </span>

                          {/* Domain */}
                          <span className="text-xs text-slate-400">• {domainInfo?.shortName}</span>

                          {/* Duration */}
                          <span className="text-xs text-slate-400">• {l.durationMinutes} phút</span>

                          {/* Published / Draft Pill */}
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
                                <Clock className="w-3 h-3" /> Bản nháp (Draft)
                              </>
                            )}
                          </span>
                        </div>

                        {/* Title and Slug */}
                        <div>
                          <h3 className="font-extrabold text-sm sm:text-base text-[#0B1F3A] dark:text-white truncate">
                            {l.title}
                          </h3>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate mt-0.5">
                            slug: /{l.slug || 'chua-co-slug'}
                          </div>
                        </div>

                        {/* Attached items indicators */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-teal-500" />
                            <strong>{assetCount}</strong> tài liệu PPT/PDF
                          </span>

                          {hasSims && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                              <Atom className="w-3.5 h-3.5" />
                              {l.simulationIds?.length} trạm 3D
                            </span>
                          )}

                          {hasVideo && (
                            <span className="flex items-center gap-1 text-red-500 font-medium">
                              <Video className="w-3.5 h-3.5" />
                              Video YouTube
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {/* Toggle Publish button */}
                        <button
                          onClick={() => handleTogglePublish(l)}
                          title={l.isPublished ? 'Chuyển về bản nháp' : 'Xuất bản bài học'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                            l.isPublished
                              ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40'
                              : 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100'
                          }`}
                        >
                          {l.isPublished ? 'Gỡ xuất bản' : 'Xuất bản ngay'}
                        </button>

                        {/* Preview in Portal link */}
                        <Link
                          to={`/bai-hoc/${l.id}`}
                          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                          title="Xem trang học sinh"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Edit button */}
                        <button
                          onClick={() => handleOpenEdit(l)}
                          className="p-2 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-teal-200 dark:border-teal-800 transition"
                          title="Chỉnh sửa bài học"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() =>
                            setDeleteModalState({
                              isOpen: true,
                              itemType: 'bài học',
                              id: l.id,
                              name: l.title,
                            })
                          }
                          className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-900 transition"
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
        {/* TAB 2: STORAGE DOCUMENTS & ASSETS */}
        {/* ============================================================== */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            {/* Standalone Uploader Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0B1F3A] dark:text-white flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-teal-500" />
                    Tải Lên Học Liệu Trực Tiếp Vào Supabase Storage
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tệp sẽ được lưu vào bucket <code>lesson-documents</code> hoặc <code>science-assets</code>. Giới hạn: tối đa 50MB/tệp.
                  </p>
                </div>
              </div>

              {/* Asset Uploader for general storage */}
              <AssetUploader
                lessonId="general-library"
                onAssetUploaded={(newDoc) => {
                  setDocuments((prev) => [newDoc, ...prev]);
                  showToast(`Đã tải lên tài liệu: "${newDoc.title}"`);
                  loadLessons();
                }}
              />
            </div>

            {/* Documents List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#0B1F3A] dark:text-white">
                    Danh Sách Học Liệu Đã Tải Lên ({documents.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bao gồm slide giáo án PPTX, phiếu học tập PDF và tài liệu tham khảo
                  </p>
                </div>

                {/* Filter formats */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  {(['all', 'pptx', 'pdf', 'docx', 'image'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setDocFormatFilter(fmt)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition uppercase ${
                        docFormatFilter === fmt
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {fmt === 'all' ? 'Tất cả' : fmt}
                    </button>
                  ))}
                </div>
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                  Không tìm thấy tài liệu nào trong bộ lọc này.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`text-xs font-bold uppercase px-2.5 py-1 rounded-xl ${
                            doc.format === 'pptx'
                              ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                              : doc.format === 'pdf'
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {doc.format}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                            {doc.title}
                          </h4>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {doc.type} • {doc.fileSize} {doc.lessonTitle && `• Bài: ${doc.lessonTitle}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {doc.fileUrl && doc.fileUrl !== '#' && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Mở tệp
                          </a>
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
                          className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-900 transition"
                          title="Xóa tài liệu khỏi Storage"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: OVERVIEW */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Tổng bài giảng</span>
                <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
                  {totalLessonsCount}
                </div>
                <div className="text-[11px] text-slate-400">
                  {publishedCount} đã xuất bản • {draftCount} bản nháp
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Trạm mô phỏng 3D</span>
                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                  {SIMULATIONS_3D.length}
                </div>
                <div className="text-[11px] text-slate-400">WebGL Three.js mượt mà</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Học liệu PPT & PDF</span>
                <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                  {totalDocsCount}
                </div>
                <div className="text-[11px] text-slate-400">Đã lưu trữ Supabase Storage</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Giới hạn Storage Free</span>
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  50 MB
                </div>
                <div className="text-[11px] text-slate-400">Tối đa mỗi tệp tải lên</div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#0B1F3A] dark:text-white">
                Thao tác quản trị nhanh
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleOpenCreate}
                  className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-left hover:bg-teal-100 dark:hover:bg-teal-950/70 transition space-y-1"
                >
                  <Plus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <div className="font-bold text-xs sm:text-sm text-teal-900 dark:text-teal-200">
                    Soạn bài học mới
                  </div>
                  <p className="text-[11px] text-teal-700 dark:text-teal-400">
                    Thêm bài giảng, chọn mạch GDPT 2018 và sinh slug
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('docs')}
                  className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-left hover:bg-blue-100 dark:hover:bg-blue-950/70 transition space-y-1"
                >
                  <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="font-bold text-xs sm:text-sm text-blue-900 dark:text-blue-200">
                    Tải tài liệu lên Storage
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400">
                    Upload tệp PPTX, PDF (giới hạn 50MB an toàn)
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('schema')}
                  className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-left hover:bg-purple-100 dark:hover:bg-purple-950/70 transition space-y-1"
                >
                  <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div className="font-bold text-xs sm:text-sm text-purple-900 dark:text-purple-200">
                    Kiểm tra RLS & Schema
                  </div>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400">
                    Xem 14 bảng dữ liệu, RPC chấm điểm và quyền giáo viên
                  </p>
                </button>
              </div>
            </div>

            {/* Cloudflare Pages Deploy Instructions */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#0B1F3A] dark:text-white">
                Hướng dẫn triển khai Cloudflare Pages & GitHub
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Ứng dụng hoàn toàn sẵn sàng chạy trên Cloudflare Pages miễn phí. Thiết lập biến môi trường sau trên dashboard Cloudflare Pages:
              </p>
              <pre className="p-4 rounded-2xl bg-slate-950 text-teal-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
{`# 1. Cloudflare Pages Settings:
Framework: Vite
Build command: npm run build
Output directory: dist

# 2. Environment Variables:
VITE_SUPABASE_URL = "https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY = "eyJh..."`}
              </pre>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: 3D SIMULATIONS */}
        {/* ============================================================== */}
        {activeTab === 'sims' && (
          <SimulationManager lessons={lessons} showToast={showToast} />
        )}

        {/* ============================================================== */}
        {/* TAB 5: SCHEMA & SECURITY */}
        {/* ============================================================== */}
        {activeTab === 'schema' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#0B1F3A] dark:text-white">
                  Kiến Trúc Cơ Sở Dữ Liệu & Bảo Mật Supabase RLS
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tất cả bảng dữ liệu và Storage buckets đều được kiểm soát bởi Row Level Security (RLS).
                </p>
              </div>

              <button
                onClick={() => copySql(sqlSnippets[activeSqlTab])}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 self-start sm:self-center"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedSql ? 'Đã sao chép SQL!' : 'Sao chép đoạn mã SQL'}</span>
              </button>
            </div>

            {/* Subtabs for migrations */}
            <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveSqlTab('006')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeSqlTab === '006'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                006: Hệ thống Huy hiệu (Master of Physics / Lab Pioneer)
              </button>
              <button
                onClick={() => setActiveSqlTab('005')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeSqlTab === '005'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                005: Quiz & Tiến độ học sinh (Server RPC)
              </button>
              <button
                onClick={() => setActiveSqlTab('004')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeSqlTab === '004'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                004: Mô phỏng 3D & GLB
              </button>
              <button
                onClick={() => setActiveSqlTab('003')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeSqlTab === '003'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                003: Mở rộng Admin & Giới hạn 50MB
              </button>
              <button
                onClick={() => setActiveSqlTab('000')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeSqlTab === '000'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                000: Schema 14 Bảng & RLS
              </button>
              <button
                onClick={() => setActiveSqlTab('001')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeSqlTab === '001'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                001: Dữ liệu mẫu GDPT 2018
              </button>
              <button
                onClick={() => setActiveSqlTab('002')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeSqlTab === '002'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                002: Cấu hình Storage
              </button>
            </div>

            {/* SQL Snippet box */}
            <pre className="p-4 sm:p-6 rounded-2xl bg-slate-950 text-teal-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-96">
              {sqlSnippets[activeSqlTab]}
            </pre>

            {/* Security Audit Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Bảo vệ chống nâng quyền trái phép
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Bảng <code>user_roles</code> hoàn toàn tách biệt khỏi <code>profiles</code>. Khi học sinh đăng ký tài khoản mới, trigger PostgreSQL tự động khóa cứng vai trò <code>student</code>. Bảng <code>user_roles</code> chỉ chấp nhận INSERT/UPDATE/DELETE từ tài khoản có vai trò <code>admin</code>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Bảo vệ đáp án & Giới hạn Storage 50MB
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Bảng <code>answer_keys</code> khóa quyền SELECT đối với học sinh. Chấm điểm được thực hiện bằng function RPC an toàn <code>submit_quiz_attempt</code>. Đồng thời, dung lượng tệp tải lên Supabase Storage được giới hạn ở 50MB/tệp, ngăn ngừa chi phí lưu trữ phát sinh.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Create / Edit Modal */}
      <LessonFormModal
        isOpen={isFormModalOpen}
        lesson={editingLesson}
        onClose={() => setIsFormModalOpen(false)}
        onSaved={(savedLesson) => {
          showToast(
            editingLesson
              ? `Đã cập nhật bài học: "${savedLesson.title}"`
              : `Đã tạo mới bài học: "${savedLesson.title}"`
          );
          loadLessons();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title={`Xác nhận xóa ${deleteModalState.itemType}`}
        itemName={deleteModalState.name}
        itemType={deleteModalState.itemType}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteModalState({ isOpen: false, itemType: 'bài học', id: '', name: '' })
        }
      />
    </div>
  );
};
