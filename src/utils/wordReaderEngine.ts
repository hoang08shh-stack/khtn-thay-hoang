import * as mammoth from 'mammoth';
import { CoreWordDocumentMeta } from '../types/index.ts';

export const CORE_WORD_ASSET_TYPE = 'Nội dung cốt lõi (Word)';

export interface WordOutlineItem {
  id: string;
  level: 1 | 2 | 3 | 4;
  text: string;
}

export interface WordConversionResult {
  htmlContent: string;
  plainText: string;
  outline: WordOutlineItem[];
  warnings: string[];
}

export function isCoreWordAssetType(type?: string | null): boolean {
  const norm = (type || '').trim().toLowerCase();
  return (
    norm === CORE_WORD_ASSET_TYPE.toLowerCase() ||
    norm === 'nội dung cốt lõi' ||
    norm === 'core word content'
  );
}

export function isDocxFilename(fileName?: string): boolean {
  return /\.docx$/i.test((fileName || '').trim());
}

export function isLegacyBinaryDocFilename(fileName?: string): boolean {
  return /\.doc$/i.test((fileName || '').trim()) && !isDocxFilename(fileName);
}

/**
 * Sanitize Word-generated HTML so it can be rendered safely in the Word Reader.
 * Preserves Word structural & academic tags: headings, paragraphs, bold/italic/underline,
 * sub/sup (chemical & math formulas), tables, lists, blockquotes, links, and embedded images.
 */
export function sanitizeWordHtml(rawHtml: string): string {
  if (!rawHtml || !rawHtml.trim()) return '';

  let clean = rawHtml.normalize('NFC');

  // Remove dangerous elements completely along with their contents
  clean = clean.replace(
    /<\s*(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)\b[^>]*>[\s\S]*?<\/\s*\1\s*>/gi,
    ''
  );
  clean = clean.replace(
    /<\s*(script|style|iframe|object|embed|meta|link|base)\b[^>]*\/?>/gi,
    ''
  );

  // Strip inline event handlers like onclick="..." or onerror=...
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Neutralize javascript: or vbscript: URIs in href/src attributes
  clean = clean.replace(
    /\b(href|src)\s*=\s*(?:"\s*(?:javascript|vbscript|data:text\/html)[^"]*"|'\s*(?:javascript|vbscript|data:text\/html)[^']*')/gi,
    '$1="#"'
  );

  // Add safe target/rel to external http(s) links
  clean = clean.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    const cleanedAttrs = attrs
      .replace(/\s+target\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s+rel\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    return `<a${cleanedAttrs} target="_blank" rel="noopener noreferrer">`;
  });

  return clean.trim();
}

