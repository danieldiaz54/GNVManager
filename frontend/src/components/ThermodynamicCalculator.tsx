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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800 gap-4">
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Módulo:</span>
            <Select value={capacity.toString()} onValueChange={(val) => setCapacity(Number(val))}>
              <SelectTrigger className="w-44 h-8 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-xs">
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

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs">
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
                pressureUnit === 'bar' ? 'bg-white dark:bg-zinc-900 shadow-xs font-semibold text-slate-900 dark:text-zinc-100' : 'text-slate-500'
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
                pressureUnit === 'psi' ? 'bg-white dark:bg-zinc-900 shadow-xs font-semibold text-slate-900 dark:text-zinc-100' : 'text-slate-500'
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
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-6 shadow-sm">
          
          {/* Condición Inicial */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                1. Condición Inicial (Remanente)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Masa inicial: {result.massInitial_kg.toFixed(1)} kg
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Presión Remanente ({pressureUnit})
                </label>
                <div className="relative">
                  <Gauge className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={piInput}
                    onChange={(e) => setPiInput(Number(e.target.value))}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/60 font-mono font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Temperatura Remanente (°C)
                </label>
                <div className="relative">
                  <Thermometer className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    step="0.5"
                    value={tiInput}
                    onChange={(e) => setTiInput(Number(e.target.value))}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/60 font-mono font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800" />

          {/* Condición Final */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                2. Condición Final (Corte Compresor)
              </span>
              <span className="text-[11px] font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                ΔP: +{deltaPressure} {pressureUnit}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Presión Final ({pressureUnit})
                </label>
                <div className="relative">
                  <Gauge className="w-4 h-4 text-cyan-600 dark:text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pfInput}
                    onChange={(e) => setPfInput(Number(e.target.value))}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-cyan-300/80 dark:border-cyan-800 bg-cyan-50/20 dark:bg-cyan-950/20 font-mono font-bold text-sm text-cyan-800 dark:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Temperatura Final (°C)
                </label>
                <div className="relative">
                  <Thermometer className="w-4 h-4 text-cyan-600 dark:text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="number"
                    step="0.5"
                    value={tfInput}
                    onChange={(e) => setTfInput(Number(e.target.value))}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/60 font-mono font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Resultado Principal y Acción Directa (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6 flex flex-col justify-between space-y-6 shadow-sm">
          
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Carga Neta Transferida
            </span>
            <p className="text-xs text-slate-400">
              Balance volumétrico estándar AGA8
            </p>

            <div className="mt-6 space-y-4">
              
              {/* Volumen Destacado */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">Volumen Normalizado</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-serif font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                    {result.volume_Sm3.toFixed(2)}
                  </span>
                  <span className="text-sm font-sans font-medium text-slate-500">Sm³</span>
                </div>
              </div>

              {/* Masa Destacada */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">Masa Transferida</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                    {result.mass_kg.toFixed(2)}
                  </span>
                  <span className="text-sm font-sans font-medium text-slate-500">kg</span>
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
              className={`w-full py-3 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${
                isSavedFeedback
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900'
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
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-5 py-3 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Ver Parámetros Termodinámicos y Pronóstico Térmico en Reposo</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-5 border-t border-slate-200 dark:border-zinc-800 space-y-4 text-xs font-mono bg-slate-50/50 dark:bg-zinc-900/60">
            
            {/* Factores Z */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                <span className="text-[10px] text-slate-500 uppercase block">Factor Z₁ (Remanente)</span>
                <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">{result.zInitial.toFixed(4)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                <span className="text-[10px] text-slate-500 uppercase block">Factor Z₂ (Corte)</span>
                <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{result.zFinal.toFixed(4)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                <span className="text-[10px] text-slate-500 uppercase block">Capacidad Módulo</span>
                <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">{capacity.toLocaleString()} L</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                <span className="text-[10px] text-slate-500 uppercase block">Llenado Escala</span>
                <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">{fillPercent.toFixed(0)}%</span>
              </div>
            </div>

            {/* Pronóstico de Estabilización Fría */}
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex items-start gap-3">
              <Snowflake className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed text-slate-600 dark:text-zinc-300">
                <span className="font-bold text-slate-900 dark:text-zinc-100">Pronóstico Térmico Isocórico: </span>
                Al enfriarse de <span className="font-bold">{tfInput}°C</span> a <span className="font-bold">{result.stabilizedTempCelsius}°C</span> ambiente, 
                la aguja caerá normalmente a <strong className="text-blue-600 dark:text-blue-400">{stabilizedPressureDisp.toFixed(1)} {pressureUnit}</strong> (pérdida térmica normal de -{thermalPressureLossDisp.toFixed(1)} {pressureUnit}). No constituye merma ni fuga.
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
