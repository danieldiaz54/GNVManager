// Constantes termodinámicas y propiedades puras
// Custodiado por: @domain-architect
// Referencia: NIST WebBook, AGA-8, Dranchuk & Abu-Kassem (1975)

import { GasComponent } from './types';

/**
 * Constante universal de los gases
 * R = 8.314462618 J / (mol * K)
 *   = 0.08314462618 bar * L / (mol * K)
 */
export const UNIVERSAL_GAS_CONSTANT_R = 0.08314462618;

/**
 * Condiciones contractuales estándar de referencia (Standard Conditions - Sm3)
 * P_std = 1.01325 bar (1 atm)
 * T_std = 288.15 K (15 °C)
 */
export const STANDARD_PRESSURE_BAR = 1.01325;
export const STANDARD_TEMPERATURE_K = 288.15;

/**
 * Constantes empíricas canónicas del modelo Dranchuk-Abu-Kassem (DAK)
 */
export const DAK_CONSTANTS = {
  A1: 0.3265,
  A2: -1.0700,
  A3: -0.5339,
  A4: 0.01569,
  A5: -0.05165,
  A6: 0.5475,
  A7: -0.7361,
  A8: 0.1844,
  A9: 0.1056,
  A10: 0.6134,
  A11: 0.7210,
} as const;

/**
 * Propiedades críticas y pesos moleculares de componentes puros
 */
export interface ComponentPhysicalProperties {
  criticalTemperatureK: number;
  criticalPressureBar: number;
  molecularWeight: number; // g/mol
}

export const PURE_COMPONENT_PROPERTIES: Record<GasComponent, ComponentPhysicalProperties> = {
  CH4: {
    criticalTemperatureK: 190.56,
    criticalPressureBar: 45.99,
    molecularWeight: 16.043,
  },
  C2H6: {
    criticalTemperatureK: 305.32,
    criticalPressureBar: 48.72,
    molecularWeight: 30.070,
  },
  C3H8: {
    criticalTemperatureK: 369.83,
    criticalPressureBar: 42.48,
    molecularWeight: 44.096,
  },
  iC4: {
    criticalTemperatureK: 407.85,
    criticalPressureBar: 36.40,
    molecularWeight: 58.122,
  },
  nC4: {
    criticalTemperatureK: 425.12,
    criticalPressureBar: 37.96,
    molecularWeight: 58.122,
  },
  iC5: {
    criticalTemperatureK: 460.39,
    criticalPressureBar: 33.81,
    molecularWeight: 72.150,
  },
  nC5: {
    criticalTemperatureK: 469.70,
    criticalPressureBar: 33.70,
    molecularWeight: 72.150,
  },
  C6plus: {
    criticalTemperatureK: 507.60,
    criticalPressureBar: 30.25,
    molecularWeight: 86.177,
  },
  N2: {
    criticalTemperatureK: 126.20,
    criticalPressureBar: 33.90,
    molecularWeight: 28.013,
  },
  CO2: {
    criticalTemperatureK: 304.13,
    criticalPressureBar: 73.77,
    molecularWeight: 44.010,
  },
  H2S: {
    criticalTemperatureK: 373.20,
    criticalPressureBar: 89.63,
    molecularWeight: 34.082,
  },
  He: {
    criticalTemperatureK: 5.19,
    criticalPressureBar: 2.27,
    molecularWeight: 4.003,
  },
};
