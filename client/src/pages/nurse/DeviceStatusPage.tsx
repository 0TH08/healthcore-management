import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

interface Device {
  id: number; name: string; type: string;
  status: 'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE';
  departmentId: number; departmentName: string; hospitalName: string;
}

const STATUSES = ['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE'] as const;

export default function DeviceStatusPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Load all devices from the system
  const fetchDevices = () => {
    setLoading(true);
    apiClient.get('/resources/devices').then((r) => setDevices(r.data.devices)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(fetchDevices, []);

  const assignDevice = async (deviceId: number) => {
    setMessage('');
    try {
      await apiClient.patch(`/resources/devices/${deviceId}/assign`);
      setMessage(`Device #${deviceId} assigned.`);
      fetchDevices();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.';
      setMessage(msg);
    }
  };

  const updateStatus = async (deviceId: number, status: string) => {
    setMessage('');
    try {
      await apiClient.patch(`/resources/devices/${deviceId}/status`, { status });
      setMessage(`Device #${deviceId} status updated to ${status}.`);
      fetchDevices();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.';
      setMessage(msg);
    }
  };

  const statusClass = (s: string) => {
    if (s === 'AVAILABLE') return 'status-requested';
    if (s === 'IN_USE') return 'status-paid';
    return 'status-booked';
  };

  return (
    <div>
      <h1>Medical Devices</h1>
      {message && <div className="alert alert-info">{message}</div>}

      {loading && <p>Loading...</p>}

      <div className="resource-grid">
        {devices.map((d) => (
          <div key={d.id} className="resource-card">
            <div className="resource-header">
              <strong>{d.name}</strong>
              <span className={`status-badge ${statusClass(d.status)}`}>{d.status}</span>
            </div>
            <p className="resource-meta">{d.type} · {d.departmentName} · {d.hospitalName}</p>
            <div className="resource-actions" style={{ flexDirection: 'column', gap: 8 }}>
              {d.status === 'AVAILABLE' && (
                <button className="btn btn-primary btn-block" onClick={() => assignDevice(d.id)}>Assign</button>
              )}
              <div style={{ display: 'flex', gap: 4 }}>
                {STATUSES.filter((s) => s !== d.status).map((s) => (
                  <button key={s} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '6px 8px' }} onClick={() => updateStatus(d.id, s)}>
                    {s === 'AVAILABLE' ? 'Set Avail' : s === 'IN_USE' ? 'Set In Use' : 'Set Maint'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
