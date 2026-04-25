import { db } from '../database'

export interface User {
  id: number
  email: string
  password_hash: string
  role: string
  failed_attempts: number
  locked_until: number | null
  created_at: string
}

export class UsersRepository {
  findByEmail(email: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined
  }

  findById(id: number): User | undefined {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined
  }

  findAll(): User[] {
    return db.prepare('SELECT * FROM users ORDER BY id').all() as User[]
  }

  create(email: string, passwordHash: string, role = 'VIEWER'): User {
    const result = db
      .prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)')
      .run(email, passwordHash, role)
    return this.findById(result.lastInsertRowid as number)!
  }

  setRole(id: number, role: string): void {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
  }

  deleteById(id: number): void {
    db.prepare('DELETE FROM users WHERE id = ?').run(id)
  }

  incrementFailedAttempts(id: number): void {
    db.prepare('UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ?').run(id)
  }

  resetFailedAttempts(id: number): void {
    db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(id)
  }

  lockUser(id: number, until: number): void {
    db.prepare('UPDATE users SET locked_until = ? WHERE id = ?').run(until, id)
  }

  saveRefreshToken(userId: number, token: string, expiresAt: number): void {
    db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(
      userId,
      token,
      expiresAt
    )
  }

  findRefreshToken(token: string): { user_id: number; expires_at: number; revoked: number } | undefined {
    return db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token) as any
  }

  revokeRefreshToken(token: string): void {
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?').run(token)
  }
}
