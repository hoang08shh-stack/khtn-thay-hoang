import React from 'react';
import { AlertCircle, RotateCcw, Home, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã xảy ra sự cố',
  message = 'Không thể tải nội dung học tập vào lúc này. Em vui lòng thử lại hoặc quay về trang chủ.',
  retryLabel = 'Thử tải lại',
  onRetry,
  showHomeButton = true,
}) => {
  return (
    <div className="w-full py-16 px-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-4 shadow-sm my-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-lg font-bold text-[#0B1F3A] dark:text-white">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {message}
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition flex items-center gap-1.5 active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử tải lại</span>
          </button>
        )}

        {showHomeButton && (
          <Link
            to="/"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
        )}
      </div>
    </div>
  );
};
