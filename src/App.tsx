import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { SearchModal } from './components/common/SearchModal.tsx';
import { NotFoundPage } from './components/common/NotFoundPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { fetchUserProgress } from './services/progressService.ts';
import { UserProgress } from './types/index.ts';
import { NotificationProvider, useNotification } from './context/NotificationContext.tsx';
import { PushNotificationToast } from './components/notifications/PushNotificationToast.tsx';

import { AdminPage } from './pages/AdminPage.tsx';
import { QuizPracticePage } from './pages/QuizPracticePage.tsx';

// Lazy-loaded pages to optimize initial bundle size on Cloudflare Pages
const Grade6Page = lazy(() => import('./pages/GradeTemplatePage.tsx').then((m) => ({ default: m.Grade6Page })));
const Grade7Page = lazy(() => import('./pages/GradeTemplatePage.tsx').then((m) => ({ default: m.Grade7Page })));
const Grade8Page = lazy(() => import('./pages/GradeTemplatePage.tsx').then((m) => ({ default: m.Grade8Page })));
const Grade9Page = lazy(() => import('./pages/GradeTemplatePage.tsx').then((m) => ({ default: m.Grade9Page })));
const TopicsPage = lazy(() => import('./pages/TopicsPage.tsx').then((m) => ({ default: m.TopicsPage })));
const LessonDetailPage = lazy(() => import('./pages/LessonDetailPage.tsx').then((m) => ({ default: m.LessonDetailPage })));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage.tsx').then((m) => ({ default: m.DocumentsPage })));
const VideosPage = lazy(() => import('./pages/VideosPage.tsx').then((m) => ({ default: m.VideosPage })));
const Lab3DPage = lazy(() => import('./pages/Lab3DPage.tsx').then((m) => ({ default: m.Lab3DPage })));
const SimulationDetailPage = lazy(() => import('./pages/SimulationDetailPage.tsx').then((m) => ({ default: m.SimulationDetailPage })));
const ScienceGamesPage = lazy(() => import('./pages/ScienceGamesPage.tsx').then((m) => ({ default: m.ScienceGamesPage })));
const AuthPage = lazy(() => import('./pages/AuthPage.tsx').then((m) => ({ default: m.AuthPage })));
const StudentProgressPage = lazy(() => import('./pages/StudentProgressPage.tsx').then((m) => ({ default: m.StudentProgressPage })));

// Loading indicator for code-split route transitions
function PageLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Đang tải trang học tập KHTN...
      </p>
    </div>
  );
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const { user, logout } = useAuth();
  const { activePushToast, dismissPushToast } = useNotification();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProgress(user.id).then(setProgress);
    } else {
      setProgress(null);
    }
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-200">
      <Navbar
        currentUser={user}
        onOpenSearch={() => setSearchOpen(true)}
        onLogout={logout}
      />

      <main className="flex-1 w-full">
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lop-6" element={<Grade6Page />} />
            <Route path="/lop-7" element={<Grade7Page />} />
            <Route path="/lop-8" element={<Grade8Page />} />
            <Route path="/lop-9" element={<Grade9Page />} />
            <Route path="/chu-de" element={<TopicsPage />} />
            <Route path="/chuyen-de" element={<TopicsPage />} />
            <Route path="/bai-hoc/:lessonId" element={<LessonDetailPage />} />
            <Route path="/tai-lieu" element={<DocumentsPage />} />
            <Route path="/video" element={<VideosPage />} />
            <Route path="/phong-thi-nghiem-3d" element={<Lab3DPage />} />
            <Route path="/mo-phong/:simId" element={<SimulationDetailPage />} />
            <Route path="/luyen-tap" element={<QuizPracticePage />} />
            <Route path="/tro-choi" element={<ScienceGamesPage />} />
            <Route path="/dang-nhap" element={<AuthPage />} />
            <Route path="/dang-ky" element={<AuthPage />} />

            {/* Protected Routes */}
            <Route
              path="/tien-do"
              element={
                <ProtectedRoute requireAuth={true}>
                  <StudentProgressPage currentUser={user} progress={progress} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quan-tri"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['admin']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Friendly 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />

      {/* Floating Push-like Notification Toast */}
      <PushNotificationToast
        notification={activePushToast}
        onDismiss={dismissPushToast}
      />

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AppContent />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
