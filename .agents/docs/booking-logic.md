# Lógica de Reservas y Snapshots Financieros

Este documento detalla cómo Bookia gestiona la integridad de los datos de las citas y la preservación de registros financieros.

## 1. Snapshots de Precio (`priceAtBooking`)
En un sistema donde los precios de los servicios pueden variar con el tiempo, es crítico preservar el precio acordado en el momento de la reserva.

- **Campo**: `priceAtBooking` en el modelo `Appointment`.
- **Lógica**: 
  - Se calcula como la suma de los precios de todos los servicios seleccionados al momento de crear (`createBooking`) o actualizar (`updateBooking`) la cita.
  - Este valor es inmutable a menos que un administrador modifique explícitamente los servicios de la cita.
- **Propósito**: Asegurar reportes financieros históricos precisos y evitar discrepancias si el dueño de la tienda cambia el precio de un servicio después de que fue reservado.

## 2. Cálculo de Duración y Fin de Cita
Las citas en Bookia pueden ser multi-servicio, lo que requiere un cálculo acumulativo del tiempo.

- **Duración Total**: Suma de las duraciones individuales de cada servicio vinculado.
- **Hora de Fin**: `startTime + totalDuration`.
- **Validación**: La lógica en `lib/availability.ts` utiliza este mismo cálculo para asegurar que exista un bloque de tiempo contiguo suficiente para completar todos los servicios.

## 3. Modelo Multi-Servicio vs. Legacy
El sistema ha evolucionado de un modelo de servicio único a uno múltiple.

| Característica | Campo Prisma | Nota |
| :--- | :--- | :--- |
| **Actual** | `services` | Relación many-to-many. Permite múltiples servicios por cita. |
| **Legacy** | `serviceId` | Mantenido por compatibilidad, usualmente apunta al primer servicio. |

## 4. Resolución de Conflictos
Antes de confirmar cualquier cambio, el sistema ejecuta `checkStaffConflict` para validar:
- Solapamiento de tiempos (`startTime < app.endTime && endTime > app.startTime`).
- Aislamiento por tienda (`shopId`).
- Exclusión de citas canceladas.

---
> [!NOTE]
> Todos los cálculos de tiempo se manejan en **minutos** y se convierten a milisegundos para operaciones con el objeto `Date` de JavaScript.
