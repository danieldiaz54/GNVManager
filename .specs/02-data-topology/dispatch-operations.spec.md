# Especificación Técnica: Despacho, Aforos y Topología Física de Activos (Dominio 02)
**Código de Especificación:** `SPEC-DOM-002`  
**Estado:** `FROZEN (Hito 1 - Piloto Sabanas)`  
**Autores:** `@domain-architect` & `@data-architect`  
**Revisor QA:** `@qa-verifier`  
**Única Fuente de Verdad:** `.specs/02-data-topology/dispatch-operations.spec.md`

---

## 1. Resumen Ejecutivo y Propósito
El propósito del **Dominio de Despacho y Topología Física** es modelar la jerarquía de activos industriales (estaciones, manifolds, módulos/racks de 11 y 12 cilindros), garantizar el ciclo de vida y seguridad de los cilindros (pruebas hidrostáticas vigentes) y gobernar las operaciones físicas de cargue y descargue bajo reglas de flujo bidireccional estrictas.

---

## 2. Modelado de Activos Físicos

### 2.1 Módulos / Canastas Portacilindros (`ModularRack`)
Activos móviles modulares montados sobre tráileres de transporte carretero presurizado.
1. **Configuración Batería 11 Cilindros (`ELEVEN_CYLINDER_13497L`):**
   - Cilindros: 11 unidades.
   - Volumen Geométrico Nominal: $13,497.000\text{ L}$ ($13.497\text{ m}^3$).
   - Volumen unitario por cilindro: $1,227.000\text{ L}$.
   - Presión máxima de trabajo: $250.00\text{ bar}$.
   - Presión de prueba hidrostática del manifold: $375.00\text{ bar}$.
2. **Configuración Batería 12 Cilindros (`TWELVE_CYLINDER_26950L`):**
   - Cilindros: 12 unidades de alta capacidad.
   - Volumen Geométrico Nominal: $26,950.000\text{ L}$ ($26.950\text{ m}^3$).
   - Volumen unitario por cilindro: $2,245.833\text{ L}$.
   - Presión máxima de trabajo: $250.00\text{ bar}$.
   - Presión de prueba hidrostática del manifold: $375.00\text{ bar}$.

---

## 3. Reglas Inviolables de Negocio (Business Rules)

### 3.1 Regla `BR-DISPATCH-001`: Invariante de Flujo Bidireccional
La física de transferencia de gas impone que la direccionalidad del flujo determine los deltas admisibles de presión y masa:
- **Operación de Cargue (`LOADING_DISPATCH`):**
  - Condición de Presión: $P_{\text{final}} > P_{\text{inicial}}$.
  - Condición de Masa: $\Delta m = m_{\text{final}} - m_{\text{inicial}} > 0$.
  - Si $P_{\text{final}} \le P_{\text{inicial}}$ o $\Delta m \le 0$, lanzar `InvalidFlowDirectionException`: *"En una operación de cargue la presión final y masa transferida deben ser estrictamente superiores a las condiciones iniciales"*.
- **Operación de Descargue (`UNLOADING_RECEIPT`):**
  - Condición de Presión: $P_{\text{inicial}} > P_{\text{final}}$.
  - Condición de Masa: $\Delta m = m_{\text{final}} - m_{\text{inicial}} < 0$.
  - Si $P_{\text{inicial}} \le P_{\text{final}}$ o $\Delta m \ge 0$, lanzar `InvalidFlowDirectionException`: *"En una operación de descargue la presión inicial debe ser superior a la presión final de entrega"*.

---

### 3.2 Regla `BR-DISPATCH-002`: Integridad de Cilindros y Vigencia de Prueba Hidrostática
Antes de conectar cualquier módulo/rack a un manifold de compresión o descargue:
1. Todos los cilindros individuales del rack deben tener registro de prueba hidrostática.
2. Ningún cilindro puede tener la fecha de vencimiento de su prueba hidrostática menor a la fecha actual de la operación:
   $$\text{nextHydrostaticDueDate}_i \ge \text{operationDate}, \quad \forall i \in \{1, \dots, N\}$$
