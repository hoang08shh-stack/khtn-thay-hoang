/**
 * ============================================================================
 * VIETNAMESE FONT & ENCODING FIXER (UTF-8 NFC, TCVN3/ABC, VNI-Windows, Mojibake)
 * ============================================================================
 * Đảm bảo toàn bộ hệ thống đọc file Word, phân tích câu hỏi, lưu database và
 * hiển thị trên trình duyệt theo chuẩn UTF-8 + Unicode dựng sẵn (NFC).
 * Phát hiện văn bản dùng bảng mã cũ (TCVN3/ABC, VNI-Windows, lỗi Mojibake UTF-8)
 * và hỗ trợ xem trước + xác nhận chuyển sang Unicode chuẩn.
 */

export type LegacyEncodingType = 'unicode_nfc' | 'unicode_nfd' | 'tcvn3' | 'vni' | 'utf8_mojibake';

export interface EncodingDetectionResult {
  detectedEncoding: LegacyEncodingType;
  confidence: 'high' | 'medium' | 'low';
  hasLegacyFontIssue: boolean;
  hasOleEquationWarning: boolean;
  oleEquationCount: number;
  warningMessage: string | null;
  sampleMatchedTokens: string[];
  previewConvertedText: string;
}

/**
 * Bảng ánh xạ TCVN3 (ABC) sang Unicode dựng sẵn (NFC) cho các nguyên âm có dấu
 * và chữ đ/Đ thường gặp trong tài liệu Word cũ của giáo viên Việt Nam.
 */
const TCVN3_CHAR_MAP: Record<string, string> = {
  // a
  '¸': 'á', 'µ': 'à', '¶': 'ả', '·': 'ã', '¹': 'ạ',
  // ă
  '¨': 'ă', '¾': 'ắ', '»': 'ằ', '¼': 'ẳ', '½': 'ẵ', 'Æ': 'ặ',
  '¡': 'Ă',
  // â
  '©': 'â', 'Ê': 'ấ', 'Ç': 'ầ', 'È': 'ẩ', 'É': 'ẫ', 'Ë': 'ậ',
  '¢': 'Â',
  // đ / Đ
  '®': 'đ', '§': 'Đ',
  // e
  'Ð': 'é', 'Ì': 'è', 'Î': 'ẻ', 'Ï': 'ẽ', 'Ñ': 'ẹ',
  // ê
  'ª': 'ê', 'Õ': 'ế', 'Ò': 'ề', 'Ó': 'ể', 'Ô': 'ễ', 'Ö': 'ệ',
  '£': 'Ê',
  // i
  'Ý': 'í', '×': 'ì', 'Ø': 'ỉ', 'Ü': 'ĩ', 'Þ': 'ị',
  // o
  'ã': 'ó', 'ß': 'ò', 'á': 'ỏ', 'â': 'õ', 'ä': 'ọ',
  // ô
  '«': 'ô', 'è': 'ố', 'å': 'ồ', 'æ': 'ổ', 'ç': 'ỗ', 'é': 'ộ',
  '¤': 'Ô',
  // ơ
  '¬': 'ơ', 'í': 'ớ', 'ê': 'ờ', 'ë': 'ở', 'ì': 'ỡ', 'î': 'ợ',
  '¥': 'Ơ',
  // u
  'ó': 'ú', 'ï': 'ù', 'ñ': 'ủ', 'ò': 'ũ', 'ô': 'ụ',
  // ư
  '­': 'ư', 'ø': 'ứ', 'õ': 'ừ', 'ö': 'ử', '÷': 'ữ', 'ù': 'ự',
  '¦': 'Ư',
  // y
  'ý': 'ý', 'ú': 'ỳ', 'û': 'ỷ', 'ü': 'ỹ', 'þ': 'ỵ',
};

/**
 * Các từ mẫu phổ biến trong đề Hóa/Vật lí/Sinh học viết bằng TCVN3 (ABC)
 * để nhận diện chính xác mà không làm hỏng văn bản Unicode bình thường.
 */
