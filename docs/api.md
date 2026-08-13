# API

Base local: `http://localhost:3000`. Todas las solicitudes y respuestas usan JSON. Las validaciones de cada ruta viven en `apps/api/src/schemas.ts` (Zod) hasta que se publique una especificación OpenAPI.

## Publica

| Metodo | Ruta | Funcion |
| --- | --- | --- |
| GET | `/api/health` | Confirma que la API responde. |
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

### Catálogo paginado

```
GET /api/products?collection=&category=&color=&size=&availability=all|in_stock&page=&pageSize=
```

```json
{
  "page": 1,
  "pageSize": 24,
  "total": 7,
  "items": [
    {
      "id": "uuid", "slug": "ridgeline-tee", "name": "Ridgeline Tee",
      "release": "available", "availableAt": null,
      "categorySlug": "t-shirts", "collectionSlug": "edition-01", "collectionName": "Edition 01",
      "minPriceCents": 12500, "maxPriceCents": 12500,
      "colors": ["Moss"], "sizes": ["S", "M", "L"],
      "availableUnits": 10, "imageUrl": "/placeholders/ridgeline-tee.svg"
    }
  ]
}
```

### Detalle de producto

```json
{
  "id": "uuid", "name": "Ridgeline Tee", "slug": "ridgeline-tee",
  "description": "...", "composition": "100% cotton",
  "release": "available", "availableAt": null,
  "categoryName": "T-shirts", "categorySlug": "t-shirts",
  "collectionName": "Edition 01", "collectionSlug": "edition-01",
  "sizeGuideName": "Tops", "sizeGuideUnit": "cm",
  "sizeGuideColumns": ["Size", "Chest", "Length"],
  "sizeGuideRows": [{ "Size": "M", "Chest": "104", "Length": "70" }],
  "images": [{ "url": "/placeholders/ridgeline-tee.svg", "alt": null, "position": 0 }],
  "variants": [
    { "id": "uuid", "sku": "RT-M-MOSS", "name": "Ridgeline Tee — M / Moss", "color": "Moss", "size": "M",
      "priceCents": 12500, "compareAtPriceCents": null, "availableUnits": 10 }
  ]
}
```

### Carrito

```
GET /api/cart/:sessionId
```

```json
{
  "sessionId": "uuid", "currency": "COP", "itemCount": 2, "subtotalCents": 25000,
  "items": [
    { "variantId": "uuid", "sku": "RT-M-MOSS", "productName": "Ridgeline Tee", "productSlug": "ridgeline-tee",
      "variantName": "Ridgeline Tee — M / Moss", "color": "Moss", "size": "M",
      "unitPriceCents": 12500, "quantity": 2, "availableUnits": 10, "imageUrl": "/placeholders/ridgeline-tee.svg" }
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
{ "number": "1000", "status": "pending_payment", "totalCents": 25000, "currency": "COP", "reservationExpiresInMinutes": 20 }
```

### Reposición

```
POST /api/restock-requests   { "variantId": "uuid", "email": "cliente@ejemplo.com" }   -> 202 { "status": "registered" }
```

## Errores

Toda respuesta de error tiene la forma `{ code, message, details }`. Códigos actuales: `cart_not_found`, `cart_empty`, `cart_item_not_found`, `product_not_found`, `variant_not_found`, `collection_not_found`, `out_of_stock`, `invalid_adjustment`, `invalid_request` (payload inválido según Zod), `internal_error`.

## Administracion

Toda ruta administrativa exige el encabezado `x-admin-key: <ADMIN_API_KEY>`.

| Metodo | Ruta | Funcion |
| --- | --- | --- |
| GET | `/api/admin/inventory` | Lista inventario por variante con alerta de stock bajo. |
| POST | `/api/admin/inventory/adjustments` | Ajusta el stock de una variante y deja trazabilidad (`inventory_movements`). |
| POST | `/api/admin/products` | Crea un producto en borrador, sus variantes e inventario inicial. |

No existe interfaz visual para estas rutas todavía (ver `docs/pending-work.md`).
