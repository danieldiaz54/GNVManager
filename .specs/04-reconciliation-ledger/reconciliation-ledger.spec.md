# Especificación Técnica: Libro Mayor de Conciliación Comercial y Mermas (Dominio 04)
**Código de Especificación:** `SPEC-DOM-004`  
**Estado:** `FROZEN (Hito 1 - Base Inmutable)`  
**Autores:** `@data-architect` & `@integration-architect`  
**Revisor QA:** `@qa-verifier`  
**Única Fuente de Verdad:** `.specs/04-reconciliation-ledger/reconciliation-ledger.spec.md`

---

## 1. Resumen Ejecutivo y Propósito
El **Libro Mayor de Conciliación Comercial (`ReconciliationLedger`)** es el núcleo de auditoría forense e inmutable del ecosistema GNVManager. Resuelve la discrepancia entre el balance termodinámico de gases reales a alta presión (masa y volumen normalizado $Sm^3$), la energía contractual transferida ($MMBTU$) y las ventas físicas dispensadas en estaciones de servicio (EDS).

Su objetivo crítico es:
1. Registrar transacciones en un ledger de **solo inserción (Append-Only)** selladas criptográficamente con hash SHA-256 encadenado.
2. Segregar con precisión matemática la **merma aparente** (por contracción térmica o descompresión post-corte) de la **merma física real** (pérdida, fuga o discrepancia volumétrica en tránsito).
3. Detectar anomalías operativas y emitir alertas tempranas de pérdida física.

---

## 2. Modelo de Datos Inmutable y Encadenamiento Criptográfico

### 2.1 Estructura del Asiento del Ledger (`LedgerEntry`)
Cada transacción en el ledger contiene:
- `transactionIndex`: Índice secuencial monótono estricto ($1, 2, 3, \dots, N$).
- `transactionType`:
  - `STATION_DISPATCH`: Cargue de módulo en estación de compresión (ej. Sabanas).
  - `STATION_RECEIPT`: Descargue de módulo en EDS receptora (ej. Medellín).
  - `STATION_SALE_DISPENSED`: Venta dispensada en surtidor vehicular.
  - `MERMA_APPARENT_SHRINK`: Ajuste contable por merma aparente térmica post-corte.
  - `MERMA_PHYSICAL_LOSS`: Registro de merma física real confirmada en ruta o estación.
- `facilityCode`: Código del nodo (`ST-SABANAS`, `EDS-MEDELLIN`).
- `dispatchConsecutive`: Consecutivo de la operación asociada.
- `energyMmbtu`: Energía equivalente en MMBTU.
- `standardVolumeSm3`: Volumen estándar normalizado ($Sm^3$).
- `massKg`: Masa física real del gas ($kg$).
- `previousRecordHash`: Hash SHA-256 del registro inmediatamente anterior. El registro inicial ($index=1$) utiliza el valor canónico `'GENESIS_RECORD_GNV_MANAGER'`.
- `recordHash`: Hash SHA-256 criptográfico del registro actual.
- `recordedAt`: Estampa de tiempo inmutable.

### 2.2 Algoritmo de Hashing Canónico
$$\text{recordHash} = \text{SHA256}\left( \text{index} \parallel \text{previousHash} \parallel \text{type} \parallel \text{facilityCode} \parallel \text{dispatchConsecutive} \parallel \text{massKg} \parallel \text{sm3} \parallel \text{mmbtu} \parallel \text{recordedAt} \right)$$

Cualquier alteración a un campo numérico o estampa de un registro previo invalida el hash del registro y de todos los registros subsecuentes.

---

## 3. Reglas Inviolables de Negocio (Business Rules)

### 3.1 Regla `BR-LEDGER-001`: Integridad Criptográfica de la Cadena
1. El método de validación `verifyLedgerIntegrity()` debe recorrer secuencialmente todos los registros y validar:
   - Que cada `transactionIndex` sea exactamente el consecutivo anterior $+ 1$.
   - Que el `previousRecordHash` de cada asiento coincida exactamente con el `recordHash` del asiento previo.
   - Que al recomputar el hash de cada asiento, coincida bit a bit con `recordHash`.
2. Si se detecta cualquier discrepancia, lanzar `LedgerTamperedException` con el índice del asiento vulnerado.

---

