# Trabajo pendiente

Corte: 2026-09-06. Trabajo en `main`, sin commit. Solo se listan tareas abiertas; lo terminado vive en `docs/changelog.md`.

## 1. Cuentas de cliente

El inicio de sesion y el rol de administrador ya funcionan, pero queda por hacer:

- Verificacion de correo y recuperacion de contrasena. Hoy cualquiera que conozca el correo de una compra de invitado puede reclamar esa cuenta.
- Limitacion de intentos en `POST /api/auth/login`.
- Historial de pedidos del propio cliente: `/api/admin/orders` los lista para el administrador, pero el comprador no puede ver los suyos.
- El checkout de invitado sigue sobrescribiendo nombre y telefono de un cliente registrado si usa su correo.
- Las sesiones vencidas se ignoran al leerlas, pero nadie las borra; conviene sumarlas al job `inventory:release-expired`.

## 2. Panel administrativo

Funciona sobre el catalogo, el inventario y los pedidos, pero le falta:

- Crear productos desde la interfaz: `POST /api/admin/products` existe y no tiene formulario.
- Editar imagenes, categoria y coleccion de un producto, y crear o eliminar variantes.
- Registro de quien hizo cada cambio; hoy solo los ajustes de inventario dejan rastro con nota.
- Paginacion y busqueda: la pagina carga el catalogo y los pedidos completos de una sola vez.
- Reembolsar un pedido ya cobrado no devuelve unidades al inventario, porque su reserva ya se consumio.

## 3. Facetas del catalogo

Los desplegables de color y talla en `/shop` se arman con los productos de la pagina visible, asi que al filtrar por un color el desplegable deja de ofrecer los demas (hay que volver a "Todas" para cambiar). Solucion adecuada: un endpoint de facetas que devuelva colores y tallas del catalogo completo segun coleccion y categoria.

## 4. Imagenes y assets

- Las imagenes del catalogo son fichas de diseno generadas con IA, cargadas solo para probar la tienda. Hay que reemplazarlas por fotografia real de producto, en formato vertical, porque la tarjeta las recorta al centro con `object-fit: cover`.
- `apps/web/src/assets/hero-collection.png` pesa ~2 MB, entra en el bundle y solo se usa como respaldo del hero cuando no hay coleccion destacada; conviene comprimirla o eliminarla.
- No se sirven varios tamanos ni formatos modernos de imagen.

## 5. Vulnerabilidades de dependencias

`npm audit` reporta 4 moderadas, todas heredadas de `esbuild` via `drizzle-kit`. `npm audit fix --force` implica un downgrade incompatible de `drizzle-kit`; no se aplico.

## 6. Producto todavia no empezado

Pasarela de pago, envios y costos, correos transaccionales y contenido editorial real (textos y colecciones definitivas).
