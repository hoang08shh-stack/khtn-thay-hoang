import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HERO_LAB_IMAGE,
  DOMAINS,
  LESSONS,
  SIMULATIONS_3D,
  DOCUMENTS,
  QUIZ_QUESTIONS,
} from '../data/mockData.ts';
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
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/chuyen-de?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const getDomainIcon = (iconName: string) => {
    switch (iconName) {
      case 'FlaskConical':
        return <FlaskConical className="w-6 h-6" />;
      case 'Zap':
        return <Zap className="w-6 h-6" />;
      case 'Dna':
        return <Dna className="w-6 h-6" />;
      default:
        return <Atom className="w-6 h-6" />;
    }
  };

  const gradesInfo = [
    {
      grade: 6,
      title: 'Khoa học tự nhiên 6',
      subtitle: 'Khám phá Tế bào, Chất & Lực trong đời sống',
      topicsCount: 11,
      lessonsCount: 42,
      highlight: 'Đo lường, Oxygen & Không khí, Tế bào cơ sở sự sống, Lực & Ma sát',
      gradient: 'from-teal-800 via-teal-700 to-slate-800',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
      image: DOMAINS[2]?.image || HERO_LAB_IMAGE,
    },
    {
      grade: 7,
      title: 'Khoa học tự nhiên 7',
      subtitle: 'Vi mô Nguyên tử, Quang học & Trao đổi chất',
      topicsCount: 12,
      lessonsCount: 45,
      highlight: 'Nguyên tử, Bảng tuần hoàn IUPAC, Tốc độ, Âm thanh, Quang hợp',
      gradient: 'from-sky-800 via-slate-800 to-indigo-900',
      badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
      image: DOMAINS[0]?.image || HERO_LAB_IMAGE,
    },
    {
      grade: 8,
      title: 'Khoa học tự nhiên 8',
      subtitle: 'Phản ứng Hóa học, Điện học & Sinh học cơ thể người',
      topicsCount: 10,
      lessonsCount: 48,
      highlight: 'Mol, Acid - Base - Oxide - pH, Khối lượng riêng & Áp suất, Mạch điện',
      gradient: 'from-amber-800 via-stone-800 to-slate-800',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      image: DOMAINS[1]?.image || HERO_LAB_IMAGE,
    },
    {
      grade: 9,
      title: 'Khoa học tự nhiên 9',
      subtitle: 'Khúc xạ ánh sáng, Hợp chất hữu cơ & Di truyền DNA',
      topicsCount: 12,
      lessonsCount: 52,
      highlight: 'Thấu kính, Cảm ứng điện từ, Kim loại, Alkane/Ethanol, DNA - RNA - Mendel',
      gradient: 'from-indigo-900 via-slate-800 to-teal-900',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      image: HERO_LAB_IMAGE,
    },
  ];

  return (
    <div className="space-y-16 pb-16 bg-slate-100/80 dark:bg-slate-950">
      {/* 1. SOFT, EYE-FRIENDLY HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-teal-900 to-slate-900 text-slate-100 pt-10 pb-16 lg:py-20 shadow-lg border-b border-slate-700/60">
        {/* Decorative background image with muted overlay */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
          <img
            src={HERO_LAB_IMAGE}
            alt="KHOA HỌC SỐ KHTN"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-700/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-10 w-96 h-96 rounded-full bg-sky-700/15 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Brand Value Proposition & Search */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex flex-wrap items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/70 backdrop-blur-md border border-slate-600/60 text-slate-200 text-xs sm:text-sm font-bold shadow-sm">
                <Sparkles className="w-4 h-4 text-teal-300" />
                <span>KHOA HỌC SỐ KHTN • Bộ sách Kết nối tri thức với cuộc sống</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-black tracking-tight leading-[1.12] text-slate-100">
                Khám Phá Thế Giới{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-sky-200 to-emerald-200">
                  KHOA HỌC TỰ NHIÊN
                </span>{' '}
                Trực Quan & Sống Động
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-medium">
                Hệ thống học tập trực tuyến môn <strong className="text-slate-100">Khoa học tự nhiên (Lớp 6, 7, 8, 9)</strong> theo bộ sách{' '}
                <strong className="text-teal-200">Kết nối tri thức với cuộc sống</strong>. Tích hợp 3 phân môn{' '}
                <strong className="text-sky-200">Vật lí · Hóa học · Sinh học</strong> với mô phỏng 3D tương tác, danh pháp quốc tế IUPAC và trò chơi giải đố khoa học.
              </p>

              {/* Quick Search Bar */}
              <form onSubmit={handleSearch} className="max-w-xl">
                <div className="relative flex items-center">
                  <Search className="w-5 h-5 text-slate-500 absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm bài học: Nguyên tử, Acid - Base, Định luật Ohm, Tế bào, DNA..."
                    className="w-full pl-12 pr-32 py-4 rounded-2xl bg-slate-100 text-slate-800 placeholder-slate-500 text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </form>

              {/* Action CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  to="/phong-thi-nghiem-3d"
                  className="px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-md transition flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <Atom className="w-5 h-5" />
                  <span>Trải Nghiệm KHOA HỌC SỐ KHTN 3D</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/tro-choi"
                  className="px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-100 font-bold text-sm border border-slate-600/70 transition flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <Gamepad2 className="w-5 h-5 text-teal-300" />
                  <span>Đấu Trường Trò Chơi KHTN</span>
                </Link>

                <Link
                  to="/chuyen-de"
                  className="px-5 py-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-700/70 text-slate-200 font-bold text-sm border border-slate-600/50 transition flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-sky-300" />
                  <span>Tất cả bài giảng</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive Atom Visualizer + Bright Lab Illustration */}
            <div className="lg:col-span-5 space-y-4">
              <HeroAtomVisualizer />
              <div className="grid grid-cols-3 gap-3">
                {DOMAINS.map((d) => (
                  <Link
                    key={d.id}
                    to={`/chuyen-de?domain=${d.id}`}
                    className="group relative rounded-2xl overflow-hidden border-2 border-white/30 shadow-md h-24 block"
                  >
                    <img
                      src={d.image || HERO_LAB_IMAGE}
                      alt={d.shortName}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex items-end p-2.5">
                      <span className="text-xs font-extrabold text-white">{d.shortName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 3 PHÂN MÔN KHOA HỌC TỰ NHIÊN (VẬT LÍ - HÓA HỌC - SINH HỌC) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              3 Phân Môn Khoa Học Tự Nhiên Trọng Tâm
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Tích hợp xuyên suốt từ lớp 6 đến lớp 9 với hình ảnh trực quan, thí nghiệm 3D và danh pháp quốc tế chuẩn xác
            </p>
          </div>
          <Link
            to="/chuyen-de"
            className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <span>Khám phá toàn bộ chuyên đề</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DOMAINS.map((domain) => (
            <Link
              key={domain.id}
              to={`/chuyen-de?domain=${domain.id}`}
              className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Visual Cover Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={domain.image || HERO_LAB_IMAGE}
                  alt={domain.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${domain.gradient} opacity-35 group-hover:opacity-25 transition`}
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-slate-900 text-xs font-extrabold shadow-md flex items-center gap-1.5">
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

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400">
                  <span>Xem chuyên đề & mô phỏng {domain.shortName}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. LỘ TRÌNH 4 KHỐI LỚP THCS (LỚP 6 - 7 - 8 - 9) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Lộ Trình Học Tập KHTN Từ Lớp 6 Đến Lớp 9
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Chọn khối lớp của em để truy cập ngay hệ thống bài giảng lý thuyết, phòng thí nghiệm KHOA HỌC SỐ KHTN và bài tập tự luyện
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gradesInfo.map((item) => (
            <Link
              key={item.grade}
              to={`/lop-${item.grade}`}
              className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Bright Image Header */}
              <div className="relative h-36 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-tr ${item.gradient} opacity-80`} />
                <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-xl bg-white/25 backdrop-blur-md text-xs font-black uppercase tracking-wider">
                      Khối {item.grade}
                    </span>
                    <span className="text-xs font-bold bg-slate-950/30 px-2.5 py-1 rounded-lg">
                      {item.lessonsCount} bài học
                    </span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight drop-shadow-sm">
                    {item.title}
                  </h3>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {item.subtitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    <strong>Trọng tâm:</strong> {item.highlight}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${item.badgeBg}`}>
                    {item.topicsCount} chủ đề Kết nối tri thức
                  </span>
                  <span className="text-xs font-extrabold text-teal-600 group-hover:translate-x-1 transition inline-flex items-center gap-1">
                    Vào học <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. KHOA HỌC SỐ KHTN — MÔ PHỎNG 3D TƯƠNG TÁC */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-sky-900 via-indigo-950 to-teal-900 rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-2xl relative overflow-hidden border border-sky-400/30">
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-extrabold uppercase tracking-wider">
                  <Atom className="w-4 h-4" />
                  <span>KHOA HỌC SỐ KHTN • Trực quan hóa 3D</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  Thí Nghiệm Ảo & Mô Hình 3D Tương Tác
                </h2>
                <p className="text-sky-100/90 text-sm sm:text-base">
                  Quan sát cấu trúc nguyên tử Bohr (Hydrogen, Carbon, Oxygen, Sodium), chuẩn độ Acid – Base, lắp ráp mạch điện Định luật Ohm và xoay 360° chuỗi xoắn kép DNA.
                </p>
              </div>
              <Link
                to="/phong-thi-nghiem-3d"
                className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 self-start md:self-auto shadow-md"
              >
                <span>Mở KHOA HỌC SỐ KHTN</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SIMULATIONS_3D.slice(0, 6).map((sim) => (
                <Link
                  key={sim.id}
                  to={`/mo-phong/${sim.id}`}
                  className="group bg-slate-900/55 hover:bg-slate-900/75 backdrop-blur-md rounded-2xl overflow-hidden border border-slate-700/70 hover:border-teal-400/50 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={sim.thumbnail}
                      alt={sim.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-800/90 text-teal-200 border border-slate-600/60 text-xs font-bold shadow">
                      Lớp {sim.grade} • {sim.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="text-base font-extrabold text-slate-100 group-hover:text-teal-300 transition">
                        {sim.title}
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {sim.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-teal-300 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Tương tác 3D trực tiếp
                      </span>
                      <span className="text-slate-200 font-bold group-hover:translate-x-1 transition">
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

      {/* 5. FEATURED LESSONS & INTERACTIVE GAMES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Cols: Featured Lessons with Visual Thumbnails */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-600">
                Bài học tiêu biểu • Kết nối tri thức
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Bài Giảng Khoa Học Tự Nhiên Trực Quan
              </h2>
            </div>
            <Link
              to="/chuyen-de"
              className="text-xs sm:text-sm font-bold text-teal-600 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả ({LESSONS.length})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {LESSONS.slice(0, 5).map((lesson) => {
              const domainObj = DOMAINS.find((d) => d.id === lesson.domain);
              return (
                <Link
                  key={lesson.id}
                  to={`/bai-hoc/${lesson.id}`}
                  className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-teal-500 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <img
                      src={lesson.thumbnailUrl || domainObj?.image || HERO_LAB_IMAGE}
                      alt={lesson.title}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                          Lớp {lesson.grade} • {lesson.code}
                        </span>
                        <span className="text-xs font-bold text-sky-600">
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

        {/* Right 5 Cols: Interactive Games & Quick Self-Practice */}
        <div className="lg:col-span-5 space-y-6">
          {/* Muted Science Games Banner Card */}
          <div className="bg-gradient-to-br from-slate-800 via-teal-900 to-slate-900 rounded-3xl p-6 text-slate-100 shadow-lg border border-slate-700/70 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 text-xs font-extrabold uppercase">
              <Gamepad2 className="w-4 h-4" />
              <span>Trò Chơi Học Tập KHTN</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black leading-snug text-slate-100">
              Giải Mã Ô Chữ, Ghép Thẻ Trí Nhớ & Thám Tử Phòng Lab
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Vừa học vừa chơi với các câu đố ô chữ Hóa học chuẩn danh pháp quốc tế IUPAC (Oxygen, Hydrogen, Acid, Base), Vật lí (Định luật Ohm) và Sinh học (Tế bào, Lục lạp, DNA).
            </p>
            <Link
              to="/tro-choi"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-sm transition"
            >
              <span>Vào Đấu Trường Trò Chơi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Quiz Practice Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                Ngân hàng câu hỏi ({QUIZ_QUESTIONS.length}+ câu)
              </span>
              <Award className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Luyện Tập & Kiểm Tra Theo Bộ Sách Kết Nối Tri Thức
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Hệ thống câu hỏi trắc nghiệm khách quan phân hóa theo 3 phân môn Vật lí, Hóa học, Sinh học có giải thích chi tiết từng bước.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                to="/luyen-tap"
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Làm bài luyện tập ngay</span>
              </Link>
              <Link
                to="/tai-lieu"
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Tải học liệu ({DOCUMENTS.length})</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. KHOA HỌC SỐ KHTN — THÔNG TIN LIÊN HỆ & ĐỊA ĐIỂM ĐÀ NẴNG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900 rounded-3xl p-8 sm:p-10 border-2 border-teal-200/70 dark:border-slate-800 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-extrabold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" />
              <span>KHOA HỌC TỰ NHIÊN • KHOA HỌC SỐ KHTN</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Đồng Hành Cùng Học Sinh THCS Chinh Phục Khoa Học Tự Nhiên
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Biên soạn bám sát bộ sách <strong>Kết nối tri thức với cuộc sống</strong> với hệ thống thuật ngữ Hóa học chuẩn quốc tế (Hydrogen, Oxygen, Sodium, Acid, Base, Oxide...) giúp học sinh tự học hiệu quả, trực quan và hứng thú mỗi ngày.
            </p>
          </div>

          <div className="lg:col-span-4 bg-white dark:bg-slate-950 rounded-2xl p-5 border border-teal-200 dark:border-slate-800 shadow-sm space-y-3 text-xs sm:text-sm">
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
