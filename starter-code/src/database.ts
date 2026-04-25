import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbUrl = process.env.DATABASE_URL || 'app.db'
const db = new Database(dbUrl)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const migrationsDir = path.join(__dirname, '../migrations')
if (fs.existsSync(migrationsDir)) {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    // Skip files with only comments (e.g. 002_audit_log.sql before student implements it)
    const executable = sql.replace(/--[^\n]*/g, '').trim()
    if (executable.length > 0) {
      db.exec(executable)
    }
  }
}

export { db }
