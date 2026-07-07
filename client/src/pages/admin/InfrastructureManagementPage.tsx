import { useEffect, useState, type FormEvent } from 'react';
import apiClient from '../../api/apiClient';

interface Department { id: number; name: string; hospitalName: string }
interface Bed { id: number; bedNumber: string; status: string; departmentName: string }
interface Device { id: number; name: string; type: string; status: string; departmentName: string }
interface Hospital { id: number; name: string; address: string }

export default function InfrastructureManagementPage() {
  const tab = (name: string) => <button key={name} className={`btn ${activeTab === name ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(name)} style={{ fontSize: '0.85rem' }}>{name}</button>;

  const [activeTab, setActiveTab] = useState('Hospitals');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [msg, setMsg] = useState('');

  // Hospital form
  const [hName, setHName] = useState(''); const [hAddr, setHAddr] = useState(''); const [hNetId, setHNetId] = useState('1');
  const [hUpdId, setHUpdId] = useState(''); const [hDelId, setHDelId] = useState('');

  // Department form
  const [dName, setDName] = useState(''); const [dHospId, setDHospId] = useState('1');
  const [dUpdId, setDUpdId] = useState(''); const [dUpdName, setDUpdName] = useState('');
  const [dDelId, setDDelId] = useState('');

  // Bed form
  const [bNum, setBNum] = useState(''); const [bDeptId, setBDeptId] = useState('1');
  const [bUpdId, setBUpdId] = useState(''); const [bUpdNum, setBUpdNum] = useState(''); const [bDelId, setBDelId] = useState('');

  // Device form
  const [dvName, setDvName] = useState(''); const [dvType, setDvType] = useState(''); const [dvDeptId, setDvDeptId] = useState('1');

  // Loads all entity lists at once; used both on mount and after mutations
  const fetchData = () => {
    apiClient.get('/admin/hospitals').then((r) => setHospitals(r.data.hospitals)).catch(() => {});
    apiClient.get('/departments').then((r) => setDepartments(r.data.departments)).catch(() => {});
    apiClient.get('/resources/beds').then((r) => setBeds(r.data.beds)).catch(() => {});
    apiClient.get('/resources/devices').then((r) => setDevices(r.data.devices)).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(fetchData, []);

  const clearMsg = () => setMsg('');

  // --- Hospitals ---
  const createHospital = async (e: FormEvent) => {
    e.preventDefault(); clearMsg();
    try { const r = await apiClient.post('/admin/hospitals', { name: hName, address: hAddr, networkId: Number(hNetId) }); setMsg(`Hospital created: ${r.data.hospital.name}`); setHName(''); setHAddr(''); fetchData(); } catch (err: unknown) { setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'); }
  };
  const updateHospital = async () => {
    clearMsg();
    try { const r = await apiClient.patch(`/admin/hospitals/${hUpdId}`, { name: hName || undefined, address: hAddr || undefined, networkId: hNetId ? Number(hNetId) : undefined }); setMsg(`Hospital updated: ${r.data.hospital.name}`); setHUpdId(''); fetchData(); } catch (err: unknown) { setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'); }
  };
  const deleteHospital = async () => {
    clearMsg();
    try { await apiClient.delete(`/admin/hospitals/${hDelId}`); setMsg('Hospital deleted.'); setHDelId(''); fetchData(); } catch (err: unknown) { setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'); }
  };

  // --- Departments ---
  const createDepartment = async (e: FormEvent) => {
    e.preventDefault(); clearMsg();
    try { const r = await apiClient.post('/admin/departments', { name: dName, hospitalId: Number(dHospId) }); setMsg(`Department created: ${r.data.department.name}`); setDName(''); } catch (err: unknown) { setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'); }
  };
  const updateDepartment = async () => {
    clearMsg();
    try { const r = await apiClient.patch(`/admin/departments/${dUpdId}`, { name: dUpdName || undefined }); setMsg(`Department updated: ${r.data.department.name}`); setDUpdId(''); setDUpdName(''); } catch (err: unknown) { setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'); }
  };
  const deleteDepartment = async () => {
    clearMsg();
    try { await apiClient.delete(`/admin/departments/${dDelId}`); setMsg('Department deleted.'); setDDelId(''); fetchData(); } catch (err: unknown) { setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'); }
  };

  // --- Beds ---
  const createBed = async (e: FormEvent) => {
    e.preventDefault(); clearMsg();
    try { const r = await apiClient.post('/admin/beds', { bedNumber: bNum, departmentId: Number(bDeptId) }); setMsg(`Bed created: ${r.data.bed.bedNumber}`); setBNum(''); } catch (err: unknown) { setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'); }
  };
  const updateBed = async () => {
    clearMsg();
    try { const r = await apiClient.patch(`/admin/beds/${bUpdId}`, { bedNumber: bUpdNum || undefined }); setMsg(`Bed updated: ${r.data.bed.bedNumber}`); setBUpdId(''); setBUpdNum(''); } catch (err: unknown) { setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'); }
  };
  const deleteBed = async () => {
    clearMsg();
    try { await apiClient.delete(`/admin/beds/${bDelId}`); setMsg('Bed deleted.'); setBDelId(''); fetchData(); } catch (err: unknown) { setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'); }
  };

  // --- Devices ---
  const createDevice = async (e: FormEvent) => {
    e.preventDefault(); clearMsg();
    try { const r = await apiClient.post('/admin/medical-devices', { name: dvName, type: dvType, departmentId: Number(dvDeptId) }); setMsg(`Device created: ${r.data.device.name}`); setDvName(''); setDvType(''); } catch (err: unknown) { setMsg((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed.'); }
  };

  return (
    <div>
      <h1>Infrastructure Management</h1>
      <div className="filter-bar" style={{ marginBottom: 16 }}>
        {tab('Hospitals')}{tab('Departments')}{tab('Beds')}{tab('Devices')}
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}

      {/* Existing Data Overview */}
      {activeTab !== 'Devices' && (
        <div style={{ marginBottom: 20 }}>
          {activeTab === 'Hospitals' && hospitals.length > 0 && <><h3>Existing Hospitals</h3>{hospitals.map((h) => <div key={h.id} className="admin-row"><strong>{h.name}</strong> — {h.address}</div>)}</>}
          {activeTab === 'Departments' && <><h3>Existing Departments</h3>{departments.map((d) => <div key={d.id} className="admin-row">{d.id} — {d.name} ({d.hospitalName})</div>)}</>}
          {activeTab === 'Beds' && <><h3>Existing Beds</h3>{beds.map((b) => <div key={b.id} className="admin-row">{b.id} — {b.bedNumber} [{b.status}] {b.departmentName}</div>)}</>}
        </div>
      )}

      {/* --- Hospitals Tab --- */}
      {activeTab === 'Hospitals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Create Hospital</h2>
            <form onSubmit={createHospital}>
              <label>Name</label><input value={hName} onChange={(e) => setHName(e.target.value)} required />
              <label>Address</label><input value={hAddr} onChange={(e) => setHAddr(e.target.value)} required />
              <label>Network ID</label><input type="number" value={hNetId} onChange={(e) => setHNetId(e.target.value)} required />
              <button type="submit" className="btn btn-primary btn-block">Create</button>
            </form>
          </div>
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Update Hospital</h2>
            <label>Hospital ID</label><input type="number" value={hUpdId} onChange={(e) => setHUpdId(e.target.value)} />
            <label>New Name (leave blank to keep)</label><input value={hName} onChange={(e) => setHName(e.target.value)} />
            <label>New Address</label><input value={hAddr} onChange={(e) => setHAddr(e.target.value)} />
            <label>New Network ID</label><input type="number" value={hNetId} onChange={(e) => setHNetId(e.target.value)} />
            <button className="btn btn-primary btn-block" onClick={updateHospital} disabled={!hUpdId}>Update</button>
          </div>
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Delete Hospital</h2>
            <label>Hospital ID</label><input type="number" value={hDelId} onChange={(e) => setHDelId(e.target.value)} />
            <button className="btn btn-primary btn-block" onClick={deleteHospital} disabled={!hDelId}>Delete</button>
          </div>
        </div>
      )}

      {/* --- Departments Tab --- */}
      {activeTab === 'Departments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Create Department</h2>
            <form onSubmit={createDepartment}>
              <label>Name</label><input value={dName} onChange={(e) => setDName(e.target.value)} required />
              <label>Hospital ID</label><input type="number" value={dHospId} onChange={(e) => setDHospId(e.target.value)} required />
              <button type="submit" className="btn btn-primary btn-block">Create</button>
            </form>
          </div>
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Update Department</h2>
            <label>Department ID</label><input type="number" value={dUpdId} onChange={(e) => setDUpdId(e.target.value)} />
            <label>New Name</label><input value={dUpdName} onChange={(e) => setDUpdName(e.target.value)} />
            <button className="btn btn-primary btn-block" onClick={updateDepartment} disabled={!dUpdId}>Update</button>
          </div>
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Delete Department</h2>
            <label>Department ID</label><input type="number" value={dDelId} onChange={(e) => setDDelId(e.target.value)} />
            <button className="btn btn-primary btn-block" onClick={deleteDepartment} disabled={!dDelId}>Delete</button>
          </div>
        </div>
      )}

      {/* --- Beds Tab --- */}
      {activeTab === 'Beds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Create Bed</h2>
            <form onSubmit={createBed}>
              <label>Bed Number</label><input value={bNum} onChange={(e) => setBNum(e.target.value)} required />
              <label>Department ID</label><input type="number" value={bDeptId} onChange={(e) => setBDeptId(e.target.value)} required />
              <button type="submit" className="btn btn-primary btn-block">Create</button>
            </form>
          </div>
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Update Bed</h2>
            <label>Bed ID</label><input type="number" value={bUpdId} onChange={(e) => setBUpdId(e.target.value)} />
            <label>New Bed Number</label><input value={bUpdNum} onChange={(e) => setBUpdNum(e.target.value)} />
            <button className="btn btn-primary btn-block" onClick={updateBed} disabled={!bUpdId}>Update</button>
          </div>
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Delete Bed</h2>
            <label>Bed ID</label><input type="number" value={bDelId} onChange={(e) => setBDelId(e.target.value)} />
            <button className="btn btn-primary btn-block" onClick={deleteBed} disabled={!bDelId}>Delete</button>
          </div>
        </div>
      )}

      {/* --- Devices Tab --- */}
      {activeTab === 'Devices' && (
        <div>
          {devices.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3>Existing Devices</h3>
              {devices.map((d) => <div key={d.id} className="admin-row">{d.id} — {d.name} ({d.type}) [{d.status}] {d.departmentName}</div>)}
            </div>
          )}
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.1rem' }}>Add Medical Device</h2>
            <form onSubmit={createDevice}>
              <label>Device Name</label><input value={dvName} onChange={(e) => setDvName(e.target.value)} required />
              <label>Type</label><input value={dvType} onChange={(e) => setDvType(e.target.value)} required />
              <label>Department ID</label><input type="number" value={dvDeptId} onChange={(e) => setDvDeptId(e.target.value)} required />
              <button type="submit" className="btn btn-primary btn-block">Add Device</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
