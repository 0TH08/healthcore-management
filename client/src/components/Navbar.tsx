import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Navigation bar shown on every authenticated page.
// Displays role-specific links and the current user's name + logout button.
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
      { label: 'Book', path: '/patient/search' },
      { label: 'Appointments', path: '/patient/appointments' },
      { label: 'Records', path: '/patient/records' },
    ],
    DOCTOR: [
      { label: 'Dashboard', path: '/doctor' },
      { label: 'Patients', path: '/doctor/patients' },
      { label: 'Schedule', path: '/doctor/schedule' },
    ],
    NURSE: [
      { label: 'Dashboard', path: '/nurse' },
      { label: 'Triage', path: '/nurse/triage' },
      { label: 'Beds', path: '/nurse/beds' },
      { label: 'Devices', path: '/nurse/devices' },
    ],
    ADMIN: [
      { label: 'Dashboard', path: '/admin' },
      { label: 'Staff', path: '/admin/staff' },
      { label: 'Infrastructure', path: '/admin/infrastructure' },
      { label: 'Audit', path: '/admin/audit' },
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
