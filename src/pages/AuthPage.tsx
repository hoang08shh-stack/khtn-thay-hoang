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
    const isAdminEmail = email.trim().toLowerCase() === 'hoang08shh@gmail.com';
    if (!isAdminEmail && (!password || password.length < 6)) {
      setErrorMsg('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (tab === 'login') {
        const loggedUser = await login(email.trim(), password || 'admin123');
        if (onLoginSuccess) onLoginSuccess(loggedUser);
        const isLoggedAdmin = loggedUser.email.trim().toLowerCase() === 'hoang08shh@gmail.com';
        const destination =
          (location.state as any)?.from?.pathname || (isLoggedAdmin ? '/quan-tri' : '/tien-do');
        navigate(destination, { replace: true });
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Vui lòng nhập họ và tên của em.');
          setIsSubmitting(false);
          return;
        }

        const newUser = await register({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          grade,
          school: school.trim() || 'THCS Đà Nẵng, Việt Nam',
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
      navigate(user.email.trim().toLowerCase() === 'hoang08shh@gmail.com' ? '/quan-tri' : '/tien-do');
    } catch {
      if (onLoginSuccess) onLoginSuccess(demoUser);
      navigate(demoUser.email.trim().toLowerCase() === 'hoang08shh@gmail.com' ? '/quan-tri' : '/tien-do');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-800 dark:text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: tab === 'login' ? 'Đăng nhập tài khoản' : 'Đăng ký học sinh' }]} />

        <div className="max-w-lg mx-auto">
          {/* Main Auth Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
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
                          placeholder="Ví dụ: THCS Đà Nẵng"
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
                      Tài khoản đăng ký mới luôn mặc định quyền <strong>Học sinh (student)</strong> và không hiển thị nút Quản trị.
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
                    placeholder="hoang08shh@gmail.com hoặc hocsinh@gmail.com"
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
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={email.trim().toLowerCase() !== 'hoang08shh@gmail.com'}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-teal-700 hover:bg-teal-600 disabled:opacity-60 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'Đang xác thực...' : tab === 'login' ? 'Đăng Nhập Ngay' : 'Hoàn Tất Đăng Ký'}</span>
              </button>
            </form>

            {tab === 'login' && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Chọn nhanh tài khoản đăng nhập:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('teacher')}
                    className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100/80 text-left transition space-y-0.5"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-800 dark:text-indigo-300">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Quản trị viên (Admin)</span>
                    </div>
                    <div className="text-[11px] font-mono text-indigo-700/80 dark:text-indigo-400 truncate">
                      hoang08shh@gmail.com
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoLogin('student')}
                    className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/70 text-left transition space-y-0.5"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      <GraduationCap className="w-4 h-4 text-teal-600" />
                      <span>Tài khoản Học sinh</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      hocsinh.khtn@gmail.com
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
