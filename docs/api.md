# API

Base local: `http://localhost:3000`. Todas las solicitudes y respuestas usan JSON.

## Publica

| Metodo | Ruta | Funcion |
| --- | --- | --- |
| GET | `/api/health` | Confirma que la API responde. |
| GET | `/api/products` | Lista variantes de productos activos. |
| GET | `/api/products/:slug` | Devuelve producto activo y sus variantes. |
| POST | `/api/cart/items` | Agrega unidades al carrito de una sesion. |
| GET | `/api/cart/:sessionId` | Obtiene las lineas de un carrito. |
| POST | `/api/checkout` | Crea un pedido pendiente de pago y reserva existencias. |

### Agregar al carrito

```json
{
  "sessionId": "uuid-de-la-sesion",
  "variantId": "uuid-de-la-variante",
  "quantity": 1
}
```

### Crear pedido

```json
{
  "sessionId": "uuid-de-la-sesion",
  "email": "cliente@ejemplo.com",
  "firstName": "Nombre",
  "lastName": "Apellido",
  "phone": "3000000000",
  "shippingAddress": {
    "line1": "Calle 1 # 2-3",
    "city": "Bogota",
    "region": "Bogota D.C.",
    "postalCode": "110111",
    "country": "CO"
  }
}
```

## Administracion

Toda ruta administrativa exige `x-admin-key: <ADMIN_API_KEY>`.

| Metodo | Ruta | Funcion |
| --- | --- | --- |
| POST | `/api/admin/products` | Crea un producto en borrador, variantes e inventario inicial. |
| POST | `/api/admin/inventory/adjustments` | Ajusta el stock de una variante y deja trazabilidad. |

Las validaciones completas de cada ruta viven en `apps/api/src/routes.ts` hasta que se publique una especificacion OpenAPI.

