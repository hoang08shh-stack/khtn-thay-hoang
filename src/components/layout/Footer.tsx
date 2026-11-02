import React from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  Mail,
  MapPin,
  Youtube,
  Phone,
  ShieldCheck,
  Award,
  BookOpen,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#071527] border-t border-slate-800 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight">
                  KHTN THẦY HOÀNG
                </span>
                <p className="text-xs text-teal-400 font-medium">
                  Phòng thí nghiệm khoa học số GDPT 2018
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Nền tảng học tập Khoa học Tự nhiên tiên phong tại Việt Nam tích hợp công nghệ
              mô phỏng 3D tương tác trực tiếp theo chuẩn Chương trình Giáo dục Phổ thông 2018
              cho học sinh THCS khối 6, 7, 8, 9.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Chuẩn GDPT 2018
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Mô phỏng 3D chân thực
              </span>
            </div>
          </div>

          {/* Khối lớp */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Khối lớp THCS</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/lop-6" className="hover:text-teal-400 transition">
                  KHTN Lớp 6 (Chân trời / Kết nối / Cánh diều)
                </Link>
              </li>
              <li>
                <Link to="/lop-7" className="hover:text-teal-400 transition">
                  KHTN Lớp 7 (Nguyên tử & Tốc độ)
                </Link>
              </li>
              <li>
                <Link to="/lop-8" className="hover:text-teal-400 transition">
                  KHTN Lớp 8 (Axit-Bazơ & Điện học)
                </Link>
              </li>
              <li>
                <Link to="/lop-9" className="hover:text-teal-400 transition">
                  KHTN Lớp 9 (Quang học & Di truyền)
                </Link>
              </li>
            </ul>
          </div>

          {/* Học phần */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Học phần</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/phong-thi-nghiem-3d" className="hover:text-teal-400 transition text-teal-300 font-semibold">
                  Phòng thí nghiệm 3D
                </Link>
              </li>
              <li>
                <Link to="/chu-de" className="hover:text-teal-400 transition">
                  Danh mục chủ đề
                </Link>
              </li>
              <li>
                <Link to="/video" className="hover:text-teal-400 transition">
                  Video thí nghiệm thực hành
                </Link>
              </li>
              <li>
                <Link to="/tai-lieu" className="hover:text-teal-400 transition">
                  Thư viện Slide & Phiếu học tập
                </Link>
              </li>
              <li>
                <Link to="/luyen-tap" className="hover:text-teal-400 transition">
                  Trắc nghiệm tự luyện & Đố vui
                </Link>
              </li>
            </ul>
          </div>

          {/* Liên hệ Thầy Hoàng */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Thầy Hoàng KHTN</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Hà Nội, Việt Nam</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <a href="mailto:thayhoang.khtn@gmail.com" className="hover:text-teal-400 transition">
                  thayhoang.khtn@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-400 shrink-0" />
                <span>Kênh KHTN Thầy Hoàng</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Zalo hỗ trợ học sinh: 098x.xxx.xxx</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom border & copyright */}
        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 KHTN Thầy Hoàng. Bản quyền nội dung giáo dục số thuộc về Thầy Hoàng.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Sẵn sàng triển khai Cloudflare Pages + Supabase</span>
            <Link to="/dang-nhap" className="hover:text-white transition">
              Cổng Giáo viên / Quản trị
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
