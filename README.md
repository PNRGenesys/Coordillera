# Coordillera

> La documentacion detallada esta en [docs/README.md](./docs/README.md).

Monorepo para e-commerce de ropa: frontend React/TypeScript, API Fastify y PostgreSQL.

## Requisitos

- Node.js 20.19 o superior
- npm 10 o superior
- Docker Desktop (para ejecutar PostgreSQL localmente)

## Inicio

```powershell
npm install
npm.cmd run db:up
npm.cmd run db:migrate --workspace=@coordillera/api
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- Estado de la API: `http://localhost:3000/api/health`

La configuración de desarrollo de la API se encuentra en `apps/api/.env`. Antes de publicar, reemplaza `ADMIN_API_KEY` y usa una URL de PostgreSQL administrada.

## Dominio de tienda

- Catálogo con productos, variantes de talla/color, SKU, precios e imágenes.
- Inventario por variante con cantidad disponible, reservada y punto de reposición.
- Historial inmutable de movimientos: ingreso, ajuste, reserva, liberación, venta y devolución.
- Carrito basado en sesión, cliente, direcciones y pedidos con una copia inmutable del precio/SKU.
- Reserva atómica de inventario al crear el pedido. Las reservas vencen a los 20 minutos y pueden liberarse con `npm.cmd run inventory:release-expired --workspace=@coordillera/api` (prográmalo cada pocos minutos en producción).
- Rutas administrativas protegidas por el encabezado `x-admin-key`. La autenticación completa de usuarios y el panel administrativo visual se construirán antes del lanzamiento.

Por decisión de alcance, no hay pasarela de pagos todavía: los pedidos se crean como `pending_payment`.

## Base de datos

```powershell
docker compose up -d
npm.cmd run db:migrate --workspace=@coordillera/api
```

La migración versionada está en `apps/api/drizzle/`. Para explorar datos localmente:

```powershell
npm.cmd run db:studio --workspace=@coordillera/api
```

## Estructura

```text
apps/
  web/  # React + Vite
  api/  # Fastify + Drizzle + PostgreSQL
```
