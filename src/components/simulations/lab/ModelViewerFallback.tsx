import React from 'react';
import { SimulationManifest } from '../../../types/simulationManifest.ts';
import { AlertTriangle, BookOpen, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

interface ModelViewerFallbackProps {
  manifest: SimulationManifest;
}

export const ModelViewerFallback: React.FC<ModelViewerFallbackProps> = ({ manifest }) => {
  return (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-6 bg-slate-950 text-white rounded-3xl border border-slate-800">
      <div className="max-w-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800 text-teal-400 border border-slate-700 inline-block mb-2">
            Chế độ tương thích 2D (Thiết bị không hỗ trợ WebGL)
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {manifest.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {manifest.subtitle}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-3">
          <h3 className="text-xs font-bold text-teal-300 flex items-center gap-1.5 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            Tóm tắt kiến thức GDPT 2018:
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {manifest.summary}
          </p>

          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-[11px] font-semibold text-slate-400 mb-2">
              Các bộ phận chính của mô hình:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {manifest.annotations.map((pin) => (
                <div
                  key={pin.id}
                  className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs"
                >
                  <strong className="text-teal-400 block font-bold">{pin.title}</strong>
                  <span className="text-slate-400 text-[11px] leading-tight block mt-0.5">
                    {pin.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-xs text-slate-400">
            Khối lớp: <strong className="text-white">Lớp {manifest.grade}</strong> • Phiên bản:{' '}
            <strong className="text-teal-400">v{manifest.version}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
