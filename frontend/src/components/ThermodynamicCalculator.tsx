import { useState, useEffect } from 'react';
import { thermodynamicsService } from '../core/api/thermodynamic.service';
import { psiToBar, celsiusToKelvin, barToPsi } from '../core/utils/UnitConversion';
import { MODULE_PRESETS } from '../domain/modulePresets';
import { Gauge, Thermometer, Check, ChevronDown, ChevronUp, Snowflake, Activity } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export default function ThermodynamicCalculator({ onSaveCharge }: { onSaveCharge: (data: any) => void }) {
  const [capacity, setCapacity] = useState(MODULE_PRESETS[0].capacity_L);
  const [pressureUnit, setPressureUnit] = useState<'bar' | 'psi'>('bar');

  const [piInput, setPiInput] = useState(50);
  const [tiInput, setTiInput] = useState(25);
  const [pfInput, setPfInput] = useState(250);
  const [tfInput, setTfInput] = useState(45);

  const [result, setResult] = useState({ 
    mass_kg: 0, 
    volume_Sm3: 0, 
    massInitial_kg: 0, 
    massFinal_kg: 0,
    zInitial: 1.0,
    zFinal: 1.0,
    stabilizedPressureBar: 0,
    stabilizedTempCelsius: 20,
    thermalPressureLossBar: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const p_i_bar = pressureUnit === 'psi' ? psiToBar(piInput) : piInput;
        const p_f_bar = pressureUnit === 'psi' ? psiToBar(pfInput) : pfInput;

        const t_i_K = celsiusToKelvin(tiInput);
        const t_f_K = celsiusToKelvin(tfInput);

        const calculated = await thermodynamicsService.calculateTransfer(
          Number(p_i_bar), t_i_K, Number(p_f_bar), t_f_K, capacity
        );
        
        if (!isCancelled) {
          setResult({
            mass_kg: calculated.massTransferredKg,
            volume_Sm3: calculated.volumeTransferredSm3,
            massInitial_kg: calculated.initialMassKg,
            massFinal_kg: calculated.finalMassKg,
            zInitial: calculated.zInitial ?? 1.0,
            zFinal: calculated.zFinal ?? 1.0,
            stabilizedPressureBar: calculated.stabilizedPressureBar ?? 0,
            stabilizedTempCelsius: calculated.stabilizedTempCelsius ?? 20,
            thermalPressureLossBar: calculated.thermalPressureLossBar ?? 0
          });
        }
      } catch (error) {
        console.error("Error al calcular la termodinámica:", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [capacity, pressureUnit, piInput, tiInput, pfInput, tfInput]);

  const handleSave = () => {
    onSaveCharge({
      timestamp: new Date().toISOString(),
      capacity,
      initial: { p: piInput, t: tiInput },
      final: { p: pfInput, t: tfInput },
      unit: pressureUnit,
      mass_kg: result.mass_kg,
      volume_Sm3: result.volume_Sm3
    });
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  const deltaPressure = Math.max(0, pfInput - piInput);
  const maxNominalPressure = pressureUnit === 'psi' ? 3600 : 250;
  const fillPercent = Math.min(100, Math.max(0, (pfInput / maxNominalPressure) * 100));

  const stabilizedPressureDisp = pressureUnit === 'psi' ? barToPsi(result.stabilizedPressureBar) : result.stabilizedPressureBar;
  const thermalPressureLossDisp = pressureUnit === 'psi' ? barToPsi(result.thermalPressureLossBar) : result.thermalPressureLossBar;

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto animate-fade-in">
      
      {/* Encabezado Simple y Limpio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--color-border)] gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[var(--color-text-primary)]">
            Cálculo de Módulo Individual
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Estimación termodinámica de transferencia de gas natural comprimido (AGA8 / ISO 6976)
          </p>
        </div>

        {/* Controles de Módulo y Unidad */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Módulo:</span>
            <Select value={capacity.toString()} onValueChange={(val) => setCapacity(Number(val))}>
              <SelectTrigger className="w-44 h-8 bg-[var(--color-surface)] border-[var(--color-border)] text-xs">
                <SelectValue placeholder="Seleccionar módulo" />
              </SelectTrigger>
              <SelectContent>
                {MODULE_PRESETS.map(preset => (
                  <SelectItem key={preset.id} value={preset.capacity_L.toString()}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 bg-[var(--color-surface-hover)] p-0.5 rounded-lg border border-[var(--color-border)] text-xs">
            <button
              type="button"
              onClick={() => {
                if (pressureUnit === 'psi') {
                  setPiInput(Math.round(psiToBar(piInput)));
                  setPfInput(Math.round(psiToBar(pfInput)));
                  setPressureUnit('bar');
                }
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                pressureUnit === 'bar' ? 'bg-[var(--color-surface)] shadow-xs font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              bar
            </button>
            <button
              type="button"
              onClick={() => {
                if (pressureUnit === 'bar') {
                  setPiInput(Math.round(barToPsi(piInput)));
                  setPfInput(Math.round(barToPsi(pfInput)));
                  setPressureUnit('psi');
                }
              }}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                pressureUnit === 'psi' ? 'bg-[var(--color-surface)] shadow-xs font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              psi
            </button>
          </div>
        </div>
      </div>

      {/* Panel Principal: Entradas (Izquierda) vs Resultado (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Columna Izquierda: Formulario Directo sin cajas anidadas (7 cols) */}
        <div className="lg:col-span-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-6 shadow-none">
          
          {/* Condición Inicial */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                1. Condición Inicial (Remanente)
              </span>
              <span className="text-[11px] font-mono text-[var(--color-text-secondary)]">
                Masa inicial: {result.massInitial_kg.toFixed(1)} kg
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Presión Remanente ({pressureUnit})
                </label>
                <div className="relative">
                  <Gauge className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={piInput}
                    onChange={(e) => setPiInput(Number(e.target.value))}
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 font-mono font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Temperatura Remanente (°C)
                </label>
                <div className="relative">
                  <Thermometer className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    step="0.5"
                    value={tiInput}
                    onChange={(e) => setTiInput(Number(e.target.value))}
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 font-mono font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)]" />

          {/* Condición Final */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-alert-blue-text)] uppercase tracking-wider">
                2. Condición Final (Corte Compresor)
              </span>
              <span className="text-[11px] font-mono font-semibold text-[var(--color-alert-blue-text)]">
                ΔP: +{deltaPressure} {pressureUnit}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Presión Final ({pressureUnit})
                </label>
                <div className="relative">
                  <Gauge className="w-4 h-4 text-[var(--color-alert-blue-text)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pfInput}
                    onChange={(e) => setPfInput(Number(e.target.value))}
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-[var(--color-border)]/80 bg-[var(--color-alert-blue-bg)]/20 font-mono font-bold text-sm text-[var(--color-alert-blue-text)] focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Temperatura Final (°C)
                </label>
                <div className="relative">
                  <Thermometer className="w-4 h-4 text-[var(--color-alert-blue-text)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    step="0.5"
                    value={tfInput}
                    onChange={(e) => setTfInput(Number(e.target.value))}
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-hover)]/50 font-mono font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Resultado Principal y Acción Directa (5 cols) */}
        <div className="lg:col-span-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col justify-between space-y-6 shadow-none">
          
          <div>
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">
              Carga Neta Transferida
            </span>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Balance volumétrico estándar AGA8
            </p>

            <div className="mt-6 space-y-4">
              
              {/* Volumen Destacado */}
              <div className="p-4 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
                <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase">Volumen Normalizado</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-serif font-bold text-[var(--color-text-primary)] tracking-tight">
                    {result.volume_Sm3.toFixed(2)}
                  </span>
                  <span className="text-sm font-sans font-medium text-[var(--color-text-secondary)]">Sm³</span>
                </div>
              </div>

              {/* Masa Destacada */}
              <div className="p-4 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
                <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase">Masa Transferida</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-serif font-bold text-[var(--color-text-primary)] tracking-tight">
                    {result.mass_kg.toFixed(2)}
                  </span>
                  <span className="text-sm font-sans font-medium text-[var(--color-text-secondary)]">kg</span>
                </div>
              </div>

            </div>
          </div>

          {/* Botón de Guardar */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-md text-xs font-semibold shadow-none transition-all flex items-center justify-center gap-2 ${
                isSavedFeedback
                  ? 'bg-[var(--color-alert-green-bg)] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white(--color-surface)]'
              }`}
            >
              {isSavedFeedback ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5px]" />
                  <span>Guardado en Libro Mayor</span>
                </>
              ) : (
                <span>Guardar Cálculo</span>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Sección Colapsable: Parámetros Avanzados y Estabilización Térmica (Opcional) */}
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-5 py-3 flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[var(--color-alert-blue-text)]" />
            <span>Ver Parámetros Termodinámicos y Pronóstico Térmico en Reposo</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-5 border-t border-[var(--color-border)] space-y-4 text-xs font-mono bg-[var(--color-surface-hover)]/50">
            
            {/* Factores Z */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Factor Z₁ (Remanente)</span>
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{result.zInitial.toFixed(4)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Factor Z₂ (Corte)</span>
                <span className="text-sm font-bold text-[var(--color-alert-blue-text)]">{result.zFinal.toFixed(4)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Capacidad Módulo</span>
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{capacity.toLocaleString()} L</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Llenado Escala</span>
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{fillPercent.toFixed(0)}%</span>
              </div>
            </div>

            {/* Pronóstico de Estabilización Fría */}
            <div className="p-3.5 rounded-md border border-[var(--color-alert-blue-bg)] bg-[var(--color-alert-blue-bg)]/50 flex items-start gap-3">
              <Snowflake className="w-4 h-4 text-[var(--color-alert-blue-text)] shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                <span className="font-bold text-[var(--color-text-primary)]">Pronóstico Térmico Isocórico: </span>
                Al enfriarse de <span className="font-bold">{tfInput}°C</span> a <span className="font-bold">{result.stabilizedTempCelsius}°C</span> ambiente, 
                la aguja caerá normalmente a <strong className="text-[var(--color-alert-blue-text)]">{stabilizedPressureDisp.toFixed(1)} {pressureUnit}</strong> (pérdida térmica normal de -{thermalPressureLossDisp.toFixed(1)} {pressureUnit}). No constituye merma ni fuga.
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
