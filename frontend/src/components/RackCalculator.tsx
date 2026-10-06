import React, { useState, useEffect, useMemo } from 'react';
import { thermodynamicsService, TransferResult } from '../core/api/thermodynamic.service';
import { psiToBar, celsiusToKelvin, barToPsi } from '../core/utils/UnitConversion';
import { Gauge, Thermometer, Layers, Check, ChevronDown, ChevronUp, Sliders, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { SaveRackDTO } from '../core/api/reconciliation.service';

export interface RackPositionState {
  id: number;
  label: string;
  active: boolean;
  capacity_L: number;
  pi: number;
  ti: number;
  pf: number;
  tf: number;
  result?: TransferResult;
}

interface RackCalculatorProps {
  onSave: (rackData: SaveRackDTO) => Promise<void> | void;
  isSaving?: boolean;
}

const TOTAL_POSITIONS = 11;
const DEFAULT_CYLINDER_LITERS = 1227; // 1,227 L x 11 ≈ 13,497 L

export default function RackCalculator({ onSave, isSaving = false }: RackCalculatorProps) {
  const [pressureUnit, setPressureUnit] = useState<'bar' | 'psi'>('bar');
  const [identifier, setIdentifier] = useState('RACK-11P');

  // Parámetros de cabezal común (Default para todo el rack)
  const [headerPi, setHeaderPi] = useState(50);
  const [headerTi, setHeaderTi] = useState(25);
  const [headerPf, setHeaderPf] = useState(250);
  const [headerTf, setHeaderTf] = useState(45);

  const [showPerCylinderTuning, setShowPerCylinderTuning] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // 11 Posiciones del Rack
  const [positions, setPositions] = useState<RackPositionState[]>(() =>
    Array.from({ length: TOTAL_POSITIONS }, (_, i) => ({
      id: i + 1,
      label: `POS-${String(i + 1).padStart(2, '0')}`,
      active: true,
      capacity_L: DEFAULT_CYLINDER_LITERS,
      pi: 50,
      ti: 25,
      pf: 250,
      tf: 45,
    }))
  );

  // Sincronizar cambios de cabezal a todos los cilindros activos si no se está en modo ajuste individual
  const applyHeaderToPositions = (newPi: number, newTi: number, newPf: number, newTf: number) => {
    setPositions(prev => prev.map(p => ({
      ...p,
      pi: newPi,
      ti: newTi,
      pf: newPf,
      tf: newTf
    })));
  };

  // Cálculo por lote (batch API con 150ms debounce)
  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(async () => {
      const activeToCompute = positions.filter(p => p.active);
      if (activeToCompute.length === 0) {
        setPositions(prev => prev.map(p => ({ ...p, result: undefined })));
        return;
      }

      try {
        const batchItems = activeToCompute.map(pos => ({
          id: pos.id,
          initialPressureBar: pressureUnit === 'psi' ? psiToBar(pos.pi) : pos.pi,
          initialTempK: celsiusToKelvin(pos.ti),
          finalPressureBar: pressureUnit === 'psi' ? psiToBar(pos.pf) : pos.pf,
          finalTempK: celsiusToKelvin(pos.tf),
          volumeLiters: pos.capacity_L,
        }));

        const batchResults = await thermodynamicsService.calculateBatch(batchItems);
        const resultMap = new Map(batchResults.map(r => [r.id, r.result]));

        if (!isCancelled) {
          setPositions(prev => prev.map(p => {
            if (!p.active) return { ...p, result: undefined };
            const res = resultMap.get(p.id);
            return res ? { ...p, result: res } : p;
          }));
        }
      } catch (e) {
        console.error('Error calculando lote termodinámico de rack:', e);
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    pressureUnit,
    positions.map(p => `${p.active}-${p.pi}-${p.ti}-${p.pf}-${p.tf}-${p.capacity_L}`).join('|')
  ]);

  // Totales consolidados
  const activePositions = useMemo(() => positions.filter(p => p.active), [positions]);
  const totalCapacity_L = useMemo(() => activePositions.reduce((acc, p) => acc + p.capacity_L, 0), [activePositions]);
  const totalMass_kg = useMemo(() => activePositions.reduce((acc, p) => acc + (p.result?.massTransferredKg || 0), 0), [activePositions]);
  const totalVolume_Sm3 = useMemo(() => activePositions.reduce((acc, p) => acc + (p.result?.volumeTransferredSm3 || 0), 0), [activePositions]);

  const deltaPressure = Math.max(0, headerPf - headerPi);

  const togglePositionActive = (id: number) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const updateIndividualPosition = (id: number, field: keyof RackPositionState, val: any) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const resetAllToHeader = () => {
    applyHeaderToPositions(headerPi, headerTi, headerPf, headerTf);
  };

  const handleSave = async () => {
    if (activePositions.length === 0) {
      alert('Debes tener al menos una posición activa en el rack.');
      return;
    }

    const avgPi = activePositions.reduce((sum, p) => sum + (pressureUnit === 'psi' ? psiToBar(p.pi) : p.pi), 0) / activePositions.length;
    const avgTi = activePositions.reduce((sum, p) => sum + celsiusToKelvin(p.ti), 0) / activePositions.length;
    const avgPf = activePositions.reduce((sum, p) => sum + (pressureUnit === 'psi' ? psiToBar(p.pf) : p.pf), 0) / activePositions.length;
    const avgTf = activePositions.reduce((sum, p) => sum + celsiusToKelvin(p.tf), 0) / activePositions.length;

    const payload: SaveRackDTO = {
      parent: {
        recordType: 'RACK_PARENT',
        moduleIdentifier: identifier,
        moduleCapacityLiters: totalCapacity_L,
        initialPressureBar: avgPi,
        initialTempK: avgTi,
        finalPressureBar: avgPf,
        finalTempK: avgTf,
        calculatedMassKg: totalMass_kg,
        calculatedVolumeSm3: totalVolume_Sm3
      },
      positions: activePositions.map(pos => ({
        recordType: 'RACK_CHILD',
        moduleIdentifier: identifier,
        positionNumber: pos.id,
        moduleCapacityLiters: pos.capacity_L,
        initialPressureBar: pressureUnit === 'psi' ? psiToBar(pos.pi) : pos.pi,
        initialTempK: celsiusToKelvin(pos.ti),
        finalPressureBar: pressureUnit === 'psi' ? psiToBar(pos.pf) : pos.pf,
        finalTempK: celsiusToKelvin(pos.tf),
        calculatedMassKg: pos.result?.massTransferredKg || 0,
        calculatedVolumeSm3: pos.result?.volumeTransferredSm3 || 0
      }))
    };

    try {
      await onSave(payload);
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2500);
    } catch (error) {
      console.error('Error guardando rack:', error);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto animate-fade-in">
      
      {/* Encabezado Despejado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-[var(--color-text-primary)]">
              Carga Simultánea de Rack
            </h2>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              11 Posiciones
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Cálculo integral AGA8 para baterías interconectadas a cabezal común
          </p>
        </div>

        {/* Identificador de Rack y Unidad */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Rack:</span>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-8 w-28 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono font-bold text-xs"
              placeholder="RACK-01"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs">
            <button
              type="button"
              onClick={() => {
                if (pressureUnit === 'psi') {
                  const newPi = Math.round(psiToBar(headerPi));
                  const newPf = Math.round(psiToBar(headerPf));
                  setHeaderPi(newPi);
                  setHeaderPf(newPf);
                  setPositions(prev => prev.map(p => ({
                    ...p,
                    pi: Math.round(psiToBar(p.pi)),
                    pf: Math.round(psiToBar(p.pf))
                  })));
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
                  const newPi = Math.round(barToPsi(headerPi));
                  const newPf = Math.round(barToPsi(headerPf));
                  setHeaderPi(newPi);
                  setHeaderPf(newPf);
                  setPositions(prev => prev.map(p => ({
                    ...p,
                    pi: Math.round(barToPsi(p.pi)),
                    pf: Math.round(barToPsi(p.pf))
                  })));
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

      {/* Panel Principal: Cabezal Común (Izquierda) vs Consolidado del Rack (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Columna Izquierda: Entradas de Cabezal Común + Selector Rápido de Cilindros (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 space-y-6 shadow-sm">
          
          {/* Condición de Cabezal: Remanente y Corte */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Lecturas de Cabezal Colector ({pressureUnit})
              </span>
              <span className="text-[11px] font-mono font-semibold text-cyan-600 dark:text-cyan-400">
                ΔP Cabezal: +{deltaPressure} {pressureUnit}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Remanente P1/T1 */}
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-700/60">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  1. Remanente Inicial
                </span>
                
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Presión Inicial ({pressureUnit})</label>
                  <div className="relative">
                    <Gauge className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      value={headerPi}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHeaderPi(val);
                        applyHeaderToPositions(val, headerTi, headerPf, headerTf);
                      }}
                      className="w-full h-9 pl-8 pr-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono font-semibold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Temperatura Inicial (°C)</label>
                  <div className="relative">
                    <Thermometer className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      step="0.5"
                      value={headerTi}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHeaderTi(val);
                        applyHeaderToPositions(headerPi, val, headerPf, headerTf);
                      }}
                      className="w-full h-9 pl-8 pr-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Corte P2/T2 */}
              <div className="space-y-3 p-3.5 rounded-xl bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-200/70 dark:border-cyan-800/60">
                <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block">
                  2. Corte Compresor
                </span>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Presión Final ({pressureUnit})</label>
                  <div className="relative">
                    <Gauge className="w-4 h-4 text-cyan-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      value={headerPf}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHeaderPf(val);
                        applyHeaderToPositions(headerPi, headerTi, val, headerTf);
                      }}
                      className="w-full h-9 pl-8 pr-2 rounded-lg border border-cyan-300 dark:border-cyan-800 bg-white dark:bg-zinc-900 font-mono font-bold text-xs text-cyan-700 dark:text-cyan-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Temperatura Final (°C)</label>
                  <div className="relative">
                    <Thermometer className="w-4 h-4 text-cyan-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      step="0.5"
                      value={headerTf}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHeaderTf(val);
                        applyHeaderToPositions(headerPi, headerTi, headerPf, val);
                      }}
                      className="w-full h-9 pl-8 pr-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono font-semibold text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selector Limpio de Cilindros Conectados (Mini-tira interactiva) */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Cilindros Conectados ({activePositions.length}/11 Activos • {totalCapacity_L.toLocaleString()} L)
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPositions(prev => prev.map(p => ({ ...p, active: true })))}
                  className="text-cyan-600 hover:underline"
                >
                  Activar Todos
                </button>
                <span className="text-slate-300 dark:text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={() => setPositions(prev => prev.map(p => ({ ...p, active: false })))}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Desactivar
                </button>
              </div>
            </div>

            {/* Fila de 11 Píldoras de Cilindro */}
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
              {positions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePositionActive(p.id)}
                  className={`py-1.5 px-1 rounded-lg text-xs font-mono font-semibold border transition-all text-center ${
                    p.active
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-200 shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 dark:text-zinc-600 line-through opacity-50'
                  }`}
                  title={p.active ? `Cilindro ${p.id} Conectado` : `Cilindro ${p.id} Desconectado`}
                >
                  #{p.id}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Columna Derecha: Consolidado del Rack y Acción (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6 flex flex-col justify-between space-y-6 shadow-sm">
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Consolidado Total Rack
              </span>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                {identifier}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Suma simultánea de las {activePositions.length} posiciones presurizadas
            </p>

            <div className="mt-6 space-y-4">
              
              {/* Volumen Consolidado */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">Volumen Consolidado</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-serif font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                    {totalVolume_Sm3.toFixed(2)}
                  </span>
                  <span className="text-sm font-sans font-medium text-slate-500">Sm³</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                  Capacidad de carga: {totalCapacity_L.toLocaleString()} Litros
                </span>
              </div>

              {/* Masa Total */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase">Masa Total Inyectada</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-serif font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                    {totalMass_kg.toFixed(2)}
                  </span>
                  <span className="text-sm font-sans font-medium text-slate-500">kg</span>
                </div>
              </div>

            </div>
          </div>

          {/* Botón de Guardar Rack */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={activePositions.length === 0 || isSaving}
              className={`w-full py-3 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${
                isSavedFeedback
                  ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900'
              }`}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Guardando Carga de Rack...</span>
                </span>
              ) : isSavedFeedback ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5px]" />
                  <span>Rack Guardado en Libro Mayor</span>
                </>
              ) : (
                <span>Guardar Rack Completo</span>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Sección Secundaria Colapsable: Ajuste Fino por Cilindro (Solo bajo demanda) */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPerCylinderTuning(!showPerCylinderTuning)}
          className="w-full px-5 py-3 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Ajuste Individual por Cilindro (Modificar lecturas que difieran del cabezal)</span>
          </div>
          {showPerCylinderTuning ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showPerCylinderTuning && (
          <div className="p-5 border-t border-slate-200 dark:border-zinc-800 space-y-4 bg-slate-50/50 dark:bg-zinc-900/60">
            
            <div className="flex items-center justify-between text-xs">
              <p className="text-slate-500">
                Edita presiones puntuales en cilindros con lectura discordante o válvula aislada:
              </p>
              <button
                type="button"
                onClick={resetAllToHeader}
                className="flex items-center gap-1 text-xs text-cyan-600 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reestablecer todo a valores de cabezal</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-zinc-800 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-zinc-700">
                  <tr>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Posición</th>
                    <th className="py-2.5 px-3">Capacidad</th>
                    <th className="py-2.5 px-3">P₁ ({pressureUnit})</th>
                    <th className="py-2.5 px-3">T₁ (°C)</th>
                    <th className="py-2.5 px-3">P₂ ({pressureUnit})</th>
                    <th className="py-2.5 px-3">T₂ (°C)</th>
                    <th className="py-2.5 px-3 text-right">Volumen Sm³</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {positions.map((pos) => (
                    <tr 
                      key={pos.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 ${
                        !pos.active ? 'opacity-40 bg-slate-50 dark:bg-zinc-800/20' : ''
                      }`}
                    >
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={pos.active}
                          onChange={() => togglePositionActive(pos.id)}
                          className="rounded text-cyan-600 focus:ring-0"
                        />
                      </td>
                      <td className="py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                        {pos.label}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {pos.capacity_L} L
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          disabled={!pos.active}
                          value={pos.pi}
                          onChange={(e) => updateIndividualPosition(pos.id, 'pi', Number(e.target.value))}
                          className="w-16 h-7 px-1.5 text-xs text-center rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          disabled={!pos.active}
                          value={pos.ti}
                          onChange={(e) => updateIndividualPosition(pos.id, 'ti', Number(e.target.value))}
                          className="w-14 h-7 px-1.5 text-xs text-center rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          disabled={!pos.active}
                          value={pos.pf}
                          onChange={(e) => updateIndividualPosition(pos.id, 'pf', Number(e.target.value))}
                          className="w-16 h-7 px-1.5 text-xs text-center rounded border border-cyan-200 dark:border-cyan-800 bg-cyan-50/30 dark:bg-cyan-950/30 font-mono font-bold text-cyan-700 dark:text-cyan-300"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          disabled={!pos.active}
                          value={pos.tf}
                          onChange={(e) => updateIndividualPosition(pos.id, 'tf', Number(e.target.value))}
                          className="w-14 h-7 px-1.5 text-xs text-center rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-zinc-100">
                        {pos.active && pos.result ? `${pos.result.volumeTransferredSm3.toFixed(2)} Sm³` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
