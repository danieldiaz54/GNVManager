# Especificación Técnica de API: Servicios Termodinámicos y Aforo (Dominio 05)
**Código de Especificación:** `SPEC-API-001`  
**Estado:** `FROZEN (Hito 1 - Base)`  
**Autor:** `@integration-architect`  
**Revisor QA:** `@qa-verifier`  
**Única Fuente de Verdad:** `.specs/05-api-contracts/thermodynamic-api.spec.md`

---

## 1. Resumen y Propósito
Esta especificación define los contratos de entrada/salida (I/O), esquemas de validación Zod y endpoints REST expuestos por el Backend para el cálculo de estado de gas real, pronóstico isocórico de enfriamiento y certificación regulatoria de aforos en la estación Sabanas.

---

## 2. Convenciones de API
- **Formato:** JSON (UTF-8).
- **Base Path:** `/api/v1`
- **Manejo de Errores Estandarizado:**
  - `400 Bad Request`: Error en validación de esquema Zod (`VALIDATION_ERROR`).
  - `422 Unprocessable Entity`: Violación de invariante física o rechazo de aforo (`DOMAIN_ERROR` o `REJECTED_UNDERPRESSURE`).
  - `500 Internal Server Error`: Fallo no controlado (`INTERNAL_ERROR`).
- **Estructura Estándar de Respuesta:**
  ```typescript
  // Respuesta Exitosa:
  {
    success: true,
    data: T
  }

  // Respuesta de Error:
  {
    success: false,
    error: {
      code: string,
      message: string,
      details?: unknown
    }
  }
  ```

---

## 3. Catálogo de Endpoints

### 3.1 `POST /api/v1/thermo/compressibility`
Calcula el factor de compresibilidad $Z$ y densidad reducida $\rho_r$ mediante DAK y Newton-Raphson.

#### Request Body
```json
{
  "pressureBar": 200.0,
  "temperatureK": 300.0,
  "chromatography": "Bonga-Mamey"
}
```
*Nota: `chromatography` puede ser un nombre de perfil preconfigurado (`"Bonga-Mamey"`, `"Candilejas"`, `"Gas Rico Llano"`) o un objeto `CustomChromatographyInput`.*

#### Response Body (200 OK)
```json
{
  "success": true,
  "data": {
    "zFactor": 0.805876,
    "reducedDensity": 1.44215,
    "iterations": 5,
    "converged": true
  }
}
```

---

### 3.2 `POST /api/v1/thermo/calculate-state`
Calcula la masa física total ($kg$), volumen contractual ($Sm^3$), densidad ($kg/m^3$) y $Z$ para un estado termodinámico dado.

#### Request Body
```json
{
  "pressureBar": 230.0,
  "temperatureK": 300.0,
  "volumeLiters": 13497.0,
  "chromatography": "Bonga-Mamey"
}
```

#### Response Body (200 OK)
```json
{
  "success": true,
  "data": {
    "massKg": 2528.45,
    "standardVolumeSm3": 3542.10,
    "densityKgM3": 187.33,
    "zFactor": 0.8251
  }
}
```

---

### 3.3 `POST /api/v1/thermo/isochoric-forecast`
Pronostica la caída de presión por enfriamiento post-corte a volumen constante desde $(P_{\text{corte}}, T_{\text{corte}})$ hasta $T_{\text{amb}}$.

#### Request Body
```json
{
  "cutoffPressureBar": 250.0,
  "cutoffTemperatureK": 330.0,
  "ambientTemperatureK": 300.0,
  "geometricVolumeLiters": 13497.0,
  "chromatography": "Bonga-Mamey",
  "coolingTimeSeconds": 7200
}
```

#### Response Body (200 OK)
```json
{
  "success": true,
  "data": {
    "stabilizedPressureBar": 231.42,
    "pressureDropBar": 18.58,
    "stabilizedTemperatureK": 300.0,
    "stabilizedZFactor": 0.8258,
    "standardVolumeSm3": 3540.25,
    "massKg": 2527.12
  }
}
```