const TCVN3_WORD_PATTERNS: Array<{ pattern: RegExp; replacement: string; label: string }> = [
  { pattern: /\bHoµ\s+tan\b/g, replacement: 'Hòa tan', label: 'Hoµ tan → Hòa tan' },
  { pattern: /\bhoµ\s+tan\b/g, replacement: 'hòa tan', label: 'hoµ tan → hòa tan' },
  { pattern: /\bhoµn\s+toµn\b/g, replacement: 'hoàn toàn', label: 'hoµn toµn → hoàn toàn' },
  { pattern: /\bdung\s+dÞch\b/g, replacement: 'dung dịch', label: 'dung dÞch → dung dịch' },
  { pattern: /\bDung\s+dÞch\b/g, replacement: 'Dung dịch', label: 'Dung dÞch → Dung dịch' },
  { pattern: /\bph¶n\s+øng\b/g, replacement: 'phản ứng', label: 'ph¶n øng → phản ứng' },
  { pattern: /\bPh¶n\s+øng\b/g, replacement: 'Phản ứng', label: 'Ph¶n øng → Phản ứng' },
  { pattern: /\bkhèi\s+l­îng\b/g, replacement: 'khối lượng', label: 'khèi l­îng → khối lượng' },
  { pattern: /\bthÓ\s+tÝch\b/g, replacement: 'thể tích', label: 'thÓ tÝch → thể tích' },
  { pattern: /\b®iÒu\s+kiÖn\b/g, replacement: 'điều kiện', label: '®iÒu kiÖn → điều kiện' },
  { pattern: /\bkim\s+lo¹i\b/g, replacement: 'kim loại', label: 'kim lo¹i → kim loại' },
  { pattern: /\bnguyªn\s+tö\b/g, replacement: 'nguyên tử', label: 'nguyên tö → nguyên tử' },
  { pattern: /\bph©n\s+tö\b/g, replacement: 'phân tử', label: 'ph©n tö → phân tử' },
  { pattern: /\b®iÖn\s+trë\b/g, replacement: 'điện trở', label: '®iÖn trë → điện trở' },
  { pattern: /\bc­êng\s+®é\b/g, replacement: 'cường độ', label: 'c­êng ®é → cường độ' },
  { pattern: /\bhiÖu\s+®iÖn\s+thÕ\b/g, replacement: 'hiệu điện thế', label: 'hiÖu ®iÖn thÕ → hiệu điện thế' },
  { pattern: /\btÕ\s+bµo\b/g, replacement: 'tế bào', label: 'tÕ bµo → tế bào' },
  { pattern: /\bC©u\b/g, replacement: 'Câu', label: 'C©u → Câu' },
  { pattern: /\b§¸p\s+¸n\b/g, replacement: 'Đáp án', label: '§¸p ¸n → Đáp án' },
  { pattern: /\bLêi\s+gi¶i\b/g, replacement: 'Lời giải', label: 'Lêi gi¶i → Lời giải' },
];

/**
 * Bảng tổ hợp nguyên âm + dấu trong bảng mã VNI-Windows (2-byte giả lập bằng ký tự Latin-1)
 */
