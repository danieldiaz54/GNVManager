import { useState, useEffect } from 'react';
import { Box, Layers, History } from 'lucide-react';
import DispatchConsole from '../components/DispatchConsole';
import ReconciliationLedger from '../components/ReconciliationLedger';
import RackDetailModal from '../components/RackDetailModal';
import { reconciliationService, SaveRackDTO, ReconciliationRecord } from '../core/api/reconciliation.service';

export default function ThermodynamicsModule() {
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [activeMode, setActiveMode] = useState<'console' | 'ledger'>('console');
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSaveOperation = async (operationData: SaveRackDTO) => {
    setIsSaving(true);
    try {
      const savedRecord = await reconciliationService.saveRackRecord(operationData);
      setRecords(prev => [savedRecord, ...prev]);
      setActiveMode('ledger'); // Transición natural hacia el libro contable
    } catch (error) {
      console.error("Error guardando la operación", error);
      alert("Hubo un error guardando el registro en la base de datos.");
    } finally {
      setIsSaving(false);
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
    <div className="space-y-8 pb-20 relative w-full font-sans">
      
      {/* Barra de Navegación Operacional Unificada (2 Modos Claros) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-[var(--color-border)]">
        
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            type="button"
            onClick={() => setActiveMode('console')}
            className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm transition-all font-medium border cursor-pointer ${
              activeMode === 'console'
                ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-accent)] font-bold shadow-xs'
                : 'bg-transparent border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Layers className="w-4 h-4 stroke-[1.8px]" />
            <span className="hidden sm:inline">Consola de Operaciones y Despacho</span>
            <span className="sm:hidden">Consola de Despacho</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('ledger')}
            className={`flex items-center gap-2 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm transition-all font-medium border cursor-pointer ${
              activeMode === 'ledger'
                ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-accent)] font-bold shadow-xs'
                : 'bg-transparent border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <History className="w-4 h-4 stroke-[1.8px]" />
            <span className="hidden sm:inline">Cuenta de Balance y Conciliación</span>
            <span className="sm:hidden">Cuenta de Balance</span>
            <span className="ml-1 text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--color-canvas)] text-[var(--color-text-primary)] border border-[var(--color-border)] font-bold">
              {records.length}
            </span>
            {pendingSalesCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--color-alert-yellow-bg)] text-[var(--color-alert-yellow-text)] font-bold border border-[var(--color-alert-yellow-border)]">
                {pendingSalesCount} pend.
              </span>
            )}
          </button>

        </div>

      </div>

      {/* Espacio de Trabajo Principal */}
      <div className="w-full transition-all duration-300">
        {activeMode === 'console' ? (
          <DispatchConsole onSaveOperation={handleSaveOperation} isSaving={isSaving} />
        ) : (
          <ReconciliationLedger 
            records={records} 
            onAddSale={handleAddSale} 
            onSelectDetailRecord={handleOpenRecordDetail}
          />
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
