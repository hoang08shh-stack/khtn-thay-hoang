import React from 'react';
import { AtomProperties, ATOM_DATABASE, H2O_CONSTANTS } from '../../../utils/waterMoleculeMath.ts';
import { AlertTriangle, Sparkles } from 'lucide-react';

interface WaterMoleculeFallbackProps {
  parameters: {
    displayMode: 'ball-and-stick' | 'space-filling';
    bondAngleDeg: number;
    showLabels: boolean;
    showAngleArc: boolean;
    showDipole: boolean;
    showLonePairs: boolean;
    showPartialCharges: boolean;
  };
  onSelectAtom?: (atom: AtomProperties) => void;
  selectedAtomId?: string | null;
}

export const WaterMoleculeFallback: React.FC<WaterMoleculeFallbackProps> = ({
  parameters,
  onSelectAtom,
  selectedAtomId,
}) => {
  const { displayMode, bondAngleDeg, showLabels, showAngleArc, showDipole, showLonePairs, showPartialCharges } = parameters;
  const isSpaceFilling = displayMode === 'space-filling';

  // SVG dimensions
  const svgWidth = 500;
  const svgHeight = 400;
  const cx = svgWidth / 2;
  const cy = 160;

  // Geometry in 2D
  const halfAngleRad = ((bondAngleDeg / 2) * Math.PI) / 180;
  const bondLength = isSpaceFilling ? 75 : 130;

  const h1x = cx + bondLength * Math.sin(halfAngleRad);
  const h1y = cy + bondLength * Math.cos(halfAngleRad);

  const h2x = cx - bondLength * Math.sin(halfAngleRad);
  const h2y = cy + bondLength * Math.cos(halfAngleRad);

  const oRadius = isSpaceFilling ? 65 : 42;
  const hRadius = isSpaceFilling ? 48 : 28;

  // Arc path for angle
  const arcR = 55;
  const arcStartX = cx - arcR * Math.sin(halfAngleRad);
  const arcStartY = cy + arcR * Math.cos(halfAngleRad);
  const arcEndX = cx + arcR * Math.sin(halfAngleRad);
  const arcEndY = cy + arcR * Math.cos(halfAngleRad);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#060e1d] to-[#040914] select-none text-white">
      {/* Notice banner */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-950/70 border border-amber-600/40 text-amber-200 text-xs backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Chế độ 2D tương thích cao (Thiết bị của em đang chạy mượt bản 2D chuẩn khoa học)</span>
        </div>
        <span className="text-[11px] font-mono text-amber-300 font-bold">Vector SVG</span>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full max-w-lg h-auto max-h-[420px]"
      >
        <defs>
          {/* Radial gradients for 3D sphere look */}
          <radialGradient id="oxygenGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>

          <radialGradient id="hydrogenGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Lone pairs (VSEPR lobes above Oxygen) */}
        {showLonePairs && (
          <g opacity="0.6">
            <ellipse
              cx={cx - 30}
              cy={cy - 45}
              rx="16"
              ry="26"
              fill="#38bdf8"
              transform={`rotate(-25 ${cx - 30} ${cy - 45})`}
            />
            <ellipse
              cx={cx + 30}
              cy={cy - 45}
              rx="16"
              ry="26"
              fill="#38bdf8"
              transform={`rotate(25 ${cx + 30} ${cy - 45})`}
            />
            {/* Pairs of dots */}
            <circle cx={cx - 32} cy={cy - 50} r="3" fill="#bae6fd" />
            <circle cx={cx - 24} cy={cy - 42} r="3" fill="#bae6fd" />
            <circle cx={cx + 32} cy={cy - 50} r="3" fill="#bae6fd" />
            <circle cx={cx + 24} cy={cy - 42} r="3" fill="#bae6fd" />
          </g>
        )}

        {/* Covalent bonds (Ball-and-stick mode) */}
        {!isSpaceFilling && (
          <g stroke="#94a3b8" strokeWidth="10" strokeLinecap="round">
            <line x1={cx} y1={cy} x2={h1x} y2={h1y} />
            <line x1={cx} y1={cy} x2={h2x} y2={h2y} />
          </g>
        )}

        {/* Angle Arc */}
        {showAngleArc && !isSpaceFilling && (
          <g>
            <path
              d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 1 ${arcEndX} ${arcEndY}`}
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="2.5"
              strokeDasharray="4 2"
            />
            <text
              x={cx}
              y={cy + arcR + 22}
              fill="#2dd4bf"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {bondAngleDeg.toFixed(1)}°
            </text>
          </g>
        )}

        {/* Dipole Moment Arrow */}
        {showDipole && (
          <g filter="url(#glow)">
            {/* Arrow line */}
            <line
              x1={cx}
              y1={cy + bondLength + 20}
              x2={cx}
              y2={cy - 30}
              stroke="#f59e0b"
              strokeWidth="3.5"
            />
            {/* Arrow head */}
            <polygon
              points={`${cx},${cy - 45} ${cx - 7},${cy - 25} ${cx + 7},${cy - 25}`}
              fill="#f59e0b"
            />
            {/* Tail cross */}
            <line
              x1={cx - 10}
              y1={cy + bondLength + 10}
              x2={cx + 10}
              y2={cy + bondLength + 10}
              stroke="#f59e0b"
              strokeWidth="3"
            />
            <text
              x={cx + 15}
              y={cy + 40}
              fill="#fbbf24"
              fontSize="12"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              μ = 1.85 D
            </text>
          </g>
        )}

        {/* Oxygen Atom */}
        <g
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => onSelectAtom?.(ATOM_DATABASE.O)}
        >
          <circle
            cx={cx}
            cy={cy}
            r={oRadius}
            fill="url(#oxygenGrad)"
            stroke={selectedAtomId === 'O' ? '#fde047' : '#b91c1c'}
            strokeWidth={selectedAtomId === 'O' ? 4 : 2}
            filter={selectedAtomId === 'O' ? 'url(#glow)' : undefined}
          />
          {showLabels && (
            <text
              x={cx}
              y={cy + 8}
              fill="#ffffff"
              fontSize="24"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              O
            </text>
          )}
          {showPartialCharges && (
            <text
              x={cx}
              y={cy - oRadius - 8}
              fill="#f87171"
              fontSize="13"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              2δ⁻
            </text>
          )}
        </g>

        {/* Hydrogen 1 */}
        <g
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => onSelectAtom?.(ATOM_DATABASE.H1)}
        >
          <circle
            cx={h1x}
            cy={h1y}
            r={hRadius}
            fill="url(#hydrogenGrad)"
            stroke={selectedAtomId === 'H1' ? '#fde047' : '#64748b'}
            strokeWidth={selectedAtomId === 'H1' ? 4 : 2}
            filter={selectedAtomId === 'H1' ? 'url(#glow)' : undefined}
          />
          {showLabels && (
            <text
              x={h1x}
              y={h1y + 6}
              fill="#0f172a"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              H
            </text>
          )}
          {showPartialCharges && (
            <text
              x={h1x + hRadius + 6}
              y={h1y + 4}
              fill="#38bdf8"
              fontSize="13"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              δ⁺
            </text>
          )}
        </g>

        {/* Hydrogen 2 */}
        <g
          className="cursor-pointer transition-transform hover:scale-105"
          onClick={() => onSelectAtom?.(ATOM_DATABASE.H2)}
        >
          <circle
            cx={h2x}
            cy={h2y}
            r={hRadius}
            fill="url(#hydrogenGrad)"
            stroke={selectedAtomId === 'H2' ? '#fde047' : '#64748b'}
            strokeWidth={selectedAtomId === 'H2' ? 4 : 2}
            filter={selectedAtomId === 'H2' ? 'url(#glow)' : undefined}
          />
          {showLabels && (
            <text
              x={h2x}
              y={h2y + 6}
              fill="#0f172a"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              H
            </text>
          )}
          {showPartialCharges && (
            <text
              x={h2x - hRadius - 16}
              y={h2y + 4}
              fill="#38bdf8"
              fontSize="13"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              δ⁺
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};
