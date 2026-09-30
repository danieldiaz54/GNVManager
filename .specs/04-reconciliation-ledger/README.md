# Dominio 04: Libro Mayor de Conciliación Comercial (Inventory & Sales Reconciliation)
**Estado:** `PLANIFICADO (Hito 3)`  
**Arquitecto Responsable:** `@data-architect` / `@integration-architect`

## Alcance
- Transacciones inmutables ACID cruzando masa/volumen normalizado transferido contra ventas dispensadas en EDS (`saleVolumeSm3`).
- Detección de mermas aparentes (delta térmico/compresibilidad) vs. mermas físicas reales (pérdidas, fugas).
- Alertas tempranas y balance de masa en tránsito.
