import { useAuth } from '../../auth/AuthContext';

export default function NurseDashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h1>Nurse Dashboard</h1>
      <p>Welcome, {user?.name}.</p>
      <ul>
        <li>Manage Triage Queue</li>
        <li>Assign / Release Beds</li>
        <li>Assign / Update Devices</li>
      </ul>
    </div>
  );
}