const VNI_SEQUENCE_RULES: Array<[RegExp, string]> = [
  // ă = a8, Ă = A8
  [/a81/g, 'ắ'], [/a82/g, 'ằ'], [/a83/g, 'ẳ'], [/a84/g, 'ẵ'], [/a85/g, 'ặ'], [/a8/g, 'ă'],
  [/A81/g, 'Ắ'], [/A82/g, 'Ằ'], [/A83/g, 'Ẳ'], [/A84/g, 'Ẵ'], [/A85/g, 'Ặ'], [/A8/g, 'Ă'],
  // â = a6, Â = A6
  [/a61/g, 'ấ'], [/a62/g, 'ầ'], [/a63/g, 'ẩ'], [/a64/g, 'ẫ'], [/a65/g, 'ậ'], [/a6/g, 'â'],
  [/A61/g, 'Ấ'], [/A62/g, 'Ầ'], [/A63/g, 'Ẩ'], [/A64/g, 'Ẫ'], [/A65/g, 'Ậ'], [/A6/g, 'Â'],
  // VNI Windows vowel + diacritic chars: ù (grave),  sắc (ù/ø/é/í...), etc.
  [/aø/g, 'á'], [/aù/g, 'à'], [/aû/g, 'ả'], [/aõ/g, 'ã'], [/aï/g, 'ạ'],
  [/aê/g, 'â'], [/aá/g, 'ấ'], [/aà/g, 'ầ'], [/aå/g, 'ẩ'], [/aã/g, 'ẫ'], [/aä/g, 'ậ'],
  [/aă/g, 'ă'], [/aé/g, 'ắ'], [/aè/g, 'ằ'], [/aú/g, 'ẳ'], [/aẵ/g, 'ẵ'], [/aë/g, 'ặ'],
  [/eø/g, 'é'], [/eù/g, 'è'], [/eû/g, 'ẻ'], [/eõ/g, 'ẽ'], [/eï/g, 'ẹ'],
  [/eê/g, 'ê'], [/eá/g, 'ế'], [/eà/g, 'ề'], [/eå/g, 'ể'], [/eã/g, 'ễ'], [/eä/g, 'ệ'],
  [/oø/g, 'ó'], [/où/g, 'ò'], [/oû/g, 'ỏ'], [/oõ/g, 'õ'], [/oï/g, 'ọ'],
  [/oâ/g, 'ô'], [/oá/g, 'ố'], [/oà/g, 'ồ'], [/oå/g, 'ổ'], [/oã/g, 'ỗ'], [/oä/g, 'ộ'],
  [/uø/g, 'ú'], [/uù/g, 'ù'], [/uû/g, 'ủ'], [/uõ/g, 'ũ'], [/uï/g, 'ụ'],
  [/yø/g, 'ý'], [/yù/g, 'ỳ'], [/yû/g, 'ỷ'], [/yõ/g, 'ỹ'], [/yï/g, 'ỵ'],
  [/öông/g, 'ương'], [/öôc/g, 'ước'], [/öô/g, 'ươ'],
  [/öù/g, 'ứ'], [/öø/g, 'ừ'], [/öû/g, 'ử'], [/öõ/g, 'ữ'], [/öï/g, 'ự'], [/ö/g, 'ư'],
  [/ôù/g, 'ớ'], [/ôø/g, 'ờ'], [/ôû/g, 'ở'], [/ôõ/g, 'ỡ'], [/ôï/g, 'ợ'],
  [/ñieän/g, 'điện'], [/Ñieän/g, 'Điện'], [/ñaùp/g, 'đáp'], [/Ñaùp/g, 'Đáp'],
  [/ñöôïc/g, 'được'], [/ñaët/g, 'đặt'], [/ñoàng/g, 'đồng'], [/ñuùng/g, 'đúng'],
  [/Caâu/g, 'Câu'], [/caâu/g, 'câu'], [/Hoøa/g, 'Hòa'], [/hoøa/g, 'hòa'],
  [/hoøan/g, 'hoàn'], [/toaøn/g, 'toàn'], [/phaûn/g, 'phản'], [/öùng/g, 'ứng'],
  [/khoái/g, 'khối'], [/löôïng/g, 'lượng'], [/theå/g, 'thể'], [/tích/g, 'tích'],
];

const SPACING_ACCENT_TO_COMBINING: Record<string, string> = {
  '\u00B4': '\u0301', // ´ ACUTE ACCENT -> combining acute
  '\u02CA': '\u0301', // ˊ MODIFIER LETTER ACUTE ACCENT -> combining acute
  '\u0384': '\u0301', // ΄ GREEK TONOS -> combining acute
  '\u2032': '\u0301', // ′ PRIME -> combining acute (when after vowel)
  '\u0060': '\u0300', // ` GRAVE ACCENT -> combining grave
  '\u02CB': '\u0300', // ˋ MODIFIER LETTER GRAVE ACCENT -> combining grave
  '\u02DC': '\u0303', // ˜ SMALL TILDE -> combining tilde
  '\u02C0': '\u0309', // ˀ MODIFIER LETTER GLOTTAL STOP -> combining hook above
};

/**
 * Bảng ánh xạ ký tự Private Use Area (PUA: \uF020 - \uF0FF, \uF8E7) sinh ra bởi font
 * Symbol / Wingdings / MT Extra của Microsoft Word khi copy hoặc đọc từ file .docx.
 * Khắc phục triệt để lỗi ô vuông (□) ở mũi tên phản ứng hóa học và ký hiệu Toán - Lí.
 */
