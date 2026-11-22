import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RefreshCw,
  Cloud,
  ClipboardPaste,
  Copy,
  FileUp,
  Download,
  CheckCircle2,
  AlertCircle,
  Database,
  Laptop,
} from 'lucide-react';
import {
  buildCmsSnapshotPayload,
  checkRemoteSyncAvailability,
  fetchAndApplyRemoteCmsSnapshot,
  importCmsSnapshotFromJson,
  syncCmsSnapshotWithReport,
} from '../../services/adminService.ts';
import { useAuth } from '../../hooks/useAuth.ts';

interface CmsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncedSuccess: (message: string) => void;
  onExportJsonFile: () => void;
}

export const CmsSyncModal: React.FC<CmsSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncedSuccess,
  onExportJsonFile,
}) => {
  const { isFirebaseAdmin, loginWithGoogle } = useAuth();
  const [pastedJson, setPastedJson] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncAvailability, setSyncAvailability] = useState<{
    firebaseAvailable: boolean;
    firebaseAuthenticated: boolean;
    firebaseEmail?: string;
    firebaseUpdatedAt?: string;
    serverApiAvailable: boolean;
    supabaseAvailable: boolean;
    supabaseAuthenticated: boolean;
    remoteUpdatedAt?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStatusMessage(null);
    checkRemoteSyncAvailability()
      .then(setSyncAvailability)
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnectGoogleInModal = async () => {
    setIsSyncingCloud(true);
    setStatusMessage(null);
    try {
      await loginWithGoogle();
      const report = await syncCmsSnapshotWithReport(false);
      checkRemoteSyncAvailability().then(setSyncAvailability).catch(() => {});
      if (report.target === 'firebase' && report.ok) {
        setStatusMessage({
          type: 'success',
          text: 'Đã đăng nhập Google Firebase và đẩy toàn bộ bài giảng lên Firestore Cloud! Điện thoại mở bất kỳ link nào cũng sẽ tự động thấy bài giảng mới.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Đã kết nối Google Firebase thành công! Hãy bấm "Đẩy dữ liệu máy này lên Cloud" để đồng bộ ngay.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text:
          err?.message ||
          'Chưa đăng nhập được Google Firebase. Hãy cho phép cửa sổ popup và chọn tài khoản hoang08shh@gmail.com.',
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handlePullFromRemote = async () => {
    setIsSyncingCloud(true);
    setStatusMessage(null);
    try {
      const ok = await fetchAndApplyRemoteCmsSnapshot(true);
      if (ok) {
        onSyncedSuccess('Đã tải và áp dụng bản cập nhật bài giảng mới nhất từ Firebase Cloud / Máy chủ!');
        onClose();
      } else {
        setStatusMessage({
          type: 'info',
          text: syncAvailability?.firebaseAvailable
            ? 'Chưa có dữ liệu mới hơn trên Firebase Firestore. Hãy bấm "Đăng nhập Google Firebase" rồi bấm "Đẩy dữ liệu máy này lên Cloud" trên máy tính đã soạn bài.'
            : 'Chưa có bản cập nhật mới từ máy chủ đồng bộ.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Không thể kết nối tới Firebase / Máy chủ đồng bộ. Vui lòng thử lại hoặc dùng Dán mã JSON.',
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handlePushToRemote = async () => {
    setIsSyncingCloud(true);
    setStatusMessage(null);
    try {
      const report = await syncCmsSnapshotWithReport(true);
      if (report.ok) {
        setStatusMessage({
          type: 'success',
          text:
            report.target === 'firebase'
              ? 'Đã đẩy toàn bộ bài giảng và tài liệu lên Firebase Firestore Cloud! Mọi điện thoại và máy tính mở bất kỳ đường link nào đều sẽ tự động cập nhật ngay lập tức.'
              : report.target === 'supabase'
              ? 'Đã đẩy toàn bộ bài giảng và học liệu lên Supabase Cloud! Mọi thiết bị khác mở website sẽ tự động cập nhật ngay lập tức.'
              : 'Đã lưu vào máy chủ cục bộ hiện tại. Để đồng bộ xuyên suốt giữa mọi đường link (ais-dev & ais-pre) và lưu vĩnh viễn trên Firebase, hãy bấm nút "Đăng nhập Google (Firebase)" ở trên rồi đẩy lại.',
        });
        checkRemoteSyncAvailability().then(setSyncAvailability).catch(() => {});
      } else if (report.reason === 'firebase_auth_required') {
        setStatusMessage({
          type: 'error',
          text: 'Firebase đã bật nhưng trình duyệt chưa đăng nhập tài khoản Google Quản trị (hoang08shh@gmail.com). Hãy bấm nút "Đăng nhập Google (Firebase)" ngay bên dưới.',
        });
      } else if (report.reason === 'firebase_error') {
        setStatusMessage({
          type: 'error',
          text: `Lỗi ghi dữ liệu lên Firebase Firestore: ${report.errorDetail || 'Vui lòng thử lại.'}`,
        });
      } else if (report.reason === 'supabase_auth_required') {
        setStatusMessage({
          type: 'error',
          text: 'Supabase đã kết nối nhưng chưa đăng nhập phiên giáo viên.',
        });
      } else {
        setStatusMessage({
          type: 'info',
          text: 'Chưa kết nối được máy chủ đồng bộ. Vui lòng đăng nhập Google Firebase hoặc dùng Cách 2 (Sao chép & Dán mã JSON).',
        });
      }
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleCopyJsonToClipboard = async () => {
    try {
      const payload = buildCmsSnapshotPayload();
      const text = JSON.stringify(payload);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setStatusMessage({
          type: 'success',
          text: 'Đã sao chép toàn bộ dữ liệu bài giảng vào bộ nhớ tạm! Bạn có thể gửi qua Zalo/Email hoặc mở trang Quản trị ở máy khác và dán vào ô bên dưới.',
        });
      } else {
        setPastedJson(text);
        setStatusMessage({
          type: 'info',
          text: 'Đã hiển thị mã JSON vào ô bên dưới, hãy chọn tất cả (Ctrl+A) và sao chép (Ctrl+C).',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Không thể sao chép tự động, vui lòng dùng nút "Xuất cmsSnapshot.json".',
      });
    }
  };

  const handleApplyPastedJson = () => {
    const clean = pastedJson.trim();
    if (!clean) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng dán nội dung JSON vào ô trước khi bấm Áp dụng.',
      });
      return;
    }
    const res = importCmsSnapshotFromJson(clean);
    if (res.ok) {
      setPastedJson('');
      onSyncedSuccess(res.message);
      onClose();
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message,
      });
    }
  };

  const handleSelectFileFromComputer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importCmsSnapshotFromJson(String(reader.result || ''));
      if (result.ok) {
        onSyncedSuccess(result.message);
        onClose();
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message,
        });
      }
      e.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cms-sync-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#0F3443] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 id="cms-sync-modal-title" className="text-base sm:text-lg font-extrabold text-white">
                Đồng Bộ Bài Giảng Đa Thiết Bị &amp; Nhập JSON
              </h2>
              <p className="text-xs text-slate-300">
                Chọn cách đồng bộ dữ liệu giữa các máy tính mà không làm mất bài giảng đã tải lên.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ đồng bộ"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-medium flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  : 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Option 1: Automatic Cloud/Server Sync */}
          <div className="p-4 rounded-2xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/60 dark:bg-teal-950/30 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Cloud className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Cách 1: Đồng bộ tự động trực tuyến qua Firebase Cloud
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        isFirebaseAdmin || syncAvailability?.firebaseAuthenticated
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                          : syncAvailability?.firebaseAvailable
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                          : syncAvailability?.serverApiAvailable
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                          : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                      }`}
                    >
                      {isFirebaseAdmin || syncAvailability?.firebaseAuthenticated
                        ? 'Firebase Cloud: Đã kết nối & Đã đăng nhập Google'
                        : syncAvailability?.firebaseAvailable
                        ? 'Firebase Cloud: Sẵn sàng (Cần đăng nhập Google)'
                        : syncAvailability?.serverApiAvailable
                        ? 'Máy chủ trực tiếp: Đang đồng bộ tự động'
                        : 'Chế độ cục bộ'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isFirebaseAdmin || syncAvailability?.firebaseAuthenticated
                      ? 'Mọi bài giảng, trình đọc Word và học liệu tải lên sẽ tự động lưu vào Firebase Firestore và cập nhật tức thì sang mọi điện thoại (dù mở link xem trước hay link chia sẻ).'
                      : syncAvailability?.firebaseAvailable
                      ? 'Firebase Firestore đã được khởi tạo. Thầy chỉ cần bấm "Đăng nhập Google (hoang08shh@gmail.com)" 1 lần để kích hoạt đồng bộ đám mây vĩnh viễn cho mọi điện thoại.'
                      : 'Máy chủ đang tự động lưu bài giảng & tệp tải lên cho các thiết bị mở cùng đường link.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {syncAvailability?.firebaseAvailable && !(isFirebaseAdmin || syncAvailability?.firebaseAuthenticated) && (
                <button
                  type="button"
                  onClick={handleConnectGoogleInModal}
                  disabled={isSyncingCloud}
                  data-testid="modal-connect-google-firebase-btn"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Đăng nhập Google (Firebase)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePullFromRemote}
                disabled={isSyncingCloud}
                data-testid="modal-pull-remote-sync-btn"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>Tải dữ liệu mới nhất về máy này</span>
              </button>

              <button
                type="button"
                onClick={handlePushToRemote}
                disabled={isSyncingCloud}
                data-testid="modal-push-remote-sync-btn"
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5 text-sky-600" />
                <span>Đẩy dữ liệu máy này lên Cloud</span>
              </button>
            </div>
          </div>

          {/* Option 2: Paste / Copy JSON Text */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Cách 2: Dán trực tiếp mã JSON (Không cần tìm tệp trên Desktop)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Trên Máy 1 bấm &ldquo;Sao chép mã JSON&rdquo;, gửi qua Zalo rồi dán vào ô bên dưới trên Máy 2.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyJsonToClipboard}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép mã JSON máy này</span>
              </button>
            </div>

            <textarea
              value={pastedJson}
              onChange={(e) => setPastedJson(e.target.value)}
              rows={4}
              placeholder='Dán nội dung chuỗi JSON bắt đầu bằng {"updatedAt":...} vào đây...'
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleApplyPastedJson}
                data-testid="modal-apply-pasted-json-btn"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Áp dụng dữ liệu đã dán</span>
              </button>
            </div>
          </div>

          {/* Option 3: File Picker from Computer (Explicit click) */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Cách 3: Nạp từ tệp <code className="text-teal-600 dark:text-teal-400">cmsSnapshot.json</code> trên máy tính
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dùng khi bạn đã lưu tệp sao lưu <code className="font-mono">.json</code> vào Desktop hoặc thư mục Tải xuống (Downloads) từ máy tính trước đó.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                data-testid="modal-choose-json-file-btn"
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chọn tệp .json từ máy tính...</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleSelectFileFromComputer}
                className="hidden"
              />

              <button
                type="button"
                onClick={onExportJsonFile}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-600" />
                <span>Xuất tệp cmsSnapshot.json mới</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
