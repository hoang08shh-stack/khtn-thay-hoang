import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Atom,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  BookOpen,
  FlaskConical,
  Video,
  CheckSquare,
  GraduationCap,
  Sparkles,
  User as UserIcon,
  LogOut,
  BarChart3,
  ShieldCheck,
  Gamepad2,
  Download,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onOpenSearch: () => void;
  currentUser?: unknown;
  onLogout?: () => Promise<void> | void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const gradeLinks = [
    { path: '/lop-6', label: 'Lớp 6', badge: 'KHTN 6', color: 'from-teal-700 to-teal-600' },
    { path: '/lop-7', label: 'Lớp 7', badge: 'KHTN 7', color: 'from-sky-700 to-sky-600' },
    { path: '/lop-8', label: 'Lớp 8', badge: 'KHTN 8', color: 'from-indigo-700 to-indigo-600' },
    { path: '/lop-9', label: 'Lớp 9', badge: 'KHTN 9', color: 'from-slate-700 to-teal-700' },
  ];

  const isAdminAccount = Boolean(
    user?.email && user.email.trim().toLowerCase() === 'hoang08shh@gmail.com'
  );

  const mainLinks = [
    { path: '/chu-de', label: 'Chủ đề', icon: BookOpen },
    { path: '/phong-thi-nghiem-3d', label: 'Khoa học số 3D', icon: FlaskConical, highlight: true },
    { path: '/tro-choi', label: 'Trò chơi', icon: Gamepad2, isGame: true },
    { path: '/video', label: 'Video', icon: Video },
    { path: '/luyen-tap', label: 'Luyện tập', icon: CheckSquare },
    ...(isAdminAccount
      ? [{ path: '/quan-tri', label: 'Quản trị', icon: ShieldCheck, isAdmin: true }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-100/95 dark:bg-slate-900/95 border-b border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors duration-200">
      {/* Subtle muted top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-teal-700 via-sky-700 to-slate-700 opacity-85" />
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-1.5">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-teal-700 via-sky-700 to-slate-800 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Atom className="w-5 h-5 animate-spin-slow" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-400 rounded-full border-2 border-slate-100 dark:border-slate-900" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
                KHOA HỌC TỰ NHIÊN
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                KHOA HỌC SỐ KHTN • Kết nối tri thức
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 min-w-0">
            {/* Grade Pills */}
            <div className="flex items-center bg-slate-200/75 dark:bg-slate-800/80 p-0.5 rounded-xl mr-0.5 border border-slate-300/60 dark:border-slate-700/60 shrink-0">
              {gradeLinks.map((g) => {
                const active = isActive(g.path);
                return (
                  <Link
                    key={g.path}
                    to={g.path}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      active
                        ? `bg-gradient-to-r ${g.color} text-white shadow-sm`
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {g.label}
                  </Link>
                );
              })}
            </div>

            {/* Feature Links */}
            {mainLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    item.isAdmin
                      ? active
                        ? 'bg-indigo-700 text-white shadow-sm'
                        : 'bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-300/70 dark:border-indigo-800/70'
                      : item.highlight
                      ? active
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-teal-50/80 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 hover:bg-teal-100/80 dark:hover:bg-teal-900/50 border border-teal-200/70 dark:border-teal-800/60'
                      : item.isGame
                      ? active
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'bg-slate-200/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300/70 dark:border-slate-700'
                      : active
                      ? 'bg-sky-100/80 dark:bg-slate-800 text-sky-800 dark:text-sky-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      item.isAdmin
                        ? active
                          ? 'text-white'
                          : 'text-indigo-600 dark:text-indigo-400'
                        : item.highlight
                        ? active
                          ? 'text-white'
                          : 'text-teal-600 dark:text-teal-300'
                        : ''
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Download Full Project Source Code (.ZIP) */}
            <a
              href="/khtn-source-code.zip"
              download="KHTN-Khoa-Hoc-So-Source-Code.zip"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] xl:text-xs shadow-sm transition-all whitespace-nowrap"
              title="Tải toàn bộ mã nguồn dự án (.ZIP) về máy"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span className="hidden sm:inline">Tải mã nguồn (.ZIP)</span>
            </a>

            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs transition-all border border-slate-300/70 dark:border-slate-700"
              title="Tìm kiếm bài học, nguyên tố IUPAC, công thức (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
              <kbd className="hidden sm:inline-block px-1 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 text-slate-500">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Chuyển đổi giao diện Sáng/Tối"
              className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/70 dark:border-slate-700 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-300" />}
            </button>

            {/* User Account / Auth Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300/70 transition-all"
                >
                  <div className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center text-xs font-bold">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden xl:inline text-xs font-bold max-w-[74px] truncate">
                    {user.fullName}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 dark:bg-teal-950/60 text-sky-700 dark:text-teal-300">
                        {isAdminAccount ? 'Quản trị viên (Admin)' : `Học sinh Lớp ${user.grade || 8}`}
                      </span>
                    </div>

                    {isAdminAccount && (
                      <Link
                        to="/quan-tri"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/60"
                      >
                        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        Trang Quản trị Hệ thống (CMS)
                      </Link>
                    )}

                    <Link
                      to="/tien-do"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <BarChart3 className="w-4 h-4 text-sky-600" />
                      Bảng tiến độ học tập
                    </Link>

                    <Link
                      to="/tro-choi"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Gamepad2 className="w-4 h-4 text-amber-500" />
                      Trò chơi KHOA HỌC SỐ KHTN
                    </Link>

                    <Link
                      to="/dang-nhap"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-teal-700 dark:text-teal-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-800 mt-1 pt-2"
                    >
                      <UserIcon className="w-4 h-4 text-teal-600" />
                      Đổi tài khoản đăng nhập
                    </Link>

                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                        navigate('/dang-nhap');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/dang-nhap"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-600 hover:to-sky-700 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap"
              >
                <UserIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Mở menu điều hướng"
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2">
              Chọn khối lớp (Kết nối tri thức)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {gradeLinks.map((g) => (
                <Link
                  key={g.path}
                  to={g.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all ${
                    isActive(g.path)
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 mb-1 opacity-75" />
                  <span className="text-xs">{g.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-2">
              Chuyên mục học tập & Quản trị
            </p>
            {mainLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive(item.path)
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              to="/tai-lieu"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Tài liệu & Đề cương</span>
            </Link>
            <Link
              to="/tien-do"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <BarChart3 className="w-4 h-4 text-sky-600" />
              <span>Bảng tiến độ cá nhân</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
