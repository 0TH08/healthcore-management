import { useEffect, useState, type FormEvent } from 'react';
import apiClient from '../../api/apiClient';

interface TriageCase {
  id: number; patientId: number; patientName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  symptoms: string; notes: string | null;
  nurseName: string | null; createdAt: string;
}

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const STATUSES = ['WAITING', 'IN_PROGRESS', 'COMPLETED'] as const;

export default function TriageQueuePage() {
  const [queue, setQueue] = useState<TriageCase[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [patientUserId, setPatientUserId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [createMsg, setCreateMsg] = useState('');

  // Update fields
  const [updating, setUpdating] = useState<number | null>(null);

  // Fetch the full triage queue
  const fetchQueue = () => {
    setLoading(true);
    apiClient.get('/triage/queue').then((r) => setQueue(r.data.queue)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(fetchQueue, []);

  // Creates a new triage case and refreshes the queue
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateMsg('');
    try {
      await apiClient.post('/triage', { patientUserId: Number(patientUserId), symptoms, notes: notes || undefined });
      setCreateMsg('Triage case created.');
      setShowCreate(false);
      setPatientUserId('');
      setSymptoms('');
      setNotes('');
      fetchQueue();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create case.';
      setCreateMsg(msg);
    }
  };

  // Updates priority or status inline via select dropdown change + re-fetches queue
  const updatePriority = async (id: number, priority: string) => {
    try {
      await apiClient.patch(`/triage/${id}/priority`, { priority });
      fetchQueue();
    } catch {
      alert('Failed to update priority');
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await apiClient.patch(`/triage/${id}/status`, { status });
      fetchQueue();
    } catch {
      alert('Failed to update status');
    }
  };

  const broadcast = async () => {
    try {
      await apiClient.post('/triage/broadcast');
      alert('Queue broadcast to displays.');
    } catch {
      alert('Broadcast failed');
    }
  };

  const priorityClass = (p: string) => {
    if (p === 'CRITICAL') return 'priority-critical';
    if (p === 'HIGH') return 'priority-high';
    if (p === 'MEDIUM') return 'priority-medium';
    return 'priority-low';
  };

  const statusClass = (s: string) => {
    if (s === 'WAITING') return 'status-badge status-requested';
    if (s === 'IN_PROGRESS') return 'status-badge status-booked';
    return 'status-badge status-completed';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h1>Triage Queue</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : 'New Case'}
          </button>
          <button className="btn btn-secondary" onClick={broadcast}>Broadcast Queue</button>
        </div>
      </div>

      {showCreate && (
        <form className="card" style={{ maxWidth: 500, marginTop: 16 }} onSubmit={handleCreate}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>New Triage Case</h2>
          {createMsg && <div className={`alert ${createMsg.includes('created') ? 'alert-success' : 'alert-error'}`}>{createMsg}</div>}
          <label>Patient User ID</label>
          <input type="number" value={patientUserId} onChange={(e) => setPatientUserId(e.target.value)} required />
          <label>Symptoms</label>
          <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={2} required />
          <label>Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          <button type="submit" className="btn btn-primary btn-block">Create Case</button>
        </form>
      )}

      {loading && <p>Loading...</p>}

      {!loading && queue.length === 0 && <div className="alert alert-info">No triage cases.</div>}

      <div className="triage-list">
        {queue.map((c) => (
          <div key={c.id} className={`triage-card priority-${c.priority.toLowerCase()}`}>
            <div className="triage-header">
              <strong>#{c.id} {c.patientName}</strong>
              <span className={`priority-badge ${priorityClass(c.priority)}`}>{c.priority}</span>
            </div>
            <div className="triage-body">
              <p><strong>Symptoms:</strong> {c.symptoms}</p>
              {c.notes && <p><strong>Notes:</strong> {c.notes}</p>}
              <p style={{ fontSize: '0.85rem', color: '#888' }}>
                Nurse: {c.nurseName || 'Unassigned'} · Created: {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="triage-actions">
              <div className="triage-action-group">
                <label>Priority:</label>
                <select
                  value={c.priority}
                  onChange={(e) => updatePriority(c.id, e.target.value)}
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="triage-action-group">
                <label>Status:</label>
                <select
                  value={c.status}
                  onChange={(e) => updateStatus(c.id, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
