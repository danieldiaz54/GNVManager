# Especificación: Modelo Físico y Técnico Avanzado de Almacenamientos GNV

## 1. Visión y Objetivos
Evolucionar la entidad `StorageModule` desde un modelo puramente volumétrico básico a un modelo de ingeniería integral basado en las fichas técnicas y planos reales de los fabricantes (Luxi New Energy, Hebei Baigong, normas ISO 11120 e ISO 9809-1).

El nuevo modelo impacta transversalmente:
1. **Catálogo de Almacenamientos (`StorageModulesModule.tsx`)**: Visualización de ficha técnica industrial completa (dimensiones, metalurgia, presiones límite, tara de transporte y certificaciones).
2. **Modal de Detalle (`StorageDetailModal.tsx`)**: Desglose técnico por cuadrantes de ingeniería (Operación, Logística, Mecánica y Normativa).
3. **Consola de Despacho (`DispatchConsole.tsx`)**: Validación de seguridad operativa en tiempo real:
   - Alerta operativa si la presión final excede la presión de trabajo de diseño ($P_2 > P_{\text{trabajo}}$).
   - Comparación de masa despachada estimada frente a la capacidad de carga nominal de gas (`maxPayloadKg`) para tráilers viales.

---

## 2. Definición del Modelo de Datos (Prisma)

### 2.1 Campos de `StorageModule`
- **Identificación**:
  - `id`: UUID (Primary Key).
  - `name`: String único (ej. "Tráiler Transporte 11 Tubos (26.95 m³)").
  - `type`: String ("ESTACIONARIA" | "TRANSPORTE").
  - `cylinderCount`: Int (número de tubos/cilindros).
  - `cylinderCapacityLiters`: Float (capacidad de agua por cilindro en Litros).
  - `totalCapacityLiters`: Float (capacidad total geométrica en Litros).
- **Parámetros Operativos y Seguridad**:
  - `workingPressureBar`: Float (ej. 250.0 bar).
  - `testPressureBar`: Float (ej. 375.0 bar).
  - `safetyReliefPressureBar`: Float (ej. 273.0 bar para válvulas de alivio, 375.0 bar para discos de ruptura).
  - `minOperatingTempC`: Float (ej. -50.0 °C).
  - `maxOperatingTempC`: Float (ej. 60.0 °C).
- **Pesaje y Logística Vial (Transporte)**:
  - `tareWeightKg`: Float (peso en vacío, ej. 31,284 kg).
  - `maxPayloadKg`: Float (capacidad máxima neta de GNV en masa, ej. 6,063 kg).
  - `grossWeightKg`: Float (peso bruto máximo con carga, ej. 37,347 kg).
  - `chassisType`: String opcional (ej. "Triple eje / Three-axis").
- **Especificaciones Físicas y del Tubo**:
  - `tubeMaterial`: String (ej. "4130X" o "34CrMo4").
  - `tubeOuterDiameterMm`: Float (ej. 559.0 mm o 356.0 mm).
  - `tubeLengthMm`: Float (ej. 11,580.0 mm, 10,975.0 mm o 1,890.0 mm).
  - `plugConfiguration`: String (ej. "SINGLE_PLUG" o "DOUBLE_PLUG").
  - `valveManufacturer`: String opcional (ej. "DK-Lok", "Parker", "Swagelok").
- **Trazabilidad Normativa**:
  - `manufacturingStandard`: String (ej. "ISO 11120:2015", "ISO 9809-1:1999").
  - `certificationAgency`: String (ej. "Bureau Veritas (BV)", "ISO", "CE").
  - `designLifeYears`: Int (ej. 15 años).
  - `createdAt`: DateTime.

---

## 3. Capa de Aplicación e Integración (Backend)
- Validación estricta con Zod en `storage-module.controller.ts`.
- Mapeo semántico de campos en endpoints REST `GET` y `POST` `/api/v1/storage-modules`.
- Script de siembra `prisma/seed-storage.ts` con los datos exactos extraídos de las fichas técnicas de los 8 módulos.

---

## 4. Frontend & Experiencia de Usuario
- Tipado `StorageModuleDTO` y `CreateStorageModuleDTO` actualizado en `storage.service.ts`.
- Tarjetas de módulos y modal de detalle estructurados en 4 bloques de ingeniería:
  1. *Condiciones de Presión y Temperatura*.
  2. *Capacidades y Volumetría*.
  3. *Pesaje y Transporte Vial*.
  4. *Metalurgia y Estándar de Fabricación*.
- Consola de despacho enriquecida con validación de seguridad de sobrepresión y verificación de masa vs tara nominal.
- Cumplimiento inquebrantable de la gobernanza de UI: Acento azul gas, superficies 100% opacas, diseño responsive industrial.
