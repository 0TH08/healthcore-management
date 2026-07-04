import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../api/apiClient';

interface Allergy { id: number; allergen: string; severity: string; reaction: string | null }
interface Prescription { id: number; medication: string; dosage: string; frequency: string; startDate: string; endDate: string | null }
interface MedicalRecord { id: number; patientId: number; diagnosis: string; notes: string | null; date: string; allergies: Allergy[]; prescriptions: Prescription[] }

export default function PatientMedicalRecordPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const patientName = (location.state as { patientName?: string })?.patientName ?? `Patient #${patientId}`;
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<number | null>(null);
  const [editDiagnosis, setEditDiagnosis] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    apiClient.get(`/medical-records/${patientId}`).then((r) => {
      setRecords(r.data.records);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [patientId]);

  const startEdit = (r: MedicalRecord) => {
    setEditingRecord(r.id);
    setEditDiagnosis(r.diagnosis);
    setEditNotes(r.notes ?? '');
    setUpdateMsg('');
  };

  const saveUpdate = async () => {
    if (!editingRecord) return;
    try {
      const res = await apiClient.patch(`/medical-records/${editingRecord}`, {
        diagnosis: editDiagnosis,
        notes: editNotes,
      });
      setRecords((prev) => prev.map((r) => r.id === editingRecord ? { ...r, ...res.data.record } : r));
      setUpdateMsg('Record updated successfully.');
      setEditingRecord(null);
    } catch {
      setUpdateMsg('Failed to update record.');
    }
  };

  const cancelEdit = () => {
    setEditingRecord(null);
    setUpdateMsg('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{patientName || 'Patient'} — Medical Records</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/doctor/patients')}>Back to Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && records.length === 0 && <div className="alert alert-info">No medical records for this patient.</div>}
      {updateMsg && <div className={`alert ${updateMsg.includes('successfully') ? 'alert-success' : 'alert-error'}`}>{updateMsg}</div>}

      {records.map((r) => (
        <div key={r.id} className="record-card">
          <div className="record-header">
            <strong>{new Date(r.date).toLocaleDateString()}</strong>
          </div>

          {editingRecord === r.id ? (
            <div className="edit-form">
              <label>Diagnosis</label>
              <input type="text" value={editDiagnosis} onChange={(e) => setEditDiagnosis(e.target.value)} />
              <label>Notes</label>
              <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={4} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary" onClick={saveUpdate}>Save</button>
                <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <p className="record-diagnosis">{r.diagnosis}</p>
              {r.notes && <p className="record-notes">{r.notes}</p>}
              <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => startEdit(r)}>Edit Record</button>
            </div>
          )}

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

          <div className="record-section">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/doctor/patients/${patientId}/records/${r.id}/prescription`)}
            >
              Add Prescription
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
