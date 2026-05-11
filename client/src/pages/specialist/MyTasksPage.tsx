import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../providers/AxiosProvider';
import { TaskItem } from '../../components/specialist/TaskItem';
import { EmptyState } from '../../components/shared/EmptyState';
import { BrandLogo } from '../../components/shared/BrandLogo';
import { useI18n } from '../../providers/I18nProvider';

const MyTasksPage = () => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Task[]>('/api/tasks');
      setTasks(data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('specialist.loadError');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const { availableTasks, myTasks } = useMemo(() => {
    const available = tasks.filter((x) => x.status === 'pending' && !x.specialist_id);
    const mine = tasks.filter((x) => x.specialist_id === user?.id);
    return { availableTasks: available, myTasks: mine };
  }, [tasks, user?.id]);

  const handleAccept = async (taskId: string) => {
    setAcceptingId(taskId);
    setError(null);
    try {
      await api.post<Task>(`/api/tasks/${taskId}/accept`);
      await fetchTasks();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('specialist.acceptError');
      setError(message);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-geartalk-canvas pb-safe">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 scale-90">
            <BrandLogo variant="dark" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden max-w-[10rem] truncate text-xs text-slate-500 sm:inline sm:text-sm">
              {user?.name ?? t('specialist.nameFallback')}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:text-sm"
            >
              {t('specialist.logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:px-5">
        {loading && <p className="text-slate-500">{t('specialist.loading')}</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {!loading && availableTasks.length === 0 && myTasks.length === 0 && (
          <EmptyState message={t('specialist.empty')} />
        )}

        {!loading && availableTasks.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t('specialist.availableSection')}
            </h2>
            <div className="flex flex-col gap-4 sm:gap-5">
              {availableTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onOpen={() => navigate(`/specialist/tasks/${task.id}/info`)}
                  onAccept={() => handleAccept(task.id)}
                  accepting={acceptingId === task.id}
                />
              ))}
            </div>
          </section>
        )}

        {!loading && myTasks.length > 0 && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t('specialist.myTasksSection')}
            </h2>
            <div className="flex flex-col gap-4 sm:gap-5">
              {myTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onOpen={() => navigate(`/specialist/tasks/${task.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default MyTasksPage;
