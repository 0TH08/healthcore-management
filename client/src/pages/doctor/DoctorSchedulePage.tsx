import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import apiClient from '../../api/apiClient';

interface TimeSlot { id: number; date: string; startTime: string; endTime: string; isBooked: boolean; doctorName: string; departmentName: string; doctorId: number }

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  // Fetches the doctor's own timeslots by finding their profile via /doctors list
  const fetch = (d: string) => {
    setLoading(true);
    setError('');
    apiClient.get('/doctors').then((docRes) => {
      const myProfile = (docRes.data.doctors as { id: number; name: string }[]).find((dr) => dr.name === user?.name);
      if (!myProfile) { setError('Doctor profile not found.'); setLoading(false); return; }
      apiClient.get('/timeslots', { params: { date: d, doctorId: myProfile.id } }).then((r) => {
        setSlots(r.data.timeSlots as TimeSlot[]);
      }).catch(() => setError('Failed to load schedule.')).finally(() => setLoading(false));
    }).catch(() => setError('Failed to load doctor profile.'));
  };

  // Refetches schedule when the selected date changes
  useEffect(() => { fetch(date); }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1>Available Appointment Slots</h1>
      <div className="filter-bar">
        <label style={{ fontWeight: 500 }}>Date:</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {loading && <p>Loading...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && slots.length === 0 && (
        <div className="alert alert-info">No available slots for {new Date(date).toLocaleDateString()}.</div>
      )}

      <div className="slot-list">
        {slots.map((s) => (
          <div key={s.id} className="slot-card">
            <div className="slot-info">
              <strong>{new Date(s.date).toLocaleDateString()}</strong>
              <span>{s.startTime} – {s.endTime}</span>
              <span className="slot-meta">{s.doctorName} · {s.departmentName}</span>
            </div>
            <span className="status-badge status-booked">Available</span>
          </div>
        ))}
      </div>
    </div>
  );
}
