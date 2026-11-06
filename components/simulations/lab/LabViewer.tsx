import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  HelpCircle,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Layers,
  Atom,
  CheckCircle2,
  XCircle,
  BookOpen,
  Eye,
  Activity,
  Compass,
} from 'lucide-react';
import { WaterMoleculeSimulation } from './WaterMoleculeSimulation.tsx';
import { WaterMoleculeFallback } from './WaterMoleculeFallback.tsx';
import { AtomProperties, ATOM_DATABASE, H2O_CONSTANTS } from '../../../utils/waterMoleculeMath.ts';

// WebGL support detector
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

export interface LabViewerProps {
  initialGrade?: number;
  onComplete?: () => void;
}

export const LabViewer: React.FC<LabViewerProps> = ({ initialGrade = 7, onComplete }) => {
  // WebGL support state
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const [force2DMode, setForce2DMode] = useState(false);

  // Playback & Animation state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Active right-panel tab
  const [activeTab, setActiveTab] = useState<'parameters' | 'science' | 'questions' | 'inspector'>('parameters');
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Simulation Parameters
  const [displayMode, setDisplayMode] = useState<'ball-and-stick' | 'space-filling'>('ball-and-stick');
  const [bondAngleDeg, setBondAngleDeg] = useState(H2O_CONSTANTS.IDEAL_BOND_ANGLE_DEG);
  const [showLabels, setShowLabels] = useState(true);
  const [showAngleArc, setShowAngleArc] = useState(true);
  const [showDipole, setShowDipole] = useState(true);
  const [showLonePairs, setShowLonePairs] = useState(false);
  const [showPartialCharges, setShowPartialCharges] = useState(true);
  const [vibrationSpeed, setVibrationSpeed] = useState(0.8);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateSpeed, setRotateSpeed] = useState(1.0);

  // Selected atom for atomic inspector
  const [selectedAtom, setSelectedAtom] = useState<AtomProperties | null>(ATOM_DATABASE.O);

  // Quiz state
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});

  // Check WebGL on mount
  useEffect(() => {
    setIsWebGLSupported(checkWebGLSupport());
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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

  // Reset to ideal GDPT 2018 parameters
  const handleReset = () => {
    setBondAngleDeg(H2O_CONSTANTS.IDEAL_BOND_ANGLE_DEG);
    setDisplayMode('ball-and-stick');
    setShowLabels(true);
    setShowAngleArc(true);
    setShowDipole(true);
    setShowLonePairs(false);
    setShowPartialCharges(true);
    setVibrationSpeed(0.8);
    setAutoRotate(true);
    setRotateSpeed(1.0);
    setSelectedAtom(ATOM_DATABASE.O);
    setIsPlaying(true);
  };

  // Discovery questions definitions
  const discoveryQuestions = [
    {
      id: 'q1',
      question: 'Tại sao góc liên kết H-O-H trong phân tử nước (104.5°) lại nhỏ hơn góc tứ diện đều lý thuyết (109.5°)?',
      options: [
        { id: 'a', text: 'Do nguyên tử Oxygen hút electron quá yếu nên hai nguyên tử H tự động dạt ra xa.' },
        { id: 'b', text: 'Do 2 cặp electron tự do (lone pairs) của Oxygen chiếm không gian lớn, tạo lực đẩy ép góc liên kết lại.', isCorrect: true },
        { id: 'c', text: 'Do hai nguyên tử Hydrogen có điện tích trái dấu hút chặt vào nhau.' },
        { id: 'd', text: 'Do áp suất khí quyển nén phân tử nước lại trong điều kiện chuẩn.' },
      ],
      explanation: 'Chính xác! Theo thuyết VSEPR (sức đẩy cặp electron hóa trị), nguyên tử O ở trạng thái lai hóa sp³ có 2 liên kết và 2 cặp electron tự do. Lực đẩy giữa các cặp electron tự do lớn hơn lực đẩy giữa các cặp electron liên kết, làm góc H-O-H bị ép từ 109.5° xuống còn 104.5°.',
    },
    {
      id: 'q2',
      question: 'Phân tử nước có cực hay không cực? Đặc điểm nào quyết định điều này?',
      options: [
        { id: 'a', text: 'Không cực, vì tổng số proton bằng tổng số electron (phân tử trung hòa điện).' },
        { id: 'b', text: 'Có cực, vì Oxygen có độ âm điện lớn hơn Hydrogen và phân tử có dạng gấp khúc không đối xứng.', isCorrect: true },
        { id: 'c', text: 'Không cực, vì liên kết O-H là liên kết ion hoàn toàn.' },
        { id: 'd', text: 'Có cực, nhưng chỉ khi phân tử nước ở thể lỏng, còn thể rắn thì không cực.' },
      ],
      explanation: 'Tuyệt vời! Hiệu độ âm điện Δχ = 3.44 - 2.20 = 1.24 (thuộc khoảng 0.4 đến 1.7) tạo nên 2 liên kết cộng hóa trị phân cực mạnh. Do cấu trúc gấp khúc (104.5°), hai vector phân cực không triệt tiêu mà hợp thành vector mômen lưỡng cực tổng cộng μ = 1.85 Debye hướng về Oxygen.',
    },
    {
      id: 'q3',
      question: 'Trong mô hình không gian đặc (Space-filling), nhận xét nào sau đây là ĐÚNG?',
      options: [
        { id: 'a', text: 'Các quả cầu thể hiện bán kính van der Waals thực tế và tiếp xúc xen phủ nhau, không còn que nối cơ học.', isCorrect: true },
        { id: 'b', text: 'Nguyên tử Hydrogen to hơn nguyên tử Oxygen gấp đôi do khối lượng nhẹ hơn.' },
        { id: 'c', text: 'Mô hình không gian đặc chỉ áp dụng được cho đơn chất, không áp dụng được cho hợp chất.' },
        { id: 'd', text: 'Các electron được vẽ chuyển động thành vòng tròn quanh hạt nhân giống như hệ Mặt Trời.' },
      ],
      explanation: 'Chính xác! Mô hình không gian đặc (Space-filling / CPK model) phản ánh chân thực đám mây electron và thể tích chiếm chỗ của các nguyên tử theo bán kính van der Waals trong không gian thực.',
    },
  ];

  const handleAnswer = (qId: string, optionId: string) => {
    setAnsweredQuestions((prev) => ({ ...prev, [qId]: optionId }));
    setShowFeedback((prev) => ({ ...prev, [qId]: true }));
  };

  const handleSelectAtom = (atom: AtomProperties | null) => {
    if (atom) {
      setSelectedAtom(atom);
      setActiveTab('inspector');
      setIsPanelOpen(true);
    }
  };

  return (
    <div
      ref={viewerRef}
      className={`relative flex flex-col bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 font-sans ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'w-full h-[680px]'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-inner">
            <Atom className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Cấu Tạo Phân Tử Nước (H₂O)
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-700">
                KHTN 7 • Kết nối tri thức
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Dạng gấp khúc 104.5°</span>
              <span>•</span>
              <span>Liên kết cộng hóa trị có cực</span>
              <span>•</span>
              <span className="text-teal-400 font-medium">3D Real-time Simulation</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Display Mode Toggle */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
            <button
              onClick={() => setDisplayMode('ball-and-stick')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                displayMode === 'ball-and-stick'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quả cầu & Que
            </button>
            <button
              onClick={() => setDisplayMode('space-filling')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                displayMode === 'space-filling'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Không gian đặc
            </button>
          </div>

          {/* Play / Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 shadow-sm ${
              isPlaying
                ? 'bg-teal-600/30 text-teal-300 border-teal-500/50 hover:bg-teal-600/40'
                : 'bg-amber-600/30 text-amber-300 border-amber-500/50 hover:bg-amber-600/40'
            }`}
            title={isPlaying ? 'Tạm dừng dao động & chuyển động' : 'Tiếp tục dao động'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="hidden md:inline">{isPlaying ? 'Tạm dừng' : 'Chạy'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="p-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
            title="Đặt lại thông số ban đầu (104.5°)"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden lg:inline">Đặt lại</span>
          </button>

          {/* 2D / 3D Fallback Mode Switcher */}
          {isWebGLSupported && (
            <button
              onClick={() => setForce2DMode(!force2DMode)}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition hidden md:flex items-center gap-1 ${
                force2DMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Chuyển đổi giữa chế độ 3D WebGL và 2D Vector"
            >
              <span>{force2DMode ? 'Đang dùng 2D' : '3D WebGL'}</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Panel Toggle Button (Mobile/Tablet) */}
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`p-2 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
              isPanelOpen
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
            title="Mở bảng điều khiển và giải thích khoa học"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {/* Left/Center: 3D Canvas or 2D Fallback */}
        <div className="relative flex-1 h-full w-full">
          {!isWebGLSupported || force2DMode ? (
            <WaterMoleculeFallback
              parameters={{
                displayMode,
                bondAngleDeg,
                showLabels,
                showAngleArc,
                showDipole,
                showLonePairs,
                showPartialCharges,
              }}
              onSelectAtom={handleSelectAtom}
              selectedAtomId={selectedAtom?.id}
            />
          ) : (
            <WaterMoleculeSimulation
              parameters={{
                displayMode,
                bondAngleDeg,
                showLabels,
                showAngleArc,
                showDipole,
                showLonePairs,
                showPartialCharges,
                vibrationSpeed,
                autoRotate,
                rotateSpeed,
              }}
              isPlaying={isPlaying}
              selectedAtomId={selectedAtom?.id}
              onSelectAtom={handleSelectAtom}
            />
          )}

          {/* Floating Instructions Bottom */}
          <div className="absolute top-4 right-4 z-10 pointer-events-none hidden sm:block">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[11px] text-slate-300 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-teal-400" />
              <span>Kéo chuột để xoay 360° • Cuộn chuột để phóng to/thu nhỏ</span>
            </div>
          </div>
        </div>

        {/* Right Collapsible Panel */}
        {isPanelOpen && (
          <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-slate-900/95 border-l border-slate-800 backdrop-blur-2xl z-30 flex flex-col shadow-2xl transition-all duration-300 animate-in slide-in-from-right">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-b border-slate-800 p-2 bg-slate-950/60">
              <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none text-xs">
                <button
                  onClick={() => setActiveTab('parameters')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'parameters'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Tham số</span>
                </button>
                <button
                  onClick={() => setActiveTab('science')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'science'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Khoa học</span>
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'questions'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Khám phá</span>
                </button>
                <button
                  onClick={() => setActiveTab('inspector')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'inspector'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Atom className="w-3.5 h-3.5" />
                  <span>Nguyên tử</span>
                </button>
              </div>

              <button
                onClick={() => setIsPanelOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Đóng bảng điều khiển"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-300">
              {/* TAB 1: PARAMETERS */}
              {activeTab === 'parameters' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-1">
                      <Sliders className="w-4 h-4 text-teal-400" />
                      Điều Khiển & Tham Số Mô Phỏng
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      Điều chỉnh góc liên kết và các đặc tính trực quan của phân tử H₂O.
                    </p>
                  </div>

                  {/* Bond Angle Slider */}
                  <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-white">Góc liên kết ∠H-O-H:</label>
                      <span className="font-mono text-teal-400 font-bold bg-slate-900 px-2 py-0.5 rounded-lg border border-teal-800">
                        {bondAngleDeg.toFixed(1)}°
                      </span>
                    </div>

                    <input
                      type="range"
                      min="90"
                      max="125"
                      step="0.5"
                      value={bondAngleDeg}
                      onChange={(e) => setBondAngleDeg(parseFloat(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none"
                    />

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>90° (Vuông góc)</span>
                      <button
                        onClick={() => setBondAngleDeg(H2O_CONSTANTS.IDEAL_BOND_ANGLE_DEG)}
                        className="text-teal-400 hover:text-teal-300 font-bold underline"
                      >
                        Chuẩn 104.5°
                      </button>
                      <span>120° (Tam giác đều)</span>
                    </div>
                  </div>

                  {/* Display Mode Selection */}
                  <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-2.5">
                    <label className="font-semibold text-white block">Kiểu mô hình trực quan:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setDisplayMode('ball-and-stick')}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          displayMode === 'ball-and-stick'
                            ? 'bg-teal-600/30 text-teal-200 border-teal-500 font-bold'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Layers className="w-4 h-4 text-teal-400" />
                        <span>Quả cầu & que nối</span>
                        <span className="text-[10px] text-slate-400">Rõ liên kết O-H</span>
                      </button>

                      <button
                        onClick={() => setDisplayMode('space-filling')}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                          displayMode === 'space-filling'
                            ? 'bg-teal-600/30 text-teal-200 border-teal-500 font-bold'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Atom className="w-4 h-4 text-emerald-400" />
                        <span>Không gian đặc</span>
                        <span className="text-[10px] text-slate-400">Bán kính vdW thực</span>
                      </button>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-2.5">
                    <label className="font-semibold text-white block">Lớp hiển thị khoa học:</label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition">
                      <span className="text-slate-300">Nhãn tên nguyên tử (O, H)</span>
                      <input
                        type="checkbox"
                        checked={showLabels}
                        onChange={(e) => setShowLabels(e.target.checked)}
                        className="rounded accent-teal-500 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition">
                      <span className="text-slate-300">Cung đo góc liên kết (104.5°)</span>
                      <input
                        type="checkbox"
                        checked={showAngleArc}
                        onChange={(e) => setShowAngleArc(e.target.checked)}
                        className="rounded accent-teal-500 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition">
                      <span className="text-slate-300">Vector lưỡng cực điện (μ = 1.85 D)</span>
                      <input
                        type="checkbox"
                        checked={showDipole}
                        onChange={(e) => setShowDipole(e.target.checked)}
                        className="rounded accent-teal-500 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition">
                      <span className="text-slate-300">Điện tích riêng phần (2δ⁻, δ⁺)</span>
                      <input
                        type="checkbox"
                        checked={showPartialCharges}
                        onChange={(e) => setShowPartialCharges(e.target.checked)}
                        className="rounded accent-teal-500 w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition">
                      <span className="text-slate-300">Cặp electron tự do VSEPR (Lone pairs)</span>
                      <input
                        type="checkbox"
                        checked={showLonePairs}
                        onChange={(e) => setShowLonePairs(e.target.checked)}
                        className="rounded accent-teal-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Dynamics & Vibration */}
                  <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-white flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        Dao động nhiệt phân tử:
                      </label>
                      <span className="font-mono text-xs text-amber-400 font-bold">
                        {vibrationSpeed.toFixed(1)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2.5"
                      step="0.1"
                      value={vibrationSpeed}
                      onChange={(e) => setVibrationSpeed(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <label className="font-semibold text-white flex items-center gap-1.5 cursor-pointer">
                        <span>Tự động xoay 360°</span>
                      </label>
                      <input
                        type="checkbox"
                        checked={autoRotate}
                        onChange={(e) => setAutoRotate(e.target.checked)}
                        className="rounded accent-teal-500 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SCIENTIFIC EXPLANATION */}
              {activeTab === 'science' && (
                <div className="space-y-4 leading-relaxed">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800">
                      Chuẩn kiến thức GDPT 2018
                    </span>
                    <h3 className="font-bold text-base text-white mt-1.5">
                      Bản Chất Khoa Học Của Phân Tử H₂O
                    </h3>
                  </div>

                  {/* Section 1 */}
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-1.5">
                    <h4 className="font-bold text-teal-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      1. Thành phần và cấu tạo
                    </h4>
                    <p className="text-slate-300 text-[11px]">
                      Phân tử nước gồm <strong>1 nguyên tử Oxy (Oxygen)</strong> liên kết với{' '}
                      <strong>2 nguyên tử Hydro (Hydrogen)</strong>. Mỗi nguyên tử Hydro góp chung 1
                      electron với Oxy, hình thành <strong>2 liên kết cộng hóa trị đơn</strong> (O–H).
                    </p>
                  </div>

                  {/* Section 2 */}
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-1.5">
                    <h4 className="font-bold text-teal-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      2. Tại sao góc liên kết là 104.5°?
                    </h4>
                    <p className="text-slate-300 text-[11px]">
                      Nguyên tử Oxy ở trạng thái lai hóa <em>sp³</em> với 4 đám mây electron hướng về 4
                      đỉnh của hình tứ diện đều (góc lý thuyết 109.5°). Tuy nhiên, Oxy còn lại{' '}
                      <strong>2 cặp electron tự do (lone pairs)</strong> chưa tham gia liên kết. Các cặp
                      electron tự do này chiếm khoảng không gian lớn hơn và tạo lực đẩy mạnh, ép hai
                      liên kết O–H lại gần nhau, làm góc liên kết giảm xuống còn{' '}
                      <strong className="text-teal-300 font-mono">104.5°</strong> (dạng hình học gấp khúc).
                    </p>
                  </div>

                  {/* Section 3 */}
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-1.5">
                    <h4 className="font-bold text-teal-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      3. Tính phân cực mạnh (Lưỡng cực điện)
                    </h4>
                    <p className="text-slate-300 text-[11px]">
                      Độ âm điện của Oxy (3.44) lớn hơn nhiều so với Hydro (2.20). Đôi electron dùng chung
                      bị lệch mạnh về phía nguyên tử Oxy, làm cho đầu Oxy mang điện tích âm một phần (2δ⁻),
                      còn mỗi đầu Hydro mang điện tích dương một phần (δ⁺).
                    </p>
                    <p className="text-slate-300 text-[11px] pt-1">
                      Vì phân tử có dạng gấp khúc không đối xứng, các mômen lưỡng cực không triệt tiêu nhau,
                      tạo ra mômen lưỡng cực tổng cộng lớn:{' '}
                      <strong className="text-amber-400 font-mono">μ = 1.85 Debye</strong>.
                    </p>
                  </div>

                  {/* Section 4 */}
                  <div className="bg-teal-950/40 p-3 rounded-xl border border-teal-800/60 space-y-1.5">
                    <h4 className="font-bold text-teal-300">🌍 Ý nghĩa đối với sự sống trên Trái Đất:</h4>
                    <p className="text-slate-300 text-[11px]">
                      Nhờ tính phân cực mạnh và góc gấp khúc 104.5°, các phân tử nước có thể tạo{' '}
                      <strong>liên kết hydro liên phân tử</strong> bền vững. Điều này giải thích tại sao:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1">
                      <li>Nước có nhiệt dung riêng cao, điều hòa khí hậu toàn cầu.</li>
                      <li>Nước đá có khối lượng riêng nhỏ hơn nước lỏng (nổi trên mặt hồ, bảo vệ sinh vật đáy hồ vào mùa đông).</li>
                      <li>Nước là dung môi hòa tan sự sống cho hầu hết các chất sinh học.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 3: DISCOVERY QUESTIONS */}
              {activeTab === 'questions' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-1">
                      <HelpCircle className="w-4 h-4 text-teal-400" />
                      Câu Hỏi Khám Phá & Đố Vui
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      Thử thách tư duy khoa học về cấu tạo phân tử nước.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {discoveryQuestions.map((q, idx) => {
                      const selectedOptionId = answeredQuestions[q.id];
                      const isRevealed = showFeedback[q.id];

                      return (
                        <div
                          key={q.id}
                          className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-3"
                        >
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-teal-600/30 text-teal-400 font-bold flex items-center justify-center shrink-0 text-xs">
                              {idx + 1}
                            </span>
                            <h4 className="font-semibold text-white text-xs leading-snug">
                              {q.question}
                            </h4>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            {q.options.map((opt) => {
                              const isSelected = selectedOptionId === opt.id;
                              let btnClass = 'bg-slate-900/60 hover:bg-slate-900 text-slate-300 border-slate-800';

                              if (isRevealed) {
                                if (opt.isCorrect) {
                                  btnClass = 'bg-emerald-950/80 text-emerald-200 border-emerald-600 font-semibold';
                                } else if (isSelected && !opt.isCorrect) {
                                  btnClass = 'bg-rose-950/80 text-rose-200 border-rose-600';
                                }
                              } else if (isSelected) {
                                btnClass = 'bg-teal-600/30 text-teal-200 border-teal-500 font-semibold';
                              }

                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => handleAnswer(q.id, opt.id)}
                                  className={`w-full text-left p-2.5 rounded-xl border text-[11px] transition flex items-start gap-2 ${btnClass}`}
                                >
                                  <span className="font-mono uppercase font-bold shrink-0 mt-0.5">
                                    {opt.id}.
                                  </span>
                                  <span className="flex-1">{opt.text}</span>
                                  {isRevealed && opt.isCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  )}
                                  {isRevealed && isSelected && !opt.isCorrect && (
                                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {isRevealed && (
                            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-300 animate-in fade-in">
                              <p className="font-semibold text-teal-400 mb-1">💡 Lời giải khoa học:</p>
                              <p>{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: ATOM INSPECTOR */}
              {activeTab === 'inspector' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-1">
                      <Atom className="w-4 h-4 text-teal-400" />
                      Thông Số Nguyên Tử Chi Tiết
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      Nhấp vào bất kỳ nguyên tử nào trong mô hình 3D để kiểm tra thông số.
                    </p>
                  </div>

                  {/* Atom Selector Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setSelectedAtom(ATOM_DATABASE.O)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedAtom?.id === 'O'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span>Oxy (O)</span>
                    </button>
                    <button
                      onClick={() => setSelectedAtom(ATOM_DATABASE.H1)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedAtom?.id === 'H1'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <span>Hydro 1</span>
                    </button>
                    <button
                      onClick={() => setSelectedAtom(ATOM_DATABASE.H2)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        selectedAtom?.id === 'H2'
                          ? 'bg-sky-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <span>Hydro 2</span>
                    </button>
                  </div>

                  {selectedAtom && (
                    <div className="space-y-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                      <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-base shadow-inner text-white border"
                            style={{
                              backgroundColor: selectedAtom.cpkColor === '#F8FAFC' ? '#475569' : selectedAtom.cpkColor,
                              borderColor: '#ffffff30',
                            }}
                          >
                            {selectedAtom.symbol}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">
                              {selectedAtom.vietnameseName}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Nguyên tử khối: {selectedAtom.atomicMass} amu
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-teal-300">
                          Z = {selectedAtom.atomicNumber}
                        </span>
                      </div>

                      {/* Detail Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block">Số hạt:</span>
                          <span className="font-semibold text-white">
                            {selectedAtom.protons}p, {selectedAtom.neutrons}n, {selectedAtom.electrons}e
                          </span>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block">Độ âm điện (Pauling):</span>
                          <span className="font-semibold text-amber-400 font-mono">
                            {selectedAtom.electronegativity.toFixed(2)}
                          </span>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block">Cấu hình electron:</span>
                          <span className="font-semibold text-teal-300 font-mono">
                            {selectedAtom.electronConfiguration}
                          </span>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block">Điện tích riêng phần:</span>
                          <span className="font-semibold text-emerald-400 font-mono">
                            {selectedAtom.partialCharge}
                          </span>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block">Bán kính cộng hóa trị:</span>
                          <span className="font-semibold text-white">
                            {selectedAtom.covalentRadius} Å
                          </span>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 block">Bán kính van der Waals:</span>
                          <span className="font-semibold text-white">
                            {selectedAtom.vanDerWaalsRadius} Å
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1">
                        <span className="text-teal-400 font-bold block">Vai trò trong phân tử nước:</span>
                        <p className="text-slate-300 leading-relaxed">{selectedAtom.roleInWater}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Panel Footer */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Chuẩn CPK quốc tế</span>
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition"
                >
                  Hoàn thành trạm
                </button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
