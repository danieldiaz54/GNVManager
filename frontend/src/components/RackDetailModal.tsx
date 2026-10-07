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
  ArrowLeft,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { ReconciliationRecord, reconciliationService } from '../core/api/reconciliation.service';

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

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (!record) return;
    try {
      await reconciliationService.exportLedgerReport(record.id, format);
    } catch (error) {
      console.error('Failed to export ledger report:', error);
    }
  };

  if (!record) return null;

  const isRack = record.recordType === 'RACK_PARENT' || record.recordType === 'MANIFOLD_PARENT';
  const children = record.children || [];

  const getSaleVolume = (rec: ReconciliationRecord): number | null => {
    if (!rec.events) return null;
    const sales = rec.events.filter(e => e.eventType === 'SALE_DISPENSED');
    if (sales.length === 0) return null;
    return sales.reduce((sum, e) => sum + (e.saleVolumeSm3 || 0), 0);
  };

  const saleVol = getSaleVolume(record);
  const hasSale = saleVol !== null;
  const variationSm3 = hasSale ? saleVol! - record.calculatedVolumeSm3 : 0;
  const percentage = hasSale && record.calculatedVolumeSm3 > 0 ? (variationSm3 / record.calculatedVolumeSm3) * 100 : 0;
  const isWarning = Math.abs(percentage) > 2;

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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[95vw] xl:max-w-[90vw] 2xl:max-w-[85vw] max-h-[92vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-none flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--color-border)] bg-[var(--color-canvas)]">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-md bg-[var(--color-alert-blue-bg)] text-[var(--color-alert-blue-text)] border border-[var(--color-border)]">
              <Layers className="w-6 h-6 stroke-[1.8px]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-serif font-bold text-[var(--color-text-primary)]">
                  Detalle de Carga: {record.moduleIdentifier || (isRack ? 'Rack 11P' : 'Módulo')}
                </h3>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-sm bg-[var(--color-alert-blue-bg)] text-[var(--color-alert-blue-text)] border border-[var(--color-border)] uppercase">
                  {children.length > 0 ? `${children.length} posiciones` : 'Registro Individual'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)] font-mono mt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(record.createdAt).toLocaleString()}
                </span>
                <span className="opacity-70">ID: {record.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Switcher (Table vs Physical Matrix) */}
            {isRack && children.length > 0 && (
              <div className="hidden sm:flex items-center p-1 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-xs font-medium mr-4">
                <button
                  type="button"
                  onClick={() => setViewTab('table')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all cursor-pointer ${
                    viewTab === 'table'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-bold border border-[var(--color-border)] shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                  <span>Tabla Detallada</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('matrix')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-all cursor-pointer ${
                    viewTab === 'matrix'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-bold border border-[var(--color-border)] shadow-xs'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Disposición Física</span>
                </button>
              </div>
            )}

            {/* Export Buttons */}
            <div className="flex items-center gap-2 mr-2 border-r border-[var(--color-border)] pr-4">
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="inline-flex items-center justify-center h-10 px-3 text-xs font-bold text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] rounded-md transition-all cursor-pointer"
                title="Exportar Acta (PDF)"
              >
                <FileText className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline uppercase tracking-wider">PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="inline-flex items-center justify-center h-10 px-3 text-xs font-bold text-[var(--color-text-primary)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] rounded-md transition-all cursor-pointer"
                title="Exportar Datos (CSV)"
              >
                <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline uppercase tracking-wider">CSV</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-6 h-6 stroke-[1.8px]" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Total Sm3 */}
            <div className="p-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
              <div className="flex items-center justify-between text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">
                <span>Volumen Consolidado</span>
                <Fuel className="w-4 h-4 text-[var(--color-alert-blue-text)]" />
              </div>
              <p className="text-3xl font-serif font-bold text-[var(--color-text-primary)]">
                {record.calculatedVolumeSm3.toFixed(2)}{' '}
                <span className="text-sm font-sans font-normal text-[var(--color-text-secondary)]">Sm³</span>
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2 font-mono pt-2 border-t border-[var(--color-border)] opacity-80">
                Cálculo AGA8 / ISO 6976
              </p>
            </div>

            {/* Total Mass */}
            <div className="p-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
              <div className="flex items-center justify-between text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">
                <span>Masa Total de Gas</span>
                <Scale className="w-4 h-4 text-[var(--color-alert-green-text)]" />
              </div>
              <p className="text-3xl font-serif font-bold text-[var(--color-text-primary)]">
                {record.calculatedMassKg.toFixed(1)}{' '}
                <span className="text-sm font-sans font-normal text-[var(--color-text-secondary)]">kg</span>
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2 font-mono pt-2 border-t border-[var(--color-border)] opacity-80">
                {record.moduleCapacityLiters.toLocaleString()} L capacidad
              </p>
            </div>

            {/* Pressures Header */}
            <div className="p-6 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
              <div className="flex items-center justify-between text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">
                <span>Presión Cabezal</span>
                <Gauge className="w-4 h-4 text-[var(--color-alert-blue-text)]" />
              </div>
              <p className="text-3xl font-serif font-bold text-[var(--color-text-primary)]">
                {record.initialPressureBar.toFixed(0)} → {record.finalPressureBar.toFixed(0)}{' '}
                <span className="text-sm font-sans font-normal text-[var(--color-text-secondary)]">bar</span>
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2 font-mono pt-2 border-t border-[var(--color-border)] opacity-80">
                ΔP: +{(record.finalPressureBar - record.initialPressureBar).toFixed(0)} bar
              </p>
            </div>

            {/* Reconciliation State */}
            <div className={`p-6 rounded-md border shadow-none ${
              !hasSale 
                ? 'border-[var(--color-alert-yellow-text)] bg-[var(--color-alert-yellow-bg)]' 
                : isWarning 
                  ? 'border-[var(--color-alert-red-border)] bg-[var(--color-alert-red-bg)]' 
                  : 'border-[var(--color-alert-green-border)] bg-[var(--color-alert-green-bg)]'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-[var(--color-text-primary)] opacity-80">Venta & Conciliación</span>
                {hasSale ? (
                  isWarning ? <AlertCircle className="w-4 h-4 text-[var(--color-alert-red-text)]" /> : <CheckCircle2 className="w-4 h-4 text-[var(--color-alert-green-text)]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[var(--color-alert-yellow-text)]" />
                )}
              </div>
              
              {hasSale ? (
                <div>
                  <p className="text-3xl font-serif font-bold text-[var(--color-text-primary)]">
                    {saleVol!.toFixed(2)}{' '}
                    <span className="text-sm font-sans font-normal text-[var(--color-text-secondary)]">Sm³</span>
                  </p>
                  <p className={`text-xs font-mono font-bold mt-2 pt-2 border-t border-current opacity-90 ${isWarning ? 'text-[var(--color-alert-red-text)]' : 'text-[var(--color-alert-green-text)]'}`}>
                    Variación: {percentage > 0 ? '+' : ''}{percentage.toFixed(2)}% ({variationSm3 > 0 ? '+' : ''}{variationSm3.toFixed(2)} Sm³)
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-bold text-[var(--color-alert-yellow-text)] block mb-2">
                    Pendiente de Registro
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Sm³ venta"
                      value={saleInput}
                      onChange={(e) => setSaleInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRegisterSale(); }}
                      className="w-24 h-9 text-xs px-3 rounded-md border border-[var(--color-text-primary)] bg-[var(--color-surface)] font-mono text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-text-primary)]"
                    />
                    <button
                      type="button"
                      onClick={handleRegisterSale}
                      className="px-3 py-2 text-xs font-bold bg-[var(--color-text-primary)] text-[var(--color-canvas)] rounded-md hover:opacity-90 transition-colors cursor-pointer"
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
            <div className="space-y-6">
              
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 mt-6">
                <div>
                  <h4 className="text-lg font-serif font-bold text-[var(--color-text-primary)]">
                    Desglose Individual de Cilindros ({children.length} Posiciones)
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Parámetros operativos y volúmenes calculados individualmente para cada botella del rack
                  </p>
                </div>

                {/* Mobile View Switcher */}
                <div className="flex sm:hidden items-center p-1 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-xs">
                  <button
                    type="button"
                    onClick={() => setViewTab('table')}
                    className={`p-2 rounded-sm ${viewTab === 'table' ? 'bg-[var(--color-surface)] shadow-xs' : ''}`}
                    title="Tabla"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab('matrix')}
                    className={`p-2 rounded-sm ${viewTab === 'matrix' ? 'bg-[var(--color-surface)] shadow-xs' : ''}`}
                    title="Matriz"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* View 1: Detailed Table */}
              {viewTab === 'table' && (
                <div className="rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] shadow-none">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)] uppercase tracking-wider font-sans">
                        <tr>
                          <th className="py-4 px-6 font-bold">Posición</th>
                          <th className="py-4 px-4 font-bold">Capacidad</th>
                          <th className="py-4 px-4 font-bold">P. Inicial</th>
                          <th className="py-4 px-4 font-bold">P. Final</th>
                          <th className="py-4 px-4 font-bold">ΔP</th>
                          <th className="py-4 px-4 font-bold">T₁ → T₂</th>
                          <th className="py-4 px-4 font-bold">Masa Gas</th>
                          <th className="py-4 px-6 font-bold text-right">Volumen Sm³</th>
                          <th className="py-4 px-6 font-bold text-right">% Aporte</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {children.map((child) => {
                          const deltaP = child.finalPressureBar - child.initialPressureBar;
                          const contributionPct = record.calculatedVolumeSm3 > 0 
                            ? (child.calculatedVolumeSm3 / record.calculatedVolumeSm3) * 100 
                            : 0;

                          return (
                            <tr key={child.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                              <td className="py-3 px-6 font-bold text-[var(--color-text-primary)]">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[var(--color-alert-blue-bg)] border border-[var(--color-border)] text-[var(--color-alert-blue-text)]">
                                  POS-{(child.positionNumber ?? 0).toString().padStart(2, '0')}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                                {child.moduleCapacityLiters.toLocaleString()} L
                              </td>
                              <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                                {child.initialPressureBar.toFixed(1)} bar
                              </td>
                              <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                                {child.finalPressureBar.toFixed(1)} bar
                              </td>
                              <td className="py-3 px-4 font-bold text-[var(--color-alert-blue-text)]">
                                +{deltaP.toFixed(1)} bar
                              </td>
                              <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                                {toCelsius(child.initialTempK)}°C → {toCelsius(child.finalTempK)}°C
                              </td>
                              <td className="py-3 px-4 font-bold text-[var(--color-text-primary)]">
                                {child.calculatedMassKg.toFixed(2)} kg
                              </td>
                              <td className="py-3 px-6 text-right font-bold text-[var(--color-text-primary)] font-serif text-sm">
                                {child.calculatedVolumeSm3.toFixed(2)} Sm³
                              </td>
                              <td className="py-3 px-6 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <span className="text-[var(--color-text-secondary)] font-bold">
                                    {contributionPct.toFixed(1)}%
                                  </span>
                                  <div className="w-16 h-2 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-sm overflow-hidden">
                                    <div 
                                      className="h-full bg-[var(--color-text-primary)]" 
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
                      <tfoot className="bg-[var(--color-canvas)] border-t border-[var(--color-border)] font-bold text-[var(--color-text-primary)]">
                        <tr>
                          <td className="py-4 px-6 uppercase text-[11px] tracking-wider font-sans">
                            Total Consolidado
                          </td>
                          <td className="py-4 px-4 font-sans text-sm">
                            {children.reduce((acc, c) => acc + c.moduleCapacityLiters, 0).toLocaleString()} L
                          </td>
                          <td colSpan={4} className="py-4 px-4 text-[var(--color-text-secondary)] font-normal font-sans">
                            {children.length} cilindros conectados en paralelo
                          </td>
                          <td className="py-4 px-4 font-sans text-sm">
                            {children.reduce((acc, c) => acc + c.calculatedMassKg, 0).toFixed(2)} kg
                          </td>
                          <td className="py-4 px-6 text-right font-serif text-lg">
                            {record.calculatedVolumeSm3.toFixed(2)} Sm³
                          </td>
                          <td className="py-4 px-6 text-right text-[var(--color-text-secondary)] font-sans">
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
                <div className="space-y-4">
                  <p className="text-sm text-[var(--color-text-secondary)] italic">
                    Disposición física del rack de 11 posiciones (4 filas x 3 columnas, espacio vacío en posición superior central):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Row 1 */}
                    {renderSlot(children, 1)}
                    <div className="border border-dashed border-[var(--color-border)] rounded-md p-4 flex flex-col items-center justify-center min-h-[120px] opacity-40 bg-[var(--color-canvas)]">
                      <span className="text-xs font-mono font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
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
            <div className="p-12 text-center border border-dashed border-[var(--color-border)] bg-[var(--color-canvas)] rounded-lg shadow-none">
              <Box className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-secondary)] opacity-50" />
              <p className="text-base font-bold text-[var(--color-text-primary)]">
                Este registro no contiene posiciones subordinadas de rack.
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                Fue guardado como un cálculo individual directo de módulo o cisterna.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-[var(--color-border)] bg-[var(--color-canvas)]">
          <div className="text-xs text-[var(--color-text-secondary)] font-mono">
            {isRack ? 'Registro Jerárquico de Rack (RACK_PARENT)' : 'Registro Individual (INDIVIDUAL)'}
          </div>

          <div className="flex items-center gap-4">
            {onBackToLedger && (
              <button
                type="button"
                onClick={onBackToLedger}
                className="flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors shadow-none cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Libro Mayor</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 text-xs font-bold rounded-md bg-[var(--color-text-primary)] text-[var(--color-canvas)] hover:opacity-90 transition-colors shadow-none cursor-pointer"
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
      <div className="border border-[var(--color-border)] rounded-md p-4 flex flex-col items-center justify-center min-h-[120px] bg-[var(--color-canvas)]">
        <span className="text-xs font-mono font-bold text-[var(--color-text-secondary)]">
          POS-{positionNumber.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] text-[var(--color-text-secondary)] italic mt-1">No registrada</span>
      </div>
    );
  }

  return (
    <div className="border border-[var(--color-border)] rounded-md p-4 bg-[var(--color-surface)] shadow-none hover:border-[var(--color-text-primary)] transition-colors">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 mb-3">
        <span className="text-xs font-mono font-bold text-[var(--color-alert-blue-text)]">
          POS-{positionNumber.toString().padStart(2, '0')}
        </span>
        <span className="text-xs font-mono text-[var(--color-text-secondary)] font-bold">
          {child.moduleCapacityLiters} L
        </span>
      </div>

      <div className="space-y-2 font-mono text-xs">
        <div className="flex justify-between items-baseline">
          <span className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider">Volumen:</span>
          <span className="font-bold text-[var(--color-text-primary)] text-sm">
            {child.calculatedVolumeSm3.toFixed(2)} Sm³
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider">Masa:</span>
          <span className="text-[var(--color-text-primary)] font-medium">
            {child.calculatedMassKg.toFixed(1)} kg
          </span>
        </div>
        <div className="flex justify-between items-baseline text-[11px] text-[var(--color-text-secondary)] pt-2 mt-2 border-t border-[var(--color-border)] font-bold">
          <span className="uppercase tracking-wider text-[10px]">Presión:</span>
          <span>{child.initialPressureBar.toFixed(0)} → {child.finalPressureBar.toFixed(0)} bar</span>
        </div>
      </div>
    </div>
  );
}
