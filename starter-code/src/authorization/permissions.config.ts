// TODO: Define el mapa de permisos por rol y recurso.
//
// Tabla de permisos requerida:
//
// | Recurso | ADMIN                        | EDITOR                  | VIEWER |
// |---------|------------------------------|-------------------------|--------|
// | posts   | read, create, update, delete | read, create, update    | read   |
// | users   | read, create, update, delete | —                       | —      |
//
// Estructura esperada:
// PERMISSIONS[role][resource] → string[] de acciones permitidas
//
// Ejemplo de uso en rbac.middleware.ts:
//   const allowed = PERMISSIONS[role]?.[resource] ?? []
//   if (!allowed.includes(action)) { return 403 }

export const PERMISSIONS: Record<string, Record<string, string[]>> = {
  // TODO: Implementa aquí los tres roles: ADMIN, EDITOR, VIEWER
}
