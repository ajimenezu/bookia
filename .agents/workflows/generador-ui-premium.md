---
description: Agente para generar componentes UI premium siguiendo el diseño de Bookia.
---

# ✨ Generador de UI Premium

Este flujo asegura que cada nuevo componente visual mantenga la estética "State of the Art" de Bookia, utilizando Tailwind 4, Lucide y Micro-animaciones.

## 1. Fundamentos de Diseño (Tokens)
- **Colores**: Usa variables `oklch` (ej: `text-foreground`, `bg-primary`).
- **Bordes**: Radio estándar de `0.625rem` (`rounded-lg`).
- **Efectos**: Prioriza el uso de Glassmorphism para paneles laterales y tarjetas flotantes.
  - Clase: `.glass-card` (bg-background/50 + backdrop-blur-md).

## 2. Interactividad y Animaciones
- **Hover**: Todo elemento interactivo debe tener un estado hover suave (ej: `hover:bg-accent/50 transition-colors`).
- **Animate CSS**: Usa `tw-animate-css` para entradas de componentes.
  - Ejemplo: `animate-in fade-in zoom-in duration-300`.

## 3. Iconografía y Tipografía
- **Icons**: Usa `lucide-react`. Grosor recomendado: `strokeWidth={1.5}`.
- **Fuentes**: La fuente principal es `Geist`. Usa `font-sans` para legibilidad y `font-mono` para IDs o códigos.

## 4. Instrucciones para Antigravity
Al crear un archivo en `components/`:
1. **Importaciones**: Asegúrate de importar `lucide-react` y los componentes de Radix necesarios.
2. **Estructura**: Usa `cn()` para combinar clases de Tailwind dinámicamente.
3. **Responsividad**: Diseña primero para móvil (`flex-col`) y escala a desktop (`md:flex-row`).
4. **Accesibilidad**: Todo botón debe tener un `aria-label` descriptivo si solo contiene un icono.

> [!TIP]
> Para modales y diálogos, usa siempre `Vaul` (drawer móvil) o `Radix Dialog` con el fondo `backdrop-blur` configurado en `globals.css`.
