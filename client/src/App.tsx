import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { PrivateRoute } from './components/shared/PrivateRoute';
import LoginPage from './pages/shared/LoginPage';
import RegisterPage from './pages/shared/RegisterPage';
import DashboardPage from './pages/manager/DashboardPage';
import ManagerMessagesPage from './pages/manager/ManagerMessagesPage';
import TaskDetailPage from './pages/manager/TaskDetailPage';
import MyTasksPage from './pages/specialist/MyTasksPage';
import SpecialistTaskInfoPage from './pages/specialist/SpecialistTaskInfoPage';
import TaskChatPage from './pages/shared/TaskChatPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/manager"
        element={
          <PrivateRoute role="manager">
            <Outlet />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="messages" element={<ManagerMessagesPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="tasks/:id/chat" element={<TaskChatPage />} />
      </Route>
      <Route
        path="/specialist"
        element={
          <PrivateRoute role="specialist">
            <Outlet />
          </PrivateRoute>
        }
      >
        <Route path="tasks" element={<MyTasksPage />} />
        <Route path="tasks/:id/info" element={<SpecialistTaskInfoPage />} />
        <Route path="tasks/:id" element={<TaskChatPage />} />
      </Route>
    </Routes>
  );
}

export default App;
