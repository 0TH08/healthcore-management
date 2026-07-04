import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { loginAsPatient, loginAsDoctor } from './setup'

let patientToken: string
let doctorToken: string
let recordId: number
let patientUserId: number

describe('Medical Records', () => {
  beforeAll(async () => {
    const patientSession = await loginAsPatient()
    patientToken = patientSession.token
    patientUserId = patientSession.userId

    const doctorSession = await loginAsDoctor()
    doctorToken = doctorSession.token
  })

  it('patient views own medical records', async () => {
    const res = await request(app)
      .get('/api/medical-records/me')
      .set('Authorization', `Bearer ${patientToken}`)
    expect(res.status).toBe(200)
    expect(res.body.records.length).toBeGreaterThan(0)
    expect(res.body.records[0]).toHaveProperty('allergies')
    expect(res.body.records[0]).toHaveProperty('prescriptions')
    recordId = res.body.records[0].id
  })

  it('patient exports own records as text', async () => {
    const res = await request(app)
      .get('/api/medical-records/me/export')
      .set('Authorization', `Bearer ${patientToken}`)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/plain/)
  })

  it('doctor updates a medical record', async () => {
    const res = await request(app)
      .patch(`/api/medical-records/${recordId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ notes: 'Updated by doctor during test' })
    expect(res.status).toBe(200)
    expect(res.body.record.notes).toBe('Updated by doctor during test')
  })

  it('doctor creates a prescription', async () => {
    const res = await request(app)
      .post(`/api/medical-records/${recordId}/prescriptions`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        medication: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'As needed',
        startDate: new Date().toISOString().split('T')[0],
      })
    expect(res.status).toBe(201)
    expect(res.body.prescription.medication).toBe('Ibuprofen')
  })

  it('doctor searches patients', async () => {
    const res = await request(app)
      .get('/api/patients?search=john')
      .set('Authorization', `Bearer ${doctorToken}`)
    expect(res.status).toBe(200)
    expect(res.body.patients.length).toBeGreaterThan(0)
  })

  it('doctor consults patient medical records', async () => {
    const res = await request(app)
      .get(`/api/medical-records/${patientUserId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
    expect(res.status).toBe(200)
    expect(res.body.records.length).toBeGreaterThan(0)
  })
})
