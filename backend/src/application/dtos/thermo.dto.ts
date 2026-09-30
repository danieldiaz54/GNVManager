// DTOs y Esquemas Zod para la API Termodinámica y de Aforo
// Custodiado por: @integration-architect
// Especificación: .specs/05-api-contracts/thermodynamic-api.spec.md

import { z } from 'zod';

export const GasComponentSchema = z.enum([
  'CH4',
  'C2H6',
  'C3H8',
  'iC4',
  'nC4',
  'iC5',
  'nC5',
  'C6plus',
  'N2',
  'CO2',
  'H2S',
  'He',
]);

export const MolarFractionSchema = z.object({
  component: GasComponentSchema,
  fraction: z.number().min(0).max(1),
});

export const ChromatographyPresetSchema = z.enum([
  'Bonga-Mamey',
  'Candilejas',
  'Gas Rico Llano',
]);

export const CustomChromatographySchema = z.object({
  id: z.string().default(() => 'custom-' + Date.now()),
  name: z.string().min(1),
  fractions: z.array(MolarFractionSchema).min(1),
  higherHeatingValueBtuScf: z.number().positive().optional(),
});

export const ChromatographyInputSchema = z.union([
  ChromatographyPresetSchema,
  CustomChromatographySchema,
]);

export const CalculateCompressibilitySchema = z.object({
  pressureBar: z.number().positive('La presión debe ser estrictamente positiva (bar)'),
  temperatureK: z.number().positive('La temperatura debe ser estrictamente positiva (K)'),
  chromatography: ChromatographyInputSchema,
});

export const CalculateStateSchema = z.object({
  pressureBar: z.number().positive('La presión debe ser estrictamente positiva (bar)'),
  temperatureK: z.number().positive('La temperatura debe ser estrictamente positiva (K)'),
  volumeLiters: z.number().positive('El volumen debe ser estrictamente positivo (L)'),
  chromatography: ChromatographyInputSchema,
});

export const IsochoricForecastSchema = z.object({
  cutoffPressureBar: z.number().positive('La presión de corte debe ser estrictamente positiva (bar)'),
  cutoffTemperatureK: z.number().positive('La temperatura de corte debe ser estrictamente positiva (K)'),
  ambientTemperatureK: z.number().positive('La temperatura ambiente debe ser estrictamente positiva (K)'),
  geometricVolumeLiters: z.number().positive('El volumen geométrico debe ser estrictamente positivo (L)'),
  chromatography: ChromatographyInputSchema,
  coolingTimeSeconds: z.number().positive().optional().default(7200),
});

export const CertifyAforoSabanasSchema = z.object({
  stabilizedPressureBar: z.number().positive('La presión estabilizada debe ser estrictamente positiva (bar)'),
  stationId: z.string().min(1, 'El identificador de estación es obligatorio'),
});

export type CalculateCompressibilityDto = z.infer<typeof CalculateCompressibilitySchema>;
export type CalculateStateDto = z.infer<typeof CalculateStateSchema>;
export type IsochoricForecastDto = z.infer<typeof IsochoricForecastSchema>;
export type CertifyAforoSabanasDto = z.infer<typeof CertifyAforoSabanasSchema>;
export type ChromatographyInput = z.infer<typeof ChromatographyInputSchema>;
