import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Atom,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Code,
  Upload,
  BookOpen,
  Layers,
  HelpCircle,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { SimulationManifest, SimulationMode, SimulationStatus } from '../../types/simulationManifest.ts';
import { Grade, SubjectDomain } from '../../types/index.ts';
import {
  fetchSimulations,
  deleteSimulation,
  toggleSimulationPublish,
} from '../../services/simulationService.ts';
import { AdminLesson } from '../../services/adminService.ts';
import { SimulationFormModal } from './SimulationFormModal.tsx';
import { DeleteConfirmModal } from './DeleteConfirmModal.tsx';
import { ModelViewer } from '../simulations/lab/ModelViewer.tsx';

interface SimulationManagerProps {
  lessons: AdminLesson[];
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export const SimulationManager: React.FC<SimulationManagerProps> = ({ lessons, showToast }) => {
  const [simulations, setSimulations] = useState<SimulationManifest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<SimulationStatus | 'all'>('all');
  const [selectedMode, setSelectedMode] = useState<SimulationMode | 'all'>('all');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSimulation, setEditingSimulation] = useState<SimulationManifest | null>(null);
  const [previewingSimulation, setPreviewingSimulation] = useState<SimulationManifest | null>(null);
  const [isMode2GuideOpen, setIsMode2GuideOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
  }>({ isOpen: false, id: '', title: '' });

