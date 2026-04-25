import { Router } from 'express'
import { PostsRepository } from './posts.repository'
import { authenticateJWT, AuthenticatedRequest } from '../auth/auth.middleware'
import { authorize } from '../authorization/rbac.middleware'
import { auditService } from '../audit/audit.service'
import { RequestWithId } from '../middleware/request-id.middleware'

const router = Router()
const repo = new PostsRepository()

type Req = AuthenticatedRequest & RequestWithId

// GET /posts — VIEWER, EDITOR, ADMIN
router.get('/', authenticateJWT, authorize('posts', 'read'), (req: Req, res) => {
  const posts = repo.findAll()
  auditService.log({
    requestId: req.requestId || 'unknown',
    userId: req.user?.id,
    action: 'posts:read',
    result: 'success',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })
  res.json(posts)
})

// POST /posts — EDITOR, ADMIN
router.post('/', authenticateJWT, authorize('posts', 'create'), (req: Req, res) => {
  const { title, content } = req.body
  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' })
  }
  const post = repo.create(title, content, req.user!.id)
  auditService.log({
    requestId: req.requestId || 'unknown',
    userId: req.user?.id,
    action: 'posts:create',
    resourceId: String(post.id),
    result: 'success',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })
  res.status(201).json(post)
})

// PATCH /posts/:id — EDITOR (own) or ADMIN (any)
router.patch('/:id', authenticateJWT, authorize('posts', 'update'), (req: Req, res) => {
  const post = repo.findById(Number(req.params.id))
  if (!post) return res.status(404).json({ error: 'Post not found' })

  if (post.author_id !== req.user!.id && req.user!.role !== 'ADMIN') {
    auditService.log({
      requestId: req.requestId || 'unknown',
      userId: req.user?.id,
      action: 'posts:update',
      resourceId: String(post.id),
      result: 'forbidden',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })
    return res.status(403).json({ error: 'Forbidden — you can only edit your own posts' })
  }

  const updated = repo.update(post.id, req.body.title, req.body.content)
  auditService.log({
    requestId: req.requestId || 'unknown',
    userId: req.user?.id,
    action: 'posts:update',
    resourceId: String(post.id),
    result: 'success',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })
  res.json(updated)
})

// DELETE /posts/:id — ADMIN only
router.delete('/:id', authenticateJWT, authorize('posts', 'delete'), (req: Req, res) => {
  const post = repo.findById(Number(req.params.id))
  if (!post) return res.status(404).json({ error: 'Post not found' })

  repo.delete(post.id)
  auditService.log({
    requestId: req.requestId || 'unknown',
    userId: req.user?.id,
    action: 'posts:delete',
    resourceId: String(post.id),
    result: 'success',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  })
  res.status(204).end()
})

export { router as postsRouter }
