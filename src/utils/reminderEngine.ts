/**
 * Daily Study Goal & Push-Like Notification Engine
 * KHTN THẦY HOÀNG - GDPT 2018
 */

export interface DailyStudyGoal {
  targetMinutes: number; // e.g. 20 minutes
  targetLessonsCount: number; // e.g. 1 lesson
  targetQuizCount: number; // e.g. 1 quiz
  reminderTime: string; // "HH:MM", e.g. "19:30"
  enabled: boolean;
  browserPushEnabled: boolean;
  soundEnabled: boolean;
}

export interface DailyStudyProgress {
  date: string; // YYYY-MM-DD
  minutesStudied: number;
  lessonsCompletedToday: string[];
  quizzesTakenToday: { quizId: string; score: number }[];
  simulationsCompletedToday: string[];
  goalCompleted: boolean;
  streakDays: number;
}

export type NotificationType = 'reminder_start' | 'reminder_halfway' | 'congratulations' | 'weak_topic_review' | 'streak_alert';

export interface StudyNotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  actionUrl: string;
  actionLabel: string;
  timestamp: string; // ISO
  read: boolean;
  priority: 'low' | 'normal' | 'high';
}

export const DEFAULT_DAILY_GOAL: DailyStudyGoal = {
  targetMinutes: 20,
  targetLessonsCount: 1,
  targetQuizCount: 1,
  reminderTime: '19:30',
  enabled: true,
  browserPushEnabled: false,
  soundEnabled: true,
};

/**
 * Returns today's date string YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate completion percentage of today's study goals (0 - 100%)
 */
export function calculateGoalProgress(
  goal: DailyStudyGoal,
  progress: DailyStudyProgress
): {
  overallPercent: number;
  minutesPercent: number;
  lessonsPercent: number;
  quizzesPercent: number;
  isCompleted: boolean;
} {
  const targetMins = Math.max(1, goal.targetMinutes);
  const targetLessons = Math.max(1, goal.targetLessonsCount);
  const targetQuizzes = Math.max(1, goal.targetQuizCount);

  const minutesPercent = Math.min(100, Math.round((progress.minutesStudied / targetMins) * 100));
  const lessonsPercent = Math.min(
    100,
    Math.round((progress.lessonsCompletedToday.length / targetLessons) * 100)
  );
  const quizzesPercent = Math.min(
    100,
    Math.round((progress.quizzesTakenToday.length / targetQuizzes) * 100)
  );

  // Weighted overall: 40% time, 30% lessons, 30% quizzes
  const overallPercent = Math.min(
    100,
    Math.round(minutesPercent * 0.4 + lessonsPercent * 0.3 + quizzesPercent * 0.3)
  );

  const isCompleted =
    progress.minutesStudied >= goal.targetMinutes &&
    progress.lessonsCompletedToday.length >= goal.targetLessonsCount;

  return {
    overallPercent,
    minutesPercent,
    lessonsPercent,
    quizzesPercent,
    isCompleted,
  };
}

/**
 * Evaluates whether a push notification reminder should be triggered right now
 */
export function evaluateStudyReminder(
  goal: DailyStudyGoal,
  progress: DailyStudyProgress,
  studentName = 'Học sinh',
  weakTopic?: { topicName: string; simId?: string; quizId?: string }
): StudyNotificationItem | null {
  if (!goal.enabled) {
    return null;
  }

  const { overallPercent, isCompleted } = calculateGoalProgress(goal, progress);
  const now = new Date();
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = now.toISOString();

  // 1. Goal already completed
  if (isCompleted || overallPercent >= 100) {
    return {
      id,
      type: 'congratulations',
      title: '🎉 Mục tiêu hôm nay đã hoàn thành xuất sắc!',
      body: `Chúc mừng ${studentName}! Em đã hoàn thành mục tiêu ${progress.minutesStudied} phút học và duy trì chuỗi ${progress.streakDays} ngày chăm chỉ.`,
      actionUrl: '/tien-do',
      actionLabel: 'Xem bảng thành tích',
      timestamp,
      read: false,
      priority: 'normal',
    };
  }

  // 2. Weak topic needs review
  if (weakTopic && progress.minutesStudied < 10) {
    return {
      id,
      type: 'weak_topic_review',
      title: `💡 Thầy Hoàng nhắc ôn tập: ${weakTopic.topicName}`,
      body: `Em cần củng cố kiến thức chuyên đề "${weakTopic.topicName}". Dành 5-10 phút thực hành mô phỏng 3D để nắm chắc bài nhé!`,
      actionUrl: weakTopic.quizId ? `/luyen-tap?quizId=${weakTopic.quizId}` : '/phong-thi-nghiem-3d',
      actionLabel: 'Ôn tập ngay',
      timestamp,
      read: false,
      priority: 'high',
    };
  }

  // 3. Halfway progress reminder
  if (overallPercent >= 40 && overallPercent < 100) {
    const remainingMins = Math.max(1, goal.targetMinutes - progress.minutesStudied);
    return {
      id,
      type: 'reminder_halfway',
      title: `⚡ Sắp chạm mốc mục tiêu ngày (Đã đạt ${overallPercent}%)`,
      body: `Chỉ còn ${remainingMins} phút nữa để hoàn thành mục tiêu học tập KHTN hôm nay. Cố lên nhé ${studentName}!`,
      actionUrl: '/luyen-tap',
      actionLabel: 'Tiếp tục luyện tập',
      timestamp,
      read: false,
      priority: 'high',
    };
  }

  // 4. Haven't started yet today
  return {
    id,
    type: 'reminder_start',
    title: '🔔 Đã đến giờ học KHTN cùng Thầy Hoàng!',
    body: `Chào ${studentName}! Hôm nay em chưa ghi nhận thời gian học tập. Hãy dành 15-20 phút khám phá phòng thí nghiệm 3D để giữ vững chuỗi ${progress.streakDays} ngày nhé!`,
    actionUrl: '/phong-thi-nghiem-3d',
    actionLabel: 'Vào phòng lab 3D',
    timestamp,
    read: false,
    priority: 'high',
  };
}

/**
 * Dispatch Browser Native Web Notification with fallback safety
 */
export async function triggerBrowserPushNotification(
  notification: StudyNotificationItem,
  onNavigate?: (url: string) => void
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      const nativeNotif = new Notification(notification.title, {
        body: notification.body,
        icon: '/favicon.ico',
        tag: notification.type,
      });

      nativeNotif.onclick = () => {
        window.focus();
        nativeNotif.close();
        if (onNavigate && notification.actionUrl) {
          onNavigate(notification.actionUrl);
        }
      };

      return true;
    }
  } catch (err) {
    console.warn('Browser Push Notification was prevented by environment/policy:', err);
  }
  return false;
}
