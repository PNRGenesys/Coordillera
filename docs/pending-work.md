# Estado y trabajo pendiente

Corte: 2026-08-12. Trabajo en `main`, sin commit. Documento de traspaso para continuar en otro entorno.

## Hecho y verificado

### Backend (`apps/api`)

| Archivo | Estado |
|---|---|
| `src/config.ts` | Nuevo. Constantes por env: moneda, TTL de reserva, tamaños de página, máximo por línea de carrito, umbral de stock bajo. |
| `src/errors.ts` | Nuevo. `DomainError` con códigos → HTTP, handler global de Fastify (mapea `ZodError` a 400). |
| `src/schemas.ts` | Nuevo. Todos los esquemas Zod centralizados. |
| `src/db/queries.ts` | Nuevo. Fragmentos SQL reutilizables: `availableUnits`, `productAvailableUnits`, `nextOrderNumber`. |
| `src/routes/catalog.ts` | Nuevo. `GET /api/collections`, `/api/categories`, `/api/products` (filtros + paginación), `/api/products/:slug`. |
| `src/routes/cart.ts` | Nuevo. `GET/POST/PATCH/DELETE` de carrito, con validación de stock. |
| `src/routes/checkout.ts` | Nuevo. `POST /api/checkout`, `POST /api/restock-requests`. |
| `src/routes/admin.ts` | Nuevo. `GET /api/admin/inventory`, ajustes, alta de productos. |
| `src/routes/index.ts` | Nuevo. Registro de módulos. |
| `src/routes.ts` | **Eliminado** (reemplazado por `src/routes/`). |
| `src/app.ts` | Registra el handler de errores. |
| `src/db/seed.ts` | Nuevo. Datos demo idempotentes. Script `npm run db:seed --workspace=@coordillera/api`. |
| `src/jobs/release-expired-reservations.ts` | Textos traducidos a inglés. |

### Base de datos

Migración `drizzle/0001_loving_scarlet_spider.sql` **generada y aplicada**. Añade:

- Tablas `size_guides`, `collections`, `restock_requests`.
- Secuencia `order_number_seq` (números de pedido secuenciales, reemplaza `Date.now()`).
- `products`: `collection_id`, `composition`, `release` (`available|preorder|coming_soon`), `available_at`, 3 índices.
- `categories`: `size_guide_id`, `position`.
- Índice de reservas pendientes.

Seed ejecutado: **7 productos activos**, 2 colecciones, 3 categorías, 2 guías de talla, inventario y movimientos. `trail-tote` queda con stock 0 a propósito (probar agotado); `glacier-overshirt` es `preorder`.

### Assets

`apps/web/public/placeholders/*.svg` — 9 placeholders genéricos (7 productos + 2 colecciones). Sustituibles sin tocar componentes: el seed apunta a `/placeholders/<slug>.svg`.

### Validaciones ejecutadas

- `npm.cmd run typecheck --workspace=@coordillera/api` → OK.
- `db:generate`, `db:migrate`, `db:seed` → OK contra el contenedor `coordillera-database-1`.
- `react-router-dom` instalado en `@coordillera/web`.

## Roto ahora mismo

`apps/web` **no compila contra el contrato nuevo**. `store/catalog-api.ts` declara `getProducts` como `ReadonlyArray<CatalogProduct>` pero la API devuelve `{ items, page, pageSize, total }`. La home renderiza vacío hasta corregirlo. Esto es lo primero a arreglar.

## Contrato de API vigente

```
GET  /api/collections            -> [{ id, name, slug, tagline, heroImageUrl, releasedAt, featured }]
GET  /api/categories             -> [{ id, name, slug, position }]
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

Errores: `{ code, message, details }`. Códigos: `cart_not_found`, `cart_empty`, `cart_item_not_found`, `product_not_found`, `variant_not_found`, `out_of_stock`, `invalid_adjustment`, `invalid_request`, `internal_error`.

## Pendiente

### 1. Frontend — es todo el trabajo restante

- `src/store/catalog-api.ts`: reescribir con los tipos del contrato de arriba. Endpoints: `getCollections`, `getCategories`, `getProducts(filters)`, `getProduct(slug)`, `getCart(sessionId)`, `addCartItem`, `updateCartItem`, `removeCartItem`, `checkout`, `requestRestock`. Tag `Cart` invalidado por las mutaciones; tag `Catalog` para producto/listado.
- `src/store/hooks.ts`: `useAppDispatch` / `useAppSelector` tipados.
- `src/store.ts`: el `cartSlice` actual tiene `setItemCount` sin usar. Debe guardar solo el `sessionId`; el conteo sale de `getCart` (RTK Query), no duplicado en el slice.
- `src/lib/session.ts`: `sessionId` persistido en `localStorage` con `crypto.randomUUID()` (hoy vive dentro de `App.tsx`).
- Router (`react-router-dom` ya instalado): `/`, `/shop`, `/shop/:collection`, `/product/:slug`, `/cart`, `/checkout`, 404.
- Componentes compartidos con Linaria (evitar el bloque monolítico de estilos que hoy tiene `App.tsx`): tokens de color/tipografía en variables CSS globales, `Layout` (barra de avisos + header + footer), `ProductCard`, `StateMessage` (cargando/error/vacío), `Price`, `VariantSelector`, `SizeGuideTable`, `QuantityStepper`.
- Páginas: home editorial (colección destacada + categorías + últimos productos), catálogo con filtros (colección, categoría, color, talla, disponibilidad) y paginación, detalle con galería, variantes, guía de tallas, composición y aviso de reposición cuando `availableUnits === 0`, carrito editable, checkout sin pago con confirmación de número de pedido.
- Estados explícitos que la API ya soporta: agotado, `preorder`, última existencia (`availableUnits <= 3`).

### 2. Pruebas

- No hay configuración de Vitest en `apps/web/vite.config.ts` (falta `test: { environment: 'jsdom', setupFiles }`) ni `test` en el `package.json` raíz.
- Existe solo `src/lib/format-price.test.ts`.
- Faltan: pruebas del `cartSlice`/selectores, de `lib/session.ts` y de render de `ProductCard`.
- Backend sin pruebas automatizadas. Mínimo útil: checkout con stock insuficiente (`out_of_stock`) y reserva atómica.

### 3. Verificación no hecha

Ningún endpoint nuevo se ejecutó contra la API en caliente; solo se validaron tipos, migración y seed. Falta arrancar `npm.cmd run dev` y probar el flujo completo, incluida la revisión visual con los MCP de Playwright / Chrome DevTools.

### 4. Documentación

`docs/api.md`, `docs/architecture.md`, `docs/development.md` y `docs/changelog.md` siguen describiendo el contrato viejo. Actualizar antes de cualquier commit (regla de `AGENTS.md`).

## Comandos

```powershell
npm.cmd install
npm.cmd run db:up
npm.cmd run db:migrate --workspace=@coordillera/api
npm.cmd run db:seed    --workspace=@coordillera/api
npm.cmd run dev
```

Web `http://localhost:5173`, API `http://localhost:3000/api/health`.

Para el panel administrativo hace falta `ADMIN_API_KEY` en `apps/api/.env` y enviarla en la cabecera `x-admin-key`.
