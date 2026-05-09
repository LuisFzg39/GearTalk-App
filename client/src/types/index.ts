export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'specialist';
  preferred_language: string;
}

export interface Task {
  id: string;
  instruction_original: string;
  instruction_translated: string | null;
  status: 'pending' | 'active' | 'alert' | 'done';
  manager_id: string;
  specialist_id: string | null;
  created_at: string;
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
