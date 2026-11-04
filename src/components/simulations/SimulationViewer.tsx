import React, { useState, Suspense } from 'react';
import confetti from 'canvas-confetti';
import { Simulation3D } from '../../types/index.ts';
import { SimulationRegistry } from './registry/SimulationRegistry.ts';
import { SimulationManifest } from '../../types/simulationManifest.ts';
import { WebGLErrorBoundary } from './WebGLErrorBoundary.tsx';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  CheckCircle,
  HelpCircle,
  Award,
  Sparkles,
  Loader2,
  ExternalLink,
} from 'lucide-react';

// Lazy-load 3D simulation components to split heavy Three.js / R3F bundles
const LabViewer = React.lazy(() =>
  import('./lab/LabViewer.tsx').then((m) => ({ default: m.LabViewer }))
);
const ModelViewer = React.lazy(() =>
  import('./lab/ModelViewer.tsx').then((m) => ({ default: m.ModelViewer }))
);
const AtomSimulation = React.lazy(() =>
  import('./AtomSimulation.tsx').then((m) => ({ default: m.AtomSimulation }))
);
const MicroscopeSimulation = React.lazy(() =>
  import('./MicroscopeSimulation.tsx').then((m) => ({ default: m.MicroscopeSimulation }))
);
const CircuitSimulation = React.lazy(() =>
  import('./CircuitSimulation.tsx').then((m) => ({ default: m.CircuitSimulation }))
);
const AcidBaseSimulation = React.lazy(() =>
  import('./AcidBaseSimulation.tsx').then((m) => ({ default: m.AcidBaseSimulation }))
);
const SolarSystemSimulation = React.lazy(() =>
  import('./SolarSystemSimulation.tsx').then((m) => ({ default: m.SolarSystemSimulation }))
);
const OpticsSimulation = React.lazy(() =>
  import('./OpticsSimulation.tsx').then((m) => ({ default: m.OpticsSimulation }))
);

const SimulationLoader: React.FC<{ title?: string }> = ({ title = 'Mô phỏng 3D' }) => (
  <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center bg-slate-950 text-slate-300 p-8 space-y-4 rounded-2xl">
    <div className="relative flex items-center justify-center">
      <div className="w-14 h-14 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
      <Sparkles className="w-6 h-6 text-teal-400 absolute" />
    </div>
    <div className="text-center space-y-1">
      <p className="text-sm font-bold text-white tracking-wide">Đang khởi tạo {title}...</p>
      <p className="text-xs text-slate-400">Đang chuẩn bị camera, ánh sáng và mô hình phân tử số</p>
    </div>
  </div>
);

interface SimulationViewerProps {
  simulation: Simulation3D;
  manifest?: SimulationManifest | null;
  onComplete?: () => void;
}

