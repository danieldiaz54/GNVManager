export interface GasProfilePreset {
  id: string;
  name: string;
  methanePercentage?: number;
  nitrogenPercentage?: number | null;
  grossCalorificValue?: number;
  specificGravity?: number;
  molarMass?: number;
}

export const DEFAULT_GAS_PROFILES: GasProfilePreset[] = [
  { 
    id: 'bonga-mamey', 
    name: 'Bonga-Mamey (Piloto Sabanas)',
    methanePercentage: 96.3666,
    nitrogenPercentage: 2.5379,
    grossCalorificValue: 8884.25,
    specificGravity: 0.5756,
    molarMass: 16.67
  },
  { 
    id: 'candilejas', 
    name: 'Candilejas (Canacol 2)',
    methanePercentage: 99.1685,
    nitrogenPercentage: null,
    grossCalorificValue: 8940.76,
    specificGravity: 0.5600,
    molarMass: 16.22
  }
];
