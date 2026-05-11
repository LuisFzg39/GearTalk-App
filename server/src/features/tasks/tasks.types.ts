export type TaskStatus = 'pending' | 'active' | 'done';

export interface Task {
  id: string;
  title: string;
  instruction_original: string;
  instruction_translated: string | null;
  status: TaskStatus;
  manager_id: string;
  specialist_id: string | null;
  created_at: string;
}

export interface CreateTaskRequest {
  title: string;
  instruction_original: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface TaskWithUsers extends Task {
  manager_name: string;
  specialist_name: string | null;
  specialist_language: string | null;
}

export interface ManagerSpecialistOverview {
  specialist_id: string;
  name: string;
  language: string | null;
  status: 'active' | 'available';
  task_id: string | null;
  task_title: string | null;
  task_description: string | null;
}
