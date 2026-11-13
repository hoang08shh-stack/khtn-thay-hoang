import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { saveTeacherFileToRepo } from './localFileStore.ts';

/**
 * Supabase Free Tier File Limits & Validation Constants
 * Giới hạn tối đa 50MB cho mỗi tệp theo quy chuẩn Supabase Free.
 */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 52,428,800 bytes (50 MB)

export const ALLOWED_DOC_EXTENSIONS = [
  'pdf',
  'ppt',
  'pptx',
  'docx',
  'doc',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'mp4',
  'webm',
];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/webm',
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileSizeFormatted?: string;
}

/**
 * Format bytes to readable string (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Validate file against Supabase Free 50MB limit and allowed MIME types
 */
export function validateUploadFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'Chưa chọn tệp tải lên.' };
  }

  // 1. Kiểm tra dung lượng (Max 50MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const currentSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Tệp dung lượng ${currentSizeMB} MB vượt quá giới hạn 50 MB của gói Supabase Free. Vui lòng nén hoặc chọn tệp nhỏ hơn.`,
    };
  }

  // 2. Kiểm tra phần mở rộng & MIME type
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  const isExtensionAllowed = ALLOWED_DOC_EXTENSIONS.includes(fileExt);
  const isMimeAllowed = !file.type || ALLOWED_MIME_TYPES.includes(file.type);

  if (!isExtensionAllowed && !isMimeAllowed) {
    return {
      valid: false,
      error: `Định dạng .${fileExt} không được hỗ trợ. Chỉ chấp nhận các định dạng học liệu: PDF, PPT, PPTX, DOCX hoặc ảnh PNG/JPG.`,
    };
  }

  return {
    valid: true,
    fileSizeFormatted: formatBytes(file.size),
  };
}

/**
 * Upload a document (PPTX, PDF, DOCX) to the `lesson-documents` bucket or persistent IndexedDB repository.
 */
export async function uploadLessonDocument(
  file: File,
  lessonId: string,
  onProgress?: (percent: number) => void
): Promise<{ path: string; publicUrl: string; sizeFormatted: string; fileName: string } | null> {
  const validation = validateUploadFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const fallbackLocalUpload = async () => {
    if (onProgress) {
      onProgress(35);
      await new Promise((r) => setTimeout(r, 80));
      onProgress(80);
    }
    const mockPath = `lesson-documents/${lessonId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const saved = await saveTeacherFileToRepo(file);
    if (onProgress) onProgress(100);
    return {
      path: mockPath,
      publicUrl: saved.fileUrl,
      sizeFormatted: validation.fileSizeFormatted || formatBytes(file.size),
      fileName: file.name,
    };
  };

  // If local mode
  if (!isSupabaseConfigured || !supabase) {
    return fallbackLocalUpload();
  }

  try {
    if (onProgress) onProgress(20);

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${lessonId}/${Date.now()}_${cleanName}`;

    if (onProgress) onProgress(50);

    const { data, error } = await supabase.storage
      .from('lesson-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase Storage upload warning, using local IndexedDB repository:', error.message);
      return fallbackLocalUpload();
    }

    if (onProgress) onProgress(90);

    const { data: urlData } = supabase.storage
      .from('lesson-documents')
      .getPublicUrl(data.path);

    if (onProgress) onProgress(100);

    return {
      path: data.path,
      publicUrl: urlData.publicUrl,
      sizeFormatted: validation.fileSizeFormatted || formatBytes(file.size),
      fileName: file.name,
    };
  } catch (err: any) {
    console.warn('Fallback to local IndexedDB document storage:', err);
    return fallbackLocalUpload();
  }
}

/**
 * Upload an image asset (thumbnail) to `science-assets` bucket
 */
export async function uploadScienceAsset(
  file: File,
  prefix = 'thumbnails'
): Promise<{ path: string; publicUrl: string } | null> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Ảnh bìa không được vượt quá 10MB.');
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      path: `science-assets/${prefix}/${file.name}`,
      publicUrl: URL.createObjectURL(file),
    };
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${prefix}/${Date.now()}_${cleanName}`;

  const { data, error } = await supabase.storage
    .from('science-assets')
    .upload(filePath, file, { cacheControl: '86400', upsert: true });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from('science-assets')
    .getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Delete a file from Supabase Storage bucket
 */
export async function deleteStorageFile(
  bucket: 'lesson-documents' | 'science-assets' | 'avatars',
  path: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return true;
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.warn('Storage deletion warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete file from storage:', err);
    return false;
  }
}

/**
 * Upload a user avatar to the `avatars` bucket.
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string | null> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ảnh đại diện không được vượt quá 5MB.');
  }

  if (!isSupabaseConfigured || !supabase) {
    return URL.createObjectURL(file);
  }

  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err: any) {
    console.error('Failed to upload avatar:', err);
    throw new Error(err.message || 'Lỗi tải lên ảnh đại diện.');
  }
}
