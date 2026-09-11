# Arquitectura

## Objetivo

Cordillera es una tienda de ropa en un monorepo. La base actual cubre catalogo bilingue, inventario, carrito, pedidos sin pasarela de pagos, cuentas de cliente y un panel de administracion.

## Componentes

Hay dos formas de levantar el proyecto: el flujo de desarrollo con `npm run dev` (Vite y Fastify en el host, la base en Docker) y el grupo de contenedores completo con `docker compose`.

Desarrollo (host):

```text
Browser
  -> React + TypeScript + Vite (apps/web, puerto 5173)
  -> Fastify + TypeScript (apps/api, puerto 3000)
  -> PostgreSQL 17 (Docker, puerto 5432)
```

Grupo de contenedores (`docker compose up`):

```text
Browser (puerto 8080)
  -> nginx sirviendo el build de apps/web
        -> /api  (proxy inverso, mismo origen)
             -> Fastify (apps/api, servicio "api")
                  -> PostgreSQL 17 (servicio "database")

Plano de control (puerto 8000)
  -> FastAPI + uvicorn (apps/middleware)
        -> Fastify (servicio "api") para las transiciones de pedido
        -> MercadoPago (externo, pendiente de integrar)
```

- `apps/web`: interfaz React compilada por Vite. Redux Toolkit administra estado de interfaz y RTK Query consulta la API. En desarrollo, Vite redirige `/api` a la API; en el contenedor, nginx sirve el build y hace de proxy inverso de `/api` al servicio `api`, manteniendo el mismo origen para que la cookie de sesion funcione sin CORS.
- `apps/api`: servicio HTTP Fastify. Valida entradas con Zod, expone rutas y usa Drizzle ORM. En el contenedor, aplica las migraciones al arrancar (`docker-entrypoint.sh`) antes de servir; el seed de datos de demo se ejecuta a mano (`docker compose run --rm api npm run db:seed`).
- `apps/api/src/db/schema.ts`: esquema de datos como fuente de verdad.
- `apps/api/drizzle`: migraciones SQL generadas desde el esquema.
- `apps/middleware`: middleware de plano de control en FastAPI. Es el punto donde entrara la pasarela de pagos MercadoPago (creacion de preferencias y recepcion de webhooks) y donde vive el control de borde. Hoy solo expone `/health` para orquestar y medir el grupo de contenedores; no esta en el camino critico de catalogo/carrito. La logica de negocio sigue en Fastify: el webhook de pago validado disparara la transicion de pedido a `paid` llamando a la API (`http://api:3000` dentro del grupo), sin escribir en la base directamente.
- `docker-compose.yml`: grupo de contenedores con los cuatro servicios (`database`, `api`, `web`, `middleware`), encadenados por healthchecks para que arranquen en orden. Cada servicio expone un health: `/api/health` (api), `/` (web, nginx) y `/health` (middleware).

## Datos principales

| Area | Entidades |
| --- | --- |
| Catalogo | colecciones, categorias (con guia de talla), productos, variantes, imagenes, guias de talla |
| Inventario | items, movimientos, reservas, solicitudes de reposicion |
| Venta | clientes, sesiones de cliente, carritos, lineas de carrito, pedidos, lineas de pedido |

Los importes se almacenan como enteros en centavos (`priceCents`) para evitar errores de precision. La moneda inicial es COP.

## Estados

- Producto: `draft`, `active`, `archived`.
- Lanzamiento de producto: `available`, `preorder`, `coming_soon`.
- Pedido: `pending_payment`, `paid`, `processing`, `fulfilled`, `shipped`, `delivered`, `cancelled`, `refunded`.
- Cliente: `customer`, `admin`.

Los pedidos se crean como `pending_payment`. La integracion de pagos no forma parte del alcance actual.

## Cuentas de cliente

Un cliente puede comprar como invitado o con cuenta. La cuenta vive en la misma tabla `customers` que usa el checkout: `password_hash` queda vacio para los clientes creados por una compra de invitado, y registrarse con ese correo reclama la fila en vez de duplicarla.

