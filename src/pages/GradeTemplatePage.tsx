import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Grade, SubjectDomain, Lesson, Simulation3D, DocumentResource, VideoResource } from '../types/index.ts';
import {
  HERO_LAB_IMAGE,
  GRADE_COVER_IMAGES,
  SIMULATIONS_3D,
  DOMAINS,
} from '../data/mockData.ts';
import {
  getLessonsByGrade,
  getPublishedLessonsSync,
  getAllDocumentsSync,
  getDocumentsByGrade,
  getVideosByGrade,
} from '../services/contentService.ts';
import {
  getAdminTopicsSync,
  getAdminVideosSync,
  getAdminQuestionsSync,
} from '../services/adminService.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { DocumentViewerModal } from '../components/common/DocumentViewerModal.tsx';
import {
  GeneratedDocumentData,
  createDocumentDataFromCatalogItem,
  triggerEducationalDocumentDownload,
} from '../utils/documentGenerator.ts';
import {
  BookOpen,
  Atom,
  FileText,
  Play,
  Award,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Download,
  ExternalLink,
  Layers,
  Eye,
} from 'lucide-react';

interface GradeTemplatePageProps {
  grade: Grade;
}

const GRADE_INFO: Record<
  Grade,
  {
    title: string;
    subtitle: string;
    description: string;
    gradient: string;
    bannerImage: string;
    stats: { topics: number; lessons: number; labs: number };
    competencies: string[];
  }
> = {
  6: {
    title: 'Khoa Học Tự Nhiên Lớp 6',
    subtitle: 'Khởi đầu hành trình khám phá Tế bào, Chất và Lực trong tự nhiên',
    description:
      'Làm quen với dụng cụ đo lường phòng thí nghiệm, tìm hiểu các thể của chất, vai trò của Oxygen và không khí, khám phá cấu trúc tế bào thực vật – động vật, phân loại thế giới sống và các loại lực cơ học.',
    gradient: 'from-emerald-700 via-teal-700 to-cyan-800',
    bannerImage: GRADE_COVER_IMAGES[6] || HERO_LAB_IMAGE,
    stats: { topics: 11, lessons: 42, labs: 10 },
    competencies: [
      'Sử dụng thành thạo kính lúp, kính hiển vi quang học và dụng cụ đo khối lượng, chiều dài, nhiệt độ',
      'Nhận biết tính chất của Oxygen (O₂), không khí và các phương pháp tách chất ra khỏi hỗn hợp',
      'Quan sát và vẽ sơ đồ cấu tạo tế bào biểu bì vảy hành, tế bào thực vật và tế bào động vật',
      'Biểu diễn lực, trọng lượng, lực ma sát và sự biến dạng của lò xo trong đời sống',
    ],
  },
  7: {
    title: 'Khoa Học Tự Nhiên Lớp 7',
    subtitle: 'Khám phá thế giới vi mô Nguyên tử, Bảng tuần hoàn IUPAC & Quang học',
    description:
      'Đi sâu vào cấu trúc nguyên tử theo mô hình Rutherford – Bohr, bảng tuần hoàn các nguyên tố hóa học theo danh pháp quốc tế IUPAC (Hydrogen, Carbon, Nitrogen, Oxygen, Sodium...), liên kết hóa học, tốc độ chuyển động, sóng âm, ánh sáng, từ trường và trao đổi chất ở sinh vật.',
    gradient: 'from-sky-700 via-blue-700 to-indigo-800',
    bannerImage: GRADE_COVER_IMAGES[7] || HERO_LAB_IMAGE,
    stats: { topics: 12, lessons: 45, labs: 12 },
    competencies: [
      'Mô tả cấu tạo nguyên tử gồm hạt nhân (proton, neutron) và lớp vỏ electron; tra cứu bảng tuần hoàn IUPAC',
      'Phân biệt liên kết ion (Sodium chloride NaCl) và liên kết cộng hóa trị (H₂O, CO₂) kèm công thức hóa trị',
      'Tính toán tốc độ v = s/t, đọc đồ thị quãng đường – thời gian, giải thích phản xạ ánh sáng và từ trường',
      'Trình bày cơ chế quang hợp ở Lục lạp, hô hấp tế bào và vận chuyển các chất ở thực vật, động vật',
    ],
  },
  8: {
    title: 'Khoa Học Tự Nhiên Lớp 8',
    subtitle: 'Làm chủ Phản ứng Hóa học, Acid – Base – pH, Áp suất & Định luật Ohm',
    description:
      'Nắm vững định luật bảo toàn khối lượng, tính toán theo Mol và nồng độ dung dịch, phân loại các hợp chất vô cơ theo danh pháp quốc tế (Acid, Base, Oxide, Muối), thang đo pH, khối lượng riêng, áp suất chất lỏng, mạch điện một chiều và giải phẫu sinh lí cơ thể người.',
    gradient: 'from-teal-700 via-cyan-700 to-sky-800',
    bannerImage: GRADE_COVER_IMAGES[8] || HERO_LAB_IMAGE,
    stats: { topics: 10, lessons: 48, labs: 14 },
    competencies: [
      'Lập phương trình hóa học, tính số mol, nồng độ phần trăm (C%) và nồng độ mol (CM)',
      'Nhận biết tính chất hóa học của Hydrochloric acid, Sulfuric acid, Sodium hydroxide, Calcium hydroxide và Oxide',
      'Giải bài tập khối lượng riêng, áp suất, lực đẩy Archimedes và mạch điện theo Định luật Ohm (I = U/R)',
      'Hiểu rõ cấu tạo và bảo vệ các hệ cơ quan trong cơ thể người: vận động, tuần hoàn, hô hấp, tiêu hóa, thần kinh',
    ],
  },
  9: {
    title: 'Khoa Học Tự Nhiên Lớp 9',
    subtitle: 'Tổng hợp Năng lượng, Khúc xạ ánh sáng, Hóa học Hữu cơ & Di truyền học DNA',
    description:
      'Hoàn thiện nền tảng KHTN bậc THCS với cơ năng, khúc xạ ánh sáng qua thấu kính, cảm ứng điện từ, dãy hoạt động hóa học của kim loại, hợp chất hữu cơ (Methane, Ethylene, Ethylic alcohol, Acetic acid, Glucose, Saccharose) và cơ sở di truyền học phân tử DNA – RNA – quy luật Mendel.',
    gradient: 'from-indigo-800 via-sky-800 to-teal-800',
    bannerImage: GRADE_COVER_IMAGES[9] || HERO_LAB_IMAGE,
    stats: { topics: 12, lessons: 52, labs: 15 },
    competencies: [
      'Vận dụng định luật khúc xạ ánh sáng, dựng ảnh qua thấu kính hội tụ – phân kì và tính công suất điện',
      'Trình bày dãy hoạt động hóa học của kim loại (K, Na, Mg, Al, Zn, Fe, Cu, Ag) và phương pháp tách kim loại',
      'Viết công thức cấu tạo và phương trình phản ứng của Alkane, Alkene, Ethylic alcohol, Acetic acid, Ester, Lipid',
      'Giải thích cấu trúc xoắn kép DNA, phiên mã RNA, dịch mã Protein và vận dụng quy luật di truyền Mendel',
    ],
  },
};

