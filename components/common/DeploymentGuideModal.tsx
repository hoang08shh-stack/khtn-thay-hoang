import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Database,
  Cloud,
  ShieldCheck,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_GRANT_SQL = `-- Cấp quyền Quản trị viên (Admin) cho tài khoản Thầy Hoàng
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'hoang08shh@gmail.com'
);`;

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [fullSql, setFullSql] = useState<string>('Đang tải mã SQL...');
  const [copiedFullSql, setCopiedFullSql] = useState(false);
  const [copiedAdminSql, setCopiedAdminSql] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    if (isOpen && fullSql === 'Đang tải mã SQL...') {
      fetch('/khtn_supabase_all_in_one.sql')
        .then((res) => res.text())
        .then((text) => setFullSql(text))
        .catch(() =>
          setFullSql('-- Không thể tải tự động, vui lòng mở file public/khtn_supabase_all_in_one.sql')
        );
    }
  }, [isOpen, fullSql]);

  if (!isOpen) return null;

  const handleCopyFullSql = async () => {
    try {
      await navigator.clipboard.writeText(fullSql);
      setCopiedFullSql(true);
      setTimeout(() => setCopiedFullSql(false), 3500);
    } catch {
      // Fallback selection copy
      const textarea = document.getElementById('full-sql-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
        setCopiedFullSql(true);
        setTimeout(() => setCopiedFullSql(false), 3500);
      }
    }
  };

  const handleCopyAdminSql = async () => {
    try {
      await navigator.clipboard.writeText(ADMIN_GRANT_SQL);
      setCopiedAdminSql(true);
      setTimeout(() => setCopiedAdminSql(false), 3500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#13315C] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Hướng Dẫn Cài Đặt Supabase & Lấy Mã SQL (Từng Bước)
              </h2>
              <p className="text-xs text-teal-300">
                Đã gộp toàn bộ 7 file SQL thành 1 bản duy nhất — Chỉ cần Copy & Bấm Run 1 lần!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            aria-label="Đóng hướng dẫn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveStep(1)}
            className={`p-2.5 rounded-xl text-left transition border ${
              activeStep === 1
                ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="text-[10px] font-bold uppercase opacity-80">Bước 1 (Đang làm)</div>
            <div className="text-xs font-extrabold truncate">1. Copy & Chạy SQL</div>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`p-2.5 rounded-xl text-left transition border ${
              activeStep === 2
                ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="text-[10px] font-bold uppercase opacity-80">Bước 2</div>
            <div className="text-xs font-extrabold truncate">2. Lấy URL & Anon Key</div>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`p-2.5 rounded-xl text-left transition border ${
              activeStep === 3
                ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="text-[10px] font-bold uppercase opacity-80">Bước 3</div>
            <div className="text-xs font-extrabold truncate">3. Đưa lên Cloudflare</div>
          </button>

          <button
            onClick={() => setActiveStep(4)}
            className={`p-2.5 rounded-xl text-left transition border ${
              activeStep === 4
                ? 'bg-teal-600 text-white border-teal-500 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="text-[10px] font-bold uppercase opacity-80">Bước 4</div>
            <div className="text-xs font-extrabold truncate">4. Cấp quyền Admin</div>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 dark:text-slate-200">
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>Giải đáp: &quot;File SQL ở đâu?&quot; — Mã SQL nằm ngay dưới đây!</span>
                </h3>
                <ol className="list-decimal list-inside text-xs sm:text-sm space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                  <li>
                    Bấm vào nút màu xanh lá <strong>&quot;SAO CHÉP TOÀN BỘ MÃ SQL&quot;</strong> ngay bên dưới.
                  </li>
                  <li>
                    Quay lại màn hình <strong>Supabase SQL Editor</strong> mà Thầy đang mở (chỗ có dòng chữ <em>&quot;Hit CTRL+SHIFT+K to generate query or just start typing&quot;</em>).
                  </li>
                  <li>
                    Nhấp chuột vào dòng số <code>1</code> trong ô soạn thảo trắng của Supabase, nhấn tổ hợp phím <strong>Ctrl + V</strong> (dán toàn bộ mã vừa copy vào).
                  </li>
                  <li>
                    Bấm nút màu xanh lá <strong>Run</strong> (góc trên bên phải của Supabase). Đợi 3 giây hiện thông báo <code>Success. No rows returned</code> là hoàn tất!
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleCopyFullSql}
                  className={`px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition transform active:scale-95 ${
                    copiedFullSql
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-600/30'
                  }`}
                >
                  {copiedFullSql ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>ĐÃ SAO CHÉP TOÀN BỘ SQL! HÃY QUA SUPABASE NHẤN CTRL + V</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>📋 BẤM VÀO ĐÂY ĐỂ SAO CHÉP TOÀN BỘ MÃ SQL (7 FILE GỘP 1)</span>
                    </>
                  )}
                </button>

                <a
                  href="/khtn_supabase_all_in_one.sql"
                  download="khtn_supabase_all_in_one.sql"
                  className="px-4 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file .sql về máy</span>
                </a>
              </div>

              {/* Full SQL Textarea so user can also see or Ctrl+A Ctrl+C */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Nội dung mã SQL đầy đủ (1,908 dòng - Tạo 16 bảng, dữ liệu mẫu GDPT 2018, Storage & Huy hiệu):</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400">khtn_supabase_all_in_one.sql</span>
                </div>
                <textarea
                  id="full-sql-textarea"
                  readOnly
                  value={fullSql}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full h-56 p-4 rounded-2xl bg-slate-950 text-teal-300 font-mono text-xs border border-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-blue-900 dark:text-blue-300">
                  Bước 2: Lấy 2 thông số kết nối từ Supabase của Thầy
                </h3>
                <ol className="list-decimal list-inside text-xs sm:text-sm space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                  <li>
                    Trên màn hình Supabase (thanh công cụ dọc bên trái cùng), kéo xuống dưới cùng bấm vào biểu tượng <strong>Bánh răng (Project Settings)</strong> ⚙️.
                  </li>
                  <li>
                    Trong menu Project Settings hiện ra, bấm vào chữ <strong>Data API</strong> (hoặc <strong>API</strong>).
                  </li>
                  <li>
                    Thầy sẽ thấy 2 mục cần copy lưu lại ra Notepad:
                    <ul className="list-disc list-inside pl-5 mt-1 space-y-1 font-medium">
                      <li>
                        <strong>Project URL</strong>: Ví dụ <code>https://ecflruxzrverdjchaidl.supabase.co</code> (chính là mã project trên ảnh của Thầy!).
                      </li>
                      <li>
                        <strong>Project API keys ➔ anon / public</strong>: Nhấn nút <code>Copy</code> ở dòng <code>anon public</code> (dạng chuỗi dài bắt đầu bằng <code>eyJhbGci...</code>).
                      </li>
                    </ul>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-amber-900 dark:text-amber-300">
                  Bước 3: Đưa mã nguồn lên GitHub & Cloudflare Pages (Miễn phí)
                </h3>
                <ol className="list-decimal list-inside text-xs sm:text-sm space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                  <li>
                    <strong>Đưa code lên GitHub:</strong> Tại giao diện AI Studio này, Thầy có thể nhấn biểu tượng tải code (Export ZIP / GitHub) ở góc trên màn hình để đưa code lên tài khoản GitHub cá nhân.
                  </li>
                  <li>
                    <strong>Mở Cloudflare Pages:</strong> Vào <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-teal-600 underline font-bold">dash.cloudflare.com</a> ➔ Chọn <strong>Workers & Pages</strong> ➔ <strong>Create application</strong> ➔ Tab <strong>Pages</strong> ➔ <strong>Connect to Git</strong>.
                  </li>
                  <li>
                    Chọn kho chứa (Repository) vừa tạo, sau đó điền:
                    <ul className="list-disc list-inside pl-5 mt-1 space-y-1 font-mono text-xs">
                      <li>Build command: <strong>npm run build</strong></li>
                      <li>Build output directory: <strong>dist</strong></li>
                    </ul>
                  </li>
                  <li>
                    Bấm <strong>Add variable (Environment variables)</strong> và dán 2 khóa ở Bước 2 vào:
                    <ul className="list-disc list-inside pl-5 mt-1 space-y-1 font-mono text-xs">
                      <li><strong>VITE_SUPABASE_URL</strong> = <code>https://ecflruxzrverdjchaidl.supabase.co</code></li>
                      <li><strong>VITE_SUPABASE_ANON_KEY</strong> = <code>(Mã anon public của Thầy)</code></li>
                    </ul>
                  </li>
                  <li>
                    Nhấn <strong>Save and Deploy</strong>. Đợi 1 phút là có ngay trang web chính thức!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                <h3 className="text-sm sm:text-base font-extrabold text-purple-900 dark:text-purple-300">
                  Bước 4: Cấp quyền Admin (Giáo viên) cho email hoang08shh@gmail.com
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Sau khi Thầy đăng ký tài khoản bằng email <code>hoang08shh@gmail.com</code> trên trang web của mình, hãy copy đoạn lệnh ngắn dưới đây dán vào <strong>Supabase SQL Editor</strong> và bấm <strong>Run</strong> để lên quyền Quản trị viên cao nhất:
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyAdminSql}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
                  >
                    {copiedAdminSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>
                      {copiedAdminSql
                        ? 'Đã sao chép lệnh cấp quyền Admin!'
                        : 'Sao chép lệnh cấp quyền Admin cho hoang08shh@gmail.com'}
                    </span>
                  </button>
                </div>

                <pre className="p-4 rounded-xl bg-slate-950 text-purple-300 font-mono text-xs overflow-x-auto border border-slate-800">
                  {ADMIN_GRANT_SQL}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Project ID trên ảnh của Thầy: <code className="font-mono font-bold text-teal-600 dark:text-teal-400">ecflruxzrverdjchaidl</code>
          </div>
          <div className="flex items-center gap-2">
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
              >
                ← Bước trước
              </button>
            )}
            {activeStep < 4 ? (
              <button
                onClick={() => setActiveStep((prev) => (prev + 1) as 1 | 2 | 3 | 4)}
                className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
              >
                Bước tiếp theo →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Hoàn tất
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
