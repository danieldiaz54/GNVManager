# Especificación Técnica: Motor Termodinámico de Gases Reales (Dominio 01)
**Código de Especificación:** `SPEC-DOM-001`  
**Estado:** `FROZEN (Hito 1 - Piloto Sabanas)`  
**Autor:** `@domain-architect`  
**Revisor QA:** `@qa-verifier`  
**Única Fuente de Verdad:** `.specs/01-domain-thermo/thermodynamic-engine.spec.md`

---

## 1. Resumen Ejecutivo y Propósito
El propósito del **Motor Termodinámico** es proveer un cálculo determinista, de precisión metrológica e independiente de infraestructura para el comportamiento de Gas Natural Comprimido (GNC/GNV) sometido a presiones extremas (hasta 250 - 350 bar) y rangos térmicos operativos (270 K a 340 K).

El motor resuelve:
1. El factor de compresibilidad real $Z(P, T, \vec{y})$.
2. La masa física total $m$ y el volumen estándar normalizado $V_{\text{std}}$ ($Sm^3$).
3. La predicción isocórica de enfriamiento térmico post-corte y caída de presión.
4. La certificación regulatoria e inviolable de aforo en la estación Sabanas ($P_{\text{estabilizada}} \ge 230.0$ bar).

---

## 2. Modelado Matemático y Ecuaciones de Estado (EOS)

### 2.1 Ecuación de Estado de Gas Real
$$\begin{aligned}
P \cdot V &= Z \cdot n \cdot R \cdot T \\
m &= \frac{P \cdot V \cdot M_w}{Z(P, T, \vec{y}) \cdot R \cdot T}
\end{aligned}$$

Donde:
- $P$: Presión absoluta del gas [$\text{bar}$ o $\text{Pa}$] ($1 \text{ bar} = 10^5 \text{ Pa} = 0.1 \text{ MPa}$).
- $V$: Volumen geométrico del contenedor / batería [$\text{L}$ o $\text{m}^3$] ($1 \text{ m}^3 = 1000 \text{ L}$).
- $T$: Temperatura absoluta [$\text{K}$] ($T[\text{K}] = T[^\circ\text{C}] + 273.15$).
- $R$: Constante universal de los gases $= 8.314462618 \times 10^{-2} \text{ bar}\cdot\text{L}/(\text{mol}\cdot\text{K})$.
- $M_w$: Peso molecular aparente de la mezcla de gas $[\text{g/mol} = \text{kg/kmol}]$, calculado a partir de la cromatografía:
  $$M_w = \sum_{i=1}^{N} y_i \cdot M_{w,i}$$
- $Z(P, T, \vec{y})$: Factor de compresibilidad supercompresible (adimensional).

---

### 2.2 Factor de Compresibilidad: Formulación Dranchuk-Abu-Kassem (DAK) / AGA-8
El cálculo de $Z$ se modela en función de la densidad reducida $\rho_r$ y la temperatura pseudorreducida $T_{pr}$, basado en la ecuación de 11 constantes tipo Benedict-Webb-Rubin modificada:

$$Z(\rho_r, T_{pr}) = 1 + \left(A_1 + \frac{A_2}{T_{pr}} + \frac{A_3}{T_{pr}^3} + \frac{A_4}{T_{pr}^4} + \frac{A_5}{T_{pr}^5}\right)\rho_r + \left(A_6 + \frac{A_7}{T_{pr}} + \frac{A_8}{T_{pr}^2}\right)\rho_r^2 - A_9\left(\frac{A_7}{T_{pr}} + \frac{A_8}{T_{pr}^2}\right)\rho_r^5 + A_{10}\left(1 + A_{11}\rho_r^2\right)\left(\frac{\rho_r^2}{T_{pr}^3}\right)\exp\left(-A_{11}\rho_r^2\right)$$

Relación fundamental entre presión pseudorreducida $P_{pr}$, densidad reducida $\rho_r$ y $Z$:
$$\rho_r = 0.27 \frac{P_{pr}}{Z \cdot T_{pr}}$$

Donde las presiones y temperaturas pseudorreducidas se obtienen mediante las propiedades pseudocríticas de la mezcla:
$$P_{pr} = \frac{P}{P_{pc}}, \quad T_{pr} = \frac{T}{T_{pc}}$$

