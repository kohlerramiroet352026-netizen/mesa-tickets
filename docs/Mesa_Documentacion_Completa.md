# Mesa — Relevamiento Completo del Proyecto
## Manuales y Documentación Técnica

> **Sistema de gestión de tickets de soporte**  
> Versión 1.0.0 · Noviembre 2026  
> Stack: React 18 + Node.js 26 + SQLite · 28/28 tests ✅

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Estructura de Archivos](#3-estructura-de-archivos)
4. [Manual de Instalación](#4-manual-de-instalación)
5. [Manual del Usuario](#5-manual-del-usuario)
6. [Manual del Agente de Soporte](#6-manual-del-agente-de-soporte)
7. [Manual del Administrador](#7-manual-del-administrador)
8. [Referencia Técnica — API REST](#8-referencia-técnica--api-rest)
9. [Modelo de Datos](#9-modelo-de-datos)
10. [Reglas de Negocio Implementadas](#10-reglas-de-negocio-implementadas)
11. [Seguridad](#11-seguridad)
12. [Suite de Tests](#12-suite-de-tests)
13. [Decisiones Técnicas](#13-decisiones-técnicas)
14. [Glosario](#14-glosario)

---

## 1. Resumen Ejecutivo

**Mesa** es una aplicación web de gestión de tickets de soporte interno diseñada para equipos pequeños. Implementa un flujo completo: los usuarios crean tickets, los agentes los atienden y resuelven, y los administradores gestionan el sistema.

### Características del sistema

| Característica | Detalle |
|---------------|---------|
| **Roles de usuario** | 3 roles: usuario, agente, administrador |
| **Gestión de tickets** | Código legible `TCK-XXXX`, estados, prioridades, categorías |
| **Comentarios** | Públicos (todos) e internos (solo agents/admins) |
| **Historial** | Registro inmutable de cada cambio |
| **Notificaciones** | Automáticas por eventos, con soporte urgente inmediato |
| **Búsqueda** | Por texto libre en código, título y descripción |
| **Filtros** | Estado, prioridad, categoría, agente asignado |
| **Paginación** | Configurable, máximo 100 por página |
| **Responsividad** | Escritorio y móvil (menú hamburguesa) |
| **Tests** | 28 tests automáticos, 100% pasando |

### Stack tecnológico

```
Frontend                    Backend                     Persistencia
─────────────────────       ─────────────────────       ─────────────
React 18                    Node.js 26.13.1             SQLite
Vite 5.4.21                 Express 4.18.3              better-sqlite3 13.2.0
TypeScript 5.3              TypeScript 5.4
React Router 6.22           jsonwebtoken 9.0.2
Axios 1.6.7                 bcryptjs 2.4.3
CSS propio                  cors + dotenv
                            Jest + Supertest (tests)
```

---

## 2. Arquitectura del Sistema

### Diagrama de capas

```
╔══════════════════════════════════════════════════════╗
║                    NAVEGADOR                          ║
║                                                      ║
║  ┌──────────┐  ┌──────────────────────────────────┐  ║
║  │ Sidebar  │  │           PÁGINAS                 │  ║
║  │ 220px    │  │  Login  Dashboard  Tickets        │  ║
║  │ Fijo     │  │  Mis tickets  Detalle  Crear      │  ║
║  │          │  │  Usuarios (solo admin)            │  ║
║  └──────────┘  └──────────────────────────────────┘  ║
║  ┌──────────────────────────────────────────────────┐ ║
║  │  Header: título | búsqueda | 🔔 notificaciones   │ ║
║  └──────────────────────────────────────────────────┘ ║
║                                                      ║
║  AuthContext → JWT en localStorage (key: mesa_token) ║
║  Axios interceptor → Bearer Token automático         ║
║  Polling notificaciones → cada 30 segundos           ║
╚══════════════════════════════════════════════════════╝
              │  HTTP REST / JSON  │  Puerto 3001
              │  Proxy Vite: /api → localhost:3001
╔══════════════════════════════════════════════════════╗
║                    BACKEND                            ║
║                                                      ║
║  Routes → Controllers → Services → Repositories      ║
║                                                      ║
║  Middleware:                                         ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  ║
║  │   auth.ts    │ │authorize.ts  │ │errorHandler  │  ║
║  │ Verifica JWT │ │ Verifica rol │ │ Centralizado │  ║
║  │ → req.user   │ │ → 403/401    │ │ → no stack   │  ║
║  └──────────────┘ └──────────────┘ └──────────────┘  ║
║                                                      ║
║  Health check: GET /api/health → { status: "ok" }    ║
╚══════════════════════════════════════════════════════╝
              │  better-sqlite3 (síncrono)
╔══════════════════════════════════════════════════════╗
║               SQLite (mesa.db)                        ║
║  users · tickets · comments                           ║
║  ticket_events · notifications                        ║
╚══════════════════════════════════════════════════════╝
```

### Flujo de una petición autenticada (ejemplo: crear ticket)

```
1. Usuario completa formulario en CreateTicketPage.tsx
2. validators.ts valida los campos (frontend)
3. api/tickets.ts → POST /api/tickets con Bearer token (Axios)
4. Vite proxy redirige /api → http://localhost:3001/api
5. routes/tickets.ts recibe la petición
6. middleware/auth.ts verifica JWT → extrae req.user
7. controllers/ticketController.ts parsea req.body
8. services/ticketService.ts valida negocio (título ≥3 chars, categoría válida, etc.)
9. repositories/ticketRepository.ts ejecuta INSERT parametrizado
10. notificationService.ts notifica a todos los agents/admins
11. eventRepository.ts registra event_type: 'created'
12. Response 201 con ticket completo (incluyendo TCK-XXXX auto-generado)
13. Frontend redirige a /tickets/:id
14. Toast de éxito aparece en top-right
```

### Decisión de arquitectura: capas estrictas

```
routes/     → Solo registran rutas y middlewares. Sin lógica.
controllers/→ Parsean req/res. Llaman services. Sin SQL.
services/   → Toda la lógica de negocio. Sin HTTP. Sin req/res.
repositories/→ Solo SQL parametrizado. Sin lógica de negocio.
```

---

## 3. Estructura de Archivos

### Raíz del proyecto

```
proyecto gen t/
├── .gitignore                    ← node_modules, dist, .env, *.db
├── .cursor/rules/project.mdc     ← Reglas para Cursor AI
├── AGENTS.md                     ← Guía para agentes de IA
├── README.md                     ← Instalación y ejecución
├── docs/spec.md                  ← Especificación técnica completa
└── Spec_Trabajo_Final_Mesa_Tickets.md  ← Spec original del proyecto
```

### Backend (`backend/`)

```
backend/
├── .env                          ← Secretos (NO al repositorio)
├── .env.example                  ← Plantilla sin secretos
├── package.json                  ← Scripts: dev, build, start, seed, test
├── tsconfig.json
├── data/
│   └── mesa.db                   ← Archivo de base de datos SQLite
├── src/
│   ├── server.ts                 ← app.listen(PORT), arranca migraciones
│   ├── app.ts                    ← Express: CORS, body parsing, rutas, 404, errorHandler
│   │
│   ├── types/index.ts            ← Interfaces: User, SafeUser, Ticket, Comment,
│   │                                TicketEvent, Notification, AuthPayload,
│   │                                PaginatedResult<T>, TicketFilters
│   │
│   ├── database/
│   │   ├── connection.ts         ← Singleton better-sqlite3 (getDb(), closeDb())
│   │   ├── migrations.ts         ← CREATE TABLE IF NOT EXISTS (idempotente)
│   │   └── seed.ts               ← 4 usuarios demo + 7 tickets + comentarios
│   │
│   ├── middleware/
│   │   ├── auth.ts               ← Extrae Bearer token → jwt.verify() → req.user
│   │   ├── authorize.ts          ← authorize('admin','agent') factory
│   │   └── errorHandler.ts       ← Captura errores, responde JSON sin stack trace
│   │
│   ├── repositories/             ← SOLO SQL parametrizado
│   │   ├── userRepository.ts     ← findByEmail, findById, findByRole, create, update
│   │   ├── ticketRepository.ts   ← getNextCode, create, findById, list, update, assign
│   │   ├── commentRepository.ts  ← create, findByTicket (filtrado por rol)
│   │   ├── notificationRepository.ts ← create, findByUser, markRead
│   │   └── eventRepository.ts    ← create, findByTicket
│   │
│   ├── services/                 ← Lógica de negocio pura
│   │   ├── authService.ts        ← login (bcrypt.compare + jwt.sign)
│   │   ├── ticketService.ts      ← crear, obtener, listar, actualizar, asignar
│   │   ├── commentService.ts     ← crear (valida rol para internal), obtener
│   │   ├── notificationService.ts← notifyNewTicket, notifyAssigned, notifyStatus, notifyComment
│   │   └── userService.ts        ← listar, crear (bcrypt.hash), actualizar
│   │
│   ├── controllers/              ← Parsean req/res, llaman services
│   │   ├── authController.ts
│   │   ├── ticketController.ts
│   │   ├── commentController.ts
│   │   ├── notificationController.ts
│   │   └── userController.ts
│   │
│   └── routes/                   ← Registran rutas + aplican middlewares
│       ├── auth.ts               ← /api/auth/*
│       ├── tickets.ts            ← /api/tickets/*
│       ├── notifications.ts      ← /api/notifications/*
│       └── users.ts              ← /api/users/* (solo admin)
│
└── tests/
    └── api.test.ts               ← 28 tests (Jest + Supertest)
```

### Frontend (`frontend/`)

```
frontend/
├── .env                          ← VITE_API_URL=http://localhost:3001
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts                ← proxy: /api → localhost:3001
└── src/
    ├── main.tsx                  ← ReactDOM.createRoot(<App />)
    ├── App.tsx                   ← BrowserRouter + AuthProvider + Rutas
    │                                ProtectedRoute (sesión) + RoleRoute (rol)
    ├── index.css                 ← Reset CSS + variables globales (--color-accent: #2C5F6E)
    │
    ├── api/                      ← Funciones de llamadas HTTP (no fetch directo en componentes)
    │   ├── client.ts             ← Axios instance /api + interceptor JWT + redirect 401
    │   ├── auth.ts               ← login(), getMe(), logout()
    │   ├── tickets.ts            ← list(), get(), create(), update(), assign()
    │   ├── comments.ts           ← addComment()
    │   ├── notifications.ts      ← list(), markRead()
    │   └── users.ts              ← list(), create(), update()
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.tsx        ← Wrapper: Sidebar + Header + <Outlet/>
    │   │   ├── Sidebar.tsx       ← 220px fija, links nav + usuario/rol abajo
    │   │   └── Header.tsx        ← Título sección + 🔔 popover + botón nuevo ticket
    │   │
    │   └── common/
    │       ├── Badge.tsx         ← Estado (colores), Prioridad (colores), Categoría
    │       ├── Button.tsx        ← primary/secondary/danger, loading state
    │       ├── Input.tsx         ← Con label, error, disabled
    │       ├── Select.tsx        ← Con label, opciones, error
    │       ├── Textarea.tsx      ← Con label, rows, error
    │       ├── Modal.tsx         ← Overlay, título, body, cancelar/confirmar
    │       ├── Spinner.tsx       ← SVG animado, prop size
    │       ├── EmptyState.tsx    ← Icono + título + descripción cuando no hay datos
    │       ├── Pagination.tsx    ← Anterior/Siguiente + info de página
    │       └── Notification.tsx  ← Sistema de Toasts: ToastContainer + useToast hook
    │
    ├── pages/
    │   ├── LoginPage.tsx         ← Formulario + validación + manejo de error 401
    │   ├── DashboardPage.tsx     ← Métricas por estado + tickets asignados/propios + actividad reciente
    │   ├── TicketsPage.tsx       ← Tabla con búsqueda, 4 filtros, ordenamiento, paginación
    │   ├── MyTicketsPage.tsx     ← Igual pero solo tickets propios
    │   ├── TicketDetailPage.tsx  ← Info + historial + comentarios + acciones por rol
    │   ├── CreateTicketPage.tsx  ← Formulario validado + redirect a detalle
    │   ├── UsersPage.tsx         ← Tabla + modal crear/editar + activar/desactivar
    │   └── NotFoundPage.tsx      ← 404 con link al dashboard
    │
    ├── contexts/
    │   └── AuthContext.tsx       ← user, loading, login(), logout(), setUser()
    │                                Carga inicial desde localStorage + GET /api/auth/me
    │
    ├── hooks/
    │   ├── useAuth.ts            ← Wrapper de useContext(AuthContext)
    │   ├── useTickets.ts         ← Fetching de tickets con estado loading/error
    │   └── useNotifications.ts   ← Polling cada 30s, contador no leídas, markRead()
    │
    ├── types/index.ts            ← User, UserRole, Ticket, Comment, Notification,
    │                                TicketEvent, PaginatedResponse<T>, TicketFilters
    │
    └── utils/
        ├── format.ts             ← formatDate(), formatPriority(), formatStatus()
        └── validators.ts         ← validateTicketForm(), validateUserForm()
```

---

## 4. Manual de Instalación

### Prerequisitos

| Herramienta | Versión mínima | Verificación |
|-------------|---------------|-------------|
| Node.js | 18.x (probado en 26.13.1) | `node --version` |
| npm | 9.x+ (probado en 11.20.0) | `npm --version` |

> [!IMPORTANT]
> En Windows, si `npm` no es reconocido, abrí una terminal nueva después de instalar Node.js. Si sigue sin funcionar: `$env:PATH += ";C:\Program Files\nodejs"` en la terminal.

### Paso 1: Instalar dependencias del backend

```bash
cd backend
npm install
```

> Si aparece advertencia de `install-scripts`:
> ```bash
> npm install-scripts approve better-sqlite3
> npm install-scripts approve esbuild
> npm install
> ```

### Paso 2: Configurar variables de entorno del backend

```bash
cp .env.example .env
```

Editar `backend/.env`:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=./data/mesa.db
JWT_SECRET=tu_cadena_secreta_larga_y_aleatoria_aqui
FRONTEND_URL=http://localhost:5173
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor | `3001` |
| `DATABASE_URL` | Ruta al archivo SQLite | `./data/mesa.db` |
| `JWT_SECRET` | Clave secreta para firmar tokens | Mínimo 32 caracteres aleatorios |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:5173` |

### Paso 3: Cargar datos de demostración

```bash
npm run seed
```

Salida esperada:
```
Migrations completed successfully.
Seeding database with demo data...
Created user: admin@mesa.local (admin)
Created user: agente@mesa.local (agent)
Created user: usuario1@mesa.local (user)
Created user: usuario2@mesa.local (user)
Created ticket: TCK-0001 - No puedo acceder a mi cuenta
...
Seed completed successfully!
```

### Paso 4: Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

> Si aparece advertencia de `install-scripts`:
> ```bash
> npm install-scripts approve esbuild
> npm install
> ```

### Paso 5: Configurar variables de entorno del frontend

```bash
cp .env.example .env
```

Contenido de `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

### Paso 6: Iniciar la aplicación

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Salida esperada: `Mesa API server running on http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Salida esperada: `Local: http://localhost:5173/`

**Abrir en el navegador:** http://localhost:5173

### Usuarios de demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@mesa.local` | `Admin123!` | Administrador |
| `agente@mesa.local` | `Agente123!` | Agente |
| `usuario1@mesa.local` | `Usuario123!` | Usuario |
| `usuario2@mesa.local` | `Usuario123!` | Usuario |

### Comandos de referencia completos

```bash
# Backend
npm run dev      # tsx watch src/server.ts (hot reload)
npm run build    # tsc → compila a dist/
npm start        # node dist/server.js (producción)
npm run seed     # tsx src/database/seed.ts
npm test         # jest --forceExit --detectOpenHandles (28 tests)

# Frontend
npm run dev      # vite (HMR en localhost:5173)
npm run build    # tsc && vite build → dist/
npm run preview  # vite preview (previsualizar build)
```

---

## 5. Manual del Usuario

El rol **Usuario** puede crear y seguir sus propios tickets.

### Iniciar sesión

1. Ir a `http://localhost:5173`
2. Ingresar email y contraseña
3. Click en **Iniciar sesión**
4. Si la sesión es válida, el sistema redirige automáticamente al panel

> [!NOTE]
> Si el sistema muestra "Error inesperado", verificar que el backend esté corriendo (`npm run dev` en la carpeta `backend`).

### Panel principal

Al ingresar se muestra:
- **4 contadores** de tickets por estado (Abierto, En progreso, En espera, Resuelto)
- **Mis tickets recientes**: los últimos tickets que creaste

### Crear un ticket

1. Click en **Nuevo ticket** (botón en el header o sidebar)
2. Completar el formulario:

| Campo | Requerido | Restricciones |
|-------|-----------|--------------|
| Título | ✅ | Mínimo 3 caracteres, máximo 200 |
| Descripción | ✅ | Mínimo 5 caracteres |
| Categoría | ✅ | Consulta / Problema técnico / Acceso / Otro |
| Prioridad | ✅ | Baja / **Media** (default) / Alta / Urgente |

3. Click en **Crear ticket**
4. Se redirige al detalle con el código `TCK-XXXX` asignado automáticamente

### Mis tickets

- Ir a **Mis tickets** en la barra lateral
- Filtrar por estado (`Abierto`, `En progreso`, `En espera`, `Resuelto`) o prioridad
- Click en cualquier fila para ver el detalle

> [!NOTE]
> Como usuario, solo ves los tickets que vos creaste. No podés ver los tickets de otros usuarios.

### Detalle de un ticket

La pantalla de detalle muestra:

```
┌─── TCK-0001 ─── Encabezado ────────────────────────────────────┐
│ Título del ticket                     [Abierto]  [Media]        │
├────────────────────────────────────────────────────────────────┤
│ Categoría: Consulta   Creado por: Tu nombre   Asignado a: —     │
│ Creado: 18/11/2026 10:30   Actualizado: 18/11/2026 10:30        │
├────────────────────────────────────────────────────────────────┤
│ DESCRIPCIÓN                                                     │
│ Texto completo del ticket...                                    │
├────────────────────────────────────────────────────────────────┤
│ HISTORIAL                                                       │
│ 10:30 · Ticket creado por Tu nombre                            │
│ 10:45 · Estado cambiado de Abierto → En progreso por Agente    │
├────────────────────────────────────────────────────────────────┤
│ COMENTARIOS                                                     │
│ [Agente] 10:50 · Estamos revisando el problema.                │
│                                                                 │
│ Escribe un comentario...              [Enviar comentario]        │
└────────────────────────────────────────────────────────────────┘
```

### Agregar un comentario

1. En el detalle del ticket, escribir en el campo de texto al final
2. Click en **Enviar comentario**

> [!NOTE]
> Solo podés agregar **comentarios públicos**. Las notas internas del equipo (marcadas en gris) solo son visibles para agents y admins.

### Editar tu ticket

Solo podés editar el **título**, **descripción** y **categoría** si:
- El ticket fue creado por vos
- El estado es **Abierto**

### Notificaciones

El ícono 🔔 en el header muestra un número rojo con las notificaciones sin leer. Recibirás notificaciones cuando:
- Un agente te asigne (y empiece a trabajar en) tu ticket
- El estado de tu ticket cambie
- Un agente te responda con un comentario público

Click en la campana → ver lista → click en una notificación la marca como leída.

### Cerrar sesión

Click en tu nombre en la parte inferior de la barra lateral → **Cerrar sesión**.

---

## 6. Manual del Agente de Soporte

El rol **Agente** gestiona todos los tickets del sistema.

### Panel del Agente

Muestra:
- Métricas de **todos** los tickets del sistema (no solo los propios)
- **Mis tickets asignados**: tickets donde `assigned_to` es tu usuario
- **Actividad reciente**: últimos 5 eventos del sistema

### Todos los tickets

Ir a **Todos los tickets** (visible solo para agents y admins).

**Tabla de tickets:**

| Columna | Descripción |
|---------|------------|
| Código | `TCK-XXXX` (monoespaciado) |
| Título | Texto del ticket |
| Categoría | Consulta / Problema técnico / Acceso / Otro |
| Prioridad | Badge de color (gris/azul/naranja/rojo) |
| Estado | Badge de color |
| Asignado a | Nombre del agente o `—` |
| Fecha | Fecha de creación o última actualización |

**Búsqueda y filtros:**

| Filtro | Opciones |
|--------|---------|
| Búsqueda de texto | Busca en código, título y descripción |
| Estado | Abierto / En progreso / En espera / Resuelto |
| Prioridad | Baja / Media / Alta / Urgente |
| Categoría | Consulta / Problema técnico / Acceso / Otro |
| Agente asignado | Lista de agents/admins |

**Paginación:** 10 tickets por página por defecto.

### Tomar o asignar un ticket

En el detalle del ticket:
1. Sección **Acciones** → selector **Agente asignado**
2. Elegirte a vos mismo o a otro agente
3. Click en **Asignar**

El sistema:
- Registra el evento en el historial
- Genera una notificación para el agente asignado
- Si el ticket es de prioridad **Urgente**, la notificación incluye `[URGENTE]`

### Cambiar el estado

En el detalle del ticket, selector de **Estado**:

```
Abierto → En progreso → En espera → Resuelto
              ↑                         │
              └─────────────────────────┘
                   (puede reabrirse)
```

> [!IMPORTANT]
> Al cambiar a **Resuelto**: se guarda automáticamente `resolved_at`.  
> Al reabrir el ticket: se limpia `resolved_at` pero el historial se conserva.

Cada cambio de estado:
- Se registra en el historial con fecha y quién lo cambió
- Genera una notificación al usuario creador del ticket

### Cambiar la prioridad

Selector de **Prioridad** en el detalle → cada cambio se registra en el historial.

| Prioridad | Color del badge |
|-----------|----------------|
| Baja | Gris neutro |
| Media | Azul petróleo claro |
| Alta | Naranja |
| Urgente | Rojo (#DC2626) |

### Agregar comentarios

Como agente, podés elegir el tipo de comentario:

**Respuesta pública:**
- Visible para el usuario creador y todo el equipo
- El usuario recibe una notificación

**Nota interna:**
- Visible solo para agents y admins
- El backend filtra activamente: los usuarios nunca ven estas notas
- Se muestra con fondo visual diferente en la interfaz

Para agregar nota interna: activar el toggle **Nota interna** antes de enviar.

### Historial de cambios

Cada ticket tiene un historial completo e inmutable:

| Tipo de evento | Qué registra |
|---------------|-------------|
| `created` | Código del ticket creado |
| `status_changed` | Estado anterior → nuevo estado |
| `assigned` | ID anterior → nuevo ID del agente |
| `priority_changed` | Prioridad anterior → nueva |

---

## 7. Manual del Administrador

El rol **Administrador** tiene todo el acceso del Agente más la gestión de usuarios.

### Gestión de usuarios

Ir a **Administración** en la barra lateral (visible solo para admins).

**Tabla de usuarios:**

| Columna | Descripción |
|---------|------------|
| Nombre | Nombre visible |
| Email | Dirección de correo (login) |
| Rol | usuario / agente / admin |
| Estado | Activo / Inactivo |
| Creado | Fecha de creación |

### Crear un usuario

1. Click en **Nuevo usuario**
2. Completar el modal:
   - **Nombre** (requerido)
   - **Email** (requerido, único en el sistema)
   - **Contraseña** (requerida)
   - **Rol**: usuario / agente / admin
3. Click en **Crear**

El sistema hashea la contraseña con bcrypt antes de guardarla.

### Editar un usuario

1. Click en el usuario en la tabla
2. Modificar los campos (nombre, email, rol, estado activo)
3. Click en **Guardar**

### Desactivar un usuario

Cambiar el campo **Estado** a Inactivo al editar.

> [!CAUTION]
> Un usuario inactivo (`active = 0`) no puede iniciar sesión — el backend devuelve 401 antes de verificar la contraseña. Sus datos y tickets **se conservan** para mantener la integridad del historial.

### Cambiar roles

En la edición de usuario, cambiar el campo **Rol**:
- **usuario** → solo ve sus propios tickets
- **agente** → gestiona todos los tickets
- **admin** → acceso total + gestión de usuarios

### Por qué no se pueden eliminar usuarios

Los usuarios están referenciados en tickets (`created_by`, `assigned_to`), comentarios, eventos y notificaciones. Eliminar un usuario rompería la integridad de todo el historial. La solución correcta es desactivarlos.

---

## 8. Referencia Técnica — API REST

**Base URL:** `http://localhost:3001`  
**Autenticación:** `Authorization: Bearer <jwt_token>` en todas las rutas salvo `/api/auth/login`

### Autenticación

#### `POST /api/auth/login`

**Body:**
```json
{ "email": "admin@mesa.local", "password": "Admin123!" }
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1, "name": "Administrador", "email": "admin@mesa.local",
    "role": "admin", "active": 1, "created_at": "2026-11-18 16:23:04"
  }
}
```

**Errores:** `400` datos vacíos · `401` credenciales inválidas o usuario inactivo

---

#### `GET /api/auth/me`

**Response 200:** Mismo objeto `user` que en login (sin `password_hash`).

---

#### `POST /api/auth/logout`

**Response 200:** `{ "message": "Sesión cerrada" }`

> El backend no mantiene estado de sesión. El cliente descarta el token de `localStorage`.

---

### Tickets

#### `GET /api/tickets`

**Query params:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `status` | string | `Abierto` / `En progreso` / `En espera` / `Resuelto` |
| `priority` | string | `Baja` / `Media` / `Alta` / `Urgente` |
| `category` | string | `Consulta` / `Problema técnico` / `Acceso` / `Otro` |
| `assigned_to` | number | ID del agente asignado |
| `search` | string | Busca en `code`, `title`, `description` (LIKE) |
| `page` | number | Página (default: 1) |
| `pageSize` | number | Items por página (default: 20, máx: 100) |

**Comportamiento por rol:**
- `role = 'user'`: el repositorio agrega `WHERE t.created_by = ?` automáticamente
- `role = 'agent'` / `'admin'`: sin restricción por creador

**Response 200:**
```json
{
  "data": [
    {
      "id": 1, "code": "TCK-0001", "title": "No puedo acceder",
      "category": "Acceso", "priority": "Alta", "status": "Abierto",
      "created_by": 4, "creator_name": "Usuario 1",
      "assigned_to": null, "assignee_name": null,
      "created_at": "2026-11-18 16:23:05", "updated_at": "2026-11-18 16:23:05",
      "resolved_at": null
    }
  ],
  "total": 7, "page": 1, "pageSize": 20, "totalPages": 1
}
```

---

#### `POST /api/tickets`

**Body:**
```json
{
  "title": "El sistema no responde",
  "description": "Desde las 9am el módulo de reportes falla al cargar",
  "category": "Problema técnico",
  "priority": "Alta"
}
```

**Validaciones (en `ticketService.ts`):**
- `title`: string, mínimo 3 caracteres
- `description`: string, mínimo 5 caracteres
- `category`: debe ser uno de los 4 valores válidos
- `priority`: debe ser uno de los 4 valores válidos

**Response 201:** Objeto ticket completo con `code: "TCK-XXXX"` y `status: "Abierto"`

---

#### `GET /api/tickets/:id`

**Response 200:**
```json
{
  "id": 1, "code": "TCK-0001",
  "comments": [
    { "id": 1, "content": "Revisando...", "visibility": "public",
      "author_id": 2, "author_name": "Agente", "created_at": "..." }
  ],
  "events": [
    { "id": 1, "event_type": "created", "new_value": "TCK-0001",
      "actor_id": 4, "actor_name": "Usuario 1", "created_at": "..." }
  ]
}
```

> Los comentarios `internal` son filtrados automáticamente si `req.user.role === 'user'`.

---

#### `PATCH /api/tickets/:id`

**Body (todos los campos son opcionales):**
```json
{
  "title": "Nuevo título",
  "description": "Nueva descripción",
  "category": "Otro",
  "priority": "Urgente",
  "status": "En progreso"
}
```

**Restricciones:**
- `role = 'user'`: solo puede cambiar `title`, `description`, `category` si es su ticket y está `Abierto`
- `role = 'agent'` / `'admin'`: puede cambiar todos los campos

---

#### `POST /api/tickets/:id/assign`

Solo roles `agent` y `admin`.

**Body:**
```json
{ "agent_id": 2 }
```

**Response 200:** Ticket actualizado con `assigned_to: 2`.

---

#### `POST /api/tickets/:id/comments`

**Body:**
```json
{
  "content": "El problema fue resuelto actualizando el módulo X.",
  "visibility": "public"
}
```

`visibility`: `"public"` o `"internal"`. Para `"internal"`, el rol debe ser `agent` o `admin` (el backend verifica).

**Response 201:** Objeto comment creado.

---

### Notificaciones

#### `GET /api/notifications`

Devuelve las notificaciones del usuario autenticado, ordenadas por fecha descendente.

**Response 200:**
```json
[
  {
    "id": 5,
    "user_id": 2,
    "ticket_id": 3,
    "message": "[URGENTE] Se te asignó el ticket TCK-0003",
    "read_at": null,
    "created_at": "2026-11-18 16:45:00"
  }
]
```

---

#### `PATCH /api/notifications/:id/read`

Marca una notificación como leída (establece `read_at = datetime('now')`).

**Response 200:**
```json
{ "id": 5, "read_at": "2026-11-18 16:46:00", ... }
```

---

### Usuarios (solo admin)

#### `GET /api/users`

**Response 200:** Array de objetos `SafeUser` (sin `password_hash`).

---

#### `POST /api/users`

**Body:**
```json
{
  "name": "Nuevo Agente",
  "email": "nuevo@empresa.com",
  "password": "Contraseña123!",
  "role": "agent"
}
```

**Response 201:** Objeto `SafeUser` creado.

---

#### `PATCH /api/users/:id`

**Body (campos opcionales):**
```json
{ "name": "Nombre", "email": "email@dom.com", "role": "admin", "active": 0 }
```

---

#### `GET /api/health`

Endpoint de health check (sin autenticación).

**Response 200:**
```json
{ "status": "ok", "timestamp": "2026-11-18T16:30:00.000Z" }
```

### Tabla resumen de endpoints

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/api/auth/login` | público | Iniciar sesión |
| GET | `/api/auth/me` | autenticado | Perfil actual |
| POST | `/api/auth/logout` | autenticado | Cerrar sesión |
| GET | `/api/tickets` | autenticado | Listar tickets |
| POST | `/api/tickets` | autenticado | Crear ticket |
| GET | `/api/tickets/:id` | autenticado | Detalle del ticket |
| PATCH | `/api/tickets/:id` | autenticado | Modificar ticket |
| POST | `/api/tickets/:id/assign` | agent, admin | Asignar agente |
| POST | `/api/tickets/:id/comments` | autenticado | Agregar comentario |
| GET | `/api/notifications` | autenticado | Mis notificaciones |
| PATCH | `/api/notifications/:id/read` | autenticado | Marcar como leída |
| GET | `/api/users` | admin | Listar usuarios |
| POST | `/api/users` | admin | Crear usuario |
| PATCH | `/api/users/:id` | admin | Modificar usuario |
| GET | `/api/health` | público | Health check |

### Códigos HTTP devueltos

| Código | Cuándo |
|--------|--------|
| `200` | Éxito (GET, PATCH, DELETE, POST sin crear recurso) |
| `201` | Recurso creado exitosamente (POST /tickets, /comments, /users) |
| `400` | Datos de entrada inválidos (título muy corto, categoría inválida, etc.) |
| `401` | No autenticado (token ausente, inválido, expirado, o usuario inactivo) |
| `403` | Autenticado pero sin permiso para esta acción |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |

---

## 9. Modelo de Datos

### Esquema SQL completo

```sql
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role         TEXT NOT NULL CHECK(role IN ('user','agent','admin')),
  active       INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tickets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT UNIQUE NOT NULL,            -- TCK-0001
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL CHECK(category IN ('Consulta','Problema técnico','Acceso','Otro')),
  priority    TEXT NOT NULL CHECK(priority IN ('Baja','Media','Alta','Urgente')),
  status      TEXT NOT NULL CHECK(status IN ('Abierto','En progreso','En espera','Resuelto')),
  created_by  INTEGER NOT NULL REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),   -- nullable
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT                             -- nullable, se llena al resolver
);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id  INTEGER NOT NULL REFERENCES tickets(id),
  author_id  INTEGER NOT NULL REFERENCES users(id),
  content    TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK(visibility IN ('public','internal')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ticket_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id  INTEGER NOT NULL REFERENCES tickets(id),
  actor_id   INTEGER NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,  -- 'created'|'status_changed'|'assigned'|'priority_changed'
  old_value  TEXT,           -- nullable
  new_value  TEXT,           -- nullable
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  ticket_id  INTEGER,        -- nullable (notificaciones sin ticket asociado)
  message    TEXT NOT NULL,
  read_at    TEXT,           -- nullable: NULL = no leída
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Relaciones entre tablas

```
users (1) ──────────────────────< tickets.created_by (N)
users (1) ──────────────────────< tickets.assigned_to (N, nullable)
users (1) ──────────────────────< comments.author_id (N)
users (1) ──────────────────────< ticket_events.actor_id (N)
users (1) ──────────────────────< notifications.user_id (N)

tickets (1) ─────────────────────< comments.ticket_id (N)
tickets (1) ─────────────────────< ticket_events.ticket_id (N)
tickets (1) ─────────────────────< notifications.ticket_id (N, nullable)
```

### TypeScript interfaces (backend)

```typescript
export type SafeUser = Omit<User, 'password_hash'>;

export interface Ticket {
  id: number; code: string; title: string; description: string;
  category: 'Consulta' | 'Problema técnico' | 'Acceso' | 'Otro';
  priority: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  status: 'Abierto' | 'En progreso' | 'En espera' | 'Resuelto';
  created_by: number; assigned_to: number | null;
  created_at: string; updated_at: string; resolved_at: string | null;
}

export interface PaginatedResult<T> {
  data: T[]; total: number; page: number;
  pageSize: number; totalPages: number;
}

export interface AuthPayload {
  id: number; email: string; role: 'user' | 'agent' | 'admin';
}
```

### Generación del código TCK-XXXX

```typescript
// ticketRepository.ts
export function getNextTicketCode(): string {
  const db = getDb();
  const row = db.prepare("SELECT code FROM tickets ORDER BY id DESC LIMIT 1").get();
  if (!row) return 'TCK-0001';
  const num = parseInt(row.code.split('-')[1], 10) + 1;
  return `TCK-${String(num).padStart(4, '0')}`;
  // → TCK-0001, TCK-0002, ..., TCK-9999, TCK-10000
}
```

---

## 10. Reglas de Negocio Implementadas

### Visibilidad de tickets (ticketService.ts)

```typescript
export function getTicket(id: number, userId: number, role: string): Ticket {
  const ticket = findTicketById(id);
  if (!ticket) throw createError('Ticket no encontrado', 404);
  if (role === 'user' && ticket.created_by !== userId) {
    throw createError('No tienes acceso a este ticket', 403);
  }
  return ticket;
}
```

### Filtrado SQL por rol (ticketRepository.ts)

```typescript
// Role-based restriction aplicada en SQL, no en memoria
if (role === 'user') {
  conditions.push('t.created_by = ?');
  params.push(userId);
}
```

### Notas internas (commentService.ts)

El backend impide que usuarios con rol `'user'`:
1. **Creen** notas internas → 403
2. **Vean** notas internas → filtradas en la query SQL

### Resolución de tickets (ticketService.ts)

```typescript
if (fields.status === 'Resuelto' && ticket.status !== 'Resuelto') {
  updateData.resolved_at = new Date().toISOString(); // ← se establece
} else if (fields.status !== 'Resuelto' && ticket.status === 'Resuelto') {
  updateData.resolved_at = null; // ← se limpia al reabrir
}
```

### Notificaciones automáticas (notificationService.ts)

```typescript
// Nuevo ticket → notificar a todos agents y admins
export function notifyNewTicket(ticketId, ticketCode, ticketTitle) {
  const recipients = [...findUsersByRole('admin'), ...findUsersByRole('agent')];
  for (const r of recipients) createNotification({ user_id: r.id, ... });
}

// Asignación urgente → prefijo [URGENTE]
export function notifyTicketAssigned(ticketId, ticketCode, agentId, urgent) {
  const message = urgent
    ? `[URGENTE] Se te asignó el ticket ${ticketCode}`
    : `Se te asignó el ticket ${ticketCode}`;
  createNotification({ user_id: agentId, ticket_id: ticketId, message });
}

// No auto-notificar si el autor comenta su propio ticket
export function notifyPublicComment(ticketId, ticketCode, creatorId, authorId) {
  if (creatorId === authorId) return; // ← guard
  createNotification({ user_id: creatorId, ... });
}
```

### Autorización por capas (middleware/authorize.ts)

```typescript
export function authorize(...roles: string[]) {
  return (req, res, next) => {
    if (!req.user) { res.status(401)...; return; }
    if (!roles.includes(req.user.role)) { res.status(403)...; return; }
    next();
  };
}

// Uso en routes/users.ts:
router.get('/', authMiddleware, authorize('admin'), userController.list);
```

### Rutas protegidas en el frontend (App.tsx)

```tsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role))
    return <Navigate to="/dashboard" />;
  return children;
}
```

---

## 11. Seguridad

### JWT (auth.ts)

```typescript
// Verificación en cada petición protegida
const payload = jwt.verify(token, secret) as AuthPayload;
req.user = payload;
// → Token inválido o expirado → 401 automático
```

- Algoritmo: `HS256`
- Expiración: `24h`
- Payload: `{ id, email, role }` — mínimo necesario
- Secret: solo en `process.env.JWT_SECRET`, nunca hardcodeado

### Contraseñas

- Hash con `bcryptjs`, factor de coste 10
- `password_hash` **nunca** aparece en ninguna respuesta JSON
- Tipo `SafeUser = Omit<User, 'password_hash'>` garantizado en TypeScript

### SQL

- Todas las consultas usan `?` o named params de `better-sqlite3`
- Nunca se concatena input del usuario en strings SQL
- Los filtros dinámicos en `listTickets()` usan arrays de condiciones y params

### CORS

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

### Interceptor 401 en el frontend

```typescript
// api/client.ts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mesa_token');
      localStorage.removeItem('mesa_user');
      window.location.href = '/login'; // ← sesión vencida → redirige
    }
    return Promise.reject(error);
  }
);
```

### Manejo de errores

- `errorHandler.ts` centraliza todos los errores Express
- Stack traces solo en logs del servidor, nunca en la respuesta JSON
- Clientes reciben solo el mensaje de error, no detalles internos

---

## 12. Suite de Tests

### Ejecutar

```bash
cd backend
npm test
```

### Resultado

```
Test Suites: 1 passed, 1 total
Tests:       28 passed, 28 total
Snapshots:   0 total
Time:        3.28s
```

### Configuración

Los tests usan una **BD en memoria separada** (`mesa_test.db`), creada limpia antes de cada suite con `seedTestData()`. El archivo `api.test.ts` establece las variables de entorno antes de importar `app.ts`:

```typescript
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = './data/mesa_test.db';
process.env.JWT_SECRET = 'test_secret_key_for_testing';
```

### Cobertura de los 10 casos de la spec

| # | Describe | Tests | Estado |
|---|---------|-------|--------|
| 1 | Un usuario puede crear un ticket | 2 | ✅ |
| 2 | Un usuario no puede ver tickets de otra persona | 3 | ✅ |
| 3 | Notas internas: usuarios no pueden crearlas ni verlas | 2 | ✅ |
| 4 | Un agente puede asignarse y cambiar estado | 3 | ✅ |
| 5 | Usuario común no puede acceder a rutas de admin | 2 | ✅ |
| 6 | Agente no puede administrar usuarios | 3 | ✅ |
| 7 | Solicitudes sin sesión válida reciben 401 | 4 | ✅ |
| 8 | Filtros y paginación | 4 | ✅ |
| 9 | Notificación al asignar ticket urgente | 2 | ✅ |
| 10 | Los datos persisten (SQLite en disco) | 3 | ✅ |
| **Total** | | **28** | **✅** |

### Helper de tests reutilizable

```typescript
// Helpers en api.test.ts
async function loginAs(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Test123!' });
  return res.body.token;
}

// Uso en cada test:
const token = await loginAs('agent@test.local');
const res = await request(app)
  .patch(`/api/tickets/${ticketId}`)
  .set('Authorization', `Bearer ${token}`)
  .send({ status: 'Resuelto' });
expect(res.body.resolved_at).not.toBeNull();
```

---

## 13. Decisiones Técnicas

| Decisión | Alternativa considerada | Justificación |
|----------|------------------------|--------------|
| **SQLite** | PostgreSQL, MySQL | Sin servidor de BD externo; setup inmediato; archivo único en disco; ideal para equipos pequeños y trabajo académico |
| **better-sqlite3 síncrono** | sqlite3 (async/callback) | API síncrona elimina callback hell; más performante para SQLite; código de repositorios más limpio |
| **JWT stateless** | Sessions con Redis/memoria | Elimina necesidad de store de sesiones; escalable horizontalmente; token portado por el cliente |
| **CSS propio** | Tailwind, Bootstrap, MUI | Identidad visual propia definida en la spec; bundle más liviano; control total sobre variables y temas |
| **Axios sobre fetch** | fetch nativo | Interceptores para JWT y manejo de 401 más limpios; menos boilerplate; cancelación de peticiones |
| **tsx watch** para dev | ts-node, nodemon+tsc | Transpila TypeScript al vuelo sin paso de compilación separado; recarga en cambios de archivo |
| **Migraciones con IF NOT EXISTS** | Liquibase, Flyway | Implementación simple y reproducible; no requiere dependencias adicionales; idempotente |
| **Polling 30s** para notificaciones | WebSocket, SSE | Implementación más simple; sin dependencias adicionales; adecuado para la escala del proyecto |
| **Capas separadas** (routes → controllers → services → repositories) | Código monolítico | Separación de responsabilidades; cada capa es testeable independientemente |

### Funcionalidades explícitamente fuera del alcance (v1)

- Adjuntos en tickets
- Notificaciones en tiempo real (WebSocket/SSE)
- Búsqueda full-text avanzada (FTS5)
- Exportación a CSV/PDF
- Autenticación de dos factores (2FA)
- Rate limiting avanzado
- Integración con correo electrónico
- Multi-empresa / multi-tenant
- Chat en tiempo real
- Microservicios

---

## 14. Glosario

| Término | Definición |
|---------|-----------|
| **Ticket** | Solicitud de soporte creada por un usuario, identificada con un código único `TCK-XXXX` |
| **Código TCK-XXXX** | Identificador legible auto-generado por el backend. Formato: `TCK-` + número de 4 dígitos con cero-padding |
| **Usuario** | Rol básico. Solo crea y ve sus propios tickets |
| **Agente** | Rol de soporte. Gestiona y resuelve todos los tickets del sistema |
| **Administrador** | Rol de gestión. Acceso completo + gestión de usuarios |
| **Comentario público** | Respuesta visible para el creador del ticket y todo el equipo |
| **Nota interna** | Comentario visible solo para agents y admins. El backend lo filtra activamente |
| **Ticket event** | Registro inmutable de cada cambio (quién, qué, cuándo). No se puede borrar |
| **JWT** | JSON Web Token. Credencial firmada con `HS256` que autentica al usuario en cada petición |
| **SafeUser** | Tipo TypeScript = `User` sin `password_hash`. Usado en todas las respuestas API |
| **Seed** | Script (`npm run seed`) que carga datos de demostración en la BD |
| **Migración** | Script SQL (`migrations.ts`) que crea tablas con `IF NOT EXISTS`. Idempotente |
| **Polling** | El frontend consulta las notificaciones al backend cada 30 segundos |
| **resolved_at** | Timestamp UTC guardado automáticamente cuando un ticket pasa a estado `Resuelto` |
| **Usuario inactivo** | `active = 0`. No puede iniciar sesión (401). Sus datos se conservan |
| **CORS** | Política que restringe qué origen (URL) puede llamar al backend |
| **better-sqlite3** | Driver SQLite síncrono para Node.js. Más performante que las alternativas async |
| **bcryptjs** | Librería para hashear contraseñas con salt aleatorio |
| **Urgente** | Prioridad máxima. Al asignar un ticket urgente, la notificación incluye `[URGENTE]` |
