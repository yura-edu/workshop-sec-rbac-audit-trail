import { db } from '../database'

export interface Post {
  id: number
  title: string
  content: string
  author_id: number
  created_at: string
}

export class PostsRepository {
  findAll(): Post[] {
    return db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all() as Post[]
  }

  findById(id: number): Post | undefined {
    return db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as Post | undefined
  }

  create(title: string, content: string, authorId: number): Post {
    const result = db
      .prepare('INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)')
      .run(title, content, authorId)
    return this.findById(result.lastInsertRowid as number)!
  }

  update(id: number, title?: string, content?: string): Post {
    if (title !== undefined) {
      db.prepare('UPDATE posts SET title = ? WHERE id = ?').run(title, id)
    }
    if (content !== undefined) {
      db.prepare('UPDATE posts SET content = ? WHERE id = ?').run(content, id)
    }
    return this.findById(id)!
  }

  delete(id: number): void {
    db.prepare('DELETE FROM posts WHERE id = ?').run(id)
  }
}
