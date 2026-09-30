---
name: GNVManager Industrial Design System
description: Sistema de diseño sobrio, hiperlegible y de grado industrial para la cadena de valor de GNV/GNC
colors:
  primary: "#10b981"
  neutral-bg: "#090a0f"
  surface-base: "#12141c"
  surface-card: "#1a1d27"
  surface-border: "#232734"
  text-primary: "#f1f3f9"
  text-muted: "#717b9b"
  manometer-optimal: "#10b981"
  manometer-warning: "#f59e0b"
  manometer-critical: "#ef4444"
  manometer-info: "#3b82f6"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  data-mono:
    fontFamily: "'JetBrains Mono', 'Geist Mono', ui-monospace, monospace"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  gauge-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
---

# Design System: GNVManager Industrial

## Overview
El sistema visual de GNVManager está concebido para terminales de patio, manifolds de compresión y salas de control en estaciones de GNV/GNC. Diseñado en **Modo Operate**, prioriza la absorción inmediata de información crítica (presión, temperatura, masa, estado normativo de 230 bar) sin fatiga visual ni ornamentación superflua.

## Colors
- **Paleta Neutra (Dark Mode Industrial):**
  - Fondo Base: `#090a0f` (Zinc ultraconcentrado para evitar deslumbramiento).
  - Superficies y Paneles: `#12141c` / `#1a1d27`.
  - Bordes y Separadores Técnicos: `#232734`.
- **Acentos y Semáforos Metrológicos:**
  - Óptimo / Conforme (`#10b981` Emerald): Presión estabilizada $\ge 230.00$ bar, aforo certificado.
  - Alerta / Reposo en Curso (`#f59e0b` Amber): Reposo isocórico activo, enfriamiento en progreso.
  - Crítico / Rechazado (`#ef4444` Rose): Presión $< 230.00$ bar, fuga o merma física anormal.
  - Información / Flujo Activo (`#3b82f6` Blue): Telemetría en vivo, caudalímetros Coriolis.

## Typography
- **Fuente de Interfaz (Sans):** `Inter` o fuentes del sistema. Usada para etiquetas, navegación, títulos y estados.
- **Fuente de Datos Metrológicos (Mono):** `JetBrains Mono` / `Geist Mono`. Obligatoria para toda lectura de presión (`bar`), temperatura (`K`, `°C`), masa (`kg`), volumen (`Sm3`), factor $Z$ y horas de evento. Evita el temblor o jitter visual durante actualizaciones de datos en vivo.

## Layout
- Estructura modular en cuadrículas compactas de alta densidad.
- Jerarquía espacial estricta con márgenes y paddings regulares de $8\text{px}$ y $16\text{px}$.
- Paneles laterales colapsables para maximizar el área de monitoreo manométrico en pantallas táctiles de campo.

## Elevation & Depth
- Modelo plano tonal sin sombras pesadas.
- La profundidad se crea mediante contraste tonal de superficies (`#090a0f` $\to$ `#12141c` $\to$ `#1a1d27`) y bordes nítidos de 1px en `#232734`.

## Shapes
- Radios de curvatura industriales reducidos (`rounded-sm: 4px` a `rounded-md: 6px`).
- Prohibidos bordes redondeados tipo píldora para botones o tarjetas analíticas.

## Components
1. **ManometerGauge:** Lectura de presión centralizada con número monoespaciado en tamaño prominente, arco/barra LED semafórica y etiqueta de unidad `bar` fijada.
2. **RackVisualizer:** Esquema ortogonal en SVG que representa físicamente los módulos de 11 o 12 cilindros con código de color individual por cilindro o acumulado del rack.
3. **IsochoricDecayCurve:** Gráfica técnica SVG minimalista mostrando el perfil de caída térmica y la línea de umbral de 230 bar.
4. **DebouncedNumericInput:** Campo numérico de precisión industrial que previene disparos repetitivos a la API mientras el operador ingresa lecturas manométricas.

## Do's and Don'ts
- ✅ **DO:** Utilizar siempre tipografía monospace para lecturas numéricas de presión y masa.
- ✅ **DO:** Resaltar en verde esmeralda únicamente cuando $P \ge 230.00$ bar esté certificada.
- ❌ **DON'T:** Usar gradientes vistosos, sombras difusas o modales intrusivos durante operaciones de cargue en curso.
- ❌ **DON'T:** Ocultar las unidades de medida (`bar`, `K`, `kg`, `Sm3`).
