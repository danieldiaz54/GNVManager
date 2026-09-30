// DTOs y Esquemas Zod para Despacho y Topología de Activos (Dominio 02 / 05)
// Custodiado por: @integration-architect
// Basado en: .specs/02-data-topology/dispatch-operations.spec.md

import { z } from 'zod';
import { ChromatographyInputSchema } from './thermo.dto';

export const CylinderInputSchema = z.object({
  id: z.string().default(() => 'cyl-' + Math.random().toString(36).substring(2, 9)),
  serialNumber: z.string().min(1, 'Número de serie de cilindro obligatorio'),
  waterCapacityLiters: z.number().positive(),
  tareWeightKg: z.number().positive(),
  manufacturingDate: z.string().or(z.date()).transform((val) => new Date(val)),
  hydrostaticTestDate: z.string().or(z.date()).transform((val) => new Date(val)),
  nextHydrostaticDueDate: z.string().or(z.date()).transform((val) => new Date(val)),
});

export const ModularRackInputSchema = z.object({
  id: z.string().default(() => 'rack-' + Math.random().toString(36).substring(2, 9)),
  plateCode: z.string().min(1, 'Código de placa obligatorio'),
  rackType: z.enum(['ELEVEN_CYLINDER_13497L', 'TWELVE_CYLINDER_26950L', 'CUSTOM_MODULE']),
  nominalVolumeLiters: z.number().positive(),
  maxWorkingPressureBar: z.number().positive().default(250.0),
  cylinders: z.array(CylinderInputSchema).min(1, 'El rack debe contener al menos un cilindro'),
});

export const ValidateRackSchema = z.object({
  rack: ModularRackInputSchema,
  operationDate: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : new Date())),
});

export const ExecuteLoadingSchema = z.object({
  consecutiveNumber: z.string().min(1, 'Número consecutivo de despacho obligatorio'),
  stationCode: z.string().min(1, 'Código de estación obligatorio'),
  rack: ModularRackInputSchema,
  chromatography: ChromatographyInputSchema,
  initialPressureBar: z.number().positive('Presión inicial positiva requerida'),
  initialTemperatureK: z.number().positive('Temperatura inicial positiva requerida'),
  cutoffPressureBar: z.number().positive('Presión al corte positiva requerida'),
  cutoffTemperatureK: z.number().positive('Temperatura al corte positiva requerida'),
  ambientTemperatureK: z.number().positive('Temperatura ambiente positiva requerida'),
  operationDate: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : new Date())),
});

export const ExecuteUnloadingSchema = z.object({
  consecutiveNumber: z.string().min(1, 'Número consecutivo de recibo obligatorio'),
  stationCode: z.string().min(1, 'Código de estación obligatorio'),
  rack: ModularRackInputSchema,
  chromatography: ChromatographyInputSchema,
  initialPressureBar: z.number().positive('Presión inicial positiva requerida'),
  initialTemperatureK: z.number().positive('Temperatura inicial positiva requerida'),
  cutoffPressureBar: z.number().positive('Presión final positiva requerida'),
  cutoffTemperatureK: z.number().positive('Temperatura final positiva requerida'),
  operationDate: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : new Date())),
});

export type CylinderInputDto = z.infer<typeof CylinderInputSchema>;
export type ModularRackInputDto = z.infer<typeof ModularRackInputSchema>;
export type ValidateRackDto = z.infer<typeof ValidateRackSchema>;
export type ExecuteLoadingDto = z.infer<typeof ExecuteLoadingSchema>;
export type ExecuteUnloadingDto = z.infer<typeof ExecuteUnloadingSchema>;