export const GradeTemplatePage: React.FC<GradeTemplatePageProps> = ({ grade }) => {
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'topics' | 'simulations' | 'docs' | 'quiz'>('topics');
  const [previewDocData, setPreviewDocData] = useState<GeneratedDocumentData | null>(null);
  const [gradeLessons, setGradeLessons] = useState<Lesson[]>(() =>
    getPublishedLessonsSync(grade)
  );
  const [gradeDocuments, setGradeDocuments] = useState<DocumentResource[]>(() =>
    getAllDocumentsSync(grade)
  );
  const [gradeVideos, setGradeVideos] = useState<VideoResource[]>(() =>
    getAdminVideosSync().filter((v) => v.grade === grade)
  );

  useEffect(() => {
    let mounted = true;
    setGradeLessons(getPublishedLessonsSync(grade));
    setGradeDocuments(getAllDocumentsSync(grade));
    setGradeVideos(getAdminVideosSync().filter((v) => v.grade === grade));

    Promise.all([
      getLessonsByGrade(grade),
      getDocumentsByGrade(grade),
      getVideosByGrade(grade),
    ]).then(([lessonsData, docsData, videosData]) => {
      if (mounted) {
        setGradeLessons(lessonsData);
        setGradeDocuments(docsData);
        setGradeVideos(videosData);
      }
    });

    return () => {
      mounted = false;
    };
  }, [grade]);

  const info = GRADE_INFO[grade];

  const allGradeTopics = getAdminTopicsSync().filter((t) => t.grade === grade);
  const gradeTopics = allGradeTopics.filter(
    (t) => selectedDomain === 'all' || t.domain === selectedDomain
  );
  const filteredLessons = gradeLessons.filter(
    (l) => selectedDomain === 'all' || l.domain === selectedDomain
  );
  const gradeSimulations: Simulation3D[] = SIMULATIONS_3D.filter(
    (s) => s.grade === grade && (selectedDomain === 'all' || s.domain === selectedDomain)
  );
  const filteredDocuments = gradeDocuments.filter(
    (d) => selectedDomain === 'all' || d.domain === selectedDomain
  );
  const filteredVideos = gradeVideos.filter(
    (v) => selectedDomain === 'all' || v.domain === selectedDomain
  );
  const gradeQuizzes = getAdminQuestionsSync().filter(
    (q) => q.grade === grade && (selectedDomain === 'all' || q.domain === selectedDomain)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: `Khoa học tự nhiên Lớp ${grade}` }]} />

        {/* 1. Harmonious Illustrated Grade Hero Header */}
        <div
          className={`relative rounded-3xl bg-gradient-to-r ${info.gradient} text-white p-6 sm:p-10 overflow-hidden shadow-xl`}
        >
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>KHOA HỌC SỐ KHTN • Khối lớp {grade}</span>
                <span>•</span>
                <span>Bộ sách Kết nối tri thức với cuộc sống</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {info.title}
              </h1>
              <p className="text-amber-200 font-bold text-base sm:text-lg">
                {info.subtitle}
              </p>
              <p className="text-white/95 text-xs sm:text-sm leading-relaxed max-w-2xl">
                {info.description}
              </p>

              {/* Stats Box */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950/30 backdrop-blur-md p-4 rounded-2xl border border-white/25 text-center max-w-md pt-3">
                <div>
                  <div className="text-2xl font-black font-mono text-amber-300">
                    {allGradeTopics.length}
                  </div>
                  <div className="text-xs text-white/90 mt-0.5 font-semibold">Chủ đề</div>
                </div>
                <div className="border-x border-white/20">
                  <div className="text-2xl font-black font-mono text-cyan-200">
                    {gradeLessons.length}
                  </div>
                  <div className="text-xs text-white/90 mt-0.5 font-semibold">Bài giảng</div>
                </div>
                <div>
                  <div className="text-2xl font-black font-mono text-emerald-200">
                    {SIMULATIONS_3D.filter((s) => s.grade === grade).length}
                  </div>
                  <div className="text-xs text-white/90 mt-0.5 font-semibold">Thí nghiệm số</div>
                </div>
              </div>
            </div>

            {/* Grade Visual Illustration Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-slate-900/40">
                <img
                  src={info.bannerImage}
                  alt={info.title}
                  className="w-full h-56 sm:h-64 object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Core Competencies Checklist */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-teal-100 dark:border-slate-800 shadow-sm">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <span>Mục Tiêu Kiến Thức & Năng Lực Trọng Tâm Lớp {grade} (Sách Kết nối tri thức)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {info.competencies.map((comp, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-teal-50/70 to-sky-50/50 dark:from-slate-800 dark:to-slate-800/70 border border-teal-100 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
              >
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  {index + 1}
                </span>
                <span className="leading-relaxed font-medium">{comp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Filter by 3 Subject Domains & Content Tabs */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
          {/* 3 Domain Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-teal-600" /> 3 Phân môn:
            </span>
            {(
              [
                { id: 'all', label: 'Tất cả 3 phân môn' },
                { id: 'vat-li', label: 'Vật lí' },
                { id: 'hoa-hoc', label: 'Hóa học' },
                { id: 'sinh-hoc', label: 'Sinh học' },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  selectedDomain === d.id
                    ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex items-center gap-1.5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('topics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                activeTab === 'topics'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Chuyên đề & Bài học ({filteredLessons.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('simulations')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                activeTab === 'simulations'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Atom className="w-4 h-4" />
              <span>Mô phỏng 3D ({gradeSimulations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Học liệu & Video ({filteredDocuments.length + filteredVideos.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Câu hỏi ôn tập ({gradeQuizzes.length})</span>
            </button>
          </div>
        </div>

        {/* 4. Dynamic Content Section */}
        {activeTab === 'topics' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Topics List with Visual Thumbnails (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <span>Danh mục Chủ đề Lớp {grade}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                  {gradeTopics.length} chủ đề
                </span>
              </h3>
              <div className="space-y-3">
                {gradeTopics.map((topic) => {
                  const domainObj = DOMAINS.find((d) => d.id === topic.domain);
                  return (
                    <div
                      key={topic.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:border-teal-300 transition flex items-start gap-3.5"
                    >
                      <img
                        src={topic.image || domainObj?.image || HERO_LAB_IMAGE}
                        alt={topic.title}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700">
                            {topic.chapterNumber} • {domainObj?.shortName}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">
                            {topic.lessonsCount} bài
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {topic.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {topic.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Detailed Lessons List (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <span>Bài học chi tiết & Lý thuyết chuẩn Kết nối tri thức</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
                  {filteredLessons.length} bài giảng
                </span>
              </h3>

              <div className="space-y-4">
                {filteredLessons.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      Chưa có bài giảng nào trong mục này.
                    </p>
                  </div>
                ) : (
                  filteredLessons.map((lesson) => {
                    const domainObj = DOMAINS.find((d) => d.id === lesson.domain);
                    return (
                      <Link
                        key={lesson.id}
                        to={`/bai-hoc/${lesson.id}`}
                        className="block p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-400 transition group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <img
                              src={lesson.thumbnailUrl || domainObj?.image || HERO_LAB_IMAGE}
                              alt={lesson.title}
                              className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-slate-200 hidden sm:block"
                            />
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-mono font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                                  {lesson.code}
                                </span>
                                <span className="text-xs font-bold text-sky-600">
                                  {domainObj?.shortName}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> {lesson.durationMinutes} phút
                                </span>
                                {lesson.simulationId && (
                                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                                    <Atom className="w-3 h-3" /> Có mô phỏng 3D
                                  </span>
                                )}
                              </div>

                              <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 transition">
                                {lesson.title}
                              </h4>

                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {lesson.summary}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5 text-xs font-extrabold text-teal-600 group-hover:translate-x-1 transition self-end sm:self-center">
                            <span>Vào học</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gradeSimulations.map((sim) => (
              <Link
                key={sim.id}
                to={`/mo-phong/${sim.id}`}
                className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition flex flex-col justify-between"
              >
                <div className="relative h-48 overflow-hidden bg-slate-900">
                  <img
                    src={sim.thumbnail}
                    alt={sim.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 text-teal-300 text-xs font-bold">
                    {sim.category}
                  </span>
                </div>
                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-teal-600 transition">
                      {sim.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {sim.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold text-teal-600">
                    <span>Mở KHOA HỌC SỐ KHTN 3D</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Tài liệu &amp; Giáo án Lớp {grade} (Sách Kết nối tri thức)
              </h3>
              {filteredDocuments.map((doc) => {
                const docData = createDocumentDataFromCatalogItem(doc);
                const hasRealFile = docData.hasTeacherFile;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setPreviewDocData(docData)}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 hover:border-teal-400 flex items-center justify-between gap-4 cursor-pointer transition group"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                          {docData.format} • {doc.type}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            hasRealFile
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {hasRealFile ? 'Đã có file gốc GV' : 'Chưa tải file lên'}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 transition">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-slate-500">{doc.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDocData(docData);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem
                      </button>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await triggerEducationalDocumentDownload(docData);
                          if (!ok) {
                            setPreviewDocData(docData);
                          }
                        }}
                        className={`px-3 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          hasRealFile
                            ? 'bg-teal-600 hover:bg-teal-500'
                            : 'bg-amber-600 hover:bg-amber-500'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" /> Tải về
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Video Bài Giảng & Thí Nghiệm Trực Quan Lớp {grade}
              </h3>
              {filteredVideos.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                  Chưa có video nào cho khối lớp này.
                </div>
              ) : (
                filteredVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700">
                        Thời lượng: {vid.duration} • KHOA HỌC SỐ KHTN
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{vid.title}</h4>
                      <p className="text-xs text-slate-500">{vid.summary || vid.description}</p>
                    </div>
                    <Link
                      to="/video"
                      className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" /> Xem
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Câu Hỏi Trắc Nghiệm Ôn Tập KHTN Lớp {grade}
                </h3>
                <p className="text-xs text-slate-500">
                  Biên soạn bám sát sách Kết nối tri thức với cuộc sống và danh pháp quốc tế IUPAC
                </p>
              </div>
              <Link
                to={`/luyen-tap?grade=${grade}`}
                className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Làm bài kiểm tra tính giờ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {gradeQuizzes.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
                      Câu {idx + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">Mức độ: {q.difficulty}</span>
                  </div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{q.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className="text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        {String.fromCharCode(65 + optIdx)}. {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DocumentViewerModal
        docData={previewDocData}
        onClose={() => setPreviewDocData(null)}
        onUploadedSuccess={() => {
          getDocumentsByGrade(grade).then((docsData) => {
            setGradeDocuments(docsData);
          });
        }}
      />
    </div>
  );
};

export const Grade6Page: React.FC = () => <GradeTemplatePage grade={6} />;
export const Grade7Page: React.FC = () => <GradeTemplatePage grade={7} />;
export const Grade8Page: React.FC = () => <GradeTemplatePage grade={8} />;
export const Grade9Page: React.FC = () => <GradeTemplatePage grade={9} />;

