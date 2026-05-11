import { KeyboardEvent } from 'react';
import { Task } from '../../types';
import { useI18n } from '../../providers/I18nProvider';

interface TaskItemProps {
  task: Task;
  onOpen: () => void;
  onAccept?: () => void;
  accepting?: boolean;
}

const STATUS_STYLES: Record<Task['status'], string> = {
  pending: 'bg-amber-100 text-amber-900',
  active: 'bg-green-100 text-green-800',
  done: 'bg-blue-100 text-blue-900',
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export const TaskItem = ({ task, onOpen, onAccept, accepting }: TaskItemProps) => {
  const { t } = useI18n();
  const isPool = task.status === 'pending' && task.specialist_id === null;

  const descriptionPreview =
    task.instruction_translated?.trim() ?? task.instruction_original;
  const showOriginalBelow =
    Boolean(task.instruction_translated?.trim()) &&
    task.instruction_original !== descriptionPreview &&
    !isPool;

  const titleLine = task.title?.trim() || t('task.item.noTitle');

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card transition hover:border-slate-300 hover:bg-slate-50/80 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[task.status]}`}
        >
          {t(`task.status.${task.status}`)}
        </span>
        <span className="text-xs text-gray-500">{formatDate(task.created_at)}</span>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {isPool ? t('task.item.available') : t('task.item.task')}
        </p>
        <p className="text-lg font-semibold leading-snug text-slate-900">{titleLine}</p>
        <p
          className="mt-2 overflow-hidden text-base leading-snug text-slate-700"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: isPool ? 5 : 4,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {descriptionPreview}
        </p>
        {showOriginalBelow && (
          <p
            className="mt-2 overflow-hidden text-sm text-slate-500"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {t('task.item.original')} {task.instruction_original}
          </p>
        )}
      </div>

      {isPool ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAccept?.();
          }}
          disabled={accepting || !onAccept}
          className="flex min-h-[3.25rem] w-full touch-manipulation items-center justify-center rounded-xl bg-geartalk-accent px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-geartalk-accent focus:ring-offset-2 sm:min-h-[3rem] sm:text-lg"
        >
          {accepting ? t('task.item.accepting') : t('task.item.accept')}
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="flex min-h-[3.25rem] w-full touch-manipulation items-center justify-center rounded-xl bg-geartalk-accent px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-geartalk-accent focus:ring-offset-2 sm:min-h-[3rem] sm:text-lg"
        >
          {t('task.item.openChat')}
        </button>
      )}
    </article>
  );
};
