import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sliders,
  Sparkles,
  BookOpen,
  HelpCircle,
  Info,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  Sun,
  ShieldCheck,
  ChevronRight,
  Code,
  Check,
  Copy,
} from 'lucide-react';
import { SimulationManifest, SimulationAnnotation, LightingPreset } from '../../../types/simulationManifest.ts';
import { DeclarativeModelScene } from './DeclarativeModelScene.tsx';
import { ModelViewerFallback } from './ModelViewerFallback.tsx';

interface ModelViewerProps {
  manifest: SimulationManifest;
  onComplete?: () => void;
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ manifest, onComplete }) => {
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const [force2D, setForce2D] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Active right sidebar tab
  const [activeTab, setActiveTab] = useState<'controls' | 'science' | 'questions' | 'manifest'>('controls');
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Predefined Interactive Controls State
  const [isPlaying, setIsPlaying] = useState(manifest.controlsConfig.defaultAutoRotate);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(manifest.controlsConfig.autoRotateSpeed);
  const [wireframe, setWireframe] = useState(manifest.controlsConfig.defaultWireframe);
  const [explodeFactor, setExplodeFactor] = useState(0);
  const [enableClipping, setEnableClipping] = useState(false);
  const [clippingAxis, setClippingAxis] = useState<'x' | 'y' | 'z'>(manifest.controlsConfig.clippingAxis);
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>(manifest.controlsConfig.lightingPreset);

  // Active 3D hotspot annotation pin
  const [activeAnnotation, setActiveAnnotation] = useState<SimulationAnnotation | null>(
    manifest.annotations[0] || null
  );

  // Discovery questions quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [copiedManifest, setCopiedManifest] = useState(false);

  useEffect(() => {
    setIsWebGLSupported(checkWebGLSupport());
  }, []);

  const toggleFullscreen = () => {
    if (!viewerRef.current) return;
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(!isFullscreen);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleReset = () => {
    setIsPlaying(manifest.controlsConfig.defaultAutoRotate);
    setAutoRotateSpeed(manifest.controlsConfig.autoRotateSpeed);
    setWireframe(manifest.controlsConfig.defaultWireframe);
    setExplodeFactor(0);
    setEnableClipping(false);
    setLightingPreset(manifest.controlsConfig.lightingPreset);
    setActiveAnnotation(manifest.annotations[0] || null);
  };

  const handleAnswerSelect = (qId: string, optId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optId }));
    setSubmittedAnswers((prev) => ({ ...prev, [qId]: true }));
  };

  const handleCopyManifest = () => {
    navigator.clipboard?.writeText(JSON.stringify(manifest, null, 2));
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  if (!isWebGLSupported || force2D) {
    return <ModelViewerFallback manifest={manifest} />;
  }

  return (
    <div
      ref={viewerRef}
      className={`relative flex flex-col bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : 'w-full h-[680px]'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                {manifest.mode === 'declarative_glb' ? 'Chế độ 1: GLB Model' : 'Chế độ 2: TSX Code'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Lớp {manifest.grade} • v{manifest.version}
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Kết nối tri thức
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white line-clamp-1">
              {manifest.title}
            </h2>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1 ${
              isPlaying
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 hover:bg-teal-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isPlaying ? 'Tạm dừng quay' : 'Tự quay 360°'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
            title="Đặt lại thông số gốc"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Toggle Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Toggle sidebar panel */}
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              isPanelOpen
                ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bảng điều khiển</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 w-full h-full flex overflow-hidden">
        {/* 3D Canvas Area */}
        <div className="relative flex-1 w-full h-full bg-[#030712] overflow-hidden">
          <Canvas
            camera={{
              position: manifest.controlsConfig.cameraPosition,
              fov: manifest.controlsConfig.fov,
            }}
          >
            <DeclarativeModelScene
              manifest={manifest}
              autoRotate={isPlaying}
              autoRotateSpeed={autoRotateSpeed}
              wireframe={wireframe}
              explodeFactor={explodeFactor}
              enableClipping={enableClipping}
              clippingAxis={clippingAxis}
              lightingPreset={lightingPreset}
              activeAnnotationId={activeAnnotation?.id || null}
              onSelectAnnotation={(ann) => setActiveAnnotation(ann)}
            />
          </Canvas>

          {/* Floating HUD: Active Pin Info Card */}
          {activeAnnotation && (
            <div className="absolute bottom-4 left-4 max-w-sm sm:max-w-md bg-slate-900/90 border border-teal-500/40 rounded-2xl p-4 backdrop-blur-xl shadow-2xl z-20 animate-fadeIn">
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Điểm Chú Thích 3D
                </span>
                <button
                  onClick={() => setActiveAnnotation(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <h4 className="text-sm font-extrabold text-white">
                {activeAnnotation.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {activeAnnotation.description}
              </p>
            </div>
          )}

          {/* Bottom Left Quick Tip */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-[11px] backdrop-blur-sm">
              Chuột trái: Xoay 360° • Chuột phải: Di chuyển • Lăn chuột: Phóng to/thu nhỏ
            </span>
          </div>
        </div>

        {/* Right-hand Inspector Panel */}
        {isPanelOpen && (
          <aside className="w-80 sm:w-96 bg-slate-900/95 border-l border-slate-800 backdrop-blur-xl flex flex-col z-20 shadow-2xl">
            {/* Panel Tabs Header */}
            <div className="flex border-b border-slate-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('controls')}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition border-b-2 ${
                  activeTab === 'controls'
                    ? 'border-teal-400 text-teal-300 bg-teal-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Điều khiển</span>
              </button>
              <button
                onClick={() => setActiveTab('science')}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition border-b-2 ${
                  activeTab === 'science'
                    ? 'border-teal-400 text-teal-300 bg-teal-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Khoa học</span>
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition border-b-2 ${
                  activeTab === 'questions'
                    ? 'border-teal-400 text-teal-300 bg-teal-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Khám phá ({manifest.discoveryQuestions.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('manifest')}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 transition border-b-2 ${
                  activeTab === 'manifest'
                    ? 'border-teal-400 text-teal-300 bg-teal-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Manifest</span>
              </button>
            </div>

            {/* Panel Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs text-slate-300">
              {/* TAB 1: PREDEFINED CONTROLS */}
              {activeTab === 'controls' && (
                <div className="space-y-4">
                  {/* Auto-rotation speed */}
                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>Tốc độ tự quay 360°:</span>
                      <span className="font-mono text-teal-400">{autoRotateSpeed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="4.0"
                      step="0.2"
                      value={autoRotateSpeed}
                      onChange={(e) => setAutoRotateSpeed(parseFloat(e.target.value))}
                      className="w-full accent-teal-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Wireframe toggle */}
                  {manifest.controlsConfig.enableWireframeToggle && (
                    <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white block">Khung dây (Wireframe)</span>
                        <span className="text-[11px] text-slate-400">Hiển thị mạng lưới đa giác</span>
                      </div>
                      <button
                        onClick={() => setWireframe(!wireframe)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition ${
                          wireframe
                            ? 'bg-teal-500 text-slate-950'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {wireframe ? 'Đang bật' : 'Tắt'}
                      </button>
                    </div>
                  )}

                  {/* Explode / Parts inspection */}
                  {manifest.controlsConfig.enableExplode && (
                    <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between font-semibold text-white">
                        <span>Tách lớp / Phân rã chi tiết:</span>
                        <span className="font-mono text-teal-400">{(explodeFactor * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={manifest.controlsConfig.maxExplodeDistance}
                        step="0.05"
                        value={explodeFactor}
                        onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                        className="w-full accent-teal-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Cross-section clipping */}
                  {manifest.controlsConfig.enableClipping && (
                    <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">Mặt cắt giải phẫu 3D:</span>
                        <button
                          onClick={() => setEnableClipping(!enableClipping)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            enableClipping ? 'bg-teal-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {enableClipping ? 'Bật mặt cắt' : 'Nguyên khối'}
                        </button>
                      </div>
                      {enableClipping && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[11px] text-slate-400">Trục cắt:</span>
                          {(['x', 'y', 'z'] as const).map((axis) => (
                            <button
                              key={axis}
                              onClick={() => setClippingAxis(axis)}
                              className={`px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] ${
                                clippingAxis === axis
                                  ? 'bg-teal-600 text-white'
                                  : 'bg-slate-700 text-slate-400'
                              }`}
                            >
                              Trục {axis}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lighting preset */}
                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-white block">Ánh sáng & Phông nền:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'studio', label: 'Studio chuẩn' },
                          { id: 'lab', label: 'Phòng Lab sáng' },
                          { id: 'warm', label: 'Ấm áp' },
                          { id: 'dark', label: 'Tối tương phản' },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setLightingPreset(item.id)}
                          className={`p-2 rounded-xl text-center font-medium transition ${
                            lightingPreset === item.id
                              ? 'bg-teal-600 text-white font-bold'
                              : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3D Hotspot Pins List */}
                  <div className="space-y-2 pt-1">
                    <span className="font-semibold text-white block">
                      Các vị trí cấu trúc ({manifest.annotations.length}):
                    </span>
                    <div className="space-y-1.5">
                      {manifest.annotations.map((pin, idx) => (
                        <button
                          key={pin.id}
                          onClick={() => setActiveAnnotation(pin)}
                          className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                            activeAnnotation?.id === pin.id
                              ? 'bg-teal-500/20 border-teal-500/60 text-white'
                              : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="font-medium">
                            #{idx + 1} {pin.title}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-teal-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SCIENTIFIC EXPLANATION */}
              {activeTab === 'science' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-teal-950/40 border border-teal-800/60 text-teal-200">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                      Mục tiêu GDPT 2018:
                    </h4>
                    <p className="text-xs text-teal-100/90 leading-relaxed">
                      {manifest.curriculumCode}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white mb-1.5">Tổng quan bản chất khoa học:</h4>
                    <p className="leading-relaxed bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 text-slate-200">
                      {manifest.scientificExplanation.overview}
                    </p>
                  </div>

                  {manifest.scientificExplanation.keyPoints.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-white">Các điểm cốt lõi cần ghi nhớ:</h4>
                      {manifest.scientificExplanation.keyPoints.map((kp, i) => (
                        <div key={i} className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-1">
                          <strong className="text-teal-400 block">{kp.title}</strong>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{kp.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {manifest.scientificExplanation.realWorldApplication && (
                    <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/50 text-blue-200">
                      <h4 className="font-bold text-white mb-1">Ứng dụng thực tiễn đời sống:</h4>
                      <p className="text-[11px] leading-relaxed">
                        {manifest.scientificExplanation.realWorldApplication}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DISCOVERY QUESTIONS */}
              {activeTab === 'questions' && (
                <div className="space-y-4">
                  {manifest.discoveryQuestions.map((q, qIdx) => {
                    const selected = selectedAnswers[q.id];
                    const submitted = submittedAnswers[q.id];
                    const selectedOption = q.options.find((o) => o.id === selected);
                    const isCorrect = selectedOption?.isCorrect;

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3"
                      >
                        <h4 className="font-bold text-white leading-snug">
                          Câu {qIdx + 1}: {q.question}
                        </h4>

                        <div className="space-y-1.5">
                          {q.options.map((opt) => {
                            const isThisChosen = selected === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleAnswerSelect(q.id, opt.id)}
                                className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-start gap-2 ${
                                  isThisChosen
                                    ? opt.isCorrect
                                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                                      : 'bg-red-950/80 border-red-500 text-red-200 font-bold'
                                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                <span className="font-mono uppercase font-bold text-teal-400">
                                  {opt.id}.
                                </span>
                                <span className="flex-1">{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>

                        {submitted && (
                          <div
                            className={`p-3 rounded-xl text-[11px] leading-relaxed border ${
                              isCorrect
                                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                                : 'bg-red-950/60 border-red-800 text-red-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              {isCorrect ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Chính xác!</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                                  <span>Chưa chính xác!</span>
                                </>
                              )}
                            </div>
                            <p>{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 4: MANIFEST METADATA */}
              {activeTab === 'manifest' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-white font-bold">
                      <span>JSON Manifest Schema v1.0.0</span>
                      <button
                        onClick={handleCopyManifest}
                        className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] flex items-center gap-1"
                      >
                        {copiedManifest ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedManifest ? 'Đã sao chép' : 'Sao chép JSON'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-950 text-teal-300 font-mono text-[10px] overflow-x-auto max-h-72 border border-slate-800">
                      {JSON.stringify(manifest, null, 2)}
                    </pre>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-1 text-slate-400">
                    <div>
                      Tác giả: <strong className="text-white">{manifest.author}</strong>
                    </div>
                    <div>
                      Ngày cập nhật: <strong className="text-white">{new Date(manifest.updatedAt).toLocaleDateString('vi-VN')}</strong>
                    </div>
                    <div>
                      An toàn bảo mật:{' '}
                      <strong className="text-emerald-400">
                        Chỉ chấp nhận Declarative Config (Không chạy JS/TSX tùy ý)
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
