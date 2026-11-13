import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HERO_LAB_IMAGE,
  GAMES_ARENA_IMAGE,
  GRADE_COVER_IMAGES,
  DOMAINS,
  SIMULATIONS_3D,
} from '../data/mockData.ts';
import { getPublishedLessonsSync } from '../services/contentService.ts';
import {
  getAdminTopicsSync,
  getAdminQuestionsSync,
  getAdminCatalogDocsSync,
} from '../services/adminService.ts';
import { HeroAtomVisualizer } from '../components/home/HeroAtomVisualizer.tsx';
import {
  Atom,
  BookOpen,
  FileText,
  Award,
  ArrowRight,
  Search,
  FlaskConical,
  Zap,
  Dna,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Gamepad2,
  MapPin,
  Mail,
  Phone,
  Microscope,
  Play,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [, setCmsTick] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onCmsUpdated = () => setCmsTick((t) => t + 1);
    window.addEventListener('khtn-cms-updated', onCmsUpdated);
    return () => window.removeEventListener('khtn-cms-updated', onCmsUpdated);
  }, []);

  const liveLessons = getPublishedLessonsSync();
  const liveTopics = getAdminTopicsSync();
  const liveQuestions = getAdminQuestionsSync();
  const liveDocs = getAdminCatalogDocsSync();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/chuyen-de?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const quickTags = [
    { label: 'Nguyên tử IUPAC', query: 'Nguyên tử' },
    { label: 'Acid - Base - pH', query: 'Acid' },
    { label: 'Tế bào quang học', query: 'Tế bào' },
    { label: 'Định luật Ohm', query: 'Ohm' },
    { label: 'Phân tử DNA', query: 'DNA' },
  ];

  const getDomainIcon = (iconName: string) => {
    switch (iconName) {
      case 'FlaskConical':
        return <FlaskConical className="w-5 h-5" />;
      case 'Zap':
        return <Zap className="w-5 h-5" />;
      case 'Dna':
        return <Dna className="w-5 h-5" />;
      default:
        return <Atom className="w-5 h-5" />;
    }
  };

  const gradesInfo = [
    {
      grade: 6,
      title: 'Khoa học tự nhiên 6',
      subtitle: 'Khám phá Tế bào, Chất & Lực trong đời sống',
      topicsCount: liveTopics.filter((t) => t.grade === 6).length,
      lessonsCount: liveLessons.filter((l) => l.grade === 6).length,
      highlight: 'Đo lường, Oxygen & Không khí, Tế bào cơ sở sự sống, Lực & Ma sát',
      accentPill: 'bg-emerald-500 text-white',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      borderHover: 'hover:border-emerald-400',
      image: GRADE_COVER_IMAGES[6] || HERO_LAB_IMAGE,
    },
    {
      grade: 7,
      title: 'Khoa học tự nhiên 7',
      subtitle: 'Vi mô Nguyên tử, Quang học & Trao đổi chất',
      topicsCount: liveTopics.filter((t) => t.grade === 7).length,
      lessonsCount: liveLessons.filter((l) => l.grade === 7).length,
      highlight: 'Nguyên tử Rutherford-Bohr, Bảng tuần hoàn IUPAC, Tốc độ, Âm thanh, Quang hợp',
      accentPill: 'bg-sky-500 text-white',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
      borderHover: 'hover:border-sky-400',
      image: GRADE_COVER_IMAGES[7] || HERO_LAB_IMAGE,
    },
    {
      grade: 8,
      title: 'Khoa học tự nhiên 8',
      subtitle: 'Phản ứng Hóa học, Điện học & Sinh học cơ thể người',
      topicsCount: liveTopics.filter((t) => t.grade === 8).length,
      lessonsCount: liveLessons.filter((l) => l.grade === 8).length,
      highlight: 'Mol, Acid - Base - Oxide - pH, Khối lượng riêng & Áp suất, Mạch điện',
      accentPill: 'bg-teal-600 text-white',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
      borderHover: 'hover:border-teal-400',
      image: GRADE_COVER_IMAGES[8] || HERO_LAB_IMAGE,
    },
    {
      grade: 9,
      title: 'Khoa học tự nhiên 9',
      subtitle: 'Khúc xạ ánh sáng, Hợp chất hữu cơ & Di truyền DNA',
      topicsCount: liveTopics.filter((t) => t.grade === 9).length,
      lessonsCount: liveLessons.filter((l) => l.grade === 9).length,
      highlight: 'Thấu kính, Cảm ứng điện từ, Kim loại, Alkane/Ethanol, DNA - RNA - Mendel',
      accentPill: 'bg-indigo-600 text-white',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
      borderHover: 'hover:border-indigo-400',
      image: GRADE_COVER_IMAGES[9] || HERO_LAB_IMAGE,
    },
  ];

  return (
    <div className="space-y-16 pb-16 bg-gradient-to-b from-sky-50/50 via-slate-50 to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* 1. HARMONIOUS, ILLUSTRATED HERO SECTION FOR THCS STUDENTS */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-800 via-sky-800 to-indigo-900 text-white pt-8 pb-14 lg:py-16 shadow-xl border-b border-teal-500/30">
        {/* Soft luminous background glow */}
        <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-8 w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Inspiring Value Proposition & Search */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex flex-wrap items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-teal-100 text-xs sm:text-sm font-bold shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>PHÒNG THÍ NGHIỆM KHOA HỌC SỐ • Dành cho Học sinh THCS (Lớp 6 – 9)</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[50px] font-black tracking-tight leading-[1.14] text-white">
                Khám Phá Thế Giới{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-teal-200 to-sky-200">
                  KHOA HỌC TỰ NHIÊN
                </span>{' '}
                Trực Quan & Đầy Cảm Hứng
              </h1>

              <p className="text-sky-100/95 text-base sm:text-lg leading-relaxed max-w-2xl font-medium">
                Không gian học tập trực quan môn <strong className="text-white">Khoa học tự nhiên (Lớp 6, 7, 8, 9)</strong> theo bộ sách{' '}
                <strong className="text-amber-200">Kết nối tri thức với cuộc sống</strong>. Kết nối 3 phân môn{' '}
                <strong className="text-teal-200">Vật lí · Hóa học · Sinh học</strong> qua hình ảnh minh họa sinh động, thí nghiệm 3D tương tác và danh pháp quốc tế IUPAC.
              </p>

              {/* Quick Search Bar + Interactive Topic Chips */}
              <div className="space-y-3 max-w-xl">
                <form onSubmit={handleSearch}>
                  <div className="relative flex items-center">
                    <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm bài học: Nguyên tử, Acid - Base, Định luật Ohm, Tế bào, DNA..."
                      className="w-full pl-12 pr-32 py-4 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm font-medium shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-300/60"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white font-bold text-xs sm:text-sm transition shadow-md cursor-pointer"
                    >
                      Tìm kiếm
                    </button>
                  </div>
                </form>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-sky-200/90 font-semibold">Khám phá nhanh:</span>
                  {quickTags.map((tag) => (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => navigate(`/chuyen-de?q=${encodeURIComponent(tag.query)}`)}
                      className="px-2.5 py-1 rounded-lg bg-white/12 hover:bg-white/25 border border-white/20 text-white font-semibold transition cursor-pointer"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  to="/phong-thi-nghiem-3d"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm shadow-lg shadow-teal-950/30 transition flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <Microscope className="w-5 h-5" />
                  <span>Phòng Thí Nghiệm 3D</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/tro-choi"
                  className="px-5 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-md transition flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span>Đấu Trường Trò Chơi KHTN</span>
                </Link>

                <Link
                  to="/chuyen-de"
                  className="px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/25 backdrop-blur-md transition flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-sky-200" />
                  <span>Kho Bài Giảng (6–9)</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Vivid Illustrated Lab Showcase + Interactive 3D Bohr Atom */}
            <div className="lg:col-span-5 space-y-4">
              {/* Featured THCS Science Lab Illustration Card */}
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/30 shadow-2xl bg-slate-900/40 group">
                <img
                  src={HERO_LAB_IMAGE}
                  alt="Phòng thí nghiệm Khoa học tự nhiên THCS trực quan"
                  className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-transparent flex flex-col justify-end p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-400/30 border border-teal-300/40 text-teal-100 text-[11px] font-bold mb-1">
                        <Sparkles className="w-3 h-3 text-amber-300" /> Trực quan hóa kiến thức THCS
                      </span>
                      <h2 className="text-sm sm:text-base font-extrabold text-white">
                        Thí Nghiệm Trực Quan • Học Đi Đôi Với Hành
                      </h2>
                    </div>
                    <Link
                      to="/phong-thi-nghiem-3d"
                      className="px-3.5 py-2 rounded-xl bg-white text-teal-900 font-extrabold text-xs shadow hover:bg-teal-50 transition shrink-0 flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-teal-700 text-teal-700" /> Mở Lab
                    </Link>
                  </div>
                </div>
              </div>

              {/* Interactive Rutherford-Bohr Atom Widget */}
              <HeroAtomVisualizer />
            </div>
          </div>
        </div>
      </section>

      {/* 2. LỘ TRÌNH 4 KHỐI LỚP THCS (LỚP 6 - 7 - 8 - 9) VỚI HÌNH MINH HỌA RIÊNG BIỆT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
              <GraduationCap className="w-4 h-4" /> Chương trình GDPT 2018 • THCS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Chọn Khối Lớp Của Em (Lớp 6 – Lớp 9)
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Mỗi khối lớp được thiết kế với lộ trình bài giảng, hình ảnh minh họa trực quan, video và phòng thí nghiệm 3D riêng biệt
            </p>
          </div>
          <Link
            to="/chu-de"
            className="text-sm font-extrabold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1.5 self-start md:self-auto"
          >
            <span>Xem toàn bộ {liveTopics.length} chủ đề</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gradesInfo.map((item) => (
            <Link
              key={item.grade}
              to={`/lop-${item.grade}`}
              className={`group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-200/80 dark:border-slate-800 ${item.borderHover} shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between`}
            >
              {/* Clear, Vibrant Custom Illustration Header */}
              <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider shadow-md ${item.accentPill}`}>
                    Khối {item.grade}
                  </span>
                  <span className="text-xs font-extrabold bg-white/95 text-slate-900 px-2.5 py-1 rounded-xl shadow">
                    {item.lessonsCount} bài học
                  </span>
                </div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="text-xl font-black tracking-tight drop-shadow-sm">
                    {item.title}
                  </h3>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug">
                    {item.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong className="text-slate-700 dark:text-slate-300">Trọng tâm:</strong> {item.highlight}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${item.badgeBg}`}>
                    {item.topicsCount} chủ đề
                  </span>
                  <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition inline-flex items-center gap-1">
                    Vào lớp {item.grade} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. 3 PHÂN MÔN KHOA HỌC TỰ NHIÊN (HÓA HỌC - VẬT LÍ - SINH HỌC) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
              <Atom className="w-4 h-4" /> Tích hợp liên môn KHTN
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              3 Mạch Kiến Thức Khoa Học Tự Nhiên Trọng Tâm
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Hình ảnh minh họa trực quan, mô phỏng tương tác và thuật ngữ chuẩn quốc tế IUPAC giúp học sinh dễ hiểu – nhớ lâu
            </p>
          </div>
          <Link
            to="/chuyen-de"
            className="text-sm font-extrabold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1"
          >
            <span>Khám phá theo phân môn</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DOMAINS.map((domain) => (
            <Link
              key={domain.id}
              to={`/chuyen-de?domain=${domain.id}`}
              className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-200/80 dark:border-slate-800 hover:border-teal-400 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Crisp Illustrated Cover */}
              <div className="relative h-52 overflow-hidden bg-slate-100">
                <img
                  src={domain.image || HERO_LAB_IMAGE}
                  alt={domain.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute top-3.5 left-3.5 px-3.5 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-extrabold shadow-md flex items-center gap-1.5">
                  <span className={domain.color}>{getDomainIcon(domain.iconName)}</span>
                  <span>Phân môn {domain.shortName}</span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 transition">
                    {domain.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {domain.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold text-teal-600 dark:text-teal-400">
                  <span>Xem chuyên đề & mô phỏng {domain.shortName}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. PHÒNG THÍ NGHIỆM ẢO & MÔ PHỎNG 3D TƯƠNG TÁC */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-indigo-950 rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-xl relative overflow-hidden border border-teal-500/30">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-extrabold uppercase tracking-wider">
                  <Atom className="w-4 h-4" />
                  <span>PHÒNG THÍ NGHIỆM ẢO • Trực quan hóa 3D</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  Thí Nghiệm Ảo & Mô Hình 3D Tương Tác
                </h2>
                <p className="text-sky-100/90 text-sm sm:text-base">
                  Xoay 360° cấu trúc nguyên tử Bohr, cân bằng phương trình hóa học 3D, chuẩn độ Acid – Base, lắp ráp mạch điện Định luật Ohm và quan sát tế bào dưới kính hiển vi.
                </p>
              </div>
              <Link
                to="/phong-thi-nghiem-3d"
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold text-xs sm:text-sm transition flex items-center gap-2 self-start md:self-auto shadow-lg"
              >
                <span>Mở Phòng Thí Nghiệm 3D</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SIMULATIONS_3D.slice(0, 6).map((sim) => (
                <Link
                  key={sim.id}
                  to={`/mo-phong/${sim.id}`}
                  className="group bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl overflow-hidden border border-white/15 hover:border-teal-300/60 transition-all duration-300 flex flex-col justify-between shadow-lg"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img
                      src={sim.thumbnail}
                      alt={sim.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 text-teal-200 border border-teal-400/40 text-xs font-bold shadow">
                      Lớp {sim.grade} • {sim.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="text-base font-extrabold text-white group-hover:text-teal-200 transition">
                        {sim.title}
                      </h3>
                      <p className="text-xs text-slate-200/90 line-clamp-2 leading-relaxed">
                        {sim.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                      <span className="text-teal-300 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Tương tác 3D trực tiếp
                      </span>
                      <span className="text-white font-extrabold group-hover:translate-x-1 transition">
                        Thực hành →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. BÀI GIẢNG TIÊU BIỂU & ĐẤU TRƯỜNG TRÒ CHƠI KHTN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Cols: Featured Lessons with Vivid Thumbnails */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Bài học tiêu biểu • Kết nối tri thức
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Bài Giảng Khoa Học Tự Nhiên Minh Họa Đẹp
              </h2>
            </div>
            <Link
              to="/chuyen-de"
              className="text-xs sm:text-sm font-extrabold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả ({liveLessons.length})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {liveLessons.slice(0, 5).map((lesson) => {
              const domainObj = DOMAINS.find((d) => d.id === lesson.domain);
              return (
                <Link
                  key={lesson.id}
                  to={`/bai-hoc/${lesson.id}`}
                  className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/70 dark:border-slate-800 hover:border-teal-500 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <img
                      src={lesson.thumbnailUrl || domainObj?.image || HERO_LAB_IMAGE}
                      alt={lesson.title}
                      className="w-24 h-20 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          Lớp {lesson.grade} • {lesson.code}
                        </span>
                        <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                          {domainObj?.shortName}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 transition text-sm sm:text-base">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {lesson.summary}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition shrink-0 self-end sm:self-center" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Illustrated Science Games Arena & Self-Practice */}
        <div className="lg:col-span-5 space-y-6">
          {/* Illustrated Science Games Banner Card */}
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-teal-700 via-sky-700 to-indigo-800 text-white shadow-xl border border-teal-400/30">
            <div className="relative h-44 overflow-hidden">
              <img
                src={GAMES_ARENA_IMAGE}
                alt="Đấu trường trò chơi Khoa học tự nhiên THCS"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-950/85 via-teal-950/20 to-transparent" />
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase shadow">
                <Gamepad2 className="w-4 h-4" />
                <span>Vừa Học Vừa Chơi</span>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <h3 className="text-xl font-black leading-snug text-white">
                Giải Mã Ô Chữ, Ghép Thẻ Trí Nhớ & Thám Tử Phòng Lab
              </h3>
              <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
                Chinh phục thử thách ô chữ Hóa học chuẩn danh pháp quốc tế IUPAC (Oxygen, Hydrogen, Acid, Base), Vật lí (Định luật Ohm) và Sinh học (Tế bào, Lục lạp, DNA).
              </p>
              <Link
                to="/tro-choi"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition"
              >
                <span>Vào Đấu Trường Trò Chơi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Quiz Practice Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800">
                Ngân hàng câu hỏi ({liveQuestions.length}+ câu)
              </span>
              <Award className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Luyện Tập & Tự Kiểm Tra Theo Chuyên Đề
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Hệ thống câu hỏi trắc nghiệm khách quan, Đúng/Sai và tự luận ngắn phân hóa theo 3 phân môn Vật lí, Hóa học, Sinh học có lời giải ngắn gọn, dễ hiểu.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link
                to="/luyen-tap"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Làm bài luyện tập ngay</span>
              </Link>
              <Link
                to="/tai-lieu"
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Tải học liệu ({liveDocs.length})</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CAM KẾT AN TOÀN HỌC ĐƯỜNG & BẢO VỆ DỮ LIỆU HỌC SINH (DƯỚI 13 TUỔI & THCS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-teal-500/30 dark:border-teal-800/60 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-extrabold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tiêu Chuẩn An Toàn Học Đường & Bảo Vệ Học Sinh THCS (Lớp 6 – Lớp 9)
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Nguyên Tắc &ldquo;3 Không&rdquo; Bảo Vệ Tuyệt Đối Dữ Liệu Học Sinh
              </h2>
            </div>
            <Link
              to="/tien-do"
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold transition self-start md:self-center shrink-0 shadow-xs"
            >
              Mở Sổ Tay Tự Học Riêng Tư
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-slate-800/60 border border-teal-200/70 dark:border-slate-700/80 space-y-1.5">
              <div className="font-extrabold text-teal-800 dark:text-teal-300">
                1. Không đưa dữ liệu cá nhân học sinh vào AI bên ngoài
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Hệ thống chấm điểm và giải bài tập hoạt động bằng thuật toán sư phạm nội bộ kết hợp bộ lọc tự động xóa thông tin định danh cá nhân (PII), tuyệt đối không gửi dữ liệu học sinh vào công cụ AI chưa được nhà trường phê duyệt.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-slate-800/60 border border-sky-200/70 dark:border-slate-700/80 space-y-1.5">
              <div className="font-extrabold text-sky-800 dark:text-sky-300">
                2. Không yêu cầu học sinh (nhất là dưới 13 tuổi) tạo tài khoản
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Học sinh Lớp 6, Lớp 7 (dưới 13 tuổi) và Lớp 8, Lớp 9 truy cập trực tiếp toàn bộ bài giảng, mô phỏng 3D và đề luyện tập mà không cần đăng ký tài khoản trên bất kỳ nền tảng bên ngoài nào.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/60 border border-indigo-200/70 dark:border-slate-700/80 space-y-1.5">
              <div className="font-extrabold text-indigo-800 dark:text-indigo-300">
                3. Không công khai thông tin hoặc thành tích từng học sinh
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Không hiển thị bảng xếp hạng cá nhân hay công khai điểm số học sinh. Kết quả tự luyện chỉ lưu cục bộ trên trình duyệt thiết bị cá nhân để học sinh tự theo dõi tiến bộ của chính mình.
              </p>
            </div>
          </div>
        </div>

        {/* 7. KHOA HỌC SỐ KHTN — THÔNG TIN LIÊN HỆ & ĐỊA ĐIỂM ĐÀ NẴNG */}
        <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-emerald-50 dark:from-slate-900 dark:to-slate-900 rounded-3xl p-8 sm:p-10 border-2 border-teal-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-extrabold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" />
              <span>KHTN THẦY HOÀNG • PHÒNG THÍ NGHIỆM KHOA HỌC SỐ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Đồng Hành Cùng Học Sinh THCS Chinh Phục Khoa Học Tự Nhiên
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Biên soạn bám sát bộ sách <strong>Kết nối tri thức với cuộc sống</strong> với hệ thống thuật ngữ Hóa học chuẩn quốc tế (Hydrogen, Oxygen, Sodium, Acid, Base, Oxide...) giúp học sinh tự học hiệu quả, trực quan và hứng thú mỗi ngày.
            </p>
          </div>

          <div className="lg:col-span-4 bg-white dark:bg-slate-950 rounded-2xl p-5 border border-teal-200 dark:border-slate-800 shadow-xs space-y-3 text-xs sm:text-sm">
            <div className="font-extrabold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
              Thông Tin Liên Hệ & Hỗ Trợ Học Tập
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Địa điểm: <strong>Đà Nẵng, Việt Nam</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-sky-600 shrink-0" />
              <a href="mailto:hoang08shh@gmail.com" className="hover:text-teal-600 font-bold">
                hoang08shh@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              <a
                href="https://zalo.me/0793565756"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-teal-600 font-bold"
              >
                Zalo: 0793565756
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
