import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { loginAsNurse, loginAsPatient } from './setup'

let nurseToken: string
let patientToken: string
let patientUserId: number
let triageId: number

describe('Triage', () => {
  beforeAll(async () => {
    const nurseSession = await loginAsNurse()
    nurseToken = nurseSession.token

    const patientSession = await loginAsPatient()
    patientToken = patientSession.token
    patientUserId = patientSession.userId
  })

  it('nurse views triage queue', async () => {
    const res = await request(app)
      .get('/api/triage/queue')
      .set('Authorization', `Bearer ${nurseToken}`)
    expect(res.status).toBe(200)
    expect(res.body.queue.length).toBeGreaterThan(0)
  })

  it('nurse creates a triage case', async () => {
    const res = await request(app)
      .post('/api/triage')
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ patientUserId, symptoms: 'Severe headache', notes: 'Test case' })
    expect(res.status).toBe(201)
    expect(res.body.triageCase.symptoms).toBe('Severe headache')
    expect(res.body.triageCase.priority).toBe('LOW')
    triageId = res.body.triageCase.id
  })

  it('nurse updates triage priority to CRITICAL', async () => {
    const res = await request(app)
      .patch(`/api/triage/${triageId}/priority`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ priority: 'CRITICAL' })
    expect(res.status).toBe(200)
    expect(res.body.triageCaseId).toBe(triageId)
  })

  it('queue reflects priority reorder (CRITICAL first)', async () => {
    const res = await request(app)
      .get('/api/triage/queue')
      .set('Authorization', `Bearer ${nurseToken}`)
    expect(res.status).toBe(200)
    expect(res.body.queue[0].priority).toBe('CRITICAL')
  })

  it('nurse updates triage status to IN_PROGRESS', async () => {
    const res = await request(app)
      .patch(`/api/triage/${triageId}/status`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ status: 'IN_PROGRESS' })
    expect(res.status).toBe(200)
    expect(res.body.triageCaseId).toBe(triageId)
  })

  it('nurse broadcasts queue', async () => {
    const res = await request(app)
      .post('/api/triage/broadcast')
      .set('Authorization', `Bearer ${nurseToken}`)
    expect(res.status).toBe(200)
    expect(res.body.broadcast).toBe(true)
    expect(res.body.queue.length).toBeGreaterThan(0)
  })

  it('rejects invalid priority value', async () => {
    const res = await request(app)
      .patch(`/api/triage/${triageId}/priority`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ priority: 'URGENT' })
    expect(res.status).toBe(400)
  })
})
