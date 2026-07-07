import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import apiClient from '../../api/apiClient';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [apptCount, setApptCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);

  // Fetch summary counts for the dashboard cards, failures are silently ignored
  useEffect(() => {
    apiClient.get('/appointments/me').then((r) => setApptCount(r.data.appointments.length)).catch(() => {});
    apiClient.get('/medical-records/me').then((r) => setRecordCount(r.data.records.length)).catch(() => {});
  }, []);

  return (
    <div>
      <h1>Patient Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Welcome, {user?.name}.</p>
      <div className="dashboard-cards">
        <Link to="/patient/search" className="dash-card">
          <h3>Book Appointment</h3>
          <p>Search departments, doctors, and available slots</p>
        </Link>
        <Link to="/patient/appointments" className="dash-card">
          <h3>My Appointments ({apptCount})</h3>
          <p>View and pay for your appointments</p>
        </Link>
        <Link to="/patient/records" className="dash-card">
          <h3>Medical Records ({recordCount})</h3>
          <p>View or export your medical history</p>
        </Link>
      </div>
    </div>
  );
}
