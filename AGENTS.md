# AGENTS.md — Guía para Agentes de IA

Este archivo está dirigido a agentes de IA (u otros desarrolladores) que trabajen sobre el proyecto **Mesa**. Leé esto antes de modificar cualquier archivo.

---

## Descripción General

**Mesa** es un sistema de gestión de tickets de soporte interno. Tiene tres roles de usuario (admin, agent, user) y un flujo claro: los usuarios crean tickets, los agentes los atienden, los admins administran usuarios y configuración.

### Arquitectura

```
Frontend (React + Vite + TS)  ←→  Backend (Express + TS)  ←→  SQLite
        :5173                           :3000                   mesa.db
```

El frontend se comunica con el backend exclusivamente via JSON REST API con autenticación JWT Bearer token.

---

## Estructura de Carpetas

### Backend (`backend/src/`)

| Carpeta / Archivo | Propósito |
|-------------------|-----------|
| `database/connection.ts` | Instancia única de la conexión SQLite (`better-sqlite3`) |
| `database/migrations.ts` | Crea todas las tablas si no existen; se ejecuta al arrancar |
| `database/seed.ts` | Datos de demo; se ejecuta manualmente con `npm run seed` |
| `middleware/auth.ts` | Verifica el JWT Bearer token y adjunta `req.user` |
| `middleware/authorize.ts` | Factory que restringe rutas a roles específicos |
| `middleware/errorHandler.ts` | Captura errores y responde con JSON estructurado |
| `repositories/` | Acceso directo a SQLite. Solo SQL aquí. Sin lógica de negocio |
| `services/` | Lógica de negocio pura. Llaman a repositories. Sin HTTP |
| `controllers/` | Reciben `req/res`, llaman services, devuelven JSON |
| `routes/` | Registran rutas y aplican middlewares de auth/authorize |
| `types/index.ts` | Interfaces TypeScript: `User`, `Ticket`, `Comment`, etc. |
| `app.ts` | Configuración de Express: middlewares globales, rutas |
| `server.ts` | `app.listen()` y arranque de migraciones |

### Frontend (`frontend/src/`)

| Carpeta | Propósito |
|---------|-----------|
| `api/` | Funciones que encapsulan los `fetch` al backend. No hacer fetch directo en componentes |
| `components/` | Componentes React reutilizables (Button, Badge, Modal, etc.) |
| `pages/` | Una carpeta por pantalla (Login, Dashboard, Tickets, etc.) |
| `context/` | React Context para estado global (ej: `AuthContext`) |
| `hooks/` | Custom hooks (ej: `useTickets`, `useAuth`) |
| `types/` | Interfaces TypeScript que reflejan las del backend |
| `styles/` | CSS global, variables CSS, reset |

---

## Comandos Útiles

```bash
# Desarrollo
cd backend && npm run dev      # Backend en modo watch (tsx)
cd frontend && npm run dev     # Frontend con HMR

# Build
cd backend && npm run build    # Compila TS → dist/
cd frontend && npm run build   # Build Vite → dist/

# Tests
cd backend && npm test         # Ejecuta tests del backend

# Seed
cd backend && npm run seed     # Carga datos de demo en SQLite

# Crear admin manualmente
cd backend && npx tsx src/database/createAdmin.ts
```

---

## Convenciones de Código

### TypeScript

- **Modo estricto siempre** (`"strict": true` en tsconfig). No usar `any` donde sea evitable.
- Tipar explícitamente los parámetros de funciones y los retornos de servicios.
- Usar interfaces (no types) para objetos de dominio.

### Arquitectura por Capas

El flujo de datos es **unidireccional**:

```
routes → controllers → services → repositories → SQLite
```

- **Routes**: Solo registran la ruta y aplican middlewares.
- **Controllers**: Solo parsean req, llaman al service, devuelven res. Sin SQL, sin lógica.
- **Services**: Toda la lógica de negocio. Sin HTTP, sin `req`/`res`.
- **Repositories**: Solo SQL parametrizado. Sin lógica de negocio.

### CSS

- CSS propio organizado por componente (ej: `TicketCard.css` junto a `TicketCard.tsx`).
- Variables CSS globales en `styles/variables.css`.
- **No usar Tailwind, Bootstrap ni ningún framework CSS.**
- Sistema de colores por prioridad: Baja (gris), Media (azul), Alta (naranja), Urgente (rojo).

### SQL

- **SIEMPRE usar consultas parametrizadas.** Usar `?` o named params de `better-sqlite3`.
- Nunca construir SQL con template strings que incluyan input del usuario.

---

## Restricciones Importantes

> **NO hacer esto nunca:**

- ❌ `db.prepare(\`SELECT * FROM users WHERE email = '${email}'\`).get()` → SQL injection
- ❌ Devolver `password_hash` en ninguna respuesta JSON
- ❌ Agregar servicios externos (Stripe, SendGrid, S3, etc.) sin justificación documentada
- ❌ Usar `useState` como almacenamiento permanente entre sesiones
- ❌ Confiar solo en el frontend para controlar permisos; el backend valida en **cada ruta**
- ❌ Devolver tokens o datos sensibles en logs o respuestas de error

---

## Modelo de Datos

### Tablas y Relaciones

```
users ──< tickets (created_by)
users ──< tickets (assigned_to)
users ──< comments (author_id)
users ──< notifications (user_id)
users ──< ticket_events (actor_id)
tickets ──< comments (ticket_id)
tickets ──< ticket_events (ticket_id)
tickets ──< notifications (ticket_id)
```

