// src/database/seed.ts
import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { getDb } from './connection';
import { runMigrations } from './migrations';

async function seed() {
  runMigrations();
  const db = getDb();

  console.log('Seeding database with demo data...');

  // Clear existing demo data (in reverse dependency order)
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM ticket_events;
    DELETE FROM comments;
    DELETE FROM tickets;
    DELETE FROM users;
  `);

  // Create users
  const users = [
    { name: 'Administrador', email: 'admin@mesa.local', password: 'Admin123!', role: 'admin' },
    { name: 'Agente Soporte', email: 'agente@mesa.local', password: 'Agente123!', role: 'agent' },
    { name: 'Usuario Uno', email: 'usuario1@mesa.local', password: 'Usuario123!', role: 'user' },
    { name: 'Usuario Dos', email: 'usuario2@mesa.local', password: 'Usuario123!', role: 'user' },
  ];

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );

  const userIds: Record<string, number> = {};
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const result = insertUser.run(u.name, u.email, hash, u.role);
    userIds[u.email] = result.lastInsertRowid as number;
    console.log(`Created user: ${u.email} (${u.role})`);
  }

  const adminId = userIds['admin@mesa.local'];
  const agentId = userIds['agente@mesa.local'];
  const user1Id = userIds['usuario1@mesa.local'];
  const user2Id = userIds['usuario2@mesa.local'];

  // Create tickets
  const insertTicket = db.prepare(`
    INSERT INTO tickets (code, title, description, category, priority, status, created_by, assigned_to, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tickets = [
    {
      code: 'TCK-0001',
      title: 'No puedo acceder a mi cuenta',
      description: 'Intento iniciar sesión pero me dice contraseña incorrecta aunque la cambié ayer.',
      category: 'Acceso',
      priority: 'Alta',
      status: 'En progreso',
      created_by: user1Id,
      assigned_to: agentId,
      resolved_at: null,
    },
    {
      code: 'TCK-0002',
      title: 'Error en módulo de reportes',
      description: 'Al generar el reporte mensual, la aplicación muestra un error 500.',
      category: 'Problema técnico',
      priority: 'Urgente',
      status: 'Abierto',
      created_by: user2Id,
      assigned_to: null,
      resolved_at: null,
    },
    {
      code: 'TCK-0003',
      title: '¿Cómo exportar datos a Excel?',
      description: 'Necesito exportar la lista de clientes a un archivo Excel pero no encuentro la opción.',
      category: 'Consulta',
      priority: 'Baja',
      status: 'Resuelto',
      created_by: user1Id,
      assigned_to: agentId,
      resolved_at: "datetime('now')",
    },
    {
      code: 'TCK-0004',
      title: 'Solicitud de acceso a módulo de RRHH',
      description: 'Necesito acceso al módulo de Recursos Humanos para mi nuevo rol.',
      category: 'Acceso',
      priority: 'Media',
      status: 'En espera',
      created_by: user2Id,
      assigned_to: agentId,
      resolved_at: null,
    },
    {
      code: 'TCK-0005',
      title: 'La aplicación se cierra inesperadamente',
      description: 'Cuando abro más de 3 pestañas la app se cuelga y se cierra sola.',
      category: 'Problema técnico',
      priority: 'Alta',
      status: 'En progreso',
      created_by: user1Id,
      assigned_to: agentId,
      resolved_at: null,
    },
    {
      code: 'TCK-0006',
      title: 'Consulta sobre facturación',
      description: '¿Cuándo se genera la factura del mes de octubre?',
      category: 'Consulta',
      priority: 'Baja',
      status: 'Resuelto',
      created_by: user2Id,
      assigned_to: agentId,
      resolved_at: "datetime('now')",
    },
    {
      code: 'TCK-0007',
      title: 'Actualizar datos de empresa',
      description: 'Necesito actualizar la razón social y el CUIT de la empresa en el sistema.',
      category: 'Otro',
      priority: 'Media',
      status: 'Abierto',
      created_by: user1Id,
      assigned_to: null,
      resolved_at: null,
    },
  ];

  const ticketIds: number[] = [];
  for (const t of tickets) {
    const resolvedAt = t.resolved_at === "datetime('now')" ? new Date().toISOString() : t.resolved_at;
    const result = insertTicket.run(
      t.code, t.title, t.description, t.category, t.priority,
      t.status, t.created_by, t.assigned_to, resolvedAt
    );
    ticketIds.push(result.lastInsertRowid as number);
    console.log(`Created ticket: ${t.code} - ${t.title}`);
  }

  // Add some comments
  const insertComment = db.prepare(`
    INSERT INTO comments (ticket_id, author_id, content, visibility)
    VALUES (?, ?, ?, ?)
  `);

  const comments = [
    {
      ticket_id: ticketIds[0],
      author_id: agentId,
      content: 'Estamos investigando el problema. ¿Puede confirmar si usa autenticación de dos factores?',
      visibility: 'public',
    },
    {
      ticket_id: ticketIds[0],
      author_id: user1Id,
      content: 'No, no uso 2FA. El problema empezó ayer después de la actualización del sistema.',
      visibility: 'public',
    },
    {
      ticket_id: ticketIds[0],
      author_id: agentId,
      content: 'NOTA INTERNA: Parece ser un bug del último deploy. Revisar con el equipo de desarrollo.',
      visibility: 'internal',
    },
    {
      ticket_id: ticketIds[2],
      author_id: agentId,
      content: 'Puede exportar desde el menú Archivo → Exportar → Excel. ¿Le funcionó?',
      visibility: 'public',
    },
    {
      ticket_id: ticketIds[2],
      author_id: user1Id,
      content: '¡Perfecto, funcionó! Muchas gracias.',
      visibility: 'public',
    },
    {
      ticket_id: ticketIds[4],
      author_id: agentId,
      content: 'INTERNO: Posible memory leak en el navegador. Recomendar limpiar caché.',
      visibility: 'internal',
    },
    {
      ticket_id: ticketIds[4],
      author_id: agentId,
      content: 'Por favor intente limpiar el caché del navegador y reiniciar. Nos comenta si persiste.',
      visibility: 'public',
    },
  ];

  for (const c of comments) {
    insertComment.run(c.ticket_id, c.author_id, c.content, c.visibility);
  }
  console.log(`Created ${comments.length} comments`);

  // Add some events
  const insertEvent = db.prepare(`
    INSERT INTO ticket_events (ticket_id, actor_id, event_type, old_value, new_value)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertEvent.run(ticketIds[0], adminId, 'assigned', null, String(agentId));
  insertEvent.run(ticketIds[0], agentId, 'status_changed', 'Abierto', 'En progreso');
  insertEvent.run(ticketIds[2], agentId, 'status_changed', 'En progreso', 'Resuelto');
  insertEvent.run(ticketIds[5], agentId, 'status_changed', 'En progreso', 'Resuelto');

  // Add some notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, ticket_id, message)
    VALUES (?, ?, ?)
  `);

  insertNotification.run(agentId, ticketIds[0], `Se te asignó el ticket TCK-0001: No puedo acceder a mi cuenta`);
  insertNotification.run(user1Id, ticketIds[0], `Tu ticket TCK-0001 cambió de estado a "En progreso"`);
  insertNotification.run(adminId, ticketIds[1], `Nuevo ticket urgente: TCK-0002 - Error en módulo de reportes`);
  insertNotification.run(agentId, ticketIds[1], `Nuevo ticket urgente: TCK-0002 - Error en módulo de reportes`);

  console.log('\nSeed completed successfully!');
  console.log('\nDemo accounts:');
  console.log('  Admin:   admin@mesa.local    / Admin123!');
  console.log('  Agent:   agente@mesa.local   / Agente123!');
  console.log('  User 1:  usuario1@mesa.local / Usuario123!');
  console.log('  User 2:  usuario2@mesa.local / Usuario123!');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