- Contrasenas con `scrypt` de `node:crypto` (`src/auth/password.ts`), sal por contrasena, comparacion en tiempo constante. No se agrego ninguna dependencia de cifrado.
- La sesion es un token aleatorio guardado en `customer_sessions`; la base solo almacena su hash SHA-256, asi que un volcado de la base no permite suplantar a nadie.
- El token viaja en la cookie `cordillera_session` (`httpOnly`, `sameSite=lax`, `secure` en produccion), no en `localStorage`.
- El frontend no guarda la sesion en Redux: `GET /api/auth/me` es la unica fuente, envuelta en `src/lib/use-account.ts`.
- `/account` muestra los datos de la cuenta y `/account/edit` es la pagina de edicion; el cliente cambia alli nombre, correo, telefono, foto y direccion de envio con `PATCH /api/auth/me`, y al guardar vuelve a la ficha. La direccion guardada prellena el checkout y el correo de la cuenta evita volver a pedirlo para la lista de reposicion.
- La foto se guarda como data URL en la columna `customers.avatar`, porque el proyecto todavia no tiene almacenamiento de archivos. El navegador la recorta en cuadrado y la reduce a 256 px antes de enviarla (`src/lib/avatar.ts`), y la API limita el texto con `AVATAR_MAX_CHARACTERS`. Al haber almacenamiento externo, esa columna deberia pasar a ser una URL.

## Un solo pais

La tienda vende unicamente en Colombia, y la interfaz lo da por hecho para pedir menos datos:

- El formulario no pregunta el pais. La API lo completa con `STORE_COUNTRY` (`CO` por defecto), asi que la direccion guardada lo sigue teniendo y ampliarse a otro pais es cambiar una variable y volver a mostrar el campo.
- El departamento se elige de la lista real de los 32 departamentos mas Bogota D.C. (`apps/web/src/lib/store-country.ts`). La validacion de la API sigue aceptando cualquier texto, para no duplicar la lista en los dos lados.
- La ficha de la cuenta no repite el pais en la direccion, el telefono de ejemplo es un movil colombiano y las fechas de pedidos se muestran en `America/Bogota`.
- La moneda es COP (`STORE_CURRENCY`) y el formato numerico sale del idioma de la interfaz.

## Idiomas

La tienda funciona en español (por defecto) e ingles, y la traduccion tiene dos mitades:

- Los textos de la interfaz viven en `apps/web/src/lib/translations.ts`, sin dependencias de i18n.
- El contenido del catalogo vive en la base: las columnas guardan la copia como fue escrita y una columna `translations` (jsonb) guarda los reemplazos por idioma en `products`, `product_variants`, `categories`, `collections` y `size_guides`. Si falta la traduccion de un campo, la API responde con la copia base; nunca queda vacio.
- La API recibe el idioma como `lang` en la consulta (`apps/api/src/i18n.ts`). En el frontend `lang` forma parte de los argumentos de cada consulta de RTK Query, asi que cambiar de idioma cambia la clave de cache y vuelve a pedir el contenido.
- Los colores y las tallas se devuelven como `{ value, label }`: se filtra por `value` (el texto almacenado) y se muestra `label`. De otro modo, filtrar por un color traducido no encontraria nada.

## Administracion

`customers.role` distingue `customer` de `admin`; no hay tabla de roles aparte porque solo existen esos dos niveles. Las rutas `/api/admin/*` exigen una sesion cuyo cliente sea administrador (`401` sin sesion, `403` con una cuenta normal), la misma cookie que usa la tienda. El rol se otorga fuera de la aplicacion con `npm run admin:grant --workspace=@cordillera/api -- <correo>`, asi que nadie puede promoverse desde la interfaz.

El panel `/admin` permite editar nombre, estado y lanzamiento de cada producto, precio de cada variante, ajustar existencias con nota (queda en `inventory_movements`) y gestionar pedidos: estado, transportadora y numero de guia.

