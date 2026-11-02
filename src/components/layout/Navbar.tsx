import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FlaskConical,
  Atom,
  Video,
  FileText,
  HelpCircle,
  Search,
  Menu,
  X,
  User,
  GraduationCap,
  Sparkles,
  Layers,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Bell,
  Database,
} from 'lucide-react';
import { AppUser } from '../../types/index.ts';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useNotification } from '../../context/NotificationContext.tsx';
import { NotificationDrawer } from '../notifications/NotificationDrawer.tsx';
import { DeploymentGuideModal } from '../common/DeploymentGuideModal.tsx';

interface NavbarProps {
  currentUser: AppUser | null;
  onOpenSearch: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenSearch,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [deploymentGuideOpen, setDeploymentGuideOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotification();

  const navLinks = [
    { to: '/chu-de', label: 'Chủ đề', icon: Layers },
    { to: '/phong-thi-nghiem-3d', label: 'Phòng 3D', icon: Atom, highlight: true },
    { to: '/video', label: 'Video', icon: Video },
    { to: '/tai-lieu', label: 'Tài liệu', icon: FileText },
    { to: '/luyen-tap', label: 'Luyện tập', icon: HelpCircle },
  ];

  const grades = [
    { grade: 6, path: '/lop-6', label: 'KHTN Lớp 6' },
    { grade: 7, path: '/lop-7', label: 'KHTN Lớp 7' },
    { grade: 8, path: '/lop-8', label: 'KHTN Lớp 8' },
    { grade: 9, path: '/lop-9', label: 'KHTN Lớp 9' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B1F3A]/95 dark:bg-[#071527]/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 p-0.5 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-teal-400 transition">
                  KHTN THẦY HOÀNG
                </span>
                <span className="hidden xs:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  GDPT 2018
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                Phòng thí nghiệm khoa học số
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* Grade dropdown */}
            <div className="relative">
              <button
                onClick={() => setGradeDropdownOpen(!gradeDropdownOpen)}
                onBlur={() => setTimeout(() => setGradeDropdownOpen(false), 200)}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4 text-teal-400" />
                <span>Khối lớp</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {gradeDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 rounded-2xl bg-[#0B1F3A] border border-slate-700 shadow-2xl py-2 z-50">
                  {grades.map((g) => (
                    <Link
                      key={g.grade}
                      to={g.path}
                      onClick={() => setGradeDropdownOpen(false)}
                      className={`block px-4 py-2 text-sm font-medium transition ${
                        location.pathname === g.path
                          ? 'bg-teal-500/20 text-teal-300 border-l-2 border-teal-400'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      {g.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30'
                      : item.highlight
                      ? 'text-teal-400 hover:bg-teal-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              className="p-2 sm:px-2.5 sm:py-2 min-w-[40px] min-h-[40px] rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-amber-300 hover:text-amber-200 transition flex items-center justify-center gap-1.5"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden xl:inline text-xs font-semibold text-slate-200">Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-cyan-300" />
                  <span className="hidden xl:inline text-xs font-semibold text-slate-200">Tối</span>
                </>
              )}
            </button>

            {/* Search Trigger button */}
            <button
              onClick={onOpenSearch}
              className="p-2 sm:px-3 sm:py-2 min-w-[40px] min-h-[40px] rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition"
              title="Tìm kiếm nhanh bài học, mô phỏng (Ctrl+K)"
            >
              <Search className="w-4 h-4 text-teal-400" />
              <span className="hidden md:inline">Tìm kiếm...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 border border-slate-700 rounded text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Notification Bell Button */}
            <button
              onClick={() => setNotificationDrawerOpen(true)}
              className="relative p-2 min-w-[40px] min-h-[40px] rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center"
              aria-label="Xem thông báo và nhắc nhở học tập"
              title="Thông báo và nhắc nhở học tập"
            >
              <Bell className="w-4 h-4 text-teal-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-pulse shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Quick SQL & Deployment Guide Button */}
            <button
              onClick={() => setDeploymentGuideOpen(true)}
              className="px-2.5 py-2 min-h-[40px] rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 hover:text-emerald-200 text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm"
              title="Hướng dẫn cài đặt Supabase & Sao chép toàn bộ mã SQL"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">Lấy Mã SQL</span>
            </button>

            {/* User Profile or Login (Desktop / Tablet) */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <Link
                  to="/tien-do"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition"
                  title="Xem tiến độ học tập"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white line-clamp-1 max-w-[100px] lg:max-w-[130px]">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] text-teal-400 font-medium">
                      {currentUser.role === 'admin' ? 'Giáo viên' : `Lớp ${currentUser.grade || 8}`}
                    </span>
                  </div>
                </Link>
                {currentUser.role === 'admin' && (
                  <Link
                    to="/quan-tri"
                    className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-900 border border-indigo-700/80 text-xs font-semibold text-indigo-200 transition"
                  >
                    Quản trị
                  </Link>
                )}
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/dang-nhap"
                className="hidden sm:flex px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-600/30 transition items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
            )}

            {/* Mobile Hamburger toggle (Always prominent on mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 min-w-[44px] min-h-[44px] rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-teal-400" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#0B1F3A] dark:bg-[#071527] px-4 pt-3 pb-6 space-y-4">
          {/* User Account Card on Mobile */}
          {currentUser ? (
            <div className="bg-slate-800/90 rounded-2xl p-3.5 border border-slate-700 flex items-center justify-between">
              <Link
                to="/tien-do"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{currentUser.fullName}</div>
                  <div className="text-xs text-teal-400 font-medium">
                    {currentUser.role === 'admin' ? 'Giáo viên bộ môn' : `Học sinh Lớp ${currentUser.grade || 8}`}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                {currentUser.role === 'admin' && (
                  <Link
                    to="/quan-tri"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2 py-1 rounded-lg bg-indigo-900/60 text-xs font-semibold text-indigo-200"
                  >
                    Quản trị
                  </Link>
                )}
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/dang-nhap"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm text-center flex items-center justify-center gap-2 shadow-md shadow-teal-600/30"
            >
              <User className="w-4 h-4" />
              <span>Đăng nhập tài khoản</span>
            </Link>
          )}

          {/* Khối lớp */}
          <div>
            <div className="font-semibold text-xs text-slate-400 uppercase tracking-wider px-1 mb-2">
              Khối lớp KHTN:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {grades.map((g) => (
                <Link
                  key={g.grade}
                  to={g.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition text-center ${
                    location.pathname === g.path
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-800/80 text-slate-200 hover:text-teal-300'
                  }`}
                >
                  {g.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Học phần */}
          <div>
            <div className="font-semibold text-xs text-slate-400 uppercase tracking-wider px-1 mb-2">
              Học phần & Phòng thực hành:
            </div>
            <div className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/40'
                        : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-teal-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notification and Reminder Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
      />

      {/* Interactive SQL & Deployment Step-by-Step Guide Modal */}
      <DeploymentGuideModal
        isOpen={deploymentGuideOpen}
        onClose={() => setDeploymentGuideOpen(false)}
      />
    </header>
  );
};