  // Load simulations
  const loadSims = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSimulations(true); // include drafts for admin
      setSimulations(data);
    } catch (err) {
      console.error('Error fetching simulations in manager:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSims();
  }, []);

  // Filtered simulations
  const filteredSims = simulations.filter((sim) => {
    if (selectedGrade !== 'all' && sim.grade !== selectedGrade) return false;
    if (selectedDomain !== 'all' && sim.domain !== selectedDomain) return false;
    if (selectedStatus !== 'all' && sim.status !== selectedStatus) return false;
    if (selectedMode !== 'all' && sim.mode !== selectedMode) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = sim.title.toLowerCase().includes(q);
      const matchSlug = sim.slug.toLowerCase().includes(q);
      const matchTags = sim.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSlug && !matchTags) return false;
    }
    return true;
  });

  // Stats
  const totalCount = simulations.length;
  const publishedCount = simulations.filter((s) => s.status === 'published').length;
  const draftCount = simulations.filter((s) => s.status === 'draft').length;
  const mode1Count = simulations.filter((s) => s.mode === 'declarative_glb').length;
  const mode2Count = simulations.filter((s) => s.mode === 'custom_tsx').length;

  // Toggle publish
  const handleTogglePublish = async (sim: SimulationManifest) => {
    const nextStatus = sim.status === 'published' ? false : true;
    const ok = await toggleSimulationPublish(sim.id, nextStatus);
    if (ok) {
      showToast(
        nextStatus
          ? `Đã xuất bản mô phỏng "${sim.title}". Học sinh có thể xem ngay.`
          : `Đã chuyển sang Bản nháp "${sim.title}". Chỉ giáo viên/admin mới thấy.`
      );
      loadSims();
    } else {
      showToast('Không thể thay đổi trạng thái xuất bản.', 'error');
    }
  };

  // Delete
  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    const res = await deleteSimulation(deleteModal.id);
    if (res.success) {
      showToast(`Đã xóa mô phỏng "${deleteModal.title}"`);
      setDeleteModal({ isOpen: false, id: '', title: '' });
      loadSims();
    } else {
      showToast('Lỗi khi xóa mô phỏng.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Atom className="w-5 h-5 text-teal-500" />
            <span>Hệ Thống Quản Lý Mô Phỏng Khoa Học 3D</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quản trị mô hình 3D GDPT 2018: Upload tệp GLB không cần sửa code (Chế độ 1) & Tích hợp TSX Code (Chế độ 2).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMode2GuideOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-200 dark:hover:bg-purple-900 transition"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Quy trình TSX (Chế độ 2)</span>
          </button>

          <button
            onClick={() => {
              setEditingSimulation(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm mô phỏng 3D mới</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
            Tổng mô phỏng
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">
            {totalCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
            Đã xuất bản (Học sinh)
          </span>
          <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
            {publishedCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 shadow-sm">
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold block">
            Bản nháp (Nội bộ)
          </span>
          <span className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
            {draftCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 shadow-sm">
          <span className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold block">
            Chế độ 1 (GLB Upload)
          </span>
          <span className="text-xl font-extrabold text-teal-700 dark:text-teal-300">
            {mode1Count}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 shadow-sm">
          <span className="text-[11px] text-purple-700 dark:text-purple-400 font-semibold block">
            Chế độ 2 (TSX Code)
          </span>
          <span className="text-xl font-extrabold text-purple-700 dark:text-purple-300">
            {mode2Count}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, slug hoặc từ khóa (DNA, H2O, tế bào, động cơ...)"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Quick Grade Filter */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto w-full sm:w-auto">
            {(['all', 6, 7, 8, 9] as const).map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedGrade === g
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {g === 'all' ? 'Tất cả lớp' : `Lớp ${g}`}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary filters: Domain, Status, Mode */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          {/* Status */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <option value="all">Tất cả ({totalCount})</option>
              <option value="published">Đã xuất bản ({publishedCount})</option>
              <option value="draft">Bản nháp ({draftCount})</option>
            </select>
          </div>

          {/* Mode */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold">Chế độ:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <option value="all">Tất cả chế độ</option>
              <option value="declarative_glb">Chế độ 1: GLB Upload ({mode1Count})</option>
              <option value="custom_tsx">Chế độ 2: TSX Code ({mode2Count})</option>
            </select>
          </div>

          {/* Domain */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-semibold">Phân môn:</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <option value="all">Tất cả phân môn</option>
              <option value="hoa-hoc">Hóa học</option>
              <option value="vat-li">Vật lí</option>
              <option value="sinh-hoc">Sinh học</option>
              <option value="trai-dat-vu-tru">Trái Đất và Vũ trụ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Simulation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSims.map((sim) => {
          const linkedLessons = lessons.filter(
            (l) => l.simulationIds && l.simulationIds.includes(sim.id)
          );

          return (
            <div
              key={sim.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Header with Badges */}
                <div className="relative h-44 bg-slate-950 overflow-hidden group">
                  <img
                    src={sim.thumbnailUrl}
                    alt={sim.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        sim.mode === 'declarative_glb'
                          ? 'bg-teal-600 text-white'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      {sim.mode === 'declarative_glb' ? 'GLB Model' : 'TSX Code'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-sm">
                      Lớp {sim.grade} • v{sim.version}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        sim.status === 'published'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {sim.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </div>

                  {/* Bottom title in thumbnail */}
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <span className="text-[11px] font-semibold text-teal-400 block line-clamp-1">
                      {sim.category}
                    </span>
                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      {sim.title}
                    </h4>
                  </div>
                </div>

                {/* Card Body Details */}
                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {sim.summary}
                  </p>

                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {sim.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Gắn với: <strong className="text-slate-900 dark:text-white">{linkedLessons.length}</strong> bài học
                    </span>
                    <span>
                      Điểm ghim 3D: <strong className="text-teal-500">{sim.annotations.length}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                {/* Publish Toggle Button */}
                <button
                  data-testid={`publish-btn-${sim.id}`}
                  onClick={() => handleTogglePublish(sim)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                    sim.status === 'published'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  }`}
                  title={sim.status === 'published' ? 'Chuyển thành bản nháp' : 'Xuất bản cho học sinh'}
                >
                  {sim.status === 'published' ? 'Gỡ xuất bản' : 'Xuất bản'}
                </button>

                <div className="flex items-center gap-1.5">
                  {/* Live Preview Button */}
                  <button
                    onClick={() => setPreviewingSimulation(sim)}
                    className="p-2 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-teal-200 dark:border-teal-800 transition"
                    title="Xem trước 3D"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* External Student Page Link */}
                  <Link
                    to={`/mo-phong/${sim.id}`}
                    target="_blank"
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                    title="Mở trang học sinh"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      setEditingSimulation(sim);
                      setIsFormOpen(true);
                    }}
                    className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-800 transition"
                    title="Chỉnh sửa mô phỏng"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() =>
                      setDeleteModal({
                        isOpen: true,
                        id: sim.id,
                        title: sim.title,
                      })
                    }
                    className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-800 transition"
                    title="Xóa mô phỏng"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSims.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Atom className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Không tìm thấy trạm mô phỏng 3D phù hợp
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hãy thử thay đổi từ khóa hoặc bộ lọc lớp và phân môn.
          </p>
        </div>
      )}

      {/* Simulation Form Modal (Add / Edit) */}
      <SimulationFormModal
        isOpen={isFormOpen}
        simulation={editingSimulation}
        lessons={lessons}
        onClose={() => setIsFormOpen(false)}
        onSaved={(saved) => {
          showToast(
            editingSimulation
              ? `Đã cập nhật mô phỏng: "${saved.title}"`
              : `Đã thêm mới mô phỏng: "${saved.title}"`
          );
          loadSims();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="Xác nhận xóa mô phỏng 3D"
        itemName={deleteModal.title}
        itemType="mô phỏng"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: '', title: '' })}
      />

      {/* Mode 2 (TSX Code) Architectural Guide Modal */}
      {isMode2GuideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Quy Trình Chế Độ 2: Mô Phỏng TSX Tùy Chỉnh
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bảo mật tuyệt đối: Không chạy JavaScript tùy ý tải từ client/admin.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMode2GuideOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Để bảo vệ an toàn cho hệ thống và tuân thủ quy chuẩn Zero-Trust của Cloudflare Pages:
              </p>
              <ol className="list-decimal list-inside space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <li>
                  <strong className="text-slate-900 dark:text-white">Lập trình component React Three Fiber</strong> trong thư mục <code>src/components/simulations/</code> (ví dụ: <code>WaterMoleculeSimulation.tsx</code>).
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Tách rời logic toán học</strong> vào <code>src/utils/</code> và viết unit tests tự động với <code>node:test</code>.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Đăng ký vào SimulationRegistry</strong> tại <code>src/components/simulations/registry/registeredSimulations.ts</code>.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Kiểm duyệt qua Git Pull Request</strong> và triển khai tự động lên Cloudflare Pages.
                </li>
              </ol>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px]">
                Đối với giáo viên không biết code: Khuyên dùng <strong>Chế độ 1 (Upload GLB)</strong> với đầy đủ bộ điều khiển 360°, bóc tách và điểm ghim 3D tự động mà không cần can thiệp mã nguồn.
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsMode2GuideOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Quick Preview Modal */}
      {previewingSimulation && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-sm">Xem trước 3D: {previewingSimulation.title}</span>
              </div>
              <button
                onClick={() => setPreviewingSimulation(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 w-full h-full overflow-hidden">
              <ModelViewer manifest={previewingSimulation} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
