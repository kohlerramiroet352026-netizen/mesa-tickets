# Trabajo final — Sistema de gestión de tickets

## Instrucciones para la IA de desarrollo

Actuá como desarrollador full-stack senior y construí una aplicación web funcional para gestionar tickets de soporte. No quiero solamente una maqueta visual: los formularios, filtros, acciones, permisos y persistencia deben funcionar realmente.

El objetivo es entregar un proyecto ordenado, fácil de ejecutar y suficientemente completo para presentarlo como trabajo final del módulo de desarrollo de proyectos reales.

---

## 1. Idea general

Crear una aplicación web llamada **Mesa**, destinada a organizar solicitudes de soporte de un equipo pequeño.

Los usuarios pueden crear tickets, consultar su estado y seguir las respuestas. Los agentes de soporte pueden tomar tickets, asignarlos, cambiar su prioridad y resolverlos. Los administradores pueden gestionar usuarios y acceder a todos los tickets.

La interfaz debe estar en español y usar ejemplos realistas. No agregues funciones que no estén descritas en este documento sin justificar primero por qué son necesarias.

## 2. Stack tecnológico

Usá estas tecnologías:

- **Frontend:** React + Vite + TypeScript.
- **Estilos:** CSS propio, organizado y responsive. Evitá depender de una plantilla visual genérica.
- **Backend:** Node.js + Express + TypeScript.
- **Base de datos:** SQLite.
- **Comunicación:** API REST con JSON.
- **Validación:** validar los datos tanto en el frontend como en el backend. No confiar en los tipos de TypeScript para validar respuestas de red.
- **Persistencia:** los tickets, usuarios, comentarios y cambios deben guardarse en SQLite. No usar `useState` como almacenamiento permanente.

Si el repositorio ya contiene una estructura o tecnologías definidas, primero inspeccionalas y adaptá la solución sin reemplazarlas innecesariamente.

## 3. Diseño visual: evitar el aspecto típico de una página hecha por IA

Quiero una interfaz con identidad propia, sobria y funcional. No uses el diseño repetido de landing pages generadas por IA.

### Dirección visual

- Estética de herramienta de trabajo: clara, editorial y ligeramente técnica.
- Fondo general gris cálido muy claro, superficies blancas y texto casi negro.
- Un único color de acento —azul petróleo o verde oscuro— para acciones principales y estados seleccionados.
- Bordes finos, separadores discretos y sombras mínimas.
- Tipografía sans-serif legible. Podés combinar una tipografía monoespaciada únicamente para IDs, fechas o etiquetas técnicas.
- Jerarquía basada en tamaños, pesos y espacios; no en tarjetas enormes.
- Iconos simples y consistentes. No usar emojis como iconos de interfaz.
- Evitar gradientes decorativos, glassmorphism, fondos con brillos, blobs, efectos innecesarios, tarjetas flotantes por todas partes y títulos gigantes.
- No colocar una sección hero de marketing: es una aplicación de gestión, no una página publicitaria.
- Usar animaciones breves solamente cuando ayuden a entender una acción.

### Estructura visual

En escritorio:
- Barra lateral izquierda compacta con el nombre del producto y navegación.
- Encabezado superior con título de la sección, búsqueda y menú del usuario.
- Área principal con contenido alineado y aprovechamiento del espacio.
- Listados en tablas o filas compactas, no en una grilla de tarjetas gigantes.

En móvil:
- Navegación adaptable.
- Tabla convertida en filas legibles o listado compacto.
- Formularios de ancho completo.
- Acciones principales accesibles sin desplazamientos horizontales.

### Pantallas necesarias

1. **Inicio / Panel:** resumen de tickets abiertos, pendientes, en progreso y resueltos; actividad reciente y tickets asignados al usuario.
2. **Todos los tickets:** listado con búsqueda, filtros, orden y paginación.
3. **Mis tickets:** tickets creados por el usuario actual.
4. **Detalle del ticket:** información completa, historial, comentarios y acciones permitidas.
5. **Crear ticket:** formulario breve y claro.
6. **Administración de usuarios:** visible solamente para administradores.

No hace falta una landing page pública. La aplicación debe abrir directamente en el acceso o en el panel si ya existe una sesión válida.

## 4. Usuarios y permisos

Implementá tres roles:

### Usuario
- Crear tickets.
- Ver los tickets que creó.
- Agregar comentarios a sus tickets.
- Consultar el estado y el historial.
- No puede asignar tickets a otras personas ni cambiar permisos.

### Agente
- Ver todos los tickets.
- Tomar un ticket o asignarlo a un agente.
- Cambiar estado y prioridad.
- Agregar comentarios internos o respuestas visibles para el usuario.
- No puede administrar usuarios ni cambiar roles.

### Administrador
- Acceso a todas las funciones.
- Crear, editar y desactivar usuarios.
- Cambiar roles.
- Consultar y gestionar todos los tickets.

**Importante:** ocultar botones en el frontend no es suficiente. El backend debe comprobar el rol y los permisos en cada ruta protegida.