const SYMBOL_PUA_CHAR_MAP: Record<string, string> = {
  '\uF0AE': ' → ', // Symbol right arrow 
  '\uF0E0': ' → ', // Wingdings right arrow 
  '\uF0E8': ' → ', // Wingdings thick right arrow
  '\uF0F2': ' → ', // Wingdings arrows
  '\uF0DF': ' ← ', // Wingdings left arrow 
  '\uF0AC': ' ← ', // Symbol left arrow 
  '\uF0DB': ' ⇄ ', // Symbol left-right double arrow 
  '\uF0AB': ' ⇄ ', // Symbol bidirectional arrow 
  '\uF0D8': '↑',   // Wingdings/Symbol up arrow (khí thoát ra)
  '\uF0AD': '↑',   // Symbol up arrow 
  '\uF0DA': '↓',   // Wingdings/Symbol down arrow (kết tủa)
  '\uF0AF': '↓',   // Symbol down arrow 
  '\uF8E7': '⎯',   // Symbol horizontal arrow extender 
  '\uF0BE': '⎯',   // Symbol horizontal line extender 
  '\uF0B0': '°',   // Symbol degree sign 
  '\uF0D7': '×',   // Symbol multiplication sign 
  '\uF0B8': '÷',   // Symbol division sign 
  '\uF0B1': '±',   // Symbol plus-minus 
  '\uF0A3': '≤',   // Symbol less-than or equal 
  '\uF0B3': '≥',   // Symbol greater-than or equal 
  '\uF0B9': '≠',   // Symbol not equal 
  '\uF0BB': '≈',   // Symbol approximately equal 
  '\uF044': 'Δ',   // Symbol Delta 
  '\u2206': 'Δ',   // Increment ∆ -> Greek Delta Δ
  '\uF057': 'Ω',   // Symbol Omega 
  '\u2126': 'Ω',   // Ohm sign Ω -> Greek Omega Ω
  '\uF061': 'α',   // Symbol alpha
  '\uF062': 'β',   // Symbol beta
  '\uF067': 'γ',   // Symbol gamma
  '\uF06C': 'λ',   // Symbol lambda
  '\uF06D': 'μ',   // Symbol mu
  '\uF070': 'π',   // Symbol pi
  '\uF072': 'ρ',   // Symbol rho
};

const SYMBOL_PUA_REGEX = new RegExp(`[${Object.keys(SYMBOL_PUA_CHAR_MAP).join('')}]`, 'g');

/**
 * Chuẩn hóa văn bản về Unicode dựng sẵn (NFC) mà không làm biến dạng
 * chỉ số trên/dưới (₀-₉, ⁰-⁹, ⁺, ⁻), chữ Hy Lạp (α, β, γ, Δ, Ω) hay mũi tên (→, ⇌, ⇄).
 * Đồng thời khắc phục triệt để:
 * - Ký tự lỗi font Symbol/Wingdings PUA (\uF0AE, \uF0E0, \uF8E7...) từ Word
 * - Lỗi dấu rời bị tách khoảng trắng trước phụ âm cuối (ví dụ: "khô´ i" -> "khối", "châ´ t" -> "chất", "biê´ t" -> "biết", "bă` ng" -> "bằng", "sô´" -> "số")
 */
