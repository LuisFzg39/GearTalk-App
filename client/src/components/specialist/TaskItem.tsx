import { Task } from '../../types';

interface TaskItemProps {
  task: Task;
  onOpen: () => void;
}

const STATUS_STYLES: Record<Task['status'], string> = {
  pending: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  alert: 'bg-red-100 text-red-700',
  done: 'bg-blue-100 text-blue-700',
};

const STATUS_LABEL: Record<Task['status'], string> = {
  pending: 'Pending',
  active: 'Active',
  alert: 'Alert',
  done: 'Done',
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

export const TaskItem = ({ task, onOpen }: TaskItemProps) => {
  const primaryText =
    task.instruction_translated?.trim() ?? task.instruction_original;
  const showOriginalBelow =
    Boolean(task.instruction_translated?.trim()) &&
    task.instruction_original !== primaryText;

  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[task.status]}`}
        >
          {STATUS_LABEL[task.status]}
        </span>
        <span className="text-xs text-gray-500">{formatDate(task.created_at)}</span>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
          {task.instruction_translated?.trim() ? 'Instruction (translated)' : 'Instruction'}
        </p>
        <p
          className="text-gray-900 text-lg font-medium leading-snug overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {primaryText}
        </p>
        {showOriginalBelow && (
          <p
            className="text-sm text-gray-500 mt-2 overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            Original: {task.instruction_original}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="w-full min-h-[3.25rem] rounded-xl bg-blue-600 text-white text-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Open chat
      </button>
    </article>
  );
};
