# Mesa — Especificación Técnica

**Versión:** 1.0  
**Estado:** En desarrollo

---

## Objetivo del Producto

Mesa es un sistema de gestión de tickets de soporte interno. Permite a los usuarios de una organización reportar incidencias o consultas, a los agentes de soporte atenderlas y gestionarlas, y a los administradores controlar usuarios, roles y configuración del sistema.

**No es** un producto SaaS público ni está diseñado para múltiples organizaciones (multi-tenancy).

---

## Tipos de Usuario y Permisos

| Rol | Descripción | Puede crear tickets | Ve todos los tickets | Gestiona usuarios | Comenta interno | Cambia estado |
|-----|-------------|:------------------:|:-------------------:|:-----------------:|:---------------:|:-------------:|
| `user` | Usuario final | ✅ | ❌ (solo los suyos) | ❌ | ❌ | ❌ |
| `agent` | Agente de soporte | ✅ | ✅ | ❌ | ✅ | ✅ |
| `admin` | Administrador | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Funcionalidades por Pantalla

### Login (`/login`)

- Formulario de email + contraseña.
- Validación client-side antes de enviar.
- Error claro si credenciales inválidas o cuenta desactivada.
- Redirige al dashboard tras login exitoso.
- Token JWT guardado en `localStorage`.

### Dashboard (`/`)

- Resumen de métricas según rol:
  - `user`: mis tickets abiertos, en progreso.
  - `agent` / `admin`: total abiertos, en progreso, resueltos hoy, sin asignar.
- Acceso rápido a crear ticket.
- Lista de notificaciones sin leer.

### Lista de Tickets (`/tickets`)

- Tabla paginada de tickets.
- Filtros: estado, prioridad, categoría, asignado (solo agent/admin).
- Búsqueda por título o código.
- Badge de color por prioridad.
- `user` ve solo sus tickets; `agent`/`admin` ven todos.

### Detalle de Ticket (`/tickets/:id`)

- Información completa del ticket (código, título, descripción, categoría, prioridad, estado, fechas).
- Historial de eventos (cambios de estado, asignaciones).
- Sección de comentarios:
  - `user` solo ve comentarios `public`.
  - `agent`/`admin` ven todos; pueden marcar comentario como `internal`.
- Acciones según rol:
  - `agent`/`admin`: cambiar estado, asignar agente, agregar comentario interno.
  - Todos: agregar comentario público.

### Crear Ticket (`/tickets/new`)

- Formulario con campos: título, descripción, categoría, prioridad.
- Validación client-side.
- Código asignado automáticamente por el backend.

### Panel de Usuarios (`/users`) — solo admin

- Tabla de usuarios con nombre, email, rol, estado (activo/inactivo).
- Crear nuevo usuario.
- Editar rol y estado de usuarios existentes.
- No se pueden eliminar usuarios, solo desactivar.

### Notificaciones

- Badge en el header con conteo de no leídas.
- Panel/lista de notificaciones.
- Marcar como leída individualmente.

---

## Reglas de Negocio

1. **Visibilidad de tickets**: Un `user` solo ve tickets donde `created_by = su ID`.
2. **Código de ticket**: Generado en el backend, formato `TCK-NNNN` (incremento global, zero-padded a 4 dígitos).
3. **Solo agents/admins pueden cambiar el estado** de un ticket. Un `user` no puede.
4. **Comentarios internos**: Solo visibles para `agent` y `admin`. El backend filtra antes de devolver.
5. **`resolved_at`**: Se registra automáticamente cuando el status cambia a `Resuelto`.
6. **Usuario desactivado**: `active = 0` impide el login (retorna 401 aunque la contraseña sea correcta).
7. **Notificaciones automáticas**: El servicio genera notificaciones al:
   - Creador del ticket: cuando hay un nuevo comentario, cuando cambia el estado.
   - Agente asignado: cuando se le asigna un ticket.
8. **Paginación obligatoria**: `GET /api/tickets` siempre devuelve paginado. Máximo `limit=100`.
9. **Asignación**: Solo un agente puede estar asignado a la vez. Reasignar sobreescribe.

---

## Modelo de Datos

### Tabla `users`

