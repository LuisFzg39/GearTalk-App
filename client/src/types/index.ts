export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'specialist';
  preferred_language: string;
}

export interface Task {
  id: string;
  title: string;
  instruction_original: string;
  instruction_translated: string | null;
  status: 'pending' | 'active' | 'done';
  manager_id: string;
  specialist_id: string | null;
  created_at: string;
  /** Present on manager task list API responses */
  specialist_name?: string | null;
  manager_name?: string;
  specialist_language?: string | null;
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

export interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  original_text: string;
  translated_text: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  status: number;
}
