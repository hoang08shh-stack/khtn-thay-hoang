import React from 'react';
import { Link } from 'react-router-dom';
import { Atom, Mail, MapPin, Phone, Sparkles, BookOpen, FlaskConical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Footer: React.FC = () => {
  const { user } = useAuth();
  const isAdminAccount = Boolean(
    user?.email && user.email.trim().toLowerCase() === 'hoang08shh@gmail.com'
  );

  return (
    <footer className="bg-gradient-to-b from-sky-50/80 via-white to-emerald-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-t border-sky-200/70 dark:border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Atom className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  KHOA HỌC TỰ NHIÊN
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  KHOA HỌC SỐ KHTN
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Nền tảng học tập trực quan, mô phỏng tương tác 3D và trò chơi giáo dục môn Khoa học tự nhiên (Lớp 6, 7, 8, 9) theo bộ sách <strong>Kết nối tri thức với cuộc sống</strong>.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <BookOpen className="w-3.5 h-3.5" />
                Kết nối tri thức với cuộc sống
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                <Sparkles className="w-3.5 h-3.5" />
                Chuẩn danh pháp IUPAC
              </span>
            </div>
          </div>

          {/* Grade Links */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Chương trình 4 khối lớp
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/lop-6" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  • KHTN Lớp 6 (Chất, Tế bào, Lực & Năng lượng)
                </Link>
              </li>
              <li>
                <Link to="/lop-7" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  • KHTN Lớp 7 (Nguyên tử, Tốc độ, Quang hợp)
                </Link>
              </li>
              <li>
                <Link to="/lop-8" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  • KHTN Lớp 8 (Acid - Base - Oxide, Điện, Cơ thể người)
                </Link>
              </li>
              <li>
                <Link to="/lop-9" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  • KHTN Lớp 9 (Quang học, Hợp chất hữu cơ, Di truyền DNA)
                </Link>
              </li>
              <li>
                <Link to="/tro-choi" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold text-sky-600 dark:text-sky-400">
                  • Trò chơi học tập KHTN
                </Link>
              </li>
            </ul>
          </div>

          {/* 3 Domains & Interactive Lab */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-emerald-500" />
              KHOA HỌC SỐ KHTN
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/mo-phong/sim-atom-bohr" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  • Mô hình Nguyên tử Rutherford - Bohr 3D
                </Link>
              </li>
              <li>
                <Link to="/mo-phong/sim-acid-base-ph" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  • Thí nghiệm Chuẩn độ Acid - Base & Thang pH
                </Link>
              </li>
              <li>
                <Link to="/mo-phong/sim-electric-circuit" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  • Mạch điện một chiều & Định luật Ohm
                </Link>
              </li>
              <li>
                <Link to="/mo-phong/sim-light-refraction" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  • Khúc xạ ánh sáng & Phản xạ toàn phần
                </Link>
              </li>
              <li>
                <Link to="/mo-phong/sim-dna-double-helix" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  • Cấu trúc không gian phân tử DNA & Phiên mã RNA
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Thông tin liên hệ
            </h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Đà Nẵng, Việt Nam</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                <a href="mailto:hoang08shh@gmail.com" className="hover:text-sky-600 font-medium transition-colors">
                  hoang08shh@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
                <a href="https://zalo.me/0793565756" target="_blank" rel="noreferrer" className="hover:text-indigo-600 font-medium transition-colors">
                  Zalo: 0793565756
                </a>
              </li>
            </ul>
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-slate-800 dark:to-slate-800/70 border border-emerald-200/70 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-emerald-700 dark:text-emerald-400">3 Phân môn cốt lõi:</strong> Vật lí • Hóa học • Sinh học
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} KHOA HỌC TỰ NHIÊN — KHOA HỌC SỐ KHTN (Đà Nẵng, Việt Nam).</p>
          <div className="flex flex-wrap items-center gap-4 font-semibold">
            <Link to="/chu-de" className="hover:text-emerald-600">Chủ đề</Link>
            <Link to="/phong-thi-nghiem-3d" className="hover:text-emerald-600">KHOA HỌC SỐ KHTN</Link>
            <Link to="/tro-choi" className="hover:text-emerald-600">Trò chơi</Link>
            <Link to="/luyen-tap" className="hover:text-emerald-600">Luyện tập</Link>
            {isAdminAccount && (
              <Link to="/quan-tri" className="text-indigo-700 dark:text-indigo-400 hover:text-indigo-500 font-bold">
                Quản trị hệ thống
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
