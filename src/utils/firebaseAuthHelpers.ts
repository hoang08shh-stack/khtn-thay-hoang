export interface FirebaseAuthErrorReport {
  code: string;
  message: string;
  hint?: string;
  shouldSuggestNewTab?: boolean;
  unauthorizedHost?: string;
  firebaseConsoleAuthUrl?: string;
}

export interface FirebaseAuthErrorContext {
  hostname?: string;
  inIframe?: boolean;
  projectId?: string;
  adminEmail?: string;
}

export function isRunningInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function extractFirebaseAuthErrorCode(error: unknown): string {
  if (!error) return 'auth/unknown';
  if (typeof error === 'object' && error !== null) {
    const rawCode = (error as { code?: unknown }).code;
    if (typeof rawCode === 'string' && rawCode.trim()) {
      return rawCode.trim().toLowerCase();
    }
  }
  const msg = error instanceof Error ? error.message : String(error);
  const parenMatch = msg.match(/\((auth\/[a-z0-9\-]+)\)/i);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].toLowerCase();
  }
  const plainMatch = msg.match(/\b(auth\/[a-z0-9\-]+)\b/i);
  if (plainMatch && plainMatch[1]) {
    return plainMatch[1].toLowerCase();
  }
  return 'auth/unknown';
}

