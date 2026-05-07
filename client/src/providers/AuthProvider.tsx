import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
// TODO Person 1: implement auth state, login, logout, token persistence
export const AuthContext = createContext({});
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // TODO
  return <>{children}</>;
};
