import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Atom,
  Upload,
  Layers,
  Sparkles,
  ExternalLink,
  Trash2,
  Plus,
  Eye,
  Sliders,
  BookOpen,
  HelpCircle,
  Code,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';
import { Grade, SubjectDomain } from '../../types/index.ts';
import {
  SimulationManifest,
  SimulationMode,
  SimulationStatus,
  LightingPreset,
  SimulationAnnotation,
  DiscoveryQuestionDef,
} from '../../types/simulationManifest.ts';
import {
  DEFAULT_CONTROLS_CONFIG,
  validateSimulationManifest,
} from '../../utils/manifestValidator.ts';
import {
  upload3DModel,
  saveSimulation,
} from '../../services/simulationService.ts';
import { uploadScienceAsset, formatBytes } from '../../services/storageService.ts';
import { generateSlug, AdminLesson } from '../../services/adminService.ts';
import { ModelViewer } from '../simulations/lab/ModelViewer.tsx';

interface SimulationFormModalProps {
  isOpen: boolean;
  simulation?: SimulationManifest | null;
  lessons?: AdminLesson[];
  onClose: () => void;
  onSaved: (saved: SimulationManifest) => void;
}

const SAMPLE_GLB_TEMPLATES = [
  {
    name: 'DNA Xoắn Kép (Sinh học 9)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DNA/glTF-Binary/DNA.glb',
    fileName: 'dna_watson_crick.glb',
    size: '3.2 MB',
  },
  {
    name: 'Tế bào Thực vật (Sinh học 6)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BrainStem/glTF-Binary/BrainStem.glb',
    fileName: 'plant_cell.glb',
    size: '5.4 MB',
  },
  {
    name: 'Động cơ điện (Vật lí 9)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Lantern/glTF-Binary/Lantern.glb',
    fileName: 'electric_motor.glb',
    size: '4.1 MB',
  },
];

