# RBAC con Trazabilidad de Acciones

> **Tipo:** ARCHITECTURE · **Duración estimada:** 360 min · **Nivel:** Avanzado · **Prerequisito:** Autenticación Segura con JWT y bcrypt

## Objetivo

Extender el sistema de autenticación con roles (ADMIN, EDITOR, VIEWER), permisos granulares por recurso, middleware de autorización, y una bitácora append-only con correlación de requests por ID.

## Contexto

La autenticación dice quién eres. La autorización dice qué puedes hacer. Un sistema con autenticación sólida pero sin autorización granular permite que cualquier usuario autenticado acceda a cualquier recurso.

La trazabilidad (audit log) es el registro inmutable de quién hizo qué y cuándo. Es un requisito regulatorio en muchas industrias (salud, finanzas) y la primera herramienta de investigación ante un incidente de seguridad.

El starter provee el sistema de auth completo del taller anterior (JWT + bcrypt + rate limiting). Tu tarea es agregar RBAC, audit log, y request ID correlation.

## Estructura del proyecto

```
├── migrations/
│   ├── 001_initial.sql              # Schema base — PROVISTO
│   └── 002_audit_log.sql            # Tabla audit_log — IMPLEMENTAR
├── src/
│   ├── main.ts                      # App Express — PROVISTO
│   ├── database.ts                  # SQLite setup — PROVISTO
│   ├── auth/                        # Sistema de auth completo — PROVISTO
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.middleware.ts
│   ├── users/
│   │   ├── users.repository.ts      # PROVISTO
│   │   └── users.controller.ts      # PROVISTO — endpoints GET/DELETE /users
│   ├── posts/
│   │   ├── posts.controller.ts      # PROVISTO — endpoints CRUD /posts
│   │   └── posts.repository.ts      # PROVISTO
│   ├── authorization/
│   │   ├── rbac.middleware.ts       # IMPLEMENTAR — middleware de autorización
│   │   └── permissions.config.ts   # IMPLEMENTAR — mapa de permisos por rol
│   ├── audit/
│   │   └── audit.service.ts        # IMPLEMENTAR — servicio de audit log
│   └── middleware/
│       └── request-id.middleware.ts # IMPLEMENTAR — UUID por request
├── tests/
│   ├── auth/
│   │   └── auth.integration.test.ts # PROVISTO — tests del taller anterior
│   └── authorization/
│       └── rbac.test.ts             # ESCRIBIR — tests de autorización por rol
├── .env.example
├── jest.config.js
├── package.json
└── tsconfig.json
```

## Instrucciones

### 1. Prepara tu entorno

```bash
git clone <url-de-tu-repositorio>
cd workshop-sec-rbac-audit-trail
npm install
cp .env.example .env
```

### 2. Completa la migración del audit log

Edita `migrations/002_audit_log.sql` y crea la tabla `audit_log` con estos campos:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Autoincrement |
| `request_id` | TEXT NOT NULL | UUID v4 que correlaciona todos los logs de la misma request |
| `user_id` | INTEGER | FK a users(id) — puede ser NULL para requests no autenticadas |
| `action` | TEXT NOT NULL | e.g. `"posts:read"`, `"users:delete"` |
| `resource_id` | TEXT | ID del recurso afectado |
| `result` | TEXT NOT NULL | `"success"`, `"forbidden"`, `"error"` |
| `ip_address` | TEXT | IP del cliente |
| `user_agent` | TEXT | User-Agent header |
| `occurred_at` | DATETIME | `DEFAULT CURRENT_TIMESTAMP` |

### 3. Implementa el mapa de permisos

Edita `src/authorization/permissions.config.ts`:

| Rol | `posts` | `users` |
|---|---|---|
| VIEWER | `read` | — |
| EDITOR | `read`, `create`, `update` | — |
| ADMIN | `read`, `create`, `update`, `delete` | `read`, `create`, `update`, `delete` |

### 4. Implementa el middleware de autorización

Edita `src/authorization/rbac.middleware.ts`:

- Recibe `resource` y `action` como parámetros
- Lee el rol del usuario desde `req.user` (seteado por `authenticateJWT`)
- Verifica que el rol tiene el permiso en `PERMISSIONS`
- Retorna **403 Forbidden** si no tiene permiso
- Registra en el audit log el resultado (`forbidden`)

```typescript
// Uso en los controladores (ya está wired up):
router.delete('/:id', authenticateJWT, authorize('posts', 'delete'), handler)
```

### 5. Implementa el middleware de request ID

Edita `src/middleware/request-id.middleware.ts`:

- Genera un `crypto.randomUUID()` por cada request
- Lo asigna a `req.requestId`
- Lo retorna en la cabecera de respuesta `X-Request-ID`

### 6. Implementa el servicio de audit log

Edita `src/audit/audit.service.ts`:

- Método `log(params)` que hace INSERT en `audit_log`
- **Solo INSERT** — nunca UPDATE o DELETE sobre esta tabla
- Todos los campos del schema anterior

### 7. Escribe los tests de autorización

Implementa los casos de prueba en `tests/authorization/rbac.test.ts`:

```typescript
// Debe cubrir:
// ✓ VIEWER puede GET /posts
// ✓ VIEWER recibe 403 en POST /posts
// ✓ VIEWER recibe 403 en DELETE /posts/:id
// ✓ EDITOR puede POST /posts
// ✓ EDITOR recibe 403 en DELETE /posts/:id
// ✓ EDITOR recibe 403 en GET /users
// ✓ ADMIN puede DELETE /posts/:id
// ✓ ADMIN puede GET /users
// ✓ Request sin token → 401
// ✓ Token con rol incorrecto → 403
```

Para crear un usuario con un rol específico en los tests, usa directamente el repositorio o el endpoint de registro y luego actualiza el rol en la BD de test.

### 8. Corre los tests

```bash
npm test
```

Todos los tests del taller anterior deben seguir pasando. Los nuevos tests de autorización deben pasar también.

### 9. Abre el Pull Request

1. `git push origin feat/rbac-audit-trail`
2. Abre PR hacia `main`
3. Verifica que los checks pasen

## Criterios de evaluación

| Métrica | Peso | Umbral |
|---|---|---|
| RBAC implementado | 30% | Middleware con los 3 roles detectado |
| Audit log presente | 20% | Tabla `audit_log` en `migrations/002_audit_log.sql` |
| Tests de autorización | 25% | ≥ 80% de cobertura en `tests/authorization/` |
| Tests pasando | 15% | 100% de todos los tests pasan |
| SAST findings | 10% | 0 hallazgos de severidad alta |

## Variables de entorno

| Variable | Descripción |
|---|---|
| `JWT_SECRET` | Secreto para firmar access tokens (mín. 32 chars) |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens (distinto del anterior) |
| `DATABASE_URL` | Ruta al archivo SQLite (`:memory:` para tests) |

## Recursos

- [OWASP A01:2021 — Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [OWASP A09:2021 — Security Logging and Monitoring Failures](https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/)
- [RBAC vs ABAC — AWS](https://aws.amazon.com/iam/features/role-based-access-control/)
- [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html)
- [NIST — Role Based Access Control](https://csrc.nist.gov/projects/role-based-access-control)
