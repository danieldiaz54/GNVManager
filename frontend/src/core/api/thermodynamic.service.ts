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
  initialPressureBar: number;
  initialTempK: number;
  finalPressureBar: number;
  finalTempK: number;
  volumeLiters: number;
}

export interface IThermodynamicsService {
  calculateTransfer(
    initialPressureBar: number,
    initialTempK: number,
    finalPressureBar: number,
    finalTempK: number,
    volumeLiters: number
  ): Promise<TransferResult>;

  calculateBatch(
    items: BatchCalculationItem[]
  ): Promise<Array<{ id: number | string; result: TransferResult }>>;
}

export class AxiosThermodynamicsService implements IThermodynamicsService {
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  async calculateTransfer(
    initialPressureBar: number,
    initialTempK: number,
    finalPressureBar: number,
    finalTempK: number,
    volumeLiters: number
  ): Promise<TransferResult> {
    const response = await axios.post(`${this.baseURL}/thermodynamics/calculate`, {
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
