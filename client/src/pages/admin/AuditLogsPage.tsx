import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

interface AuditLog {
  id: number; adminId: number; action: string; entity: string;
  entityId: number; details: string | null; createdAt: string;
  admin: { id: number; name: string; email: string };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/admin/audit-logs').then((r) => {
      setLogs(r.data.logs);
    }).catch((err) => {
      const msg = err?.response?.data?.message || 'Failed to load audit logs.';
      setError(msg);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Audit Logs</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {!error && logs.length === 0 && <div className="alert alert-info">No audit logs found.</div>}
      <div className="audit-list">
        {logs.map((l) => (
          <div key={l.id} className="audit-row">
            <div className="audit-header">
              <span className="audit-action">{l.action}</span>
              <span className="audit-entity">{l.entity} #{l.entityId}</span>
              <span className="audit-date">{new Date(l.createdAt).toLocaleString()}</span>
            </div>
            <div className="audit-admin">by {l.admin.name} ({l.admin.email})</div>
            {l.details && <div className="audit-details">{l.details}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
