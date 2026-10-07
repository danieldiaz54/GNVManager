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

  // Métricas Ejecutivas FinOps Consolidadas
  const totalDispatchedSm3 = useMemo(() => {
    return records.reduce((sum, r) => sum + (r.calculatedVolumeSm3 || 0), 0);
  }, [records]);

  const totalDispensedSm3 = useMemo(() => {
    return records.reduce((sum, r) => {
      const sale = getSaleVolume(r);
      return sum + (sale !== null ? sale : 0);
    }, 0);
  }, [records]);

  // Variación (Sm³) = Ventas Facturadas - Volumen Consolidado Despachado
  const globalVariationSm3 = totalDispensedSm3 - totalDispatchedSm3;
  const globalMermaPercent = totalDispatchedSm3 > 0 ? (globalVariationSm3 / totalDispatchedSm3) * 100 : 0;
  const isNormalTolerance = Math.abs(globalMermaPercent) <= 2.0;

  return (
    <div className="space-y-8 animate-fade-in w-full font-sans">
      
      {/* 1. Tarjetas Ejecutivas FinOps (Bento Cards de Control Operacional) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        
        {/* Card 1: Volumen Consolidado Despachado */}
        <div className="p-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
          <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase tracking-wider block">
            Volumen Físico Despachado
          </span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-serif font-bold text-[var(--color-text-primary)] tracking-tight">
              {totalDispatchedSm3.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className="text-sm font-mono text-[var(--color-text-secondary)]">Sm³</span>
          </div>
          <span className="text-[11px] text-[var(--color-text-secondary)] mt-4 block opacity-80 pt-4 border-t border-[var(--color-border)]">
            {records.length} despachos registrados
          </span>
        </div>

        {/* Card 2: Ventas Registradas en Estación */}
        <div className="p-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
          <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase tracking-wider block">
            Ventas Surtidores (Ledger)
          </span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-serif font-bold text-[var(--color-text-primary)] tracking-tight">
              {totalDispensedSm3.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className="text-sm font-mono text-[var(--color-text-secondary)]">Sm³</span>
          </div>
          <span className="text-[11px] text-[var(--color-text-secondary)] mt-4 block opacity-80 pt-4 border-t border-[var(--color-border)]">
            {pendingCount === 0 ? '✓ 100% conciliado' : `${pendingCount} cargas pendientes de venta`}
          </span>
        </div>

        {/* Card 3: Variación Operativa / Merma */}
        <div className={`p-8 rounded-lg border shadow-none transition-all ${
          isNormalTolerance 
            ? 'bg-[var(--color-alert-green-bg)] border-[var(--color-alert-green-border)] text-[var(--color-alert-green-text)]'
            : 'bg-[var(--color-alert-red-bg)] border-[var(--color-alert-red-border)] text-[var(--color-alert-red-text)]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider block opacity-90 font-bold">
              Variación Neta / Merma
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-sm bg-white/50 font-bold border border-current">
              {isNormalTolerance ? 'En Tolerancia (≤2%)' : 'Alerta de Merma (>2%)'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-4xl font-serif font-bold tracking-tight">
              {globalVariationSm3 > 0 ? `+${globalVariationSm3.toFixed(1)}` : globalVariationSm3.toFixed(1)}
            </span>
            <span className="text-sm font-mono">Sm³</span>
            <span className="text-sm font-mono font-bold ml-auto opacity-90 bg-white/30 px-2 py-0.5 rounded-sm">
              {globalMermaPercent > 0 ? `+${globalMermaPercent.toFixed(2)}` : globalMermaPercent.toFixed(2)}%
            </span>
          </div>
          <span className="text-[11px] mt-4 block opacity-90 pt-4 border-t border-current">
            {globalVariationSm3 < 0 ? 'Merma física / Faltante frente a despacho' : globalVariationSm3 > 0 ? 'Sobrante a favor de la estación' : 'Balance exacto (0 Sm³)'}
          </span>
        </div>

      </div>

      {/* Barra de Encabezado Minimalista y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[var(--color-border)] mt-8">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--color-text-primary)] stroke-[1.8px]" />
            <h2 className="text-lg font-serif font-bold text-[var(--color-text-primary)]">
              Libro Mayor
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-[var(--color-canvas)] text-[var(--color-text-secondary)] border border-[var(--color-border)] font-bold">
              {records.length}
            </span>
          </div>

          {/* Filtros de Pestaña sutiles */}
          <div className="hidden md:flex items-center gap-2 ml-6 pl-6 border-l border-[var(--color-border)] text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-sm transition-colors cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilter('RACKS')}
              className={`px-3 py-1.5 rounded-sm transition-colors cursor-pointer ${
                filter === 'RACKS'
                  ? 'bg-[var(--color-alert-blue-bg)] text-[var(--color-alert-blue-text)] font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
              }`}
            >
              Racks
            </button>
            <button
              type="button"
              onClick={() => setFilter('INDIVIDUAL')}
              className={`px-3 py-1.5 rounded-sm transition-colors cursor-pointer ${
                filter === 'INDIVIDUAL'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
              }`}
            >
              Individuales
            </button>
            <button
              type="button"
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-sm transition-colors cursor-pointer ${
                filter === 'PENDING'
                  ? 'bg-[var(--color-alert-yellow-bg)] text-[var(--color-alert-yellow-text)] font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
              }`}
            >
              Pendientes {pendingCount > 0 && `(${pendingCount})`}
            </button>
          </div>
        </div>

        {/* Acciones Derecha */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Buscador Compacto */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por placa o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs font-sans rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-primary)] transition-colors"
            />
          </div>
        </div>

      </div>

      {/* Tabla Contable Sobria y Limpia */}
      {filteredRecords.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] shadow-none mt-8">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] opacity-50 stroke-[1.5px] mb-4" />
          <p className="text-sm font-bold text-[var(--color-text-primary)]">
            Sin registros para mostrar
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            {searchTerm ? 'No se encontraron resultados con ese criterio' : 'Guarda una carga para verla reflejada en el libro mayor'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-none mt-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              
              <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] uppercase tracking-wider font-sans">
                <tr>
                  <th className="py-4 px-6 font-bold">Fecha</th>
                  <th className="py-4 px-4 font-bold">Operación</th>
                  <th className="py-4 px-4 font-bold">Módulo / Unidad</th>
                  <th className="py-4 px-4 font-bold">P₁ → P₂</th>
                  <th className="py-4 px-4 font-bold text-right">Volumen Teórico</th>
                  <th className="py-4 px-4 font-bold text-right">Venta Estación</th>
                  <th className="py-4 px-4 font-bold text-center">Merma</th>
                  <th className="py-4 px-6 font-bold text-right font-sans">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredRecords.map((record) => {
                  const isRack = record.recordType === 'RACK_PARENT' || record.recordType === 'MANIFOLD_PARENT';
                  const saleVol = getSaleVolume(record);
                  const hasSale = saleVol !== null;
                  const variationSm3 = hasSale ? saleVol! - record.calculatedVolumeSm3 : 0;
                  const percentage = hasSale && record.calculatedVolumeSm3 > 0 ? (variationSm3 / record.calculatedVolumeSm3) * 100 : 0;
                  const isWarning = Math.abs(percentage) > 2;
                  const isEditingSale = editingSaleId === record.id;

                  const dateObj = new Date(record.createdAt);
                  const dateStr = dateObj.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  // Logic for Sabanas Certification
                  const opType = record.operationType || 'CARGUE'; // default to Cargue if missing
                  const isCargue = opType === 'CARGUE';
                  const isCertified = isCargue ? record.finalPressureBar >= 230 : true;

                  return (
                    <tr 
                      key={record.id} 
                      className="hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      {/* Fecha y Hora */}
                      <td className="py-4 px-6 text-[var(--color-text-secondary)] whitespace-nowrap">
                        <span className="font-bold text-[var(--color-text-primary)] block">
                          {dateStr}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {timeStr}
                        </span>
                      </td>

                      {/* Operación y Certificación */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono border ${
                            isCargue 
                              ? 'bg-[var(--color-alert-blue-bg)] text-[var(--color-alert-blue-text)] border-[var(--color-border)]' 
                              : 'bg-stone-100 text-stone-600 border-[var(--color-border)]'
                          }`}>
                            {opType}
                          </span>
                          {isCargue && (
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${
                              isCertified ? 'text-[var(--color-alert-green-text)]' : 'text-[var(--color-alert-red-text)]'
                            }`}>
                              {isCertified ? '✓ Aforo Cert' : '⚠ Subllenado'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tipo / Módulo */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isRack ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[var(--color-alert-blue-bg)] border border-[var(--color-border)] text-[var(--color-alert-blue-text)] font-bold text-[11px]">
                              <Layers className="w-3.5 h-3.5" />
                              {record.moduleIdentifier || 'Rack 11P'}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-secondary)] font-normal">
                              ({record.children?.length ?? 11} cil)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-[11px]">
                              <Box className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                              {record.moduleCapacityLiters.toLocaleString()} L
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Presiones */}
                      <td className="py-4 px-4 text-[var(--color-text-secondary)] whitespace-nowrap font-mono">
                        <span>{record.initialPressureBar.toFixed(0)} → {record.finalPressureBar.toFixed(0)} bar</span>
                      </td>

                      {/* Volumen Teórico Calculado */}
                      <td className="py-4 px-4 text-right whitespace-nowrap font-bold text-[var(--color-text-primary)] font-serif text-sm">
                        {record.calculatedVolumeSm3.toFixed(2)}{' '}
                        <span className="text-[10px] font-sans font-normal text-[var(--color-text-secondary)]">Sm³</span>
                        <span className="block text-[10px] font-sans font-normal text-[var(--color-text-secondary)] mt-0.5">
                          {record.calculatedMassKg.toFixed(1)} kg
                        </span>
                      </td>

                      {/* Venta en Estación (con edición limpia) */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        {isEditingSale ? (
                          <div className="inline-flex items-center gap-1.5">
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
                              className="w-24 h-8 px-2 text-xs text-right rounded-sm border border-[var(--color-text-primary)] bg-[var(--color-surface)] font-mono font-bold text-[var(--color-text-primary)] focus:outline-none"
                              placeholder="Sm³"
                            />
                            <button
                              type="button"
                              onClick={() => saveEditSale(record.id)}
                              className="p-1.5 rounded-sm bg-[var(--color-text-primary)] text-[var(--color-canvas)] hover:opacity-90 cursor-pointer"
                              title="Guardar"
                            >
                              <Check className="w-4 h-4 stroke-[2.5px]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSaleId(null)}
                              className="p-1.5 rounded-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4 stroke-[2.5px]" />
                            </button>
                          </div>
                        ) : hasSale ? (
                          <button
                            type="button"
                            onClick={() => startEditSale(record)}
                            className="group text-right font-bold text-[var(--color-text-primary)] hover:text-[#1F6C9F] cursor-pointer"
                            title="Haz clic para editar la venta"
                          >
                            <span className="font-serif text-sm">{saleVol!.toFixed(2)}</span>{' '}
                            <span className="text-[10px] font-sans font-normal text-[var(--color-text-secondary)]">Sm³</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditSale(record)}
                            className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-[var(--color-alert-yellow-text)] hover:underline px-2.5 py-1 rounded-sm bg-[var(--color-alert-yellow-bg)] border border-[var(--color-border)] cursor-pointer"
                          >
                            <span>+ Registrar</span>
                          </button>
                        )}
                      </td>

                      {/* Merma / Balance */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {hasSale ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold font-mono border ${
                            isWarning 
                              ? 'bg-[var(--color-alert-red-bg)] text-[var(--color-alert-red-text)] border-[var(--color-alert-red-border)]' 
                              : 'bg-[var(--color-alert-green-bg)] text-[var(--color-alert-green-text)] border-[var(--color-alert-green-border)]'
                          }`}>
                            {isWarning ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>{percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%</span>
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-secondary)] opacity-50">—</span>
                        )}
                      </td>

                      {/* Acción: Ver Detalle */}
                      <td className="py-4 px-6 text-right whitespace-nowrap font-sans">
                        {isRack ? (
                          <button
                            type="button"
                            onClick={() => onSelectDetailRecord?.(record)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold text-[var(--color-text-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-canvas)] border border-[var(--color-border)] hover:border-[var(--color-text-primary)] transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
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
