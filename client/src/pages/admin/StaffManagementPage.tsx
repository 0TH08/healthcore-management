import { useState, type FormEvent } from 'react';
import apiClient from '../../api/apiClient';

const STAFF_ROLES = ['DOCTOR', 'NURSE', 'ADMIN'] as const;

export default function StaffManagementPage() {
  // Create staff
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [role, setRole] = useState('DOCTOR');
  const [specialization, setSpecialization] = useState(''); const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('1');
  const [createMsg, setCreateMsg] = useState('');

  // Deactivate
  const [deactId, setDeactId] = useState('');
  const [deactMsg, setDeactMsg] = useState('');

  // Change role
  const [roleId, setRoleId] = useState('');
  const [newRole, setNewRole] = useState('DOCTOR');
  const [roleMsg, setRoleMsg] = useState('');

  // Creates staff via admin endpoint; sends optional fields only if filled in
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault(); setCreateMsg('');
    try {
      const res = await apiClient.post('/admin/staff', {
        name, email, password, role, departmentId: Number(departmentId),
        ...(specialization ? { specialization } : {}),
        ...(phone ? { phone } : {}),
      });
      setCreateMsg(`Staff created: ${res.data.staff.name} (${res.data.staff.role})`);
      setName(''); setEmail(''); setPassword(''); setRole('DOCTOR');
      setSpecialization(''); setPhone(''); setDepartmentId('1');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.';
      setCreateMsg(msg);
    }
  };

  const handleDeactivate = async () => {
    setDeactMsg('');
    try {
      const res = await apiClient.patch(`/admin/staff/${deactId}/deactivate`);
      setDeactMsg(`Staff deactivated: ${res.data.staff.name}`);
      setDeactId('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.';
      setDeactMsg(msg);
    }
  };

  const handleRoleChange = async () => {
    setRoleMsg('');
    try {
      const res = await apiClient.patch(`/admin/staff/${roleId}/role`, { role: newRole });
      setRoleMsg(`Role changed: ${res.data.staff.name} → ${res.data.staff.role}`);
      setRoleId('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.';
      setRoleMsg(msg);
    }
  };

  return (
    <div>
      <h1>Staff Management</h1>

      {/* Create Staff */}
      <h2 style={{ marginTop: 20, fontSize: '1.15rem' }}>Create Staff Account</h2>
      <form className="card" style={{ maxWidth: 500, marginTop: 8 }} onSubmit={handleCreate}>
        {createMsg && <div className={`alert ${createMsg.includes('created') ? 'alert-success' : 'alert-error'}`}>{createMsg}</div>}
        <label>Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <label>Department ID</label>
        <input type="number" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required />
        <label>Specialization (optional)</label>
        <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
        <label>Phone (optional)</label>
        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button type="submit" className="btn btn-primary btn-block">Create Staff</button>
      </form>

      {/* Deactivate */}
      <h2 style={{ marginTop: 28, fontSize: '1.15rem' }}>Deactivate Staff Account</h2>
      <div className="card" style={{ maxWidth: 500, marginTop: 8 }}>
        {deactMsg && <div className={`alert ${deactMsg.includes('deactivated') ? 'alert-success' : 'alert-error'}`}>{deactMsg}</div>}
        <label>Staff User ID</label>
        <input type="number" value={deactId} onChange={(e) => setDeactId(e.target.value)} placeholder="Staff ID" />
        <button className="btn btn-primary btn-block" onClick={handleDeactivate} disabled={!deactId}>Deactivate</button>
      </div>

      {/* Change Role */}
      <h2 style={{ marginTop: 28, fontSize: '1.15rem' }}>Change Staff Role</h2>
      <div className="card" style={{ maxWidth: 500, marginTop: 8 }}>
        {roleMsg && <div className={`alert ${roleMsg.includes('changed') ? 'alert-success' : 'alert-error'}`}>{roleMsg}</div>}
        <label>Staff User ID</label>
        <input type="number" value={roleId} onChange={(e) => setRoleId(e.target.value)} placeholder="Staff ID" />
        <label>New Role</label>
        <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
          {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="btn btn-primary btn-block" onClick={handleRoleChange} disabled={!roleId}>Change Role</button>
      </div>
    </div>
  );
}
