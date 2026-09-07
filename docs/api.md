# API

Base local: `http://localhost:3000`. Todas las solicitudes y respuestas usan JSON. Las validaciones de cada ruta viven en `apps/api/src/schemas.ts` (Zod) hasta que se publique una especificación OpenAPI.

## Publica

| Metodo | Ruta | Funcion |
| --- | --- | --- |
| GET | `/api/health` | Confirma que la API responde. |
| POST | `/api/auth/register` | Crea una cuenta de cliente y abre sesión. |
| POST | `/api/auth/login` | Inicia sesión con correo y contraseña. |
| POST | `/api/auth/logout` | Cierra la sesión activa. |
| GET | `/api/auth/me` | Devuelve la cuenta de la sesión, o vacío si es un invitado. |
| GET | `/api/collections` | Lista colecciones (para navegación editorial e inicio). |
| GET | `/api/categories` | Lista categorías con su guía de tallas asociada. |
| GET | `/api/products` | Catálogo paginado con filtros de colección, categoría, color, talla y disponibilidad. |
| GET | `/api/products/:slug` | Detalle de un producto activo: variantes, imágenes y guía de tallas. |
| GET | `/api/cart/:sessionId` | Obtiene el carrito de una sesión. |
| POST | `/api/cart/items` | Agrega unidades al carrito de una sesión (valida stock). |
| PATCH | `/api/cart/items` | Actualiza la cantidad de una línea (`quantity: 0` la elimina). |
| DELETE | `/api/cart/items` | Elimina una línea del carrito (`sessionId` y `variantId` como query params). |
| POST | `/api/checkout` | Crea un pedido `pending_payment` y reserva existencias de forma atómica. |
| POST | `/api/restock-requests` | Registra un correo para avisar cuando una variante vuelva a tener stock. |

### Cuentas de cliente

La sesión viaja en la cookie `coordillera_session` (`httpOnly`, `sameSite=lax`, `secure` en produccion). La API guarda solo el hash SHA-256 del token y la contraseña con `scrypt`. Su duración sale de `SESSION_TTL_DAYS`.

```
POST /api/auth/register  { "email": "...", "password": "...", "firstName": "...", "lastName": "...", "phone": "..." }  -> 201 AccountProfile
POST /api/auth/login     { "email": "...", "password": "..." }                                                        -> 200 AccountProfile
POST /api/auth/logout                                                                                                 -> 204
GET  /api/auth/me                                                                                                     -> 200 { "account": AccountProfile | ausente }
```

`AccountProfile = { id, email, firstName, lastName, phone }`. La contraseña nunca sale en una respuesta.

Registrar un correo que ya usó un invitado en el checkout reclama ese cliente en vez de duplicarlo. Si el correo ya tiene contraseña, responde `409 email_taken`. Un correo desconocido y una contraseña incorrecta devuelven el mismo `401 invalid_credentials`, para no revelar qué cuentas existen.

### Catálogo paginado

```
GET /api/products?collection=&category=&color=&size=&availability=all|in_stock&page=&pageSize=
```

```json
{
  "page": 1,
  "pageSize": 24,
  "total": 11,
  "items": [
    {
      "id": "uuid", "slug": "furry-casual-tee", "name": "Furry Casual Tee",
      "release": "available", "availableAt": null,
      "categorySlug": "t-shirts", "collectionSlug": "wildspirit", "collectionName": "Wildspirit",
      "minPriceCents": 18900000, "maxPriceCents": 18900000,
      "colors": ["Black Purple", "Grey Orange", "Cream Blue"], "sizes": ["S", "M", "L", "XL", "XXL"],
      "availableUnits": 90, "imageUrl": "/products/furry-casual-tee.jpg"
    }
  ]
}
```

### Detalle de producto

```json
{
  "id": "uuid", "name": "Furry Casual Tee", "slug": "furry-casual-tee",
  "description": "...", "composition": "100% cotton, 220-240 gsm, synthetic fur details",
  "release": "available", "availableAt": null,
  "categoryName": "T-shirts", "categorySlug": "t-shirts",
  "collectionName": "Wildspirit", "collectionSlug": "wildspirit",
  "sizeGuideName": "Tops", "sizeGuideUnit": "cm",
  "sizeGuideColumns": ["Size", "Length", "Width"],
  "sizeGuideRows": [{ "Size": "M", "Length": "72", "Width": "58" }],
  "images": [{ "url": "/products/furry-casual-tee.jpg", "alt": "Furry Casual Tee", "position": 0 }],
  "variants": [
    { "id": "uuid", "sku": "FURR-BLAC-M", "name": "Furry Casual Tee Black Purple M", "color": "Black Purple", "size": "M",
      "priceCents": 18900000, "compareAtPriceCents": null, "availableUnits": 6 }
  ]
}
```

### Carrito

```
GET /api/cart/:sessionId
```

```json
{
  "sessionId": "uuid", "currency": "COP", "itemCount": 2, "subtotalCents": 37800000,
  "items": [
    { "variantId": "uuid", "sku": "FURR-BLAC-M", "productName": "Furry Casual Tee", "productSlug": "furry-casual-tee",
      "variantName": "Furry Casual Tee Black Purple M", "color": "Black Purple", "size": "M",
      "unitPriceCents": 18900000, "quantity": 2, "availableUnits": 6, "imageUrl": "/products/furry-casual-tee.jpg" }
  ]
}
```

```
POST /api/cart/items    { "sessionId": "uuid", "variantId": "uuid", "quantity": 1 }   -> 201 CartView
PATCH /api/cart/items   { "sessionId": "uuid", "variantId": "uuid", "quantity": 2 }   -> CartView
DELETE /api/cart/items?sessionId=uuid&variantId=uuid                                   -> CartView
```

### Checkout

```json
{
  "sessionId": "uuid",
  "email": "cliente@ejemplo.com",
  "firstName": "Nombre",
  "lastName": "Apellido",
  "phone": "3000000000",
  "shippingAddress": {
    "line1": "Calle 1 # 2-3",
    "line2": "Apto 4",
    "city": "Bogota",
    "region": "Bogota D.C.",
    "postalCode": "110111",
    "country": "CO"
  }
}
```

Respuesta `201`:

```json
{ "number": "1000", "status": "pending_payment", "totalCents": 37800000, "currency": "COP", "reservationExpiresInMinutes": 20 }
```

### Reposición

```
POST /api/restock-requests   { "variantId": "uuid", "email": "cliente@ejemplo.com" }   -> 202 { "status": "registered" }
```

## Errores

Toda respuesta de error tiene la forma `{ code, message, details }`. Códigos actuales: `cart_not_found`, `cart_empty`, `cart_item_not_found`, `product_not_found`, `variant_not_found`, `collection_not_found`, `out_of_stock`, `invalid_adjustment`, `email_taken`, `invalid_credentials`, `invalid_request` (payload inválido según Zod), `internal_error`.

## Administracion

Toda ruta administrativa exige el encabezado `x-admin-key: <ADMIN_API_KEY>`.

| Metodo | Ruta | Funcion |
| --- | --- | --- |
| GET | `/api/admin/inventory` | Lista inventario por variante con alerta de stock bajo. |
| POST | `/api/admin/inventory/adjustments` | Ajusta el stock de una variante y deja trazabilidad (`inventory_movements`). |
| POST | `/api/admin/products` | Crea un producto en borrador, sus variantes e inventario inicial. |

No existe interfaz visual para estas rutas todavía (ver `docs/pending-work.md`).
