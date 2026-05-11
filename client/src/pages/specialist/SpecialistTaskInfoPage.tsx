import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Task } from '../../types';
import { api } from '../../providers/AxiosProvider';
import { BrandLogo } from '../../components/shared/BrandLogo';
import { useI18n } from '../../providers/I18nProvider';

const SpecialistTaskInfoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Task[]>('/api/tasks');
      const match = data.find((x) => x.id === id) ?? null;
      if (!match) {
        setError(t('task.info.notFound'));
      }
      setTask(match);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('task.info.loadError');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleAccept = async () => {
    if (!task) return;
    setAccepting(true);
    setError(null);
    try {
      await api.post<Task>(`/api/tasks/${task.id}/accept`);
      navigate(`/specialist/tasks/${task.id}`, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('specialist.acceptError');
      setError(message);
    } finally {
      setAccepting(false);
    }
  };

  const canAccept = task?.status === 'pending' && !task.specialist_id;
  const description = task?.instruction_translated?.trim() || task?.instruction_original;

  return (
    <div className="flex min-h-dvh flex-col bg-geartalk-canvas pb-safe">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <BrandLogo variant="dark" className="scale-90" />
          <button
            type="button"
            onClick={() => navigate('/specialist/tasks')}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:text-sm"
          >
            ← {t('task.info.back')}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:px-5">
        {loading && <p className="text-slate-500">{t('task.info.loading')}</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {task && (
          <article className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              {t(`task.status.${task.status}`)}
            </span>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
              {task.title?.trim() || t('task.info.noTitle')}
            </h1>

            <section className="mt-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('task.info.description')}
              </p>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">
                {description}
              </p>
            </section>

            {canAccept ? (
              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className="mt-8 flex min-h-[3.25rem] w-full items-center justify-center rounded-xl bg-geartalk-accent px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {accepting ? t('task.item.accepting') : t('task.item.accept')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/specialist/tasks/${task.id}`)}
                className="mt-8 flex min-h-[3.25rem] w-full items-center justify-center rounded-xl bg-geartalk-accent px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                {t('task.item.openChat')}
              </button>
            )}
          </article>
        )}
      </main>
    </div>
  );
};

export default SpecialistTaskInfoPage;
