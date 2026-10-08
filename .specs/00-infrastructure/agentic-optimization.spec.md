# SPEC-00-B: Optimización de Arquitectura Agéntica y Seguridad Preventiva

> **Estado**: En Implementación (Fase SDD)  
> **Fecha**: 2026-10-08  
> **Alcance**: Agent Governance, DevSecOps Subagent, Lifecycle Hooks (Safety Gate), Contextual Rules, Antigravity Orchestration

---

## 1. Visión General y Objetivos

El sistema GNV Manager es operado por un equipo de subagentes especializados orquestados por el Lead Orchestrator. Con el incremento de autonomía, se requiere blindar el entorno de desarrollo para:
1. **Prevención Proactiva de Daño (Safety Gate)**: Impedir la ejecución de comandos destructivos accidentales (`DROP TABLE/DATABASE`, `TRUNCATE`, `rm -rf /`, `del /s /q c:\`) mediante Lifecycle Hooks (`PreToolUse`).
2. **Especialización DevSecOps (`security-auditor`)**: Auditar de manera transversal la seguridad de inputs, control de acceso basado en roles (RBAC) y la no exposición de credenciales/secretos.
3. **Reglas Contextuales (Progressive Disclosure)**: Cargar directivas estrictas de tipado para UI y pureza en el núcleo de dominio solo cuando el contexto lo requiere.
4. **Trazabilidad y Changelog Agéntico**: Mantener un registro versionado de las mejoras al sistema de agentes en `AGENTIC_CHANGELOG.md`.

---

## 2. Componentes de la Arquitectura Agéntica

### 2.1. Subagente `security-auditor` (Auditor de Seguridad y Compliance)
- **Alcance**: Revisión transversal de endpoints Express, middleware de autenticación (`auth.middleware.ts`), esquemas Zod y persistencia Prisma.
- **Responsabilidad**:
  - Validar sanitización estricta de inputs (presión, temperatura, volúmenes, IDs de perfiles).
  - Verificar que las rutas operativas requieran autenticación JWT y validen roles de usuario.
  - Asegurar la confidencialidad de datos y prevenir fugas de secretos en logs o commits.

### 2.2. Lifecycle Hooks (`.agents/hooks.json`)
- **Hook `PreToolUse` sobre `run_command`**:
  - Script interceptor en Node.js (`.agents/scripts/safety-gate.js`).
  - Analiza el comando entrante vía payload JSON en `stdin`.
  - Emite `{"decision": "deny", "reason": "..."}` si detecta patrones destructivos.
  - Emite `{"decision": "allow"}` para comandos ordinarios seguros.
  - Robustez de ruta: Debe admitir ejecución tanto si el CWD es la raíz del workspace o `.agents/`.

### 2.3. Reglas Contextuales (`.agents/rules/`)
1. `ui-strict-types.md`:
   - Prohíbe el uso de `any` en componentes React.
   - Exige tipado numérico tipográfico monoespaciado (`font-mono`) en variables físicas.
   - Obliga validación de entradas numéricas contra números negativos o valores vacíos (`NaN`).
2. `domain-purity.md`:
   - Prohíbe importaciones de frameworks (`express`, `react`, `@prisma/client`) dentro de `backend/src/domain/`.
   - Exige que los solvers termodinámicos lancen excepciones de dominio explícitas ante no convergencia.

---

## 3. Protocolo de Verificación
1. **Verificación de Hooks**: Comprobar que `safety-gate.js` responda con formato JSON válido `{ decision: "allow" | "deny" }`.
2. **Verificación de Registro**: Asegurar que `security-auditor` esté disponible en el catálogo de subagentes y registrado en runtime.
3. **Verificación de Pruebas**: Confirmar que la suite existente pase al 100% (cero regresiones).
