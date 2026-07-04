import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/app'

const TEST_EMAIL = `testuser_${Date.now()}@test.com`

describe('Auth', () => {
  it('registers a new patient', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: 'TestPass123', name: 'Test User' })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe(TEST_EMAIL)
    expect(res.body.user.role).toBe('PATIENT')
  })

  it('rejects duplicate registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: 'TestPass123', name: 'Test User' })
    expect(res.status).toBe(409)
  })

  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@healthcore.test', password: 'Password123!' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('patient@healthcore.test')
  })

  it('rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@healthcore.test', password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })

  it('rejects non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noone@test.com', password: 'Password123!' })
    expect(res.status).toBe(401)
  })

  it('returns current user from /me', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@healthcore.test', password: 'Password123!' })
    const token = loginRes.body.token

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('patient@healthcore.test')
  })

  it('rejects /me without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})
