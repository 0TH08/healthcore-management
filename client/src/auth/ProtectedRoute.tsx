import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type User } from './AuthContext';

interface Props {
  roles?: User['role'][];
}

// Route guard that checks auth + role.
// Unauthenticated users are redirected to /login;
// authenticated users without the correct role are sent to their own dashboard.
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
