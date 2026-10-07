# Thermodynamic Engine Specification

## 1. Reglas Operativas e Isocóricas
- El cálculo termodinámico (DAK / Newton-Raphson) debe resolver divergencias usando `DivergenceException` si las iteraciones > 12.
- **Techo Operativo Nominal:** El límite máximo absoluto permitido para las presiones de entrada de instrumentos es de **260 bar** (para soportar picos de compresores de 250 bar). Un valor mayor arroja `PressureExceededException`.
- **Certificación Sabanas (Aforo):** La barrera de los 230 bar **no** detiene ni invalida una operación. Es una regla de certificación en frío. El motor debe contar con una función `certifyAforo(pStabilized, totalVolumeSm3, totalDeltaP)` que retorne `{ certified: boolean, aforoSm3PerBar: number }`. Sólo si `pStabilized >= 230` bar se considera `certified: true`. De lo contrario, se marca como falso (subllenado térmico) pero el cálculo se acepta.

## 2. Perfiles Cromatográficos Oficiales Surtigas
La composición molar del gas ($G_r$) se parametrizará a través de la entidad `GasProfile`:
- **Bonga-Mamey (Sabanas):** ~96.3666% $CH_4$. Masa Molar ($M$) equivalente a Gravedad Específica $G_r = 0.5756$.
- **Candilejas (Canacol 2):** ~99.1685% $CH_4$. Masa Molar ($M$) equivalente a Gravedad Específica $G_r = 0.5600$.
*(Nota: Masa Molar = $G_r \times 28.9625$)*
