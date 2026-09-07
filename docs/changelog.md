# Registro de cambios

Este archivo registra los cambios incluidos en cada commit solicitado. Las entradas se agregan antes de crear el commit.

## Sin commit - Finales de linea consistentes

- `.gitattributes` pasa de `* text=auto` a `* text=auto eol=lf`: el repositorio guarda LF y ahora tambien se descarga LF en Windows, en vez de convertirse a CRLF. Eso es lo que provocaba el aviso del editor.
- Se marcaron como binarias las imagenes (`png`, `jpg`, `jpeg`, `ico`, `webp`) para que la conversion nunca las toque.
- Se normalizaron a LF cuatro archivos que habian quedado con finales mezclados o CRLF: `apps/api/.env.example`, `apps/api/src/routes/cart.ts`, `apps/web/src/lib/format-price.test.ts` y `docs/api.md`.

## Sin commit - Carpeta de banners, nota de despliegue y repaso de la documentacion

- El banner de marca se movio a `apps/web/src/assets/Banners/`, su propia carpeta para las proximas piezas.
- `docs/pending-work.md` suma la seccion de despliegue con las opciones evaluadas y por que Kubernetes no hace falta en este tamano.
- Se reviso toda la documentacion contra el codigo actual:
  - `README.md`: arranque completo con copia de `.env` y seed, resumen real de funcionalidades, seccion de administracion, comandos y Node 22.12 como minimo.
  - `docs/README.md`: el indice incluye `pending-work.md`, que faltaba.
  - `docs/inventory.md`: se documentaron los ajustes manuales y el efecto de los cambios de estado de un pedido sobre el inventario; el flujo de pagos queda marcado como pendiente.
  - `docs/development.md`: el minimo de Node pasa a 22.12 y las pruebas visuales describen la instalacion real de Playwright en vez de los MCP de Codex.
  - `docs/api.md`: `lang` en los ejemplos de carrito, aclaracion de que los ejemplos usan la copia base y correccion del numero de pedido (`ORD-001000`).
  - `docs/architecture.md`: el objetivo menciona cuentas, administracion e idiomas, y la lista de estados incluye lanzamiento y rol de cliente.
- Al verificar los comandos documentados se encontro que `inventory:release-expired` nunca terminaba: la conexion a la base mantenia vivo el proceso. Ahora cierra al final, que es lo que necesita para poder programarse.

## Sin commit - La marca pasa de "Coordillera" a "Cordillera"

- Se corrigio el nombre en todo el repositorio: interfaz, documentacion, paquetes (`@cordillera/api`, `@cordillera/web`), `docker-compose.yml` y datos de prueba.
- La base de datos y su rol se renombraron en caliente (`ALTER DATABASE` / `ALTER ROLE`), sin perder clientes, productos ni pedidos.
- Cambian dos identificadores del navegador: la cookie de sesion (`cordillera_session`) y la clave del carrito en `localStorage`, asi que las sesiones y los carritos abiertos se reinician una vez.
- Pendiente fuera del alcance del repositorio: renombrar la carpeta local del proyecto y el repositorio en GitHub, de donde sale tambien el nombre del contenedor de PostgreSQL.

## Sin commit - Banner de marca e icono del sitio

- Se agrego `apps/web/public/favicon.ico` y su enlace en `index.html`.
- El hero del inicio pasa a mostrar el banner de marca (`apps/web/src/assets/brand-banner.jpg`), completo y sin recortar sobre un fondo oscuro (`--color-brand-canvas`).
- Se elimino `hero-collection.png`: el bundle baja de 2,09 MB a 106 KB de imagen.
- La cabecera se envuelve en pantallas angostas; con los enlaces de cuenta y administracion ya no cabia en una sola linea en movil.

## Sin commit - Traduccion del contenido del catalogo

- Se detecto con Playwright que el selector ES/EN solo cambiaba la interfaz: categorias, coleccion, nombres, descripciones, colores, tallas y guia de tallas venian de la base en un solo idioma.
- Se agrego una columna `translations` (jsonb) en `products`, `product_variants`, `categories`, `collections` y `size_guides`. Las columnas guardan la copia base y el jsonb los reemplazos por idioma, con respaldo a la copia base cuando falta una traduccion.
- Las rutas de catalogo y carrito aceptan `lang=es|en`; un idioma no soportado responde `400`. En el frontend `lang` es parte de los argumentos de cada consulta, de modo que cambiar de idioma invalida la cache y vuelve a pedir el contenido.
- Los colores y las tallas se devuelven como `{ value, label }`: se filtra por el valor almacenado y se muestra el traducido, asi que los filtros siguen funcionando en ambos idiomas.
- El seed carga la version en espanol de las 11 fichas y refresca solo las traducciones al reejecutarse, para no pisar lo que se edite desde el panel.
- Se tradujeron los ultimos textos fijos de la interfaz: etiquetas de accesibilidad de la navegacion y la bolsa, y el marcador del correo de reposicion.
- Pruebas nuevas: 4 de la API sobre idioma, respaldo de traduccion y filtrado por facetas.

