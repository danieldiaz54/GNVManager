# Topology Ledger Specification

## 1. Módulos y Racks (Flexibilidad de Posiciones)
- Soporte nativo para racks de **11 y 12 cilindros**.
- **División volumétrica uniforme:** Cuando se introduce la capacidad total del rack (Ej. 13,497 L), el volumen geométrico asignado a cada cilindro individual es `Capacidad Total / Cantidad de Cilindros Activos`.

## 2. Direccionalidad del Flujo (Cargue / Descargue)
- Define el enum `OperationType` con los valores `CARGUE` y `DESCARGUE`.
- **Cargue (Loading):** 
  - Presión inicial ($P_i$): Talón remanente (ej. 20–40 bar).
  - Presión final ($P_f$): Corte nominal del compresor (hasta ~260 bar).
- **Descargue (Unloading):**
  - Presión inicial ($P_i$): Llegada en alta (ej. 250 bar).
  - Presión final ($P_f$): Remanente muerto al desconectar (ej. 20–30 bar).
- **Columna calculada:** Se debe proveer el `deltaPressureBar` ($\Delta P = P_f - P_i$).
