export interface GasProfilePreset {
  id: string;
  name: string;
}

export const DEFAULT_GAS_PROFILES: GasProfilePreset[] = [
  { id: 'bonga-mamey', name: 'Bonga-Mamey' },
  { id: 'candilejas', name: 'Candilejas' }
];
