import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { loginAsAdmin } from './setup'

let adminToken: string
let hospitalId: number
let departmentId: number
let bedId: number
let deviceId: number
let staffId: number

// Discover a valid networkId by probing
async function findNetworkId(token: string): Promise<number> {
  for (let nid = 1; nid <= 50; nid++) {
    const res = await request(app)
      .post('/api/admin/hospitals')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Probe-${nid}`, address: 'Probe', networkId: nid })
    if (res.status === 201) {
      await request(app)
        .delete(`/api/admin/hospitals/${res.body.hospital.id}`)
        .set('Authorization', `Bearer ${token}`)
      return nid
    }
  }
  throw new Error('Could not find valid networkId')
}

describe('Admin Infrastructure', () => {
  beforeAll(async () => {
    const session = await loginAsAdmin()
    adminToken = session.token
  })

  it('admin creates a hospital', async () => {
    const networkId = await findNetworkId(adminToken)
    const res = await request(app)
      .post('/api/admin/hospitals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Hospital', address: '123 Test St', networkId })
    expect(res.status).toBe(201)
    hospitalId = res.body.hospital.id
  })

  it('admin creates a department', async () => {
    const res = await request(app)
      .post('/api/admin/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Department', hospitalId })
    expect(res.status).toBe(201)
    departmentId = res.body.department.id
  })

  it('admin creates a bed', async () => {
    const res = await request(app)
      .post('/api/admin/beds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bedNumber: 'TEST-B01', departmentId })
    expect(res.status).toBe(201)
    expect(res.body.bed.bedNumber).toBe('TEST-B01')
    bedId = res.body.bed.id
  })

  it('admin updates a bed', async () => {
    const res = await request(app)
      .patch(`/api/admin/beds/${bedId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bedNumber: 'TEST-B01-UPDATED' })
    expect(res.status).toBe(200)
    expect(res.body.bed.bedNumber).toBe('TEST-B01-UPDATED')
  })

  it('admin deletes a bed', async () => {
    const res = await request(app)
      .delete(`/api/admin/beds/${bedId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('admin creates a medical device', async () => {
    const res = await request(app)
      .post('/api/admin/medical-devices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Device', type: 'Diagnostic', departmentId })
    expect(res.status).toBe(201)
    expect(res.body.device.name).toBe('Test Device')
    deviceId = res.body.device.id
  })

  it('admin creates a staff account', async () => {
    const email = `dr_test_${Date.now()}@test.com`
    const res = await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Test',
        email,
        password: 'Test1234!',
        role: 'DOCTOR',
        specialization: 'Test Medicine',
        departmentId,
      })
    expect(res.status).toBe(201)
    expect(res.body.staff.role).toBe('DOCTOR')
    staffId = res.body.staff.id
  })

  it('admin deactivates a staff account', async () => {
    const res = await request(app)
      .patch(`/api/admin/staff/${staffId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.staff.status).toBe('INACTIVE')
  })

  it('admin changes staff role', async () => {
    const res = await request(app)
      .patch(`/api/admin/staff/${staffId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'NURSE' })
    expect(res.status).toBe(200)
    expect(res.body.staff.role).toBe('NURSE')
  })

  it('audit log is created for admin actions', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.logs.length).toBeGreaterThan(0)
    expect(res.body.logs[0]).toHaveProperty('action')
    expect(res.body.logs[0]).toHaveProperty('entity')
    expect(res.body.logs[0]).toHaveProperty('admin')
  })
})
