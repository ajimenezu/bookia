# Database Safety Rules

Completamente prohibido reiniciar la base de datos o borrar datos sin preguntar explícitamente al usuario.

## Reglas Críticas
1. **No usar `--force-reset`**: Nunca ejecutar `npx prisma db push --force-reset` o similares sin aprobación previa del usuario.
2. **Consultas de Escritura**: No ejecutar scripts que realicen borrados masivos (`deleteMany({})`) sin confirmar.
3. **Migraciones**: Seguir siempre el proceso de despliegue controlado de migraciones si el entorno es de producción o compartido.

---
> [!IMPORTANT]
> La integridad de los datos es la prioridad #1. Siempre que se necesite una limpieza de DB para sincronizar esquemas, se debe proponer primero al usuario.
