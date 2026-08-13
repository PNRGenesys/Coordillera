# Inventario

## Principios

El stock se administra por variante, no por producto. Una camiseta talla M y una talla L son existencias distintas.

Cada variante tiene un `inventory_item` con:

- `on_hand`: unidades fisicamente disponibles.
- `reserved`: unidades temporalmente retenidas por pedidos pendientes de pago.
- `available`: valor calculado `on_hand - reserved`.
- `reorder_point`: nivel que debe disparar una alerta de reposicion.

## Movimientos

`inventory_movements` es el historial auditable de cambios. Sus tipos son `restock`, `adjustment`, `reservation`, `release`, `sale` y `return`.

No se deben editar ni borrar movimientos existentes. Cada correccion debe crear un movimiento nuevo.

## Reserva de stock

Al crear un pedido, la API ejecuta una transaccion y aumenta `reserved` solo si existe disponibilidad suficiente. La condicion atomica impide que dos compras concurrentes vendan la misma unidad.

La reserva expira 20 minutos despues de creada. En produccion debe ejecutarse regularmente:

```powershell
npm.cmd run inventory:release-expired --workspace=@coordillera/api
```

Ese proceso libera la reserva, registra un movimiento `release` y permite que el stock vuelva a estar disponible.

## Flujo futuro tras incluir pagos

1. Se crea pedido `pending_payment` y se reserva inventario.
2. El proveedor de pagos confirma el pago mediante webhook verificado.
3. El pedido cambia a `paid`; la reserva se transforma en salida `sale` y disminuye `on_hand`.
4. Si falla, vence o se cancela el pago, se crea `release` y disminuye `reserved`.

