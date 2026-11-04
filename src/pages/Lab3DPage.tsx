import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HERO_LAB_IMAGE, SIMULATIONS_3D } from '../data/mockData.ts';
import { Grade, SubjectDomain, Simulation3D } from '../types/index.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { fetchSimulations } from '../services/simulationService.ts';
import {
  Atom,
  Sparkles,
  Filter,
  ArrowRight,
  Layers,
  Cpu,
  Sliders,
} from 'lucide-react';

export const Lab3DPage: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | 'all'>('all');
  const [dynamicSimulations, setDynamicSimulations] = useState<Simulation3D[]>(SIMULATIONS_3D);

  useEffect(() => {
    let mounted = true;
    fetchSimulations(false)
      .then((manifests) => {
        if (!mounted || !manifests || manifests.length === 0) return;

        const mappedFromManifests: Simulation3D[] = manifests.map((m) => ({
          id: m.id,
          title: m.title,
          grade: m.grade,
          domain: m.domain,
          category: m.category,
          description: m.summary,
          learningGoal: m.curriculumCode,
          keyConcepts: m.keyConcepts.map((k) => k.term),
          thumbnail: m.thumbnailUrl,
          type:
            m.mode === 'external_embed' || m.externalUrl
              ? 'external-embed'
              : m.id === 'sim-water-molecule'
              ? 'water-molecule'
              : ('declarative-model' as any),
          externalUrl: m.externalUrl,
          difficulty: m.difficulty,
          relatedLessonId: m.relatedLessonIds?.[0],
          controlsDescription: [
            { key: 'Xoay 360°', action: 'Chuột trái xoay mô hình' },
            { key: 'Phân rã 3D', action: 'Tách các lớp cấu trúc' },
          ],
          parameters: [],
        }));

        const manifestIds = new Set(mappedFromManifests.map((m) => m.id));
        const combined = [
          ...mappedFromManifests,
          ...SIMULATIONS_3D.filter((s) => !manifestIds.has(s.id)),
        ];
        setDynamicSimulations(combined);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const filteredSims = dynamicSimulations.filter((sim) => {
    if (selectedGrade !== 'all' && sim.grade !== selectedGrade) return false;
    if (selectedDomain !== 'all' && sim.domain !== selectedDomain) return false;
    return true;
  });

  const domainNames: Record<SubjectDomain, string> = {
    'hoa-hoc': 'Hóa học',
    'vat-li': 'Vật lí',
    'sinh-hoc': 'Sinh học',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/70 via-white to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Breadcrumbs items={[{ label: 'KHOA HỌC SỐ KHTN 3D' }]} />

        {/* 1. Bright Lab Hero Header */}
        <div className="relative rounded-3xl bg-gradient-to-r from-sky-700 via-teal-600 to-indigo-800 p-8 sm:p-12 border border-teal-400/30 overflow-hidden shadow-2xl text-white">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
            <img src={HERO_LAB_IMAGE} alt="KHOA HỌC SỐ KHTN" className="w-full h-full object-cover" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-amber-200 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>KHOA HỌC SỐ KHTN • Sách Kết nối tri thức với cuộc sống</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                KHOA HỌC SỐ KHTN — Mô Phỏng 3D
              </h1>
              <p className="text-white/95 text-sm sm:text-base leading-relaxed max-w-2xl">
                Trực quan hóa các hiện tượng vi mô và đại lượng vật lí theo 3 phân môn{' '}
                <strong>Vật lí · Hóa học · Sinh học</strong>: cấu tạo nguyên tử Bohr (Hydrogen, Carbon, Oxygen, Sodium), chuẩn độ Acid – Base, mạch điện Định luật Ohm, khúc xạ ánh sáng và cấu trúc phân tử DNA.
              </p>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/35 backdrop-blur-md border border-white/20 space-y-1">
                <Cpu className="w-5 h-5 text-amber-300" />
                <div className="text-xl font-black text-white font-mono">
                  {dynamicSimulations.length} Trạm 3D
                </div>
                <div className="text-xs text-white/85">Xoay 360° & Tương tác trực tiếp</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/35 backdrop-blur-md border border-white/20 space-y-1">
                <Sliders className="w-5 h-5 text-cyan-200" />
                <div className="text-xl font-black text-white font-mono">3 Phân Môn</div>
                <div className="text-xs text-white/85">Vật lí • Hóa học • Sinh học</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
          {/* Grade Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-teal-600" /> Lọc theo lớp:
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
                {g === 'all' ? 'Tất cả (Lớp 6–9)' : `Lớp ${g}`}
              </button>
            ))}
          </div>

          {/* 3 Domains Filter */}
          <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <span className="text-xs font-extrabold text-slate-500 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-sky-600" /> 3 Phân môn:
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
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  selectedDomain === d.id
                    ? 'bg-slate-900 dark:bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Simulations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSims.map((sim) => (
            <div
              key={sim.id}
              className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 hover:border-teal-400 transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-xl"
            >
              <div>
                <div className="relative h-52 overflow-hidden bg-slate-900">
                  <img
                    src={sim.thumbnail}
                    alt={sim.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold shadow">
                      Lớp {sim.grade}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/95 text-teal-800 text-xs font-extrabold shadow">
                      {domainNames[sim.domain]}
                    </span>
                  </div>

                  <span className="absolute bottom-3 left-3 text-xs font-semibold text-white/95 bg-slate-950/60 px-2.5 py-0.5 rounded-md">
                    {sim.category}
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 transition">
                    {sim.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {sim.description}
                  </p>

                  <div className="pt-2 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Khái niệm tương tác:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sim.keyConcepts.slice(0, 3).map((concept, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-slate-700 font-semibold"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link
                  to={`/mo-phong/${sim.id}`}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <Atom className="w-4 h-4" />
                  <span>Khởi Động Mô Phỏng 3D</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
