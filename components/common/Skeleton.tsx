import React from 'react';

export const LessonCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-pulse flex flex-col justify-between">
      <div>
        {/* 16:9 Thumbnail skeleton */}
        <div className="w-full aspect-video bg-slate-200 dark:bg-slate-800 relative" />
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-3.5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      </div>
      <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex items-center justify-between">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
};

export const SimulationSkeleton: React.FC<{ label?: string }> = ({
  label = 'Đang tải môi trường phòng thí nghiệm 3D...',
}) => {
  return (
    <div className="w-full aspect-[16/10] sm:aspect-video rounded-3xl bg-[#071527] border border-slate-800 shadow-2xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden animate-pulse">
      <div className="w-20 h-20 rounded-full bg-teal-500/10 border-2 border-teal-500/30 flex items-center justify-center mb-4">
        <div className="w-8 h-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm font-semibold text-teal-300">{label}</p>
      <p className="text-xs text-slate-500 mt-1">Khởi tạo WebGL Three.js & vật lý số</p>
      <div className="mt-4 flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
};

export const ContentSkeleton: React.FC<{ lines?: number }> = ({ lines = 4 }) => {
  return (
    <div className="space-y-2.5 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md"
          style={{ width: `${85 - (i % 3) * 15}%` }}
        />
      ))}
    </div>
  );
};
