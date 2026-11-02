import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Grade,
  SubjectDomain,
} from '../types/index.ts';
import { TOPICS, LESSONS, SIMULATIONS_3D, DOCUMENTS } from '../data/mockData.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { LessonCard } from '../components/common/LessonCard.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import {
  Atom,
  BookOpen,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  HelpCircle,
  FlaskConical,
  Zap,
  Dna,
  Globe,
  Layers,
  Filter,
} from 'lucide-react';

interface GradeTemplatePageProps {
  grade: Grade;
}

const GRADE_INFO: Record<Grade, { title: string; subtitle: string; highlight: string }> = {
  6: {
    title: 'Khoa Học Tự Nhiên Lớp 6',
    subtitle: 'Khởi đầu cấp THCS - Làm quen với phương pháp tìm hiểu tự nhiên, đo lường, cấu tạo tế bào và lực.',
    highlight: 'Kính hiển vi quang học tế bào thực vật & Hệ Mặt Trời',
  },
  7: {
    title: 'Khoa Học Tự Nhiên Lớp 7',
    subtitle: 'Thế giới vi mô của nguyên tử Rutherford - Bohr, tốc độ chuyển động, sóng âm và quang hợp.',
    highlight: 'Mô hình nguyên tử 3D tương tác các lớp vỏ electron',
  },
  8: {
    title: 'Khoa Học Tự Nhiên Lớp 8',
    subtitle: 'Trọng tâm thực hành hóa học & vật lí: Phản ứng hóa học, Axit-Bazơ-pH, áp suất và mạch điện định luật Ôm.',
    highlight: 'Phòng thí nghiệm mạch điện ảo & Chuẩn độ Axit - Bazơ',
  },
  9: {
    title: 'Khoa Học Tự Nhiên Lớp 9',
    subtitle: 'Hoàn thiện chương trình THCS & định hướng: Kim loại, hữu cơ, khúc xạ quang hình, điện từ & di truyền ADN.',
    highlight: 'Quang hình học khúc xạ tán sắc qua lăng kính',
  },
};