3. Si al menos un cilindro tiene la prueba vencida, la operación debe ser bloqueada inmediatamente arrojando `ExpiredHydrostaticTestException`:
   *"El rack contiene cilindros con prueba hidrostática vencida (Serial: XXXXXX). Conexión a manifold rechazada por seguridad industrial."*

---

### 3.3 Regla `BR-DISPATCH-003`: Certificación de Aforo en Sabanas Post-Llenado
Al finalizar un cargue en la estación Sabanas (`ST-SABANAS`):
1. Se evalúa la presión estabilizada proyectada tras enfriamiento isocórico $P_{\text{estabilizada}}$:
   - Si $P_{\text{estabilizada}} \ge 230.00\text{ bar} \implies$ Estado `CERTIFIED_AFT` y despacho autorizado.
   - Si $P_{\text{estabilizada}} < 230.00\text{ bar} \implies$ Estado `REJECTED_UNDERPRESSURE` y despacho retenido en patio para recarga o enfriamiento.

---

### 3.4 Regla `BR-DISPATCH-004`: Conservación de Masa y Balance Neto
Toda operación de cargue o descargue debe calcular y registrar:
$$\begin{aligned}
\Delta m &= |m_{\text{corte}} - m_{\text{inicial}}| \\
\Delta V_{\text{std}} &= |V_{\text{std, corte}} - V_{\text{std, inicial}}|
\end{aligned}$$
Donde las masas iniciales y al corte son calculadas exclusivamente mediante el motor termodinámico de gases reales (`SPEC-DOM-001`).

---

## 4. Contratos Formales TypeScript (`backend/src/domain/`)

```typescript
export type RackType = 'ELEVEN_CYLINDER_13497L' | 'TWELVE_CYLINDER_26950L' | 'CUSTOM_MODULE';
export type OperationType = 'LOADING_DISPATCH' | 'UNLOADING_RECEIPT';
export type AforoCertificationStatus =
  | 'CERTIFIED_AFT'
  | 'REJECTED_UNDERPRESSURE'
  | 'NON_COMPLIANT'
  | 'PENDING_THERMAL_STABILITY';

export interface CylinderProps {
  id: string;
  serialNumber: string;
  waterCapacityLiters: number;
  tareWeightKg: number;
  manufacturingDate: Date;
  hydrostaticTestDate: Date;
  nextHydrostaticDueDate: Date;
}

export interface ModularRackProps {
  id: string;
  plateCode: string;
  rackType: RackType;
  nominalVolumeLiters: number;
  maxWorkingPressureBar: number;
  cylinders: CylinderProps[];
}

export interface DispatchOperationInput {
  consecutiveNumber: string;
  stationCode: string;
  operationType: OperationType;
  rack: ModularRackProps;
  chromatography: ChromatographyProfile;
  initialPressureBar: number;
  initialTemperatureK: number;
  cutoffPressureBar: number;
  cutoffTemperatureK: number;
  ambientTemperatureK: number;
  operationDate?: Date;
}
```

---

## 5. Criterios de Aceptación para QA (`@qa-verifier`)
1. **Rechazo por Prueba Hidrostática Vencida:** Crear un rack con 11 cilindros donde uno tenga `nextHydrostaticDueDate` en el pasado; intentar iniciar operación debe lanzar `ExpiredHydrostaticTestException`.
2. **Rechazo por Violación de Flujo en Cargue:** Si en un cargue $P_{\text{corte}} \le P_{\text{inicial}}$, debe arrojar `InvalidFlowDirectionException`.
3. **Rechazo por Violación de Flujo en Descargue:** Si en un descargue $P_{\text{inicial}} \le P_{\text{corte}}$, debe arrojar `InvalidFlowDirectionException`.
4. **Certificación en Sabanas:** Al ejecutar un cargue en `ST-SABANAS` con corte a $250\text{ bar}$ a $50^\circ\text{C}$ con temperatura ambiente de $28^\circ\text{C}$, comprobar que el pronóstico isocórico evalúe si $P_{\text{estabilizada}} \ge 230\text{ bar}$.
5. **Cálculo de Balance Neto:** Verificar que la masa neta transferida $\Delta m > 0$ en cargue y coincida con la diferencia de masa termodinámica.
