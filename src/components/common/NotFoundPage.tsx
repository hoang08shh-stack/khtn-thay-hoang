import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Atom, HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Mã lỗi 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Không tìm thấy trang
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Liên kết bạn vừa truy cập không tồn tại hoặc đã được di chuyển trong chương trình học KHTN.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-teal-600/20"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang chủ</span>
          </Link>
          <Link
            to="/phong-thi-nghiem-3d"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Atom className="w-4 h-4 text-teal-500" />
            <span>Phòng 3D</span>
          </Link>
          <Link
            to="/luyen-tap"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span>Luyện tập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
