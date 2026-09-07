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
| Venta | clientes, sesiones de cliente, carritos, lineas de carrito, pedidos, lineas de pedido |

Los importes se almacenan como enteros en centavos (`priceCents`) para evitar errores de precision. La moneda inicial es COP.

## Estados

- Producto: `draft`, `active`, `archived`.
- Pedido: `pending_payment`, `paid`, `processing`, `fulfilled`, `shipped`, `delivered`, `cancelled`, `refunded`.

Los pedidos se crean como `pending_payment`. La integracion de pagos no forma parte del alcance actual.

## Cuentas de cliente

Un cliente puede comprar como invitado o con cuenta. La cuenta vive en la misma tabla `customers` que usa el checkout: `password_hash` queda vacio para los clientes creados por una compra de invitado, y registrarse con ese correo reclama la fila en vez de duplicarla.

- Contrasenas con `scrypt` de `node:crypto` (`src/auth/password.ts`), sal por contrasena, comparacion en tiempo constante. No se agrego ninguna dependencia de cifrado.
- La sesion es un token aleatorio guardado en `customer_sessions`; la base solo almacena su hash SHA-256, asi que un volcado de la base no permite suplantar a nadie.
- El token viaja en la cookie `coordillera_session` (`httpOnly`, `sameSite=lax`, `secure` en produccion), no en `localStorage`.
- El frontend no guarda la sesion en Redux: `GET /api/auth/me` es la unica fuente, envuelta en `src/lib/use-account.ts`.

## Seguridad actual y pendientes

Las rutas `/api/admin/*` requieren el encabezado `x-admin-key`, con valor igual a `ADMIN_API_KEY`. Esta proteccion es temporal para desarrollo.

Antes de produccion se implementaran roles administrativos, verificacion de correo y recuperacion de contrasena, gestion segura de secretos, limitacion de tasa, observabilidad, copias de seguridad y almacenamiento de imagenes externo.

## Frontend

- Linaria es el sistema obligatorio de estilos. No se agregan hojas CSS nuevas; los tokens de color/tipografia viven en variables CSS globales (`src/components/theme.ts`). La extraccion la hace `@wyw-in-js/vite` (el motor de Linaria 8); el plugin antiguo `@linaria/vite` no sirve con esta version.
- RTK Query (`src/store/catalog-api.ts`) es la unica capa para datos remotos; sus consultas y mutaciones generan hooks tipados y administran la cache (`Catalog` y `Cart` como tags de invalidacion).
- Redux mantiene solo estado de cliente que no pertenece al servidor: el `sessionId` del carrito (`src/store/cart-slice.ts`) y el idioma de interfaz (`src/store/ui-slice.ts`). El conteo del carrito sale siempre de `getCart`, nunca duplicado en el store.
- `react-router-dom` define las paginas (`src/pages/`): inicio, catalogo con filtros, detalle de producto, carrito, checkout, cuenta y 404, todas dentro de un `Layout` compartido (`src/components/Layout.tsx`).
- Idioma: la interfaz es en español por defecto, con un selector ES/EN que traduce toda la copia estatica (`src/lib/translations.ts` + `src/lib/use-translation.ts`). La moneda de la tienda es COP y no cambia con el idioma; solo cambia el formato numerico (`es-CO` / `en-US`).
- Las imagenes de catalogo son fichas de diseno generadas con IA para probar la tienda y se sirven como estaticos desde `apps/web/public/products/<slug>.jpg` y `apps/web/public/collections/<slug>.jpg`. El seed arma la URL a partir del slug, asi que agregar un producto implica dejar su imagen con el mismo nombre. `apps/web/src/assets/` guarda solo el respaldo del hero cuando no hay coleccion destacada.

## Pruebas

- Frontend (`apps/web`): Vitest con `jsdom` y Testing Library. Cubre logica pura (`lib/`), reductores/selectores del store y render de componentes.
- API (`apps/api`): Vitest en entorno `node`, pruebas de integracion que levantan la aplicacion Fastify con `app.inject()` y golpean la base de datos local. Crean sus propios datos con SKU y slug de prueba y los eliminan al terminar, para no contaminar el catalogo. Corren en serie porque comparten una sola base.