export function normalizeVietnameseUnicodeNFC(text: string): string {
  if (!text) return '';
  return text
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '') // Xóa zero-width space / BOM thừa từ Word
    .replace(/\u00A0/g, ' ') // Chuyển non-breaking space thành space chuẩn
    // 1. Chuyển đổi các ký tự PUA của font Symbol / Wingdings từ Word sang Unicode chuẩn
    .replace(SYMBOL_PUA_REGEX, (ch) => SYMBOL_PUA_CHAR_MAP[ch] ?? ch)
    // 2. Gộp các đoạn nối mũi tên dài (⎯⎯→, →, ───►) thành mũi tên chuẩn
    .replace(/[⎯─━―]{1,}\s*(?:→|➔|➜|➞|➡|►|>)/g, ' → ')
    // 3. Khắc phục dấu rời + khoảng trắng bị tách trước âm cuối tiếng Việt (ví dụ: "khô´ i" -> "khối", "châ´ t" -> "chất", "biê´ t" -> "biết", "bă` ng" -> "bằng")
    .replace(
      /([b-df-hj-np-tv-zđB-DF-HJ-NP-TV-ZĐ]+[aăâeêioôơuưyAĂÂEÊIOÔƠUƯY]+)[ \t]*([\u00B4\u02CA\u0384\u2032\u0060\u02CB\u02DC\u02C0\u0300\u0301\u0303\u0309\u0323])[ \t]+(ng|nh|ch|[ptcm]|i|u|y)\b(?![ \t]*[=.:)])/g,
      (_match, onsetVowel: string, accent: string, coda: string) =>
        `${onsetVowel}${SPACING_ACCENT_TO_COMBINING[accent] || accent}${coda}`
    )
    // Với nguyên âm ă/â (không bao giờ đứng cuối từ), cho phép gộp cả âm cuối n, o, a bị tách sau dấu rời (ví dụ: "phâ` n" -> "phần", "câ` n" -> "cần")
    .replace(
      /([ăâĂÂ])[ \t]*([\u00B4\u02CA\u0384\u2032\u0060\u02CB\u02DC\u02C0\u0300\u0301\u0303\u0309\u0323])[ \t]+(ng|nh|ch|[cmnptiuoya])\b(?![ \t]*[=.:)])/g,
      (_match, vowel: string, accent: string, coda: string) =>
        `${vowel}${SPACING_ACCENT_TO_COMBINING[accent] || accent}${coda}`
    )
    // 4. Gộp dấu tổ hợp bị tách bởi khoảng trắng ngay sau nguyên âm tiếng Việt (ví dụ: "khô \u0301i" -> "khô\u0301i")
    .replace(
      /([aăâeêioôơuưyAĂÂEÊIOÔƠUƯY])[ \t]+([\u0300\u0301\u0303\u0309\u0323])/g,
      '$1$2'
    )
    // 5. Chuyển dấu rời (´, ˊ, `, ˋ, ˜, ˀ) đứng ngay sau nguyên âm tiếng Việt thành dấu tổ hợp rồi chuẩn hóa NFC
    .replace(
      /([aăâeêioôơuưyAĂÂEÊIOÔƠUƯY])[ \t]*([\u00B4\u02CA\u0384\u0060\u02CB\u02DC\u02C0])(?=[a-zA-ZăâđêôơưĂÂĐÊÔƠƯ\s.,;:!?()[\]"'/-]|$)/g,
      (_match, vowel: string, accent: string) =>
        `${vowel}${SPACING_ACCENT_TO_COMBINING[accent] || accent}`
    )
    .normalize('NFC');
}

/**
 * Phát hiện đối tượng công thức cũ (MathType / OLE Object / Equation.DSMT4) không chuyển trực tiếp được sang văn bản
 */
export function detectLegacyOleEquations(textOrHtml: string): {
  hasOleEquation: boolean;
  count: number;
} {
  if (!textOrHtml) return { hasOleEquation: false, count: 0 };
  const matches = [
    ...textOrHtml.matchAll(
      /<w:object\b|<o:OLEObject\b|ProgId=["']Equation\.|MathType|\[OLE_EQUATION\]|\[OBJECT_EQUATION\]/gi
    ),
  ];
  return {
    hasOleEquation: matches.length > 0,
    count: matches.length,
  };
}

/**
 * Chuyển đổi thẻ OMML (<m:oMath>) của Microsoft Word sang chuỗi công thức chuẩn có thể đọc và hiển thị
 */
export function convertWordOmmlToReadableFormula(xmlOrHtml: string): string {
  if (!xmlOrHtml || !/<m:oMath/i.test(xmlOrHtml)) return xmlOrHtml;

  return xmlOrHtml.replace(/<m:oMath[^>]*>([\s\S]*?)<\/m:oMath>/gi, (_match, inner: string) => {
    let parsed = inner;

    // Phân số <m:f><m:num>...</m:num><m:den>...</m:den></m:f>
    parsed = parsed.replace(
      /<m:f[^>]*>[\s\S]*?<m:num[^>]*>([\s\S]*?)<\/m:num>[\s\S]*?<m:den[^>]*>([\s\S]*?)<\/m:den>[\s\S]*?<\/m:f>/gi,
      (_f, num: string, den: string) => {
        const cleanNum = num.replace(/<[^>]+>/g, '').trim();
        const cleanDen = den.replace(/<[^>]+>/g, '').trim();
        return `\\frac{${cleanNum}}{${cleanDen}}`;
      }
    );

    // Căn bậc hai <m:rad>...<m:e>...</m:e></m:rad>
    parsed = parsed.replace(
      /<m:rad[^>]*>[\s\S]*?<m:e[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:rad>/gi,
      (_r, expr: string) => {
        const cleanExpr = expr.replace(/<[^>]+>/g, '').trim();
        return `√(${cleanExpr})`;
      }
    );

    // Chỉ số dưới <m:sSub><m:e>...</m:e><m:sub>...</m:sub></m:sSub>
    parsed = parsed.replace(
      /<m:sSub[^>]*>[\s\S]*?<m:e[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<m:sub[^>]*>([\s\S]*?)<\/m:sub>[\s\S]*?<\/m:sSub>/gi,
      (_s, base: string, sub: string) => {
        const cleanBase = base.replace(/<[^>]+>/g, '').trim();
        const cleanSub = sub.replace(/<[^>]+>/g, '').trim();
        return `${cleanBase}<sub>${cleanSub}</sub>`;
      }
    );

    // Chỉ số trên <m:sSup><m:e>...</m:e><m:sup>...</m:sup></m:sSup>
    parsed = parsed.replace(
      /<m:sSup[^>]*>[\s\S]*?<m:e[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<m:sup[^>]*>([\s\S]*?)<\/m:sup>[\s\S]*?<\/m:sSup>/gi,
      (_s, base: string, sup: string) => {
        const cleanBase = base.replace(/<[^>]+>/g, '').trim();
        const cleanSup = sup.replace(/<[^>]+>/g, '').trim();
        return `${cleanBase}<sup>${cleanSup}</sup>`;
      }
    );

    // Ký tự n-ary hoặc mũi tên kèm điều kiện trong OMML (<m:limUpp> / <m:limLow>)
    parsed = parsed.replace(
      /<m:limUpp[^>]*>[\s\S]*?<m:e[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<m:lim[^>]*>([\s\S]*?)<\/m:lim>[\s\S]*?<\/m:limUpp>/gi,
      (_l, base: string, lim: string) => {
        const cleanBase = base.replace(/<[^>]+>/g, '').trim();
        const cleanLim = lim.replace(/<[^>]+>/g, '').trim();
        if (/[→➔⟶⇄⇌]|->|-->/.test(cleanBase)) {
          return ` → (${cleanLim}) `;
        }
        return `${cleanBase}(${cleanLim})`;
      }
    );

    // Lấy toàn bộ text trong <m:t> còn lại
    const textOnly = parsed.replace(/<(?!\/?(?:sub|sup)\b)[^>]+>/gi, '').trim();
    return textOnly;
  });
}

const TCVN3_MARKER_REGEX =
  /[µ¸¶·¹¨¾»¼½Æ©ÊÇÈÉË®§ÐÌÎÏÑªÕÒÓÔÖÝ×ØÜÞßáâãä«èåæçé¬íêëìîïñòóô­øõö÷ùúûüýþ¡¢£¤¥¦]/;

const UNAMBIGUOUS_TCVN3_MARKER_REGEX =
  /[µ¸¶·¹¨¾»¼½Æ©ÊÇÈÉË®§ÐÌÎÏÑªÕÒÓÔÖÝ×ØÜÞß«¬­÷øþ¡¢£¤¥¦]/;

const PRECOMPOSED_VIETNAMESE_UNICODE_REGEX =
  /[\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0\u1EA0-\u1EF9]/;

/**
 * Chuyển đổi văn bản từ bảng mã cũ (TCVN3, VNI-Windows, UTF-8 Mojibake, NFD) sang Unicode dựng sẵn (NFC)
 */
export function convertLegacyVietnameseToUnicode(
  text: string,
  encoding?: LegacyEncodingType
): string {
  if (!text) return '';
  // Trước tiên gộp các dấu rời bị tách khoảng trắng (khô´ i -> khối, châ´ t -> chất, bă` ng -> bằng)
  let result = normalizeVietnameseUnicodeNFC(text);

  const targetEncoding = encoding || detectLegacyVietnameseEncoding(result).detectedEncoding;

  if (targetEncoding === 'utf8_mojibake') {
    try {
      // Khôi phục chuỗi UTF-8 bị đọc nhầm theo Latin-1 (ví dụ: "HÃ²a tan" -> "Hòa tan")
      const bytes = new Uint8Array([...result].map((ch) => ch.charCodeAt(0) & 0xff));
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      if (decoded && !decoded.includes('\uFFFD')) {
        result = decoded;
      }
    } catch {
      // Giữ nguyên nếu không giải mã được
    }
  } else if (targetEncoding === 'tcvn3') {
    const isMixedUnicodeDoc = PRECOMPOSED_VIETNAMESE_UNICODE_REGEX.test(result);
    const tokenMarkerRegex = isMixedUnicodeDoc
      ? UNAMBIGUOUS_TCVN3_MARKER_REGEX
      : TCVN3_MARKER_REGEX;

    result = result
      .split(/(\s+)/)
      .map((token) => {
        if (/^[0-9+\-*/=÷×°()[\].,;:]+$/.test(token)) return token;
        if (PRECOMPOSED_VIETNAMESE_UNICODE_REGEX.test(token)) return token;
        if (!tokenMarkerRegex.test(token)) return token;
        let out = '';
        for (const ch of token) {
          out += TCVN3_CHAR_MAP[ch] ?? ch;
        }
        return out;
      })
      .join('');
  } else if (targetEncoding === 'vni') {
    for (const [pattern, replacement] of VNI_SEQUENCE_RULES) {
      result = result.replace(pattern, replacement);
    }
  } else {
    // Ngay cả khi văn bản đa phần là Unicode, vẫn quét và sửa các cụm từ TCVN3 bị lẫn vào do copy-paste từ nhiều nguồn
    for (const rule of TCVN3_WORD_PATTERNS) {
      result = result.replace(rule.pattern, rule.replacement);
      rule.pattern.lastIndex = 0;
    }
    if (UNAMBIGUOUS_TCVN3_MARKER_REGEX.test(result)) {
      result = result
        .split(/(\s+)/)
        .map((token) => {
          if (PRECOMPOSED_VIETNAMESE_UNICODE_REGEX.test(token)) return token;
          if (!UNAMBIGUOUS_TCVN3_MARKER_REGEX.test(token)) return token;
          let out = '';
          for (const ch of token) {
            out += TCVN3_CHAR_MAP[ch] ?? ch;
          }
          return out;
        })
        .join('');
    }
  }

  return normalizeVietnameseUnicodeNFC(result);
}

/**
 * Kiểm tra và phát hiện văn bản có bị lỗi font TCVN3, VNI-Windows, UTF-8 Mojibake hoặc Unicode tổ hợp (NFD)
 */
export function detectLegacyVietnameseEncoding(
  rawText: string,
  rawHtml = ''
): EncodingDetectionResult {
  const oleCheck = detectLegacyOleEquations(`${rawText}\n${rawHtml}`);
  if (!rawText || !rawText.trim()) {
    return {
      detectedEncoding: 'unicode_nfc',
      confidence: 'high',
      hasLegacyFontIssue: false,
      hasOleEquationWarning: oleCheck.hasOleEquation,
      oleEquationCount: oleCheck.count,
      warningMessage: oleCheck.hasOleEquation
        ? `Phát hiện ${oleCheck.count} công thức dạng đối tượng cũ (MathType/OLE). Hệ thống đã giữ nguyên hình ảnh và đánh dấu để giáo viên kiểm tra.`
        : null,
      sampleMatchedTokens: [],
      previewConvertedText: '',
    };
  }

  // 1. Kiểm tra UTF-8 Mojibake (ví dụ: "HÃ²a tan", "nguyÃªn tá»­", "Ä‘iá»‡n")
  const mojibakeMatches = rawText.match(/(?:Ã[0-9a-zA-Z¡-ÿ]|á»[\x80-\xbf¡-ÿ]|Ä‘|Æ°|Æ¡)/g) || [];
  if (mojibakeMatches.length >= 2) {
    const converted = convertLegacyVietnameseToUnicode(rawText, 'utf8_mojibake');
    return {
      detectedEncoding: 'utf8_mojibake',
      confidence: 'high',
      hasLegacyFontIssue: true,
      hasOleEquationWarning: oleCheck.hasOleEquation,
      oleEquationCount: oleCheck.count,
      warningMessage:
        'Phát hiện văn bản bị lỗi giải mã ký tự UTF-8 (Mojibake). Giáo viên có thể xem trước và bấm xác nhận để chuẩn hóa về tiếng Việt Unicode.',
      sampleMatchedTokens: Array.from(new Set(mojibakeMatches)).slice(0, 5),
      previewConvertedText: converted,
    };
  }

  // 2. Kiểm tra TCVN3 / ABC (ví dụ: "Hoµ tan", "dung dÞch", "ph¶n øng", "khèi l­îng", "C©u 1")
  const matchedTcvnLabels: string[] = [];
  for (const rule of TCVN3_WORD_PATTERNS) {
    if (rule.pattern.test(rawText)) {
      matchedTcvnLabels.push(rule.label);
    }
    rule.pattern.lastIndex = 0;
  }
  const tcvnCharHits =
    rawText.match(
      /(?:[b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z][µ¸¶·¹¨¾»¼½Æ©ÊÇÈÉËÐÌÎÏÑªÕÒÓÔÖÝ×ØÜÞ«èåæç¬ëî­ø÷]|[®§])/g
    ) || [];

  if (matchedTcvnLabels.length >= 1 || tcvnCharHits.length >= 2) {
    const converted = convertLegacyVietnameseToUnicode(rawText, 'tcvn3');
    return {
      detectedEncoding: 'tcvn3',
      confidence: matchedTcvnLabels.length >= 1 ? 'high' : 'medium',
      hasLegacyFontIssue: true,
      hasOleEquationWarning: oleCheck.hasOleEquation,
      oleEquationCount: oleCheck.count,
      warningMessage:
        'Phát hiện tài liệu sử dụng bảng mã cũ TCVN3 (ABC - ví dụ .VnTime). Hãy xem trước bản chuyển mã sang Unicode chuẩn và bấm xác nhận.',
      sampleMatchedTokens:
        matchedTcvnLabels.length > 0 ? matchedTcvnLabels.slice(0, 5) : tcvnCharHits.slice(0, 5),
      previewConvertedText: converted,
    };
  }

  // 3. Kiểm tra VNI-Windows (ví dụ: "Hoøa tan", "ñieän", "phaûn öùng", "Caâu 1", "löôïng")
  const vniHits =
    rawText.match(
      /\b(?:Hoøa|hoøa|hoøan|toaøn|phaûn|öùng|ñieän|Ñieän|ñaùp|Ñaùp|ñöôïc|Caâu|caâu|khoái|löôïng|theå)\b/g
    ) || [];
  if (vniHits.length >= 1) {
    const converted = convertLegacyVietnameseToUnicode(rawText, 'vni');
    return {
      detectedEncoding: 'vni',
      confidence: 'high',
      hasLegacyFontIssue: true,
      hasOleEquationWarning: oleCheck.hasOleEquation,
      oleEquationCount: oleCheck.count,
      warningMessage:
        'Phát hiện tài liệu sử dụng bảng mã cũ VNI-Windows (ví dụ VNI-Times). Hãy xem trước bản chuyển mã sang Unicode chuẩn và bấm xác nhận.',
      sampleMatchedTokens: Array.from(new Set(vniHits)).slice(0, 5),
      previewConvertedText: converted,
    };
  }

  // 4. Kiểm tra Unicode tổ hợp (NFD) -> tự động chuẩn hóa NFC
  const nfcText = normalizeVietnameseUnicodeNFC(rawText);
  const isNfd = nfcText !== rawText && /[\u0300-\u0309\u0323]/.test(rawText);

  return {
    detectedEncoding: isNfd ? 'unicode_nfd' : 'unicode_nfc',
    confidence: 'high',
    hasLegacyFontIssue: false,
    hasOleEquationWarning: oleCheck.hasOleEquation,
    oleEquationCount: oleCheck.count,
    warningMessage: oleCheck.hasOleEquation
      ? `Phát hiện ${oleCheck.count} công thức dạng đối tượng cũ (MathType/OLE). Hệ thống đã giữ nguyên hình ảnh và đánh dấu để giáo viên kiểm tra.`
      : null,
    sampleMatchedTokens: [],
    previewConvertedText: nfcText,
  };
}