---

### 3.4 `POST /api/v1/aforo/certify-sabanas`
Evalúa la regla inviolable `BR-AFORO-001` de la estación Sabanas ($P_{\text{estabilizada}} \ge 230.00\text{ bar}$).

#### Request Body
```json
{
  "stabilizedPressureBar": 231.42,
  "stationId": "ST-SABANAS"
}
```

#### Response Body (200 OK - Certificado)
```json
{
  "success": true,
  "data": {
    "isCertified": true,
    "stabilizedPressureBar": 231.42,
    "thresholdBar": 230.0,
    "stationId": "ST-SABANAS",
    "status": "CERTIFIED_AFT",
    "timestamp": "2026-09-30T21:00:00.000Z"
  }
}
```

#### Response Body (200 OK - Rechazado por subpresión)
```json
{
  "success": true,
  "data": {
    "isCertified": false,
    "stabilizedPressureBar": 228.50,
    "thresholdBar": 230.0,
    "stationId": "ST-SABANAS",
    "status": "REJECTED_UNDERPRESSURE",
    "rejectionReason": "Presión estabilizada (228.50 bar) inferior al umbral normativo operacional de 230.00 bar en estación ST-SABANAS. Despacho no conforme.",
    "timestamp": "2026-09-30T21:00:00.000Z"
  }
}
```

---

## 4. Esquemas de Validación Zod (Definición Canónica)

```typescript
export const ChromatographyPresetSchema = z.enum([
  'Bonga-Mamey',
  'Candilejas',
  'Gas Rico Llano',
]);

export const CustomChromatographySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  fractions: z.array(
    z.object({
      component: z.enum([
        'CH4', 'C2H6', 'C3H8', 'iC4', 'nC4', 'iC5', 'nC5',
        'C6plus', 'N2', 'CO2', 'H2S', 'He'
      ]),
      fraction: z.number().min(0).max(1),
    })
  ).min(1),
  higherHeatingValueBtuScf: z.number().positive().optional(),
});

export const ChromatographyInputSchema = z.union([
  ChromatographyPresetSchema,
  CustomChromatographySchema,
]);

export const CalculateCompressibilitySchema = z.object({
  pressureBar: z.number().positive('La presión debe ser estrictamente positiva'),
  temperatureK: z.number().positive('La temperatura debe ser estrictamente positiva'),
  chromatography: ChromatographyInputSchema,
});

export const CalculateStateSchema = z.object({
  pressureBar: z.number().positive(),
  temperatureK: z.number().positive(),
  volumeLiters: z.number().positive(),
  chromatography: ChromatographyInputSchema,
});

export const IsochoricForecastSchema = z.object({
  cutoffPressureBar: z.number().positive(),
  cutoffTemperatureK: z.number().positive(),
  ambientTemperatureK: z.number().positive(),
  geometricVolumeLiters: z.number().positive(),
  chromatography: ChromatographyInputSchema,
  coolingTimeSeconds: z.number().positive().optional(),
});

export const CertifyAforoSabanasSchema = z.object({
  stabilizedPressureBar: z.number().positive(),
  stationId: z.string().min(1),
});
```

---

## 5. Criterios de Aceptación para QA (`@qa-verifier`)
1. **Validación Zod estricta:** Si se envía una presión negativa ($P \le 0$), el endpoint debe responder `400 Bad Request` con código `VALIDATION_ERROR`.
2. **Resolución de Perfiles Preconfigurados:** Enviar `"Bonga-Mamey"` debe resolver automáticamente el perfil oficial al 96.3666% de $CH_4$ y computar $Z$.
3. **Pronóstico Isocórico:** `POST /api/v1/thermo/isochoric-forecast` debe arrojar una presión estabilizada menor a la de corte y verificar que el balance de masa sea idéntico.
4. **Certificación Sabanas:** Probar llamadas con $230.00\text{ bar}$ (retorna `isCertified: true`) y $229.50\text{ bar}$ (retorna `isCertified: false`, `REJECTED_UNDERPRESSURE`).
