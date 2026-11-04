import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SIMULATIONS_3D, LESSONS, QUIZ_QUESTIONS } from '../data/mockData.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { SimulationViewer } from '../components/simulations/SimulationViewer.tsx';
import {
  Atom,
  BookOpen,
  HelpCircle,
  Award,
  CheckCircle2,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { saveUserProgress, getInitialProgress, getInitialUser } from '../lib/supabase.ts';

import { SimulationRegistry } from '../components/simulations/registry/SimulationRegistry.ts';
import { fetchSimulations } from '../services/simulationService.ts';
import { SimulationManifest } from '../types/simulationManifest.ts';
import { Simulation3D } from '../types/index.ts';

export const SimulationDetailPage: React.FC = () => {
  const { simId } = useParams<{ simId: string }>();
  const [dynamicManifest, setDynamicManifest] = useState<SimulationManifest | undefined>(() =>
    SimulationRegistry.getManifest(simId || '')
  );

  useEffect(() => {
    let mounted = true;
    fetchSimulations(true)
      .then((list) => {
        if (!mounted) return;
        const found = list.find((m) => m.id === simId || m.slug === simId);
        if (found) {
          SimulationRegistry.registerManifest(found);
          setDynamicManifest(found);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [simId]);

  const registeredManifest = dynamicManifest || SimulationRegistry.getManifest(simId || '');
  const legacySim = SIMULATIONS_3D.find((s) => s.id === simId);

  const simulation: Simulation3D = registeredManifest
    ? {
        id: registeredManifest.id,
        title: registeredManifest.title,
        grade: registeredManifest.grade,
        domain: registeredManifest.domain,
        category: registeredManifest.category,
        description: registeredManifest.summary,
        learningGoal: registeredManifest.curriculumCode,
        keyConcepts: registeredManifest.keyConcepts.map((k) => k.term),
        thumbnail: registeredManifest.thumbnailUrl,
        type:
          registeredManifest.mode === 'external_embed' || registeredManifest.externalUrl
            ? 'external-embed'
            : registeredManifest.id === 'sim-water-molecule'
            ? 'water-molecule'
            : 'declarative-model',
        externalUrl: registeredManifest.externalUrl,
        difficulty: registeredManifest.difficulty as any,
        relatedLessonId: registeredManifest.relatedLessonIds?.[0],
        controlsDescription: [
          { key: 'Xoay 360°', action: 'Kéo chuột trái xoay tự do không gian 3D' },
          { key: 'Phân rã (Explode)', action: 'Tách rời các bộ phận ra xa tâm' },
          { key: 'Mặt cắt 3D', action: 'Cắt giải phẫu quan sát bên trong' },
          { key: 'Ghim 3D', action: 'Bấm vào điểm đánh số để xem giải thích' },
        ],
        parameters: [],
      }
    : legacySim || SIMULATIONS_3D[0];

  const relatedLesson = simulation.relatedLessonId
    ? LESSONS.find((l) => l.id === simulation.relatedLessonId)
    : null;

  const relevantQuizzes = QUIZ_QUESTIONS.filter(
    (q) => q.grade === simulation.grade && q.domain === simulation.domain
  ).slice(0, 2);

  const currentUser = getInitialUser();
  const [progress, setProgress] = useState(() =>
    currentUser ? getInitialProgress(currentUser.id) : null
  );

  const isCompleted =
    progress?.completedSimulations.includes(simulation.id) || false;

  const handleCompleteSimulation = () => {
    if (!currentUser || !progress) return;
    if (!progress.completedSimulations.includes(simulation.id)) {
      const updated = {
        ...progress,
        completedSimulations: [...progress.completedSimulations, simulation.id],
      };
      setProgress(updated);
      saveUserProgress(updated);
    }
  };

  return (
    <div className="min-h-screen bg-[#050D1A] py-6 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Phòng thí nghiệm 3D', to: '/phong-thi-nghiem-3d' },
            { label: simulation.title },
          ]}
        />

        {/* Top Header Summary */}
        <div className="bg-[#071527] p-6 rounded-3xl border border-teal-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold uppercase tracking-wider">
                Mô phỏng Khoa học Số
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">
                Lớp {simulation.grade} • {simulation.category}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {simulation.title}
            </h1>
          </div>

          {relatedLesson && (
            <Link
              to={`/bai-hoc/${relatedLesson.id}`}
              className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition flex items-center gap-2 shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>Xem bài học lý thuyết ({relatedLesson.code})</span>
            </Link>
          )}
        </div>

        {/* 3D Simulation Canvas Container */}
        <div className="w-full">
          <SimulationViewer
            simulation={simulation}
            manifest={registeredManifest}
            onComplete={handleCompleteSimulation}
          />
        </div>

        {/* Bottom Details Grid: Laboratory Guide & Connected Knowledge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Objectives & Procedures (Col 7) */}
          <div className="lg:col-span-7 bg-[#071527] p-6 rounded-3xl border border-slate-800 shadow-lg space-y-4">
            <h3 className="font-bold text-base text-teal-400 flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>Mục tiêu thí nghiệm & Phương pháp học tập</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              {simulation.learningGoal}
            </p>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Khái niệm khoa học cốt lõi:
              </h4>
              <div className="flex flex-wrap gap-2">
                {simulation.keyConcepts.map((c, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-teal-950/80 text-teal-300 border border-teal-800 text-xs font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Gợi ý nhiệm vụ thực hành cho học sinh:
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    1. Thay đổi từng biến số độc lập (ví dụ: giữ nguyên U thay đổi R, hoặc nhỏ từng giọt NaOH).
                  </span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    2. Quan sát sự biến thiên của đại lượng phụ thuộc trên đồng hồ số hoặc đồ thị.
                  </span>
                </li>
                <li className="flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    3. Đối chiếu với công thức lý thuyết trong bài học để rút ra quy luật tự nhiên.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Mini Quiz Verification (Col 5) */}
          <div className="lg:col-span-5 bg-[#071527] p-6 rounded-3xl border border-slate-800 shadow-lg space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-400" />
                  <span>Kiểm tra củng cố sau thực hành</span>
                </h3>
                <span className="text-xs text-slate-400">Tự luyện</span>
              </div>

              {relevantQuizzes.map((q, idx) => {
                const correctLabel =
                  q.correctAnswers && q.correctAnswers.length > 0
                    ? q.correctAnswers.map((i) => q.options[i]).filter(Boolean).join(', ')
                    : q.correctAnswer !== undefined && q.options[q.correctAnswer]
                    ? q.options[q.correctAnswer]
                    : 'Làm bài để xem đáp án';

                return (
                  <div key={q.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <p className="text-xs font-semibold text-slate-200">
                      Câu {idx + 1}: {q.question}
                    </p>
                    <p className="text-[11px] text-teal-400 italic">
                      Đáp án đúng: {correctLabel}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <Link
                to={`/luyen-tap?grade=${simulation.grade}`}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/30"
              >
                <span>Làm bộ đề trắc nghiệm đầy đủ</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
