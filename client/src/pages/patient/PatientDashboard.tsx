import { useAuth } from '../../auth/AuthContext';

export default function PatientDashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h1>Patient Dashboard</h1>
      <p>Welcome, {user?.name}.</p>
      <ul>
        <li>Book Appointment</li>
        <li>View My Appointments</li>
        <li>View Medical Records</li>
        <li>Make a Payment</li>
      </ul>
    </div>
  );
}
