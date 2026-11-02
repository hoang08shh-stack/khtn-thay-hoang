import React from 'react';
import { Link } from 'react-router-dom';
import {
  Atom,
  FlaskConical,
  Zap,
  Dna,
  Globe,
  ArrowRight,
  BookOpen,
  Video,
  FileText,
  Sparkles,
  Award,
  CheckCircle2,
  Users,
  Compass,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { DOMAINS, SIMULATIONS_3D, LESSONS, VIDEOS } from '../data/mockData.ts';
import { HeroAtomVisualizer } from '../components/home/HeroAtomVisualizer.tsx';
import { LessonCard } from '../components/common/LessonCard.tsx';

export const HomePage: React.FC = () => {
  const gradeCards = [
    {
      grade: 6,
      path: '/lop-6',
      title: 'KHTN Lớp 6',
      desc: 'Mở đầu KHTN, các thể của chất, cấu tạo tế bào, lực tiếp xúc & Hệ Mặt Trời.',
      accent: 'from-emerald-500 to-teal-600',
      tag: 'Khởi đầu THCS',
      topics: 4,
      sims: 2,
    },
    {
      grade: 7,
      path: '/lop-7',
      title: 'KHTN Lớp 7',
      desc: 'Nguyên tử Rutherford-Bohr, bảng tuần hoàn, tốc độ, sóng âm & quang hợp.',
      accent: 'from-teal-500 to-cyan-600',
      tag: 'Khám phá vi mô',
      topics: 4,
      sims: 1,
    },
    {
      grade: 8,
      path: '/lop-8',
      title: 'KHTN Lớp 8',
      desc: 'Phản ứng hóa học, Axit-Bazơ-pH, áp suất chất lỏng, mạch điện & Định luật Ôm.',
      accent: 'from-blue-600 to-indigo-600',
      tag: 'Trọng tâm thực hành',
      topics: 5,
      sims: 2,
    },
    {
      grade: 9,
      path: '/lop-9',
      title: 'KHTN Lớp 9',
      desc: 'Kim loại, hữu cơ, khúc xạ & lăng kính, điện từ học, di truyền học Menđen & ADN.',
      accent: 'from-purple-600 to-pink-600',
      tag: 'Chinh phục kỳ thi',
      topics: 4,
      sims: 1,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#071527] via-[#0B1F3A] to-[#0d2a4d] text-white py-16 sm:py-24">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs sm:text-sm font-semibold tracking-wide">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Chương trình Giáo dục Phổ thông 2018</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Phòng Thí Nghiệm <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-sky-400">
                  Khoa Học Số KHTN
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Chào mừng các em học sinh lớp 6, 7, 8, 9 đến với không gian học tập khoa học hiện đại của
                <strong> Thầy Hoàng</strong>. Khám phá các thí nghiệm 3D tương tác chân thực: từ mô hình nguyên tử
                Rutherford - Bohr đến mạch điện, chuẩn độ axit-bazơ và quan sát tế bào quang học.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <Link
                  to="/phong-thi-nghiem-3d"
                  className="px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-600/30 transition transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Atom className="w-5 h-5" />
                  <span>Vào Phòng Thí Nghiệm 3D</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/chu-de"
                  className="px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm sm:text-base transition hover:text-white"
                >
                  Xem Danh Mục Chủ Đề
                </Link>
              </div>

              {/* Quick metrics */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">100%</div>
                  <div className="text-xs text-slate-400">Chuẩn GDPT 2018</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-teal-400 font-mono">6+</div>
                  <div className="text-xs text-slate-400">Mô phỏng 3D tương tác</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">4 Khối</div>
                  <div className="text-xs text-slate-400">Lớp 6, 7, 8, 9 THCS</div>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive 3D Showcase */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroAtomVisualizer />
            </div>
          </div>
        </div>
      </section>

      {/* --- 4 GRADE CARDS (LỚP 6, 7, 8, 9) --- */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
            Khung Chương Trình Chuẩn
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] dark:text-white">
            Lựa Chọn Khối Lớp Học Tập Của Em
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            Đầy đủ kiến thức Khoa học Tự nhiên 4 khối THCS theo các bộ sách Kết nối tri thức, Chân trời sáng tạo, Cánh diều.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gradeCards.map((card) => (
            <Link
              key={card.grade}
              to={card.path}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.accent} text-white font-extrabold text-lg flex items-center justify-center shadow-md`}
                  >
                    L.{card.grade}
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {card.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#0B1F3A] dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
                <span className="text-slate-500 dark:text-slate-400">{card.topics} chủ đề • {card.sims} lab 3D</span>
                <span className="text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-bold">
                  Vào học <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- 4 SCIENTIFIC DOMAINS SECTION --- */}
      <section className="py-14 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Mạch Nội Dung GDPT 2018
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] dark:text-white mt-1">
                4 Phân Môn Khoa Học Tự Nhiên
              </h2>
            </div>
            <Link
              to="/chu-de"
              className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 mt-2 md:mt-0"
            >
              <span>Xem toàn bộ chủ đề chi tiết</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {DOMAINS.map((domain) => {
              const Icon =
                domain.id === 'hoa-hoc'
                  ? FlaskConical
                  : domain.id === 'vat-li'
                  ? Zap
                  : domain.id === 'sinh-hoc'
                  ? Dna
                  : Globe;

              return (
                <div
                  key={domain.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${domain.bgColor} dark:bg-slate-800`}
                    >
                      <Icon className="w-5 h-5" style={{ color: domain.color }} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: domain.color }}>
                      {domain.shortName}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mt-1">
                      {domain.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {domain.description}
                    </p>
                  </div>

                  <Link
                    to={`/chu-de?domain=${domain.id}`}
                    className="mt-6 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1"
                  >
                    <span>Khám phá bài học {domain.shortName}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- FEATURED 3D SIMULATIONS SHOWCASE --- */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Thực Hành Trực Tuyến
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] dark:text-white mt-1">
              Phòng Thí Nghiệm 3D Nổi Bật
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Mô phỏng thời gian thực với đầy đủ thông số điều khiển, không sợ cháy nổ hay nguy hiểm hóa chất.
            </p>
          </div>
          <Link
            to="/phong-thi-nghiem-3d"
            className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 mt-2 md:mt-0"
          >
            <span>Tất cả mô phỏng 3D</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SIMULATIONS_3D.slice(0, 3).map((sim) => (
            <div
              key={sim.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Thumbnail image */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                <img
                  src={sim.thumbnail}
                  alt={sim.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
                    Lớp {sim.grade}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-teal-600/90 text-white text-[11px] font-bold">
                    {sim.category}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                  <div className="flex items-center gap-1 text-[11px] text-teal-300 font-mono">
                    <Atom className="w-3.5 h-3.5" />
                    <span>Mô phỏng 3D WebGL</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition line-clamp-1">
                    {sim.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                    {sim.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Độ khó: <strong className="text-slate-800 dark:text-slate-200">{sim.difficulty}</strong>
                  </span>
                  <Link
                    to={`/mo-phong/${sim.id}`}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition flex items-center gap-1"
                  >
                    <span>Vào phòng lab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURED LESSONS SECTION --- */}
      <section className="py-14 bg-slate-100/70 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Lý Thuyết & Thực Nghiệm Trọng Tâm
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] dark:text-white mt-1">
                Bài Học Mới & Nổi Bật
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Bài giảng chuẩn kiến thức GDPT 2018 với hình ảnh thực nghiệm, mục tiêu rõ ràng và tích hợp mô phỏng 3D.
              </p>
            </div>
            <Link
              to="/chu-de"
              className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 mt-2 md:mt-0"
            >
              <span>Xem tất cả bài học</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LESSONS.slice(0, 3).map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURED LAB VIDEOS --- */}
      <section className="py-14 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                Thực Nghiệm Thực Tế
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] dark:text-white mt-1">
                Video Thí Nghiệm Cùng Thầy Hoàng
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Thước phim chân thực hướng dẫn từng thao tác chuẩn mực trong phòng thực hành trường học.
              </p>
            </div>
            <Link
              to="/video"
              className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 mt-2 md:mt-0"
            >
              <span>Xem kho video</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VIDEOS.slice(0, 3).map((vid) => (
              <Link
                key={vid.id}
                to="/video"
                className="group bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-red-400/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={`https://images.unsplash.com/photo-${vid.id === 'vid-khtn-8-ph' ? '1532187863486-abf9dbad1b69' : vid.id === 'vid-khtn-7-quanghop' ? '1530836369250-ef72a3f5cda8' : '1507413245164-6160d8298b31'}?auto=format&fit=crop&w=800&q=80`}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                    />
                    <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center group-hover:bg-slate-950/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Video className="w-6 h-6 ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                        Lớp {vid.grade}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-red-600/90 text-white text-[10px] font-bold">
                        {vid.experimentType}
                      </span>
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-mono font-medium">
                      {vid.duration}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition line-clamp-2">
                      {vid.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {vid.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{vid.instructor}</span>
                  <span className="font-mono">{vid.views.toLocaleString()} lượt xem</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- TEACHER INTRO & PEDAGOGICAL PHILOSOPHY --- */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#152E52] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative">
                <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-3xl overflow-hidden border-4 border-teal-500/40 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80"
                    alt="Thầy Hoàng KHTN"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-3 -right-3 bg-teal-500 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg">
                  ThS. Thầy Hoàng
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Người Đồng Hành Cùng Các Em
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Thầy Hoàng & Sứ Mệnh Giáo Dục KHTN Trực Quan
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                &ldquo;Khoa học Tự nhiên không phải là những công thức khô khan trên trang giấy, mà là bức tranh sống
                động về thế giới quanh ta. Với phòng thí nghiệm 3D số, thầy mong muốn mỗi học sinh lớp 6, 7, 8, 9
                đều được tự tay tương tác, quan sát và làm chủ những hiện tượng kì thú của tự nhiên.&rdquo;
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 mb-1" />
                  <strong className="block text-white">Trực quan hóa</strong>
                  <span className="text-slate-400">Biến vi mô thành 3D dễ hiểu</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                  <Award className="w-4 h-4 text-amber-400 mb-1" />
                  <strong className="block text-white">Tự tin kiểm tra</strong>
                  <span className="text-slate-400">Trắc nghiệm giải thích chi tiết</span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                  <Users className="w-4 h-4 text-sky-400 mb-1" />
                  <strong className="block text-white">Cộng đồng học tốt</strong>
                  <span className="text-slate-400">Hàng ngàn bạn cùng tiến bộ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
