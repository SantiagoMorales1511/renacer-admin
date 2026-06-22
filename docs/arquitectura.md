# Arquitectura

Monorepo con frontend y backend separados.

```
renacer-admin/
  backend/    NestJS + Prisma + PostgreSQL
  frontend/   React + Vite + Tailwind
  docs/
  docker-compose.yml
```

## Backend

- API REST por dominio: `/auth /users /groups /students /modules /sessions /attendance /payments /expenses /reports /daily-cash`.
- Prisma como ORM y migraciones.
- Auth JWT con `JwtAuthGuard`, `RolesGuard` y decoradores `@Roles` / `@Permissions`.
- Socket.IO (`EventsGateway`) para tiempo real.
- Interceptor de auditoría para acciones sensibles.

## Frontend

- React Router con rutas protegidas por rol.
- TanStack Query para datos, Axios para HTTP, Zustand para auth y tema.
- `socket.io-client` + hook `useRealtime` que invalida queries ante eventos.
- Tailwind con paleta Renacer y modo claro/oscuro.

## Tiempo real

Cada mutación relevante emite un evento (`payment_created`, `attendance_updated`, `student_created`, `group_created`, `expense_created`, `session_updated`). El frontend escucha e invalida las queries afectadas.

## Deploy

- Frontend en Vercel.
- Backend en Render o Railway.
- PostgreSQL en Render, Railway o Supabase.