#### Constantes Canónicas DAK (NIST / SPE):
| Constante | Valor |
| :--- | :--- |
| $A_1$ | $0.3265$ |
| $A_2$ | $-1.0700$ |
| $A_3$ | $-0.5339$ |
| $A_4$ | $0.01569$ |
| $A_5$ | $-0.05165$ |
| $A_6$ | $0.5475$ |
| $A_7$ | $-0.7361$ |
| $A_8$ | $0.1844$ |
| $A_9$ | $0.1056$ |
| $A_{10}$ | $0.6134$ |
| $A_{11}$ | $0.7210$ |

---

### 2.3 Solución Numérica mediante Newton-Raphson
Para encontrar la raíz de densidad reducida $\rho_r$ a partir de $P_{pr}$ y $T_{pr}$, se plantea la función objetivo:
$$f(\rho_r) = Z(\rho_r, T_{pr}) - 0.27 \frac{P_{pr}}{\rho_r \cdot T_{pr}} = 0$$

Y su derivada analítica respecto a $\rho_r$:
$$f'(\rho_r) = \frac{\partial Z(\rho_r, T_{pr})}{\partial \rho_r} + 0.27 \frac{P_{pr}}{\rho_r^2 \cdot T_{pr}}$$

Donde:
$$\begin{aligned}
\frac{\partial Z}{\partial \rho_r} &= \left(A_1 + \frac{A_2}{T_{pr}} + \frac{A_3}{T_{pr}^3} + \frac{A_4}{T_{pr}^4} + \frac{A_5}{T_{pr}^5}\right) + 2\left(A_6 + \frac{A_7}{T_{pr}} + \frac{A_8}{T_{pr}^2}\right)\rho_r - 5 A_9\left(\frac{A_7}{T_{pr}} + \frac{A_8}{T_{pr}^2}\right)\rho_r^4 \\
&\quad + 2 A_{10} \frac{\rho_r}{T_{pr}^3} \exp\left(-A_{11}\rho_r^2\right) \left[ 1 + A_{11}\rho_r^2 - A_{11}^2\rho_r^4 \right]
\end{aligned}$$

#### Parámetros del Solucionador:
- **Punto de inicio:** $\rho_{r, 0} = 0.27 \frac{P_{pr}}{T_{pr}}$
- **Criterio de parada (Convergencia):** $|\rho_{r, k+1} - \rho_{r, k}| < 10^{-7}$
- **Máximo de iteraciones:** $100$
- **Protección contra divergencia:** Si $f'(\rho_r) = 0$ o $\text{iter} \ge 100$, lanzar `ThermodynamicDivergenceException`.

---

## 3. Modelado Dinámico de Cromatografías

### 3.1 Invariantes del Value Object `ChromatographyProfile`
1. Prohibido quemar composiciones fijas o factores $Z$ constantes en código de negocio.
2. La suma de las fracciones molares debe cumplir:
   $$\left| \sum_{i=1}^{N} y_i - 1.0 \right| \le 1.0 \times 10^{-5}$$
3. Cada fracción $y_i$ debe ser no negativa: $y_i \ge 0$.

### 3.2 Reglas de Mezcla de Stewart-Burkhardt-Voo (SBV) para Propiedades Pseudocríticas
Para gases naturales con presencia de no-hidrocarburos ($CO_2, N_2$), las propiedades pseudocríticas se calculan:
$$J = \frac{1}{3} \sum y_i \left(\frac{T_{c,i}}{P_{c,i}}\right) + \frac{2}{3} \left[ \sum y_i \left(\frac{T_{c,i}}{P_{c,i}}\right)^{0.5} \right]^2$$
$$K = \sum y_i \left(\frac{T_{c,i}}{P_{c,i}^{0.5}}\right)$$
$$T_{pc} = \frac{K^2}{J}, \quad P_{pc} = \frac{T_{pc}}{J}$$

Alternativa aceptada para gas seco: Regla lineal de Kay:
$$T_{pc} = \sum y_i \cdot T_{c,i}, \quad P_{pc} = \sum y_i \cdot P_{c,i}$$

