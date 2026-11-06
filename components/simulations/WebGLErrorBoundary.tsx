import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Cpu, ExternalLink } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Trình duyệt không thể khởi tạo bộ xử lý đồ họa WebGL.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGLErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[500px] min-h-[350px] bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 flex flex-col items-center justify-center p-6 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
            <Cpu className="w-8 h-8" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            {this.props.fallbackTitle || 'Không thể hiển thị môi trường mô phỏng 3D'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            Thiết bị hoặc trình duyệt của bạn đang tắt chế độ tăng tốc phần cứng đồ họa (Hardware Acceleration), hoặc card đồ họa không tương thích với chuẩn WebGL/WebGL2.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-md text-left text-xs text-slate-300 space-y-2 mb-6">
            <p className="font-semibold text-teal-400">Cách khắc phục nhanh:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Mở cài đặt trình duyệt Chrome/Edge: gõ <code className="text-teal-300 bg-slate-800 px-1 py-0.5 rounded">chrome://settings/system</code></li>
              <li>Bật tùy chọn: <strong>Sử dụng tính năng tăng tốc phần cứng khi khả dụng</strong>.</li>
              <li>Khởi động lại trình duyệt và tải lại trang.</li>
            </ul>
          </div>

          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition shadow-lg shadow-teal-600/30"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử tải lại mô phỏng</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
