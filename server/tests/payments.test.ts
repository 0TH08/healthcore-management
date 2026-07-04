import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { loginAsPatient } from './setup'

let token: string
let appointmentId: number

describe('Payments', () => {
  beforeAll(async () => {
    const session = await loginAsPatient()
    token = session.token

    const tsRes = await request(app)
      .get('/api/timeslots')
      .set('Authorization', `Bearer ${token}`)
    const slotId = tsRes.body.timeSlots[0].id

    const bookRes = await request(app)
      .post('/api/appointments/book')
      .set('Authorization', `Bearer ${token}`)
      .send({ timeSlotId: slotId })
    appointmentId = bookRes.body.appointment.id
  })

  it('approves mock card 4242 4242 4242 4242', async () => {
    const res = await request(app)
      .post('/api/payments/authorize')
      .set('Authorization', `Bearer ${token}`)
      .send({ appointmentId, cardNumber: '4242424242424242', amount: 150.00 })
    expect(res.status).toBe(201)
    expect(res.body.transaction.status).toBe('COMPLETED')
  })

  it('rejects invalid card', async () => {
    const tsRes = await request(app)
      .get('/api/timeslots')
      .set('Authorization', `Bearer ${token}`)
    const slotId = tsRes.body.timeSlots[0].id

    const bookRes = await request(app)
      .post('/api/appointments/book')
      .set('Authorization', `Bearer ${token}`)
      .send({ timeSlotId: slotId })
    const apptId = bookRes.body.appointment.id

    const res = await request(app)
      .post('/api/payments/authorize')
      .set('Authorization', `Bearer ${token}`)
      .send({ appointmentId: apptId, cardNumber: '1111222233334444', amount: 150.00 })
    expect(res.status).toBe(402)
    expect(res.body.status).toBe('error')
  })

  it('handles card number with spaces', async () => {
    const tsRes = await request(app)
      .get('/api/timeslots')
      .set('Authorization', `Bearer ${token}`)
    const slotId = tsRes.body.timeSlots[0].id

    const bookRes = await request(app)
      .post('/api/appointments/book')
      .set('Authorization', `Bearer ${token}`)
      .send({ timeSlotId: slotId })
    const apptId = bookRes.body.appointment.id

    const res = await request(app)
      .post('/api/payments/authorize')
      .set('Authorization', `Bearer ${token}`)
      .send({ appointmentId: apptId, cardNumber: '4242 4242 4242 4242', amount: 200.00 })
    expect(res.status).toBe(201)
    expect(res.body.transaction.status).toBe('COMPLETED')
  })
})
