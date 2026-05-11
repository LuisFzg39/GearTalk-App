import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Message, Task } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../providers/AxiosProvider';
import { ManagerLayout } from '../../components/manager/ManagerLayout';
import { useI18n } from '../../providers/I18nProvider';

const messagesPath = (taskId: string) => `/api/messages/tasks/${taskId}/messages`;

const formatTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const TaskChatPage = () => {
  const { id: taskId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const backTarget = useMemo(() => {
    if (!taskId || !user) return '/login';
    return user.role === 'manager' ? `/manager/tasks/${taskId}` : '/specialist/tasks';
  }, [taskId, user]);

  const loadMessages = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Message[]>(messagesPath(taskId));
      setMessages(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ??
        (err as Error)?.message ??
        t('chat.loadError');
      setError(message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [taskId, t]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!taskId || user?.role !== 'specialist') return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get<Task[]>('/api/tasks');
        if (!cancelled) {
          setTask(data.find((x) => x.id === taskId) ?? null);
        }
      } catch {
        if (!cancelled) setTask(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [taskId, user?.role]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!taskId || !draft.trim() || sending) return;
    setSendError(null);
    setSending(true);
    try {
      const { data } = await api.post<Message>(messagesPath(taskId), {
        original_text: draft.trim(),
      });
      setDraft('');
      setMessages((prev) => [...prev, data]);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('chat.sendError');
      setSendError(message);
    } finally {
      setSending(false);
    }
  };

  if (!taskId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-geartalk-canvas px-4">
        <p className="text-slate-600">{t('chat.invalidTask')}</p>
      </div>
    );
  }

  const isManager = user?.role === 'manager';

  const shellClass = isManager
    ? 'flex flex-1 flex-col overflow-hidden min-h-0 h-[calc(100dvh-3.5rem)] md:h-auto md:min-h-screen'
    : 'flex min-h-dvh flex-col pt-safe';

  const chat = (
    <div className={`${shellClass} bg-geartalk-canvas`}>
      <header className="shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(backTarget)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ← {t('chat.back')}
            </button>
            <h1 className="truncate text-lg font-semibold text-slate-900">{t('chat.title')}</h1>
          </div>
          {!isManager && task && (
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              aria-label={t('chat.taskInfo')}
              title={t('chat.taskInfo')}
            >
              i
            </button>
          )}
        </div>
      </header>

      <div
        ref={scrollRef}
        className="mx-auto min-h-0 w-full max-w-3xl flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6"
      >
        {loading && <p className="text-slate-500">{t('chat.loading')}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && messages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
            {t('chat.empty')}
          </div>
        )}

        {!loading &&
          messages.map((m) => {
            const mine = user?.id === m.sender_id;
            const original = m.original_text;
            const translated = m.translated_text?.trim() ? m.translated_text : original;
            const showOriginalBelow =
              !mine && translated.trim() !== original.trim();

            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[min(100%,24rem)] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${
                    mine
                      ? 'rounded-br-md bg-geartalk-accent text-white'
                      : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'
                  }`}
                >
                  <p className={`mb-2 text-xs font-semibold ${mine ? 'text-blue-100' : 'text-slate-500'}`}>
                    {mine ? t('chat.you') : t('chat.partner')} · {formatTime(m.created_at)}
                  </p>
                  {mine ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{original}</p>
                  ) : showOriginalBelow ? (
                    <div className="space-y-2">
                      <p className="whitespace-pre-wrap text-base font-semibold leading-relaxed text-slate-900">
                        {translated}
                      </p>
                      <p className="whitespace-pre-wrap text-[11px] leading-snug text-slate-500 opacity-70">
                        {original}
                      </p>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-base leading-relaxed">{original}</p>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white pb-safe">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-2 px-4 py-4 sm:px-6">
          <label htmlFor="msg" className="sr-only">
            {t('chat.messageLabel')}
          </label>
          <textarea
            id="msg"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="min-h-[5rem] w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-geartalk-accent sm:text-sm"
          />
          {sendError && <p className="text-sm text-red-600">{sendError}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="min-h-[3rem] min-w-[7rem] rounded-xl bg-geartalk-accent px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {sending ? t('chat.sending') : t('chat.send')}
            </button>
          </div>
        </form>
      </footer>

      {!isManager && infoOpen && task && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45 px-4 pb-safe sm:items-center sm:justify-center">
          <button
            type="button"
            className="absolute inset-0"
            aria-label={t('chat.closeTaskInfo')}
            onClick={() => setInfoOpen(false)}
          />
          <section className="relative w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('chat.taskInfo')}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  {task.title?.trim() || t('task.info.noTitle')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {t('chat.closeTaskInfo')}
              </button>
            </div>

            <div className="mt-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('task.info.status')}
              </p>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                {t(`task.status.${task.status}`)}
              </span>
            </div>

            <div className="mt-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('task.info.description')}
              </p>
              <p className="max-h-[45dvh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {task.instruction_translated?.trim() || task.instruction_original}
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );

  if (isManager) {
    return <ManagerLayout>{chat}</ManagerLayout>;
  }

  return chat;
};

export default TaskChatPage;
