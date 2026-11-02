import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { LESSONS, SIMULATIONS_3D, QUIZ_QUESTIONS } from '../data/mockData.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { SimulationViewer } from '../components/simulations/SimulationViewer.tsx';
import { SimulationRegistry } from '../components/simulations/registry/SimulationRegistry.ts';
import { Simulation3D } from '../types/index.ts';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  Atom,
  HelpCircle,
  FileText,
  Award,
  ArrowLeft,
  ArrowRight,
  Share2,
  Bookmark,
} from 'lucide-react';
import { saveUserProgress, getInitialProgress, getInitialUser } from '../lib/supabase.ts';
import { toggleLessonCompletion } from '../services/progressService.ts';

export const LessonDetailPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const lesson = LESSONS.find((l) => l.id === lessonId) || LESSONS[0];
  const manifest = lesson.simulationId ? SimulationRegistry.getManifest(lesson.simulationId) : null;
  const legacySim = lesson.simulationId
    ? SIMULATIONS_3D.find((s) => s.id === lesson.simulationId)
    : null;

  const simulation: Simulation3D | null = manifest
    ? {
        id: manifest.id,
        title: manifest.title,
        grade: manifest.grade,
        domain: manifest.domain,
        category: manifest.category,
        description: manifest.summary,
        learningGoal: manifest.curriculumCode,
        keyConcepts: manifest.keyConcepts.map((k) => k.term),
        thumbnail: manifest.thumbnailUrl,
        type: manifest.id === 'sim-water-molecule' ? 'water-molecule' : 'declarative-model',
        difficulty: manifest.difficulty as any,
        relatedLessonId: lesson.id,
        controlsDescription: [
          { key: 'Xoay 3D', action: 'Kéo chuột trái xoay tự do' },
          { key: 'Bóc tách', action: 'Thanh trượt phân rã chi tiết' },
          { key: 'Mặt cắt', action: 'Cắt giải phẫu đối tượng' },
        ],
        parameters: [],
      }
    : legacySim || null;

  const lessonQuizzes = QUIZ_QUESTIONS.filter((q) => q.lessonId === lesson.id);

  const currentUser = getInitialUser();
  const [progress, setProgress] = useState(() =>
    currentUser ? getInitialProgress(currentUser.id) : null
  );

  const isCompleted = progress?.completedLessons.includes(lesson.id) || false;
  const isBookmarked = progress?.bookmarkedLessons.includes(lesson.id) || false;

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleToggleComplete = async () => {
    if (!currentUser || !progress) return;
    const nextState = !isCompleted;
    const updated = {
      ...progress,
      completedLessons: nextState
        ? [...progress.completedLessons, lesson.id]
        : progress.completedLessons.filter((id) => id !== lesson.id),
    };
    setProgress(updated);
    saveUserProgress(updated);
    await toggleLessonCompletion(currentUser.id, lesson.id, nextState);
    if (nextState) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleToggleBookmark = () => {
    if (!currentUser || !progress) return;
    const updated = {
      ...progress,
      bookmarkedLessons: isBookmarked
        ? progress.bookmarkedLessons.filter((id) => id !== lesson.id)
        : [...progress.bookmarkedLessons, lesson.id],
    };
    setProgress(updated);
    saveUserProgress(updated);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Find adjacent lessons for navigation
  const currentIndex = LESSONS.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? LESSONS[currentIndex - 1] : null;
  const nextLesson = currentIndex < LESSONS.length - 1 ? LESSONS[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: `KHTN Lớp ${lesson.grade}`, to: `/lop-${lesson.grade}` },
            { label: `${lesson.code}: ${lesson.title}` },
          ]}
        />

        {/* Lesson Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-slate-800 shadow-sm mb-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold text-xs border border-teal-200 dark:border-teal-800">
                {lesson.code} • Lớp {lesson.grade}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {lesson.durationMinutes} phút
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {lesson.viewCount.toLocaleString()} lượt học
              </span>
            </div>

            {/* Actions: Bookmark, Share, Complete */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleBookmark}
                className={`p-2 rounded-xl border text-xs font-semibold transition ${
                  isBookmarked
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={isBookmarked ? 'Bỏ lưu bài học' : 'Lưu bài học để xem lại'}
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
                title="Chia sẻ liên kết bài học"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleComplete}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-teal-600 hover:bg-teal-500 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleted ? 'Đã hoàn thành' : 'Đánh dấu đã học'}</span>
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1F3A] dark:text-white leading-tight">
            {lesson.title}
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            {lesson.summary}
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span>Giáo viên biên soạn: <strong className="text-slate-700 dark:text-slate-200">{lesson.author}</strong></span>
            <span>•</span>
            <span>Chuẩn kiến thức & kỹ năng GDPT 2018</span>
          </div>
        </div>

        {/* GDPT 2018 Objectives (Yêu cầu cần đạt) */}
        <div className="bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/90 dark:border-teal-850 rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-extrabold text-teal-900 dark:text-teal-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Yêu cầu cần đạt (Chuẩn GDPT 2018)</span>
          </h2>
          <ul className="space-y-2">
            {lesson.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-teal-950 dark:text-teal-200 font-medium">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Embedded 3D Simulation (If linked) */}
        {simulation && (
          <div className="mb-10 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Atom className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Thực hành trực tiếp: {simulation.title}</span>
              </h2>
              <Link
                to={`/mo-phong/${simulation.id}`}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1"
              >
                <span>Mở toàn màn hình</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <SimulationViewer simulation={simulation} manifest={manifest} />
          </div>
        )}

        {/* Theory Content Sections */}
        <div className="space-y-6 mb-10">
          {lesson.sections.map((section, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4"
            >
              <h3 className="text-lg sm:text-xl font-bold text-[#0B1F3A] dark:text-white">
                {section.title}
              </h3>

              <div className="space-y-2.5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                {section.content.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
              </div>

              {/* Formula Callout */}
              {section.formula && (
                <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 dark:border-slate-700 space-y-2">
                  <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                    Công thức ghi nhớ:
                  </div>
                  <div className="font-mono text-base sm:text-xl font-bold text-amber-400 bg-slate-950/80 px-3 py-2 rounded-xl inline-block">
                    {section.formula}
                  </div>
                  {section.formulaMeaning && (
                    <p className="text-xs text-slate-300 italic pt-1">
                      {section.formulaMeaning}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key Takeaways (Ghi nhớ trọng tâm) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border-2 border-teal-500/30 shadow-md mb-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-500" />
            <h3 className="text-base sm:text-lg font-bold text-[#0B1F3A] dark:text-white">
              Tóm Tắt Ghi Nhớ Trọng Tâm
            </h3>
          </div>
          <ul className="space-y-2.5">
            {lesson.keyTakeaways.map((point, pIdx) => (
              <li
                key={pIdx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {pIdx + 1}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Self-Practice Quiz Section for this Lesson */}
        {lessonQuizzes.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-10 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Tự Đánh Giá Nhanh
                </span>
                <h3 className="text-lg font-bold text-[#0B1F3A] dark:text-white mt-0.5">
                  Câu Hỏi Củng Cố Bài Học ({lessonQuizzes.length} câu)
                </h3>
              </div>
              <Link
                to={`/luyen-tap?lessonId=${lesson.id}`}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
              >
                Vào phòng thi thử đầy đủ
              </Link>
            </div>

            <div className="space-y-6">
              {lessonQuizzes.map((q, qIndex) => {
                const userSelected = selectedAnswers[q.id];
                const isAnswered = userSelected !== undefined;

                return (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                    <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      Câu {qIndex + 1}: {q.question}
                    </p>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = userSelected === optIdx;
                        const isCorrect = q.correctAnswer === optIdx;

                        let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700';
                        if (showQuizResults) {
                          if (isCorrect) {
                            btnStyle = 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                          } else if (isChosen && !isCorrect) {
                            btnStyle = 'bg-red-100 dark:bg-red-950/60 border-red-500 text-red-900 dark:text-red-200 line-through';
                          }
                        } else if (isChosen) {
                          btnStyle = 'bg-teal-600 border-teal-600 text-white font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() =>
                              !showQuizResults &&
                              setSelectedAnswers({ ...selectedAnswers, [q.id]: optIdx })
                            }
                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition ${btnStyle}`}
                          >
                            <span className="font-bold mr-2">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {showQuizResults && (
                      <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200">
                        <strong>Giải thích của Thầy Hoàng:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Link
                to={`/luyen-tap?lessonId=${lesson.id}`}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 flex items-center gap-2 transition hover:scale-105"
              >
                <Award className="w-4 h-4" />
                <span>Vào phòng thi chấm điểm chính thức (GDPT 2018)</span>
              </Link>
              <button
                onClick={() => setShowQuizResults(!showQuizResults)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
              >
                {showQuizResults ? 'Ẩn đáp án' : 'Xem đáp án & giải thích'}
              </button>
            </div>
          </div>
        )}

        {/* Navigation bottom bar */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          {prevLesson ? (
            <Link
              to={`/bai-hoc/${prevLesson.id}`}
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{prevLesson.code}: {prevLesson.title}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson && (
            <Link
              to={`/bai-hoc/${nextLesson.id}`}
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition"
            >
              <span>{nextLesson.code}: {nextLesson.title}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