### users

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | INTEGER PK | Autoincremental |
| `name` | TEXT | Nombre visible |
| `email` | TEXT UNIQUE | Usado para login |
| `password_hash` | TEXT | bcryptjs, nunca exponer |
| `role` | TEXT | `'user'` \| `'agent'` \| `'admin'` |
| `active` | INTEGER | `1` = activo, `0` = desactivado |
| `created_at` | TEXT | ISO datetime UTC |

### tickets

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | INTEGER PK | Autoincremental |
| `code` | TEXT UNIQUE | Formato `TCK-0001` |
| `title` | TEXT | Título breve |
| `description` | TEXT | Descripción completa |
| `category` | TEXT | `Consulta` \| `Problema técnico` \| `Acceso` \| `Otro` |
| `priority` | TEXT | `Baja` \| `Media` \| `Alta` \| `Urgente` |
| `status` | TEXT | `Abierto` \| `En progreso` \| `En espera` \| `Resuelto` |
| `created_by` | INTEGER FK | `users.id` |
| `assigned_to` | INTEGER FK | `users.id`, nullable |
| `created_at` | TEXT | ISO datetime UTC |
| `updated_at` | TEXT | Se actualiza en cada PATCH |
| `resolved_at` | TEXT | nullable, se llena al resolver |

### comments

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | INTEGER PK | |
| `ticket_id` | INTEGER FK | `tickets.id` |
| `author_id` | INTEGER FK | `users.id` |
| `content` | TEXT | Contenido del comentario |
| `visibility` | TEXT | `'public'` \| `'internal'` |
| `created_at` | TEXT | ISO datetime UTC |

> Los comentarios `internal` solo son visibles para agents y admins.

### ticket_events

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | INTEGER PK | |
| `ticket_id` | INTEGER FK | `tickets.id` |
| `actor_id` | INTEGER FK | `users.id` |
| `event_type` | TEXT | Ej: `status_change`, `assigned`, `priority_change` |
| `old_value` | TEXT | nullable |
| `new_value` | TEXT | nullable |
| `created_at` | TEXT | ISO datetime UTC |

### notifications

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | INTEGER PK | |
| `user_id` | INTEGER FK | `users.id` |
| `ticket_id` | INTEGER | nullable |
| `message` | TEXT | Texto de la notificación |
| `read_at` | TEXT | nullable; si null, está sin leer |
| `created_at` | TEXT | ISO datetime UTC |

---

## Sistema de Roles y Permisos

| Acción | user | agent | admin |
|--------|:----:|:-----:|:-----:|
| Ver sus propios tickets | ✅ | ✅ | ✅ |
| Ver todos los tickets | ❌ | ✅ | ✅ |
| Crear tickets | ✅ | ✅ | ✅ |
| Cambiar estado de ticket | ❌ | ✅ | ✅ |
| Asignar agente a ticket | ❌ | ✅ | ✅ |
| Agregar comentario público | ✅ | ✅ | ✅ |
| Agregar comentario interno | ❌ | ✅ | ✅ |
| Ver comentarios internos | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |
| Crear/desactivar usuarios | ❌ | ❌ | ✅ |

---

## Reglas de Negocio Clave

1. **Visibilidad de tickets**: Un `user` solo puede ver tickets que él creó (`created_by = req.user.id`). Agents y admins ven todos.
2. **Visibilidad de comentarios**: Comentarios `internal` son invisibles para `user`.
3. **Código de ticket**: Generado automáticamente por el backend en formato `TCK-NNNN` (zero-padded). El cliente no puede elegirlo.
4. **Cambio de estado**: Solo agents y admins pueden cambiar el `status` de un ticket.
5. **Resolución**: Cuando el status cambia a `Resuelto`, se registra `resolved_at = datetime('now')`.
6. **Notificaciones**: Se generan automáticamente en el servicio cuando ocurren eventos relevantes (nuevo comentario, cambio de estado, asignación).
7. **Usuarios desactivados**: Un user con `active = 0` no puede autenticarse (login retorna 401).
8. **Paginación**: `GET /api/tickets` siempre pagina. Default: `page=1, limit=20`. Máximo: `limit=100`.

---

## Flujos de Casos de Uso

### Crear y resolver un ticket

```
Usuario → POST /api/tickets           → ticket creado (Abierto)
Agente  → POST /api/tickets/:id/assign → assigned_to asignado (En progreso)
Agente  → PATCH /api/tickets/:id      → status: "Resuelto", resolved_at set
Sistema → notificación al usuario creador
```

### Login

```
Cliente → POST /api/auth/login {email, password}
Backend → verifica email existe, usuario activo, bcrypt.compare
        → genera JWT con {id, role, email}
        → responde {token, user: {id, name, email, role}}
Cliente → guarda token en localStorage, adjunta en Authorization: Bearer <token>
```

### Agregar comentario interno

```
Agente → POST /api/tickets/:id/comments {content, visibility: "internal"}
Backend → verifica rol >= agent
        → guarda comment con visibility = 'internal'
        → al devolver comentarios a un 'user', filtrar internal
```

---

## Lo que NO está implementado (por ahora)

- Adjuntos en tickets
- Notificaciones en tiempo real (WebSocket/SSE)
- Búsqueda full-text
- Exportación a CSV/PDF
- 2FA
- Rate limiting avanzado
