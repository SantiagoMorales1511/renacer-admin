# Modelo de datos

Entidades principales (Prisma + PostgreSQL).

- **User**: id, name, email, passwordHash, role (ADMIN|ASSISTANT), canRegisterExpenses, canViewOtherDays, createdAt, updatedAt.
- **Group**: id, name, cohort, startDate, status (ACTIVE|PAUSED|FINISHED), notes, timestamps.
- **Student**: id, fullName, phone, email, document, groupId, status (ACTIVE|PAUSED|WITHDRAWN|FINISHED), enrolledAt, notes, timestamps.
- **Module**: id, number, name, description, baseValue, status (ACTIVE|INACTIVE), timestamps.
- **ClassSession**: id, groupId, moduleId, date, startTime, endTime, place, status (SCHEDULED|DONE|CANCELLED), notes, timestamps.
- **Attendance**: id, sessionId, studentId, status (PRESENT|ABSENT), observation, registeredById, timestamps.
- **Payment**: id, studentId, groupId, moduleId, sessionId?, amount, method (EFECTIVO|TRANSFERENCIA|TARJETA|NEQUI|DAVIPLATA|OTRO), paidAt, observation, receiptUrl?, registeredById, timestamps.
- **Expense**: id, date, category (SALON|ASISTENTE|PUBLICIDAD|MATERIALES|TRANSPORTE|REFRIGERIOS|OFICINA|OTRO), description, amount, groupId?, sessionId?, registeredById, timestamps.
- **AuditLog**: id, userId, action, entity, entityId, createdAt.

## Reglas

- Un estudiante pertenece a un grupo; un grupo tiene muchos estudiantes.
- Un grupo tiene muchas sesiones; cada sesión pertenece a un grupo y un módulo.
- Asistencia y pago son independientes.
- Pagos parciales permitidos.
- Saldo pendiente por estudiante y módulo = valor base del módulo menos suma de pagos de ese estudiante y módulo.
- Registros importantes guardan createdAt, updatedAt y registeredBy.
- Acciones sensibles se registran en audit_logs.
