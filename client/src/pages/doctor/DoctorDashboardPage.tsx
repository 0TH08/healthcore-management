import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  // Static dashboard with navigation cards — no data loading needed
  return (
    <div>
      <h1>Doctor Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Welcome, Dr. {user?.name}.</p>
      <div className="dashboard-cards">
        <Link to="/doctor/patients" className="dash-card">
          <h3>Search Patients</h3>
          <p>Find patients and view their medical records</p>
        </Link>
        <Link to="/doctor/schedule" className="dash-card">
          <h3>My Schedule</h3>
          <p>View available appointment slots</p>
        </Link>
      </div>
    </div>
  );
}
