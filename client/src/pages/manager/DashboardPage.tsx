import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../providers/AxiosProvider';
import { TaskCard } from '../../components/manager/TaskCard';
import { EmptyState } from '../../components/shared/EmptyState';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [specialistId, setSpecialistId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await api.post<Task>('/api/tasks', {
        instruction_original: instruction,
        specialist_id: specialistId,
      });
      setInstruction('');
      setSpecialistId('');
      setFormOpen(false);
      await fetchTasks();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not create task.';
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">GearTalk</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name ?? 'Manager'}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm rounded-lg px-3 py-1.5 border border-gray-300 hover:bg-gray-100 transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Operations Panel</h2>
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="rounded-lg bg-blue-600 text-white font-medium px-4 py-2 hover:bg-blue-700 transition"
          >
            {formOpen ? 'Cancel' : 'New Task'}
          </button>
        </div>

        {formOpen && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm space-y-4"
          >
            <div>
              <label
                htmlFor="instruction"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Instruction
              </label>
              <textarea
                id="instruction"
                required
                rows={4}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="specialist"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Specialist ID
              </label>
              <input
                id="specialist"
                type="text"
                required
                value={specialistId}
                onChange={(e) => setSpecialistId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {createError && <p className="text-sm text-red-600">{createError}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-600 text-white font-medium px-4 py-2 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
              >
                {creating ? 'Creating...' : 'Create task'}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading && <p className="text-gray-500">Loading tasks...</p>}
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {!loading && tasks.length === 0 && <EmptyState message="No tasks yet. Create one to get started." />}

        {!loading && tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => navigate(`/manager/tasks/${task.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
