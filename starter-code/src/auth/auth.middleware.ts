import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'

export interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string; role: string }
}

export const loginRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
})

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.user = { id: payload.sub, email: payload.email, role: payload.role }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
