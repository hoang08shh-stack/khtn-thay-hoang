import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HERO_LAB_IMAGE, LESSONS, SIMULATIONS_3D, DOMAINS } from '../data/mockData.ts';
import { Lesson } from '../types/index.ts';
import { getLessonByIdOrSlug } from '../services/contentService.ts';
import { getYoutubeEmbedUrl } from '../lib/supabase.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { SimulationViewer } from '../components/simulations/SimulationViewer.tsx';
import {
  Clock,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  Atom,
  Award,
  ArrowRight,
  FileText,
  Sparkles,
  HelpCircle,
  Download,
  Video,
  CheckSquare,
} from 'lucide-react';
import { toggleLessonCompletion, getStudentLessonProgress } from '../services/progressService.ts';
import { useAuth } from '../hooks/useAuth.ts';

export const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson>(
    () => LESSONS.find((l) => l.id === lessonId) || LESSONS[0]
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const userId = user?.id || 'user_student_demo';

  useEffect(() => {
    let mounted = true;
    if (lessonId) {
      getLessonByIdOrSlug(lessonId).then((found) => {
        if (mounted && found) {
          setLesson(found);
          setSelectedAnswers({});
          setShowResults(false);
        }
      });

      getStudentLessonProgress(userId).then((records) => {
        if (mounted) {
          const rec = records.find((r) => r.lessonId === lessonId);
          setIsCompleted(Boolean(rec?.completed));
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [lessonId, userId]);

  const handleToggleCompleted = async () => {
    const next = !isCompleted;
    setIsCompleted(next);
    await toggleLessonCompletion(userId, lesson.id, next);
  };

  const domainInfo = DOMAINS.find((d) => d.id === lesson.domain);
  const relatedSimulation = lesson.simulationId
    ? SIMULATIONS_3D.find((s) => s.id === lesson.simulationId)
    : null;

  const relatedLessons = LESSONS.filter(
    (l) => l.grade === lesson.grade && l.id !== lesson.id
  ).slice(0, 3);

  const handleSelectOption = (qIndex: number, optIndex: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Breadcrumbs
          items={[
            { label: `Lớp ${lesson.grade}`, to: `/lop-${lesson.grade}` },
            { label: domainInfo?.shortName || 'Chuyên đề', to: '/chuyen-de' },
            { label: lesson.title },
          ]}
        />

        {/* Top Lesson Banner Header with Visual Cover */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border-2 border-teal-100 dark:border-slate-800 shadow-md space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 font-mono font-extrabold text-xs border border-teal-200">
                  {lesson.code}
                </span>
                <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 font-bold text-xs">
                  Khối lớp {lesson.grade} • Phân môn {domainInfo?.shortName}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-teal-600" /> {lesson.durationMinutes} phút học
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                {lesson.title}
              </h1>

              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                {lesson.summary}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleToggleCompleted}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition border cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 hover:border-teal-500'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>{isCompleted ? 'Đã hoàn thành bài học' : 'Đánh dấu hoàn thành bài học'}</span>
                </button>

                <span className="text-xs text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-teal-200">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>KHOA HỌC SỐ KHTN • Sách Kết nối tri thức với cuộc sống</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-4">
              <img
                src={lesson.thumbnailUrl || domainInfo?.image || HERO_LAB_IMAGE}
                alt={lesson.title}
                className="w-full h-52 object-cover rounded-2xl border-2 border-teal-100 shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Main Lesson Content & Embedded 3D Lab (8 Cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Learning Objectives Box */}
            <div className="bg-gradient-to-br from-teal-50/90 to-sky-50/70 dark:from-slate-900 dark:to-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-teal-200/80 dark:border-slate-800 space-y-4">
              <h2 className="text-base sm:text-lg font-extrabold text-teal-950 dark:text-teal-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span>Mục Tiêu Cần Đạt (Sách Kết nối tri thức với cuộc sống)</span>
              </h2>
              <ul className="space-y-2.5">
                {lesson.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="leading-relaxed font-medium">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Theory Sections with Visual Illustrations */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Nội Dung Kiến Thức Trọng Tâm
                </h2>
              </div>

              {lesson.sections.map((sec, idx) => (
                <div key={idx} className="space-y-4">
                  <h3 className="text-base sm:text-lg font-extrabold text-teal-800 dark:text-teal-300">
                    {sec.title}
                  </h3>
                  <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                    {sec.content.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>

                  {sec.imageUrl && (
                    <figure className="my-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <img
                        src={sec.imageUrl}
                        alt={sec.imageCaption || sec.title}
                        className="w-full max-h-72 object-cover"
                      />
                      {sec.imageCaption && (
                        <figcaption className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 text-center">
                          Hình minh họa: {sec.imageCaption}
                        </figcaption>
                      )}
                    </figure>
                  )}

                  {sec.highlightBox && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800 flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                          {sec.highlightBox.title}
                        </span>
                        <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 font-medium leading-relaxed">
                          {sec.highlightBox.text}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Embedded 3D Interactive Lab (if available) */}
            {relatedSimulation && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Atom className="w-5 h-5 text-teal-600" />
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      Thực Hành KHOA HỌC SỐ KHTN 3D Ngay Trong Bài Học
                    </h2>
                  </div>
                  <Link
                    to={`/mo-phong/${relatedSimulation.id}`}
                    className="text-xs font-extrabold text-teal-600 hover:underline flex items-center gap-1"
                  >
                    <span>Mở rộng toàn trang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <SimulationViewer simulation={relatedSimulation} />
              </div>
            )}

            {/* Embedded Video Player (if lesson has videoUrl) */}
            {lesson.videoUrl && getYoutubeEmbedUrl(lesson.videoUrl) && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Video className="w-5 h-5 text-rose-500" />
                    <span>Video Bài Giảng & Thí Nghiệm Trực Quan</span>
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 font-bold">
                    KHOA HỌC SỐ KHTN
                  </span>
                </div>

                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
                  <iframe
                    src={getYoutubeEmbedUrl(lesson.videoUrl)!}
                    title={lesson.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Attached Lesson Assets (PPTX, PDF, Worksheets) */}
            {lesson.assets && lesson.assets.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    <span>Tài Liệu Đính Kèm Theo Bài Học ({lesson.assets.length})</span>
                  </h2>
                  <span className="text-xs text-slate-400">Học liệu KHOA HỌC SỐ KHTN</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {lesson.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 hover:border-teal-300 transition"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              asset.format === 'pptx'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {asset.format}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">{asset.type}</span>
                          <span className="text-[11px] text-slate-400">• {asset.fileSize}</span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                          {asset.title}
                        </h4>
                      </div>

                      <a
                        href={asset.fileUrl !== '#' ? asset.fileUrl : undefined}
                        target={asset.fileUrl !== '#' ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (asset.fileUrl === '#') {
                            e.preventDefault();
                          }
                        }}
                        className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition shrink-0 shadow-sm"
                        title="Tải xuống tài liệu"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Lesson Mini-Quiz */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-teal-600" />
                  <span>Câu Hỏi Tự Kiểm Tra Nhanh Cuối Bài</span>
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 font-bold">
                  {(lesson.miniQuiz || []).length} câu hỏi
                </span>
              </div>

              <div className="space-y-6">
                {(lesson.miniQuiz || []).map((q, qIdx) => {
                  const userSelected = selectedAnswers[qIdx];
                  return (
                    <div
                      key={qIdx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-3"
                    >
                      <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                        Câu {qIdx + 1}: {q.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userSelected === optIdx;
                          const isCorrect = q.correctIndex === optIdx;

                          let btnStyle =
                            'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-teal-400';
                          if (showResults) {
                            if (isCorrect) {
                              btnStyle =
                                'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                            } else if (isSelected && !isCorrect) {
                              btnStyle = 'bg-rose-50 border-rose-400 text-rose-800';
                            }
                          } else if (isSelected) {
                            btnStyle = 'bg-teal-50 border-teal-600 text-teal-900 font-bold';
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(qIdx, optIdx)}
                              className={`text-left px-4 py-3 rounded-xl border text-xs sm:text-sm transition cursor-pointer ${btnStyle}`}
                            >
                              <span className="font-mono font-bold mr-1.5">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {showResults && (
                        <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 text-xs text-teal-900 mt-2">
                          <strong>Giải thích chi tiết:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowResults(true)}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
                >
                  Kiểm tra đáp án
                </button>
                {showResults && (
                  <button
                    onClick={() => {
                      setSelectedAnswers({});
                      setShowResults(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    Làm lại
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Key Takeaways, Formulas & Related Lessons (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Key Takeaways Summary Card */}
            <div className="bg-gradient-to-br from-sky-900 via-indigo-950 to-teal-950 text-white rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-teal-300 font-extrabold text-sm uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Ghi nhớ cốt lõi sau bài học</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                {lesson.keyTakeaways.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 pb-2.5 border-b border-white/10 last:border-none last:pb-0"
                  >
                    <span className="text-amber-300 font-extrabold font-mono">0{index + 1}.</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Formulas Card */}
            {lesson.keyFormulas && lesson.keyFormulas.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                  Công thức & Phương trình cần nhớ
                </h3>
                <div className="space-y-2">
                  {lesson.keyFormulas.map((f, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-teal-50/70 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 font-mono text-xs sm:text-sm font-bold text-teal-900 dark:text-teal-300 text-center"
                    >
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links to Resources */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Tài nguyên bổ trợ bài học
              </h3>
              <Link
                to={`/luyen-tap?lessonId=${lesson.id}`}
                className="flex items-center justify-between p-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition text-xs font-extrabold shadow-md"
              >
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-300" />
                  Vào phòng luyện tập & kiểm tra bài này
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/tai-lieu"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 transition text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Tải phiếu bài tập & Slide bài giảng
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Related Lessons */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Bài học cùng khối Lớp {lesson.grade}
              </h3>
              <div className="space-y-3">
                {relatedLessons.map((rl) => (
                  <Link
                    key={rl.id}
                    to={`/bai-hoc/${rl.id}`}
                    className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 transition space-y-1"
                  >
                    <span className="text-[10px] font-mono font-bold text-teal-600">
                      {rl.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                      {rl.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