### 3.2 Regla `BR-LEDGER-002`: Conversión Energética a MMBTU
El gas natural se comercializa contractualmente en unidades energéticas MMBTU. La energía de una cantidad en $Sm^3$ se determina a partir del poder calorífico superior (HHV) de la cromatografía activa:
$$1\text{ }Sm^3 = 35.3146667\text{ scf}$$
$$E_{\text{BTU}} = V_{\text{Sm3}} \times 35.3146667 \times HHV_{[\text{BTU/scf}]}$$
$$E_{\text{MMBTU}} = \frac{E_{\text{BTU}}}{1,000,000}$$

---

### 3.3 Regla `BR-LEDGER-003`: Segregación de Merma Aparente vs Merma Física Real
Cuando un módulo es cargado en Sabanas y descargado en Medellín:
1. **Merma Aparente Térmica ($\text{Merma}_{\text{aparente}}$):**
   $$\Delta V_{\text{aparente}} = V_{\text{corte}} - V_{\text{estabilizada}}$$
   Ocurre sin pérdida de masa ($\Delta m = 0$). Es una contracción física del volumen por disipación del calor de compresión hacia temperatura ambiente. No constituye pérdida económica ni robo de combustible.
2. **Merma Física Real ($\text{Merma}_{\text{física}}$):**
   $$\Delta m_{\text{tránsito}} = m_{\text{cargada, Sabanas}} - m_{\text{recibida, EDS}}$$
   $$\text{Porcentaje de Merma} = \frac{\Delta m_{\text{tránsito}}}{m_{\text{cargada}}} \times 100\%$$
   - Si $\text{Porcentaje} \le 0.50\% \implies$ Merma normal tolerada por purga de mangueras y precisión de instrumentos.
   - Si $\text{Porcentaje} > 0.50\% \implies$ **Alerta de Anomalía Física** (`ANOMALY_PHYSICAL_LOSS`), indicando posible fuga en válvulas del tráiler o sustracción de producto en carretera.

---

## 4. Contratos Formales TypeScript (`backend/src/domain/`)

```typescript
export type LedgerTransactionType =
  | 'STATION_DISPATCH'
  | 'STATION_RECEIPT'
  | 'STATION_SALE_DISPENSED'
  | 'MERMA_APPARENT_SHRINK'
  | 'MERMA_PHYSICAL_LOSS';

export interface LedgerEntryProps {
  transactionIndex: number;
  transactionType: LedgerTransactionType;
  facilityCode: string;
  dispatchConsecutive?: string;
  energyMmbtu: number;
  standardVolumeSm3: number;
  massKg: number;
  apparentMermaSm3?: number;
  physicalMermaSm3?: number;
  mermaPercentage?: number;
  previousRecordHash: string;
  recordHash: string;
  recordedAt: Date;
}

export interface ShrinkageAnalysisResult {
  dispatchConsecutive: string;
  receiptConsecutive: string;
  loadedMassKg: number;
  receivedMassKg: number;
  physicalLossMassKg: number;
  lossPercentage: number;
  isLossTolerated: boolean; // lossPercentage <= 0.50%
  status: 'OPTIMAL' | 'TOLERATED_PURGE' | 'ANOMALY_PHYSICAL_LOSS';
  apparentThermalLossSm3: number;
}
```

---

## 5. Criterios de Aceptación para QA (`@qa-verifier`)
1. **Verificación de Cadena Hash:** Crear 5 asientos consecutivos. Modificar la masa de un asiento intermedio debe provocar que `verifyLedgerIntegrity()` falle detectando el fraude.
2. **Cálculo de MMBTU:** Para perfil Bonga-Mamey con $HHV = 1030.5\text{ BTU/scf}$, $1000\text{ }Sm^3$ debe arrojar exactamente $\approx 36.39\text{ MMBTU}$.
3. **Detección de Merma Física vs Aparente:**
   - Caso Normal: Cargue de $2500\text{ kg}$, recibo de $2495\text{ kg}$ (pérdida $0.20\%$) $\implies$ Estado `TOLERATED_PURGE`.
   - Caso Anómalo: Cargue de $2500\text{ kg}$, recibo de $2450\text{ kg}$ (pérdida $2.00\%$) $\implies$ Estado `ANOMALY_PHYSICAL_LOSS` y alerta de merma física.
