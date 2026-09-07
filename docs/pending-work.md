# Trabajo pendiente

Corte: 2026-09-06. Trabajo en `main`, sin commit. Solo se listan tareas abiertas; lo terminado vive en `docs/changelog.md`.

## 1. Panel administrativo

Las rutas `/api/admin/*` existen pero no tienen interfaz y siguen protegidas solo por el encabezado `x-admin-key`. Falta la interfaz y una autenticacion real con roles.

## 2. Cuentas de cliente

El inicio de sesion ya funciona, pero queda por hacer:

- Verificacion de correo y recuperacion de contrasena. Hoy cualquiera que conozca el correo de una compra de invitado puede reclamar esa cuenta.
- Limitacion de intentos en `POST /api/auth/login`.
- Historial de pedidos: no existe ninguna ruta que exija sesion, asi que el cliente no puede ver sus compras.
- El checkout de invitado sigue sobrescribiendo nombre y telefono de un cliente registrado si usa su correo.
- Las sesiones vencidas se ignoran al leerlas, pero nadie las borra; conviene sumarlas al job `inventory:release-expired`.

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
