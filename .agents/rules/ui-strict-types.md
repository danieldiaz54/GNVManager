# Reglas de Calidad y Tipado Estricto para UI (`designer`)

1. **Tipado Estricto Sin Excepciones**:
   - Queda terminantemente prohibido el uso de `any` en componentes, hooks y props de React.
   - Todo estado numérico de magnitud física ($P_1$, $P_2$, temperatura, volumen) debe tiparse como `number`.
   
2. **Ergonomía de Formularios e Inputs**:
   - Evitar conversiones de string automáticas que antepongan ceros o puntos decimales colgados (`0.` o `.`) al borrar.
   - Validar que los valores ingresados no sean negativos ni produzcan `NaN`.

3. **Tipografía Industrial Minimalista**:
   - Todo valor numérico, indicador de presión o lectura métrica debe usar fuente monoespaciada (`font-mono`).
   - Mantener la paleta cromática estricta de variables CSS (`var(--color-...)`) definidas en `index.css`.
