import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  FileUp,
} from 'lucide-react';
import {
  validateUploadFile,
  uploadLessonDocument,
  formatBytes,
  MAX_FILE_SIZE_BYTES,
} from '../../services/storageService.ts';
import { LessonAssetItem } from '../../services/adminService.ts';

interface AssetUploaderProps {
  lessonId: string;
  onAssetUploaded: (asset: LessonAssetItem) => void;
  disabled?: boolean;
}

const DOCUMENT_TYPES = [
  'Giáo án điện tử',
  'Phiếu học tập',
  'Sơ đồ tư duy',
  'Đề kiểm tra 15p/1T',
  'Tài liệu tham khảo',
  'Hình ảnh minh họa',
];

export const AssetUploader: React.FC<AssetUploaderProps> = ({
  lessonId,
  onAssetUploaded,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [docType, setDocType] = useState(DOCUMENT_TYPES[0]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = validateUploadFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Tệp không hợp lệ.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    // Suggest title from file name without extension
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setCustomTitle(nameWithoutExt.replace(/[_-]/g, ' '));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress(10);

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'pdf';
      const format = (['pptx', 'pdf', 'docx', 'png', 'jpg'].includes(ext)
        ? ext
        : 'pdf') as any;

      const result = await uploadLessonDocument(
        selectedFile,
        lessonId || 'general-assets',
        (percent) => setUploadProgress(percent)
      );

      if (!result) {
        throw new Error('Không nhận được đường dẫn sau khi tải lên.');
      }

      const newAsset: LessonAssetItem = {
        id: `temp-${Date.now()}`,
        lessonId: lessonId || '',
        title: customTitle.trim() || selectedFile.name,
        format,
        type: docType,
        fileSize: result.sizeFormatted || formatBytes(selectedFile.size),
        fileUrl: result.publicUrl,
        storagePath: result.path,
        downloadsCount: 0,
      };

      onAssetUploaded(newAsset);
      setSuccessMessage(`Đã tải lên thành công: ${selectedFile.name}`);
      setSelectedFile(null);
      setCustomTitle('');
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi tải tệp lên Supabase Storage.');
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Tải lên học liệu số (Supabase Storage)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Hỗ trợ PDF, PPT, PPTX, DOCX, Ảnh. Giới hạn tối đa <strong className="text-teal-600 dark:text-teal-400">50 MB / file</strong> (Supabase Free).
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          Max: 50MB
        </span>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success alert */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900/60 text-teal-700 dark:text-teal-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="text-teal-500 hover:text-teal-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drag & drop zone */}
      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 bg-white dark:bg-slate-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.ppt,.pptx,.docx,.doc,.png,.jpg,.jpeg,.webp"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            disabled={disabled || isUploading}
          />
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
              Kéo thả tệp vào đây hoặc{' '}
              <span className="text-teal-600 dark:text-teal-400 underline">chọn từ thiết bị</span>
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Hệ thống sẽ tự động quét định dạng MIME và xác thực dung lượng an toàn.
            </p>
          </div>
        </div>
      ) : (
        /* Selected file configuration panel */
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs uppercase">
                {selectedFile.name.split('.').pop() || 'file'}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </div>
                <div className="text-[11px] text-slate-400">
                  {formatBytes(selectedFile.size)} • Sẵn sàng tải lên
                </div>
              </div>
            </div>
            {!isUploading && (
              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Tên hiển thị học liệu
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="VD: Giáo án PowerPoint Bài 4..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Phân loại học liệu
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-100 text-xs"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress bar */}
          {uploadProgress !== null && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span>Đang tải lên Supabase Storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={isUploading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Bắt đầu tải lên</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
