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
| Catalogo | categorias, productos, variantes, imagenes |
| Inventario | items, movimientos, reservas |
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

- Linaria es el sistema obligatorio de estilos. No se agregan hojas CSS nuevas.
- RTK Query es la unica capa para datos remotos; sus consultas y mutaciones generan hooks tipados y administran la cache.
- Redux mantiene solo estado de cliente que no pertenece al servidor, como el conteo de carrito y preferencias de interfaz.
- Los assets genericos se almacenan localmente en `apps/web/src/assets/` y son reemplazables cuando exista fotografia de producto.

