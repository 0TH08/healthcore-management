import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const roleLinks: Record<string, { label: string; path: string }[]> = {
    PATIENT: [
      { label: 'Dashboard', path: '/patient' },
    ],
    DOCTOR: [
      { label: 'Dashboard', path: '/doctor' },
    ],
    NURSE: [
      { label: 'Dashboard', path: '/nurse' },
    ],
    ADMIN: [
      { label: 'Dashboard', path: '/admin' },
    ],
  };

  const links = roleLinks[user.role] ?? [];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">HealthCore</Link>
      </div>
      <div className="navbar-links">
        {links.map((l) => (
          <Link key={l.path} to={l.path}>{l.label}</Link>
        ))}
      </div>
      <div className="navbar-user">
        <span>{user.name} ({user.role})</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
