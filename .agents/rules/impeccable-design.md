# Regla de Diseño Permanente: Ecosistema Impeccable Design

Esta regla es de cumplimiento obligatorio para todo agente que cree, modifique o audite la interfaz de usuario en `frontend/` o modifique los artefactos de diseño de GNVManager.

---

## 1. Fuentes de Verdad Inviolables
1. **PRODUCT.md:** Ubicado en la raíz del proyecto. Define los usuarios (operadores de patio y manifold), la escena de uso (terminales industriales a 250-350 bar) y los principios estratégicos de producto.
2. **DESIGN.md:** Ubicado en la raíz del proyecto y en `.specs/06-design-system/DESIGN.md`. Contiene los tokens de color, tipografía y componentes canónicos.
3. **Modo Obligatorio:** **Operate**. La scanabilidad, consistencia y exactitud metrológica están por encima de cualquier artificio decorativo.

---

## 2. Estándares de Calidad y Anti-Patrones Prohibidos (Craft Floor)
- ❌ **Prohibidos degradados decorativos de texto o fondo.**
- ❌ **Prohibidos kickers o subtítulos tipo eyebrow innecesarios encima de los títulos principales.**
- ❌ **Prohibidas sombras difusas pesadas o halos brillantes sin función de profundidad.**
- ❌ **Prohibido el uso de modales intrusivos para tareas operativas de patio.**
- ❌ **Prohibido omitir unidades de medida** (`bar`, `K`, `°C`, `kg`, `Sm3`).
- ✅ **Obligatorio:** Tipografía monoespaciada (`JetBrains Mono`, `Geist Mono`) para cualquier lectura o valor numérico (presión, temperatura, masa, volumen, factor Z).
- ✅ **Obligatorio:** Todos los controles interactivos deben tener estados completos: `default`, `hover`, `focus`, `active`, `disabled`, `loading` y `error`.

---

## 3. Protocolo de Verificación Mecánica Post-Edición
Inmediatamente después de cualquier cambio en archivos de React/Tailwind (`frontend/src/`):
1. Ejecutar el detector de Impeccable:
   ```powershell
   npx impeccable detect src
   # O en la raíz de frontend:
   npm run lint:design
   ```
2. Si el detector arroja hallazgos o advertencias, el agente **debe resolverlos en la misma respuesta** antes de finalizar la tarea.
