import { Navigate } from 'react-router-dom';
import { User } from '../../types';

interface PrivateRouteProps {
  children: JSX.Element;
  role: 'manager' | 'specialist';
}

const HOME_BY_ROLE: Record<'manager' | 'specialist', string> = {
  manager: '/manager/dashboard',
  specialist: '/specialist/tasks',
};

export const PrivateRoute = ({ children, role }: PrivateRouteProps) => {
  const token = localStorage.getItem('token');
  const rawUser = localStorage.getItem('user');

  if (!token || !rawUser) {
    return <Navigate to="/login" replace />;
  }

  let user: User;
  try {
    user = JSON.parse(rawUser) as User;
  } catch {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  }

  return children;
};
