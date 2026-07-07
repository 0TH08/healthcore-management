import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function NurseDashboardPage() {
  const { user } = useAuth();
  // Static navigation dashboard for triage, bed, and device management
  return (
    <div>
      <h1>Nurse Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Welcome, {user?.name}.</p>
      <div className="dashboard-cards">
        <Link to="/nurse/triage" className="dash-card">
          <h3>Triage Queue</h3>
          <p>Manage triage cases, update priority and status</p>
        </Link>
        <Link to="/nurse/beds" className="dash-card">
          <h3>Bed Dashboard</h3>
          <p>View and assign / release beds</p>
        </Link>
        <Link to="/nurse/devices" className="dash-card">
          <h3>Device Status</h3>
          <p>View and manage medical devices</p>
        </Link>
      </div>
    </div>
  );
}
