import { createContext, ReactNode } from 'react';
// TODO Person 2: implement tasks state and fetch logic
export const TasksContext = createContext({});
export const TasksProvider = ({ children }: { children: ReactNode }) => {
  // TODO
  return <>{children}</>;
};
