import supertest from 'supertest'

process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-do-not-use-in-prod'
process.env.DATABASE_URL = ':memory:'

import { app } from '../../src/main'

const request = supertest(app)

describe('Auth — register', () => {
  it('creates a new user', async () => {
    const res = await request
      .post('/auth/register')
      .send({ email: 'newuser@example.com', password: 'SecurePass123!' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('userId')
    expect(res.body).toHaveProperty('email', 'newuser@example.com')
  })

  it('returns 409 on duplicate email', async () => {
    await request
      .post('/auth/register')
      .send({ email: 'dup@example.com', password: 'pass' })
    const res = await request
      .post('/auth/register')
      .send({ email: 'dup@example.com', password: 'pass' })
    expect(res.status).toBe(409)
  })

  it('returns 400 when email is missing', async () => {
    const res = await request.post('/auth/register').send({ password: 'pass' })
    expect(res.status).toBe(400)
  })
})

describe('Auth — login', () => {
  beforeEach(async () => {
    await request
      .post('/auth/register')
      .send({ email: 'logintest@example.com', password: 'SecurePass123!' })
  })

  it('returns tokens on valid credentials', async () => {
    const res = await request
      .post('/auth/login')
      .send({ email: 'logintest@example.com', password: 'SecurePass123!' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body).toHaveProperty('refreshToken')
    expect(res.body).toHaveProperty('expiresIn', 900)
  })

  it('returns 401 on wrong password', async () => {
    const res = await request
      .post('/auth/login')
      .send({ email: 'logintest@example.com', password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })

  it('returns 401 for unknown user', async () => {
    const res = await request
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'pass' })
    expect(res.status).toBe(401)
  })
})

describe('Auth — refresh', () => {
  let refreshToken: string

  beforeEach(async () => {
    await request
      .post('/auth/register')
      .send({ email: 'refresh@example.com', password: 'SecurePass123!' })
    const loginRes = await request
      .post('/auth/login')
      .send({ email: 'refresh@example.com', password: 'SecurePass123!' })
    refreshToken = loginRes.body.refreshToken
  })

  it('issues new tokens', async () => {
    const res = await request.post('/auth/refresh').send({ refreshToken })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
    expect(res.body.refreshToken).not.toBe(refreshToken)
  })

  it('invalidates old refresh token after rotation', async () => {
    await request.post('/auth/refresh').send({ refreshToken })
    const res = await request.post('/auth/refresh').send({ refreshToken })
    expect(res.status).toBe(401)
  })
})
