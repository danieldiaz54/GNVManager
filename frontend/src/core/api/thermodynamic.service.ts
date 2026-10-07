import axios from 'axios';

export interface AforoCertificationDTO {
  certified: boolean;
  aforoSm3PerBar: number;
}

export interface TransferResult {
  massTransferredKg: number;
  volumeTransferredSm3: number;
  initialMassKg: number;
  finalMassKg: number;
  zInitial: number;
  zFinal: number;
  stabilizedPressureBar: number;
  stabilizedTempCelsius: number;
  thermalPressureLossBar: number;
  aforoCertification?: AforoCertificationDTO;
}

export interface BatchCalculationItem {
  id: number | string;
  operationType?: 'CARGUE' | 'DESCARGUE';
  gasProfileId?: string;
  initialPressureBar: number;
  initialTempK: number;
  finalPressureBar: number;
  finalTempK: number;
  volumeLiters: number;
}

export interface GasProfileDTO {
  id: string;
  name: string;
  reportDate?: string;
  reportNumber?: string;
  methanePercentage: number;
  ethanePercentage?: number;
  propanePercentage?: number;
  isoButanePercentage?: number;
  normalButanePercentage?: number;
  isoPentanePercentage?: number;
  normalPentanePercentage?: number;
  hexanesPlusPercentage?: number;
  nitrogenPercentage?: number;
  carbonDioxidePercentage?: number;
  oxygenPercentage?: number;
  grossCalorificValue?: number;
  specificGravity: number;
  molarMass: number;
  compressibilityFactor?: number;
  wobbeIndex?: number;
  criticalPressure: number;
  criticalTemperature: number;
}

export interface IThermodynamicsService {
  getGasProfiles(): Promise<GasProfileDTO[]>;
  getGasProfileById(id: string): Promise<GasProfileDTO>;
  createGasProfile(data: Omit<GasProfileDTO, 'id'>): Promise<GasProfileDTO>;
  updateGasProfile(id: string, data: Omit<GasProfileDTO, 'id'>): Promise<GasProfileDTO>;
  deleteGasProfile(id: string): Promise<void>;
  
  calculateTransfer(
    initialPressureBar: number,
    initialTempK: number,
    finalPressureBar: number,
    finalTempK: number,
    volumeLiters: number,
    operationType?: 'CARGUE' | 'DESCARGUE',
    gasProfileId?: string
  ): Promise<TransferResult>;

  calculateBatch(
    items: BatchCalculationItem[]
  ): Promise<Array<{ id: number | string; result: TransferResult }>>;
}

export class AxiosThermodynamicsService implements IThermodynamicsService {
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  async getGasProfiles(): Promise<GasProfileDTO[]> {
    const response = await axios.get(`${this.baseURL}/gas-profiles`);
    return response.data;
  }

  async getGasProfileById(id: string): Promise<GasProfileDTO> {
    const response = await axios.get(`${this.baseURL}/gas-profiles/${id}`);
    return response.data;
  }

  async createGasProfile(data: Omit<GasProfileDTO, 'id'>): Promise<GasProfileDTO> {
    const response = await axios.post(`${this.baseURL}/gas-profiles`, data);
    return response.data;
  }

  async updateGasProfile(id: string, data: Omit<GasProfileDTO, 'id'>): Promise<GasProfileDTO> {
    const response = await axios.put(`${this.baseURL}/gas-profiles/${id}`, data);
    return response.data;
  }

  async deleteGasProfile(id: string): Promise<void> {
    await axios.delete(`${this.baseURL}/gas-profiles/${id}`);
  }

  async calculateTransfer(
    initialPressureBar: number,
    initialTempK: number,
    finalPressureBar: number,
    finalTempK: number,
    volumeLiters: number,
    operationType?: 'CARGUE' | 'DESCARGUE',
    gasProfileId?: string
  ): Promise<TransferResult> {
    const response = await axios.post(`${this.baseURL}/thermodynamics/calculate`, {
      operationType,
      gasProfileId,
      initial: {
        pressureBar: initialPressureBar,
        temperatureK: initialTempK
      },
      final: {
        pressureBar: finalPressureBar,
        temperatureK: finalTempK
      },
      volumeLiters
    });

    return response.data.data;
  }

  async calculateBatch(
    items: BatchCalculationItem[]
  ): Promise<Array<{ id: number | string; result: TransferResult }>> {
    const response = await axios.post(`${this.baseURL}/thermodynamics/calculate-batch`, {
      items: items.map(item => ({
        id: item.id,
        operationType: item.operationType,
        gasProfileId: item.gasProfileId,
        initial: {
          pressureBar: item.initialPressureBar,
          temperatureK: item.initialTempK
        },
        final: {
          pressureBar: item.finalPressureBar,
          temperatureK: item.finalTempK
        },
        volumeLiters: item.volumeLiters
      }))
    });

    return response.data.data;
  }
}

// Exportamos una instancia lista para usar (en el futuro esto podría inyectarse vía Context o Zustand)
export const thermodynamicsService = new AxiosThermodynamicsService();
