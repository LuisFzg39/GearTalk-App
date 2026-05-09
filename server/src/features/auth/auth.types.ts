export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'manager' | 'specialist';
  preferred_language?: string;
}

export interface AuthPayload {
  id: string;
  email: string;
  role: 'manager' | 'specialist';
}
