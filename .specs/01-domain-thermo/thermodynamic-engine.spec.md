# Thermodynamics Engine Specification

## Overview
This document outlines the business rules and constraints for the Thermodynamics Engine within the GNV Manager application, adhering to Clean Architecture and Spec-Driven Development (SDD) principles.

## 1. Domain Entities & Exceptions
The domain model must be robust and encapsulate critical business constraints.

### 1.1 Exceptions
- **`DivergenceException`**: Thrown when a numerical solver (like Newton-Raphson) fails to converge within the allowed maximum number of iterations.
- **`PressureExceededException`**: Thrown when the system pressure exceeds the maximum safe operational limits.

### 1.2 Gas Properties Injection
Hardcoded physical properties such as `molarMass`, `criticalPressure`, and `criticalTemperature` must not be directly hardcoded into the calculation logic. Instead, a `GasComposition` object must be injected into the thermodynamics services to ensure flexibility across different gas mixtures.

## 2. Z-Factor Calculation (Newton-Raphson Solver)
The engine utilizes the AGA-8 / Dranchuk-Abu-Kassem (DAK) Equation of State for natural gas.
- The iterative solver uses the Newton-Raphson method to find the reduced density.
- **Rule**: If the solver does not converge (difference between iterations `< 1e-6`) within exactly 12 iterations, it **MUST THROW** a `DivergenceException`.
- **Constraint**: The previous behavior of silently clamping the Z-factor between 0.2 and 2.0 upon completion or failure is strictly forbidden as it hides calculation instability. The clamping can still exist for valid converged results, but non-convergence must throw.

## 3. Sabanas / Aforo Constraints
For Sabanas (or specifically for Aforo/Loading scenarios), there are strict operational safety limits.
- **Rule**: The maximum valid pressure is capped at **230 bar**.
- **Behavior**: The system must validate any `ThermodynamicState` (initial or final) provided to the transfer calculation. If the `pressureBar` exceeds 230 bar, a `PressureExceededException` **MUST** be thrown to prevent unsafe estimations or operations.
