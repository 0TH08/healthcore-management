import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';

interface Patient {
  id: number; name: string; email: string;
  dateOfBirth: string | null; phone: string | null; address: string | null;
  recentRecords: { id: number; diagnosis: string; date: string }[];
}

export default function PatientSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const res = await apiClient.get('/patients', { params: { search: query } });
      setPatients(res.data.patients);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Search Patients</h1>
      <form className="filter-bar" onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          style={{ minWidth: 280, padding: '8px 12px', border: '1px solid #ccc', borderRadius: 4, fontSize: '0.95rem' }}
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {loading && <p>Searching...</p>}

      {!loading && searched && patients.length === 0 && (
        <div className="alert alert-info">No patients found matching "{query}".</div>
      )}

      <div className="patient-list">
        {patients.map((p) => (
          <div key={p.id} className="patient-card" onClick={() => navigate(`/doctor/patients/${p.id}`, { state: { patientName: p.name } })}>
            <div className="patient-info">
              <strong>{p.name}</strong>
              <span>{p.email}</span>
              {p.dateOfBirth && <span className="patient-dob">DOB: {new Date(p.dateOfBirth).toLocaleDateString()}</span>}
              {p.phone && <span>{p.phone}</span>}
            </div>
            <div className="patient-meta">
              <span className="badge">{p.recentRecords.length} record{p.recentRecords.length !== 1 ? 's' : ''}</span>
              <span className="click-hint">View Records →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
