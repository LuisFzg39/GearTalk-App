import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { Task, ManagerSpecialistOverview } from '../types';
import { api } from './AxiosProvider';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export interface TasksContextValue {
  tasks: Task[];
  specialists: ManagerSpecialistOverview[];
  loading: boolean;
  error: string | null;
  fetchTasks: (background?: boolean) => Promise<void>;
  acceptTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  subscribeToTaskUpdates: (taskId: string) => () => void;
}

export const TasksContext = createContext<TasksContextValue>({} as TasksContextValue);

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [specialists, setSpecialists] = useState<ManagerSpecialistOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Task[]>('/api/tasks');
      setTasks(data);
      if (user?.role === 'manager') {
        const { data: specialistData } = await api.get<ManagerSpecialistOverview[]>(
          '/api/tasks/specialists/overview'
        );
        setSpecialists(specialistData);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error loading tasks';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  const acceptTask = useCallback(
    async (taskId: string) => {
      await api.post<Task>(`/api/tasks/${taskId}/accept`);
      await fetchTasks(true);
    },
    [fetchTasks]
  );

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    const { data } = await api.patch<Task>(`/api/tasks/${taskId}/status`, { status });
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...data } : t)));
  }, []);

  const subscribeToPool = () => {
    const channel = supabase.channel('tasks:pool');
    channel
      .on('broadcast', { event: 'task-created' }, (payload) => {
        const task = payload.payload as Task;
        setTasks((prev) => {
          if (prev.some((t) => t.id === task.id)) return prev;
          return [task, ...prev];
        });
      })
      .on('broadcast', { event: 'task-accepted' }, (payload) => {
        const { id } = payload.payload as { id: string };
        setTasks((prev) => prev.filter((t) => t.id !== id));
      })
      .subscribe();
    return () => channel.unsubscribe();
  };

  const subscribeToManagerChannel = () => {
    if (user?.role !== 'manager') return () => {};
    const channel = supabase.channel(`tasks:manager:${user?.id}`);
    channel
      .on('broadcast', { event: 'task-created' }, () => {
        fetchTasks(true);
      })
      .on('broadcast', { event: 'task-accepted' }, () => {
        fetchTasks(true);
      })
      .subscribe();
    return () => channel.unsubscribe();
  };

  const subscribeToTaskUpdates = useCallback((taskId: string) => {
    const channel = supabase.channel(`task:${taskId}`);
    channel
      .on('broadcast', { event: 'task-updated' }, (payload) => {
        const updated = payload.payload as Task;
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      })
      .subscribe();
    return () => channel.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchTasks();
    const unsubPool = subscribeToPool();
    const unsubManager = subscribeToManagerChannel();
    return () => {
      unsubPool();
      unsubManager();
    };
  }, [user?.id, user?.role]);

  const value: TasksContextValue = {
    tasks,
    specialists,
    loading,
    error,
    fetchTasks,
    acceptTask,
    updateTaskStatus,
    subscribeToTaskUpdates,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};

export const useTasks = (): TasksContextValue => {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used inside TasksProvider');
  return ctx;
};
