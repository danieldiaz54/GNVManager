import axios from 'axios';
import { API_BASE_URL } from './config';

export interface ReconciliationRecord {
  id: string;
  createdAt: string;
  recordType?: string; // "INDIVIDUAL" | "RACK_PARENT" | "RACK_CHILD" | "MANIFOLD_PARENT" | "MANIFOLD_CHILD"
  operationType?: 'CARGUE' | 'DESCARGUE';
  gasProfileId?: string;
  moduleIdentifier?: string | null;
  positionNumber?: number | null;
  parentId?: string | null;
  children?: ReconciliationRecord[];
  moduleCapacityLiters: number;
  initialPressureBar: number;
  initialTempK: number;
  finalPressureBar: number;
  finalTempK: number;
  calculatedMassKg: number;
  calculatedVolumeSm3: number;
  events?: ReconciliationEvent[];
  // Temporarily added to prevent UI crashes, computed from events if needed
  saleVolumeSm3?: number | null; 
}

export interface ReconciliationEvent {
  id: string;
  recordId: string;
  eventType: string;
  saleVolumeSm3?: number | null;
  createdAt: string;
}

export interface CreateReconciliationDTO {
  recordType?: string;
  operationType?: 'CARGUE' | 'DESCARGUE';
  gasProfileId?: string;
  moduleIdentifier?: string | null;
  positionNumber?: number | null;
  moduleCapacityLiters: number;
  initialPressureBar: number;
  initialTempK: number;
  finalPressureBar: number;
  finalTempK: number;
  calculatedMassKg: number;
  calculatedVolumeSm3: number;
}

export interface SaveRackDTO {
  parent: CreateReconciliationDTO;
  positions: CreateReconciliationDTO[];
}

export type SaveManifoldDTO = SaveRackDTO;

export class AxiosReconciliationService {
  private baseURL = API_BASE_URL;

  async saveRecord(data: CreateReconciliationDTO): Promise<ReconciliationRecord> {
    const response = await axios.post(`${this.baseURL}/reconciliation`, data);
    return response.data.data;
  }

  async saveRackRecord(data: SaveRackDTO): Promise<ReconciliationRecord> {
    const response = await axios.post(`${this.baseURL}/reconciliation/rack`, data);
    return response.data.data;
  }

  async saveManifoldRecord(data: SaveRackDTO): Promise<ReconciliationRecord> {
    return this.saveRackRecord(data);
  }

  async getHistory(): Promise<ReconciliationRecord[]> {
    const response = await axios.get(`${this.baseURL}/reconciliation`);
    const records = response.data.data as ReconciliationRecord[];
    return records.map(record => ({
      ...record,
      // Map saleVolumeSm3 from events for UI compatibility
      saleVolumeSm3: record.saleVolumeSm3 ?? (record.events?.find(e => e.eventType === 'SALE_UPDATE' || e.saleVolumeSm3 != null)?.saleVolumeSm3 || 0)
    }));
  }

  async updateSaleVolume(id: string, saleVolumeSm3: number): Promise<ReconciliationRecord> {
    const response = await axios.patch(`${this.baseURL}/reconciliation/${id}/sale`, { saleVolumeSm3 });
    return response.data.data;
  }

  async exportLedgerReport(id: string, format: 'pdf' | 'csv'): Promise<void> {
    const response = await axios.get(`${this.baseURL}/reconciliation/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `reconciliation_ledger_${id}_${dateStr}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export const reconciliationService = new AxiosReconciliationService();
