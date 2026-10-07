import React, { useState, useEffect, useMemo } from 'react';
import { thermodynamicsService, TransferResult, GasProfileDTO } from '../core/api/thermodynamic.service';
import { psiToBar, celsiusToKelvin, barToPsi } from '../core/utils/UnitConversion';
import { MODULE_PRESETS } from '../domain/modulePresets';
import { DEFAULT_GAS_PROFILES } from '../domain/gasPresets';
import { SaveRackDTO } from '../core/api/reconciliation.service';
import { 
  Gauge, 
  Thermometer, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  RotateCcw, 
  Layers, 
  Box, 
  ArrowRight, 
  Award, 
  AlertTriangle, 
  Flame,
  Info
} from 'lucide-react';

export type TopologyMode = 'RACK_11' | 'RACK_12' | 'INDIVIDUAL';
export type FlowType = 'CARGUE' | 'DESCARGUE';

export interface PositionState {
  id: number;
  label: string;
  active: boolean;
  pi: number;
  pf: number;
  result?: TransferResult;
}

interface DispatchConsoleProps {
  onSaveOperation: (data: SaveRackDTO) => Promise<void> | void;
  isSaving?: boolean;
}

export default function DispatchConsole({ onSaveOperation, isSaving = false }: DispatchConsoleProps) {
  // 1. Configuración de Operación
  const [topology, setTopology] = useState<TopologyMode>('RACK_11');
  const [flowType, setFlowType] = useState<FlowType>('CARGUE');
  const [pressureUnit, setPressureUnit] = useState<'bar' | 'psi'>('bar');
  const [identifier, setIdentifier] = useState('RACK-11P');
  const [totalCapacity, setTotalCapacity] = useState<number>(13497);

  // 2. Cromatografía Dinámica
  const [gasProfiles, setGasProfiles] = useState<GasProfileDTO[] | { id: string; name: string }[]>(DEFAULT_GAS_PROFILES);
  const [selectedGasProfileId, setSelectedGasProfileId] = useState<string>(DEFAULT_GAS_PROFILES[0].id);

  // 3. Mediciones de Cabezal / Manifold Común
  const [headerPi, setHeaderPi] = useState(50);
  const [headerPf, setHeaderPf] = useState(250);
  const [headerTi, setHeaderTi] = useState(25);
  const [headerTf, setHeaderTf] = useState(45);

  // 4. Estados de UI
  const [showTuning, setShowTuning] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Cargar perfiles de gas reales
  useEffect(() => {
    thermodynamicsService.getGasProfiles().then(profiles => {
      if (profiles && profiles.length > 0) {
        setGasProfiles(profiles);
        setSelectedGasProfileId(profiles[0].id);
      }
    }).catch(err => console.warn('Usando perfiles por defecto:', err));
  }, []);

  const totalCylindersCount = topology === 'INDIVIDUAL' ? 1 : topology === 'RACK_12' ? 12 : 11;

  // Actualizar identificador por defecto según topología
  const handleTopologyChange = (newTop: TopologyMode) => {
    setTopology(newTop);
    if (newTop === 'INDIVIDUAL') {
      setIdentifier('MOD-01');
      setTotalCapacity(13497);
    } else if (newTop === 'RACK_12') {
      setIdentifier('RACK-12P');
    } else {
      setIdentifier('RACK-11P');
    }
  };

  // Posiciones activas e individuales
  const [positions, setPositions] = useState<PositionState[]>(() =>
    Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
      label: `POS-${String(i + 1).padStart(2, '0')}`,
      active: true,
      pi: 50,
      pf: 250,
    }))
  );

  // Ajustar número de cilindros al cambiar topología
  useEffect(() => {
    setPositions(prev => {
      return Array.from({ length: totalCylindersCount }, (_, i) => {
        const existing = prev.find(p => p.id === i + 1);
        if (existing) return existing;
        return {
          id: i + 1,
          label: topology === 'INDIVIDUAL' ? 'MÓDULO INDIVIDUAL' : `POS-${String(i + 1).padStart(2, '0')}`,
          active: true,
          pi: headerPi,
          pf: headerPf,
        };
      });
    });
  }, [totalCylindersCount, topology]);

  const activePositions = useMemo(() => positions.filter(p => p.active), [positions]);
  const activeCount = activePositions.length;

  // Prorrateo volumétrico uniforme (Regla de negocio formal)
  const capacityPerCylinder = useMemo(() => {
    if (activeCount === 0) return 0;
    return totalCapacity / activeCount;
  }, [totalCapacity, activeCount]);

  // Aplicar cabezal a cilindros
  const applyHeaderToPositions = (pi: number, pf: number) => {
    setPositions(prev => prev.map(p => ({ ...p, pi, pf })));
  };

  // Conmutador de Flujo (Invierte presiones nominalmente según acuerdo operacional)
  const handleFlowSwitch = (newFlow: FlowType) => {
    if (newFlow === flowType) return;
    setFlowType(newFlow);
    if (newFlow === 'CARGUE') {
      // Cargue: Remanente talón bajo (~50 bar) -> Corte compresor alto (~250 bar)
      setHeaderPi(50);
      setHeaderPf(250);
      applyHeaderToPositions(50, 250);
    } else {
      // Descargue: Llegada alta (~250 bar) -> Remanente muerto bajo (~30 bar)
      setHeaderPi(250);
      setHeaderPf(30);
      applyHeaderToPositions(250, 30);
    }
  };

  // Cálculo en Lote con Motor Termodinámico AGA-8
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
          operationType: flowType,
          gasProfileId: selectedGasProfileId,
          initialPressureBar: pressureUnit === 'psi' ? psiToBar(pos.pi) : pos.pi,
          initialTempK: celsiusToKelvin(headerTi),
          finalPressureBar: pressureUnit === 'psi' ? psiToBar(pos.pf) : pos.pf,
          finalTempK: celsiusToKelvin(headerTf),
          volumeLiters: capacityPerCylinder,
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
        console.error('Error calculando transferencia termodinámica:', e);
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    pressureUnit,
    capacityPerCylinder,
    headerTi,
    headerTf,
    flowType,
    selectedGasProfileId,
    positions.map(p => `${p.active}-${p.pi}-${p.pf}`).join('|')
  ]);

  // Consolidación de Totales
  const totalMass_kg = useMemo(() => 
    activePositions.reduce((acc, p) => acc + (p.result?.massTransferredKg || 0), 0), 
    [activePositions]
  );
  
  const totalVolume_Sm3 = useMemo(() => 
    activePositions.reduce((acc, p) => acc + (p.result?.volumeTransferredSm3 || 0), 0), 
    [activePositions]
  );

  // Presión promedio estabilizada en reposo
  const avgStabilizedPressureBar = useMemo(() => {
    if (activePositions.length === 0) return 0;
    const sum = activePositions.reduce((acc, p) => acc + (p.result?.stabilizedPressureBar || 0), 0);
    return sum / activePositions.length;
  }, [activePositions]);

  // Delta de Presión Global
  const deltaPressure = headerPf - headerPi;
  const absDeltaPressureBar = Math.abs(pressureUnit === 'psi' ? psiToBar(deltaPressure) : deltaPressure);

  // Regla de Sabanas: Certificación de Aforo (P_reposo >= 230 bar)
  const isAforoCertified = avgStabilizedPressureBar >= 230;
  const aforoSm3PerBar = absDeltaPressureBar > 0 ? (totalVolume_Sm3 / absDeltaPressureBar) : 0;

  // Toggle de cilindros
  const togglePositionActive = (id: number) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const updateIndividualPosition = (id: number, field: keyof PositionState, val: any) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const resetAllToHeader = () => {
    applyHeaderToPositions(headerPi, headerPf);
  };

  // Confirmar y Guardar Operación
  const handleSave = async () => {
    if (activePositions.length === 0) {
      alert('Debes tener al menos una posición activa en la operación.');
      return;
    }

    const avgPi = activePositions.reduce((sum, p) => sum + (pressureUnit === 'psi' ? psiToBar(p.pi) : p.pi), 0) / activePositions.length;
    const avgPf = activePositions.reduce((sum, p) => sum + (pressureUnit === 'psi' ? psiToBar(p.pf) : p.pf), 0) / activePositions.length;

    const payload: SaveRackDTO = {
      parent: {
        recordType: topology === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'RACK_PARENT',
        operationType: flowType,
        gasProfileId: selectedGasProfileId,
        moduleIdentifier: identifier,
        moduleCapacityLiters: totalCapacity,
        initialPressureBar: avgPi,
        initialTempK: celsiusToKelvin(headerTi),
        finalPressureBar: avgPf,
        finalTempK: celsiusToKelvin(headerTf),
        calculatedMassKg: totalMass_kg,
        calculatedVolumeSm3: totalVolume_Sm3
      },
      positions: activePositions.map(pos => ({
        recordType: topology === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'RACK_CHILD',
        operationType: flowType,
        gasProfileId: selectedGasProfileId,
        moduleIdentifier: identifier,
        positionNumber: pos.id,
        moduleCapacityLiters: capacityPerCylinder,
        initialPressureBar: pressureUnit === 'psi' ? psiToBar(pos.pi) : pos.pi,
        initialTempK: celsiusToKelvin(headerTi),
        finalPressureBar: pressureUnit === 'psi' ? psiToBar(pos.pf) : pos.pf,
        finalTempK: celsiusToKelvin(headerTf),
        calculatedMassKg: pos.result?.massTransferredKg || 0,
        calculatedVolumeSm3: pos.result?.volumeTransferredSm3 || 0
      }))
    };

    try {
      await onSaveOperation(payload);
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2500);
    } catch (error) {
      console.error('Error guardando la operación:', error);
    }
  };

  const selectedGasName = gasProfiles.find(g => g.id === selectedGasProfileId)?.name || 'Gas Estándar';

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto animate-fade-in font-sans">
      
      {/* 1. Barra de Control Contextual (Stepped Flow - Nivel 1) */}
      <div className="p-4 sm:p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-none flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Topología y Modo Operacional */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Selector de Topología */}
          <div className="flex bg-[var(--color-canvas)] border border-[var(--color-border)] p-0.5 rounded-md text-xs">
            <button
              type="button"
              onClick={() => handleTopologyChange('RACK_11')}
              className={`px-3 py-1.5 font-medium rounded-sm transition-all flex items-center gap-1.5 ${
                topology === 'RACK_11'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-xs border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rack 11 Cilindros</span>
            </button>
            <button
              type="button"
              onClick={() => handleTopologyChange('RACK_12')}
              className={`px-3 py-1.5 font-medium rounded-sm transition-all flex items-center gap-1.5 ${
                topology === 'RACK_12'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-xs border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rack 12 Cilindros</span>
            </button>
            <button
              type="button"
              onClick={() => handleTopologyChange('INDIVIDUAL')}
              className={`px-3 py-1.5 font-medium rounded-sm transition-all flex items-center gap-1.5 ${
                topology === 'INDIVIDUAL'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-semibold shadow-xs border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Módulo Individual</span>
            </button>
          </div>

          {/* Conmutador de Flujo: Cargue vs Descargue */}
          <div className="flex bg-[var(--color-canvas)] border border-[var(--color-border)] p-0.5 rounded-md text-xs">
            <button
              type="button"
              onClick={() => handleFlowSwitch('CARGUE')}
              className={`px-3 py-1.5 font-semibold uppercase tracking-wider rounded-sm transition-all ${
                flowType === 'CARGUE'
                  ? 'bg-[var(--color-alert-blue-bg)] text-[var(--color-alert-blue-text)] border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Cargue
            </button>
            <button
              type="button"
              onClick={() => handleFlowSwitch('DESCARGUE')}
              className={`px-3 py-1.5 font-semibold uppercase tracking-wider rounded-sm transition-all ${
                flowType === 'DESCARGUE'
                  ? 'bg-[var(--color-alert-green-bg)] text-[var(--color-alert-green-text)] border border-[var(--color-border)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Descargue
            </button>
          </div>

        </div>

        {/* Cromatografía, Unidades e Identificador */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Selector de Cromatografía Oficial Surtigas */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500" />
              Gas:
            </span>
            <select
              value={selectedGasProfileId}
              onChange={(e) => setSelectedGasProfileId(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--color-text-primary)] cursor-pointer"
            >
              {gasProfiles.map(profile => (
                <option key={profile.id} value={profile.id}>{profile.name}</option>
              ))}
            </select>
          </div>

          {/* Unidades de Presión */}
          <div className="flex bg-[var(--color-canvas)] border border-[var(--color-border)] p-0.5 rounded-md text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                if (pressureUnit === 'psi') {
                  setHeaderPi(Math.round(psiToBar(headerPi)));
                  setHeaderPf(Math.round(psiToBar(headerPf)));
                  setPositions(prev => prev.map(p => ({
                    ...p,
                    pi: Math.round(psiToBar(p.pi)),
                    pf: Math.round(psiToBar(p.pf))
                  })));
                  setPressureUnit('bar');
                }
              }}
              className={`px-2 py-1 rounded-sm transition-colors ${
                pressureUnit === 'bar' ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-bold shadow-xs' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              bar
            </button>
            <button
              type="button"
              onClick={() => {
                if (pressureUnit === 'bar') {
                  setHeaderPi(Math.round(barToPsi(headerPi)));
                  setHeaderPf(Math.round(barToPsi(headerPf)));
                  setPositions(prev => prev.map(p => ({
                    ...p,
                    pi: Math.round(barToPsi(p.pi)),
                    pf: Math.round(barToPsi(p.pf))
                  })));
                  setPressureUnit('psi');
                }
              }}
              className={`px-2 py-1 rounded-sm transition-colors ${
                pressureUnit === 'psi' ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-bold shadow-xs' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              psi
            </button>
          </div>

          {/* Identificador de Módulo */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase">ID:</span>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-8 w-24 px-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono font-bold text-xs focus:outline-none"
              placeholder="RACK-01"
            />
          </div>

        </div>

      </div>

      {/* 2. Grid Principal: Entradas Operativas (Izq) vs Veredicto y Certificación (Der) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Columna Izquierda: Entradas de Manifold y Estado Físico */}
        <div className="lg:col-span-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-6 shadow-none">
          
          {/* Presets de Capacidad Nominal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Capacidad Geométrica Nominal
              </span>
              <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                {topology !== 'INDIVIDUAL' && `Prorrateo: ${capacityPerCylinder.toFixed(1)} L/cilindro`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {MODULE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setTotalCapacity(preset.capacity_L)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${
                    totalCapacity === preset.capacity_L
                      ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] border-[var(--color-text-primary)] font-bold'
                      : 'bg-[var(--color-canvas)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <div className="relative ml-auto">
                <input
                  type="number"
                  value={totalCapacity}
                  onChange={(e) => setTotalCapacity(Number(e.target.value))}
                  className="w-28 h-8 px-2 pr-6 rounded-md border border-[var(--color-border)] bg-[var(--color-canvas)] text-xs font-mono text-right focus:outline-none"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-secondary)] font-mono">L</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--color-border)]" />

          {/* Presiones de Manifold / Cabezal Común */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Mediciones de Cabezal Común
              </span>
              <span className="text-xs font-mono font-bold text-[var(--color-text-primary)] px-2 py-0.5 rounded-sm bg-[var(--color-canvas)] border border-[var(--color-border)]">
                ΔP: {deltaPressure > 0 ? `+${deltaPressure.toFixed(1)}` : deltaPressure.toFixed(1)} {pressureUnit}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Condición 1 (P_i, T_i) */}
              <div className="p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-canvas)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-primary)] uppercase">
                    1. {flowType === 'CARGUE' ? 'Talón Remanente (P₁)' : 'Llegada Alta (P₁)'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Presión Inicial ({pressureUnit})</label>
                  <div className="relative">
                    <Gauge className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      value={headerPi}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHeaderPi(val);
                        applyHeaderToPositions(val, headerPf);
                      }}
                      className="w-full h-9 pl-9 pr-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Temperatura Inicial (°C)</label>
                  <div className="relative">
                    <Thermometer className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      step="0.5"
                      value={headerTi}
                      onChange={(e) => setHeaderTi(Number(e.target.value))}
                      className="w-full h-9 pl-9 pr-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Condición 2 (P_f, T_f) */}
              <div className="p-4 rounded-md border border-[var(--color-border)] bg-[var(--color-canvas)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-primary)] uppercase">
                    2. {flowType === 'CARGUE' ? 'Corte Compresor (P₂)' : 'Remanente Muerto (P₂)'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Presión Final ({pressureUnit})</label>
                  <div className="relative">
                    <Gauge className="w-4 h-4 text-[var(--color-text-primary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      value={headerPf}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHeaderPf(val);
                        applyHeaderToPositions(headerPi, val);
                      }}
                      className="w-full h-9 pl-9 pr-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono font-bold text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Temperatura Final (°C)</label>
                  <div className="relative">
                    <Thermometer className="w-4 h-4 text-[var(--color-text-primary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      step="0.5"
                      value={headerTf}
                      onChange={(e) => setHeaderTf(Number(e.target.value))}
                      className="w-full h-9 pl-9 pr-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono font-bold text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Grilla Física del Rack (Digital Twin de Posiciones) */}
          {topology !== 'INDIVIDUAL' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Cilindros Activos ({activeCount}/{totalCylindersCount})
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setPositions(prev => prev.map(p => ({ ...p, active: true })))}
                    className="text-[var(--color-text-primary)] font-semibold hover:underline"
                  >
                    Activar Todos
                  </button>
                  <span className="text-[var(--color-border)]">|</span>
                  <button
                    type="button"
                    onClick={() => setPositions(prev => prev.map(p => ({ ...p, active: false })))}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    Desactivar
                  </button>
                </div>
              </div>

              <div className={`grid gap-2 ${totalCylindersCount === 12 ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-4 sm:grid-cols-6'}`}>
                {positions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePositionActive(p.id)}
                    className={`py-2 px-1 text-xs font-mono rounded-md border transition-all text-center ${
                      p.active
                        ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)] text-[var(--color-canvas)] font-bold shadow-xs'
                        : 'bg-[var(--color-canvas)] border-[var(--color-border)] text-[var(--color-text-secondary)] opacity-50 line-through'
                    }`}
                  >
                    #{p.id}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Columna Derecha: Tarjeta de Veredicto Técnico, Certificación de Aforo y Confirmación */}
        <div className="lg:col-span-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-6 flex flex-col justify-between space-y-6 shadow-none">
          
          <div className="space-y-5">
            
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">
                Veredicto Físico Consolidado
              </span>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Gas: <span className="font-semibold text-[var(--color-text-primary)]">{selectedGasName}</span> • Topología: {topology}
              </p>
            </div>

            {/* Métrica 1: Volumen Normalizado Sm³ */}
            <div className="p-4 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase tracking-wider">
                Volumen Normalizado Transferido
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-serif font-bold text-[var(--color-text-primary)] tracking-tight">
                  {Math.abs(totalVolume_Sm3).toFixed(2)}
                </span>
                <span className="text-sm font-mono text-[var(--color-text-secondary)]">Sm³</span>
              </div>
            </div>

            {/* Métrica 2: Masa Transferida kg */}
            <div className="p-4 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase tracking-wider">
                Masa Neta de Gas
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-serif font-bold text-[var(--color-text-primary)] tracking-tight">
                  {Math.abs(totalMass_kg).toFixed(2)}
                </span>
                <span className="text-sm font-mono text-[var(--color-text-secondary)]">kg</span>
              </div>
            </div>

            {/* Tarjeta de Certificación de Aforo (Regla de Sabanas) */}
            <div className={`p-4 rounded-md border transition-all ${
              isAforoCertified
                ? 'bg-[var(--color-alert-green-bg)] border-[var(--color-alert-green-border)] text-[var(--color-alert-green-text)]'
                : 'bg-[var(--color-alert-yellow-bg)] border-[var(--color-alert-yellow-border)] text-[var(--color-alert-yellow-text)]'
            }`}>
              <div className="flex items-start gap-3">
                {isAforoCertified ? (
                  <Award className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wide">
                      {isAforoCertified ? 'Aforo Certificado (Sabanas)' : 'Subllenado Térmico en Reposo'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {isAforoCertified ? (
                      <>
                        Presión estabilizada en frío de <strong>{avgStabilizedPressureBar.toFixed(1)} bar</strong> (≥ 230 bar). Constante certificada: <strong>{aforoSm3PerBar.toFixed(2)} Sm³/bar</strong>.
                      </>
                    ) : (
                      <>
                        Al enfriarse a 20°C reposa en <strong>{avgStabilizedPressureBar.toFixed(1)} bar</strong> (&lt; 230 bar piso nominal). Se requiere compensación térmica antes del precintado.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Botón de Confirmación y Registro Contable */}
          <div className="pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={handleSave}
              disabled={activeCount === 0 || isSaving}
              className={`w-full py-3.5 px-4 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                isSavedFeedback
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--color-text-primary)] hover:opacity-90 text-[var(--color-canvas)] disabled:opacity-40'
              }`}
            >
              {isSaving ? (
                <span>Registrando en Libro Mayor...</span>
              ) : isSavedFeedback ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5px]" />
                  <span>Operación Asentada en Libro Mayor</span>
                </>
              ) : (
                <>
                  <span>Confirmar y Asentar Operación</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* 3. Acordeón de Ajuste Fino por Cilindro (Solo si es Rack) */}
      {topology !== 'INDIVIDUAL' && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTuning(!showTuning)}
            className="w-full px-6 py-4 flex items-center justify-between text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 text-[var(--color-text-primary)]" />
              <span>Ajuste Individual Fino por Cilindro (Excepciones de Manifold)</span>
            </div>
            {showTuning ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showTuning && (
            <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-canvas)] space-y-4">
              <div className="flex items-center justify-between text-xs">
                <p className="text-[var(--color-text-secondary)]">
                  Modifica las presiones de cilindros individuales si una botella quedó cerrada o presenta talón dispar.
                </p>
                <button
                  type="button"
                  onClick={resetAllToHeader}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar todas al cabezal</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[var(--color-canvas)] text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider border-b border-[var(--color-border)]">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">Act</th>
                      <th className="py-2.5 px-4">Posición</th>
                      <th className="py-2.5 px-4">P₁ ({pressureUnit})</th>
                      <th className="py-2.5 px-4">P₂ ({pressureUnit})</th>
                      <th className="py-2.5 px-4">ΔP</th>
                      <th className="py-2.5 px-4 text-right">Volumen Sm³</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {positions.map((pos) => (
                      <tr 
                        key={pos.id} 
                        className={`hover:bg-[var(--color-surface-hover)] transition-colors ${
                          !pos.active ? 'opacity-40 bg-[var(--color-canvas)]' : ''
                        }`}
                      >
                        <td className="py-2 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={pos.active}
                            onChange={() => togglePositionActive(pos.id)}
                            className="rounded-sm border-[var(--color-border)] cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-4 font-semibold text-[var(--color-text-primary)]">
                          {pos.label}
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            disabled={!pos.active}
                            value={pos.pi}
                            onChange={(e) => updateIndividualPosition(pos.id, 'pi', Number(e.target.value))}
                            className="w-20 h-7 px-2 rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            disabled={!pos.active}
                            value={pos.pf}
                            onChange={(e) => updateIndividualPosition(pos.id, 'pf', Number(e.target.value))}
                            className="w-20 h-7 px-2 rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-4 text-[var(--color-text-secondary)]">
                          {(pos.pf - pos.pi).toFixed(1)}
                        </td>
                        <td className="py-2 px-4 text-right font-bold text-[var(--color-text-primary)]">
                          {pos.active && pos.result ? Math.abs(pos.result.volumeTransferredSm3).toFixed(2) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
