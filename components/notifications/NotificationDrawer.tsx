import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Award,
  BookOpen,
  Volume2,
  VolumeX,
  Send,
  Trash2,
  CheckCheck,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext.tsx';
import { calculateGoalProgress } from '../../utils/reminderEngine.ts';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    dailyGoal,
    dailyProgress,
    browserPermission,
    requestBrowserPushPermission,
    updateDailyGoal,
    triggerManualReminder,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
  } = useNotification();

  const [activeTab, setActiveTab] = useState<'notifs' | 'settings'>('notifs');
  const [isSendingTest, setIsSendingTest] = useState(false);

  if (!isOpen) return null;

  const goalProgress = calculateGoalProgress(dailyGoal, dailyProgress);

  const handleSendTest = async () => {
    setIsSendingTest(true);
    await triggerManualReminder(
      'Mạch điện & Định luật Ôm',
      'quiz-circuit-8'
    );
    setTimeout(() => setIsSendingTest(false), 600);
  };

  const handleAction = (url: string, id: string) => {
    markAsRead(id);
    onClose();
    if (url) {
      navigate(url);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'congratulations':
        return <Award className="w-4 h-4 text-amber-500" />;
      case 'weak_topic_review':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'reminder_halfway':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'reminder_start':
      default:
        return <Bell className="w-4 h-4 text-teal-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Thông Báo & Nhắc Nhở Học Tập
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Chuỗi học tập: <strong className="text-amber-500">🔥 {dailyProgress.streakDays} ngày liên tiếp</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Daily Goal Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-slate-50 dark:via-slate-800/40 to-indigo-500/10 border border-teal-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Mục tiêu hôm nay: {dailyProgress.minutesStudied} / {dailyGoal.targetMinutes} phút
              </span>
              <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                {goalProgress.overallPercent}%
              </span>
            </div>

            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${goalProgress.overallPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <span>{dailyProgress.lessonsCompletedToday.length} bài học hoàn thành</span>
              <span>{goalProgress.isCompleted ? '✅ Đã hoàn thành' : '⏳ Đang thực hiện'}</span>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('notifs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'notifs'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Lịch sử nhắc nhở ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Cài đặt giờ nhắc</span>
            </button>
          </div>

          {/* Tab 1: Notifications List */}
          {activeTab === 'notifs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Thông báo gần đây</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllAsRead}
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition"
                  >
                    Đã đọc tất cả
                  </button>
                  <span>•</span>
                  <button
                    onClick={clearAllNotifications}
                    className="hover:text-red-500 transition"
                  >
                    Xóa hết
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Bell className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">Không có thông báo mới.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-2xl border transition space-y-2 ${
                      n.read
                        ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-80'
                        : 'bg-white dark:bg-slate-800 border-teal-500/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 shrink-0 mt-0.5">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                            {n.title}
                          </h4>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {n.body}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-400">
                        {new Date(n.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        onClick={() => handleAction(n.actionUrl, n.id)}
                        className="text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>{n.actionLabel || 'Xem ngay'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Settings & Goal Customization */}
          {activeTab === 'settings' && (
            <div className="space-y-4 text-xs">
              {/* Native Push Permission status */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Thông báo đẩy trình duyệt (Web Push)
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      browserPermission === 'granted'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : browserPermission === 'denied'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {browserPermission === 'granted'
                      ? 'ĐÃ BẬT'
                      : browserPermission === 'denied'
                      ? 'BỊ CHẶN'
                      : 'CHƯA BẬT'}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Nhận thông báo nhắc nhở ngay cả khi đang xem tài liệu hoặc chuyển tab khác.
                </p>
                {browserPermission !== 'granted' && (
                  <button
                    onClick={requestBrowserPushPermission}
                    className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition"
                  >
                    Cho phép thông báo trình duyệt
                  </button>
                )}
              </div>

              {/* Goal time selection */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Mục tiêu thời gian học mỗi ngày:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 20, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => updateDailyGoal({ targetMinutes: mins })}
                      className={`py-2 rounded-xl text-center font-bold transition ${
                        dailyGoal.targetMinutes === mins
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {mins} phút
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound and Reminder toggles */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Âm thanh chuông báo (Chime)
                  </span>
                  <input
                    type="checkbox"
                    checked={dailyGoal.soundEnabled}
                    onChange={(e) => updateDailyGoal({ soundEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 accent-teal-600"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Bật nhắc nhở thông minh
                  </span>
                  <input
                    type="checkbox"
                    checked={dailyGoal.enabled}
                    onChange={(e) => updateDailyGoal({ enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-600 accent-teal-600"
                  />
                </label>
              </div>

              {/* Test button */}
              <div className="pt-2">
                <button
                  onClick={handleSendTest}
                  disabled={isSendingTest}
                  className="w-full py-2.5 rounded-xl border border-teal-500/50 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold hover:bg-teal-100 dark:hover:bg-teal-900/50 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingTest ? 'Đang gửi...' : 'Gửi thử thông báo nhắc nhở ngay'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Chuẩn GDPT 2018</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
