# Roles y permisos

## ADMIN

Acceso total: dashboard completo, CRUD de grupos/estudiantes/módulos, programación de clases, asistencia, pagos, gastos, caja del día, ingresos del mes y año, flujo de caja, reportes financieros, creación de usuarios y cambio de roles/permisos.

## ASSISTANT

Operación diaria:

- Inicio operativo y calendario.
- Crear y editar grupos.
- Crear y editar estudiantes; asignarlos a grupos.
- Ver sesiones, registrar asistencia.
- Registrar pagos y observaciones/comprobantes.
- Ver caja del día (solo día actual) con ingresos separados por método.

No puede:

- Ver ingresos mensuales/anuales ni utilidad total.
- Ver flujo de caja completo ni reportes avanzados.
- Eliminar pagos, estudiantes o grupos.
- Crear administradores ni cambiar permisos.

## Permisos granulares (ASSISTANT)

- `canRegisterExpenses`: habilita registrar gastos.
- `canViewOtherDays`: habilita filtrar caja del día por rango de fechas.

El backend valida siempre rol y permisos; el frontend solo oculta UI.
