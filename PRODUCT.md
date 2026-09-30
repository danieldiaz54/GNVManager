# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19, TypeScript, Vite, Tailwind CSS

## Users

Operadores de patio y manifold en estaciones de compresión y despacho (ej. Sabanas), despachadores de módulos/racks, supervisores de aforo volumétrico, auditores de gasoducto y directores de operaciones de GNC/GNV. Utilizan terminales industriales, pantallas táctiles robustas y tablets en condiciones de luz solar directa y turnos nocturnos, a menudo operando con guantes y requiriendo confirmación visual instantánea de presiones y masas.

## Product Purpose

GNVManager es una plataforma de software de grado industrial para la cadena de valor del Gas Natural Vehicular (GNV) y Gas Natural Comprimido (GNC). Resuelve la reconciliación y auditoría forense entre el balance energético/físico y la comercialización económica de gas real sometido a presiones extremas (hasta 250 - 350 bar) y transporte presurizado.

## Positioning

Es el único sistema del sector que desacopla la física de fluidos de gases reales (AGA-8 / Dranchuk-Abu-Kassem resuelto por Newton-Raphson) en un motor determinista, conectando la telemetría manométrica y cromatografías dinámicas con reglas de aforo inviolables (piso de reposo >= 230 bar en Sabanas) y un libro mayor inmutable (ReconciliationLedger).

## Operating Context

Estaciones de compresión en boca de pozo y gasoducto, manifolds de llenado rápido a alta tasa de flujo, canastas/racks de 11 y 12 cilindros (13,497 L y 26,950 L), transporte vial en tractomulas y estaciones de servicio (EDS) receptoras. Entorno crítico donde las variaciones térmicas post-compresión generan caídas de presión isocóricas que deben pronosticarse para evitar despachos con merma aparente o subpresión no conforme.

## Capabilities and Constraints

- Cálculos termodinámicos deterministas en tiempo real (factor Z, densidad reducida, masa kg, volumen Sm3).
- Modelado dinámico de cromatografías variables (Bonga-Mamey al 96.3666% CH4, Candilejas al 99.1685%, Gas Rico del Llano).
- Pronóstico isocórico de estabilización térmica post-corte.
- Certificación regulatoria de aforo condicionada a P_estabilizada >= 230.00 bar en Sabanas.
- Compatibilidad con baterías móviles de 11 cilindros (13,497 L) y 12 cilindros (26,950 L).
- Integridad transaccional y libro mayor inmutable de mermas aparentes vs. físicas reales.

## Brand Commitments

- **Nombre:** GNVManager
- **Tono:** Sobrio, técnico, riguroso, de ingeniería pesada y metrología industrial. Cero artificios o animaciones recreativas.
- **Tema:** Dark Mode Industrial por defecto, optimizado para alto contraste y reducción de fatiga visual.

## Product Principles

1. **Rigor Físico Innegociable:** Ningún balance se basa en factores Z ideales o aproximaciones lineales; toda cantidad proviene de ecuaciones de estado de gases reales.
2. **Inviolabilidad Operacional:** Si la presión de reposo es menor a 230.00 bar, el despacho es categorizado como rechazado y no se permite la emisión de certificado de aforo.
3. **Ergonomía en Escena Hostil:** Jerarquía visual orientada a la tarea (Modo Operate), entradas numéricas debounced para evitar parpadeos y tipografía monoespaciada para lecturas manométricas.
4. **Trazabilidad y Cero Ambigüedad:** Los estados del sistema son claros (verde para conforme, ámbar para reposo térmico en progreso, rojo para subpresión o falla física).