Marcar un pedido como `paid` convierte sus reservas en venta y `cancelled`/`refunded` las devuelve al inventario. Sin eso, el job que libera reservas vencidas devolveria a la venta unidades ya cobradas.

## Seguridad actual y pendientes

Antes de produccion se implementaran verificacion de correo y recuperacion de contrasena, gestion segura de secretos, limitacion de tasa, observabilidad, copias de seguridad y almacenamiento de imagenes externo.

## Frontend

- Linaria es el sistema obligatorio de estilos. No se agregan hojas CSS nuevas; los tokens de color/tipografia viven en variables CSS globales (`src/components/theme.ts`). La extraccion la hace `@wyw-in-js/vite` (el motor de Linaria 8); el plugin antiguo `@linaria/vite` no sirve con esta version.
- RTK Query (`src/store/catalog-api.ts`) es la unica capa para datos remotos; sus consultas y mutaciones generan hooks tipados y administran la cache (`Catalog` y `Cart` como tags de invalidacion).
- Redux mantiene solo estado de cliente que no pertenece al servidor: el `sessionId` del carrito (`src/store/cart-slice.ts`) y el idioma de interfaz (`src/store/ui-slice.ts`). El conteo del carrito sale siempre de `getCart`, nunca duplicado en el store.
- `react-router-dom` define las paginas (`src/pages/`): inicio, catalogo con filtros, detalle de producto, carrito, checkout, cuenta, edicion de perfil, panel de administracion y 404, todas dentro de un `Layout` compartido (`src/components/Layout.tsx`).
- Los campos de formulario (`Field`, `FieldRow`, `Input`, `Select`, `PrimaryButton`) viven en `src/components/primitives.ts` y los comparten checkout, cuenta y panel de administracion.
- Idioma: la interfaz es en español por defecto, con un selector ES/EN que traduce la copia estatica (`src/lib/translations.ts` + `src/lib/use-translation.ts`) y pide el catalogo en ese idioma (ver "Idiomas"). La moneda de la tienda es COP y no cambia con el idioma; solo cambia el formato numerico (`es-CO` / `en-US`).
- Las imagenes de catalogo son fichas de diseno generadas con IA para probar la tienda y se sirven como estaticos desde `apps/web/public/products/<slug>.jpg` y `apps/web/public/collections/<slug>.jpg`. El seed arma la URL a partir del slug, asi que agregar un producto implica dejar su imagen con el mismo nombre. `apps/web/src/assets/Banners/brand-banner.jpg` es la referencia de marca: no se muestra en la tienda, pero de el salen la paleta monocroma y la tipografia de titulos definidas en `src/components/theme.ts`. `apps/web/public/favicon.ico` es el icono de la pestana.
- El hero del inicio rota las imagenes de los ultimos productos con un fundido cruzado hecho solo con CSS (`src/components/HeroSlideshow.tsx`): cada diapositiva lleva la misma animacion y un `animation-delay` negativo distinto, sin temporizadores en JavaScript. Reutiliza la consulta que ya alimenta la cuadricula de abajo, asi que no cuesta una peticion extra.

## Pruebas

- Frontend (`apps/web`): Vitest con `jsdom` y Testing Library. Cubre logica pura (`lib/`), reductores/selectores del store y render de componentes.
- API (`apps/api`): Vitest en entorno `node`, pruebas de integracion que levantan la aplicacion Fastify con `app.inject()` y golpean la base de datos local. Crean sus propios datos con SKU y slug de prueba y los eliminan al terminar, para no contaminar el catalogo. Corren en serie porque comparten una sola base.
- End-to-end (`apps/e2e`): Playwright, navegador real contra `apps/web` y `apps/api` levantados por `playwright.config.ts` (`npm run test:e2e`, requiere `npm run db:up` primero y, la primera vez, `npm run test:e2e:install` para el navegador). Hoy solo hay una prueba de humo; la suite real es trabajo pendiente (`docs/pending-work.md` #11).