const ExternalEmbedSimulationViewer: React.FC<{
  simulation: Simulation3D;
  embedUrl: string;
  onComplete?: () => void;
}> = ({ simulation, embedUrl, onComplete }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleReset = () => {
    setIsLoaded(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div
      className={`flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'w-full h-[660px]'
      }`}
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-950/95 border-b border-slate-800 text-white z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-teal-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
              {simulation.title}
            </h2>
            <p className="text-xs text-slate-400 line-clamp-1">
              Lớp {simulation.grade} • {simulation.category} • Trạm Web 3D Tương Tác
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition"
            title="Mở mô phỏng 3D trong cửa sổ mới"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mở tab riêng</span>
          </a>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              showGuide
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Hướng dẫn thực hành"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Hướng dẫn</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Tải lại mô phỏng"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleMarkComplete}
            disabled={isCompleted}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              isCompleted
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/30'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleted ? 'Đã hoàn thành' : 'Đánh dấu xong'}</span>
          </button>
        </div>
      </div>

      {/* Embedded 3D Web App Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-950">
        {!isLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-slate-300 p-6 space-y-3">
            <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
            <p className="text-sm font-bold text-white">
              Đang kết nối trạm mô phỏng 3D: {simulation.title}...
            </p>
            <p className="text-xs text-slate-400 text-center max-w-md">
              Nếu trình duyệt chặn nhúng khung hình của ứng dụng ngoài, bạn có thể bấm nút{' '}
              <a
                href={embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 underline font-bold"
              >
                Mở tab riêng
              </a>{' '}
              ở góc phải phía trên để tương tác toàn màn hình.
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={embedUrl}
          title={simulation.title}
          onLoad={() => setIsLoaded(true)}
          className="w-full h-full border-0 bg-slate-950"
          allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />

        {/* Bottom quick-access bar for external simulation */}
        <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex items-center justify-between">
          <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[260px] sm:max-w-md font-mono text-slate-400">
              {embedUrl}
            </span>
          </div>
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-teal-600/90 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Trải nghiệm trên tab mới</span>
          </a>
        </div>

        {showGuide && (
          <div className="absolute top-4 right-4 z-30 w-80 max-h-[85%] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md overflow-y-auto text-xs text-slate-300 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-sm text-teal-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                Hướng Dẫn Thực Hành
              </span>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">🎯 Mục tiêu bài học:</h4>
              <p className="leading-relaxed text-slate-300">{simulation.learningGoal}</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1.5">🔑 Khái niệm then chốt:</h4>
              <div className="flex flex-wrap gap-1.5">
                {simulation.keyConcepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-md bg-teal-950 text-teal-300 border border-teal-800 text-[11px]"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StandardSimulationViewer: React.FC<SimulationViewerProps> = ({
  simulation,
  onComplete,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setResetKey((prev) => prev + 1);
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    if (onComplete) {
      onComplete();
    }
  };

  // Render proper simulation based on type or id
  const renderSimulationComponent = () => {
    if (simulation.type === 'atom-bohr' || simulation.id === 'sim-atom-bohr') {
      return <AtomSimulation key={resetKey} />;
    }
    if (simulation.type === 'microscope-cell' || simulation.id === 'sim-microscope-cell') {
      return <MicroscopeSimulation key={resetKey} />;
    }
    if (simulation.type === 'electric-circuit' || simulation.id === 'sim-electric-circuit') {
      return <CircuitSimulation key={resetKey} />;
    }
    if (simulation.type === 'acid-base-ph' || simulation.id === 'sim-acid-base-ph') {
      return <AcidBaseSimulation key={resetKey} />;
    }
    if (simulation.type === 'solar-system') {
      return <SolarSystemSimulation key={resetKey} />;
    }
    if (simulation.type === 'light-refraction' || simulation.id === 'sim-light-refraction') {
      return <OpticsSimulation key={resetKey} />;
    }
    return <AtomSimulation key={resetKey} />;
  };

  return (
    <div
      className={`flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'w-full h-[620px]'
      }`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/90 border-b border-slate-800 text-white z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-teal-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
              {simulation.title}
            </h2>
            <p className="text-xs text-slate-400 line-clamp-1">
              Lớp {simulation.grade} • {simulation.category} • Độ khó: {simulation.difficulty}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              showGuide
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Hướng dẫn thực hành"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Hướng dẫn</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Đặt lại ban đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleMarkComplete}
            disabled={isCompleted}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              isCompleted
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/30'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleted ? 'Đã hoàn thành' : 'Đánh dấu xong'}</span>
          </button>
        </div>
      </div>

      {/* Simulation Viewport with Error Boundary and Suspense */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-950">
        <WebGLErrorBoundary fallbackTitle={`Mô phỏng 3D: ${simulation.title}`} onRetry={handleReset}>
          <Suspense fallback={<SimulationLoader title={simulation.title} />}>
            {renderSimulationComponent()}
          </Suspense>
        </WebGLErrorBoundary>

        {/* Floating Guide Drawer */}
        {showGuide && (
          <div className="absolute top-4 right-4 z-30 w-80 max-h-[85%] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md overflow-y-auto text-xs text-slate-300 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-sm text-teal-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                Hướng Dẫn Thực Hành
              </span>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white">🎯 Mục tiêu bài học:</h4>
              <p className="leading-relaxed text-slate-300">{simulation.learningGoal}</p>
              {simulation.controlsDescription && simulation.controlsDescription.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-semibold text-white mb-1">🎮 Thao tác mô phỏng:</h4>
                  <ul className="space-y-1">
                    {simulation.controlsDescription.map((ctrl, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-teal-300">{ctrl.key}</span>
                        <span>{ctrl.action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-white mb-1.5">🔑 Khái niệm then chốt:</h4>
              <div className="flex flex-wrap gap-1.5">
                {simulation.keyConcepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-md bg-teal-950 text-teal-300 border border-teal-800 text-[11px]"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const SimulationViewer: React.FC<SimulationViewerProps> = ({
  simulation,
  manifest,
  onComplete,
}) => {
  // Check if manifest provided or found in registry
  const resolvedManifest = manifest || SimulationRegistry.getManifest(simulation.id);

  const externalEmbedUrl =
    (resolvedManifest?.mode === 'external_embed' && resolvedManifest.externalUrl) ||
    resolvedManifest?.externalUrl ||
    simulation.externalUrl;

  if (externalEmbedUrl) {
    return (
      <ExternalEmbedSimulationViewer
        simulation={simulation}
        embedUrl={externalEmbedUrl}
        onComplete={onComplete}
      />
    );
  }

  if (resolvedManifest && resolvedManifest.mode === 'declarative_glb') {
    return (
      <WebGLErrorBoundary fallbackTitle={resolvedManifest.title}>
        <Suspense fallback={<SimulationLoader title={resolvedManifest.title} />}>
          <ModelViewer manifest={resolvedManifest} onComplete={onComplete} />
        </Suspense>
      </WebGLErrorBoundary>
    );
  }

  if (simulation.type === 'water-molecule') {
    return (
      <WebGLErrorBoundary fallbackTitle="Mô phỏng phân tử nước H2O">
        <Suspense fallback={<SimulationLoader title="Phân tử nước H2O" />}>
          <LabViewer onComplete={onComplete} />
        </Suspense>
      </WebGLErrorBoundary>
    );
  }

  return <StandardSimulationViewer simulation={simulation} onComplete={onComplete} />;
};

