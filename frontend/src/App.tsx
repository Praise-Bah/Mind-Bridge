import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './store'

import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CommunityPage from './pages/community/CommunityPage'
import GroupDetailPage from './pages/community/GroupDetailPage'
import ChatPage from './pages/chat/ChatPage'
import ProfessionalsPage from './pages/professionals/ProfessionalsPage'
import ProfessionalDetailPage from './pages/professionals/ProfessionalDetailPage'
import BookingsPage from './pages/professionals/BookingsPage'
import VideosPage from './pages/videos/VideosPage'
import AIAssistantPage from './pages/ai/AIAssistantPage'
import JournalPage from './pages/journal/JournalPage'
import ProfilePage from './pages/profile/ProfilePage'
import SettingsPage from './pages/settings/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      </Route>

      {/* Protected Routes */}
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/:slug" element={<GroupDetailPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        <Route path="/professionals" element={<ProfessionalsPage />} />
        <Route path="/professionals/:id" element={<ProfessionalDetailPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
