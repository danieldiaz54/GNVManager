import { API_BASE_URL } from './config';

export interface StorageModuleDTO {
  id: string;
  name: string;
  type: 'ESTACIONARIA' | 'TRANSPORTE';
  cylinderCount: number;
  cylinderCapacityLiters: number;
  totalCapacityLiters: number;
  createdAt: string;
}

export interface CreateStorageModuleDTO {
  name: string;
  type: 'ESTACIONARIA' | 'TRANSPORTE';
  cylinderCount: number;
  cylinderCapacityLiters: number;
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
