import axios from 'axios';
import { ReactNode, useEffect } from 'react';

const baseURL =
  ((import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export const AxiosProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    api.defaults.baseURL = baseURL;
  }, []);

  return <>{children}</>;
};
