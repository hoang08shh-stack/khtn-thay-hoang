import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { DEMO_USERS } from '../lib/supabase.ts';
import { useAuth } from '../hooks/useAuth.ts';
import { AppUser, Grade } from '../types/index.ts';
import {
  Lock,
  Mail,
  User,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Database,
  Cloud,
  Sparkles,
  School,
  AlertCircle,
} from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess?: (user: AppUser) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState<Grade>(8);
  const [school, setSchool] = useState('THCS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, register, isSupabaseActive } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 'login') {
        const loggedUser = await login(email, password);
        if (onLoginSuccess) onLoginSuccess(loggedUser);
        const destination = (location.state as any)?.from?.pathname || (loggedUser.role === 'admin' ? '/quan-tri' : '/tien-do');
        navigate(destination, { replace: true });
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Vui lòng nhập họ và tên của em.');
          setIsSubmitting(false);
          return;
        }

        const newUser = await register({
          email,
          password,
          fullName: fullName.trim(),
          grade,
          school: school.trim() || 'THCS',
        });

        if (onLoginSuccess) onLoginSuccess(newUser);
        setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng...');
        setTimeout(() => {
          navigate('/tien-do', { replace: true });
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Xác thực không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickDemoLogin = async (type: 'student' | 'teacher') => {
    const demoUser = DEMO_USERS[type];
    try {
      const user = await login(demoUser.email, 'password123');
      if (onLoginSuccess) onLoginSuccess(user);
      navigate(user.role === 'admin' ? '/quan-tri' : '/tien-do');
    } catch {
      if (onLoginSuccess) onLoginSuccess(demoUser);
      navigate(demoUser.role === 'admin' ? '/quan-tri' : '/tien-do');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-800 dark:text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: tab === 'login' ? 'Đăng nhập tài khoản' : 'Đăng ký học sinh' }]} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main Auth Form (Col 7) */}
          <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${
                  tab === 'login'
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                onClick={() => {
                  setTab('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${
                  tab === 'register'
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Đăng Ký Học Sinh
              </button>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] dark:text-white">
                {tab === 'login' ? 'Chào Mừng Trở Lại' : 'Tạo Tài Khoản Học Tập KHTN'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lưu lại tiến độ thực hành phòng thí nghiệm 3D và kết quả bài kiểm tra KHTN.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {tab === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Họ và tên học sinh
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ví dụ: Nguyễn Văn Minh"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Khối lớp
                      </label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(parseInt(e.target.value) as Grade)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                      >
                        <option value={6}>Lớp 6</option>
                        <option value={7}>Lớp 7</option>
                        <option value={8}>Lớp 8</option>
                        <option value={9}>Lớp 9</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Trường học
                      </label>
                      <div className="relative">
                        <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Ví dụ: THCS Giảng Võ"
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Policy Badge */}
                  <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 text-[11px] text-teal-800 dark:text-teal-300 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
                    <span>
                      Tài khoản đăng ký mới luôn mặc định quyền <strong>Học sinh (student)</strong> theo chính sách bảo mật RLS PostgreSQL.
                    </span>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="hocsinh@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-teal-600/30 transition flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'Đang xác thực...' : tab === 'login' ? 'Đăng Nhập Ngay' : 'Hoàn Tất Đăng Ký'}</span>
              </button>
            </form>

            {/* Quick Demo Login Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-center">
                Hoặc trải nghiệm nhanh tài khoản mẫu:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickDemoLogin('student')}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-left transition flex items-center gap-2.5 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs shrink-0">
                    HS
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                      Học sinh Lớp 8
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Xem tiến độ & bài thi</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => quickDemoLogin('teacher')}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-left transition flex items-center gap-2.5 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                    GV
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                      Thầy Hoàng (Admin)
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Quản trị nội dung</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Infrastructure & Architecture Info (Col 5) */}
          <div className="md:col-span-5 bg-gradient-to-b from-[#071527] to-[#0B1F3A] text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Bảo Mật & Cơ Sở Dữ Liệu
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">
                Supabase Auth & PostgreSQL RLS
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hệ thống áp dụng <strong>Row Level Security (RLS)</strong> chuẩn mực: phân tách bảng quyền
                <code>user_roles</code> khỏi thông tin hồ sơ để ngăn chặn hoàn toàn việc người dùng tự nâng quyền.
              </p>
            </div>

            {/* Supabase status check */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-teal-400" />
                  <span>Kết nối Supabase:</span>
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                    isSupabaseActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {isSupabaseActive ? 'Live Supabase Cloud' : 'Chế độ Demo / Local'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>Bảo vệ đáp án trắc nghiệm:</span>
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">RLS Blocked (RPC Only)</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Không đưa service_role key lên frontend</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Trigger tự động cấp quyền student cho tài khoản mới</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Học sinh chỉ xem và cập nhật tiến độ của mình</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
