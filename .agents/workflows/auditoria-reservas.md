---
description: Agente para validar la lógica de disponibilidad y reservas en availability.ts.
---

# 📅 Auditoría de Reservas y Disponibilidad

Este flujo se enfoca en la lógica de negocio más crítica: asegurar que las citas no se solapen y que se respeten los horarios y descansos.

## 1. Reglas de Colisión (checkStaffConflict)
Toda nueva reserva debe validar conflictos de tiempo.
- [ ] ¿La consulta de conflicto usa `startTime: { lt: endTime }` y `endTime: { gt: startTime }`? (Lógica de intersección).
- [ ] ¿Se excluye el ID de la cita actual en caso de edición (`excludeAppointmentId`)?
- [ ] ¿Se valida que la cita NO esté en estado `CANCELLED`?

## 2. Lógica de `getAvailableSlots`
- **Timezone**: El sistema usa `America/Costa_Rica`.
  - [ ] ¿Se usa `toCRDate(new Date())` para filtrar slots pasados hoy mismo?
- **Prioridad de Horarios**:
  1. `StaffTimeOff` (Vacaciones/Permisos - bloqueante).
  2. `StaffSchedule` (Horario personal + Breaks).
  3. `ShopSchedule` (Fallback si no hay horario personal).

## 3. Manejo de "Staff Auto"
- [ ] Cuando `staffId === "auto"`, ¿se verifica que AL MENOS UN miembro del staff esté disponible en el slot?
- [ ] ¿Se filtran correctamente solo los miembros con roles `STAFF` o `OWNER`?

## 4. Instrucciones para Antigravity
Al modificar `lib/availability.ts` o `app/schedule/actions.ts`:
1. Simula mentalmente un slot (ej: 09:00 - 09:30).
2. Verifica si hay un break en ese rango.
3. Verifica si hay un `TimeOff` aprobado.
4. Asegúrate de que `slotDuration` (usualmente 30m) se use para calcular el `slotEnd`.

> [!IMPORTANT]
> Nunca modifiques la lógica de fechas sin ejecutar una prueba de "Hoy" (Today) para evitar que se permitan reservas en el pasado.
