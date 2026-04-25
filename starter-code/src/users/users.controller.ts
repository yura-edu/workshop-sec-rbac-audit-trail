import { Router } from 'express'
import { UsersRepository } from './users.repository'
import { authenticateJWT, AuthenticatedRequest } from '../auth/auth.middleware'
import { authorize } from '../authorization/rbac.middleware'
import { auditService } from '../audit/audit.service'
import { RequestWithId } from '../middleware/request-id.middleware'

const router = Router()
const repo = new UsersRepository()

type Req = AuthenticatedRequest & RequestWithId

// GET /users — ADMIN only
router.get('/', authenticateJWT, authorize('users', 'read'), (req: Req, res) => {
  const users = repo.findAll().map(({ id, email, role, created_at }) => ({
    id,
    email,
    role,
    createdAt: created_at,
  }))
  auditService.log({
    requestId: req.requestId || 'unknown',
    userId: req.user?.id,
    action: 'users:read',
    result: 'success',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })
  res.json(users)
})

// DELETE /users/:id — ADMIN only
router.delete('/:id', authenticateJWT, authorize('users', 'delete'), (req: Req, res) => {
  const targetId = Number(req.params.id)
  if (!repo.findById(targetId)) {
    return res.status(404).json({ error: 'User not found' })
  }
  repo.deleteById(targetId)
  auditService.log({
    requestId: req.requestId || 'unknown',
    userId: req.user?.id,
    action: 'users:delete',
    resourceId: String(targetId),
    result: 'success',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })
  res.status(204).end()
})

export { router as usersRouter }
