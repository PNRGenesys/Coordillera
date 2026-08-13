# Estado y trabajo pendiente

Corte: 2026-08-13. Trabajo en `main`, sin commit.

## Estado actual

Backend y frontend completos y verificados contra la base de datos local. Todo lo que aparecia como pendiente de verificacion en el corte anterior ya se ejecuto.

### Verificacion end to end (hecha, con Docker y PostgreSQL en ejecucion)

| Flujo | Resultado |
|---|---|
| `db:migrate` + `db:seed` | OK, 7 productos activos. |
| `GET /api/collections`, `/api/categories` | OK. |
| `GET /api/products` con paginacion y filtros (`collection`, `size`, `availability=in_stock`) | OK. |
| `GET /api/products/:slug` | OK, incluye imagenes, variantes con disponibilidad y guia de tallas. |
| Carrito: agregar, actualizar, quitar | OK. |
| Agregar variante agotada | 409 `out_of_stock`. |
| Cantidad por encima del maximo por linea | 400 `invalid_request`. |
| Cantidad por encima del stock | 409 `out_of_stock`. |
| `POST /api/checkout` | 201, pedido `ORD-001000` con reserva de 20 minutos y carrito vaciado. |
| `POST /api/restock-requests` | 202. |
| `GET /api/admin/inventory` | OK con clave; 401 sin ella. |
| Slug inexistente | 404 `product_not_found`. |
| Proxy de Vite `/api` | OK. |

### Revision visual (hecha, con Playwright)

Se recorrieron inicio, catalogo, catalogo por coleccion, detalle, producto agotado, carrito y checkout en 1440x1000 y en 390x844, sin errores de consola. Los estilos de Linaria se emiten correctamente tras cambiar el plugin de Vite.

### Validaciones

- `npm.cmd run typecheck` OK.
- `npm.cmd run test` OK: 6 pruebas de API + 14 del frontend.
- `npm.cmd run build` OK.
- Entorno verificado: Windows 11, Node 24.19.0, PostgreSQL en Docker.

## Pendiente

### 1. Panel administrativo

Las rutas `/api/admin/*` existen pero no tienen interfaz. Siguen protegidas solo por el encabezado `x-admin-key` (temporal, ver `docs/architecture.md`).

### 2. Facetas del catalogo

Los desplegables de color y talla en `/shop` se arman con los productos de la pagina visible, asi que al filtrar por un color el desplegable deja de ofrecer los demas (hay que volver a "Todos" para cambiar). Solucion adecuada: un endpoint de facetas que devuelva colores y tallas del catalogo completo segun coleccion y categoria.

### 3. Optimizacion de assets

`apps/web/src/assets/hero-collection.png` pesa ~2 MB y se sirve tal cual en el build. Sustituible por fotografia de producto real; conviene comprimir y redimensionar al reemplazarla.

### 4. Vulnerabilidades de dependencias

`npm audit` reporta 4 moderadas, todas heredadas de `esbuild` via `drizzle-kit` (las 3 criticas anteriores desaparecieron al quitar `@linaria/vite`). `npm audit fix --force` implica un downgrade incompatible de `drizzle-kit`; no se aplico.

### 5. Trabajo de producto todavia no empezado

Pasarela de pago, envios y costos, cuentas de cliente, historial de pedidos, correos transaccionales y contenido editorial real (fotografia, textos, colecciones definitivas).

## Contrato de API vigente

```
GET  /api/collections            -> [{ id, name, slug, tagline, heroImageUrl, releasedAt, featured }]
GET  /api/categories              -> [{ id, name, slug, position }]
GET  /api/products?collection=&category=&color=&size=&availability=all|in_stock&page=&pageSize=
     -> { page, pageSize, total, items: [{ id, slug, name, release, availableAt, categorySlug,
           collectionSlug, collectionName, minPriceCents, maxPriceCents, colors[], sizes[],
           availableUnits, imageUrl }] }
GET  /api/products/:slug
     -> { id, name, slug, description, composition, release, availableAt, categoryName, categorySlug,
          collectionName, collectionSlug, sizeGuideName, sizeGuideUnit, sizeGuideColumns[],
          sizeGuideRows[], images: [{ url, alt, position }],
          variants: [{ id, sku, name, color, size, priceCents, compareAtPriceCents, availableUnits }] }
GET    /api/cart/:sessionId      -> CartView
POST   /api/cart/items           { sessionId, variantId, quantity }        -> 201 CartView
PATCH  /api/cart/items           { sessionId, variantId, quantity }        -> CartView  (quantity 0 = eliminar)
DELETE /api/cart/items?sessionId=&variantId=                               -> CartView
POST   /api/checkout             { sessionId, email, firstName, lastName, phone, shippingAddress }
     -> 201 { number, status, totalCents, currency, reservationExpiresInMinutes }
POST   /api/restock-requests     { variantId, email }                      -> 202
GET    /api/admin/inventory                        (header x-admin-key)
POST   /api/admin/inventory/adjustments            (header x-admin-key)
POST   /api/admin/products                         (header x-admin-key)
```

`CartView = { sessionId, currency, items: [{ variantId, sku, productName, productSlug, variantName, color, size, unitPriceCents, quantity, availableUnits, imageUrl }], itemCount, subtotalCents }`

Errores: `{ code, message, details }`. Codigos: `cart_not_found`, `cart_empty`, `cart_item_not_found`, `product_not_found`, `variant_not_found`, `out_of_stock`, `invalid_adjustment`, `invalid_request`, `internal_error`.

## Comandos

```powershell
npm.cmd install
Copy-Item apps/api/.env.example apps/api/.env
npm.cmd run db:up
npm.cmd run db:migrate --workspace=@coordillera/api
npm.cmd run db:seed    --workspace=@coordillera/api
npm.cmd run dev
```

Web `http://localhost:5173`, API `http://localhost:3000/api/health`.

`apps/api/.env` es obligatorio: sin `DATABASE_URL` fallan `db:migrate`, `db:seed`, el servidor y las pruebas de la API. Para el panel administrativo hace falta `ADMIN_API_KEY` y enviarla en la cabecera `x-admin-key`.
