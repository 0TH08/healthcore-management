import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

interface Department { id: number; name: string; hospitalName: string }
interface Doctor { id: number; name: string; specialization: string; departmentId: number }
interface TimeSlot { id: number; date: string; startTime: string; endTime: string; isBooked: boolean; doctorName: string; departmentName: string }

export default function SearchAppointmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [deptId, setDeptId] = useState('');
  const [docId, setDocId] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/departments').then((r) => setDepartments(r.data.departments)).catch(() => {});
    apiClient.get('/doctors').then((r) => setDoctors(r.data.doctors)).catch(() => {});
  }, []);

  const search = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (deptId) params.departmentId = deptId;
      if (docId) params.doctorId = docId;
      if (date) params.date = date;
      const res = await apiClient.get('/timeslots', { params });
      setSlots(res.data.timeSlots.filter((s: TimeSlot) => !s.isBooked));
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = deptId
    ? doctors.filter((d) => d.departmentId === Number(deptId))
    : doctors;

  return (
    <div>
      <h1>Book an Appointment</h1>
      <div className="filter-bar">
        <select value={deptId} onChange={(e) => { setDeptId(e.target.value); setDocId(''); }}>
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name} — {d.hospitalName}</option>
          ))}
        </select>
        <select value={docId} onChange={(e) => setDocId(e.target.value)}>
          <option value="">All Doctors</option>
          {filteredDoctors.map((d) => (
            <option key={d.id} value={d.id}>Dr. {d.name} {d.specialization ? `(${d.specialization})` : ''}</option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn btn-primary" onClick={search}>Search</button>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && slots.length === 0 && (
        <div className="alert alert-info">No available slots. Try a different filter.</div>
      )}

      <div className="slot-list">
        {slots.map((s) => (
          <div key={s.id} className="slot-card">
            <div className="slot-info">
              <strong>{new Date(s.date).toLocaleDateString()}</strong>
              <span>{s.startTime} – {s.endTime}</span>
              <span className="slot-meta">{s.doctorName} · {s.departmentName}</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/patient/book', {
                state: {
                  timeSlotId: s.id,
                  date: s.date,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  doctorName: s.doctorName,
                  departmentName: s.departmentName,
                },
              })}
            >
              Book
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
