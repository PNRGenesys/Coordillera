# Desarrollo local

## Requisitos

- Node.js 22.12 o posterior (ver "Version de Node para las pruebas").
- npm 10 o posterior.
- Docker Desktop en ejecucion.

## Inicio

```powershell
npm.cmd install
Copy-Item apps/api/.env.example apps/api/.env
npm.cmd run db:up
npm.cmd run db:migrate --workspace=@cordillera/api
npm.cmd run db:seed    --workspace=@cordillera/api
npm.cmd run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- Base de datos: `localhost:5432`

La configuracion local de API esta en `apps/api/.env`. Nunca se deben versionar claves reales de produccion. Ademas de `DATABASE_URL`, acepta `SESSION_TTL_DAYS` (duracion de la cookie de sesion) y `PASSWORD_MIN_LENGTH`; ambas tienen valor por defecto.

## Panel de administracion

1. Registrar la cuenta desde la tienda (`/account`).
2. Ejecutar `npm.cmd run admin:grant --workspace=@cordillera/api -- <correo>`.
3. Volver a cargar la tienda: aparece el enlace `Admin` en la cabecera y `/admin` queda disponible.

El rol solo se otorga por linea de comandos; no hay forma de ascender una cuenta desde la interfaz.

## Comandos frecuentes

| Comando | Uso |
| --- | --- |
| `npm.cmd run dev` | Inicia frontend y API. |
| `npm.cmd run build` | Compila ambos proyectos. |
| `npm.cmd run typecheck` | Comprueba tipos. |
| `npm.cmd run test` | Ejecuta las pruebas de ambos proyectos. |
| `npm.cmd run test --workspace=@cordillera/web` | Pruebas unitarias del frontend (Vitest, entorno `jsdom`). |
| `npm.cmd run test --workspace=@cordillera/api` | Pruebas de integracion de la API (Vitest, entorno `node`). Requieren PostgreSQL en ejecucion. |
| `npm.cmd run db:up` | Inicia PostgreSQL. |
| `npm.cmd run db:down` | Detiene PostgreSQL. |
| `npm.cmd run db:generate --workspace=@cordillera/api` | Genera migracion tras editar el esquema. |
| `npm.cmd run db:migrate --workspace=@cordillera/api` | Aplica migraciones. |
| `npm.cmd run db:seed --workspace=@cordillera/api` | Carga datos de demostracion idempotentes (productos, colecciones, inventario). |
| `npm.cmd run db:studio --workspace=@cordillera/api` | Abre Drizzle Studio. |
| `npm.cmd run inventory:release-expired --workspace=@cordillera/api` | Libera reservas de inventario vencidas (programar cada pocos minutos en produccion). |
| `npm.cmd run admin:grant --workspace=@cordillera/api -- <correo>` | Convierte en administrador una cuenta ya registrada en la tienda. |

### Version de Node para las pruebas

Las pruebas requieren Node 22.12 o posterior (verificadas en Node 24.19). Con Node 22.11 o anterior, `vitest` no arranca: Vite 8 usa `rolldown` y npm omite su binding nativo cuando el motor de Node no cumple `>=22.12.0`, y `jsdom@30` arrastra dependencias ESM que fallan al cargarse en esa combinacion de versiones.

### Pruebas de la API

Son pruebas de integracion contra la base de datos local: crean sus propios producto y clientes de prueba, ejercitan el flujo y limpian sus datos al terminar. Necesitan `apps/api/.env` con `DATABASE_URL` y PostgreSQL levantado (`db:up` + `db:migrate`). Corren en serie (`fileParallelism: false`) porque comparten una sola base.

## Cambio de base de datos

1. Editar `apps/api/src/db/schema.ts`.
2. Ejecutar `db:generate`.
3. Revisar el SQL generado en `apps/api/drizzle/`.
4. Ejecutar `db:migrate` localmente.
5. Actualizar los documentos afectados y el registro de cambios.

## Pruebas visuales

Playwright no es dependencia del repositorio: se instala aparte cuando hace falta recorrer la tienda y comparar capturas.

```powershell
npm.cmd init -y
npm.cmd install playwright
npx.cmd playwright install chromium
```

El recorrido habitual cubre inicio, catalogo, coleccion, detalle, producto agotado, carrito, checkout, cuenta y panel de administracion, en 1440x1000 y 390x844, revisando que no haya errores de consola ni imagenes rotas. Para el idioma, la comprobacion util es cargar cada pagina en español, cambiar a ingles y comparar el texto: lo que no cambia deberia ser solo la marca, los numeros y las tallas por letra.

## Datos de demostracion

`npm.cmd run db:seed --workspace=@cordillera/api` carga datos idempotentes: productos activos, colecciones, categorias, guias de talla, inventario y movimientos. Uno de los productos queda deliberadamente con stock 0 (para probar el estado agotado) y otro en `preorder`. Los productos que ya no estan en el seed quedan archivados. Sin ejecutar el seed, el catalogo muestra su estado vacio.

Las imagenes del catalogo son fichas de diseno generadas con IA y sirven unicamente para probar la tienda (ver `docs/pending-work.md`).
