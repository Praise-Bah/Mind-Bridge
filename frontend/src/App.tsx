import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './store'

import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'
import ThemeProvider from './providers/ThemeProvider'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'))
const ProfessionalPendingPage = lazy(() => import('./pages/auth/ProfessionalPendingPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CommunityPage = lazy(() => import('./pages/community/CommunityPage'))
const GroupDetailPage = lazy(() => import('./pages/community/GroupDetailPage'))
const ChatPage = lazy(() => import('./pages/chat/ChatPage'))
const ProfessionalsPage = lazy(() => import('./pages/professionals/ProfessionalsPage'))
const ProfessionalDetailPage = lazy(() => import('./pages/professionals/ProfessionalDetailPage'))
const BookingsPage = lazy(() => import('./pages/professionals/BookingsPage'))
const VideosPage = lazy(() => import('./pages/videos/VideosPage'))
const WellnessPage = lazy(() => import('./pages/wellness/WellnessPage'))
const AICompanionPage = lazy(() => import('./pages/ai/AICompanionPage'))
const JournalPage = lazy(() => import('./pages/journal/JournalPage'))
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))
const ProDashboard = lazy(() => import('./pages/pro/ProDashboard'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useSelector((state: RootState) => state.auth)
  return user?.is_staff ? <>{children}</> : <Navigate to="/dashboard" />
}

function ProRoute({ children }: { children: React.ReactNode }) {
  const { user } = useSelector((state: RootState) => state.auth)
  return user?.is_professional ? <>{children}</> : <Navigate to="/dashboard" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />
}

function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Preview Route - No auth required for testing */}
          <Route path="/ai-companion-preview" element={<AICompanionPage />} />

          {/* Landing Page - Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/verify-email" element={<PublicRoute><VerifyEmailPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
            {/* Shown after Google signup as professional — needs auth so PublicRoute is not used */}
            <Route path="/professional-pending" element={<PrivateRoute><ProfessionalPendingPage /></PrivateRoute>} />
          </Route>

          {/* Protected Routes */}
          <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/:slug" element={<GroupDetailPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />
            <Route path="/professionals" element={<ProfessionalsPage />} />
            <Route path="/professionals/:id" element={<ProfessionalDetailPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/wellness" element={<WellnessPage />} />
            <Route path="/ai-companion" element={<AICompanionPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="/pro/dashboard" element={<ProRoute><ProDashboard /></ProRoute>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  )
}

export default App
