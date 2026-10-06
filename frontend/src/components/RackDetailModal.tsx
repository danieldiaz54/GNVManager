import { useState, useEffect } from 'react';
import { 
  X, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Table as TableIcon, 
  LayoutGrid, 
  Scale, 
  Fuel, 
  Gauge, 
  Calendar,
  Box,
  TrendingDown,
  ArrowLeft
} from 'lucide-react';
import { ReconciliationRecord } from '../core/api/reconciliation.service';

interface RackDetailModalProps {
  record: ReconciliationRecord | null;
  onClose: () => void;
  onBackToLedger?: () => void;
  onAddSale?: (id: string, volumeSm3: number) => void;
}

export default function RackDetailModal({ record, onClose, onBackToLedger, onAddSale }: RackDetailModalProps) {
  const [viewTab, setViewTab] = useState<'table' | 'matrix'>('table');
  const [saleInput, setSaleInput] = useState<string>('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!record) return null;

  const isRack = record.recordType === 'RACK_PARENT' || record.recordType === 'MANIFOLD_PARENT';
  const children = record.children || [];
  const hasSale = record.saleVolumeSm3 !== undefined && record.saleVolumeSm3 !== null;
  const discrepancy = hasSale ? record.calculatedVolumeSm3 - record.saleVolumeSm3! : 0;
  const percentage = hasSale ? (discrepancy / record.calculatedVolumeSm3) * 100 : 0;
  const isWarning = percentage > 2 || percentage < -2;

  const handleRegisterSale = () => {
    const val = parseFloat(saleInput);
    if (!isNaN(val) && val >= 0 && onAddSale) {
      onAddSale(record.id, val);
      setSaleInput('');
    }
  };

  // Convert Kelvin to Celsius for friendly display
  const toCelsius = (k: number) => (k - 273.15).toFixed(1);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 lg:p-8 animate-fade-in">
      {/* Dark & Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-[var(--color-surface)] border border-slate-300 dark:border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-100/70 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              <Layers className="w-6 h-6 stroke-[1.8px]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-serif font-bold text-[var(--color-text-primary)]">
                  Detalle de Carga: {record.moduleIdentifier || (isRack ? 'Rack 11P' : 'Módulo')}
                </h3>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  {children.length > 0 ? `${children.length} posiciones` : 'Registro Individual'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] font-mono mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(record.createdAt).toLocaleString()}
                </span>
                <span className="opacity-70">ID: {record.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher (Table vs Physical Matrix) */}
            {isRack && children.length > 0 && (
              <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 text-xs font-medium mr-2">
                <button
                  type="button"
                  onClick={() => setViewTab('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    viewTab === 'table'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabla Detallada</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('matrix')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    viewTab === 'matrix'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Disposición Física</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5 stroke-[1.8px]" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Total Sm3 */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider mb-1.5">
                <span>Volumen Consolidado</span>
                <Fuel className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <p className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">
                {record.calculatedVolumeSm3.toFixed(2)}{' '}
                <span className="text-sm font-sans font-normal text-[var(--color-text-secondary)]">Sm³</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-mono">
                Cálculo AGA8 / ISO 6976
              </p>
            </div>

            {/* Total Mass */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider mb-1.5">
                <span>Masa Total de Gas</span>
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">
                {record.calculatedMassKg.toFixed(1)}{' '}
                <span className="text-sm font-sans font-normal text-[var(--color-text-secondary)]">kg</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-mono">
                {record.moduleCapacityLiters.toLocaleString()} L capacidad
              </p>
            </div>

            {/* Pressures Header */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div className="flex items-center justify-between text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider mb-1.5">
                <span>Presión Cabezal</span>
                <Gauge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">
                {record.initialPressureBar.toFixed(0)} → {record.finalPressureBar.toFixed(0)}{' '}
                <span className="text-sm font-sans font-normal text-[var(--color-text-secondary)]">bar</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-mono">
                ΔP: +{(record.finalPressureBar - record.initialPressureBar).toFixed(0)} bar
              </p>
            </div>

            {/* Reconciliation State */}
            <div className={`p-4 rounded-xl border ${
              !hasSale 
                ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20' 
                : isWarning 
                  ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/50 dark:bg-rose-950/20' 
                  : 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20'
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-1.5">
                <span className="text-[var(--color-text-secondary)]">Venta & Conciliación</span>
                {hasSale ? (
                  isWarning ? <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              
              {hasSale ? (
                <div>
                  <p className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">
                    {record.saleVolumeSm3!.toFixed(2)}{' '}
                    <span className="text-sm font-sans font-normal text-[var(--color-text-secondary)]">Sm³</span>
                  </p>
                  <p className={`text-xs font-mono font-semibold mt-1 ${isWarning ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    Merma: {percentage > 0 ? '+' : ''}{percentage.toFixed(2)}% ({discrepancy > 0 ? '+' : ''}{discrepancy.toFixed(2)} Sm³)
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 block mb-1">
                    Pendiente de Registro
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      step="any"
                      placeholder="Sm³ venta"
                      value={saleInput}
                      onChange={(e) => setSaleInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRegisterSale(); }}
                      className="w-24 h-7 text-xs px-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleRegisterSale}
                      className="px-2 py-1 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Section: Breakdown of Positions */}
          {children.length > 0 ? (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
                <div>
                  <h4 className="text-base font-serif font-bold text-[var(--color-text-primary)]">
                    Desglose Individual de Cilindros ({children.length} Posiciones)
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Parámetros operativos y volúmenes calculados individualmente para cada botella del rack
                  </p>
                </div>

                {/* Mobile View Switcher */}
                <div className="flex sm:hidden items-center p-1 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewTab('table')}
                    className={`p-1.5 rounded ${viewTab === 'table' ? 'bg-white dark:bg-zinc-900 shadow' : ''}`}
                    title="Tabla"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab('matrix')}
                    className={`p-1.5 rounded ${viewTab === 'matrix' ? 'bg-white dark:bg-zinc-900 shadow' : ''}`}
                    title="Matriz"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* View 1: Detailed Table */}
              {viewTab === 'table' && (
                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white/40 dark:bg-zinc-900/30">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-100/90 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-700 text-[11px] text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Posición</th>
                          <th className="py-3 px-3 font-semibold">Capacidad</th>
                          <th className="py-3 px-3 font-semibold">P. Inicial</th>
                          <th className="py-3 px-3 font-semibold">P. Final</th>
                          <th className="py-3 px-3 font-semibold">ΔP</th>
                          <th className="py-3 px-3 font-semibold">T₁ → T₂</th>
                          <th className="py-3 px-3 font-semibold">Masa Gas</th>
                          <th className="py-3 px-4 font-semibold text-right">Volumen Sm³</th>
                          <th className="py-3 px-4 font-semibold text-right">% Aporte</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-zinc-800/60">
                        {children.map((child) => {
                          const deltaP = child.finalPressureBar - child.initialPressureBar;
                          const contributionPct = record.calculatedVolumeSm3 > 0 
                            ? (child.calculatedVolumeSm3 / record.calculatedVolumeSm3) * 100 
                            : 0;

                          return (
                            <tr key={child.id} className="hover:bg-slate-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                              <td className="py-2.5 px-4 font-bold text-cyan-600 dark:text-cyan-400">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800">
                                  POS-{(child.positionNumber ?? 0).toString().padStart(2, '0')}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">
                                {child.moduleCapacityLiters.toLocaleString()} L
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">
                                {child.initialPressureBar.toFixed(1)} bar
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">
                                {child.finalPressureBar.toFixed(1)} bar
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-400">
                                +{deltaP.toFixed(1)} bar
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">
                                {toCelsius(child.initialTempK)}°C → {toCelsius(child.finalTempK)}°C
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-zinc-300">
                                {child.calculatedMassKg.toFixed(2)} kg
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-zinc-100">
                                {child.calculatedVolumeSm3.toFixed(2)} Sm³
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-slate-600 dark:text-zinc-400 font-semibold">
                                    {contributionPct.toFixed(1)}%
                                  </span>
                                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-cyan-500 rounded-full" 
                                      style={{ width: `${Math.min(contributionPct * 5, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Footer Totals Row */}
                      <tfoot className="bg-slate-100/90 dark:bg-zinc-800/90 border-t-2 border-slate-300 dark:border-zinc-700 font-bold text-slate-900 dark:text-zinc-100">
                        <tr>
                          <td className="py-3 px-4 uppercase text-[10px] tracking-wider text-slate-500 dark:text-zinc-400">
                            Total Consolidado
                          </td>
                          <td className="py-3 px-3">
                            {children.reduce((acc, c) => acc + c.moduleCapacityLiters, 0).toLocaleString()} L
                          </td>
                          <td colSpan={4} className="py-3 px-3 text-slate-500 dark:text-zinc-400 font-normal">
                            {children.length} cilindros conectados en paralelo
                          </td>
                          <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">
                            {children.reduce((acc, c) => acc + c.calculatedMassKg, 0).toFixed(2)} kg
                          </td>
                          <td className="py-3 px-4 text-right text-cyan-600 dark:text-cyan-400 text-sm">
                            {record.calculatedVolumeSm3.toFixed(2)} Sm³
                          </td>
                          <td className="py-3 px-4 text-right text-slate-500 dark:text-zinc-400">
                            100%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* View 2: Physical Matrix (4x3 rack with slot 2 empty) */}
              {viewTab === 'matrix' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
                    Disposición física del rack de 11 posiciones (4 filas x 3 columnas, espacio vacío en posición superior central):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Row 1 */}
                    {renderSlot(children, 1)}
                    <div className="border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-xl p-3 flex flex-col items-center justify-center min-h-[105px] opacity-40 bg-slate-50/50 dark:bg-zinc-900/30">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-600 uppercase tracking-wider font-semibold">
                        Espacio Vacío
                      </span>
                    </div>
                    {renderSlot(children, 2)}

                    {/* Row 2 */}
                    {renderSlot(children, 3)}
                    {renderSlot(children, 4)}
                    {renderSlot(children, 5)}

                    {/* Row 3 */}
                    {renderSlot(children, 6)}
                    {renderSlot(children, 7)}
                    {renderSlot(children, 8)}

                    {/* Row 4 */}
                    {renderSlot(children, 9)}
                    {renderSlot(children, 10)}
                    {renderSlot(children, 11)}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl">
              <Box className="w-10 h-10 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                Este registro no contiene posiciones subordinadas de rack.
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                Fue guardado como un cálculo individual directo de módulo o cisterna.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 backdrop-blur-md">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
            {isRack ? 'Registro Jerárquico de Rack (RACK_PARENT)' : 'Registro Individual (INDIVIDUAL)'}
          </div>

          <div className="flex items-center gap-3">
            {onBackToLedger && (
              <button
                type="button"
                onClick={onBackToLedger}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Libro Mayor</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 transition-colors shadow-sm"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper to render individual cylinder slot card in the physical matrix
function renderSlot(children: ReconciliationRecord[], positionNumber: number) {
  const child = children.find(c => c.positionNumber === positionNumber);

  if (!child) {
    return (
      <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center min-h-[105px] bg-slate-50/30 dark:bg-zinc-900/20">
        <span className="text-xs font-mono font-bold text-slate-400">
          POS-{positionNumber.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] text-slate-400 italic">No registrada</span>
      </div>
    );
  }

  return (
    <div className="border border-cyan-200/80 dark:border-cyan-800/60 rounded-xl p-3 bg-white/70 dark:bg-zinc-900/70 shadow-sm hover:border-cyan-400 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-1.5 mb-2">
        <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
          POS-{positionNumber.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
          {child.moduleCapacityLiters} L
        </span>
      </div>

      <div className="space-y-1 font-mono text-xs">
        <div className="flex justify-between items-baseline">
          <span className="text-slate-500 text-[10px]">Volumen:</span>
          <span className="font-bold text-slate-900 dark:text-zinc-100">
            {child.calculatedVolumeSm3.toFixed(2)} Sm³
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-slate-500 text-[10px]">Masa:</span>
          <span className="text-slate-700 dark:text-zinc-300">
            {child.calculatedMassKg.toFixed(1)} kg
          </span>
        </div>
        <div className="flex justify-between items-baseline text-[11px] text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800/60">
          <span>Presión:</span>
          <span>{child.initialPressureBar.toFixed(0)} → {child.finalPressureBar.toFixed(0)} bar</span>
        </div>
      </div>
    </div>
  );
}
