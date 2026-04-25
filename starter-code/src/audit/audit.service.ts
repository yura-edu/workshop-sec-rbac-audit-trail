import { db } from '../database'

export interface AuditEntry {
  requestId: string
  userId?: number
  action: string
  resourceId?: string
  result: 'success' | 'forbidden' | 'error'
  ipAddress?: string
  userAgent?: string
}

// TODO: Implementa el servicio de audit log.
//
// El método log() debe hacer INSERT en la tabla audit_log con todos los campos.
// Esta tabla es append-only — nunca hagas UPDATE o DELETE sobre ella.
//
// Esquema de la tabla (definido en migrations/002_audit_log.sql):
//   request_id, user_id, action, resource_id, result, ip_address, user_agent, occurred_at
//
// Hint: usa db.prepare('INSERT INTO audit_log (...) VALUES (...)').run(...)
// Si la tabla aún no existe (student no implementó la migration), el log debe fallar silenciosamente.

export class AuditService {
  log(entry: AuditEntry): void {
    // TODO: Implementar aquí el INSERT en audit_log
    // Recuerda manejar el caso donde la tabla no existe aún
  }
}

export const auditService = new AuditService()
