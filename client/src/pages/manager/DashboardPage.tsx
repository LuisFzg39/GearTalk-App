import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ManagerSpecialistOverview, Task } from '../../types';
import { api } from '../../providers/AxiosProvider';
import { EmptyState } from '../../components/shared/EmptyState';
import { ManagerLayout } from '../../components/manager/ManagerLayout';
import { formatLanguageDisplay } from '../../utils/language';
import { useI18n } from '../../providers/I18nProvider';

const STATUS_DOT: Record<ManagerSpecialistOverview['status'], string> = {
  active: 'bg-emerald-500',
  available: 'bg-slate-400',
};

const truncate = (text: string, max: number): string => {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
};

const DashboardPage = () => {
  const { t, lang: uiLang } = useI18n();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [specialists, setSpecialists] = useState<ManagerSpecialistOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [instruction, setInstruction] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Task[]>('/api/tasks');
      const { data: specialistData } = await api.get<ManagerSpecialistOverview[]>(
        '/api/tasks/specialists/overview'
      );
      setTasks(data);
      setSpecialists(specialistData);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('manager.dashboard.loadError');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const unassigned = useMemo(() => tasks.filter((task) => !task.specialist_id), [tasks]);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await api.post<Task>('/api/tasks', {
        title,
        instruction_original: instruction,
      });
      setTitle('');
      setInstruction('');
      setFormOpen(false);
      await fetchTasks();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('task.form.createError');
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ManagerLayout>
      <div className="flex-1 px-4 pb-10 pt-6 sm:px-8 md:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              {t('manager.dashboard.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{t('manager.dashboard.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-geartalk-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {formOpen ? t('manager.dashboard.closeForm') : t('manager.dashboard.newTask')}
          </button>
        </div>

        {formOpen && (
          <form
            onSubmit={handleCreate}
            className="mb-8 space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card"
          >
            <div>
              <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-slate-700">
                {t('task.form.titleLabel')}
              </label>
              <input
                id="task-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('task.form.titlePlaceholder')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-geartalk-accent"
              />
            </div>
            <div>
              <label htmlFor="instruction" className="mb-1 block text-sm font-medium text-slate-700">
                {t('task.form.descriptionLabel')}
              </label>
              <textarea
                id="instruction"
                required
                rows={4}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={t('task.form.descriptionPlaceholder')}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-geartalk-accent"
              />
            </div>

            <p className="text-xs text-slate-500">{t('task.form.hint')}</p>

            {createError && <p className="text-sm text-red-600">{createError}</p>}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-geartalk-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {creating ? t('task.form.creating') : t('task.form.create')}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {t('task.form.cancel')}
              </button>
            </div>
          </form>
        )}

        {!formOpen && (
          <>
            {loading && <p className="text-slate-500">{t('manager.dashboard.loading')}</p>}
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            {!loading && tasks.length === 0 && (
              <EmptyState message={t('manager.dashboard.empty')} />
            )}

            {!loading && tasks.length > 0 && (
              <>
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                  <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {t('manager.dashboard.fieldSpecialists')}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {t('manager.dashboard.fieldSpecialistsHint')}
                    </p>
                  </div>

                  {specialists.length === 0 ? (
                    <p className="px-6 py-10 text-center text-sm text-slate-500">
                      {t('manager.dashboard.noSpecialistsYet')}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-6 py-3">{t('manager.dashboard.col.name')}</th>
                            <th className="px-6 py-3">{t('manager.dashboard.col.status')}</th>
                            <th className="px-6 py-3">{t('manager.dashboard.col.currentTask')}</th>
                            <th className="px-6 py-3">{t('manager.dashboard.col.language')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {specialists.map((row) => {
                            const dotClass = STATUS_DOT[row.status];
                            const presenceLabel = t(`presence.${row.status}`);
                            const lang = formatLanguageDisplay(row.language, uiLang);
                            const isClickable = Boolean(row.task_id);
                            return (
                              <tr
                                key={row.specialist_id}
                                role={isClickable ? 'button' : undefined}
                                tabIndex={isClickable ? 0 : undefined}
                                onClick={() => row.task_id && navigate(`/manager/tasks/${row.task_id}`)}
                                onKeyDown={(e) => {
                                  if ((e.key === 'Enter' || e.key === ' ') && row.task_id) {
                                    e.preventDefault();
                                    navigate(`/manager/tasks/${row.task_id}`);
                                  }
                                }}
                                className={
                                  isClickable
                                    ? 'cursor-pointer transition hover:bg-slate-50/90'
                                    : 'cursor-default'
                                }
                              >
                                <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                                  {row.name}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center gap-2">
                                    <span
                                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`}
                                      aria-hidden
                                    />
                                    <span className="text-slate-700">{presenceLabel}</span>
                                  </span>
                                </td>
                                <td className="max-w-xs px-6 py-4 text-slate-600 md:max-w-md lg:max-w-xl">
                                  <span className="line-clamp-2">
                                    {row.task_id
                                      ? truncate(
                                          row.task_title?.trim() ||
                                            row.task_description ||
                                            t('manager.dashboard.na'),
                                          96
                                        )
                                      : t('manager.dashboard.na')}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                  <span className="inline-flex items-center gap-2 text-slate-700">
                                    <span className="text-lg leading-none" aria-hidden>
                                      {lang.flag}
                                    </span>
                                    {lang.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {unassigned.length > 0 && (
                  <section className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-amber-900">
                      {t('manager.dashboard.unassignedTitle')}
                    </h3>
                    <p className="mt-1 text-sm text-amber-800/90">
                      {t('manager.dashboard.unassignedHint')}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-amber-950">
                      {unassigned.map((task) => (
                        <li key={task.id}>
                          <button
                            type="button"
                            onClick={() => navigate(`/manager/tasks/${task.id}`)}
                            className="text-left font-medium text-amber-950 underline decoration-amber-400/60 underline-offset-2 hover:decoration-amber-700"
                          >
                            {truncate(task.title?.trim() || task.instruction_original, 120)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ManagerLayout>
  );
};

export default DashboardPage;
