import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../providers/AxiosProvider';
import { TaskItem } from '../../components/specialist/TaskItem';
import { EmptyState } from '../../components/shared/EmptyState';

const MyTasksPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Task[]>('/api/tasks');
      setTasks(data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not load tasks.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-gray-900">My tasks</h1>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <span className="text-sm text-gray-600 truncate">{user?.name ?? 'Specialist'}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 text-sm rounded-lg px-3 py-1.5 border border-gray-300 hover:bg-gray-100 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-gray-600 mb-6">
          Tap <span className="font-medium text-gray-800">Open chat</span> to view the conversation
          for a task.
        </p>

        {loading && <p className="text-gray-500">Loading tasks...</p>}
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {!loading && tasks.length === 0 && (
          <EmptyState message="No tasks assigned to you yet." />
        )}

        {!loading && tasks.length > 0 && (
          <div className="flex flex-col gap-5">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onOpen={() => navigate(`/specialist/tasks/${task.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTasksPage;
