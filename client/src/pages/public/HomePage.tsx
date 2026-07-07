import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function HomePage() {
  const { user, token } = useAuth();

  // Landingspage — redirects authenticated users to their role dashboard
  if (token && user) {
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  }

  // Unauthenticated landing page with Login / Register links
  return (
    <div className="page-center">
      <div style={{ textAlign: 'center', padding: '0 16px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>HealthCore Management</h1>
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }}>
          Integrated healthcare management platform
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-secondary">Register</Link>
        </div>
      </div>
    </div>
  );
}
