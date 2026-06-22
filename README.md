# Renacer Admin

Aplicación web administrativa privada para el centro de formación Renacer. Gestiona grupos, estudiantes, módulos, calendario de clases, asistencia, pagos, caja del día, gastos y flujo de caja.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: NestJS + TypeScript + Prisma
- Base de datos: PostgreSQL
- Auth: JWT (roles ADMIN y ASSISTANT)
- Tiempo real: Socket.IO

## Requisitos

- Node 20+

## Documentación

Ver carpeta `docs/`.

## Despliegue

- Frontend: Vercel (carpeta `frontend`)
- Backend: Railway (carpeta `backend`)
- Base de datos: PostgreSQL en Railway

### Backend (Railway)

Root Directory del servicio: `backend`.

Variables de entorno:

- `NODE_ENV` = `production`
- `DATABASE_URL` = URL del servicio Postgres de Railway
- `JWT_SECRET` = secreto largo y aleatorio (ej: `openssl rand -hex 32`). Obligatorio en producción.
- `JWT_EXPIRES_IN` = `7d` (opcional)
- `CORS_ORIGIN` = URL del frontend en Vercel (ej: `https://renacer-admin.vercel.app`). Acepta varias separadas por coma.
- `SEED_ADMIN_PASSWORD` y `SEED_ASSISTANT_PASSWORD` = contraseñas reales de los usuarios iniciales. **Obligatorias en Railway**: al arrancar el backend se crean o actualizan `renacer` (admin) y `clarena` (assistant) en PostgreSQL.

No definas `PORT`: Railway lo inyecta y el backend lo lee de `process.env.PORT`.

Comandos:

- Build: `npm run build` (genera el cliente Prisma en `postinstall` y compila a `dist/`)
- Start (con migraciones): `npm run start:migrate` (ejecuta `prisma migrate deploy` y luego `node dist/main`)
- Start (sin migrar): `npm run start:prod`
- Migraciones manuales: `npm run prisma:deploy`
- Seed inicial (opcional): `npm run seed`

### Frontend (Vercel)

Root Directory del proyecto: `frontend`.

Variables de entorno:

- `VITE_API_URL` = URL del backend con prefijo `/api` (ej: `https://TU-BACKEND.up.railway.app/api`)
- `VITE_SOCKET_URL` = URL base del backend sin `/api` (ej: `https://TU-BACKEND.up.railway.app`)

Comandos:

- Build: `npm run build`
- Output: `dist`

### Orden sugerido

1. Crear PostgreSQL en Railway y copiar su `DATABASE_URL`.
2. Crear el servicio backend en Railway (root `backend`), pegar variables, usar `npm run start:migrate` como start command. Tomar su URL pública.
3. Crear el proyecto frontend en Vercel (root `frontend`), pegar `VITE_API_URL` y `VITE_SOCKET_URL` con la URL del backend.
4. Poner la URL de Vercel en `CORS_ORIGIN` del backend y redeploy.
5. Redeploy del backend. En cada arranque se sincronizan los usuarios en PostgreSQL (no hace falta correr el seed a mano si `SEED_*` están definidas).
