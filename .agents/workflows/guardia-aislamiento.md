---
description: Agente para asegurar el aislamiento de datos entre tiendas (ShopId).
---

# 🛡️ Guardia de Aislamiento (Multi-tenant)

Este flujo asegura que cada consulta a la base de datos esté correctamente aislada por `shopId`. En un sistema multi-tenant, olvidar este filtro es un fallo crítico de seguridad.

## 1. Validación de Consultas Prisma
Cada vez que se interactúe con modelos que pertenecen a una tienda, se debe verificar la presencia del filtro.

- **Checklist de Modelos Críticos**:
  - [ ] `Service`
  - [ ] `Appointment`
  - [ ] `ShopMember`
  - [ ] `StaffSchedule` (y `breaks`)
  - [ ] `ShopSchedule`
  - [ ] `StaffTimeOff`

- **Patrón Seguro**:
  ```typescript
  prisma.appointment.findMany({
    where: { shopId, ... } // shopId DEBE estar presente
  })
  ```

## 2. Origen del `shopId`
No basta con filtrar, hay que asegurar que el `shopId` no sea manipulable por el cliente.

- [ ] ¿El `shopId` proviene de una sesión validada (`auth()`) o de un `slug` verificado contra la base de datos?
- [ ] Si el `shopId` viene de una Server Action, ¿se ha validado que el usuario actual pertenece a esa tienda?

## 3. Instrucciones para Antigravity
Al ejecutar este flujo:
1. Escanea el archivo en busca de llamadas a `prisma.[modelo]`.
2. Verifica si el objeto `where` incluye una propiedad `shopId`.
3. Si falta, marca el archivo como **RIESGO CRÍTICO** y propón la corrección inmediata.

> [!CAUTION]
> NUNCA asumas que un objeto de configuración global ya incluye el `shopId`. Siempre debe ser explícito en la consulta.
