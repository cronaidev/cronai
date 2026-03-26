import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import LoginPage from './pages/Login'
import OnboardingPage from './pages/Onboarding'
import DashboardLayout from './pages/DashboardLayout'
import FeedPage from './pages/Feed'
import TasksPage from './pages/Tasks'
import AgentsPage from './pages/Agents'
import KeeperPage from './pages/Keeper'
import SchedulePage from './pages/Schedule'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FeedPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="keeper" element={<KeeperPage />} />
        <Route path="schedule" element={<SchedulePage />} />
      </Route>
    </Routes>
  )
}
