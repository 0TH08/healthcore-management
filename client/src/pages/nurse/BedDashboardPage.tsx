import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

interface Bed {
  id: number; bedNumber: string; status: 'UNOCCUPIED' | 'OCCUPIED';
  departmentId: number; departmentName: string; hospitalName: string;
}

export default function BedDashboardPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch all beds in the system
  const fetchBeds = () => {
    setLoading(true);
    apiClient.get('/resources/beds').then((r) => setBeds(r.data.beds)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(fetchBeds, []);

  // Toggle bed occupancy via PATCH assign/release
  const assignBed = async (bedId: number) => {
    setMessage('');
    try {
      await apiClient.patch(`/resources/beds/${bedId}/assign`);
      setMessage(`Bed #${bedId} assigned.`);
      fetchBeds();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.';
      setMessage(msg);
    }
  };

  const releaseBed = async (bedId: number) => {
    setMessage('');
    try {
      await apiClient.patch(`/resources/beds/${bedId}/release`);
      setMessage(`Bed #${bedId} released.`);
      fetchBeds();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.';
      setMessage(msg);
    }
  };

  return (
    <div>
      <h1>Bed Dashboard</h1>
      {message && <div className="alert alert-info">{message}</div>}

      {loading && <p>Loading...</p>}

      <div className="resource-grid">
        {beds.map((b) => (
          <div key={b.id} className={`resource-card resource-${b.status.toLowerCase()}`}>
            <div className="resource-header">
              <strong>{b.bedNumber}</strong>
              <span className={`status-badge ${b.status === 'OCCUPIED' ? 'status-paid' : 'status-requested'}`}>
                {b.status}
              </span>
            </div>
            <p className="resource-meta">{b.departmentName} · {b.hospitalName}</p>
            <div className="resource-actions">
              {b.status === 'UNOCCUPIED' && (
                <button className="btn btn-primary" onClick={() => assignBed(b.id)}>Assign</button>
              )}
              {b.status === 'OCCUPIED' && (
                <button className="btn btn-secondary" onClick={() => releaseBed(b.id)}>Release</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