## 5. Funcionalidades de tickets

Cada ticket debe tener:

- ID único y legible, por ejemplo `TCK-0001`.
- Título.
- Descripción.
- Categoría: `Consulta`, `Problema técnico`, `Acceso` u `Otro`.
- Prioridad: `Baja`, `Media`, `Alta` o `Urgente`.
- Estado: `Abierto`, `En progreso`, `En espera` o `Resuelto`.
- Usuario que lo creó.
- Agente asignado, opcional.
- Fecha de creación.
- Fecha de última actualización.

### Acciones

- Crear un ticket.
- Consultar el detalle.
- Editar título, descripción y categoría cuando corresponda.
- Cambiar prioridad y estado según permisos.
- Asignar o quitar un agente.
- Agregar comentarios.
- Consultar el historial de cambios.
- Buscar por ID o palabras del título.
- Filtrar por estado, prioridad, categoría y agente.
- Ordenar por fecha de creación o actualización.
- Paginar resultados.

Al resolver un ticket, guardar la fecha de resolución. Si vuelve a abrirse, conservar el historial y registrar el cambio.

### Comentarios

Cada comentario debe incluir autor, fecha, contenido y tipo:
- **Respuesta pública:** visible para quien creó el ticket.
- **Nota interna:** visible solamente para agentes y administradores.

El backend debe impedir que un usuario común consulte notas internas.

## 6. Notificaciones por eventos

Implementá notificaciones dentro de la aplicación para eventos importantes:

- Cuando se crea un ticket.
- Cuando se asigna un agente.
- Cuando cambia el estado.
- Cuando se agrega una respuesta pública.

Una asignación de prioridad urgente debe generar la notificación inmediatamente después del evento de asignación; no debe depender de una tarea programada diaria.

No hace falta integrar correo electrónico ni servicios externos en esta primera versión. Las notificaciones internas deben persistirse en la base de datos y poder marcarse como leídas.

## 7. Modelo de datos inicial

Diseñá las migraciones SQL necesarias. Como mínimo, contemplá estas entidades:

### users
- `id`
- `name`
- `email` (único)
- `password_hash`
- `role`
- `active`
- `created_at`

### tickets
- `id`
- `code` (único y legible)
- `title`
- `description`
- `category`
- `priority`
- `status`
- `created_by`
- `assigned_to` (nullable)
- `created_at`
- `updated_at`
- `resolved_at` (nullable)

### comments
- `id`
- `ticket_id`
- `author_id`
- `content`
- `visibility` (`public` o `internal`)
- `created_at`

### ticket_events
- `id`
- `ticket_id`
- `actor_id`
- `event_type`
- `old_value` (nullable)
- `new_value` (nullable)
- `created_at`

### notifications
- `id`
- `user_id`
- `ticket_id` (nullable)
- `message`
- `read_at` (nullable)
- `created_at`

Usá claves foráneas, restricciones y los índices que sean útiles. Guardá las fechas de forma consistente, preferentemente en UTC, y convertílas a la hora local al mostrarlas.

## 8. Backend y API

Organizá el backend en capas simples:

- `routes`: definición de rutas.
- `controllers`: recepción de solicitudes y respuestas HTTP.
- `services`: reglas de negocio y permisos.
- `repositories`: consultas a SQLite.
- `middleware`: autenticación, autorización y manejo de errores.
- `database`: conexión y migraciones.

Endpoints orientativos:

