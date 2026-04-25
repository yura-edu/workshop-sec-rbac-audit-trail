import supertest from 'supertest'

process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-do-not-use-in-prod'
process.env.DATABASE_URL = ':memory:'

import { app } from '../../src/main'
import { db } from '../../src/database'

const request = supertest(app)

// Helper: registra un usuario, actualiza su rol, y retorna el access token
async function loginAs(email: string, role: string): Promise<string> {
  await request.post('/auth/register').send({ email, password: 'SecurePass123!' })
  db.prepare('UPDATE users SET role = ? WHERE email = ?').run(role, email)
  const res = await request.post('/auth/login').send({ email, password: 'SecurePass123!' })
  return res.body.accessToken
}

// TODO: Implementa los tests de autorización.
//
// Los tests deben usar el helper loginAs(email, role) para obtener tokens con diferentes roles.
// Ejemplo:
//   const viewerToken = await loginAs('viewer@test.com', 'VIEWER')
//   const res = await request.get('/posts').set('Authorization', `Bearer ${viewerToken}`)
//   expect(res.status).toBe(200)

describe('RBAC — VIEWER', () => {
  let viewerToken: string
  let postId: number

  beforeAll(async () => {
    const adminToken = await loginAs('admin-setup@test.com', 'ADMIN')
    viewerToken = await loginAs('viewer@test.com', 'VIEWER')

    const postRes = await request
      .post('/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Post', content: 'Test content' })
    postId = postRes.body.id
  })

  it.todo('can GET /posts (read access)')
  it.todo('cannot POST /posts (403 Forbidden)')
  it.todo('cannot PATCH /posts/:id (403 Forbidden)')
  it.todo('cannot DELETE /posts/:id (403 Forbidden)')
  it.todo('cannot GET /users (403 Forbidden)')
})

describe('RBAC — EDITOR', () => {
  let editorToken: string

  beforeAll(async () => {
    editorToken = await loginAs('editor@test.com', 'EDITOR')
  })

  it.todo('can GET /posts')
  it.todo('can POST /posts')
  it.todo('can PATCH own post')
  it.todo('cannot DELETE /posts/:id (403 Forbidden)')
  it.todo('cannot GET /users (403 Forbidden)')
  it.todo('cannot DELETE /users/:id (403 Forbidden)')
})

describe('RBAC — ADMIN', () => {
  let adminToken: string

  beforeAll(async () => {
    adminToken = await loginAs('admin@test.com', 'ADMIN')
  })

  it.todo('can GET /posts')
  it.todo('can POST /posts')
  it.todo('can DELETE any post')
  it.todo('can GET /users')
  it.todo('can DELETE a user')
})

describe('RBAC — unauthenticated', () => {
  it.todo('returns 401 on GET /posts without token')
  it.todo('returns 401 on POST /posts without token')
  it.todo('returns 401 on GET /users without token')
})
