import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

interface Allergy { id: number; allergen: string; severity: string; reaction: string | null }
interface Prescription { id: number; medication: string; dosage: string; frequency: string; startDate: string; endDate: string | null }
interface MedicalRecord { id: number; diagnosis: string; notes: string | null; date: string; allergies: Allergy[]; prescriptions: Prescription[] }

export default function MyMedicalRecordPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch the logged-in patient's medical records (including allergies & prescriptions)
  useEffect(() => {
    apiClient.get('/medical-records/me').then((r) => {
      setRecords(r.data.records);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Downloads records as a .txt file using a blob + hidden anchor trick
  const handleExport = () => {
    apiClient.get('/medical-records/me/export', { responseType: 'blob' }).then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'medical-records.txt';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Medical Records</h1>
        {records.length > 0 && (
          <button className="btn btn-secondary" onClick={handleExport}>Export as Text</button>
        )}
      </div>

      {loading && <p>Loading...</p>}

      {!loading && records.length === 0 && (
        <div className="alert alert-info">No medical records found.</div>
      )}

      {records.map((r) => (
        <div key={r.id} className="record-card">
          <div className="record-header">
            <strong>{new Date(r.date).toLocaleDateString()}</strong>
            <span className="record-diagnosis">{r.diagnosis}</span>
          </div>
          {r.notes && <p className="record-notes">{r.notes}</p>}

          {r.allergies.length > 0 && (
            <div className="record-section">
              <h4>Allergies</h4>
              {r.allergies.map((a) => (
                <div key={a.id} className="allergy-item">
                  <span className="allergen">{a.allergen}</span>
                  <span className={`severity severity-${a.severity.toLowerCase()}`}>{a.severity}</span>
                  {a.reaction && <span className="reaction">{a.reaction}</span>}
                </div>
              ))}
            </div>
          )}

          {r.prescriptions.length > 0 && (
            <div className="record-section">
              <h4>Prescriptions</h4>
              {r.prescriptions.map((p) => (
                <div key={p.id} className="prescription-item">
                  <span className="medication">{p.medication}</span>
                  <span>{p.dosage} · {p.frequency}</span>
                  <span className="dates">Start: {new Date(p.startDate).toLocaleDateString()}{p.endDate ? ` · End: ${new Date(p.endDate).toLocaleDateString()}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