| Método | Ruta | Función |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/tickets` | Listar tickets con filtros y paginación |
| POST | `/api/tickets` | Crear ticket |
| GET | `/api/tickets/:id` | Obtener detalle |
| PATCH | `/api/tickets/:id` | Modificar campos permitidos |
| POST | `/api/tickets/:id/assign` | Asignar agente |
| POST | `/api/tickets/:id/comments` | Agregar comentario |
| GET | `/api/notifications` | Listar notificaciones |
| PATCH | `/api/notifications/:id/read` | Marcar como leída |
| GET | `/api/users` | Listar usuarios (administrador) |
| POST | `/api/users` | Crear usuario (administrador) |
| PATCH | `/api/users/:id` | Modificar usuario (administrador) |

Podés ajustar los endpoints si existe una razón técnica clara, pero documentá cualquier cambio.

### Requisitos técnicos

- Usar consultas parametrizadas.
- No concatenar datos del usuario directamente en SQL.
- No devolver `password_hash` ni información sensible.
- Validar entradas y devolver errores HTTP apropiados.
- Usar `401` cuando no hay autenticación válida y `403` cuando el usuario está autenticado pero no tiene permiso.
- Configurar CORS para el origen del frontend mediante variables de entorno.
- No guardar secretos en el repositorio.
- No devolver errores internos ni trazas al cliente.
- Definir tipos TypeScript para las entidades y respuestas.
- Recordar que JSON transporta las fechas como texto: parsearlas y validarlas en los límites de la aplicación.

Para autenticación, usá contraseñas con hash seguro y una estrategia de sesión adecuada. No guardes contraseñas en texto plano. Documentá cómo crear el primer administrador sin dejar una contraseña fija en producción.

## 9. Frontend y comportamiento

- Formularios con validación y mensajes claros.
- Estados de carga, error, vacío y éxito.
- Confirmación antes de acciones destructivas.
- Actualización de datos luego de crear, editar, asignar o resolver un ticket.
- No mostrar información que el rol actual no puede consultar.
- Manejar correctamente errores de red y sesiones vencidas.
- No simular persistencia con datos que desaparecen al refrescar.
- No usar datos de ejemplo como si fueran datos reales. Si agregás datos de demostración, incluir un seed claramente identificado.

## 10. Seguridad y calidad

- Autenticación real.
- Autorización en el backend.
- Validación de datos en servidor.
- Consultas parametrizadas.
- Protección de datos privados.
- Variables de entorno para configuración.
- Manejo centralizado de errores.
- Migraciones reproducibles.
- No incluir `.env`, `node_modules/` ni `dist/` en el repositorio.
- Incluir `.env.example` sin secretos.
- Incluir `package-lock.json` y migraciones.
- Documentar la instalación y ejecución.

## 11. Pruebas obligatorias

Creá pruebas para los casos principales:

1. Un usuario puede crear un ticket.
2. Un usuario no puede consultar tickets privados de otra persona.
3. Un usuario no puede agregar notas internas ni leerlas.
4. Un agente puede asignarse un ticket y cambiar su estado.
5. Un usuario común no puede acceder a rutas de administración.
6. Un usuario autenticado sin rol administrador recibe `403` al intentar administrar usuarios.
7. Una solicitud sin sesión válida recibe `401`.
8. Los filtros y la paginación funcionan.
9. Una notificación se crea al asignar un ticket urgente.
10. Los datos siguen presentes después de reiniciar el backend y refrescar el frontend.

No afirmes que una prueba pasó si no la ejecutaste. Mostrá el comando usado y el resultado real.

## 12. Organización y documentación del proyecto

Entregá como mínimo:

- `frontend/`
- `backend/`
- `docs/spec.md`
- `AGENTS.md`
- `.cursor/rules/` con reglas breves y útiles para el proyecto.
- `.env.example`
- `package-lock.json` (o los lockfiles correspondientes si hay más de un paquete).
- Migraciones de base de datos.
- `README.md` con instalación, configuración, ejecución y pruebas.

En `docs/spec.md` documentá:
- Objetivo del producto.
- Tipos de usuario y permisos.
- Funcionalidades.
- Reglas de negocio.
- Modelo de datos.
- Endpoints.
- Decisiones técnicas.
- Casos que todavía no estén definidos.

En `AGENTS.md` explicá la estructura del proyecto, comandos, convenciones y restricciones importantes para futuros agentes.

## 13. Forma de trabajo: desarrollo guiado por spec

Seguí este orden y no lo saltees:

1. **Inspeccionar:** revisar el repositorio y detectar qué existe.
2. **Spec:** escribir o actualizar `docs/spec.md`. Señalar las decisiones ambiguas en forma de preguntas, sin inventar reglas importantes.
3. **Plan:** proponer una arquitectura simple y un plan de implementación.
4. **Tareas:** dividir el trabajo en tareas pequeñas y verificables.
5. **Implementar:** avanzar por etapas, ejecutando las pruebas correspondientes.
6. **Revisar:** comprobar permisos, validaciones, errores, persistencia y funcionamiento visual.
7. **Documentar:** actualizar README y documentación según lo que realmente quedó implementado.

Si una decisión de negocio no está especificada y afecta el comportamiento, preguntame antes de implementarla. No resuelvas silenciosamente las dudas importantes.

## 14. Criterios de aceptación

El trabajo se considera funcional cuando:

- Se puede iniciar y cerrar sesión.
- Los tres roles tienen permisos diferentes y comprobados por el backend.
- Un usuario puede crear un ticket y verlo después de refrescar.
- Un agente puede tomarlo, asignarlo, comentar y resolverlo.
- Las notas internas no son visibles para usuarios comunes.
- Los filtros, la búsqueda y la paginación funcionan.
- Las notificaciones se generan por los eventos definidos.
- La información permanece guardada al reiniciar el servidor.
- La interfaz se adapta a escritorio y móvil.
- El proyecto se puede instalar y ejecutar siguiendo el README.
- Las pruebas principales se pueden ejecutar y sus resultados están documentados.

## 15. Indicaciones finales

Priorizá una aplicación completa y estable antes que una enorme cantidad de funciones.

No entregues solamente pantallas estáticas, botones decorativos ni datos falsos. Cada acción visible debe tener un comportamiento real.

No cambies el stack ni agregues servicios externos sin una razón concreta. No agregues chat en tiempo real, inteligencia artificial, pagos, integración con correo ni microservicios: quedan fuera del alcance.

Primero inspeccioná el proyecto y presentame la spec y el plan. Después implementá por etapas, manteniendo el diseño visual definido en este documento.
