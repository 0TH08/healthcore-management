import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type User } from './AuthContext';

interface Props {
  roles?: User['role'][];
}

export default function ProtectedRoute({ roles }: Props) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  }

  return <Outlet />;
}
