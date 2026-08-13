# Arquitectura

## Objetivo

Coordillera es una tienda de ropa en un monorepo. La base actual cubre catalogo, inventario, carrito y pedidos sin pasarela de pagos.

## Componentes

```text
Browser
  -> React + TypeScript + Vite (apps/web, puerto 5173)
  -> Fastify + TypeScript (apps/api, puerto 3000)
  -> PostgreSQL 17 (Docker, puerto 5432)
```

- `apps/web`: interfaz React compilada por Vite. Redux Toolkit administra estado de interfaz y RTK Query consulta la API. En desarrollo, Vite redirige `/api` a la API.
- `apps/api`: servicio HTTP Fastify. Valida entradas con Zod, expone rutas y usa Drizzle ORM.
- `apps/api/src/db/schema.ts`: esquema de datos como fuente de verdad.
- `apps/api/drizzle`: migraciones SQL generadas desde el esquema.
- `docker-compose.yml`: PostgreSQL para desarrollo local.

## Datos principales

| Area | Entidades |
| --- | --- |
| Catalogo | colecciones, categorias (con guia de talla), productos, variantes, imagenes, guias de talla |
| Inventario | items, movimientos, reservas, solicitudes de reposicion |
| Venta | clientes, carritos, lineas de carrito, pedidos, lineas de pedido |

Los importes se almacenan como enteros en centavos (`priceCents`) para evitar errores de precision. La moneda inicial es COP.

## Estados

- Producto: `draft`, `active`, `archived`.
- Pedido: `pending_payment`, `paid`, `processing`, `fulfilled`, `shipped`, `delivered`, `cancelled`, `refunded`.

Los pedidos se crean como `pending_payment`. La integracion de pagos no forma parte del alcance actual.

## Seguridad actual y pendientes

Las rutas `/api/admin/*` requieren el encabezado `x-admin-key`, con valor igual a `ADMIN_API_KEY`. Esta proteccion es temporal para desarrollo.

Antes de produccion se implementaran autenticacion, roles administrativos, gestion segura de secretos, limitacion de tasa, observabilidad, copias de seguridad y almacenamiento de imagenes externo.

## Frontend

- Linaria es el sistema obligatorio de estilos. No se agregan hojas CSS nuevas; los tokens de color/tipografia viven en variables CSS globales (`src/components/theme.ts`). La extraccion la hace `@wyw-in-js/vite` (el motor de Linaria 8); el plugin antiguo `@linaria/vite` no sirve con esta version.
- RTK Query (`src/store/catalog-api.ts`) es la unica capa para datos remotos; sus consultas y mutaciones generan hooks tipados y administran la cache (`Catalog` y `Cart` como tags de invalidacion).
- Redux mantiene solo estado de cliente que no pertenece al servidor: el `sessionId` del carrito (`src/store/cart-slice.ts`) y el idioma de interfaz (`src/store/ui-slice.ts`). El conteo del carrito sale siempre de `getCart`, nunca duplicado en el store.
- `react-router-dom` define las paginas (`src/pages/`): inicio, catalogo con filtros, detalle de producto, carrito, checkout y 404, todas dentro de un `Layout` compartido (`src/components/Layout.tsx`).
- Idioma: la interfaz es en español por defecto, con un selector ES/EN que traduce toda la copia estatica (`src/lib/translations.ts` + `src/lib/use-translation.ts`). La moneda de la tienda es COP y no cambia con el idioma; solo cambia el formato numerico (`es-CO` / `en-US`).
- Los assets genericos se almacenan localmente en `apps/web/src/assets/` y son reemplazables cuando exista fotografia de producto.


## Pruebas

- Frontend (`apps/web`): Vitest con `jsdom` y Testing Library. Cubre logica pura (`lib/`), reductores/selectores del store y render de componentes.
- API (`apps/api`): Vitest en entorno `node`, pruebas de integracion que levantan la aplicacion Fastify con `app.inject()` y golpean la base de datos local. Crean sus propios datos con SKU y slug de prueba y los eliminan al terminar, para no contaminar el catalogo. Corren en serie porque comparten una sola base.
