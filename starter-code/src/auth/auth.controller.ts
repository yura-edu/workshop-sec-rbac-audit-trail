import { Router } from 'express'
import { AuthService } from './auth.service'
import { loginRateLimit } from './auth.middleware'

const router = Router()
const authService = new AuthService()

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }
    const result = await authService.register(email, password)
    res.status(201).json(result)
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }
    const result = await authService.login(email, password)
    res.json(result)
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required' })
    }
    const result = await authService.refresh(refreshToken)
    res.json(result)
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) authService.logout(refreshToken)
  res.status(204).end()
})

export { router as authRouter }
