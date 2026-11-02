import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TOPICS, DOMAINS, LESSONS } from '../data/mockData.ts';
import { SubjectDomain, Grade } from '../types/index.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import {
  Layers,
  FlaskConical,
  Zap,
  Dna,
  Globe,
  ArrowRight,
  BookOpen,
  Atom,
} from 'lucide-react';

export const TopicsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialDomain = (searchParams.get('domain') as SubjectDomain) || 'all';

  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | 'all'>(initialDomain);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTopics = TOPICS.filter((topic) => {
    if (selectedGrade !== 'all' && topic.grade !== selectedGrade) return false;
    if (selectedDomain !== 'all' && topic.domain !== selectedDomain) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        topic.title.toLowerCase().includes(q) ||
        topic.description.toLowerCase().includes(q) ||
        topic.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Danh mục chủ đề KHTN' }]} />

        {/* Page Title Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Chương trình GDPT 2018</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0B1F3A] dark:text-white mt-1">
            Danh Mục Chủ Đề Khoa Học Tự Nhiên
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-2xl">
            Tổng hợp toàn bộ các chủ đề cốt lõi của môn KHTN khối 6, 7, 8, 9 được phân chia khoa học
            theo 4 mạch nội dung: Chất và sự biến đổi, Năng lượng, Vật sống, Trái Đất và Bầu Trời.
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-5">
              <input
                type="text"
                placeholder="Tìm chủ đề theo từ khóa (nguyên tử, axit, mạch điện, tế bào...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Grade Filter Pills */}
            <div className="md:col-span-7 flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Khối lớp:</span>
              <button
                onClick={() => setSelectedGrade('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedGrade === 'all'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Tất cả
              </button>
              {[6, 7, 8, 9].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g as Grade)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedGrade === g
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Lớp {g}
                </button>
              ))}
            </div>
          </div>

          {/* Domain Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Phân môn:</span>
            <button
              onClick={() => setSelectedDomain('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedDomain === 'all'
                  ? 'bg-slate-800 dark:bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tất cả phân môn
            </button>
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDomain(d.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  selectedDomain === d.id
                    ? 'text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                style={{
                  backgroundColor: selectedDomain === d.id ? d.color : undefined,
                }}
              >
                <span>{d.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Topics List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => {
            const domain = DOMAINS.find((d) => d.id === topic.domain);
            const topicLessons = LESSONS.filter((l) => l.topicId === topic.id);

            return (
              <div
                key={topic.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-md text-white shadow-sm"
                      style={{ backgroundColor: domain?.color || '#0D9488' }}
                    >
                      {domain?.shortName}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      Lớp {topic.grade}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                    {topic.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition mt-1">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {topic.lessonCount} bài học • {topic.experimentCount} thí nghiệm
                  </div>
                  <Link
                    to={`/lop-${topic.grade}`}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 flex items-center gap-1"
                  >
                    <span>Vào bài học</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-slate-500 dark:text-slate-400">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold">Không tìm thấy chủ đề phù hợp với bộ lọc hiện tại.</p>
            <button
              onClick={() => {
                setSelectedGrade('all');
                setSelectedDomain('all');
                setSearchTerm('');
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 transition"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
