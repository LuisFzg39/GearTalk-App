import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Task } from '../../types';
import { api } from '../../providers/AxiosProvider';
import { ManagerLayout } from '../../components/manager/ManagerLayout';
import { useI18n } from '../../providers/I18nProvider';

const STATUS_STYLES: Record<Task['status'], string> = {
  pending: 'bg-amber-100 text-amber-900',
  active: 'bg-green-100 text-green-800',
  done: 'bg-blue-100 text-blue-900',
};

/** Pool tasks: no transitions until a specialist accepts */
const NEXT_STATES: Record<Task['status'], Task['status'][]> = {
  pending: [],
  active: ['done'],
  done: [],
};

const STATUS_BUTTON_STYLES: Record<Task['status'], string> = {
  pending: 'bg-gray-600 hover:bg-gray-700 text-white',
  active: 'bg-green-600 hover:bg-green-700 text-white',
  done: 'bg-blue-600 hover:bg-blue-700 text-white',
};

function transitionLabel(
  status: Task['status'],
  t: (key: string) => string
): string {
  if (status === 'done') return t('task.detail.transition.done');
  return `${t('task.detail.transition.generic')} ${t(`task.status.${status}`)}`;
}

interface TaskWithSpecialist extends Task {
  specialist_name?: string;
}

const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();

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
      const match = data.find((x) => x.id === id) ?? null;
      if (!match) {
        setError(t('task.detail.notFound'));
        setTask(null);
      } else {
        setTask(match);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('task.detail.loadError');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

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
        t('task.detail.updateError');
      setUpdateError(message);
    } finally {
      setUpdating(false);
    }
  };

  const isPool = Boolean(task && task.status === 'pending' && !task.specialist_id);

  return (
    <ManagerLayout>
      <div className="flex-1 px-4 pb-10 pt-6 sm:px-8 md:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/manager/dashboard')}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← {t('task.detail.back')}
          </button>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">{t('task.detail.title')}</h1>
        </div>

        {loading && <p className="text-slate-500">{t('task.detail.loading')}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {task && (
          <article className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-900">
              {task.title?.trim() || t('task.detail.noTitle')}
            </h2>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('task.detail.statusLabel')}
                </p>
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[task.status]}`}
                >
                  {t(`task.status.${task.status}`)}
                </span>
              </div>
              <div className="text-right">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('task.detail.specialistLabel')}
                </p>
                <p className="text-sm text-slate-900">
                  {task.specialist_name ?? task.specialist_id ?? (
                    <span className="italic text-slate-400">{t('task.detail.specialistNone')}</span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('task.detail.description')}
              </p>
              <p className="whitespace-pre-wrap text-slate-900">{task.instruction_original}</p>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('task.detail.conversation')}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/manager/tasks/${task.id}/chat`)}
                disabled={!task.specialist_id}
                className="w-full min-h-[2.75rem] rounded-xl bg-geartalk-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                {t('task.detail.openChat')}
              </button>
              {!task.specialist_id && (
                <p className="mt-2 text-xs text-slate-500">{t('task.detail.chatDisabled')}</p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('task.detail.updateStatus')}
              </p>

              {isPool && <p className="text-sm text-slate-500">{t('task.detail.poolNote')}</p>}

              {!isPool && nextStates.length === 0 && (
                <p className="text-sm text-slate-500">{t('task.detail.noMoreStates')}</p>
              )}

              {!isPool && nextStates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {nextStates.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updating}
                      onClick={() => handleStatusChange(status)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${STATUS_BUTTON_STYLES[status]}`}
                    >
                      {updating ? t('task.detail.saving') : transitionLabel(status, t)}
                    </button>
                  ))}
                </div>
              )}

              {updateError && <p className="mt-2 text-sm text-red-600">{updateError}</p>}
            </div>
          </article>
        )}
      </div>
    </ManagerLayout>
  );
};

export default TaskDetailPage;
