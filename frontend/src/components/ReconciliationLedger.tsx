import { useState, useMemo } from 'react';
import { 
  History, 
  FileSpreadsheet, 
  Layers, 
  Box, 
  Eye, 
  Search, 
  Check, 
  X,
  AlertCircle,
  CheckCircle2,
  Download,
  FileText
} from 'lucide-react';
import { ReconciliationRecord, reconciliationService } from '../core/api/reconciliation.service';

interface ReconciliationLedgerProps {
  records: ReconciliationRecord[];
  onAddSale: (id: string, vol: number) => void;
  onSelectDetailRecord?: (record: ReconciliationRecord) => void;
}

type FilterType = 'ALL' | 'RACKS' | 'INDIVIDUAL' | 'PENDING';

export default function ReconciliationLedger({ 
  records, 
  onAddSale,
  onSelectDetailRecord
}: ReconciliationLedgerProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [saleInputVal, setSaleInputVal] = useState<string>('');

  const getSaleVolume = (record: ReconciliationRecord): number | null => {
    if (!record.events) return null;
    const sales = record.events.filter(e => e.eventType === 'SALE_DISPENSED');
    if (sales.length === 0) return null;
    return sales.reduce((sum, e) => sum + (e.saleVolumeSm3 || 0), 0);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const isRack = record.recordType === 'RACK_PARENT' || record.recordType === 'MANIFOLD_PARENT';
      const saleVol = getSaleVolume(record);
      const isPending = saleVol === null;

      if (filter === 'RACKS' && !isRack) return false;
      if (filter === 'INDIVIDUAL' && isRack) return false;
      if (filter === 'PENDING' && !isPending) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const idMatch = record.id.toLowerCase().includes(query);
        const modMatch = record.moduleIdentifier?.toLowerCase().includes(query) ?? false;
        if (!idMatch && !modMatch) return false;
      }

      return true;
    });
  }, [records, filter, searchTerm]);

  const pendingCount = useMemo(() => {
    return records.filter(r => getSaleVolume(r) === null).length;
  }, [records]);

  const startEditSale = (record: ReconciliationRecord) => {
    setEditingSaleId(record.id);
    const saleVol = getSaleVolume(record);
    setSaleInputVal(saleVol !== null ? saleVol.toString() : '');
  };

  const saveEditSale = (id: string) => {
    const val = parseFloat(saleInputVal);
    if (!isNaN(val) && val >= 0) {
      onAddSale(id, val);
    }
    setEditingSaleId(null);
    setSaleInputVal('');
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      await reconciliationService.exportLedgerReport(format);
    } catch (error) {
      console.error('Failed to export ledger report:', error);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in w-full">
      
      {/* Barra de Encabezado Minimalista y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--color-text-primary)] stroke-[1.8px]" />
            <h2 className="text-lg font-serif font-bold text-[var(--color-text-primary)]">
              Libro Mayor
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
              {records.length}
            </span>
          </div>

          {/* Filtros de Pestaña sutiles */}
          <div className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-[var(--color-border)] text-xs">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'ALL'
                  ? 'bg-[var(--color-surface-hover)]/80 font-semibold text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilter('RACKS')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'RACKS'
                  ? 'bg-[var(--color-alert-blue-bg)] font-semibold text-[var(--color-alert-blue-text)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Racks
            </button>
            <button
              type="button"
              onClick={() => setFilter('INDIVIDUAL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'INDIVIDUAL'
                  ? 'bg-[var(--color-surface-hover)]/80 font-semibold text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Individuales
            </button>
            <button
              type="button"
              onClick={() => setFilter('PENDING')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'PENDING'
                  ? 'bg-[var(--color-alert-yellow-bg)] font-semibold text-[var(--color-alert-yellow-text)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Pendientes {pendingCount > 0 && `(${pendingCount})`}
            </button>
          </div>
        </div>

        {/* Acciones Derecha */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Buscador Compacto */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[var(--color-text-secondary)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por placa o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] focus:outline-none focus:ring-1 focus:ring-cyan-500/50 font-sans"
            />
          </div>
          
          {/* Export Buttons */}
          <div className="flex items-center gap-1.5 border-l border-[var(--color-border)] pl-2">
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-medium text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-canvas)] rounded-lg transition-colors"
              title="Exportar Acta (PDF)"
            >
              <FileText className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-medium text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-canvas)] rounded-lg transition-colors"
              title="Exportar Datos (CSV)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>

      </div>

      {/* Tabla Contable Sobria y Limpia */}
      {filteredRecords.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[var(--color-border)] rounded-md bg-[var(--color-surface)]/30">
          <FileSpreadsheet className="w-10 h-10 mx-auto text-[var(--color-text-secondary)] stroke-[1.5px] mb-2" />
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Sin registros para mostrar
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {searchTerm ? 'No se encontraron resultados con ese criterio' : 'Guarda una carga para verla reflejada en el libro mayor'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              
              <thead className="bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] uppercase tracking-wider font-sans">
                <tr>
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-3 font-semibold">Módulo / Unidad</th>
                  <th className="py-3 px-3 font-semibold">P₁ → P₂</th>
                  <th className="py-3 px-3 font-semibold text-right">Volumen Teórico</th>
                  <th className="py-3 px-3 font-semibold text-right">Venta Estación</th>
                  <th className="py-3 px-3 font-semibold text-center">Merma</th>
                  <th className="py-3 px-4 font-semibold text-right font-sans">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredRecords.map((record) => {
                  const isRack = record.recordType === 'RACK_PARENT' || record.recordType === 'MANIFOLD_PARENT';
                  const saleVol = getSaleVolume(record);
                  const hasSale = saleVol !== null;
                  const discrepancy = hasSale ? record.calculatedVolumeSm3 - saleVol! : 0;
                  const percentage = hasSale ? (discrepancy / record.calculatedVolumeSm3) * 100 : 0;
                  const isWarning = percentage > 2 || percentage < -2;
                  const isEditingSale = editingSaleId === record.id;

                  const dateObj = new Date(record.createdAt);
                  const dateStr = dateObj.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr 
                      key={record.id} 
                      className="hover:bg-[var(--color-surface-hover)]/80 transition-colors"
                    >
                      {/* Fecha y Hora */}
                      <td className="py-3 px-4 text-[var(--color-text-secondary)] whitespace-nowrap">
                        <span className="font-semibold text-[var(--color-text-primary)] block">
                          {dateStr}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {timeStr}
                        </span>
                      </td>

                      {/* Tipo / Módulo */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isRack ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-alert-blue-bg)] border border-[var(--color-border)] text-[var(--color-alert-blue-text)] font-semibold text-[11px]">
                              <Layers className="w-3 h-3" />
                              {record.moduleIdentifier || 'Rack 11P'}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-secondary)] font-normal">
                              ({record.children?.length ?? 11} cil)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[11px]">
                              <Box className="w-3 h-3 text-[var(--color-text-secondary)]" />
                              {record.moduleCapacityLiters.toLocaleString()} L
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Presiones */}
                      <td className="py-3 px-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                        <span>{record.initialPressureBar.toFixed(0)} → {record.finalPressureBar.toFixed(0)} bar</span>
                      </td>

                      {/* Volumen Teórico Calculado */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-[var(--color-text-primary)]">
                        {record.calculatedVolumeSm3.toFixed(2)}{' '}
                        <span className="text-[10px] font-sans font-normal text-[var(--color-text-secondary)]">Sm³</span>
                        <span className="block text-[10px] font-normal text-[var(--color-text-secondary)]">
                          {record.calculatedMassKg.toFixed(1)} kg
                        </span>
                      </td>

                      {/* Venta en Estación (con edición limpia) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {isEditingSale ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              autoFocus
                              value={saleInputVal}
                              onChange={(e) => setSaleInputVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditSale(record.id);
                                if (e.key === 'Escape') setEditingSaleId(null);
                              }}
                              className="w-20 h-7 px-1.5 text-xs text-right rounded border border-cyan-400 bg-[var(--color-surface)] font-mono focus:outline-none"
                              placeholder="Sm³"
                            />
                            <button
                              type="button"
                              onClick={() => saveEditSale(record.id)}
                              className="p-1 rounded bg-[var(--color-accent)] text-white hover:opacity-90"
                              title="Guardar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSaleId(null)}
                              className="p-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)]"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : hasSale ? (
                          <button
                            type="button"
                            onClick={() => startEditSale(record)}
                            className="group text-right font-bold text-[var(--color-text-primary)] hover:text-[var(--color-alert-blue-text)]"
                            title="Haz clic para editar la venta"
                          >
                            <span>{saleVol!.toFixed(2)}</span>{' '}
                            <span className="text-[10px] font-sans font-normal text-[var(--color-text-secondary)]">Sm³</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditSale(record)}
                            className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-[var(--color-alert-yellow-text)] hover:underline px-2 py-0.5 rounded bg-[var(--color-alert-yellow-bg)] border border-[var(--color-alert-yellow-bg)]"
                          >
                            <span>+ Registrar</span>
                          </button>
                        )}
                      </td>

                      {/* Merma / Balance */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {hasSale ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                            isWarning 
                              ? 'bg-[var(--color-alert-red-bg)] text-[var(--color-alert-red-text)] border border-[var(--color-alert-red-border)]' 
                              : 'bg-[var(--color-alert-green-bg)] text-[var(--color-alert-green-text)] border border-[var(--color-alert-green-border)]'
                          }`}>
                            {isWarning ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            <span>{percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%</span>
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-secondary)]">—</span>
                        )}
                      </td>

                      {/* Acción: Ver Detalle */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-sans">
                        {isRack ? (
                          <button
                            type="button"
                            onClick={() => onSelectDetailRecord?.(record)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-[var(--color-alert-blue-text)] bg-[var(--color-alert-blue-bg)] hover:bg-[var(--color-alert-blue-bg)] border border-[var(--color-border)] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Desglose</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[var(--color-text-secondary)] font-normal italic">
                            Individual
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        </div>
      )}

    </div>
  );
}
