import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Welcome, {user?.name}.</p>
      <div className="dashboard-cards">
        <Link to="/admin/staff" className="dash-card">
          <h3>Staff Management</h3>
          <p>Create, deactivate, and manage staff roles</p>
        </Link>
        <Link to="/admin/infrastructure" className="dash-card">
          <h3>Infrastructure</h3>
          <p>Manage hospitals, departments, beds, and devices</p>
        </Link>
        <Link to="/admin/audit" className="dash-card">
          <h3>Audit Logs</h3>
          <p>View administrator action history</p>
        </Link>
      </div>
    </div>
  );
}
