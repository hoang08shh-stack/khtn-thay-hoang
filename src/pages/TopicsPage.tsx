import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HERO_LAB_IMAGE, DOMAINS } from '../data/mockData.ts';
import { Grade, SubjectDomain, Lesson, Topic } from '../types/index.ts';
import { getPublishedLessons, getPublishedLessonsSync } from '../services/contentService.ts';
import { getAdminTopicsSync } from '../services/adminService.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import {
  Search,
  Filter,
  BookOpen,
  Atom,
  Clock,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';

export const TopicsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialDomain = (searchParams.get('domain') as SubjectDomain) || 'all';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | 'all'>(
    initialDomain && ['hoa-hoc', 'vat-li', 'sinh-hoc'].includes(initialDomain)
      ? initialDomain
      : 'all'
  );
  const [allLessons, setAllLessons] = useState<Lesson[]>(() => getPublishedLessonsSync());
  const [allTopics, setAllTopics] = useState<Topic[]>(() => getAdminTopicsSync());

  useEffect(() => {
    let mounted = true;
    setAllTopics(getAdminTopicsSync());
    getPublishedLessons().then((data) => {
      if (mounted) {
        setAllLessons(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredTopics = allTopics.filter((t) => {
    if (selectedGrade !== 'all' && t.grade !== selectedGrade) return false;
    if (selectedDomain !== 'all' && t.domain !== selectedDomain) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredLessons = allLessons.filter((l) => {
    if (selectedGrade !== 'all' && l.grade !== selectedGrade) return false;
    if (selectedDomain !== 'all' && l.domain !== selectedDomain) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs items={[{ label: 'Chuyên đề & Bài học KHTN' }]} />

        {/* Colorful Header Banner */}
        <div className="bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>KHOA HỌC SỐ KHTN • Bộ sách Kết nối tri thức với cuộc sống</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white">
                Hệ Thống Chuyên Đề & Bài Học KHTN (Lớp 6 – 9)
              </h1>
              <p className="text-sm sm:text-base text-white/90">
                Tra cứu toàn bộ chủ đề và bài giảng thuộc <strong>3 phân môn Khoa học tự nhiên</strong>: <strong>Vật lí · Hóa học · Sinh học</strong> với danh pháp quốc tế IUPAC và hình ảnh trực quan.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài học (nguyên tử, acid, mạch điện, tế bào...)"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300"
              />
            </div>
          </div>
        </div>

        {/* Filter Bar: Grades & 3 Domains */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border-2 border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-teal-600" /> Khối lớp:
            </span>
            {(['all', 6, 7, 8, 9] as const).map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50'
                }`}
              >
                {g === 'all' ? 'Tất cả (6–9)' : `Lớp ${g}`}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <span className="text-xs font-extrabold text-slate-500 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-sky-600" /> 3 Phân môn:
            </span>
            <button
              onClick={() => setSelectedDomain('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedDomain === 'all'
                  ? 'bg-slate-900 dark:bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Tất cả 3 phân môn
            </button>
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  selectedDomain === d.id
                    ? 'bg-slate-900 dark:bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {d.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Topics Grid with Visual Images */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <span>Chủ Đề Trọng Tâm Sách Kết Nối Tri Thức ({filteredTopics.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => {
              const domainInfo = DOMAINS.find((d) => d.id === topic.domain);
              return (
                <div
                  key={topic.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition flex flex-col justify-between"
                >
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={topic.image || domainInfo?.image || HERO_LAB_IMAGE}
                      alt={topic.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-white/95 text-teal-800 shadow">
                        Lớp {topic.grade} • {topic.chapterNumber}
                      </span>
                      <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-teal-600 text-white shadow">
                        {domainInfo?.shortName}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {topic.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {topic.description}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">{topic.lessonsCount} bài học</span>
                      <Link
                        to={`/lop-${topic.grade}`}
                        className="font-extrabold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                      >
                        <span>Xem lộ trình lớp {topic.grade}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lessons List with Visual Thumbnails */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            <span>Bài Giảng Chi Tiết ({filteredLessons.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredLessons.map((lesson) => {
              const domainInfo = DOMAINS.find((d) => d.id === lesson.domain);
              return (
                <Link
                  key={lesson.id}
                  to={`/bai-hoc/${lesson.id}`}
                  className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-teal-400 transition flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={lesson.thumbnailUrl || domainInfo?.image || HERO_LAB_IMAGE}
                      alt={lesson.title}
                      className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                          Lớp {lesson.grade} • {lesson.code}
                        </span>
                        <span className="text-xs font-bold text-sky-600">
                          {domainInfo?.shortName}
                        </span>
                        {lesson.simulationId && (
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Atom className="w-3 h-3" /> Có mô phỏng 3D
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 transition">
                        {lesson.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {lesson.summary}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-teal-600" /> Thời lượng: {lesson.durationMinutes} phút
                    </span>
                    <span className="font-extrabold text-teal-600 flex items-center gap-1 group-hover:translate-x-1 transition">
                      <span>Học bài này</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
