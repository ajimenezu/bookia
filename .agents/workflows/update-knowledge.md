---
description: Flujo para la actualización autónoma local del conocimiento del proyecto en la carpeta .agents/.
---

# Auto-Actualización de Conocimiento del Proyecto

Este flujo es invocado por el Agente (Antigravity) cada vez que se descubre una regla técnica o patrón de diseño relevante durante el desarrollo.

## Objetivo
Mantener la carpeta `.agents/` sincronizada con la realidad técnica del proyecto Bookia, asegurando que todos los desarrolladores y agentes compartan los mismos "aprendizajes".

## Paso 1: Diagnóstico de Nueva Regla
Cuando se detecta un error recurrente o una mejora arquitectónica (ej. "el shopId debe ser obligatorio en Zod"):
1.  **Identificar el archivo afectado** en `.agents/docs/` o `.agents/rules/`.
2.  **Redactar la actualización** de forma clara y con un ejemplo de código si aplica.

## Paso 2: Edición Local (Sin Push)
El agente actualiza el archivo localmente en el repositorio.
- **Importante**: No se realizarán commits ni pushes automáticos. Los cambios quedarán en el entorno local del desarrollador.

## Paso 3: Notificación al Usuario
Al finalizar la actualización, el agente debe reportar en el chat:
> *"He aprendido que [PUNTO DE APRENDIZAJE] era necesario para [RAZÓN] y he actualizado los documentos en `.agents/` localmente. Estos cambios quedarán listos para tu siguiente PR."*

---
> [!NOTE]
> Este proceso asegura que el repositorio "aprende" de forma continua sin intervenir en el flujo de trabajo manual de Git.
