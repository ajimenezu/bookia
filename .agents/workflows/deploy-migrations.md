---
description: Guía de despliegue y aplicación de migraciones de base de datos con Prisma y Vercel.
---

# Flujo de Despliegue y Migraciones

Este workflow automatiza la preparación del entorno de base de datos antes de un despliegue.

## 1. Generación del Cliente de Prisma
Antes de cualquier despliegue o prueba local, asegúrate de que el cliente esté sincronizado con el esquema actual.

// turbo
```bash
npx prisma generate
```

## 2. Aplicación de Migraciones (Producción)
Para aplicar cambios en la base de datos de Supabase sin perder datos (usando `db push` para prototipado rápido o `migrate deploy` para producción).

// turbo
```bash
npx prisma db push
```

## 3. Verificación de Despliegue
Si el despliegue en Vercel falla por errores de Prisma, este comando forzará la generación del cliente en el entorno de build.

// turbo
```bash
npm run build
```

---
> [!CAUTION]
> Nunca ejecutes `prisma db push` sin antes revisar el archivo `prisma/schema.prisma` para evitar la pérdida accidental de datos.