export const GradeTemplatePage: React.FC<GradeTemplatePageProps> = ({ grade }) => {
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | 'all'>('all');
  const [materialType, setMaterialType] = useState<'all' | 'sim' | 'doc'>('all');

  const info = GRADE_INFO[grade];
  const gradeTopics = TOPICS.filter((t) => t.grade === grade);
  const gradeLessons = LESSONS.filter((l) => l.grade === grade);
  const gradeSims = SIMULATIONS_3D.filter((s) => s.grade === grade);
  const gradeDocs = DOCUMENTS.filter((d) => d.grade === grade);

  const filteredTopics =
    selectedDomain === 'all'
      ? gradeTopics
      : gradeTopics.filter((t) => t.domain === selectedDomain);

  const filteredLessons = gradeLessons.filter((l) => {
    if (selectedDomain !== 'all' && l.domain !== selectedDomain) return false;
    if (materialType === 'sim' && !l.simulationId) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: `KHTN Lớp ${grade}` }]} />

        {/* Grade Banner */}
        <div className="bg-gradient-to-r from-[#0B1F3A] to-[#152E52] rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="max-w-3xl relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold uppercase tracking-wider">
                Chương trình GDPT 2018
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 text-xs font-medium">
                Kết nối tri thức • Chân trời sáng tạo • Cánh diều
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {info.title}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {info.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={`/luyen-tap?grade=${grade}`}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/30 transition flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Trắc nghiệm ôn tập Lớp {grade}</span>
              </Link>
              <Link
                to="/phong-thi-nghiem-3d"
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition flex items-center gap-2"
              >
                <Atom className="w-4 h-4 text-teal-400" />
                <span>Mô phỏng 3D ({gradeSims.length})</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter by Domain & Material Type */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Phân môn:
            </span>
            <button
              onClick={() => setSelectedDomain('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedDomain === 'all'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Tất cả phân môn ({gradeTopics.length})
            </button>
            <button
              onClick={() => setSelectedDomain('hoa-hoc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedDomain === 'hoa-hoc'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Chất & Sự biến đổi (Hóa)</span>
            </button>
            <button
              onClick={() => setSelectedDomain('vat-li')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedDomain === 'vat-li'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Năng lượng (Vật lí)</span>
            </button>
            <button
              onClick={() => setSelectedDomain('sinh-hoc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedDomain === 'sinh-hoc'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800'
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>Vật sống (Sinh học)</span>
            </button>
            <button
              onClick={() => setSelectedDomain('trai-dat-vu-tru')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedDomain === 'trai-dat-vu-tru'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Trái Đất & Bầu Trời</span>
            </button>
          </div>

          {/* Material Type Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Loại học liệu:</span>
            <button
              onClick={() => setMaterialType('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                materialType === 'all'
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Tất cả bài học
            </button>
            <button
              onClick={() => setMaterialType('sim')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                materialType === 'sim'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Atom className="w-3.5 h-3.5 text-teal-400" />
              <span>Có mô phỏng 3D</span>
            </button>
          </div>
        </div>

        {/* Section: 3D Simulations for this Grade */}
        {gradeSims.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Atom className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Mô phỏng 3D đặc trưng Lớp {grade}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gradeSims.map((sim) => (
                <div
                  key={sim.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col justify-between group"
                >
                  <div className="relative h-40 bg-slate-900 overflow-hidden">
                    <img
                      src={sim.thumbnail}
                      alt={sim.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-teal-600 text-white text-[10px] font-bold">
                      {sim.category}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                        {sim.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {sim.description}
                      </p>
                    </div>
                    <Link
                      to={`/mo-phong/${sim.id}`}
                      className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20"
                    >
                      <Atom className="w-3.5 h-3.5" />
                      <span>Thực hành 3D ngay</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Lesson Cards (16:9 Aspect Ratio) */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Bài học trọng tâm Lớp {grade}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tìm thấy {filteredLessons.length} bài học theo tiêu chí tìm kiếm
              </p>
            </div>
          </div>

          {filteredLessons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          ) : (
            <ErrorState
              title="Không tìm thấy bài học phù hợp"
              message="Không có bài học nào thỏa mãn phân môn hoặc tiêu chí học liệu đã chọn. Hãy thử chọn tất cả phân môn."
              retryLabel="Đặt lại bộ lọc"
              onRetry={() => {
                setSelectedDomain('all');
                setMaterialType('all');
              }}
            />
          )}
        </div>

        {/* Section: Topics & Lessons Grid */}
        <div className="space-y-8">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Khung phân phối chương trình theo chuyên đề</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTopics.map((topic) => {
              const topicLessons = gradeLessons.filter((l) => l.topicId === topic.id);
              return (
                <div
                  key={topic.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                        {topic.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-800 dark:text-white mt-1.5">
                        {topic.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {topic.description}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap ml-2">
                      {topic.lessonCount} bài học
                    </span>
                  </div>

                  {/* Lessons list in this topic */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {topicLessons.length > 0 ? (
                      topicLessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          to={`/bai-hoc/${lesson.id}`}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50/60 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 hover:border-teal-300 dark:hover:border-teal-500 transition group"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400">
                              {lesson.code}: {lesson.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {lesson.durationMinutes} phút
                              </span>
                              {lesson.simulationId && (
                                <span className="text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-0.5">
                                  <Atom className="w-3 h-3" /> Có mô phỏng 3D
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                        Các bài học tiếp theo đang được Thầy Hoàng cập nhật tài liệu số.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Documents / Slides for this grade */}
        {gradeDocs.length > 0 && (
          <div className="mt-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Tài liệu & Slide bài giảng Lớp {grade}</span>
              </h3>
              <Link to="/tai-lieu" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
                Xem toàn bộ kho tài liệu
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gradeDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                      {doc.format.toUpperCase()} • {doc.type}
                    </span>
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100 mt-2 line-clamp-2">
                      {doc.title}
                    </h4>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{doc.fileSize}</span>
                    <Link
                      to="/tai-lieu"
                      className="text-teal-600 dark:text-teal-400 font-bold hover:underline"
                    >
                      Tải về
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Grade6Page: React.FC = () => <GradeTemplatePage grade={6} />;
export const Grade7Page: React.FC = () => <GradeTemplatePage grade={7} />;
export const Grade8Page: React.FC = () => <GradeTemplatePage grade={8} />;
export const Grade9Page: React.FC = () => <GradeTemplatePage grade={9} />;
