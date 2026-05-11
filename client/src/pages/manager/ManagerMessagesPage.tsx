import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task } from '../../types';
import { api } from '../../providers/AxiosProvider';
import { EmptyState } from '../../components/shared/EmptyState';
import { ManagerLayout } from '../../components/manager/ManagerLayout';
import { useI18n } from '../../providers/I18nProvider';

const ManagerMessagesPage = () => {
  const { t } = useI18n();
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
        t('manager.messages.loadError');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const conversations = useMemo(
    () => tasks.filter((task) => Boolean(task.specialist_id)),
    [tasks]
  );

  const statusLabel = useCallback((status: Task['status']) => t(`task.status.${status}`), [t]);

  return (
    <ManagerLayout>
      <div className="flex-1 px-4 pb-10 pt-6 sm:px-8 md:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            {t('manager.messages.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{t('manager.messages.subtitle')}</p>
        </div>

        {loading && <p className="text-slate-500">{t('manager.messages.loading')}</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {!loading && !error && conversations.length === 0 && (
          <EmptyState message={t('manager.messages.empty')} />
        )}

        {!loading && conversations.length > 0 && (
          <ul className="space-y-3">
            {conversations.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/manager/tasks/${task.id}/chat`)}
                  className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-card transition hover:border-slate-300 hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {task.title?.trim() || t('manager.messages.noTitle')}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-700">{t('manager.messages.specialist')}:</span>{' '}
                      {task.specialist_name?.trim() ||
                        `${task.specialist_id?.slice(0, 8) ?? ''}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                      {statusLabel(task.status)}
                    </span>
                    <span className="rounded-xl bg-geartalk-accent px-4 py-2 text-sm font-semibold text-white shadow-sm">
                      {t('manager.messages.openChat')}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ManagerLayout>
  );
};

export default ManagerMessagesPage;
