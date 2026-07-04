import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { loginAsPatient } from './setup'

let token: string
let timeSlotId: number

describe('Appointments', () => {
  beforeAll(async () => {
    const session = await loginAsPatient()
    token = session.token
  })

  it('lists departments', async () => {
    const res = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.departments.length).toBeGreaterThan(0)
    expect(res.body.departments[0]).toHaveProperty('name')
  })

  it('lists available timeslots', async () => {
    const res = await request(app)
      .get('/api/timeslots')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.timeSlots.length).toBeGreaterThan(0)
    timeSlotId = res.body.timeSlots[0].id
  })

  it('books an available timeslot', async () => {
    const res = await request(app)
      .post('/api/appointments/book')
      .set('Authorization', `Bearer ${token}`)
      .send({ timeSlotId })
    expect(res.status).toBe(201)
    expect(res.body.appointment.status).toBe('BOOKED')
    expect(res.body.appointment.id).toBeDefined()
  })

  it('rejects double booking the same slot', async () => {
    const res = await request(app)
      .post('/api/appointments/book')
      .set('Authorization', `Bearer ${token}`)
      .send({ timeSlotId })
    expect(res.status).toBe(409)
  })

  it('lists my appointments', async () => {
    const res = await request(app)
      .get('/api/appointments/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.appointments.length).toBeGreaterThan(0)
  })
})
