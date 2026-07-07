import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // Receives appointmentId via router state from MyAppointmentsPage
  const appointmentId = (location.state as { appointmentId?: number })?.appointmentId;

  const [cardNumber, setCardNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Guard: no appointment selected redirects back
  if (!appointmentId) {
    return (
      <div>
        <h1>Make a Payment</h1>
        <div className="alert alert-error">No appointment selected.</div>
        <button className="btn btn-primary" onClick={() => navigate('/patient/appointments')}>View Appointments</button>
      </div>
    );
  }

  // Sends payment request; strips spaces from card number before sending
  const handlePay = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await apiClient.post('/payments/authorize', {
        appointmentId,
        cardNumber: cardNumber.replace(/\s+/g, ''),
        amount: 150.00,
      });
      setMessage('Payment successful! Transaction ID: ' + res.data.transaction.id);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr?.response?.data?.message) {
        setError(axiosErr.response.data.message);
      } else {
        setError('Payment failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Make a Payment</h1>
      <div className="card" style={{ maxWidth: 500 }}>
        <p>Appointment #{appointmentId}</p>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
          Amount: $150.00
        </p>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <label>Card Number</label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="4242 4242 4242 4242"
          maxLength={19}
        />
        <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
          Use <strong>4242 4242 4242 4242</strong> for a successful payment.
        </p>

        <button className="btn btn-primary btn-block" disabled={loading || !cardNumber} onClick={handlePay}>
          {loading ? 'Processing...' : 'Pay $150.00'}
        </button>

        {message && (
          <button className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={() => navigate('/patient/appointments')}>
            View My Appointments
          </button>
        )}
      </div>
    </div>
  );
}
