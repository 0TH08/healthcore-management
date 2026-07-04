import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function AppointmentBookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const timeSlotId = (location.state as { timeSlotId?: number })?.timeSlotId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!timeSlotId) {
    return (
      <div>
        <h1>Book Appointment</h1>
        <div className="alert alert-error">No timeslot selected. Please search and select a slot first.</div>
        <button className="btn btn-primary" onClick={() => navigate('/patient/search')}>Search Slots</button>
      </div>
    );
  }

  const handleBook = async () => {
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/appointments/book', { timeSlotId });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Booking failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div>
        <h1>Appointment Booked</h1>
        <div className="alert alert-success">Your appointment has been booked successfully.</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/patient/appointments')}>View My Appointments</button>
          <button className="btn btn-secondary" onClick={() => navigate('/patient/search')}>Book Another</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Confirm Booking</h1>
      <div className="card" style={{ maxWidth: 500 }}>
        <p>Timeslot ID: <strong>{timeSlotId}</strong></p>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={loading} onClick={handleBook}>
          {loading ? 'Booking...' : 'Confirm & Book'}
        </button>
      </div>
    </div>
  );
}