function stripTagsToPlainText(htmlFragment: string): string {
  return htmlFragment
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Inject anchor IDs into headings (h1-h4, and standalone numbered/roman bold paragraphs)
 * and return an interactive table-of-contents outline alongside the enhanced HTML.
 */
export function injectHeadingIdsIntoWordHtml(sanitizedHtml: string): {
  html: string;
  outline: WordOutlineItem[];
} {
  if (!sanitizedHtml || !sanitizedHtml.trim()) {
    return { html: '', outline: [] };
  }

  const outline: WordOutlineItem[] = [];
  let counter = 0;

  // First pass: real <h1>..<h4> headings
  let html = sanitizedHtml.replace(
    /<h([1-4])\b([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (_full, lvlStr: string, attrs: string, inner: string) => {
      const text = stripTagsToPlainText(inner);
      if (!text) return `<h${lvlStr}${attrs}>${inner}</h${lvlStr}>`;
      counter += 1;
      const id = `word-sec-${counter}`;
      const level = Math.min(4, Math.max(1, Number(lvlStr))) as 1 | 2 | 3 | 4;
      outline.push({ id, level, text });
      const cleanedAttrs = attrs.replace(/\s+id\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
      return `<h${lvlStr}${cleanedAttrs} id="${id}">${inner}</h${lvlStr}>`;
    }
  );

  // Fallback pass: if Word doc only used bold paragraphs (e.g., <p><strong>I. Khái niệm...</strong></p>), promote short heading-like bold paragraphs into outline entries
  if (outline.length === 0) {
    html = html.replace(
      /<p\b([^>]*)>\s*<(strong|b)>([\s\S]*?)<\/\2>\s*<\/p>/gi,
      (full, attrs: string, tag: string, inner: string) => {
        const text = stripTagsToPlainText(inner);
        if (!text || text.length > 110) return full;
        counter += 1;
        const id = `word-sec-${counter}`;
        const isTop = /^([IVXLCDM]+\.|CHƯƠNG|PHẦN|BÀI|\d+\.)/i.test(text);
        outline.push({ id, level: isTop ? 2 : 3, text });
        const cleanedAttrs = attrs.replace(/\s+id\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
        return `<p${cleanedAttrs} id="${id}"><${tag}>${inner}</${tag}></p>`;
      }
    );
  }

  return { html, outline };
}

/**
 * Highlight keyword occurrences only within HTML text nodes (never corrupting tag attributes).
 */
export function highlightSearchInWordHtml(
  html: string,
  keyword: string
): { html: string; matchCount: number } {
  const q = (keyword || '').trim();
  if (!q || !html) return { html, matchCount: 0 };

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  let matchCount = 0;

  // Split into HTML tags vs text segments
  const parts = html.split(/(<[^>]+>)/g);
  const result = parts
    .map((part) => {
      if (!part || part.startsWith('<')) return part;
      return part.replace(regex, (m) => {
        matchCount += 1;
        return `<mark class="word-search-hit">${m}</mark>`;
      });
    })
    .join('');

  return { html: result, matchCount };
}

function getMammothApi(): typeof mammoth {
  const m = mammoth as any;
  if (m && typeof m.convertToHtml === 'function') return m;
  if (m?.default && typeof m.default.convertToHtml === 'function') return m.default;
  return mammoth;
}

/**
 * Parse a .docx ArrayBuffer into clean sanitized HTML + outline + plain text via Mammoth.
 */
export async function convertDocxArrayBufferToWordHtml(
  arrayBuffer: ArrayBuffer
): Promise<WordConversionResult> {
  const api = getMammothApi();

  const styleMap = [
    "p[style-name='Title'] => h1:fresh",
    "p[style-name='Subtitle'] => p.word-subtitle:fresh",
    "p[style-name='Heading 1'] => h1:fresh",
    "p[style-name='Heading 2'] => h2:fresh",
    "p[style-name='Heading 3'] => h3:fresh",
    "p[style-name='Heading 4'] => h4:fresh",
    "u => u",
    "strike => del",
  ];

  const inputOptions =
    typeof Buffer !== 'undefined' && typeof window === 'undefined'
      ? ({ buffer: Buffer.from(arrayBuffer) } as any)
      : ({ arrayBuffer } as any);

  const [htmlResult, rawResult] = await Promise.all([
    api.convertToHtml(inputOptions, { styleMap } as any),
    api.extractRawText(inputOptions),
  ]);

  const sanitized = sanitizeWordHtml(htmlResult.value || '');
  const { html, outline } = injectHeadingIdsIntoWordHtml(sanitized);

  return {
    htmlContent: html,
    plainText: (rawResult.value || '').normalize('NFC').trim(),
    outline,
    warnings: (htmlResult.messages || [])
      .map((msg: any) => msg?.message)
      .filter((m: any): m is string => typeof m === 'string' && m.length > 0),
  };
}

/**
 * Resolve the primary Core Knowledge Word document for a lesson, checking both
 * `lesson.coreWordDoc` and any lesson asset tagged with `CORE_WORD_ASSET_TYPE`.
 */
export function resolveCoreWordDocFromLesson(lesson?: {
  coreWordDoc?: CoreWordDocumentMeta | null;
  assets?: Array<{
    id?: string;
    title?: string;
    type?: string;
    fileSize?: string;
    fileUrl?: string;
    fileName?: string;
    createdAt?: string;
  }>;
} | null): CoreWordDocumentMeta | null {
  if (!lesson) return null;

  if (
    lesson.coreWordDoc &&
    lesson.coreWordDoc.fileUrl &&
    lesson.coreWordDoc.fileUrl.trim() !== '' &&
    lesson.coreWordDoc.fileUrl.trim() !== '#'
  ) {
    return {
      ...lesson.coreWordDoc,
      htmlContent: lesson.coreWordDoc.htmlContent
        ? sanitizeWordHtml(lesson.coreWordDoc.htmlContent)
        : undefined,
    };
  }

  const assetMatch = (lesson.assets || []).find(
    (a) =>
      isCoreWordAssetType(a.type) &&
      Boolean(a.fileUrl && a.fileUrl.trim() !== '' && a.fileUrl.trim() !== '#')
  );
  if (assetMatch && assetMatch.fileUrl) {
    const inferredName =
      assetMatch.fileName ||
      `${(assetMatch.title || 'Noi_dung_cot_loi').replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1E00-\u1EFF]+/g, '_')}.docx`;
    return {
      id: assetMatch.id,
      fileName: inferredName,
      fileUrl: assetMatch.fileUrl,
      fileSize: assetMatch.fileSize,
      uploadedAt: assetMatch.createdAt,
    };
  }

  return null;
}

/**
 * Build updated lesson assets array so the Core Word file is also mirrored cleanly
 * in `lesson.assets` (replacing any previous Core Word asset without touching Slides/Worksheets).
 */
export function upsertCoreWordAssetInList<
  T extends {
    id: string;
    lessonId: string;
    title: string;
    format: any;
    type: string;
    fileSize: string;
    fileUrl: string;
    fileName?: string;
    storagePath?: string;
    downloadsCount?: number;
    lessonTitle?: string;
    createdAt?: string;
  }
>(
  existingAssets: T[] = [],
  lessonId: string,
  lessonTitle: string,
  coreWordDoc: CoreWordDocumentMeta | null,
  storagePath?: string
): T[] {
  const nonCoreAssets = existingAssets.filter((a) => !isCoreWordAssetType(a.type));
  if (!coreWordDoc || !coreWordDoc.fileUrl) {
    return nonCoreAssets;
  }

  const cleanFileName = coreWordDoc.fileName || 'Noi_dung_cot_loi.docx';
  const baseName = cleanFileName.replace(/\.[^/.]+$/, '');
  const coreAsset = {
    id: coreWordDoc.id || `core-word-${lessonId}-${Date.now()}`,
    lessonId,
    lessonTitle,
    title: `${CORE_WORD_ASSET_TYPE}: ${baseName}`,
    format: 'docx',
    type: CORE_WORD_ASSET_TYPE,
    fileSize: coreWordDoc.fileSize || 'Tệp Word',
    fileUrl: coreWordDoc.fileUrl,
    fileName: cleanFileName,
    storagePath,
    downloadsCount: 0,
    createdAt: coreWordDoc.uploadedAt || new Date().toISOString(),
  } as T;

  return [coreAsset, ...nonCoreAssets];
}
