export type TaskStatus = 'pending' | 'active' | 'alert' | 'done';

export interface Task {
  id: string;
  instruction_original: string;
  instruction_translated: string | null;
  status: TaskStatus;
  manager_id: string;
  specialist_id: string | null;
  created_at: string;
}

export interface CreateTaskRequest {
  instruction_original: string;
  specialist_id: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface TaskWithUsers extends Task {
  manager_name: string;
  specialist_name: string | null;
}
