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
  CheckCircle2
} from 'lucide-react';
import { ReconciliationRecord } from '../core/api/reconciliation.service';

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

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const isRack = record.recordType === 'RACK_PARENT' || record.recordType === 'MANIFOLD_PARENT';
      const isPending = record.saleVolumeSm3 === null || record.saleVolumeSm3 === undefined;

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
    return records.filter(r => r.saleVolumeSm3 === null || r.saleVolumeSm3 === undefined).length;
  }, [records]);

  const startEditSale = (record: ReconciliationRecord) => {
    setEditingSaleId(record.id);
    setSaleInputVal(record.saleVolumeSm3 !== null && record.saleVolumeSm3 !== undefined ? record.saleVolumeSm3.toString() : '');
  };

  const saveEditSale = (id: string) => {
    const val = parseFloat(saleInputVal);
    if (!isNaN(val) && val >= 0) {
      onAddSale(id, val);
    }
    setEditingSaleId(null);
    setSaleInputVal('');
  };

  return (
    <div className="space-y-4 animate-fade-in w-full">
      
      {/* Barra de Encabezado Minimalista y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700 dark:text-zinc-300 stroke-[1.8px]" />
            <h2 className="text-lg font-serif font-bold text-[var(--color-text-primary)]">
              Libro Mayor
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
              {records.length}
            </span>
          </div>

          {/* Filtros de Pestaña sutiles */}
          <div className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-slate-200 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'ALL'
                  ? 'bg-slate-200/80 dark:bg-zinc-700 font-semibold text-slate-900 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilter('RACKS')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'RACKS'
                  ? 'bg-cyan-100 dark:bg-cyan-950 font-semibold text-cyan-800 dark:text-cyan-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              Racks
            </button>
            <button
              type="button"
              onClick={() => setFilter('INDIVIDUAL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'INDIVIDUAL'
                  ? 'bg-slate-200/80 dark:bg-zinc-700 font-semibold text-slate-900 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              Individuales
            </button>
            <button
              type="button"
              onClick={() => setFilter('PENDING')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'PENDING'
                  ? 'bg-amber-100 dark:bg-amber-950 font-semibold text-amber-800 dark:text-amber-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
              }`}
            >
              Pendientes {pendingCount > 0 && `(${pendingCount})`}
            </button>
          </div>
        </div>

        {/* Buscador Compacto */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por placa o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 font-sans"
          />
        </div>

      </div>

      {/* Tabla Contable Sobria y Limpia */}
      {filteredRecords.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-white/30 dark:bg-zinc-900/20">
          <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400 stroke-[1.5px] mb-2" />
          <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
            Sin registros para mostrar
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {searchTerm ? 'No se encontraron resultados con ese criterio' : 'Guarda una carga para verla reflejada en el libro mayor'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              
              <thead className="bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-sans">
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

              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredRecords.map((record) => {
                  const isRack = record.recordType === 'RACK_PARENT' || record.recordType === 'MANIFOLD_PARENT';
                  const hasSale = record.saleVolumeSm3 !== undefined && record.saleVolumeSm3 !== null;
                  const discrepancy = hasSale ? record.calculatedVolumeSm3 - record.saleVolumeSm3! : 0;
                  const percentage = hasSale ? (discrepancy / record.calculatedVolumeSm3) * 100 : 0;
                  const isWarning = percentage > 2 || percentage < -2;
                  const isEditingSale = editingSaleId === record.id;

                  const dateObj = new Date(record.createdAt);
                  const dateStr = dateObj.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr 
                      key={record.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Fecha y Hora */}
                      <td className="py-3 px-4 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-zinc-200 block">
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/70 text-cyan-700 dark:text-cyan-300 font-semibold text-[11px]">
                              <Layers className="w-3 h-3" />
                              {record.moduleIdentifier || 'Rack 11P'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({record.children?.length ?? 11} cil)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-[11px]">
                              <Box className="w-3 h-3 text-slate-400" />
                              {record.moduleCapacityLiters.toLocaleString()} L
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Presiones */}
                      <td className="py-3 px-3 text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        <span>{record.initialPressureBar.toFixed(0)} → {record.finalPressureBar.toFixed(0)} bar</span>
                      </td>

                      {/* Volumen Teórico Calculado */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-slate-900 dark:text-zinc-100">
                        {record.calculatedVolumeSm3.toFixed(2)}{' '}
                        <span className="text-[10px] font-sans font-normal text-slate-500">Sm³</span>
                        <span className="block text-[10px] font-normal text-slate-400">
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
                              className="w-20 h-7 px-1.5 text-xs text-right rounded border border-cyan-400 bg-white dark:bg-zinc-900 font-mono focus:outline-none"
                              placeholder="Sm³"
                            />
                            <button
                              type="button"
                              onClick={() => saveEditSale(record.id)}
                              className="p-1 rounded bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
                              title="Guardar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSaleId(null)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : hasSale ? (
                          <button
                            type="button"
                            onClick={() => startEditSale(record)}
                            className="group text-right font-bold text-slate-800 dark:text-zinc-200 hover:text-cyan-600 dark:hover:text-cyan-400"
                            title="Haz clic para editar la venta"
                          >
                            <span>{record.saleVolumeSm3!.toFixed(2)}</span>{' '}
                            <span className="text-[10px] font-sans font-normal text-slate-500">Sm³</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditSale(record)}
                            className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-amber-600 dark:text-amber-400 hover:underline px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60"
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
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {isWarning ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            <span>{percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Acción: Ver Detalle */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-sans">
                        {isRack ? (
                          <button
                            type="button"
                            onClick={() => onSelectDetailRecord?.(record)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-800/80 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Desglose</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-normal italic">
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