### 3.3 Perfiles de Referencia Obligatorios en Pruebas
1. **Perfil Bonga-Mamey (Gas Seco de la Costa):**
   - $CH_4$ (Metano): $96.3666\%$ ($0.963666$)
   - $C_2H_6$ (Etano): $1.8500\%$ ($0.018500$)
   - $C_3H_8$ (Propano): $0.4200\%$ ($0.004200$)
   - $i\text{-}C_4H_{10} + n\text{-}C_4H_{10}$: $0.1500\%$ ($0.001500$)
   - $CO_2$ (Dióxido de Carbono): $0.5634\%$ ($0.005634$)
   - $N_2$ (Nitrógeno): $0.6500\%$ ($0.006500$)
2. **Perfil Candilejas (Ultra Seco):**
   - $CH_4$: $99.1685\%$ ($0.991685$)
   - $CO_2$: $0.3500\%$ ($0.003500$)
   - $N_2$: $0.4815\%$ ($0.004815$)
3. **Perfil Gas Rico del Llano (Alto poder calorífico):**
   - $CH_4$: $86.5000\%$ ($0.865000$)
   - $C_2H_6$: $7.5000\%$ ($0.075000$)
   - $C_3H_8$: $3.8000\%$ ($0.038000$)
   - $C_4+$: $1.2000\%$ ($0.012000$)
   - $CO_2 + N_2$: $1.0000\%$ ($0.010000$)

---

## 4. Normalización a Condiciones Estándar ($Sm^3$)
El volumen estándar ($Sm^3$) se evalúa a las condiciones de custodia contractual:
- $P_{\text{std}} = 1.01325 \text{ bar}$ ($1 \text{ atm}$).
- $T_{\text{std}} = 288.15 \text{ K}$ ($15^\circ\text{C}$).
- $Z_{\text{std}} = Z(P_{\text{std}}, T_{\text{std}}, \vec{y}) \approx 0.9997$.

$$V_{\text{std}} = V \cdot \left(\frac{P}{P_{\text{std}}}\right) \cdot \left(\frac{T_{\text{std}}}{T}\right) \cdot \left(\frac{Z_{\text{std}}}{Z(P, T, \vec{y})}\right)$$

---

## 5. Dinámica Isocórica Post-Llenado (Thermal Decay)

### 5.1 Fenómeno Físico
Durante el despacho a alta tasa de flujo, la compresión rápida y el estrangulamiento producen un calentamiento adiabático en los cilindros ($T_{\text{corte}} > T_{\text{amb}}$, típicamente $315 \text{ K} - 335 \text{ K}$). Al cerrarse las válvulas, el volumen permanece estrictamente constante ($V = \text{cte}$). El calor se transfiere al ambiente siguiendo la ley de enfriamiento de Newton:

$$T(t) = T_{\text{amb}} + (T_{\text{corte}} - T_{\text{amb}}) \cdot e^{-t / \tau}$$

Donde:
- $\tau$: Constante de tiempo de enfriamiento térmico del módulo/rack (determinado por la masa metálica de los cilindros y coeficiente de convección, típicamente $\tau \approx 1800 - 3600 \text{ s}$).
- A $t \to \infty$ (o reposo de 2 horas), $T \to T_{\text{amb}}$.

### 5.2 Pronóstico de Presión Estabilizada
Dado que la masa $m$ y el volumen $V$ son constantes, la densidad molar permanece invariable:
$$\rho_{\text{molar}} = \frac{P_{\text{corte}}}{Z(P_{\text{corte}}, T_{\text{corte}}) \cdot R \cdot T_{\text{corte}}} = \frac{P_{\text{estabilizada}}}{Z(P_{\text{estabilizada}}, T_{\text{amb}}) \cdot R \cdot T_{\text{amb}}}$$

El algoritmo de pronóstico debe resolver la presión $P_{\text{estabilizada}}$ que satisfaga dicha igualdad para $T = T_{\text{amb}}$.

---

## 6. Regla Inviolable de Negocio: Certificación de Aforo en Sabanas

### 6.1 Regla de Negocio `BR-AFORO-001`
> **Certificación de Aforo en Sabanas:**
> Todo despacho o cargue de módulo/rack en la estación Sabanas para transporte en carretera hacia EDS **SOLO ES VÁLIDO Y CERTIFICABLE** si su presión estabilizada proyectada (o medida tras reposo) cumple:
>
> $$P_{\text{estabilizada}} \ge 230.0 \text{ bar}$$
>
> Si $P_{\text{estabilizada}} < 230.0 \text{ bar}$, el aforo queda en estado `RECHAZADO_PRESION_INSUFICIENTE` y el despacho queda bloqueado en el sistema.

