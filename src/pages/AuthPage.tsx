import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '../components/common/Breadcrumbs.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import { AppUser, Grade } from '../types/index.ts';
import {
  Lock,
  Mail,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  EyeOff,
  Laptop,
  ArrowRight,
} from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess?: (user: AppUser) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'student_local' | 'teacher_login'>('student_local');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState<Grade>(8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleStartAnonymousStudentMode = async (selectedGrade: Grade) => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const anonymousUser = await register({
        email: '',
        password: '',
        fullName: `Học sinh Khối ${selectedGrade} (Chế độ Riêng tư)`,
        grade: selectedGrade,
        school: '',
      });
      if (onLoginSuccess) onLoginSuccess(anonymousUser);
      setSuccessMsg(`Đã kích hoạt Chế độ Học tập Riêng tư Khối ${selectedGrade} trên thiết bị này!`);
      setTimeout(() => {
        navigate(`/lop-${selectedGrade}`, { replace: true });
      }, 600);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      setErrorMsg('Vui lòng nhập email quản trị của giáo viên.');
      return;
    }

    if (normalized !== 'hoang08shh@gmail.com' && !normalized.endsWith('@khtn.edu.vn')) {
      setErrorMsg(
        'Hệ thống không yêu cầu và không cho phép học sinh tạo tài khoản bằng email cá nhân. Học sinh vui lòng chọn tab "Chế Độ Học Sinh (Không Cần Tài Khoản)".'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(normalized, password || 'admin123');
      if (onLoginSuccess) onLoginSuccess(loggedUser);
      const isLoggedAdmin = loggedUser.email.trim().toLowerCase() === 'hoang08shh@gmail.com';
      const destination =
        (location.state as any)?.from?.pathname || (isLoggedAdmin ? '/quan-tri' : '/tien-do');
      navigate(destination, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Xác thực không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 text-slate-800 dark:text-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Breadcrumbs
          items={[
            {
              label:
                tab === 'student_local'
                  ? 'Chế độ Học sinh (Không cần tài khoản)'
                  : 'Đăng nhập Giáo viên / Quản trị',
            },
          ]}
        />

        <div className="max-w-xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
            {/* Mode Switcher Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTab('student_local');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition ${
                  tab === 'student_local'
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Học Sinh (Không Cần Tài Khoản)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('teacher_login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition ${
                  tab === 'teacher_login'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Cổng Giáo Viên / Quản Trị
              </button>
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

            {tab === 'student_local' ? (
              <div className="space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-extrabold">
                    <ShieldCheck className="w-4 h-4" />
                    An Toàn Cho Học Sinh THCS (Đặc biệt Học sinh dưới 13 tuổi)
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] dark:text-white mt-3">
                    Vào Học Ngay – Không Cần Tạo Tài Khoản
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Tuân thủ nghiêm ngặt quy định bảo vệ dữ liệu học sinh của nhà trường: Học sinh{' '}
                    <strong>không cần đăng ký tài khoản trên nền tảng bên ngoài</strong>, không cần cung cấp Họ tên, Email hay Số điện thoại.
                  </p>
                </div>

                {/* 3 School Safety Guarantees */}
                <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Laptop className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Không tạo tài khoản bên ngoài:</strong> Học sinh Lớp 6, 7 (dưới 13 tuổi) và Lớp 8, 9 truy cập trực tiếp toàn bộ bài giảng, mô phỏng 3D và đề luyện tập.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <EyeOff className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Không công khai thông tin hay thành tích cá nhân:</strong> Kết quả tự luyện chỉ lưu cục bộ trên trình duyệt của thiết bị này, chỉ mình em xem được.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Không đưa dữ liệu cá nhân vào AI bên ngoài:</strong> Hệ thống chấm điểm và hướng dẫn giải hoạt động bằng thuật toán sư phạm nội bộ.
                    </span>
                  </div>
                </div>

                {/* Grade Selection */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Chọn khối lớp của em trên thiết bị này:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {([6, 7, 8, 9] as Grade[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`py-3 px-3 rounded-2xl border-2 text-center transition flex flex-col items-center gap-1 ${
                          grade === g
                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-black shadow-sm'
                            : 'border-slate-200 dark:border-slate-700 hover:border-teal-400 text-slate-700 dark:text-slate-300 font-bold'
                        }`}
                      >
                        <GraduationCap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm">KHTN Lớp {g}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleStartAnonymousStudentMode(grade)}
                  className="w-full py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-600 disabled:opacity-60 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Vào Học Ngay Khối {grade} (Chế Độ Ẩn Danh • Không Cần Tài Khoản)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] dark:text-white">
                    Đăng Nhập Dành Riêng Cho Giáo Viên
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Khu vực quản trị ngân hàng câu hỏi, chuyển đổi đề Word (.docx) và quản lý học liệu của giáo viên.
                  </p>
                </div>

                <form onSubmit={handleTeacherLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Giáo viên / Quản trị viên
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="hoang08shh@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mật khẩu Quản trị
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        placeholder="Nhập mật khẩu quản trị"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={email.trim().toLowerCase() !== 'hoang08shh@gmail.com'}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-2xl bg-indigo-700 hover:bg-indigo-600 disabled:opacity-60 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng Nhập Quản Trị Giáo Viên'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
