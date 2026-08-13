# Registro de cambios

Este archivo registra los cambios incluidos en cada commit solicitado. Las entradas se agregan antes de crear el commit.

## Sin commit - Correccion de Linaria (pagina en blanco) y revision visual con Playwright

- Se reemplazo `@linaria/vite@5` por `@wyw-in-js/vite`: el plugin antiguo no es compatible con Linaria 8, no transformaba nada y el tag `css` lanzaba en tiempo de ejecucion, dejando la pagina en blanco y el build sin CSS. El build ahora emite la hoja de estilos.
- Revision visual con Playwright (escritorio 1440 y movil 390) de inicio, catalogo, coleccion, detalle, agotado, carrito y checkout: sin errores de consola.
- El enlace de navegacion a la tienda ya no se oculta en movil; la marca escala con el ancho.
- Las variantes se ordenan segun la guia de tallas (S, M, L, XL) en vez de alfabeticamente (`lib/variant-order.ts`, con pruebas).
- El seed ya no asigna la guia de tallas de tops a los accesorios y ahora actualiza las categorias existentes.
- Las pruebas de la API se limitan a `src/` (antes tambien corrian sobre `dist/`).

## Sin commit - Verificacion end to end y pruebas de integracion de la API

- Se verifico el flujo completo contra la API en ejecucion: catalogo, filtros, detalle con guia de tallas, carrito, checkout (`ORD-001000`), reposicion y rutas administrativas.
- Se agregaron pruebas de integracion de la API (`apps/api/src/routes/checkout.test.ts`): reserva atomica de la ultima unidad, rechazo `out_of_stock` del pedido competidor, carrito conservado tras el rechazo, `cart_not_found` y `cart_empty`.
- Se agrego el script `test` en la raiz y en `@coordillera/api`; el logger de Fastify se silencia bajo `NODE_ENV=test`.
- Se corrigio la fuga de DOM entre pruebas del frontend (`cleanup` de Testing Library en `test-setup.ts`), que hacia fallar la prueba de ultima existencia.
- Detalle de producto: la cantidad vuelve a 1 al cambiar de variante y se muestra el error cuando la API rechaza el agregado.
- Carrito: se muestran los errores de actualizar y quitar lineas.
- Catalogo por coleccion: el titulo usa el nombre real de la coleccion en vez del slug.
- Se movio el color de error a la variable `--color-danger` y se traslado al ingles el mensaje de `DATABASE_URL` faltante.

## Sin commit - Frontend alineado al contrato de API, router y traduccion ES/EN

- Se reescribio `store/catalog-api.ts` contra el contrato real de la API (catalogo paginado, carrito, checkout, reposicion).
- Se agrego `react-router-dom` con paginas de inicio, catalogo con filtros y paginacion, detalle de producto, carrito y checkout sin pago.
- Se extrajeron componentes compartidos con Linaria (`Layout`, `ProductCard`, `StateMessage`, `Price`, `VariantSelector`, `SizeGuideTable`, `QuantityStepper`) y tokens de color/tipografia en variables CSS globales.
- El carrito ahora guarda solo el `sessionId` en Redux; el conteo sale de `getCart` via RTK Query.
- Se agrego selector de idioma ES/EN (español por defecto, moneda COP sin cambios) mediante un diccionario propio, sin dependencias nuevas.
- Se configuro Vitest (`environment: 'jsdom'`, `setupFiles`) y se agregaron pruebas de `lib/session.ts`, `store/cart-slice.ts` y `ProductCard`.

## 664153c - Agregado el backend de tienda y el catalogo inicial del frontend

- Se reemplazo la landing temporal por una tienda editorial responsive.
- Se incorporaron Redux Toolkit, RTK Query y Linaria.
- Se agrego una imagen editorial generica local, sustituible por los assets definitivos.
- Se creo una prueba unitaria para el formato monetario y se elimino `unknown` del codigo de rutas.
- Se ampliaron catalogo, inventario y checkout: colecciones, guias de talla, paginacion/filtros, seed de datos de demostracion y reservas por orden.

## 0.1.0 - Configuracion inicial del entorno

- Se creo el monorepo con React, TypeScript, Vite, Fastify y PostgreSQL.
- Se implementaron catalogo, variantes, carrito, pedidos sin pago e inventario con reservas.
- Se anadio la documentacion inicial del proyecto.
- Se definieron las reglas obligatorias de trabajo del repositorio.
- Se definió `main` como rama de trabajo durante la etapa inicial.
- Se configuraron localmente los MCP de Playwright y Chrome DevTools para pruebas visuales.
