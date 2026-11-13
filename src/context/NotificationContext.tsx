import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DailyStudyGoal,
  DailyStudyProgress,
  StudyNotificationItem,
  DEFAULT_DAILY_GOAL,
  getTodayDateString,
  calculateGoalProgress,
  evaluateStudyReminder,
  triggerBrowserPushNotification,
} from '../utils/reminderEngine.ts';
import { useAuth } from './AuthContext.tsx';
import confetti from 'canvas-confetti';

interface NotificationContextType {
  notifications: StudyNotificationItem[];
  unreadCount: number;
  dailyGoal: DailyStudyGoal;
  dailyProgress: DailyStudyProgress;
  browserPermission: NotificationPermission | 'unsupported';
  activePushToast: StudyNotificationItem | null;
  requestBrowserPushPermission: () => Promise<boolean>;
  updateDailyGoal: (updates: Partial<DailyStudyGoal>) => void;
  triggerManualReminder: (topicName?: string, quizId?: string) => Promise<StudyNotificationItem | null>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  dismissPushToast: () => void;
  logStudyActivity: (minutes: number, lessonId?: string, simulationId?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_GOAL = 'khtn_daily_goal';
const LOCAL_STORAGE_KEY_PROGRESS = 'khtn_daily_progress';
const LOCAL_STORAGE_KEY_NOTIFS = 'khtn_notifications';

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const today = getTodayDateString();

  // Load saved daily goal
  const [dailyGoal, setDailyGoal] = useState<DailyStudyGoal>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_GOAL);
      if (saved) return { ...DEFAULT_DAILY_GOAL, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_DAILY_GOAL;
  });

  // Load saved daily progress
  const [dailyProgress, setDailyProgress] = useState<DailyStudyProgress>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PROGRESS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) return parsed;
      }
    } catch {}
    return {
      date: today,
      minutesStudied: 0,
      lessonsCompletedToday: [],
      quizzesTakenToday: [],
      simulationsCompletedToday: [],
      goalCompleted: false,
      streakDays: 4,
    };
  });

  // Load saved notification history
  const [notifications, setNotifications] = useState<StudyNotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_NOTIFS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'initial_welcome_notif',
        type: 'reminder_start',
        title: '🔔 Chào mừng em đến với KHTN Thầy Hoàng',
        body: 'Mục tiêu hôm nay: 20 phút khám phá mô phỏng 3D và ôn tập bài học. Chúc em học tốt!',
        actionUrl: '/phong-thi-nghiem-3d',
        actionLabel: 'Khám phá ngay',
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'normal',
      },
    ];
  });

  const [activePushToast, setActivePushToast] = useState<StudyNotificationItem | null>(null);

  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_GOAL, JSON.stringify(dailyGoal));
    } catch {}
  }, [dailyGoal]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROGRESS, JSON.stringify(dailyProgress));
    } catch {}
  }, [dailyProgress]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Request browser notification permission
  const requestBrowserPushPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserPermission('unsupported');
      return false;
    }
    try {
      const res = await Notification.requestPermission();
      setBrowserPermission(res);
      const isGranted = res === 'granted';
      setDailyGoal((prev) => ({ ...prev, browserPushEnabled: isGranted }));
      return isGranted;
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
      return false;
    }
  };

  const updateDailyGoal = (updates: Partial<DailyStudyGoal>) => {
    setDailyGoal((prev) => ({ ...prev, ...updates }));
  };

  // Play gentle notification sound (Web Audio API synthetic chime)
  const playChimeSound = () => {
    if (!dailyGoal.soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  // Trigger and display a notification
  const dispatchNotification = async (item: StudyNotificationItem) => {
    // Add to state
    setNotifications((prev) => [item, ...prev.slice(0, 29)]); // keep last 30
    setActivePushToast(item);
    playChimeSound();

    // Trigger Native Browser Web Notification if allowed
    if (dailyGoal.browserPushEnabled && browserPermission === 'granted') {
      await triggerBrowserPushNotification(item, (url) => {
        window.location.href =
          url.startsWith('/') && !url.startsWith('/#') ? `/#${url}` : url;
      });
    }

    // Auto-dismiss in-app floating banner after 7 seconds
    setTimeout(() => {
      setActivePushToast((curr) => (curr?.id === item.id ? null : curr));
    }, 7000);
  };

  // Log study activity (minutes, lessons, simulations)
  const logStudyActivity = (minutes: number, lessonId?: string, simulationId?: string) => {
    setDailyProgress((prev) => {
      const nextMinutes = prev.minutesStudied + minutes;
      const nextLessons = lessonId && !prev.lessonsCompletedToday.includes(lessonId)
        ? [...prev.lessonsCompletedToday, lessonId]
        : prev.lessonsCompletedToday;
      const nextSims = simulationId && !prev.simulationsCompletedToday.includes(simulationId)
        ? [...prev.simulationsCompletedToday, simulationId]
        : prev.simulationsCompletedToday;

      const wasAlreadyCompleted = prev.goalCompleted;
      const willBeCompleted =
        nextMinutes >= dailyGoal.targetMinutes &&
        nextLessons.length >= dailyGoal.targetLessonsCount;

      const updatedProgress: DailyStudyProgress = {
        ...prev,
        minutesStudied: nextMinutes,
        lessonsCompletedToday: nextLessons,
        simulationsCompletedToday: nextSims,
        goalCompleted: willBeCompleted,
        streakDays: willBeCompleted && !wasAlreadyCompleted ? prev.streakDays + 1 : prev.streakDays,
      };

      // Trigger congratulations if goal reached just now!
      if (willBeCompleted && !wasAlreadyCompleted) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        const congrats = evaluateStudyReminder(
          dailyGoal,
          updatedProgress,
          user?.fullName || 'Học sinh KHTN'
        );
        if (congrats) {
          dispatchNotification(congrats);
        }
      }

      return updatedProgress;
    });
  };

  // Trigger manual or test reminder
  const triggerManualReminder = async (topicName?: string, quizId?: string): Promise<StudyNotificationItem | null> => {
    const weak = topicName ? { topicName, quizId } : undefined;
    const reminder = evaluateStudyReminder(
      dailyGoal,
      dailyProgress,
      user?.fullName || 'Học sinh KHTN',
      weak
    );

    if (reminder) {
      await dispatchNotification(reminder);
    }
    return reminder;
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const dismissPushToast = () => {
    setActivePushToast(null);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        dailyGoal,
        dailyProgress,
        browserPermission,
        activePushToast,
        requestBrowserPushPermission,
        updateDailyGoal,
        triggerManualReminder,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        dismissPushToast,
        logStudyActivity,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
