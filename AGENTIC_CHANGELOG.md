# Agentic Architecture Changelog

## [2026-10-08] - Proactive Agentic Optimization & Safety Governance

### Added
- **Subagent `security-auditor`**: Definido en `.agents/security-auditor/persona.md` para auditoría DevSecOps, revisión de RBAC, sanitización de inputs y prevención de fuga de credenciales.
- **Subagent `docs-oracle`**: Formalizado en `.agents/docs-oracle/persona.md` para consulta y extracción de especificaciones desde `Docs/` local sin exposición remota.
- **Safety Gate Lifecycle Hooks (`.agents/hooks.json`)**: Interceptor `PreToolUse` en Node.js (`.agents/scripts/safety-gate.js`) para prevenir comandos destructivos en base de datos o sistema de archivos.
- **Contextual Rules (`.agents/rules/`)**:
  - `ui-strict-types.md`: Tipado estricto y ergonomía numérica en frontend.
  - `domain-purity.md`: Aislamiento de Clean Architecture en el núcleo de dominio.
- **Especificación SDD**: `.specs/00-infrastructure/agentic-optimization.spec.md`.

### Changed
- **`AGENTS.md`**: Actualizado para incluir al `security-auditor` y documentar la arquitectura de hooks y mejora continua del flujo agéntico.

## [2026-10-09] - User-Driven UI/UX Design System Governance

### Added
- **UI Design System Manifesto (`.agents/rules/ui-design-system.md`)**: Reglas grabadas a partir de las correcciones manuales del usuario:
  - **Lenguaje de Negocio Puro**: Prohibición de jerga de desarrollo ("AGA-8"), términos locales ("Sabanas"), carácter `&` (uso estricto de `y`), numeraciones artificiales ("1.", "2.") y glosarios/definiciones redundantes.
  - **Cromática Unificada de Acento Azul Gas**: Prohibición de paletas aleatorias por categoría (ámbar, celeste); todo foco, pestaña activa y badge utiliza el azul gas de la flama (`var(--color-accent)`). Semáforos rojo/amarillo/verde estrictamente reservados para riesgo físico/contractual.
  - **Proporciones y Espacio**: Prohibición de tarjetas gigantes de estado; implementación de barras estilizadas de fila única (~40px alto). Progressive disclosure obligatorio en selectores jerárquicos (categorías de nivel superior primero).
  - **Ergonomía Numérica**: Inicialización de consola y telemetría siempre en `0` (sin valores por defecto). Auto-selección en foco, modo decimal sin spinners nativos y sanitización regex de ceros a la izquierda.
  - **Tipografía Industrial**: Inter con cifras tabulares (`tnum`) para lectura extendida y JetBrains Mono para instrumentación métrica. Cero fuentes serifadas.

### Changed
- **`.agents/designer/persona.md`**: Actualizado el system prompt del subagente `designer` para adherirse obligatoriamente a este manifiesto en cada iteración y respetar el diseño responsive en toda la aplicación.
- **`AGENTS.md`**: Gobernanza del subagente `designer` y reglas dinámicas sincronizadas con el nuevo manifiesto de diseño y la ley de diseño responsive de grado industrial.

### Added (Responsive Design Consolidation)
- **Directiva de Diseño Responsive de Grado Industrial (`ui-design-system.md` Sec. 6)**:
  - Principio mobile-first aplicado transversalmente en la aplicación (360px a 4K).
  - Prohibición total de desbordamiento horizontal (`overflow-x-hidden` y anchos elásticos).
  - Envoltura obligatoria de tablas densas en contenedores con scroll horizontal autónomo (`overflow-x-auto`).
  - Áreas táctiles mínimas para campo/planta (40px-44px) y botones extendidos a ancho completo en móviles (`w-full sm:w-auto`).
  - Modales adaptables con `max-h-[90vh]` y scroll interno.

### Changed (Business Vocabulary Refinement)
- **Prohibición Total de "Certificar" en Favor de "Estimar"**:
  - Grabada la regla en `ui-design-system.md`, `persona.md` y `AGENTS.md`.
  - Reemplazadas todas las referencias a *"certificar"*, *"certificado"* o *"Aforo Cert"* por **`estimar`**, **`estimado`** y **`Aforo Est.`** en `DispatchConsole.tsx`, `ReconciliationLedger.tsx`, `GasProfilesModule.tsx` y `HomeModule.tsx`.

### Added (Beta Versioning Protocol)
- **Protocolo de Versionamiento Beta y Prohibición de Etiqueta "PRO"**:
  - Eliminada la etiqueta comercial `"v2.0 PRO"` del header principal ([`SaaSLayout.tsx`](file:///c:/Users/DesarrolloIT%20Android/Desktop/Daniel/GNV/GNV%20Manager/frontend/src/layouts/SaaSLayout.tsx)) e implementada la nomenclatura decimal `beta 0.2`.
  - Grabada la regla en `AGENTS.md`, `ui-design-system.md` (Sec. 8) y `persona.md` (Regla 9): las fases pre-lanzamiento usan estrictamente numeraciones `beta 0.X`, y la versión `1.0` queda reservada exclusivamente para el lanzamiento oficial a producción.



