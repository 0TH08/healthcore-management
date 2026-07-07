import { useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function PrescriptionPage() {
  const { patientId, recordId } = useParams();
  const navigate = useNavigate();
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Posts a new prescription to a specific medical record; endDate is optional
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await apiClient.post(`/medical-records/${recordId}/prescriptions`, {
        medication, dosage, frequency, startDate,
        ...(endDate ? { endDate } : {}),
      });
      setMessage('Prescription created successfully.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create prescription.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Create Prescription</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>Record #{recordId}</p>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form className="card" style={{ maxWidth: 500 }} onSubmit={handleSubmit}>
        <label>Medication</label>
        <input type="text" value={medication} onChange={(e) => setMedication(e.target.value)} placeholder="Ibuprofen" required />

        <label>Dosage</label>
        <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="400mg" required />

        <label>Frequency</label>
        <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="As needed" required />

        <label>Start Date</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />

        <label>End Date (optional)</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Creating...' : 'Create Prescription'}
        </button>
      </form>

      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate(`/doctor/patients/${patientId}`)}>
        Back to Patient Records
      </button>
    </div>
  );
}
