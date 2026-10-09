import { API_BASE_URL } from './config';

export interface StorageModuleDTO {
  id: string;
  name: string;
  type: 'ESTACIONARIA' | 'TRANSPORTE';
  cylinderCount: number;
  cylinderCapacityLiters: number;
  totalCapacityLiters: number;
  // Parámetros Operativos y Seguridad
  workingPressureBar: number;
  testPressureBar: number;
  safetyReliefPressureBar: number;
  minOperatingTempC: number;
  maxOperatingTempC: number;
  // Pesaje y Logística
  tareWeightKg?: number | null;
  maxPayloadKg?: number | null;
  grossWeightKg?: number | null;
  chassisType?: string | null;
  // Mecánica y Tubo
  tubeMaterial?: string | null;
  tubeOuterDiameterMm?: number | null;
  tubeLengthMm?: number | null;
  plugConfiguration?: string | null;
  valveManufacturer?: string | null;
  // Normativa
  manufacturingStandard?: string | null;
  certificationAgency?: string | null;
  designLifeYears?: number | null;
  createdAt: string;
}

export interface CreateStorageModuleDTO {
  name: string;
  type: 'ESTACIONARIA' | 'TRANSPORTE';
  cylinderCount: number;
  cylinderCapacityLiters: number;
  workingPressureBar?: number;
  testPressureBar?: number;
  safetyReliefPressureBar?: number;
  minOperatingTempC?: number;
  maxOperatingTempC?: number;
  tareWeightKg?: number | null;
  maxPayloadKg?: number | null;
  grossWeightKg?: number | null;
  chassisType?: string | null;
  tubeMaterial?: string | null;
  tubeOuterDiameterMm?: number | null;
  tubeLengthMm?: number | null;
  plugConfiguration?: string | null;
  valveManufacturer?: string | null;
  manufacturingStandard?: string | null;
  certificationAgency?: string | null;
  designLifeYears?: number | null;
}

export const StorageService = {
  async getModules(): Promise<StorageModuleDTO[]> {
    const response = await fetch(`${API_BASE_URL}/storage-modules`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`Error fetching storage modules: ${response.statusText}`);
    return response.json();
  },

  async createModule(data: CreateStorageModuleDTO): Promise<StorageModuleDTO> {
    const response = await fetch(`${API_BASE_URL}/storage-modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error creating storage module: ${response.statusText}`);
    return response.json();
  },

  async updateModule(id: string, data: Partial<CreateStorageModuleDTO>): Promise<StorageModuleDTO> {
    const response = await fetch(`${API_BASE_URL}/storage-modules/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error updating storage module`);
    return response.json();
  },

  async deleteModule(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/storage-modules/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Error deleting storage module`);
  }
};
