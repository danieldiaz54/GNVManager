# GNVManager: Industrial Gas Value Chain Platform

Plataforma de software de grado industrial para la cadena de valor del Gas Natural Vehicular (GNV/GNC) y Gas Natural Comprimido.

---

## 1. Metodología: Spec-Driven Development (SDD)
El desarrollo en este repositorio se rige por la separación estricta entre especificación y ejecución:
- **Directorio `.specs/`:** Única Fuente de Verdad para todo el proyecto.
- **TDD:** Ningún agente escribe código ejecutable si no existe una especificación (`.spec.md`) aprobada y sus respectivos tests unitarios fallando primero.

---

## 2. Topología del Proyecto

```
GNVManager/
├── .specs/                          # Contratos agnósticos de verdad (SDD)
│   ├── 01-domain-thermo/            # Motor termodinámico y física de fluidos
│   ├── 02-data-topology/            # Despacho, aforos y topología física de activos
│   ├── 03-pipeline-balance/         # Cuenta de balance en gasoductos
│   ├── 04-reconciliation-ledger/    # Libro mayor inmutable de conciliación
│   ├── 05-api-contracts/            # Contratos de API (REST, Zod, SCADA, ERP)
│   └── 06-design-system/            # Sistema de diseño industrial (Impeccable style)
├── .agents/                         # Definición formal de agentes de ingeniería
│   ├── domain-architect/            # @domain-architect
│   ├── data-architect/              # @data-architect
│   ├── integration-architect/         # @integration-architect
│   ├── qa-verifier/                 # @qa-verifier
│   └── impeccable-designer/         # @impeccable-designer
├── backend/                         # Backend autónomo (Node.js, TypeScript, Express, Prisma)
│   ├── prisma/                      # Esquemas relacionales y migraciones
│   ├── src/
│   │   ├── domain/                  # Entidades puras y reglas matemáticas
│   │   ├── application/             # Casos de uso
│   │   ├── interfaces/              # Controladores HTTP y DTOs
│   │   └── infrastructure/          # Servidor HTTP y repositorios
│   ├── package.json
│   └── tsconfig.json
└── frontend/                        # Frontend autónomo (React 19, TypeScript, Vite, Tailwind CSS)
    ├── src/
    │   ├── components/              # Componentes UI (Impeccable style)
    │   ├── context/                 # Estados globales
    │   ├── modules/                 # Módulos funcionales
    │   └── services/                # Clientes API tipados
    ├── package.json
    └── vite.config.ts
```

---

## 3. Agentes Especialistas Persistentes (`.agents/`)
- `@domain-architect`: Arquitecto de Dominio y Reglas Físicas (`backend/src/domain/`)
- `@data-architect`: Ingeniero de Datos y Eventos (`backend/prisma/`)
- `@integration-architect`: Ingeniero de API e Integraciones (`backend/src/application/`, `interfaces/`)
- `@qa-verifier`: Ingeniero de Verificación y Aserciones Físicas (TDD, suites de prueba)
- `@impeccable-designer`: Agente de Diseño Visual y Ergonomía UI/UX (`frontend/src/components/`, `styles/`)

---

## 4. Estado de Especificaciones
- **SPEC-DOM-001 (`.specs/01-domain-thermo/thermodynamic-engine.spec.md`):** `FROZEN (Hito 1 - Piloto Sabanas)`. Ecuaciones de estado de gases reales (AGA-8 / Dranchuk-Abu-Kassem vía Newton-Raphson), cromatografías dinámicas (Bonga-Mamey al 96.3666% $CH_4$, Candilejas, Llano), pronósticos isocóricos y piso de certificación de aforo $\ge 230.0$ bar en Sabanas.
