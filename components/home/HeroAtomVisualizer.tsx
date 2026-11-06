import React, { useState } from 'react';
import { Sparkles, Play, Pause, RotateCcw } from 'lucide-react';

export const HeroAtomVisualizer: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<'C' | 'O' | 'Na'>('C');
  const [isPaused, setIsPaused] = useState(false);

  const elements = {
    C: {
      name: 'Carbon',
      symbol: 'C',
      atomicNumber: 6,
      mass: '12,011 amu',
      protons: 6,
      neutrons: 6,
      shells: [2, 4],
      color: 'from-emerald-400 to-teal-600',
      desc: 'Nguyên tố nền tảng của sự sống và các hợp chất hữu cơ (KHTN 7 & 9).',
    },
    O: {
      name: 'Oxygen',
      symbol: 'O',
      atomicNumber: 8,
      mass: '15,999 amu',
      protons: 8,
      neutrons: 8,
      shells: [2, 6],
      color: 'from-sky-400 to-blue-600',
      desc: 'Duy trì sự hô hấp và sự cháy, chiếm khoảng 21% thể tích không khí (KHTN 6).',
    },
    Na: {
      name: 'Sodium',
      symbol: 'Na',
      atomicNumber: 11,
      mass: '22,990 amu',
      protons: 11,
      neutrons: 12,
      shells: [2, 8, 1],
      color: 'from-amber-400 to-orange-600',
      desc: 'Kim loại kiềm điển hình, có 1 electron lớp ngoài cùng, tạo muối Sodium chloride (KHTN 7).',
    },
  };

  const current = elements[selectedElement];

  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border border-slate-700/70 p-5 sm:p-6 shadow-xl overflow-hidden text-slate-100">
      {/* Subtle Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-200 border border-teal-400/25">
            <Sparkles className="w-3.5 h-3.5" />
            Mô hình Rutherford - Bohr (IUPAC)
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          {(['C', 'O', 'Na'] as const).map((el) => (
            <button
              key={el}
              onClick={() => setSelectedElement(el)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedElement === el
                  ? 'bg-teal-700 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {elements[el].symbol} ({elements[el].name})
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG Bohr Model */}
      <div className="relative z-10 flex items-center justify-center py-2">
        <svg viewBox="0 0 320 320" className="w-60 h-60 sm:w-68 sm:h-68 select-none">
          <defs>
            <radialGradient id="nucleusGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#dc2626" />
            </radialGradient>
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Electron Shells */}
          {current.shells.map((electronCount, shellIndex) => {
            const radius = 52 + shellIndex * 36;
            const duration = 8 + shellIndex * 5;
            return (
              <g key={shellIndex}>
                {/* Orbit Ring */}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  fill="none"
                  stroke="rgba(125, 211, 252, 0.28)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Rotating Electrons Group */}
                <g
                  style={{
                    transformOrigin: '160px 160px',
                    animation: isPaused ? 'none' : `spin ${duration}s linear infinite ${shellIndex % 2 === 1 ? 'reverse' : ''}`,
                  }}
                >
                  {Array.from({ length: electronCount }).map((_, idx) => {
                    const angle = (idx * 2 * Math.PI) / electronCount;
                    const ex = 160 + radius * Math.cos(angle);
                    const ey = 160 + radius * Math.sin(angle);
                    return (
                      <g key={idx}>
                        <circle
                          cx={ex}
                          cy={ey}
                          r="6.5"
                          fill="#38bdf8"
                          filter="url(#glow)"
                        />
                        <text
                          x={ex}
                          y={ey + 3}
                          textAnchor="middle"
                          fill="#082f49"
                          fontSize="8"
                          fontWeight="bold"
                        >
                          -
                        </text>
                      </g>
                    );
                  })}
                </g>
              </g>
            );
          })}

          {/* Nucleus */}
          <g>
            <circle cx="160" cy="160" r="24" fill="url(#nucleusGrad)" filter="url(#glow)" />
            <text
              x="160"
              y="157"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="800"
            >
              +{current.protons}
            </text>
            <text
              x="160"
              y="170"
              textAnchor="middle"
              fill="#fef3c7"
              fontSize="9"
              fontWeight="600"
            >
              {current.symbol}
            </text>
          </g>
        </svg>

        {/* Floating Quick Controls */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title={isPaused ? 'Tiếp tục chuyển động' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
          </button>
          <button
            onClick={() => {
              setSelectedElement('C');
              setIsPaused(false);
            }}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Đặt lại"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Element Info Card */}
      <div className="relative z-10 mt-2 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-bold text-white">
              Nguyên tử {current.name} ({current.symbol}) — Z = {current.atomicNumber}
            </h4>
            <p className="text-xs text-sky-100/80 mt-0.5">{current.desc}</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-300/30 text-xs font-mono font-bold text-amber-300 shrink-0">
            {current.mass}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
          <div className="bg-slate-900/50 rounded-xl p-1.5">
            <span className="block text-[10px] text-slate-300">Số Proton (p)</span>
            <span className="text-xs font-bold text-rose-400">{current.protons} hạt (+)</span>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-1.5">
            <span className="block text-[10px] text-slate-300">Số Neutron (n)</span>
            <span className="text-xs font-bold text-amber-400">{current.neutrons} hạt (0)</span>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-1.5">
            <span className="block text-[10px] text-slate-300">Lớp vỏ Electron</span>
            <span className="text-xs font-bold text-sky-400">{current.shells.join(' - ')} (e)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
