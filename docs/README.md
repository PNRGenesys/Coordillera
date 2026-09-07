# Documentacion de Cordillera

Esta carpeta es la fuente de referencia tecnica y funcional del proyecto.

| Documento | Contenido |
| --- | --- |
| [Arquitectura](./architecture.md) | Componentes, datos, cuentas, idiomas, administracion y decisiones tecnicas. |
| [API](./api.md) | Endpoints actuales, cuentas de cliente, rutas administrativas y contratos. |
| [Inventario](./inventory.md) | Reglas de stock, reservas y operaciones de inventario. |
| [Desarrollo](./development.md) | Configuracion local, comandos, migraciones y pruebas. |
| [Trabajo pendiente](./pending-work.md) | Lo que falta por hacer, solo tareas abiertas. |
| [Registro de cambios](./changelog.md) | Cambios incluidos en cada commit solicitado. |

## Norma de mantenimiento

Antes de cada commit solicitado se actualizaran los documentos afectados y se anadira una entrada en `changelog.md`. La documentacion se incluira en el mismo commit que el cambio que describe.

Lo que ya esta terminado se registra en `changelog.md`; `pending-work.md` conserva unicamente tareas abiertas.
