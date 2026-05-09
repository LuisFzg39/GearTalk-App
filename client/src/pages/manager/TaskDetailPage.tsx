import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Task } from '../../types';
import { api } from '../../providers/AxiosProvider';

const STATUS_STYLES: Record<Task['status'], string> = {
  pending: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  alert: 'bg-red-100 text-red-700',
  done: 'bg-blue-100 text-blue-700',
};

const NEXT_STATES: Record<Task['status'], Task['status'][]> = {
  pending: ['active'],
  active: ['alert', 'done'],
  alert: ['active', 'done'],
  done: [],
};

const STATUS_BUTTON_STYLES: Record<Task['status'], string> = {
  pending: 'bg-gray-600 hover:bg-gray-700 text-white',
  active: 'bg-green-600 hover:bg-green-700 text-white',
  alert: 'bg-red-600 hover:bg-red-700 text-white',
  done: 'bg-blue-600 hover:bg-blue-700 text-white',
};

interface TaskWithSpecialist extends Task {
  specialist_name?: string;
}

const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<TaskWithSpecialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<TaskWithSpecialist[]>('/api/tasks');
      const match = data.find((t) => t.id === id) ?? null;
      if (!match) {
        setError('Task not found.');
        setTask(null);
      } else {
        setTask(match);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not load task.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const nextStates = useMemo(() => (task ? NEXT_STATES[task.status] : []), [task]);

  const handleStatusChange = async (status: Task['status']) => {
    if (!task) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      const { data } = await api.patch<Task>(`/api/tasks/${task.id}/status`, { status });
      setTask({ ...task, ...data });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Could not update status.';
      setUpdateError(message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/manager/dashboard')}
            className="text-sm rounded-lg px-3 py-1.5 border border-gray-300 hover:bg-gray-100 transition"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Task Detail</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && <p className="text-gray-500">Loading task...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {task && (
          <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Status</p>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[task.status]}`}
                >
                  {task.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  Specialist
                </p>
                <p className="text-sm text-gray-900">
                  {task.specialist_name ?? task.specialist_id ?? (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Original instruction
              </p>
              <p className="text-gray-900 whitespace-pre-wrap">{task.instruction_original}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Translated instruction
              </p>
              <p className="text-gray-900 whitespace-pre-wrap">
                {task.instruction_translated || (
                  <span className="text-gray-400 italic">Pending translation</span>
                )}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                Update status
              </p>

              {nextStates.length === 0 ? (
                <p className="text-sm text-gray-500">No further status changes available.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {nextStates.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updating}
                      onClick={() => handleStatusChange(status)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed ${STATUS_BUTTON_STYLES[status]}`}
                    >
                      {updating ? 'Updating...' : `Mark as ${status}`}
                    </button>
                  ))}
                </div>
              )}

              {updateError && <p className="mt-2 text-sm text-red-600">{updateError}</p>}
            </div>
          </article>
        )}
      </main>
    </div>
  );
};

export default TaskDetailPage;
