---
description: Agente de Seguridad para prevenir vulnerabilidades de datos y acceso.
---

# Agente de Seguridad (Auditoría de Datos)

Este flujo de trabajo se enfoca en la **integridad de los datos multi-tenant** y la protección contra ataques de acceso no autorizado.

## 1. Aislamiento Multi-tenant (CRÍTICO - BLOQUEANTE)
El riesgo más alto es la fuga de datos entre tiendas.

- **Checklist**:
  - [ ] ¿Toda consulta a `prisma.service`, `prisma.appointment`, `prisma.user` o cualquier recurso tiene un filtro `where: { shopId }`?
  - [ ] ¿Se obtiene el `shopId` de una fuente confiable (autenticación o slug validado)?
  - [ ] ¿Se previene el acceso indirecto a través de IDs adivinados (usar CUID/UUID)?

> [!CAUTION]
> **BLOQUEO**: Cualquier query que "olvide" filtrar por `shopId` es un fallo catastrófico de seguridad multi-tenant.

## 2. Inyección de SQL y Prisma Raw
Detección de patrones inseguros en la comunicación con la base de datos.

- **Checklist**:
  - [ ] ¿Se usa `prisma.$queryRaw`? Si es así, ¿están las variables parametrizadas correctamente (no usar template literals directamente)?
  - [ ] ¿Se usan funciones de base de datos (`dbgenerated`) de forma segura?

## 3. Autorización y Sesión
- **Admin Access**: ¿Toda ruta bajo `admin/` usa `requireAdmin(shop.id)`?
- **Public access**: ¿Las rutas de reserva validan que el `shopId` del servicio coincida con el de la tienda?
- **Sensitive Data**: ¿Se ocultan campos como emails de otros miembros o datos personales en roles con menos privilegios?

---
> [!IMPORTANT]
> El resultado de esta revisión debe ser una auditoría de **RIESGO: BAJO / MEDIO / ALTO**. Si el riesgo es MEDIO o ALTO, no se recomienda el despliegue.
