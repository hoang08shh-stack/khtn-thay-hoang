import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.ts';
import { UserRole } from '../../types/supabase.ts';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles,
}) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    );
  }

  // Not logged in
  if (requireAuth && !user) {
    return <Navigate to="/dang-nhap" state={{ from: location }} replace />;
  }

  // Role check (for admin route, strictly require hoang08shh@gmail.com)
  const isHoangAdmin = Boolean(
    user?.email && user.email.trim().toLowerCase() === 'hoang08shh@gmail.com'
  );
  const hasPermission =
    !allowedRoles ||
    allowedRoles.length === 0 ||
    (allowedRoles.includes('admin') ? isHoangAdmin : allowedRoles.includes(role));

  if (!hasPermission) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-[#0B1F3A] dark:text-white">
              Khu Vực Giới Hạn Quyền Quản Trị
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Trang quản trị chỉ dành cho tài khoản Quản trị viên (<strong>hoang08shh@gmail.com</strong>).
              Tài khoản hiện tại (<strong>{user?.email}</strong>) đang ở vai trò Học sinh nên không có quyền truy cập.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Tài khoản hiện tại:</span>
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{user?.email || role}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link
              to="/dang-nhap"
              className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs transition shadow-sm text-center"
            >
              Đăng nhập Quản trị (hoang08shh@gmail.com)
            </Link>
            <Link
              to="/"
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
