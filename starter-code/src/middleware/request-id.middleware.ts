import { Request, Response, NextFunction } from 'express'

export interface RequestWithId extends Request {
  requestId?: string
}

// TODO: Implementa el middleware de request ID.
//
// Este middleware debe:
//  1. Generar un UUID v4 por cada request: crypto.randomUUID()
//  2. Asignarlo a req.requestId
//  3. Retornarlo en la cabecera de respuesta: res.setHeader('X-Request-ID', ...)
//  4. Llamar a next()
//
// Esto permite correlacionar todos los logs de audit de la misma request.

export function requestIdMiddleware(req: RequestWithId, res: Response, next: NextFunction): void {
  // TODO: Implementar aquí
  next()
}
