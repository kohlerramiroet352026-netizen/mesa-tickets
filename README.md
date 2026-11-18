# Mesa — Sistema de Gestión de Tickets

**Mesa** es una aplicación web interna para la gestión de tickets de soporte. Permite a usuarios reportar incidencias, a agentes gestionarlas y a administradores configurar el sistema y los usuarios.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Base de datos | SQLite (via `better-sqlite3`) |
| Autenticación | JWT (jsonwebtoken) |
| Hashing | bcryptjs |

---

## Prerequisitos

- **Node.js >= 18** ([descargar](https://nodejs.org))
- npm (incluido con Node.js)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd "proyecto gen t"
```

### 2. Configurar el Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env y reemplazar JWT_SECRET con un valor seguro propio
```

### 3. Configurar el Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
```

---

## Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor Express | `3000` |
| `JWT_SECRET` | Secreto para firmar tokens JWT (usar valor largo y aleatorio) | `cambiar_esto_por_secreto_seguro` |
| `JWT_EXPIRES_IN` | Duración del token JWT | `8h` |
| `DB_PATH` | Ruta al archivo SQLite | `./mesa.db` |
| `NODE_ENV` | Entorno de ejecución | `development` |

### Frontend (`frontend/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del backend | `http://localhost:3000` |

---

## Ejecución en Desarrollo

Abrir **dos terminales**:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
```

```bash
# Terminal 2 — Frontend
cd frontend
npm run dev
```

El frontend queda disponible en `http://localhost:5173` y el backend en `http://localhost:3000`.

---

## Seed de Datos de Demo

Para poblar la base de datos con usuarios y tickets de ejemplo:

```bash
cd backend
npm run seed
```

### Usuarios de Demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@mesa.local | Admin123! | Administrador |
| agente@mesa.local | Agente123! | Agente |
| usuario1@mesa.local | Usuario123! | Usuario |
| usuario2@mesa.local | Usuario123! | Usuario |

> ⚠️ **Solo para desarrollo.** No ejecutar seed en producción con estas credenciales.

---

## Ejecución de Tests

```bash
cd backend
npm test
```

Los tests cubren los servicios y middlewares del backend.

---

## Build para Producción

```bash
# Backend
cd backend
npm run build
# El resultado queda en backend/dist/

# Frontend
cd frontend
npm run build
# El resultado queda en frontend/dist/
```

Para servir el frontend en producción, apuntar un servidor estático (nginx, etc.) a `frontend/dist/`. El backend corre con `node dist/server.js`.

---

## Crear el Primer Administrador sin Seed

Si no querés usar el seed completo, podés crear solo el primer admin ejecutando:

```bash
cd backend
npx tsx src/database/createAdmin.ts
```

O bien con variables de entorno:

```bash
ADMIN_NAME="Mi Admin" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="MiClave123!" npx tsx src/database/createAdmin.ts
```

---

## Estructura del Proyecto

```
proyecto gen t/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── connection.ts        # Conexión SQLite
│   │   │   ├── migrations.ts        # Creación de tablas
│   │   │   └── seed.ts              # Datos de demo
│   │   ├── middleware/
│   │   │   ├── auth.ts              # Verificación JWT
│   │   │   ├── authorize.ts         # Control de roles
│   │   │   └── errorHandler.ts      # Manejo centralizado de errores
│   │   ├── repositories/
│   │   │   ├── userRepository.ts
│   │   │   ├── ticketRepository.ts
│   │   │   ├── commentRepository.ts
│   │   │   ├── notificationRepository.ts
│   │   │   └── eventRepository.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── ticketService.ts
│   │   │   ├── commentService.ts
│   │   │   ├── notificationService.ts
│   │   │   └── userService.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── ticketController.ts
│   │   │   ├── commentController.ts
│   │   │   ├── notificationController.ts
│   │   │   └── userController.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── tickets.ts
│   │   │   ├── notifications.ts
│   │   │   └── users.ts
│   │   ├── types/
│   │   │   └── index.ts             # Interfaces TypeScript
│   │   ├── app.ts                   # Configuración Express
│   │   └── server.ts                # Entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                     # Funciones de llamadas HTTP
│   │   ├── components/              # Componentes reutilizables
│   │   ├── pages/                   # Páginas de la app
│   │   ├── context/                 # React Context (auth, etc.)
│   │   ├── hooks/                   # Custom hooks
│   │   ├── types/                   # Interfaces TypeScript compartidas
│   │   └── styles/                  # CSS global y variables
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/
│   └── spec.md                      # Especificación técnica completa
├── .cursor/
│   └── rules/
│       └── project.mdc              # Reglas para Cursor AI
├── README.md
└── AGENTS.md
```

---

## Decisiones Técnicas

| Decisión | Justificación |
|----------|--------------|
| SQLite en lugar de PostgreSQL | Simplicidad de despliegue, sin servidor de base de datos externo, adecuado para la escala del proyecto |
| `better-sqlite3` (síncrono) | API síncrona más simple y predecible en un contexto de servidor único; evita problemas de concurrencia innecesarios |
| JWT stateless | Autenticación sin estado, escalable, sin necesidad de sesiones en servidor |
| CSS propio sin frameworks | Control total del diseño, sin dependencias de terceros para estilos, bundle más pequeño |
| Arquitectura por capas (routes → controllers → services → repositories) | Separación clara de responsabilidades, testabilidad, mantenibilidad |
| TypeScript estricto | Detección temprana de errores, mejor DX, contratos explícitos entre capas |
| Vite como bundler | Build ultra-rápido, HMR instantáneo en desarrollo |

---

## Endpoints API

| Método | Ruta | Descripción | Roles Permitidos |
|--------|------|-------------|-----------------|
| `POST` | `/api/auth/login` | Login, devuelve JWT | Público |
| `GET` | `/api/auth/me` | Perfil del usuario actual | Autenticado |
| `POST` | `/api/auth/logout` | Logout (respuesta OK) | Autenticado |
| `GET` | `/api/tickets` | Listar tickets con filtros y paginación | Autenticado |
| `POST` | `/api/tickets` | Crear nuevo ticket | Autenticado |
| `GET` | `/api/tickets/:id` | Detalle de un ticket | Autenticado |
| `PATCH` | `/api/tickets/:id` | Modificar campos del ticket | Autenticado |
| `POST` | `/api/tickets/:id/assign` | Asignar agente a ticket | agent, admin |
| `POST` | `/api/tickets/:id/comments` | Agregar comentario | Autenticado |
| `GET` | `/api/notifications` | Listar notificaciones del usuario | Autenticado |
| `PATCH` | `/api/notifications/:id/read` | Marcar notificación como leída | Autenticado |
| `GET` | `/api/users` | Listar usuarios | admin |
| `POST` | `/api/users` | Crear usuario | admin |
| `PATCH` | `/api/users/:id` | Modificar usuario | admin |

---

## Licencia

Uso interno. No distribuir.
