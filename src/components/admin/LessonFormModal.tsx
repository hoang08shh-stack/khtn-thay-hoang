import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Video,
  Atom,
  Layers,
  Sparkles,
  ExternalLink,
  Trash2,
  RefreshCw,
  Eye,
  Calendar,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Grade, SubjectDomain } from '../../types/index.ts';
import { TOPICS, DOMAINS, SIMULATIONS_3D } from '../../data/mockData.ts';
import {
  AdminLesson,
  LessonAssetItem,
  generateSlug,
  checkSlugAvailable,
  extractYouTubeId,
  saveAdminLesson,
} from '../../services/adminService.ts';
import { AssetUploader } from './AssetUploader.tsx';

interface LessonFormModalProps {
  lesson?: AdminLesson | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedLesson: AdminLesson) => void;
}

const LessonFormModalContent: React.FC<Omit<LessonFormModalProps, 'isOpen'>> = ({
  lesson,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(lesson?.id);

  // Form states
  const [title, setTitle] = useState(lesson?.title || '');
  const [slug, setSlug] = useState(lesson?.slug || '');
  const [grade, setGrade] = useState<Grade>(lesson?.grade || 7);
  const [domain, setDomain] = useState<SubjectDomain>(lesson?.domain || 'hoa-hoc');
  const [topicId, setTopicId] = useState(lesson?.topicId || '');
  const [code, setCode] = useState(lesson?.code || '');
  const [orderIndex, setOrderIndex] = useState(lesson?.orderIndex ?? 1);
  const [durationMinutes, setDurationMinutes] = useState(lesson?.durationMinutes || 45);
  const [summary, setSummary] = useState(lesson?.summary || '');
  const [content, setContent] = useState(lesson?.content || '');
  const [isPublished, setIsPublished] = useState(lesson?.isPublished ?? true);
  const [videoInput, setVideoInput] = useState(lesson?.videoUrl || '');
  const [selectedSimulations, setSelectedSimulations] = useState<string[]>(
    lesson?.simulationIds || []
  );
  const [assets, setAssets] = useState<LessonAssetItem[]>(lesson?.assets || []);

  // UI / Status states
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'media' | 'assets'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Filter topics based on selected grade and domain
  const availableTopics = TOPICS.filter(
    (t) => t.grade === grade && t.domain === domain
  );

  // Automatically adjust topic when grade/domain change if current topic not in list
  useEffect(() => {
    if (availableTopics.length > 0) {
      const match = availableTopics.find((t) => t.id === topicId);
      if (!match) {
        setTopicId(availableTopics[0].id);
      }
    } else {
      setTopicId('');
    }
  }, [grade, domain]);

  // Suggest lesson code if empty
  useEffect(() => {
    if (!isEditing && !code) {
      const domainShort =
        domain === 'hoa-hoc'
          ? 'HH'
          : domain === 'vat-li'
          ? 'VL'
          : domain === 'sinh-hoc'
          ? 'SH'
          : 'TV';
      setCode(`KHTN${grade}-${domainShort}-0${orderIndex}`);
    }
  }, [grade, domain, orderIndex]);

  // Auto generate slug when title changes (if not manually edited or new)
  const handleAutoSlug = () => {
    const generated = generateSlug(title);
    setSlug(generated);
    checkSlug(generated);
  };

  const checkSlug = async (value: string) => {
    if (!value || value.length < 2) return;
    setSlugStatus({ checking: true });
    const result = await checkSlugAvailable(value, lesson?.id);
    setSlugStatus({
      checking: false,
      available: result.available,
      message: result.reason,
    });
  };

  // YouTube parser
  const parsedYouTubeId = extractYouTubeId(videoInput);

  // Handle save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề bài học.');
      setActiveTab('info');
      return;
    }

    if (!code.trim()) {
      setErrorMessage('Vui lòng nhập mã bài học (VD: KHTN7-HH-01).');
      setActiveTab('info');
      return;
    }

    if (!slug.trim()) {
      const auto = generateSlug(title);
      setSlug(auto);
    }

    // Slug check
    const slugCheck = await checkSlugAvailable(slug.trim(), lesson?.id);
    if (!slugCheck.available) {
      setErrorMessage(slugCheck.reason || 'Đường dẫn (slug) đã bị trùng lặp.');
      setActiveTab('info');
      return;
    }

    setIsSubmitting(true);

    try {
      const saved = await saveAdminLesson(
        {
          id: lesson?.id,
          topicId,
          grade,
          domain,
          code: code.trim(),
          slug: slug.trim(),
          title: title.trim(),
          summary: summary.trim() || 'Nội dung bài học KHTN chuẩn GDPT 2018.',
          content: content.trim() || 'Kiến thức trọng tâm bài học.',
          durationMinutes: Number(durationMinutes) || 45,
          orderIndex: Number(orderIndex) || 1,
          isPublished,
          videoUrl: parsedYouTubeId
            ? `https://www.youtube.com/watch?v=k3_${parsedYouTubeId}`
            : videoInput.trim() || undefined,
        },
        assets,
        selectedSimulations
      );

      onSaved(saved);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể lưu bài học vào Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSimulation = (simId: string) => {
    setSelectedSimulations((prev) =>
      prev.includes(simId) ? prev.filter((id) => id !== simId) : [...prev, simId]
    );
  };

  const removeAsset = (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {isEditing ? 'Cập nhật bài học' : 'Soạn bài học mới'}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1F3A] dark:text-white">
              {isEditing ? title || 'Chỉnh sửa bài học' : 'Thêm bài giảng số GDPT 2018'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Thông tin chung & Lớp</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'content'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Tóm tắt & Nội dung</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'media'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>3. YouTube & Trạm 3D</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'assets'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>4. Tài liệu PPT/PDF ({assets.length})</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium flex-1">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Tiêu đề bài học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => {
                      if (!slug) handleAutoSlug();
                    }}
                    placeholder="VD: Bài 4: Cấu tạo nguyên tử và mô hình Rutherford - Bohr"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>

                {/* Slug with duplication checker */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                      Đường dẫn định danh (Slug) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoSlug}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Tự động tạo từ tiêu đề
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        checkSlug(e.target.value);
                      }}
                      placeholder="cau-tao-nguyen-tu-rutherford-bohr"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 pr-24"
                    />
                    <div className="absolute right-3 top-2.5 text-[11px] flex items-center gap-1">
                      {slugStatus.checking ? (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Kiểm tra...
                        </span>
                      ) : slugStatus.available === true ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                        </span>
                      ) : slugStatus.available === false ? (
                        <span className="text-red-500 flex items-center gap-1 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" /> Đã trùng
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {slugStatus.message && (
                    <p className="text-[11px] text-red-500 mt-1">{slugStatus.message}</p>
                  )}
                </div>

                {/* Khối lớp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Khối lớp (GDPT 2018)
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value) as Grade)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={6}>KHTN Lớp 6</option>
                    <option value={7}>KHTN Lớp 7</option>
                    <option value={8}>KHTN Lớp 8</option>
                    <option value={9}>KHTN Lớp 9</option>
                  </select>
                </div>

                {/* Mạch kiến thức */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Mạch kiến thức KHTN
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as SubjectDomain)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {DOMAINS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.shortName} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic / Chủ đề */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Chủ đề tương ứng
                  </label>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {availableTopics.length > 0 ? (
                      availableTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.code}: {t.title}
                        </option>
                      ))
                    ) : (
                      <option value="">Chủ đề mở rộng (Mặc định)</option>
                    )}
                  </select>
                </div>

                {/* Mã bài học */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Mã bài học (Code)
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="VD: KHTN7-HH-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Thứ tự hiển thị & Thời lượng */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Thứ tự sắp xếp bài (Order Index)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Thời lượng dự kiến (Phút)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Status toggle Draft vs Published */}
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-slate-800/80 border border-teal-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Trạng thái xuất bản (Status)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isPublished
                      ? 'Đang ở trạng thái ĐÃ XUẤT BẢN. Học sinh có thể tìm kiếm và xem bài học.'
                      : 'Đang ở trạng thái BẢN NHÁP (Draft). Chỉ Admin và Giáo viên mới thấy bài này.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    isPublished
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-amber-600 text-white shadow-sm'
                  }`}
                >
                  {isPublished ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Đã Xuất Bản
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" /> Bản Nháp (Draft)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Tóm tắt bài học (Summary)
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Mô tả ngắn gọn nội dung cốt lõi và mục tiêu cần đạt..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Nội dung chi tiết bài học (Hỗ trợ cấu trúc chuyên đề)
                </label>
                <textarea
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung bài giảng, các đề mục kiến thức, định luật, phương trình hóa học hoặc công thức vật lý..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA (YouTube & 3D Simulations) */}
          {activeTab === 'media' && (
            <div className="space-y-5 animate-fadeIn">
              {/* YouTube Embedding */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-500" />
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Nhúng Video Bài giảng / Thí nghiệm từ YouTube
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60">
                    Tiết kiệm băng thông Supabase
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Quy định kiến trúc: Không tải video dài trực tiếp lên Supabase Storage để tránh cạn kiệt dung lượng miễn phí. Hãy nhập đường dẫn video YouTube (VD: <code>https://youtu.be/...</code> hoặc Video ID 11 ký tự).
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="Dán link YouTube (VD: https://www.youtube.com/watch?v=k3_...)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Video Preview */}
                {parsedYouTubeId ? (
                  <div className="mt-3 aspect-video rounded-xl overflow-hidden bg-black border border-slate-700 shadow-md">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${parsedYouTubeId}`}
                      title="YouTube Video Preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : videoInput ? (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Định dạng YouTube chưa chuẩn. Hãy dùng link dạng <code>https://youtu.be/ID</code> hoặc <code>youtube.com/watch?v=ID</code>.
                  </div>
                ) : null}
              </div>

              {/* 3D Simulations selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Atom className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Gắn Trạm Mô phỏng 3D tương tác (Three.js WebGL)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chọn các trạm thực hành ảo để học sinh tương tác trực tiếp trong bài học này:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SIMULATIONS_3D.map((sim) => {
                    const isSelected = selectedSimulations.includes(sim.id);
                    return (
                      <div
                        key={sim.id}
                        onClick={() => toggleSimulation(sim.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                          isSelected
                            ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 dark:border-teal-400 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by parent div
                          className="mt-1 rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase">
                              Lớp {sim.grade} • {sim.category}
                            </span>
                            <span className="text-[10px] text-slate-400">{sim.difficulty}</span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                            {sim.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {sim.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ASSETS (PPTX, PDF, Documents) */}
          {activeTab === 'assets' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Asset Uploader */}
              <AssetUploader
                lessonId={lesson?.id || 'new-lesson'}
                onAssetUploaded={(newAsset) => setAssets((prev) => [...prev, newAsset])}
              />

              {/* Current attached assets list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Danh sách học liệu đã gắn với bài học ({assets.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Lưu metadata vào bảng <code>lesson_assets</code>
                  </span>
                </div>

                {assets.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                    Chưa có học liệu nào được đính kèm. Sử dụng khung tải lên ở trên để thêm Slide PPTX hoặc Phiếu học tập PDF.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
                            {asset.format}
                          </span>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {asset.title}
                            </h5>
                            <span className="text-[10px] text-slate-400">
                              {asset.type} • {asset.fileSize}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAsset(asset.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          title="Gỡ tài liệu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              * Dữ liệu được đồng bộ an toàn qua RLS của Supabase
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Cập nhật bài học' : 'Lưu và Xuất bản'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const LessonFormModal: React.FC<LessonFormModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <LessonFormModalContent
      lesson={props.lesson}
      onClose={props.onClose}
      onSaved={props.onSaved}
    />
  );
};