### 6.2 Regla de Direccionalidad de Flujos `BR-FLOW-002`
- **Operación de Cargue:** Requiere $P_{\text{final}} > P_{\text{inicial}}$ y $\Delta m > 0$.
- **Operación de Descargue:** Requiere $P_{\text{inicial}} > P_{\text{final}}$ y $\Delta m < 0$.

---

## 7. Contratos Formales de TypeScript (`backend/src/domain/`)

```typescript
export interface MolarFraction {
  component: 'CH4' | 'C2H6' | 'C3H8' | 'iC4' | 'nC4' | 'iC5' | 'nC5' | 'C6plus' | 'N2' | 'CO2' | 'H2S' | 'He';
  fraction: number; // 0.0 to 1.0
}

export interface ChromatographyProfile {
  id: string;
  name: string; // ej: 'Bonga-Mamey', 'Candilejas', 'Gas Rico Llano'
  fractions: MolarFraction[];
  molecularWeight: number; // g/mol
  pseudoCriticalPressureBar: number; // bar
  pseudoCriticalTemperatureK: number; // K
  higherHeatingValueBtuScf?: number; // BTU/scf
}

export interface ThermodynamicState {
  pressureBar: number;      // Presión manométrica o absoluta especificada
  temperatureK: number;     // Temperatura absoluta [K]
  volumeLiters: number;     // Volumen geométrico nominal [L]
}

export interface CompressibilityResult {
  zFactor: number;
  reducedDensity: number;
  iterations: number;
  converged: boolean;
}

export interface MassVolumeResult {
  massKg: number;
  standardVolumeSm3: number;
  densityKgM3: number;
  zFactor: number;
}

export interface IsochoricForecastInput {
  cutoffPressureBar: number;
  cutoffTemperatureK: number;
  ambientTemperatureK: number;
  geometricVolumeLiters: number;
  chromatography: ChromatographyProfile;
  coolingTimeSeconds?: number;
  tauSeconds?: number;
}

export interface IsochoricForecastResult {
  stabilizedPressureBar: number;
  pressureDropBar: number;
  stabilizedTemperatureK: number;
  stabilizedZFactor: number;
  standardVolumeSm3: number;
  massKg: number;
}

export interface AforoCertification {
  isCertified: boolean;
  stabilizedPressureBar: number;
  thresholdBar: 230.0;
  stationId: string;
  status: 'CERTIFIED_AFT' | 'REJECTED_UNDERPRESSURE' | 'NON_COMPLIANT';
  rejectionReason?: string;
}

export interface IThermodynamicEngine {
  calculateZFactor(
    pressureBar: number,
    temperatureK: number,
    profile: ChromatographyProfile
  ): CompressibilityResult;

  calculateMassAndVolume(
    state: ThermodynamicState,
    profile: ChromatographyProfile
  ): MassVolumeResult;

  forecastIsochoricDecay(
    input: IsochoricForecastInput
  ): IsochoricForecastResult;

  certifyAforoSabanas(
    stabilizedPressureBar: number,
    stationId: string
  ): AforoCertification;
}
```

---

## 8. Criterios de Aceptación para QA (`@qa-verifier`)
1. **Precisión Numérica de $Z$:** Para perfil Bonga-Mamey a $200 \text{ bar}$ y $300 \text{ K}$, $Z$ debe situarse en el intervalo $[0.8000, 0.8800]$ con error residual del Newton-Raphson $< 10^{-7}$.
2. **Validación de Cromatografía:** Intentar instanciar un perfil cuya suma de fracciones molares difiera de $1.0$ en más de $\pm 10^{-5}$ debe arrojar un error tipado `InvalidChromatographyException`.
3. **Corte a 230 bar en Sabanas:**
   - Si $P_{\text{estabilizada}} = 230.00 \text{ bar} \implies \text{Certificación Exitosa}$ (`CERTIFIED_AFT`).
   - Si $P_{\text{estabilizada}} = 229.99 \text{ bar} \implies \text{Rechazado}$ (`REJECTED_UNDERPRESSURE`).
4. **Conservación de Masa:** El cálculo isocórico debe verificar que la masa al corte a alta temperatura sea idéntica a la masa en estado estabilizado ($\Delta m / m < 10^{-5}$).
