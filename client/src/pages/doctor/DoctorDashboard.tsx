import { useAuth } from '../../auth/AuthContext';

export default function DoctorDashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h1>Doctor Dashboard</h1>
      <p>Welcome, Dr. {user?.name}.</p>
      <ul>
        <li>Search Patients</li>
        <li>View / Update Medical Records</li>
        <li>Create Prescriptions</li>
      </ul>
    </div>
  );
}
