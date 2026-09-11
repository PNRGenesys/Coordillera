# Cordillera

> La documentacion detallada esta en [docs/README.md](./docs/README.md).

Monorepo para e-commerce de ropa: frontend React/TypeScript, API Fastify y PostgreSQL.

## Requisitos

- Node.js 22.12 o superior (las pruebas no arrancan con versiones anteriores; ver [docs/development.md](./docs/development.md))
- npm 10 o superior
- Docker Desktop (para ejecutar PostgreSQL localmente)

## Inicio

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
npm.cmd run db:up
npm.cmd run db:migrate --workspace=@cordillera/api
npm.cmd run db:seed    --workspace=@cordillera/api
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- Estado de la API: `http://localhost:3000/api/health`

`apps/api/.env` es obligatorio: sin `DATABASE_URL` fallan las migraciones, el seed, el servidor y las pruebas. Sin ejecutar el seed el catalogo aparece vacio.

## Que incluye

- Catalogo con colecciones, categorias, productos, variantes de talla/color, SKU, precios, imagenes y guias de tallas.
- Inventario por variante con unidades disponibles, reservadas y punto de reposicion, mas un historial inmutable de movimientos.
- Carrito por sesion, checkout con reserva atomica de inventario y pedidos con copia inmutable de precio y SKU.
- Cuentas de cliente con registro e inicio de sesion (contrasenas con `scrypt`, sesion en cookie `httpOnly`).
- Panel de administracion en `/admin` para editar productos y precios, ajustar existencias y gestionar pedidos y envios.
- Interfaz y catalogo en espanol e ingles: los textos fijos viven en el frontend y las traducciones del catalogo en la base de datos.

Por decision de alcance no hay pasarela de pagos todavia: los pedidos se crean como `pending_payment`.

## Administracion

Las rutas `/api/admin/*` exigen la sesion de una cuenta con rol `admin`. El rol se otorga por linea de comandos sobre una cuenta ya registrada en la tienda:

```powershell
npm.cmd run admin:grant --workspace=@cordillera/api -- correo@ejemplo.com
```

## Comandos

```powershell
npm run dev         # frontend y API
npm run test        # pruebas de ambos proyectos (la API necesita PostgreSQL en ejecucion)
npm run typecheck   # comprobacion de tipos
npm run build       # compilacion de produccion
```

Reservas de inventario vencidas (programar cada pocos minutos en produccion):

```powershell
npm.cmd run inventory:release-expired --workspace=@cordillera/api
```

## Base de datos

El esquema es la fuente de verdad (`apps/api/src/db/schema.ts`) y las migraciones versionadas viven en `apps/api/drizzle/`. Para explorar datos localmente:

```powershell
npm.cmd run db:studio --workspace=@cordillera/api
```

## Grupo de contenedores

Ademas del flujo de desarrollo, todo el proyecto se puede levantar con Docker Compose (base de datos, API, frontend con nginx y el middleware de plano de control):

```powershell
docker compose up -d --build
docker compose run --rm api npm run db:seed   # datos de demo (una sola vez)
```

- Web: `http://localhost:8080`
- Middleware: `http://localhost:8000/health`
- API (a través del middleware): `http://localhost:8000/api/health`

Todo el tráfico `/api/*` pasa por el middleware, que lo reenvía a la API. La API ya no se publica al host (solo es accesible dentro de la red del grupo); el middleware es el único punto de entrada.

En desarrollo, `docker-compose.override.yml` (que Compose aplica automáticamente) reexpone la API en `http://localhost:3000` para poder depurarla directo (Postman, curl) sin pasar por el middleware. Para levantar el grupo tal como iría en producción, con la API cerrada, se usa solo el archivo base:

```powershell
docker compose -f docker-compose.yml up -d --build
```

La documentación OpenAPI (Swagger UI) está en `http://localhost:8000/api/docs` (a través del middleware) fuera de producción. En el contenedor de la API (`NODE_ENV=production`) se habilita con `ENABLE_API_DOCS=true`.

La API aplica las migraciones al arrancar; el seed es manual. El middleware (`apps/middleware`, FastAPI) es el plano de control y el punto de entrada de la futura pasarela MercadoPago; hoy solo expone `/health`.

## Estructura

```text
apps/
  web/         # React + Vite + Linaria + RTK Query (contenedor: nginx)
  api/         # Fastify + Drizzle + PostgreSQL
  middleware/  # FastAPI: plano de control y pasarela de pagos (MercadoPago)
docs/          # documentacion del proyecto
```
