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
- No permite editar las traducciones: al cambiar un nombre o una descripcion solo se modifica la copia base, y la version en espanol sigue viniendo del seed.

## 3. Idiomas

La tienda funciona en español e ingles, pero:

- El checkout y las rutas administrativas no traducen sus respuestas; solo catalogo y carrito aceptan `lang`.
- Los nombres de coleccion `Wildspirit` y de producto en ingles se dejaron sin traducir a proposito por ser nombres de marca; conviene confirmarlo con el negocio.
- No hay forma de cargar traducciones fuera del seed (ver el punto anterior sobre el panel).

## 4. Facetas del catalogo

Los desplegables de color y talla en `/shop` se arman con los productos de la pagina visible, asi que al filtrar por un color el desplegable deja de ofrecer los demas (hay que volver a "Todas" para cambiar). Solucion adecuada: un endpoint de facetas que devuelva colores y tallas del catalogo completo segun coleccion y categoria.

## 5. Imagenes y assets

- Las imagenes del catalogo son fichas de diseno generadas con IA, cargadas solo para probar la tienda. Hay que reemplazarlas por fotografia real de producto, en formato vertical, porque la tarjeta las recorta al centro con `object-fit: cover`.
- No se sirven varios tamanos ni formatos modernos de imagen.
- `collections.heroImageUrl` sigue guardandose y devolviendose, pero ya no se muestra en ninguna parte desde que el hero del inicio pasa a ser el banner de marca. Su lugar natural seria la cabecera de `/shop/:collection`.
- Falta renombrar la carpeta local del proyecto y el repositorio en GitHub, que siguen como `Coordillera`. De la carpeta sale ademas el nombre del contenedor (`coordillera-database-1`).

## 6. Despliegue

Hoy no existe: todo corre en local (`npm run dev`) contra el PostgreSQL de `docker-compose.yml`. Falta decidir donde vive la tienda y montar el despliegue continuo.

Opciones razonables para el tamano actual, de menos a mas operacion:

| Opcion | Encaje |
| --- | --- |
| Railway, Render o Fly.io | Despliegan la API y la base gestionada desde el repositorio, con poca configuracion. Lo mas directo para empezar. |
| Cloud Run o App Runner con una base gestionada | Contenedor sin servidor, escala a cero y cobra por uso. Mas piezas que armar. |
| Kubernetes | No hace falta. Orquesta contenedores en varios nodos y aqui hay un contenedor; solo se justificaria con varias replicas, autoescalado fino o despliegues sin caida. |

El frontend es estatico (`npm run build` deja `apps/web/dist`), asi que puede ir en cualquier CDN. Antes de publicar hacen falta los pendientes de seguridad de `docs/architecture.md`: gestion de secretos, limitacion de tasa, observabilidad y copias de seguridad.

## 7. Vulnerabilidades de dependencias

`npm audit` reporta 4 moderadas, todas heredadas de `esbuild` via `drizzle-kit`. `npm audit fix --force` implica un downgrade incompatible de `drizzle-kit`; no se aplico.

## 8. Producto todavia no empezado

Pasarela de pago, envios y costos, correos transaccionales y contenido editorial real (textos y colecciones definitivas).