const SimulationFormModalContent: React.FC<Omit<SimulationFormModalProps, 'isOpen'>> = ({
  simulation,
  lessons = [],
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(simulation?.id);

  // Tab navigation inside wizard
  const [activeTab, setActiveTab] = useState<'mode' | 'model' | 'info' | 'controls' | 'pedagogy' | 'schema' | 'preview'>('mode');

  // Form states
  const [id, setId] = useState(simulation?.id || '');
  const [slug, setSlug] = useState(simulation?.slug || '');
  const [title, setTitle] = useState(simulation?.title || '');
  const [subtitle, setSubtitle] = useState(simulation?.subtitle || '');
  const [version, setVersion] = useState(simulation?.version || '1.0.0');
  const [mode, setMode] = useState<SimulationMode>(simulation?.mode || 'declarative_glb');
  const [status, setStatus] = useState<SimulationStatus>(simulation?.status || 'published');
  const [grade, setGrade] = useState<Grade>(simulation?.grade || 7);
  const [domain, setDomain] = useState<SubjectDomain>(simulation?.domain || 'hoa-hoc');
  const [category, setCategory] = useState(simulation?.category || 'Mô hình 3D tương tác');
  const [difficulty, setDifficulty] = useState<'Cơ bản' | 'Trung bình' | 'Nâng cao'>(simulation?.difficulty || 'Cơ bản');
  const [curriculumCode, setCurriculumCode] = useState(simulation?.curriculumCode || `GDPT 2018 - KHTN ${grade}`);
  const [summary, setSummary] = useState(simulation?.summary || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(
    simulation?.thumbnailUrl ||
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'
  );
  const [tagsInput, setTagsInput] = useState(simulation?.tags?.join(', ') || '3D, GDPT 2018');

  // Model Asset states (Mode 1)
  const [modelUrl, setModelUrl] = useState(simulation?.modelAsset?.url || '');
  const [modelFileName, setModelFileName] = useState(simulation?.modelAsset?.fileName || '');
  const [modelFileSizeFormatted, setModelFileSizeFormatted] = useState(simulation?.modelAsset?.fileSizeFormatted || '');
  const [modelFormat, setModelFormat] = useState<'glb' | 'gltf'>(simulation?.modelAsset?.format || 'glb');

  // Predefined Controls Config
  const [controls, setControls] = useState(simulation?.controlsConfig || { ...DEFAULT_CONTROLS_CONFIG });

  // Annotations (Hotspot Pins)
  const [annotations, setAnnotations] = useState<SimulationAnnotation[]>(simulation?.annotations || []);

  // Scientific Explanation
  const [overview, setOverview] = useState(simulation?.scientificExplanation?.overview || '');
  const [realWorldApp, setRealWorldApp] = useState(simulation?.scientificExplanation?.realWorldApplication || '');
  const [keyPoints, setKeyPoints] = useState<{ title: string; content: string }[]>(
    simulation?.scientificExplanation?.keyPoints || [
      { title: 'Nguyên lý cơ bản', content: 'Mô tả nguyên lý theo SGK KHTN GDPT 2018.' },
    ]
  );

  // Discovery Questions
  const [questions, setQuestions] = useState<DiscoveryQuestionDef[]>(
    simulation?.discoveryQuestions || [
      {
        id: 'q1',
        question: 'Câu hỏi quan sát mô hình 3D:',
        options: [
          { id: 'a', text: 'Phương án A đúng', isCorrect: true },
          { id: 'b', text: 'Phương án B sai', isCorrect: false },
          { id: 'c', text: 'Phương án C sai', isCorrect: false },
        ],
        explanation: 'Giải thích chi tiết theo SGK GDPT 2018.',
      },
    ]
  );

  // Associated Lessons
  const [selectedLessons, setSelectedLessons] = useState<string[]>(simulation?.relatedLessonIds || []);

  // UI state
  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [copiedManifest, setCopiedManifest] = useState(false);

  // Auto-generate ID & slug from title
  const handleAutoSlug = () => {
    const generated = generateSlug(title);
    setSlug(generated);
    if (!id || id.startsWith('sim-')) {
      setId(`sim-${generated}`);
    }
  };

  // Build manifest object from current state
  const currentManifest: SimulationManifest = {
    schemaVersion: '1.0.0',
    id: id || `sim-${generateSlug(title)}`,
    slug: slug || generateSlug(title),
    title,
    subtitle: subtitle || `${title} - KHTN Lớp ${grade}`,
    version,
    mode,
    status,
    grade,
    domain,
    category,
    difficulty,
    curriculumCode: curriculumCode || `GDPT 2018 - KHTN ${grade}`,
    tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    thumbnailUrl,
    summary,
    learningObjectives: [
      `Nhận biết và mô tả được cấu trúc không gian của ${title}.`,
      'Giải thích được mối liên hệ giữa cấu tạo và tính chất khoa học theo GDPT 2018.',
    ],
    keyConcepts: [
      { term: title, definition: summary.slice(0, 150) || 'Khái niệm KHTN' },
    ],
    modelAsset:
      mode === 'declarative_glb'
        ? {
            url: modelUrl || 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DNA/glTF-Binary/DNA.glb',
            fileName: modelFileName || 'model.glb',
            fileSizeFormatted: modelFileSizeFormatted || '3.5 MB',
            format: modelFormat,
          }
        : undefined,
    controlsConfig: controls,
    annotations,
    scientificExplanation: {
      overview: overview || summary,
      keyPoints,
      realWorldApplication: realWorldApp,
    },
    discoveryQuestions: questions,
    relatedLessonIds: selectedLessons,
    createdAt: simulation?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: simulation?.author || 'Thầy Hoàng KHTN',
  };

  // Realtime validate when switching to schema tab or submitting
  const runValidation = (): boolean => {
    const result = validateSimulationManifest(currentManifest);
    setValidationErrors(result.errors);
    return result.isValid;
  };

  // Handle GLB upload
  const handleModelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingModel(true);
    setUploadProgress(10);
    try {
      const res = await upload3DModel(file, id || 'new-sim', (percent) => setUploadProgress(percent));
      setModelUrl(res.url);
      setModelFileName(file.name);
      setModelFileSizeFormatted(res.sizeFormatted);
      setModelFormat(res.format);
    } catch (err: any) {
      alert(`Lỗi tải tệp 3D: ${err.message}`);
    } finally {
      setIsUploadingModel(false);
      setUploadProgress(0);
    }
  };

  // Handle Thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumb(true);
    try {
      const res = await uploadScienceAsset(file, 'simulations');
      if (res?.publicUrl) {
        setThumbnailUrl(res.publicUrl);
      }
    } catch (err: any) {
      alert(`Lỗi tải ảnh bìa: ${err.message}`);
    } finally {
      setIsUploadingThumb(false);
    }
  };

  // Submit save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!runValidation()) {
      setActiveTab('schema');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveSimulation(currentManifest);
      if (res.success && res.data) {
        onSaved(res.data);
        onClose();
      } else {
        alert(res.error || 'Không thể lưu mô phỏng vào hệ thống.');
      }
    } catch (err: any) {
      alert(`Lỗi lưu: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {isEditing ? 'Chỉnh Sửa Mô Phỏng 3D' : 'Thêm Mô Phỏng 3D Mới (Không Cần Sửa Code)'}
              </h2>
              <p className="text-xs text-slate-400">
                Chuẩn hóa JSON Manifest, hỗ trợ Upload GLB (Chế độ 1) và Đăng ký TSX Code (Chế độ 2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Steps Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 overflow-x-auto text-xs font-bold shrink-0">
          {[
            { id: 'mode', label: '1. Chế độ', icon: ShieldCheck },
            { id: 'model', label: '2. Tệp 3D & Ảnh bìa', icon: Upload },
            { id: 'info', label: '3. Thông tin GDPT 2018', icon: BookOpen },
            { id: 'controls', label: '4. Điều khiển 3D', icon: Sliders },
            { id: 'pedagogy', label: '5. Sư phạm & Câu hỏi', icon: HelpCircle },
            { id: 'schema', label: '6. JSON Manifest', icon: Code },
            { id: 'preview', label: '7. Xem thử 3D', icon: Eye },
          ].map((step) => {
            const Icon = step.icon;
            const isActive = activeTab === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id === 'schema' || step.id === 'preview') {
                    runValidation();
                  }
                  setActiveTab(step.id as any);
                }}
                className={`py-3 px-4 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
                  isActive
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* TAB 1: MODE SELECTOR */}
          {activeTab === 'mode' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Chọn Chế Độ Khởi Tạo Mô Phỏng Khoa Học 3D
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Hệ thống phân tách bảo mật nghiêm ngặt giữa mô hình Declarative GLB do Admin tải lên và mô phỏng thuật toán TSX được kiểm duyệt.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mode 1 */}
                <div
                  onClick={() => setMode('declarative_glb')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    mode === 'declarative_glb'
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white">
                        Khuyên Dùng (Zero-Code)
                      </span>
                      {mode === 'declarative_glb' && (
                        <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Chế Độ 1: Upload GLB & Điều Khiển Tự Động
                    </h4>
                    <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                      Tải tệp mô hình 3D (.glb, .gltf) lên Supabase Storage. Hệ thống tự động căn chỉnh khung hình, cung cấp sẵn các bộ điều khiển 360°, bóc tách chi tiết (explode), mặt cắt và điểm ghim 3D (hotspots).
                    </p>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>An toàn tuyệt đối: Không chạy JavaScript tùy ý từ bên ngoài.</span>
                    </div>
                  </div>
                </div>

                {/* Mode 2 */}
                <div
                  onClick={() => setMode('custom_tsx')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                    mode === 'custom_tsx'
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white">
                        Lập Trình Viên (Git Review)
                      </span>
                      {mode === 'custom_tsx' && (
                        <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Chế Độ 2: Mô Phỏng TSX Tùy Chỉnh (Code)
                    </h4>
                    <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                      Dành cho các hiện tượng khoa học phức tạp cần tính toán vật lý (ví dụ: góc liên kết phân tử nước 104.5°, dòng electron mạch điện, lăng kính khúc xạ ánh sáng).
                    </p>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-purple-600 dark:text-purple-400">
                      Mô phỏng TSX được viết mã nguồn tại <code>src/components/simulations/</code>, kiểm thử qua unit test và triển khai an toàn qua GitHub.
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Trạng thái xuất bản (Publication Status)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chỉ mô phỏng ở trạng thái &ldquo;Đã xuất bản&rdquo; mới xuất hiện trong thư viện học sinh và gắn vào bài học.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      status === 'draft'
                        ? 'bg-amber-500 text-slate-950 font-extrabold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Bản nháp (Draft)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      status === 'published'
                        ? 'bg-teal-600 text-white font-extrabold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Đã xuất bản (Published)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODEL ASSET & THUMBNAIL */}
          {activeTab === 'model' && (
            <div className="space-y-6">
              {mode === 'declarative_glb' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      Tải Lên Tệp 3D (.glb / .gltf)
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                      Giới hạn tối đa 50MB cho mỗi tệp theo gói Supabase Free. Tệp được lưu trữ trực tiếp trên Storage bucket.
                    </p>
                  </div>

                  {/* Upload Box */}
                  <div className="border-2 border-dashed border-teal-500/50 rounded-3xl p-6 text-center bg-teal-50/30 dark:bg-teal-950/20 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-teal-600/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                      {isUploadingModel ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md transition">
                        <span>{isUploadingModel ? 'Đang tải lên Supabase...' : 'Chọn tệp 3D (.glb / .gltf)'}</span>
                        <input
                          type="file"
                          accept=".glb,.gltf"
                          onChange={handleModelFileUpload}
                          disabled={isUploadingModel}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Hỗ trợ định dạng nhị phân GLB hoặc GLTF (tối đa 50 MB)
                      </p>
                    </div>

                    {isUploadingModel && (
                      <div className="w-full max-w-xs mx-auto space-y-1">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-teal-500 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-teal-400">{uploadProgress}%</span>
                      </div>
                    )}
                  </div>

                  {/* Current Model Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      Hoặc dán URL mô hình 3D trực tiếp:
                    </h4>
                    <input
                      type="text"
                      value={modelUrl}
                      onChange={(e) => setModelUrl(e.target.value)}
                      placeholder="https://storage.khtnthayhoang.edu.vn/.../model.glb"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                    />

                    {/* Pre-made Templates */}
                    <div className="pt-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5 font-semibold">
                        Hoặc chọn nhanh mô hình 3D mẫu có sẵn:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {SAMPLE_GLB_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.name}
                            type="button"
                            onClick={() => {
                              setModelUrl(tmpl.url);
                              setModelFileName(tmpl.fileName);
                              setModelFileSizeFormatted(tmpl.size);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold hover:bg-teal-600 hover:text-white transition"
                          >
                            + {tmpl.name} ({tmpl.size})
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
                  <h4 className="font-bold text-purple-900 dark:text-purple-200">
                    Chế độ lập trình TSX (Mode 2)
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Mô phỏng tùy chỉnh bằng TSX không cần tệp GLB tĩnh vì toàn bộ lưới hình học (mesh, vật liệu, shaders) được khởi tạo bằng mã React Three Fiber.
                  </p>
                </div>
              )}

              {/* Thumbnail Image */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white">Ảnh Bìa Mô Phỏng (Thumbnail)</h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-32 h-20 object-cover rounded-xl border border-slate-300 dark:border-slate-700 shrink-0"
                  />
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                    />
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingThumb ? 'Đang tải ảnh...' : 'Tải ảnh bìa từ máy tính'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EDUCATIONAL INFO (GDPT 2018) */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-900 dark:text-white block mb-1">
                    Tiêu đề mô phỏng 3D *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Cấu Trúc Không Gian DNA Xoắn Kép"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-900 dark:text-white">
                      Đường dẫn định danh (Slug) *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoSlug}
                      className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline"
                    >
                      Tự tạo từ tiêu đề
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="cau-truc-dna-xoan-kep"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="font-bold text-slate-900 dark:text-white block mb-1">Khối lớp</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value) as Grade)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value={6}>KHTN Lớp 6</option>
                    <option value={7}>KHTN Lớp 7</option>
                    <option value={8}>KHTN Lớp 8</option>
                    <option value={9}>KHTN Lớp 9</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-900 dark:text-white block mb-1">Phân môn</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as SubjectDomain)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value="hoa-hoc">Hóa học</option>
                    <option value="vat-li">Vật lí</option>
                    <option value="sinh-hoc">Sinh học</option>
                    <option value="trai-dat-vu-tru">Trái Đất và Vũ trụ</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-900 dark:text-white block mb-1">Độ khó</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  >
                    <option value="Cơ bản">Cơ bản</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Nâng cao">Nâng cao</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-900 dark:text-white block mb-1">Phiên bản (SemVer)</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 dark:text-white block mb-1">
                  Mã chương trình GDPT 2018
                </label>
                <input
                  type="text"
                  value={curriculumCode}
                  onChange={(e) => setCurriculumCode(e.target.value)}
                  placeholder="VD: GDPT 2018 - KHTN 9 (Chủ đề: Di truyền)"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 dark:text-white block mb-1">
                  Tóm tắt nội dung học tập *
                </label>
                <textarea
                  rows={3}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Mô tả ngắn gọn hiện tượng hoặc cấu trúc 3D mà học sinh sẽ quan sát..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              {/* Link with Lessons */}
              <div>
                <label className="font-bold text-slate-900 dark:text-white block mb-1">
                  Gắn với các bài học trong hệ thống
                </label>
                <div className="max-h-36 overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  {lessons.map((les) => (
                    <label key={les.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedLessons.includes(les.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLessons([...selectedLessons, les.id]);
                          } else {
                            setSelectedLessons(selectedLessons.filter((x) => x !== les.id));
                          }
                        }}
                        className="rounded accent-teal-600"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        [{les.code}] {les.title} (Lớp {les.grade})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PREDEFINED CONTROLS & HOTSPOTS */}
          {activeTab === 'controls' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Cấu Hình Các Bộ Điều Khiển Được Hệ Thống Cho Phép
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Tự động hóa toàn bộ tương tác 3D mà không phải viết mã JavaScript.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Tự quay 360° (Auto-rotate)</span>
                    <input
                      type="checkbox"
                      checked={controls.enableAutoRotate}
                      onChange={(e) =>
                        setControls({ ...controls, enableAutoRotate: e.target.checked })
                      }
                      className="rounded accent-teal-600 w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Tốc độ quay mặc định:</span>
                    <span className="font-mono text-teal-400">{controls.autoRotateSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.2"
                    value={controls.autoRotateSpeed}
                    onChange={(e) =>
                      setControls({ ...controls, autoRotateSpeed: parseFloat(e.target.value) })
                    }
                    className="w-full accent-teal-400 h-1 bg-slate-300 dark:bg-slate-700 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Khung dây (Wireframe)</span>
                    <input
                      type="checkbox"
                      checked={controls.enableWireframeToggle}
                      onChange={(e) =>
                        setControls({ ...controls, enableWireframeToggle: e.target.checked })
                      }
                      className="rounded accent-teal-600 w-4 h-4"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Cho phép học sinh quan sát lưới hình học 3D của đối tượng.
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Phân rã chi tiết (Explode)</span>
                    <input
                      type="checkbox"
                      checked={controls.enableExplode}
                      onChange={(e) =>
                        setControls({ ...controls, enableExplode: e.target.checked })
                      }
                      className="rounded accent-teal-600 w-4 h-4"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Cho phép kéo thanh trượt tách rời các bộ phận ra xa tâm để quan sát cấu trúc bên trong.
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Mặt cắt giải phẫu 3D (Clipping)</span>
                    <input
                      type="checkbox"
                      checked={controls.enableClipping}
                      onChange={(e) =>
                        setControls({ ...controls, enableClipping: e.target.checked })
                      }
                      className="rounded accent-teal-600 w-4 h-4"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Tạo mặt phẳng cắt dọc hoặc ngang đối tượng (Trục {controls.clippingAxis.toUpperCase()}).
                  </span>
                </div>
              </div>

              {/* 3D Hotspot Annotations Manager */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      Điểm Ghim Chú Thích 3D (Hotspots / Pins)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Hiển thị các điểm đánh số tương tác nổi trên mô hình.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newPin: SimulationAnnotation = {
                        id: `pin-${annotations.length + 1}`,
                        title: `Bộ phận ${annotations.length + 1}`,
                        description: 'Mô tả khoa học cho chi tiết này...',
                        position: [0, 0, 0],
                        color: '#0D9488',
                      };
                      setAnnotations([...annotations, newPin]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm điểm ghim</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {annotations.map((pin, index) => (
                    <div
                      key={pin.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                    >
                      <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">
                        #{index + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                        <input
                          type="text"
                          value={pin.title}
                          onChange={(e) => {
                            const updated = [...annotations];
                            updated[index].title = e.target.value;
                            setAnnotations(updated);
                          }}
                          placeholder="Tên bộ phận (VD: Khung đường)"
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-semibold"
                        />
                        <input
                          type="text"
                          value={pin.description}
                          onChange={(e) => {
                            const updated = [...annotations];
                            updated[index].description = e.target.value;
                            setAnnotations(updated);
                          }}
                          placeholder="Mô tả chi tiết giải thích..."
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setAnnotations(annotations.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700 p-1.5"
                        title="Xóa điểm ghim"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PEDAGOGY & QUESTIONS */}
          {activeTab === 'pedagogy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Kiến Thức Sư Phạm & Câu Hỏi Khám Phá
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Cung cấp góc nhìn chuyên sâu và bài tập trắc nghiệm tự rèn luyện cho học sinh THCS.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-900 dark:text-white block mb-1">
                  Tổng quan lý thuyết khoa học
                </label>
                <textarea
                  rows={3}
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  placeholder="Giải thích cơ chế khoa học, công thức hoặc hiện tượng tự nhiên..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 dark:text-white block mb-1">
                  Ứng dụng thực tiễn trong đời sống
                </label>
                <textarea
                  rows={2}
                  value={realWorldApp}
                  onChange={(e) => setRealWorldApp(e.target.value)}
                  placeholder="Công nghệ thực tế, ứng dụng y học, bảo vệ môi trường..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              {/* Discovery Questions List */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Câu Hỏi Trắc Nghiệm Khám Phá ({questions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const newQ: DiscoveryQuestionDef = {
                        id: `q${questions.length + 1}`,
                        question: 'Nêu câu hỏi khám phá mới:',
                        options: [
                          { id: 'a', text: 'Đáp án A (Đúng)', isCorrect: true },
                          { id: 'b', text: 'Đáp án B', isCorrect: false },
                          { id: 'c', text: 'Đáp án C', isCorrect: false },
                        ],
                        explanation: 'Giải thích chi tiết chuẩn GDPT 2018.',
                      };
                      setQuestions([...questions, newQ]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu hỏi</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {questions.map((q, qIndex) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Câu {qIndex + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIndex].question = e.target.value;
                          setQuestions(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                      />

                      {/* Options */}
                      <div className="space-y-1.5">
                        {q.options.map((opt, optIndex) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={opt.isCorrect}
                              onChange={() => {
                                const updated = [...questions];
                                updated[qIndex].options.forEach((o, i) => {
                                  o.isCorrect = i === optIndex;
                                });
                                setQuestions(updated);
                              }}
                              className="accent-teal-600"
                            />
                            <span className="font-mono font-bold uppercase text-teal-600 dark:text-teal-400">
                              {opt.id}.
                            </span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const updated = [...questions];
                                updated[qIndex].options[optIndex].text = e.target.value;
                                setQuestions(updated);
                              }}
                              className="flex-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                            />
                          </div>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIndex].explanation = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="Giải thích chuẩn..."
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] text-slate-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: JSON MANIFEST & SCHEMA VALIDATION */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Kiểm Tra Tính Hợp Lệ Của JSON Manifest
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Schema v1.0.0 đảm bảo tính an toàn và tương thích với Cloudflare Pages Free.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(JSON.stringify(currentManifest, null, 2));
                      setCopiedManifest(true);
                      setTimeout(() => setCopiedManifest(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5"
                  >
                    {copiedManifest ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedManifest ? 'Đã sao chép' : 'Sao chép JSON'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={runValidation}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold"
                  >
                    Chạy kiểm tra lại
                  </button>
                </div>
              </div>

              {/* Validation status badge */}
              {validationErrors.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Manifest JSON hoàn toàn hợp lệ theo chuẩn EdTech KHTN Thầy Hoàng!</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span>Phát hiện {validationErrors.length} lỗi trong Manifest:</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-2">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* JSON preview */}
              <pre className="p-4 rounded-2xl bg-slate-950 text-teal-300 font-mono text-[11px] overflow-x-auto max-h-80 border border-slate-800 leading-relaxed">
                {JSON.stringify(currentManifest, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 7: LIVE 3D PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Xem Trước Trực Tiếp Mô Hình 3D Trong Trình Duyệt
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Kiểm tra camera, ánh sáng và các điểm ghim trước khi lưu vào Supabase.
                  </p>
                </div>
              </div>

              <div className="w-full h-[480px] rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-xl">
                <ModelViewer manifest={currentManifest} />
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400">
              * Dữ liệu được lưu trữ tự động vào Supabase PostgreSQL & Storage
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEditing ? 'Cập nhật mô phỏng' : 'Lưu và xuất bản'}</span>
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

export const SimulationFormModal: React.FC<SimulationFormModalProps> = (props) => {
  if (!props.isOpen) return null;
  return (
    <SimulationFormModalContent
      simulation={props.simulation}
      lessons={props.lessons}
      onClose={props.onClose}
      onSaved={props.onSaved}
    />
  );
};
