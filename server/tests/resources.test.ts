import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../src/app'
import { loginAsNurse } from './setup'

let nurseToken: string
let unoccupiedBedId: number
let availableDeviceId: number

describe('Resources', () => {
  beforeAll(async () => {
    const session = await loginAsNurse()
    nurseToken = session.token

    const bedsRes = await request(app)
      .get('/api/resources/beds')
      .set('Authorization', `Bearer ${nurseToken}`)
    const unoccupied = bedsRes.body.beds.find((b: { status: string }) => b.status === 'UNOCCUPIED')
    unoccupiedBedId = unoccupied.id

    const devRes = await request(app)
      .get('/api/resources/devices')
      .set('Authorization', `Bearer ${nurseToken}`)
    const available = devRes.body.devices.find((d: { status: string }) => d.status === 'AVAILABLE')
    availableDeviceId = available.id
  })

  it('nurse views all beds', async () => {
    const res = await request(app)
      .get('/api/resources/beds')
      .set('Authorization', `Bearer ${nurseToken}`)
    expect(res.status).toBe(200)
    expect(res.body.beds.length).toBeGreaterThan(0)
  })

  it('nurse assigns bed → becomes OCCUPIED', async () => {
    const res = await request(app)
      .patch(`/api/resources/beds/${unoccupiedBedId}/assign`)
      .set('Authorization', `Bearer ${nurseToken}`)
    expect(res.status).toBe(200)
    expect(res.body.bed.status).toBe('OCCUPIED')
  })

  it('nurse releases bed → becomes UNOCCUPIED', async () => {
    const res = await request(app)
      .patch(`/api/resources/beds/${unoccupiedBedId}/release`)
      .set('Authorization', `Bearer ${nurseToken}`)
    expect(res.status).toBe(200)
    expect(res.body.bed.status).toBe('UNOCCUPIED')
  })

  it('nurse assigns device → becomes IN_USE', async () => {
    const res = await request(app)
      .patch(`/api/resources/devices/${availableDeviceId}/assign`)
      .set('Authorization', `Bearer ${nurseToken}`)
    expect(res.status).toBe(200)
    expect(res.body.device.status).toBe('IN_USE')
  })

  it('nurse updates device status to UNDER_MAINTENANCE', async () => {
    const res = await request(app)
      .patch(`/api/resources/devices/${availableDeviceId}/status`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ status: 'UNDER_MAINTENANCE' })
    expect(res.status).toBe(200)
    expect(res.body.device.status).toBe('UNDER_MAINTENANCE')
  })

  it('nurse views all devices', async () => {
    const res = await request(app)
      .get('/api/resources/devices')
      .set('Authorization', `Bearer ${nurseToken}`)
    expect(res.status).toBe(200)
    expect(res.body.devices.length).toBeGreaterThan(0)
  })

  it('rejects invalid device status', async () => {
    const res = await request(app)
      .patch(`/api/resources/devices/${availableDeviceId}/status`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({ status: 'BROKEN' })
    expect(res.status).toBe(400)
  })
})
