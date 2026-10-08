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