export function formatFirebaseAuthError(
  error: unknown,
  context: FirebaseAuthErrorContext = {}
): FirebaseAuthErrorReport {
  const code = extractFirebaseAuthErrorCode(error);
  const hostname =
    context.hostname ??
    (typeof window !== 'undefined' ? window.location.hostname : '');
  const inIframe = context.inIframe ?? isRunningInIframe();
  const projectId = context.projectId || '';
  const adminEmail = context.adminEmail || 'hoang08shh@gmail.com';
  const consoleAuthUrl = projectId
    ? `https://console.firebase.google.com/project/${projectId}/authentication/settings`
    : undefined;

  switch (code) {
    case 'auth/popup-blocked':
      return {
        code,
        message:
          'Trình duyệt đang chặn cửa sổ bật lên (popup) đăng nhập Google Firebase.',
        hint: inIframe
          ? 'Bạn đang mở web bên trong khung xem trước (iframe). Hãy bấm nút "Mở trang ở tab mới" bên dưới rồi đăng nhập Google lại.'
          : 'Hãy cho phép cửa sổ bật lên (Allow pop-ups) cho trang web này hoặc bấm "Mở trang ở tab mới" rồi thử lại.',
        shouldSuggestNewTab: true,
      };

    case 'auth/popup-closed-by-user':
      return {
        code,
        message:
          'Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất xác thực.',
        hint: inIframe
          ? 'Nếu cửa sổ tự đóng ngay lập tức do khung xem trước (iframe) hạn chế cookie/popup, hãy bấm "Mở trang ở tab mới" để đăng nhập ổn định.'
          : `Hãy bấm thử lại và chọn tài khoản Google Quản trị (${adminEmail}).`,
        shouldSuggestNewTab: inIframe,
      };

    case 'auth/cancelled-popup-request':
      return {
        code,
        message:
          'Đang có một cửa sổ đăng nhập Google khác chờ xử lý. Vui lòng hoàn tất hoặc đóng cửa sổ đó rồi bấm lại.',
        hint: inIframe
          ? 'Hoặc bấm "Mở trang ở tab mới" để đăng nhập trực tiếp không bị xung đột khung xem trước.'
          : undefined,
        shouldSuggestNewTab: inIframe,
      };

    case 'auth/unauthorized-domain':
      return {
        code,
        message: `Tên miền hiện tại (${hostname || 'không xác định'}) chưa được cấp phép đăng nhập Google trong Firebase Authentication.`,
        hint: `Hãy mở đúng đường link xem trước/chia sẻ AI Studio đã cấp phép, hoặc thêm tên miền "${hostname}" vào mục Firebase Console → Authentication → Settings → Authorized domains.`,
        unauthorizedHost: hostname || undefined,
        firebaseConsoleAuthUrl: consoleAuthUrl,
      };

    case 'auth/operation-not-allowed':
      return {
        code,
        message:
          'Phương thức đăng nhập bằng Google chưa được bật trong dự án Firebase này.',
        hint: 'Vui lòng bật Google Sign-In tại Firebase Console → Authentication → Sign-in method.',
        firebaseConsoleAuthUrl: consoleAuthUrl,
      };

    case 'auth/operation-not-supported-in-this-environment':
    case 'auth/web-storage-unsupported':
      return {
        code,
        message:
          'Trình duyệt hiện tại (chế độ ẩn danh, trình duyệt trong Zalo/Facebook hoặc khung xem trước) đang chặn bộ nhớ phiên đăng nhập Google.',
        hint: 'Hãy bấm "Mở trang ở tab mới" bằng trình duyệt Chrome hoặc Safari bên ngoài rồi đăng nhập lại.',
        shouldSuggestNewTab: true,
      };

    case 'auth/network-request-failed':
      return {
        code,
        message:
          'Không thể kết nối tới máy chủ xác thực Google Firebase (lỗi mạng hoặc bị tường lửa/trình chặn quảng cáo chặn).',
        hint: 'Hãy kiểm tra kết nối Internet, tắt tạm trình chặn quảng cáo/VPN rồi bấm thử lại.',
      };

    case 'auth/internal-error':
      return {
        code,
        message:
          'Lỗi nội bộ khi mở cổng đăng nhập Google Firebase (thường do cookie bên thứ ba bị chặn trong khung xem trước).',
        hint: 'Hãy bấm "Mở trang ở tab mới" rồi đăng nhập Google lại.',
        shouldSuggestNewTab: true,
      };

    case 'auth/admin-email-mismatch': {
      const rawMsg = error instanceof Error ? error.message : String(error || '');
      return {
        code,
        message:
          rawMsg ||
          `Tài khoản Google vừa chọn không có quyền Quản trị viên. Vui lòng chọn đúng tài khoản ${adminEmail}.`,
        hint: `Chỉ tài khoản quản trị (${adminEmail}) hoặc tài khoản đã được cấp quyền trong bảng admins mới có quyền đẩy bài giảng lên Firebase Cloud.`,
      };
    }

    default: {
      const rawMsg = error instanceof Error ? error.message : String(error || '');
      return {
        code,
        message: rawMsg
          ? `Không thể đăng nhập Google Firebase (${code}): ${rawMsg}`
          : `Không thể đăng nhập Google Firebase (${code}). Vui lòng thử lại hoặc mở trang ở tab mới.`,
        hint: inIframe
          ? 'Bạn đang mở trong khung xem trước. Bấm "Mở trang ở tab mới" thường khắc phục ngay lỗi đăng nhập Google.'
          : undefined,
        shouldSuggestNewTab: inIframe,
      };
    }
  }
}

export function truncateUtf8Bytes(input: string, maxBytes: number): string {
  if (!input || maxBytes <= 0) return '';
  const encoder = new TextEncoder();
  const encoded = encoder.encode(input);
  if (encoded.byteLength <= maxBytes) return input;

  // Binary search on UTF-16 code units so we never cut a surrogate pair or multi-byte char in half
  let low = 0;
  let high = input.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const slice = input.slice(0, mid);
    if (encoder.encode(slice).byteLength <= maxBytes) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  let safeEnd = low;
  // Avoid leaving a trailing high surrogate
  if (safeEnd > 0) {
    const lastCode = input.charCodeAt(safeEnd - 1);
    if (lastCode >= 0xd800 && lastCode <= 0xdbff) {
      safeEnd -= 1;
    }
  }
  return input.slice(0, safeEnd);
}
