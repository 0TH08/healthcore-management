import { useAuth } from '../../auth/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.name}.</p>
      <ul>
        <li>Manage Hospitals</li>
        <li>Manage Departments</li>
        <li>Manage Beds</li>
        <li>Add Medical Devices</li>
        <li>Manage Staff Accounts</li>
        <li>View Audit Logs</li>
      </ul>
    </div>
  );
}