## Sin commit - Rol de administrador y panel de gestion

- `customers.role` distingue `customer` de `admin`. Las rutas `/api/admin/*` pasaron del encabezado `x-admin-key` a la sesion del cliente: `401` sin sesion, `403` sin rol. Se elimino `ADMIN_API_KEY`.
- Script `admin:grant` para otorgar el rol por linea de comandos; no se puede ascender una cuenta desde la interfaz.
- Rutas nuevas: `GET /api/admin/products`, `PATCH /api/admin/products/:id`, `PATCH /api/admin/variants/:id`, `GET /api/admin/orders` y `PATCH /api/admin/orders/:id`. `GET /api/admin/inventory` se elimino porque el listado de productos ya trae existencias.
- Los pedidos guardan transportadora y numero de guia. Marcar `paid` convierte las reservas en venta y `cancelled`/`refunded` devuelve las unidades; un pedido cerrado ya no cambia de estado.
- Panel `/admin` con las fichas de producto plegables (nombre, estado, lanzamiento, precio por variante y ajustes de stock con nota) y la lista de pedidos con cliente, direccion, lineas, estado y envio.
- Se extrajeron a `components/primitives.ts` los campos de formulario que duplicaban checkout y cuenta, y a `lib/order-status.ts` las etiquetas de estado de pedido.
- Pruebas nuevas: 12 de la API (control de acceso, catalogo, ajustes de stock y pedidos) y 3 del frontend (conversion de precios).

## Sin commit - Inicio de sesion de clientes

- Se agregaron `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` y `GET /api/auth/me`.
- Las contrasenas se guardan con `scrypt` de `node:crypto` (sin dependencias nuevas de cifrado) y la sesion viaja en una cookie `httpOnly`; la base solo guarda el hash del token (tabla `customer_sessions`).
- Registrarse con el correo de una compra de invitado reclama ese cliente en vez de duplicarlo. Correo desconocido y contrasena incorrecta comparten el mismo error, para no revelar que cuentas existen.
- Frontend: pagina `/account` con inicio de sesion y registro, enlace en la cabecera con el nombre del cliente y checkout prellenado con los datos de la cuenta (solo en los campos vacios).
- Pruebas nuevas: 10 de la API (registro, correo repetido, hash almacenado, credenciales, sesion y cierre de sesion) y 5 del frontend (mensajes de error y nombre visible).
- Se agrego `@fastify/cookie` y las variables `SESSION_TTL_DAYS` y `PASSWORD_MIN_LENGTH`.

## Sin commit - Catalogo de prueba con las fichas de diseno Kemono

- Se cargaron las 12 fichas de diseno generadas con IA como imagenes de prueba del sitio: 11 productos en `apps/web/public/products/` y el hero de coleccion en `apps/web/public/collections/`. Se convirtieron de PNG a JPEG (25 MB a 3,4 MB) y se eliminaron los SVG de `public/placeholders/`.
- El seed pasa a las colecciones `wildspirit` y `fauna-series` con 11 productos (uno agotado y uno en preventa), la categoria `pants` y la guia de tallas de tops con las medidas reales de la ficha.
- El seed archiva los productos que ya no estan en el conjunto de datos, en vez de dejarlos activos, y actualiza guias y colecciones existentes al volver a ejecutarse.
- Se corrigio el generador de SKU del seed: recortaba el slug a cuatro letras, de modo que `furry-cap` y `furry-casual-tee` chocaban y cinco productos quedaban sin variantes ni stock. Ahora usa las iniciales del slug y el seed falla si detecta un SKU repetido.
- El orden de variantes agrupa por color y, sin guia de tallas, usa el orden estandar (XS a XXXL) en vez del alfabetico.
- La cuadricula de categorias del inicio se ajusta al numero de categorias en lugar de fijar tres columnas.

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
- Se agrego el script `test` en la raiz y en `@cordillera/api`; el logger de Fastify se silencia bajo `NODE_ENV=test`.
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
