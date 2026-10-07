import { useState, useEffect } from 'react';
import { Box, Layers, History } from 'lucide-react';
import ThermodynamicCalculator from '../components/ThermodynamicCalculator';
import RackCalculator from '../components/RackCalculator';
import ReconciliationLedger from '../components/ReconciliationLedger';
import RackDetailModal from '../components/RackDetailModal';
import { reconciliationService, CreateReconciliationDTO, SaveRackDTO, ReconciliationRecord } from '../core/api/reconciliation.service';
import { psiToBar, celsiusToKelvin } from '../core/utils/UnitConversion';

export default function ThermodynamicsModule() {
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [activeMode, setActiveMode] = useState<'individual' | 'rack' | 'ledger'>('individual');
  const [isSavingRack, setIsSavingRack] = useState(false);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<ReconciliationRecord | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await reconciliationService.getHistory();
        setRecords(history);
      } catch (error) {
        console.error("Error al conectar con la base de datos", error);
      }
    };
    fetchHistory();
  }, []);

  const handleSaveCharge = async (chargeData: any) => {
    try {
      const dto: CreateReconciliationDTO = {
        moduleCapacityLiters: chargeData.capacity,
        initialPressureBar: chargeData.unit === 'psi' ? psiToBar(chargeData.initial.p) : chargeData.initial.p,
        initialTempK: celsiusToKelvin(chargeData.initial.t),
        finalPressureBar: chargeData.unit === 'psi' ? psiToBar(chargeData.final.p) : chargeData.final.p,
        finalTempK: celsiusToKelvin(chargeData.final.t),
        calculatedMassKg: chargeData.mass_kg,
        calculatedVolumeSm3: chargeData.volume_Sm3
      };

      const savedRecord = await reconciliationService.saveRecord(dto);
      setRecords(prev => [savedRecord, ...prev]);
      setActiveMode('ledger'); // Cambia a la vista principal del libro mayor
    } catch (error) {
      console.error("Error guardando el registro", error);
      alert("Hubo un error guardando el registro en la base de datos.");
    }
  };

  const handleSaveRack = async (rackData: SaveRackDTO) => {
    setIsSavingRack(true);
    try {
      const savedRecord = await reconciliationService.saveRackRecord(rackData);
      setRecords(prev => [savedRecord, ...prev]);
      setActiveMode('ledger'); // Cambia a la vista principal del libro mayor
    } catch (error) {
      console.error("Error guardando la carga del rack", error);
      alert("Hubo un error guardando el rack en la base de datos.");
    } finally {
      setIsSavingRack(false);
    }
  };

  const handleAddSale = async (id: string, saleVolume_Sm3: number) => {
    try {
      const updatedRecord = await reconciliationService.updateSaleVolume(id, saleVolume_Sm3);
      setRecords(prev => prev.map(record => 
        record.id === id ? updatedRecord : record
      ));
    } catch (error) {
      console.error("Error guardando la venta", error);
      alert("No se pudo guardar la venta en la base de datos.");
    }
  };

  const handleOpenRecordDetail = (record: ReconciliationRecord) => {
    setSelectedDetailRecord(record);
  };

  const getSaleVolume = (record: ReconciliationRecord): number | null => {
    if (!record.events) return null;
    const sales = record.events.filter(e => e.eventType === 'SALE_DISPENSED');
    if (sales.length === 0) return null;
    return sales.reduce((sum, e) => sum + (e.saleVolumeSm3 || 0), 0);
  };

  const pendingSalesCount = records.filter(r => getSaleVolume(r) === null).length;

  return (
    <div className="space-y-12 pb-20 relative w-full">
      
      {/* Barra Superior de Navegación Segmentada (3 Vistas Principales) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-[var(--color-border)]">
        
        <div className="flex items-center gap-2 flex-wrap">
          
          <button
            type="button"
            onClick={() => setActiveMode('individual')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm transition-all duration-200 border ${
              activeMode === 'individual'
                ? 'bg-white border-[#EAEAEA] text-[#111111]'
                : 'bg-transparent border-transparent text-[#787774] hover:text-[#111111]'
            }`}
          >
            <Box className="w-4 h-4 stroke-[1.5px]" />
            <span>Módulo Individual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('rack')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm transition-all duration-200 border ${
              activeMode === 'rack'
                ? 'bg-[#E1F3FE] border-[#E1F3FE] text-[#1F6C9F]'
                : 'bg-transparent border-transparent text-[#787774] hover:text-[#111111]'
            }`}
          >
            <Layers className="w-4 h-4 stroke-[1.5px]" />
            <span>Carga Rack (11 Posiciones)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('ledger')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm transition-all duration-200 border ${
              activeMode === 'ledger'
                ? 'bg-[#EDF3EC] border-[#EDF3EC] text-[#346538]'
                : 'bg-transparent border-transparent text-[#787774] hover:text-[#111111]'
            }`}
          >
            <div className="relative">
              <History className="w-4 h-4 stroke-[1.5px]" />
            </div>
            <span>Libro Mayor</span>
            <span className="ml-1 text-xs font-mono px-2 py-0.5 rounded-full bg-white text-[#111111] border border-[#EAEAEA]">
              {records.length}
            </span>
          </button>

        </div>

      </div>

      {/* Espacio de Trabajo Principal */}
      <div className="w-full transition-all duration-300">
        {activeMode === 'individual' && (
          <div className="w-full">
            <ThermodynamicCalculator onSaveCharge={handleSaveCharge} />
          </div>
        )}

        {activeMode === 'rack' && (
          <div className="w-full">
            <RackCalculator onSave={handleSaveRack} isSaving={isSavingRack} />
          </div>
        )}

        {activeMode === 'ledger' && (
          <div className="w-full">
            <ReconciliationLedger 
              records={records} 
              onAddSale={handleAddSale} 
              onSelectDetailRecord={handleOpenRecordDetail}
            />
          </div>
        )}
      </div>

      {/* Vista Superpuesta: Detalle Completo del Rack con fondo oscurecido y desenfocado */}
      {selectedDetailRecord && (
        <RackDetailModal
          record={records.find(r => r.id === selectedDetailRecord.id) || selectedDetailRecord}
          onClose={() => setSelectedDetailRecord(null)}
          onAddSale={handleAddSale}
        />
      )}

    </div>
  );
}
