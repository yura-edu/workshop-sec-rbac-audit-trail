import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { UsersRepository } from '../users/users.repository'

const SALT_ROUNDS = 12
const ACCESS_EXPIRES = '15m'
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000

const repo = new UsersRepository()

function appError(message: string, status: number): Error {
  const err = new Error(message) as any
  err.status = status
  return err
}

export class AuthService {
  async register(email: string, password: string) {
    if (repo.findByEmail(email)) throw appError('Email already registered', 409)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = repo.create(email, passwordHash)
    return { userId: user.id, email: user.email, createdAt: user.created_at }
  }

  async login(email: string, password: string) {
    const user = repo.findByEmail(email)
    if (!user) throw appError('Invalid credentials', 401)

    if (user.locked_until && Date.now() < user.locked_until) {
      throw appError('Account locked. Try again later.', 423)
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      repo.incrementFailedAttempts(user.id)
      if (user.failed_attempts + 1 >= 5) {
        repo.lockUser(user.id, Date.now() + 30 * 60 * 1000)
      }
      throw appError('Invalid credentials', 401)
    }

    repo.resetFailedAttempts(user.id)

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: ACCESS_EXPIRES }
    )

    const refreshToken = randomBytes(64).toString('hex')
    repo.saveRefreshToken(user.id, refreshToken, Date.now() + REFRESH_EXPIRES_MS)

    return { accessToken, refreshToken, expiresIn: 900 }
  }

  async refresh(token: string) {
    const stored = repo.findRefreshToken(token)
    if (!stored || stored.revoked || Date.now() > stored.expires_at) {
      throw appError('Invalid refresh token', 401)
    }

    repo.revokeRefreshToken(token)

    const user = repo.findById(stored.user_id)!
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: ACCESS_EXPIRES }
    )

    const newRefresh = randomBytes(64).toString('hex')
    repo.saveRefreshToken(user.id, newRefresh, Date.now() + REFRESH_EXPIRES_MS)

    return { accessToken, refreshToken: newRefresh, expiresIn: 900 }
  }

  logout(token: string) {
    repo.revokeRefreshToken(token)
  }
}
