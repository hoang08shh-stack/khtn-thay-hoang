import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Sparkles,
  Zap,
  Award,
  BookOpen,
  X,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { StudyNotificationItem } from '../../utils/reminderEngine.ts';

interface PushNotificationToastProps {
  notification: StudyNotificationItem | null;
  onDismiss: () => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  notification,
  onDismiss,
}) => {
  const navigate = useNavigate();

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'congratulations':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'weak_topic_review':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'reminder_halfway':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'reminder_start':
      default:
        return <Bell className="w-5 h-5 text-teal-400" />;
    }
  };

  const handleAction = () => {
    onDismiss();
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div className="bg-[#0B1F3A]/95 dark:bg-[#071527]/95 border-2 border-teal-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-white space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
              {getIcon()}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">
                KHTN Thầy Hoàng • Nhắc nhở
              </span>
              <span className="text-[10px] text-slate-400">Vừa xong</span>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
            {notification.title}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {notification.body}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-1 flex items-center justify-end gap-2">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Để sau
          </button>
          <button
            onClick={handleAction}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/30 flex items-center gap-1.5"
          >
            <span>{notification.actionLabel || 'Xem ngay'}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
