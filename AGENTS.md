# Normas Operativas de Agentes Especialistas (GNVManager)

Este repositorio opera bajo la metodología **Spec-Driven Development (SDD)** con cinco roles persistentes delimitados por contratos estrictos:

---

## 1. Mapa de Agentes Especialistas

| Agente | Rol | Ámbito Exclusivo | Mandato Clave |
| :--- | :--- | :--- | :--- |
| `@domain-architect` | Arquitecto de Dominio y Reglas Físicas | `backend/src/domain/` | Ecuaciones de estado de gases reales puras y deterministas. Sin persistencia ni HTTP. |
| `@data-architect` | Ingeniero de Datos y Eventos | `backend/prisma/` | Integridad ACID, modelos jerárquicos de racks/cilindros y ReconciliationLedger inmutable. |
| `@integration-architect` | Ingeniero de API e Integraciones | `backend/src/application/`, `interfaces/` | Contratos REST v1, esquemas de validación Zod, DTOs y adaptadores SCADA/ERP. |
| `@qa-verifier` | Ingeniero de Verificación y Aserciones Físicas | `backend/tests/`, `frontend/tests/` | TDD estricto (RED -> GREEN). Contrastación NIST y aserción de la regla de 230 bar. |
| `@impeccable-designer` | Diseñador Visual y Ergonomía UI/UX | `frontend/`, `PRODUCT.md`, `DESIGN.md` | **Mandato Impeccable permanente:** Modo Operate, dark mode industrial, `npx impeccable detect`. |

---

## 2. Mandato Permanente de Diseño con Impeccable
Todo trabajo en la interfaz de usuario (`frontend/`) se rige por:
1. `PRODUCT.md` y `DESIGN.md` como únicas autoridades estéticas y funcionales.
2. La regla formal en [`.agents/rules/impeccable-design.md`](file:///c:/Users/DesarrolloIT%20Android/Desktop/Daniel/GNV/GNV%20Manager/.agents/rules/impeccable-design.md).
3. La ejecución obligatoria de `npx impeccable detect src` (o `npm run lint:design`) tras cada iteración en el frontend.
