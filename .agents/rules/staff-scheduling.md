# Reglas de Agendamiento de Personal

Las siguientes reglas y patrones de diseño son obligatorios para el sistema de agendamiento y disponibilidad de Bookia.

## Gestión de Horarios y Disponibilidad
1. **Multi-tenancy Estricto**: Todas las consultas a `StaffSchedule` y `StaffTimeOff` DEBEN estar filtradas por `shopId` y `staffId`.
2. **Flujo de Aprobación**:
   - Los cambios realizados por el `STAFF` se guardan con estado `PENDING`.
   - Los cambios realizados por `OWNER` o `SUPER_ADMIN` se guardan con estado `APPROVED`.
   - El motor de disponibilidad (`lib/availability.ts`) SOLAMENTE debe considerar horarios con estado `APPROVED`.
3. **Múltiples Descansos**: Un horario diario (`StaffSchedule`) permite múltiples descansos (`StaffBreak`). Al generar slots, cualquier hora que coincida con un descanso debe ser excluida.
4. **Fallback a Horario de Tienda**: Si un miembro del equipo no tiene un horario aprobado para un día específico, el sistema debe revertir automáticamente al horario general de la tienda (`ShopSchedule`).

## Notificaciones de Propietario
1. **Icono de Campana**: El panel de administración muestra un contador de solicitudes pendientes en la barra lateral.
2. **Acción de Procesamiento**: Solo los roles con privilegios pueden ejecutar `processRequest` para aprobar o rechazar cambios.

---
> [!TIP]
> Al actualizar la disponibilidad en el frontend, usa `revalidatePath` para asegurar que los slots se recalculen inmediatamente después de una aprobación.
