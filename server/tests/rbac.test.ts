import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { loginAsPatient, loginAsDoctor, loginAsNurse } from './setup'

let patientToken: string
let doctorToken: string
let nurseToken: string

describe('RBAC', () => {
  beforeAll(async () => {
    const p = await loginAsPatient()
    patientToken = p.token
    const d = await loginAsDoctor()
    doctorToken = d.token
    const n = await loginAsNurse()
    nurseToken = n.token
  })

  it('patient cannot access admin endpoints', async () => {
    const res = await request(app)
      .post('/api/admin/hospitals')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ name: 'X', address: 'X', networkId: 1 })
    expect(res.status).toBe(403)
  })

  it('doctor cannot access admin endpoints', async () => {
    const res = await request(app)
      .post('/api/admin/hospitals')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ name: 'X', address: 'X', networkId: 1 })
    expect(res.status).toBe(403)
  })

  it('doctor cannot assign beds', async () => {
    const res = await request(app)
      .patch('/api/resources/beds/1/assign')
      .set('Authorization', `Bearer ${doctorToken}`)
    expect(res.status).toBe(403)
  })

  it('nurse cannot create staff account', async () => {
    const res = await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ name: 'X', email: 'x@x.com', password: 'Test1234!', role: 'DOCTOR', departmentId: 1 })
    expect(res.status).toBe(403)
  })

  it('patient cannot book appointment as doctor', async () => {
    // patient can book (role = PATIENT), but cannot access doctor-specific endpoints
    const res = await request(app)
      .get('/api/patients?search=john')
      .set('Authorization', `Bearer ${patientToken}`)
    expect(res.status).toBe(403)
  })

  it('patient cannot update triage', async () => {
    const res = await request(app)
      .patch('/api/triage/1/priority')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ priority: 'HIGH' })
    expect(res.status).toBe(403)
  })

  it('doctor cannot view own medical records (patient endpoint)', async () => {
    const res = await request(app)
      .get('/api/medical-records/me')
      .set('Authorization', `Bearer ${doctorToken}`)
    expect(res.status).toBe(403)
  })
})
