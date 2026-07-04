import request from 'supertest'
import app from '../src/app'

export async function login(email: string, password: string) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
  expect(res.status).toBe(200)
  return { token: res.body.token, userId: res.body.user.id }
}

export async function loginAsPatient() {
  return login('patient@healthcore.test', 'Password123!')
}

export async function loginAsDoctor() {
  return login('doctor@healthcore.test', 'Password123!')
}

export async function loginAsNurse() {
  return login('nurse@healthcore.test', 'Password123!')
}

export async function loginAsAdmin() {
  return login('admin@healthcore.test', 'Password123!')
}

export { app }
