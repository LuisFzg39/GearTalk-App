import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
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

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className="text-gray-900 font-medium overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {task.instruction_original}
        </p>
        <span
          className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[task.status]}`}
        >
          {STATUS_LABEL[task.status]}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <span className="font-medium text-gray-700">
            {task.specialist_id ? 'Assigned' : 'Unassigned'}
          </span>
          {task.specialist_id && (
            <span className="text-gray-500">· {task.specialist_id.slice(0, 8)}</span>
          )}
        </span>
        <span>{formatDate(task.created_at)}</span>
      </div>
    </button>
  );
};
