export interface GasProfilePreset {
  id: string;
  name: string;
  methanePercentage?: number;
  nitrogenPercentage?: number | null;
  co2Percentage?: number | null;
  grossCalorificValue?: number;
  specificGravity?: number;
  molarMass?: number;
  densityKgM3?: number;
  wobbeIndexKcalM3?: number;
  standardZFactor?: number;
}

export const DEFAULT_GAS_PROFILES: GasProfilePreset[] = [
  { 
    id: 'bonga-mamey', 
    name: 'EDS GNC Bonga - Mamey',
    methanePercentage: 96.3666,
    nitrogenPercentage: 2.5379,
    co2Percentage: 0.0074,
    grossCalorificValue: 8884.2562,
    specificGravity: 0.5756,
    molarMass: 16.6708,
    densityKgM3: 11.250327,
    wobbeIndexKcalM3: 11710.0496,
    standardZFactor: 0.998006
  },
  { 
    id: 'candilejas', 
    name: 'EDS GNC Candilejas (Canacol 2)',
    methanePercentage: 99.1685,
    nitrogenPercentage: 0.3994,
    co2Percentage: 0.2252,
    grossCalorificValue: 8940.7667,
    specificGravity: 0.5600,
    molarMass: 16.2190,
    densityKgM3: 10.944631,
    wobbeIndexKcalM3: 11947.5718,
    standardZFactor: 0.998021
  }
];
