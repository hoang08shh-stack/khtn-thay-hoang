import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText,
  Download,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  List,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { CoreWordDocumentMeta } from '../../types/index.ts';
import {
  WordOutlineItem,
  convertDocxArrayBufferToWordHtml,
  highlightSearchInWordHtml,
  injectHeadingIdsIntoWordHtml,
  isLegacyBinaryDocFilename,
  sanitizeWordHtml,
} from '../../utils/wordReaderEngine.ts';
import { resolvePlayableOrDownloadableUrl } from '../../services/localFileStore.ts';

interface WordDocumentReaderProps {
  coreWordDoc: CoreWordDocumentMeta;
  lessonTitle?: string;
  compact?: boolean;
}

const ZOOM_STEPS = [85, 100, 110, 125, 140] as const;

export const WordDocumentReader: React.FC<WordDocumentReaderProps> = ({
  coreWordDoc,
  lessonTitle,
  compact = false,
}) => {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [outline, setOutline] = useState<WordOutlineItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>(coreWordDoc.fileUrl);

  const [zoomIndex, setZoomIndex] = useState<number>(1); // 100%
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOutline, setShowOutline] = useState<boolean>(!compact);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);

  const paperContainerRef = useRef<HTMLDivElement | null>(null);
  const zoomPercent = ZOOM_STEPS[zoomIndex] ?? 100;

  useEffect(() => {
    let cancelled = false;
    const revocableUrls: string[] = [];

    async function loadWordDocument() {
      setIsLoading(true);
      setErrorMsg(null);
      setActiveOutlineId(null);

      try {
        // Resolve playable/downloadable URL (handles idb://, /assets/uploads/, https://, data:)
        let resolvedUrl = coreWordDoc.fileUrl;
        try {
          const resolved = await resolvePlayableOrDownloadableUrl(coreWordDoc.fileUrl);
          if (resolved?.url) {
            resolvedUrl = resolved.url;
            if (resolved.url.startsWith('blob:')) {
              revocableUrls.push(resolved.url);
            }
          }
        } catch {
          // keep original URL fallback
        }
        if (!cancelled) {
          setDownloadUrl(resolvedUrl);
        }

        // Fast path: cached sanitized HTML already available
        if (coreWordDoc.htmlContent && coreWordDoc.htmlContent.trim()) {
          const sanitized = sanitizeWordHtml(coreWordDoc.htmlContent);
          const { html, outline: extractedOutline } = injectHeadingIdsIntoWordHtml(sanitized);
          if (!cancelled) {
            setRenderedHtml(html);
            setOutline(extractedOutline);
            setIsLoading(false);
          }
          return;
        }

        // Guard for legacy binary .doc files
        if (isLegacyBinaryDocFilename(coreWordDoc.fileName)) {
          if (!cancelled) {
            setRenderedHtml('');
            setOutline([]);
            setErrorMsg(
              'Tệp định dạng .doc (Word 97-2003) không hỗ trợ xem trực tiếp trên trình duyệt. Giáo viên vui lòng lưu thành .docx để học sinh đọc trực tiếp, hoặc bấm "Tải file Word" để mở trên máy.'
            );
            setIsLoading(false);
          }
          return;
        }

        // Fetch binary .docx and convert via Mammoth
        const res = await fetch(resolvedUrl);
        if (!res.ok) {
          throw new Error(`Không thể tải tệp Word (HTTP ${res.status}).`);
        }
        const arrayBuffer = await res.arrayBuffer();
        const converted = await convertDocxArrayBufferToWordHtml(arrayBuffer);

        if (!cancelled) {
          if (!converted.htmlContent.trim()) {
            setErrorMsg(
              'Tệp Word chưa có văn bản hiển thị hoặc chỉ chứa đối tượng không đọc được. Học sinh có thể tải tệp gốc về để xem.'
            );
          }
          setRenderedHtml(converted.htmlContent);
          setOutline(converted.outline);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(
            err?.message ||
              'Không thể giải mã tệp Word để đọc trực tiếp. Vui lòng kiểm tra định dạng .docx hoặc tải tệp gốc.'
          );
          setIsLoading(false);
        }
      }
    }

    loadWordDocument();

    return () => {
      cancelled = true;
      revocableUrls.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {
          // ignore
        }
      });
    };
  }, [coreWordDoc.fileUrl, coreWordDoc.fileName, coreWordDoc.htmlContent]);

  const { html: highlightedHtml, matchCount } = useMemo(
    () => highlightSearchInWordHtml(renderedHtml, searchQuery),
    [renderedHtml, searchQuery]
  );

  const handleJumpToHeading = (id: string) => {
    setActiveOutlineId(id);
    const root = paperContainerRef.current;
    if (!root) return;
    const el = root.querySelector(`[id="${id}"]`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const wordProseClasses =
    'text-slate-800 dark:text-slate-100 leading-relaxed break-words ' +
    '[&_h1]:text-xl sm:[&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-teal-950 dark:[&_h1]:text-teal-200 [&_h1]:mt-5 [&_h1]:mb-3 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-slate-200 dark:[&_h1]:border-slate-700 ' +
    '[&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-teal-900 dark:[&_h2]:text-teal-300 [&_h2]:mt-5 [&_h2]:mb-2.5 ' +
    '[&_h3]:text-base sm:[&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2 ' +
    '[&_h4]:text-sm sm:[&_h4]:text-base [&_h4]:font-bold [&_h4]:text-slate-800 dark:[&_h4]:text-slate-200 [&_h4]:mt-3 [&_h4]:mb-1.5 ' +
    '[&_p]:my-2.5 [&_p]:text-[15px] sm:[&_p]:text-base ' +
    '[&_strong]:font-extrabold [&_strong]:text-slate-950 dark:[&_strong]:text-white ' +
    '[&_b]:font-extrabold ' +
    '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2.5 [&_ul]:space-y-1.5 ' +
    '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2.5 [&_ol]:space-y-1.5 ' +
    '[&_li]:leading-relaxed ' +
    '[&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-sm [&_table]:rounded-lg [&_table]:overflow-hidden ' +
    '[&_th]:bg-teal-50 dark:[&_th]:bg-slate-800 [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-700 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-extrabold [&_th]:text-teal-950 dark:[&_th]:text-teal-200 ' +
    '[&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-700 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top ' +
    '[&_blockquote]:border-l-4 [&_blockquote]:border-teal-500 [&_blockquote]:bg-teal-50/50 dark:[&_blockquote]:bg-slate-800/60 [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_blockquote]:my-3 [&_blockquote]:rounded-r-xl ' +
    '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-4 [&_img]:border [&_img]:border-slate-200 dark:[&_img]:border-slate-700 [&_img]:mx-auto ' +
    '[&_a]:text-teal-700 dark:[&_a]:text-teal-400 [&_a]:underline ' +
    '[&_sub]:text-[0.75em] [&_sub]:align-sub [&_sup]:text-[0.75em] [&_sup]:align-super ' +
    '[&_mark.word-search-hit]:bg-amber-200 [&_mark.word-search-hit]:text-slate-950 [&_mark.word-search-hit]:px-0.5 [&_mark.word-search-hit]:rounded';

  const readerShell = (
    <div
      data-testid="word-document-reader"
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-100 dark:bg-slate-950 flex flex-col'
          : 'rounded-2xl border-2 border-blue-200/80 dark:border-blue-900/60 bg-slate-50/80 dark:bg-slate-950/70 overflow-hidden shadow-xs'
      }
    >
      {/* Word Reader Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-black tracking-wide shrink-0 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            WORD
          </span>
          <div className="min-w-0">
            <div
              data-testid="word-reader-filename"
              className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[210px] sm:max-w-[320px]"
              title={coreWordDoc.fileName}
            >
              {coreWordDoc.fileName}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Trình đọc Word trực tuyến</span>
              {coreWordDoc.fileSize && <span>• {coreWordDoc.fileSize}</span>}
            </div>
          </div>
        </div>

        {/* Reader Interactive Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {!compact && outline.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOutline((v) => !v)}
              aria-expanded={showOutline}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition cursor-pointer ${
                showOutline
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="Bật/tắt Mục lục tài liệu Word"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mục lục ({outline.length})</span>
            </button>
          )}

          {!compact && (
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                data-testid="word-reader-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm trong bài..."
                aria-label="Tìm từ khóa trong tài liệu Word"
                className={`pl-7 py-1.5 w-40 sm:w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  searchQuery ? 'pr-14' : 'pr-3'
                }`}
              />
              {searchQuery && (
                <div className="absolute right-1.5 flex items-center gap-1">
                  <span
                    data-testid="word-reader-search-count"
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
                  >
                    {matchCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Xóa từ khóa tìm kiếm"
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Zoom Controls */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setZoomIndex((z) => Math.max(0, z - 1))}
              disabled={zoomIndex === 0}
              aria-label="Thu nhỏ chữ tài liệu Word"
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="word-reader-zoom-level"
              onClick={() => setZoomIndex(1)}
              title="Đặt lại cỡ chữ 100%"
              className="px-2 py-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 border-x border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              {zoomPercent}%
            </button>
            <button
              type="button"
              onClick={() => setZoomIndex((z) => Math.min(ZOOM_STEPS.length - 1, z + 1))}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              aria-label="Phóng to chữ tài liệu Word"
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {!compact && (
            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              aria-label={isFullscreen ? 'Thu gọn trình đọc Word' : 'Mở rộng trình đọc Word toàn màn hình'}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thu gọn</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Toàn màn hình</span>
                </>
              )}
            </button>
          )}

          <a
            href={downloadUrl}
            download={coreWordDoc.fileName}
            data-testid="word-reader-download-btn"
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải file Word</span>
          </a>
        </div>
      </div>

      {/* Main Reader Body: Optional Outline + Paper Viewport */}
      <div
        className={`flex flex-col lg:flex-row ${
          isFullscreen ? 'flex-1 min-h-0' : compact ? 'max-h-72' : 'max-h-[760px]'
        }`}
      >
        {!compact && showOutline && outline.length > 0 && (
          <aside className="lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3 overflow-y-auto max-h-44 lg:max-h-full">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-2">
              Mục lục bài học
            </div>
            <nav aria-label="Mục lục tài liệu Word" className="space-y-1">
              {outline.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleJumpToHeading(item.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer line-clamp-2 ${
                    item.level >= 3 ? 'pl-5' : ''
                  } ${
                    activeOutlineId === item.id
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-extrabold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Word Paper Viewport */}
        <div
          ref={paperContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/70 dark:bg-slate-950"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Đang mở tài liệu Word "{coreWordDoc.fileName}"...
              </p>
            </div>
          ) : errorMsg && !renderedHtml.trim() ? (
            <div className="max-w-xl mx-auto my-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-center space-y-3 shadow-xs">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {lessonTitle || coreWordDoc.fileName}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {errorMsg}
              </p>
              <a
                href={downloadUrl}
                download={coreWordDoc.fileName}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-xs"
              >
                <Download className="w-4 h-4" />
                Tải file Word gốc về máy
              </a>
            </div>
          ) : (
            <article
              data-testid="word-reader-paper"
              style={{ fontSize: `${zoomPercent}%` }}
              className={`max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm p-5 sm:p-8 lg:p-10 ${wordProseClasses}`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );

  return readerShell;
};
