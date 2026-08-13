# Desarrollo local

## Requisitos

- Node.js 20.19 o posterior.
- npm 10 o posterior.
- Docker Desktop en ejecucion.

## Inicio

```powershell
npm.cmd install
npm.cmd run db:up
npm.cmd run db:migrate --workspace=@coordillera/api
npm.cmd run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- Base de datos: `localhost:5432`

La configuracion local de API esta en `apps/api/.env`. Nunca se deben versionar claves reales de produccion.

## Comandos frecuentes

| Comando | Uso |
| --- | --- |
| `npm.cmd run dev` | Inicia frontend y API. |
| `npm.cmd run build` | Compila ambos proyectos. |
| `npm.cmd run typecheck` | Comprueba tipos. |
| `npm.cmd run test --workspace=@coordillera/web` | Ejecuta pruebas unitarias del frontend. |
| `npm.cmd run db:up` | Inicia PostgreSQL. |
| `npm.cmd run db:down` | Detiene PostgreSQL. |
| `npm.cmd run db:generate --workspace=@coordillera/api` | Genera migracion tras editar el esquema. |
| `npm.cmd run db:migrate --workspace=@coordillera/api` | Aplica migraciones. |
| `npm.cmd run db:studio --workspace=@coordillera/api` | Abre Drizzle Studio. |

## Cambio de base de datos

1. Editar `apps/api/src/db/schema.ts`.
2. Ejecutar `db:generate`.
3. Revisar el SQL generado en `apps/api/drizzle/`.
4. Ejecutar `db:migrate` localmente.
5. Actualizar los documentos afectados y el registro de cambios.

## Pruebas visuales

Los MCP de Playwright y Chrome DevTools estan configurados globalmente para Codex. Reinicia Codex o abre una sesion nueva despues de configurarlos para que esten disponibles.

## Datos de demostracion

No se insertan productos de demostracion en PostgreSQL. Por eso el catalogo muestra su estado vacio hasta que se creen y publiquen productos desde la API administrativa.

