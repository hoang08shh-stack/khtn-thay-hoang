import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  Upload,
  AlertCircle,
  FolderCheck,
} from 'lucide-react';
import {
  GeneratedDocumentData,
  triggerEducationalDocumentDownload,
} from '../../utils/documentGenerator.ts';
import { resolvePlayableOrDownloadableUrl } from '../../services/localFileStore.ts';
import { uploadLessonDocument } from '../../services/storageService.ts';
import {
  saveUploadedAssetToRepository,
  saveAdminCatalogDoc,
} from '../../services/adminService.ts';
import { Grade } from '../../types/index.ts';

interface DocumentViewerModalProps {
  docData: GeneratedDocumentData | null;
  onClose: () => void;
  onUploadedSuccess?: (updatedDoc: GeneratedDocumentData) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  docData,
  onClose,
  onUploadedSuccess,
}) => {
  const [currentDoc, setCurrentDoc] = useState<GeneratedDocumentData | null>(docData);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolvedFileName, setResolvedFileName] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setCurrentDoc(docData);
    setDownloaded(false);
    setDownloadError(null);
    setUploadSuccessMsg(null);
  }, [docData]);

  useEffect(() => {
    let active = true;
    if (currentDoc?.fileUrl && currentDoc.hasTeacherFile) {
      resolvePlayableOrDownloadableUrl(currentDoc.fileUrl).then((res) => {
        if (active && res) {
          setResolvedUrl(res.url);
          if (res.fileName) setResolvedFileName(res.fileName);
        }
      });
    } else {
      setResolvedUrl(null);
      setResolvedFileName(undefined);
    }
    return () => {
      active = false;
    };
  }, [currentDoc]);

  if (!currentDoc) return null;

  const hasTeacherFile = currentDoc.hasTeacherFile && Boolean(currentDoc.fileUrl);
  const displayFileName =
    resolvedFileName || currentDoc.fileName || currentDoc.downloadFileName;

  const isPdfPreviewable =
    hasTeacherFile &&
    Boolean(resolvedUrl) &&
    (currentDoc.format.toLowerCase() === 'pdf' ||
      displayFileName?.toLowerCase().endsWith('.pdf') ||
      resolvedUrl?.startsWith('data:application/pdf'));

  const handleDownloadClick = async () => {
    setDownloadError(null);
    const ok = await triggerEducationalDocumentDownload(currentDoc);
    if (ok) {
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3500);
    } else {
      setDownloadError(
        `Chưa có tệp "${currentDoc.type}" do giáo viên tải lên kho bài giảng cho mục này. Vui lòng bấm nút "Tải tệp từ máy tính lên Kho bài giảng" bên dưới.`
      );
    }
  };

  const handleDirectTeacherUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setDownloadError(null);

    try {
      const targetLessonId = currentDoc.lessonId || 'general-library';
      const uploaded = await uploadLessonDocument(file, targetLessonId);
      if (uploaded) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
        const fmt: 'pptx' | 'pdf' | 'docx' =
          ext === 'pptx' || ext === 'ppt'
            ? 'pptx'
            : ext === 'docx' || ext === 'doc'
            ? 'docx'
            : 'pdf';

        await saveUploadedAssetToRepository({
          id: currentDoc.id.startsWith('asset-') ? currentDoc.id : `asset-${Date.now()}`,
          lessonId: targetLessonId,
          title: currentDoc.title || file.name.replace(/\.[^/.]+$/, ''),
          format: fmt,
          type: currentDoc.type || 'Giáo án điện tử',
          fileSize: uploaded.sizeFormatted,
          fileUrl: uploaded.publicUrl,
          fileName: uploaded.fileName || file.name,
          lessonTitle: currentDoc.lessonTitle,
        });

        const safeGrade = (
          currentDoc.grade >= 6 && currentDoc.grade <= 9 ? currentDoc.grade : 8
        ) as Grade;
        await saveAdminCatalogDoc({
          id: currentDoc.id.startsWith('doc-') ? currentDoc.id : undefined,
          lessonId: currentDoc.lessonId,
          title: currentDoc.title || file.name.replace(/\.[^/.]+$/, ''),
          grade: safeGrade,
          domain: 'hoa-hoc',
          format: fmt,
          type: currentDoc.type || 'Giáo án điện tử',
          fileSize: uploaded.sizeFormatted,
          downloadUrl: uploaded.publicUrl,
          fileUrl: uploaded.publicUrl,
          fileName: uploaded.fileName || file.name,
          description: currentDoc.lessonTitle
            ? `Tệp gốc giáo viên tải lên cho bài: ${currentDoc.lessonTitle}`
            : `Tệp gốc giáo viên tải lên kho học liệu (${file.name})`,
        });

        const updatedDoc: GeneratedDocumentData = {
          ...currentDoc,
          format: fmt,
          fileSize: uploaded.sizeFormatted,
          fileUrl: uploaded.publicUrl,
          fileName: uploaded.fileName || file.name,
          hasTeacherFile: true,
          downloadFileName: uploaded.fileName || file.name,
        };
        setCurrentDoc(updatedDoc);
        setUploadSuccessMsg(
          `Đã lưu tệp gốc "${file.name}" vào Kho bài giảng! Bây giờ bạn có thể tải tệp này về máy bất cứ lúc nào.`
        );
        if (onUploadedSuccess) {
          onUploadedSuccess(updatedDoc);
        }
      }
    } catch (err: any) {
      setDownloadError(err?.message || 'Lỗi khi tải tệp lên kho bài giảng.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-teal-700 via-sky-700 to-indigo-800 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25">
              <FileText className="w-6 h-6 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {currentDoc.type}
                </span>
                <span className="text-xs font-bold text-teal-100">
                  Khối Lớp {currentDoc.grade} • Định dạng {currentDoc.format.toUpperCase()}
                </span>
                {hasTeacherFile && (
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-400/25 border border-emerald-300/40 text-emerald-100">
                    ✓ File gốc GV đã tải lên
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white truncate mt-1">
                {currentDoc.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasTeacherFile && (
              <button
                type="button"
                onClick={handleDownloadClick}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer ${
                  downloaded
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                }`}
              >
                {downloaded ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã tải file gốc!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Tải file gốc ({currentDoc.format.toUpperCase()})</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {uploadSuccessMsg && (
          <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
        )}

        {downloadError && (
          <div className="px-6 py-3 bg-amber-50 dark:bg-amber-950/80 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{downloadError}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-50 dark:bg-slate-950">
          {hasTeacherFile ? (
            isPdfPreviewable && resolvedUrl ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    <FolderCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div>Tệp gốc do Giáo viên tải lên Kho bài giảng: <strong>{displayFileName}</strong></div>
                      <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        Định dạng: {currentDoc.format.toUpperCase()} • Dung lượng: {currentDoc.fileSize}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadClick}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải file gốc về máy</span>
                  </button>
                </div>

                <iframe
                  src={resolvedUrl}
                  title={currentDoc.title}
                  className="w-full h-[60vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white"
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-md border-2 border-teal-200 dark:border-slate-800 max-w-2xl mx-auto text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center mx-auto">
                  <FolderCheck className="w-8 h-8 text-teal-600" />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                    Đã kết nối tệp gốc trên Kho bài giảng
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {displayFileName}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Phân loại: <strong>{currentDoc.type}</strong> • Định dạng:{' '}
                    <strong>.{currentDoc.format.toUpperCase()}</strong> • Dung lượng:{' '}
                    <strong>{currentDoc.fileSize}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tệp <strong>.{currentDoc.format.toUpperCase()}</strong> là tệp gốc do giáo viên tải lên kho bài giảng. Hãy nhấn nút bên dưới để tải trực tiếp tệp gốc về máy tính hoặc điện thoại của bạn.
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadClick}
                    className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-extrabold flex items-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải file gốc về máy ({displayFileName})</span>
                  </button>

                  <label className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'Đang cập nhật...' : 'Thay bằng file khác'}</span>
                    <input
                      type="file"
                      accept=".ppt,.pptx,.pdf,.doc,.docx"
                      className="hidden"
                      disabled={isUploading}
                      onChange={handleDirectTeacherUpload}
                    />
                  </label>
                </div>
              </div>
            )
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-md border-2 border-dashed border-amber-300 dark:border-amber-800 max-w-2xl mx-auto text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Giáo viên chưa tải tệp &ldquo;{currentDoc.type}&rdquo; lên Kho bài giảng cho mục này
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
                  Hệ thống chỉ tải xuống <strong>đúng tệp gốc (.pptx, .pdf, .docx, .doc)</strong> mà giáo viên đã tải lên kho bài giảng, không tự sinh tệp bằng AI.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <label className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>
                    {isUploading
                      ? 'Đang tải tệp lên Kho bài giảng...'
                      : `+ Tải tệp ${currentDoc.type} từ máy tính lên Kho bài giảng`}
                  </span>
                  <input
                    type="file"
                    accept=".ppt,.pptx,.pdf,.doc,.docx"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleDirectTeacherUpload}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Kho Học Liệu Số KHTN • Tải trực tiếp tệp gốc của Giáo viên
          </div>
          <div className="flex items-center gap-2.5">
            {hasTeacherFile && (
              <button
                type="button"
                onClick={handleDownloadClick}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file gốc ({displayFileName})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
