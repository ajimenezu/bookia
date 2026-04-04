# Sistema de Diseño y Personalización de Tienda

Bookia utiliza un sistema de diseño premium basado en **Tailwind CSS**, **shadcn/ui** y variables de color en formato **OKLCH**.

## 1. El Color OKLCH
A diferencia de RGB o HSL, OKLCH permite manipular la luminosidad de forma uniforme, lo que es clave para temas dinámicos.

```css
:root {
  --primary: oklch(0.78 0.12 75); /* Perceptualmente uniforme */
}
```

## 2. Tematización Dinámica
Cada tienda puede tener su propio set de tokens personalizados:
1.  **Check Shop Tokens**: Se verifica si existen tokens específicos para el `slug` de la tienda en `CUSTOM_BUSINESS_TOKENS`.
2.  **Fallback**: Si no existen, se utilizan los tokens por defecto definidos para el `BusinessType`.
3.  **Implementación**: Esta lógica reside en `getBusinessTokens` de `lib/tokens.ts` y se aplica vía `BusinessThemeProvider`.

El `businessType` influye en la iconografía y el estilo base, pero los tokens de color (`--primary`, `--accent`, etc.) pueden ser totalmente únicos por tienda.

## 3. Disposición y Skeletons
- **Mobile First**: Todos los componentes deben diseñarse pensando primero en dispositivos móviles y luego escalar a desktop.
- **Loading Pattern**: Cada `page.tsx` debe tener un `loading.tsx` que replique exactamente su estructura visual usando Skeletons. **Si el page cambia, el loading debe cambiar simultáneamente**.
- `--background`: Color de fondo principal.
- `--foreground`: Color de texto general.
- `--primary`: Color de marca (botones, links destacados).
- `--card`: Fondo de tarjetas con ligero desenfoque.

## 4. Mejores Prácticas
1. **Evitar Colores Genéricos**: No usar `text-red-500` o `bg-blue-200`. Usar siempre los tokens funcionales como `text-destructive` o `bg-primary`.
2. **Animaciones**: Usar micro-animaciones para mejorar la interacción del usuario.
3. **Consistencia Premium**: Mantener el estilo de bordes redondeados (`--radius`) y sombras sutiles.

---
> [!TIP]
> Al crear componentes nuevos, siempre revisa que funcionen correctamente tanto en modo claro como oscuro usando las variables del sistema.
