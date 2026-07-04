import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

interface Appointment {
  id: number; status: string; date: string; startTime: string; endTime: string;
  doctorName: string; departmentName: string; createdAt: string;
}

export default function MyAppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    apiClient.get('/appointments/me').then((r) => {
      setAppointments(r.data.appointments);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(fetch, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Appointments</h1>
        <button className="btn btn-primary" onClick={() => navigate('/patient/search')}>Book New</button>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && appointments.length === 0 && (
        <div className="alert alert-info">No appointments yet.</div>
      )}

      <div className="appointment-list">
        {appointments.map((a) => (
          <div key={a.id} className="appointment-card">
            <div className="appt-header">
              <strong>{new Date(a.date).toLocaleDateString()} {a.startTime} – {a.endTime}</strong>
              <span className={`status-badge status-${a.status.toLowerCase()}`}>{a.status}</span>
            </div>
            <div className="appt-detail">Dr. {a.doctorName} · {a.departmentName}</div>
            <div className="appt-actions">
              {(a.status === 'BOOKED' || a.status === 'REQUESTED') && (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/patient/pay', { state: { appointmentId: a.id } })}
                >
                  Pay Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
