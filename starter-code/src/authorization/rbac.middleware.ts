import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../auth/auth.middleware'
import { RequestWithId } from '../middleware/request-id.middleware'
import { PERMISSIONS } from './permissions.config'
import { auditService } from '../audit/audit.service'

// TODO: Implementa el middleware de autorización RBAC.
//
// La función authorize(resource, action) debe retornar un middleware Express que:
//  1. Lea el rol del usuario desde req.user.role (seteado por authenticateJWT)
//  2. Verifique que PERMISSIONS[role][resource] incluye la acción solicitada
//  3. Si el usuario tiene permiso → llame a next()
//  4. Si el usuario NO tiene permiso → registre en audit log con result: 'forbidden'
//     y retorne 403 Forbidden
//
// Hint: usa PERMISSIONS[role]?.[resource]?.includes(action)

export function authorize(resource: string, action: string) {
  return (req: AuthenticatedRequest & RequestWithId, res: Response, next: NextFunction) => {
    // TODO: Implementar aquí

    // El código actual permite todo — REEMPLAZA esto con tu implementación
    next()
  }
}
