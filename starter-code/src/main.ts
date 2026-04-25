import express from 'express'
import { authRouter } from './auth/auth.controller'
import { postsRouter } from './posts/posts.controller'
import { usersRouter } from './users/users.controller'
import { requestIdMiddleware } from './middleware/request-id.middleware'

const app = express()

app.use(express.json())
app.use(requestIdMiddleware)

app.use('/auth', authRouter)
app.use('/posts', postsRouter)
app.use('/users', usersRouter)

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const PORT = parseInt(process.env.PORT || '3000', 10)

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

export { app }
