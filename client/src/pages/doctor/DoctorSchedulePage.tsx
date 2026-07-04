import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

interface TimeSlot { id: number; date: string; startTime: string; endTime: string; isBooked: boolean; doctorName: string; departmentName: string }

export default function DoctorSchedulePage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetch = (d: string) => {
    setLoading(true);
    apiClient.get('/timeslots', { params: { date: d } }).then((r) => {
      setSlots(r.data.timeSlots);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(date); }, [date]);

  return (
    <div>
      <h1>Available Appointment Slots</h1>
      <div className="filter-bar">
        <label style={{ fontWeight: 500 }}>Date:</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {loading && <p>Loading...</p>}

      {!loading && slots.length === 0 && (
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