| Campo | Tipo SQLite | Restricción | Descripción |
|-------|------------|-------------|-------------|
| `id` | INTEGER | PK AUTOINCREMENT | ID único |
| `name` | TEXT | NOT NULL | Nombre para mostrar |
| `email` | TEXT | UNIQUE NOT NULL | Usado para login |
| `password_hash` | TEXT | NOT NULL | Hash bcryptjs (nunca exponer en API) |
| `role` | TEXT | CHECK IN ('user','agent','admin') | Rol del usuario |
| `active` | INTEGER | DEFAULT 1 | 1=activo, 0=desactivado |
| `created_at` | TEXT | DEFAULT datetime('now') | Timestamp UTC |

### Tabla `tickets`

| Campo | Tipo SQLite | Restricción | Descripción |
|-------|------------|-------------|-------------|
| `id` | INTEGER | PK AUTOINCREMENT | ID único |
| `code` | TEXT | UNIQUE NOT NULL | Código legible (TCK-0001) |
| `title` | TEXT | NOT NULL | Título breve del ticket |
| `description` | TEXT | NOT NULL | Descripción detallada |
| `category` | TEXT | CHECK IN (...) | Consulta / Problema técnico / Acceso / Otro |
| `priority` | TEXT | CHECK IN (...) | Baja / Media / Alta / Urgente |
| `status` | TEXT | CHECK IN (...) | Abierto / En progreso / En espera / Resuelto |
| `created_by` | INTEGER | FK users(id) | Usuario que creó el ticket |
| `assigned_to` | INTEGER | FK users(id), nullable | Agente asignado |
| `created_at` | TEXT | DEFAULT datetime('now') | Timestamp UTC |
| `updated_at` | TEXT | DEFAULT datetime('now') | Actualizado en cada PATCH |
| `resolved_at` | TEXT | nullable | Timestamp de resolución UTC |

### Tabla `comments`

| Campo | Tipo SQLite | Restricción | Descripción |
|-------|------------|-------------|-------------|
| `id` | INTEGER | PK AUTOINCREMENT | ID único |
| `ticket_id` | INTEGER | FK tickets(id) NOT NULL | Ticket al que pertenece |
| `author_id` | INTEGER | FK users(id) NOT NULL | Usuario que comentó |
| `content` | TEXT | NOT NULL | Texto del comentario |
| `visibility` | TEXT | CHECK IN ('public','internal') | Visibilidad del comentario |
| `created_at` | TEXT | DEFAULT datetime('now') | Timestamp UTC |

### Tabla `ticket_events`

| Campo | Tipo SQLite | Restricción | Descripción |
|-------|------------|-------------|-------------|
| `id` | INTEGER | PK AUTOINCREMENT | ID único |
| `ticket_id` | INTEGER | FK tickets(id) NOT NULL | Ticket afectado |
| `actor_id` | INTEGER | FK users(id) NOT NULL | Usuario que realizó la acción |
| `event_type` | TEXT | NOT NULL | Tipo de evento (status_change, assigned, priority_change, etc.) |
| `old_value` | TEXT | nullable | Valor anterior |
| `new_value` | TEXT | nullable | Valor nuevo |
| `created_at` | TEXT | DEFAULT datetime('now') | Timestamp UTC |

### Tabla `notifications`

| Campo | Tipo SQLite | Restricción | Descripción |
|-------|------------|-------------|-------------|
| `id` | INTEGER | PK AUTOINCREMENT | ID único |
| `user_id` | INTEGER | FK users(id) NOT NULL | Destinatario |
| `ticket_id` | INTEGER | nullable | Ticket relacionado |
| `message` | TEXT | NOT NULL | Texto de la notificación |
| `read_at` | TEXT | nullable | Null = no leída |
| `created_at` | TEXT | DEFAULT datetime('now') | Timestamp UTC |

---

## Endpoints API

### Autenticación

| Método | Ruta | Roles | Descripción | Body / Params |
|--------|------|-------|-------------|---------------|
| `POST` | `/api/auth/login` | Público | Login con email+password, devuelve JWT | `{email, password}` |
| `GET` | `/api/auth/me` | Autenticado | Perfil del usuario actual | — |
| `POST` | `/api/auth/logout` | Autenticado | Logout (respuesta OK, cliente descarta token) | — |

### Tickets

