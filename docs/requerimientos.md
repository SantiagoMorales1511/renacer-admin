# Requerimientos

Renacer Admin es una herramienta interna privada para organizar la operación del centro de formación Renacer.

## Funcionalidades

1. Login privado con JWT y redirección según rol.
2. Dashboard ADMIN con próxima clase, estudiantes activos, pagos pendientes, ingresos del día/mes, gastos del mes, utilidad estimada y resumen por grupo.
3. Inicio ASSISTANT operativo: próxima clase, clases de hoy, asistencia pendiente, pagos de hoy y caja del día.
4. Gestión de grupos (crear/editar/listar/detalle).
5. Gestión de estudiantes (crear/editar/listar/detalle con módulos, saldo, pagos y asistencia).
6. Módulos (11 iniciales).
7. Calendario y sesiones de clase.
8. Asistencia por sesión.
9. Pagos con métodos y pagos parciales.
10. Caja del día con desglose por método de pago.
11. Gastos por categoría.
12. Flujo de caja (solo ADMIN).
13. Reportes financieros básicos.
14. Tiempo real con Socket.IO.

## Alcance MVP

Login por rol, CRUD de grupos y estudiantes, programación de sesiones, asistencia, pagos, caja del día, gastos (admin), flujo de caja básico (admin) y actualizaciones en tiempo real.
