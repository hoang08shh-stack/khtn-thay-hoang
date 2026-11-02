import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SIMULATIONS_3D } from '../data/mockData.ts';
import { SubjectDomain, Grade } from '../types/index.ts';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import {
  Atom,
  FlaskConical,
  Zap,
  Dna,
  Globe,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Award,
  Layers,
} from 'lucide-react';

import { SimulationRegistry } from '../components/simulations/registry/SimulationRegistry.ts';
import { fetchSimulations } from '../services/simulationService.ts';
import { SimulationManifest } from '../types/simulationManifest.ts';

export const Lab3DPage: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | 'all'>('all');
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [publishedManifests, setPublishedManifests] = useState<SimulationManifest[]>(() =>
    SimulationRegistry.getAllManifests(false)
  );

  useEffect(() => {
    fetchSimulations(false).then((data) => {
      if (data && data.length > 0) {
        setPublishedManifests(data);
        data.forEach((m) => SimulationRegistry.registerManifest(m));
      }
    });
  }, []);

  // Merge published manifests into standard 3D simulation items for students
  const allSims = useMemo(() => {
    const manifestItems = publishedManifests.map((m) => ({
      id: m.id,
      title: m.title,
      grade: m.grade,
      domain: m.domain,
      category: m.category,
      description: m.summary,
      learningGoal: m.curriculumCode,
      keyConcepts: m.keyConcepts.map((k) => k.term),
      thumbnail: m.thumbnailUrl,
      type: (m.id === 'sim-water-molecule' ? 'water-molecule' : 'declarative-model') as any,
      difficulty: m.difficulty as any,
      mode: m.mode,
      version: m.version,
    }));

    // Merge without duplicates
    const combined = [...manifestItems];
    SIMULATIONS_3D.forEach((legacy) => {
      if (!combined.some((c) => c.id === legacy.id)) {
        combined.push({
          ...legacy,
          mode: 'custom_tsx' as const,
          version: '1.0.0',
        });
      }
    });
    return combined;
  }, [publishedManifests]);

  const filteredSims = allSims.filter((sim) => {
    if (selectedDomain !== 'all' && sim.domain !== selectedDomain) return false;
    if (selectedGrade !== 'all' && sim.grade !== selectedGrade) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Phòng thí nghiệm 3D số' }]} />

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-[#0B1F3A] via-[#112a4d] to-[#0D9488] rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="max-w-3xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Phòng Thí Nghiệm Ảo Không Giới Hạn</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Phòng Thí Nghiệm Khoa Học Số 3D
            </h1>

            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              Môi trường mô phỏng vật lí & hóa học tương tác 3D theo chuẩn GDPT 2018. Học sinh tự do điều chỉnh
              thông số (hiệu điện thế, điện trở, nồng độ pH, số hạt electron, góc khúc xạ quang học) mà không cần cài đặt phần mềm.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/10">
                <Award className="w-4 h-4 text-amber-400" /> {SIMULATIONS_3D.length} Trạm thực hành chuẩn hóa
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/10">
                <ShieldAlert className="w-4 h-4 text-emerald-400" /> An toàn 100%, không cháy nổ
              </span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-wrap items-center justify-between gap-4">
          {/* Domain */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Phân môn:</span>
            <button
              onClick={() => setSelectedDomain('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedDomain === 'all'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tất cả môn
            </button>
            <button
              onClick={() => setSelectedDomain('hoa-hoc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                selectedDomain === 'hoa-hoc'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" /> Hóa học
            </button>
            <button
              onClick={() => setSelectedDomain('vat-li')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                selectedDomain === 'vat-li'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Vật lí
            </button>
            <button
              onClick={() => setSelectedDomain('sinh-hoc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                selectedDomain === 'sinh-hoc'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Dna className="w-3.5 h-3.5" /> Sinh học
            </button>
            <button
              onClick={() => setSelectedDomain('trai-dat-vu-tru')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                selectedDomain === 'trai-dat-vu-tru'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Thiên văn
            </button>
          </div>

          {/* Grade */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Khối:</span>
            {['all', 6, 7, 8, 9].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  selectedGrade === g
                    ? 'bg-slate-800 dark:bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {g === 'all' ? 'Tất cả' : `L.${g}`}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Simulation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSims.map((sim) => (
            <div
              key={sim.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Thumbnail with overlay badges */}
              <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                <img
                  src={sim.thumbnail}
                  alt={sim.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold">
                    Lớp {sim.grade}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-teal-600 text-white text-xs font-bold">
                    {sim.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900/90 text-teal-300 border border-teal-500/30 text-[10px] font-bold">
                    {sim.mode === 'declarative_glb' ? 'Chế độ 1: GLB' : 'Chế độ 2: TSX'}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-mono text-teal-300">
                  Three.js 3D Lab
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#0B1F3A] dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                    {sim.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                    {sim.description}
                  </p>

                  {/* Key concepts */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {sim.keyConcepts.slice(0, 3).map((concept, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Độ khó: <strong className="text-slate-800 dark:text-slate-200">{sim.difficulty}</strong>
                  </span>
                  <Link
                    to={`/mo-phong/${sim.id}`}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition flex items-center gap-1.5"
                  >
                    <Atom className="w-4 h-4" />
                    <span>Mở phòng thí nghiệm</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSims.length === 0 && (
          <div className="mt-6">
            <ErrorState
              title="Không tìm thấy mô phỏng 3D phù hợp"
              message="Không có trạm thực hành 3D nào tương ứng với khối lớp hoặc phân môn đã chọn."
              retryLabel="Đặt lại bộ lọc"
              onRetry={() => {
                setSelectedDomain('all');
                setSelectedGrade('all');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