| Método | Ruta | Roles | Descripción | Body / Query |
|--------|------|-------|-------------|--------------|
| `GET` | `/api/tickets` | Autenticado | Lista paginada con filtros | `?status=&priority=&category=&page=&limit=` |
| `POST` | `/api/tickets` | Autenticado | Crear ticket | `{title, description, category, priority}` |
| `GET` | `/api/tickets/:id` | Autenticado | Detalle + comentarios + eventos | — |
| `PATCH` | `/api/tickets/:id` | Autenticado | Modificar campos (status solo agent/admin) | `{title?, description?, status?, priority?}` |
| `POST` | `/api/tickets/:id/assign` | agent, admin | Asignar agente | `{agentId}` |
| `POST` | `/api/tickets/:id/comments` | Autenticado | Agregar comentario | `{content, visibility}` |

### Notificaciones

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/api/notifications` | Autenticado | Notificaciones del usuario actual |
| `PATCH` | `/api/notifications/:id/read` | Autenticado | Marcar notificación como leída |

### Usuarios

| Método | Ruta | Roles | Descripción | Body |
|--------|------|-------|-------------|------|
| `GET` | `/api/users` | admin | Listar todos los usuarios | — |
| `POST` | `/api/users` | admin | Crear usuario | `{name, email, password, role}` |
| `PATCH` | `/api/users/:id` | admin | Modificar usuario (rol, estado, nombre) | `{name?, role?, active?}` |

### Respuestas de Error

Todos los errores devuelven JSON con estructura:

```json
{
  "error": "Mensaje legible",
  "code": "ERROR_CODE"
}
```

Códigos HTTP usados: `400` (validación), `401` (no autenticado), `403` (sin permisos), `404` (no encontrado), `409` (conflicto), `500` (error interno).

---

## Decisiones Técnicas y Justificaciones

| Decisión | Alternativa considerada | Justificación |
|----------|------------------------|---------------|
| SQLite | PostgreSQL, MySQL | Sin servidor de DB externo; simplicidad de despliegue; escala suficiente para el caso de uso |
| `better-sqlite3` (síncrono) | `sqlite3` (callbacks/async) | API más simple, sin overhead de async en servidor single-threaded; menos bugs de concurrencia |
| JWT stateless | Sessions con Redis | Sin infraestructura adicional; funciona con un solo servidor |
| CSS propio | Tailwind, Bootstrap | Control total del diseño; sin dependencias de terceros para estilos; bundle más pequeño |
| `tsx` para dev | `ts-node`, `nodemon+tsc` | Transpilación más rápida, recarga inmediata en desarrollo |
| Arquitectura por capas | MVC clásico | Separación más clara: repositories no saben de HTTP, services no saben de SQL directamente |
| TypeScript estricto | JavaScript | Detección temprana de errores, contratos explícitos, mejor DX |
| Vite | Create React App, Next.js | HMR ultrarrápido, build optimizado, configuración sencilla, sin SSR innecesario |

---

## Casos Pendientes / Edge Cases Conocidos

| Caso | Estado | Notas |
|------|--------|-------|
| Adjuntos en tickets | ❌ No implementado | Requiere decisión sobre storage (filesystem vs DB) |
| Notificaciones en tiempo real | ❌ No implementado | Se necesita WebSocket o SSE; actualmente el frontend debería pollear |
| Búsqueda full-text | ❌ No implementado | SQLite FTS5 disponible si se necesita |
| Rate limiting | ❌ No implementado | Recommended para producción (express-rate-limit) |
| Refresh tokens | ❌ No implementado | El token actual expira; el usuario debe re-loguearse |
| Exportación CSV/PDF | ❌ No implementado | — |
| Multi-asignación de agentes | ❌ No aplicable | Solo un agente asignado por ticket |
| Concurrencia en actualización | ⚠️ Riesgo bajo | SQLite maneja con locks; en alta concurrencia considerar migrar a PostgreSQL |
| Cambio de contraseña | ❌ No implementado | Solo admin puede cambiar datos de usuario via PATCH /api/users/:id |
| Recuperación de contraseña | ❌ No implementado | Requiere servicio de email externo |
| Audit trail completo | ✅ Parcial | `ticket_events` registra cambios en tickets; no hay audit de acciones de admin |
| Paginación de comentarios | ❌ No implementado | Actualmente se devuelven todos los comentarios del ticket |
| Tickets con prioridad urgente sin asignar | ⚠️ Sin alerta | No hay mecanismo de alerta automática; debería considerarse |
