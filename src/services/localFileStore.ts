/**
 * Persistent Binary File Store (IndexedDB + In-Memory Cache)
 * Lưu trữ nguyên bản các tệp Giáo án (.pptx, .ppt, .pdf, .docx, .doc) và Phiếu học tập
 * do giáo viên tải lên kho bài giảng, không bị giới hạn 5MB của localStorage
 * và không bị mất dữ liệu khi tải lại trang.
 */

export interface StoredTeacherFileRecord {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  blob?: Blob;
  dataUrl?: string;
  createdAt: string;
}

const DB_NAME = 'khtn_teacher_repository_files_db';
const DB_VERSION = 1;
const STORE_NAME = 'uploaded_files';

const memoryFileCache = new Map<string, StoredTeacherFileRecord>();
const objectUrlCache = new Map<string, string>();

function openTeacherFilesDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function isRealUploadedFileUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#') return false;
  return (
    trimmed === '#uploaded-on-teacher-device' ||
    trimmed.startsWith('idb://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  );
}

function readFileAsDataUrl(file: Blob): Promise<string | null> {
  if (typeof FileReader === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Lưu file gốc của Giáo viên vào Server (/assets/uploads/...), IndexedDB và bộ nhớ đệm
 * để máy tính khác truy cập được học liệu đã tải lên.
 */
export async function saveTeacherFileToRepo(
  file: File,
  customId?: string
): Promise<{
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
}> {
  const id =
    customId ||
    `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let fileUrl = `idb://${id}`;
  const mimeType = file.type || guessMimeTypeFromFileName(file.name);

  const dataUrl = file.size <= 15 * 1024 * 1024 ? await readFileAsDataUrl(file) : null;

  // Try uploading to server /api/upload-teacher-file so other computers can access the static file at /assets/uploads/...
  if (dataUrl && typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/upload-teacher-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          dataUrl,
        }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.ok && typeof json.fileUrl === 'string' && json.fileUrl.startsWith('/')) {
          fileUrl = json.fileUrl;
        }
      }
    } catch {
      // Fallback if running on static hosting without /api/upload-teacher-file
    }
  }

  // If static hosting without server upload and file is <= 1.2MB, use dataUrl so it syncs in cmsSnapshot
  if (fileUrl.startsWith('idb://') && dataUrl && file.size <= 1200 * 1024) {
    fileUrl = dataUrl;
  }

  const record: StoredTeacherFileRecord = {
    id,
    fileName: file.name,
    mimeType,
    size: file.size,
    blob: file,
    dataUrl: dataUrl || undefined,
    createdAt: new Date().toISOString(),
  };

  memoryFileCache.set(id, record);
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      objectUrlCache.set(id, URL.createObjectURL(file));
    } catch {
      // ignore in non-browser test env
    }
  }

  const db = await openTeacherFilesDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  return {
    fileUrl,
    fileName: file.name,
    mimeType,
    size: file.size,
  };
}

/**
 * Truy xuất file gốc của Giáo viên từ `idb://...`
 */
export async function getTeacherFileFromRepo(
  fileUrl: string
): Promise<StoredTeacherFileRecord | null> {
  if (!fileUrl || !fileUrl.startsWith('idb://')) return null;
  const id = fileUrl.replace(/^idb:\/\//, '').trim();
  if (!id) return null;

  const mem = memoryFileCache.get(id);
  if (mem) return mem;

  const db = await openTeacherFilesDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const found = req.result as StoredTeacherFileRecord | undefined;
        if (found) {
          memoryFileCache.set(id, found);
          resolve(found);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Lấy Object URL có thể nhúng vào <iframe> / <video> hoặc tải xuống từ `fileUrl`
 */
export async function resolvePlayableOrDownloadableUrl(
  fileUrl?: string
): Promise<{ url: string; fileName?: string } | null> {
  if (!isRealUploadedFileUrl(fileUrl)) return null;
  const clean = fileUrl!.trim();

  if (clean.startsWith('idb://')) {
    const id = clean.replace(/^idb:\/\//, '').trim();
    const cachedObjUrl = objectUrlCache.get(id);
    const rec = await getTeacherFileFromRepo(clean);
    if (cachedObjUrl) {
      return { url: cachedObjUrl, fileName: rec?.fileName };
    }
    if (rec?.blob && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const created = URL.createObjectURL(rec.blob);
      objectUrlCache.set(id, created);
      return { url: created, fileName: rec.fileName };
    }
    if (rec?.dataUrl) {
      return { url: rec.dataUrl, fileName: rec.fileName };
    }
    return null;
  }

  return { url: clean };
}

export function guessMimeTypeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    default:
      return 'application/octet-stream';
  }
}

export async function getAllTeacherFilesFromRepo(): Promise<StoredTeacherFileRecord[]> {
  const db = await openTeacherFilesDb();
  if (!db) {
    return Array.from(memoryFileCache.values());
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = Array.isArray(req.result)
          ? (req.result as StoredTeacherFileRecord[])
          : [];
        list.forEach((item) => {
          if (item && item.id) {
            memoryFileCache.set(item.id, item);
          }
        });
        resolve(list);
      };
      req.onerror = () => resolve(Array.from(memoryFileCache.values()));
    } catch {
      resolve(Array.from(memoryFileCache.values()));
    }
  });
}

