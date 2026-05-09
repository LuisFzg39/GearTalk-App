import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Message } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../providers/AxiosProvider';

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
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const backTarget = useMemo(() => {
    if (!taskId || !user) return '/login';
    return user.role === 'manager'
      ? `/manager/tasks/${taskId}`
      : '/specialist/tasks';
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
        'Could not load messages.';
      setError(message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

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
        'Could not send message.';
      setSendError(message);
    } finally {
      setSending(false);
    }
  };

  if (!taskId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-600">Invalid task.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="shrink-0 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(backTarget)}
            className="text-sm rounded-lg px-3 py-1.5 border border-gray-300 hover:bg-gray-100 transition"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Task conversation</h1>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4"
      >
        {loading && <p className="text-gray-500">Loading messages...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-gray-600 text-sm">
            No messages yet. Write below to start the conversation.
          </div>
        )}

        {!loading &&
          messages.map((m) => {
            const mine = user?.id === m.sender_id;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    mine
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                  }`}
                >
                  <p className={`text-xs font-semibold mb-2 ${mine ? 'text-blue-100' : 'text-gray-500'}`}>
                    {mine ? 'You' : 'Partner'} · {formatTime(m.created_at)}
                  </p>
                  {mine ? (
                    <>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.original_text}</p>
                      {m.original_text.trim() !== m.translated_text.trim() && (
                        <p className={`text-xs mt-2 opacity-90 border-t pt-2 border-blue-400/40`}>
                          Shown to them as:{' '}
                          <span className="font-medium">{m.translated_text}</span>
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">
                        {m.translated_text}
                      </p>
                      {m.original_text.trim() !== m.translated_text.trim() && (
                        <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">
                          Original (their wording):{' '}
                          <span className="italic">{m.original_text}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <footer className="shrink-0 border-t border-gray-200 bg-white">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-2"
        >
          <label htmlFor="msg" className="sr-only">
            Message
          </label>
          <textarea
            id="msg"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your message (it will be translated for the other participant)..."
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[5rem]"
          />
          {sendError && <p className="text-sm text-red-600">{sendError}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="min-h-[3rem] min-w-[7rem] rounded-xl bg-blue-600 text-white font-semibold px-6 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
};

export default TaskChatPage;
