import axios from 'axios';

// DTO de respuesta que recibimos del backend
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
  methanePercentage: number;
  nitrogenPercentage?: number;
  grossCalorificValue?: number;
  specificGravity: number;
  molarMass: number;
  criticalPressure: number;
  criticalTemperature: number;
}

export interface IThermodynamicsService {
  getGasProfiles(): Promise<GasProfileDTO[]>;
  
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
