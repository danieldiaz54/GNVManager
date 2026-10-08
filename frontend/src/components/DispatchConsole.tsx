import React, { useState, useEffect, useMemo } from 'react';
import { thermodynamicsService, TransferResult, GasProfileDTO } from '../core/api/thermodynamic.service';
import { psiToBar, celsiusToKelvin, barToPsi } from '../core/utils/UnitConversion';
import { MODULE_PRESETS } from '../domain/modulePresets';
import { DEFAULT_GAS_PROFILES, GasProfilePreset } from '../domain/gasPresets';
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
  Info,
  DollarSign,
  FileText,
  Activity,
  CheckCircle2,
  TrendingDown,
  Sparkles
} from 'lucide-react';

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
  // 1. Capacidad Geométrica Desacoplada
  const [totalCapacity, setTotalCapacity] = useState<number>(13497);
  const [flowType, setFlowType] = useState<FlowType>('CARGUE');
  const [pressureUnit, setPressureUnit] = useState<'bar' | 'psi'>('bar');
  const [identifier, setIdentifier] = useState('RACK-12P');

  // 2. Cromatografía Dinámica Surtigas
  const [gasProfiles, setGasProfiles] = useState<GasProfileDTO[] | GasProfilePreset[]>(DEFAULT_GAS_PROFILES);
  const [selectedGasProfileId, setSelectedGasProfileId] = useState<string>(DEFAULT_GAS_PROFILES[0].id);

  // 3. Parámetros del Manifold / Cabezal
  const [headerPi, setHeaderPi] = useState(50);
  const [headerPf, setHeaderPf] = useState(250);
  const [headerTi, setHeaderTi] = useState(25);
  const [headerTf, setHeaderTf] = useState(45);

  // 5. Estados UI
  const [showTuning, setShowTuning] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Cargar cromatografías desde el backend
  useEffect(() => {
    thermodynamicsService.getGasProfiles().then(profiles => {
      if (profiles && profiles.length > 0) {
        setGasProfiles(profiles);
        setSelectedGasProfileId(profiles[0].id);
      }
    }).catch(err => console.warn('Usando cromatografías por defecto:', err));
  }, []);

  const activeGas = useMemo(() => {
    const found = gasProfiles.find(g => g.id === selectedGasProfileId);
    if (found) return found;
    return DEFAULT_GAS_PROFILES[0];
  }, [gasProfiles, selectedGasProfileId]);

  const totalCylindersCount = 12;

  // Posiciones del Rack
  const [positions, setPositions] = useState<PositionState[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      label: `POS-${String(i + 1).padStart(2, '0')}`,
      active: true,
      pi: 50,
      pf: 250,
    }))
  );

  useEffect(() => {
    setPositions(prev => {
      return Array.from({ length: totalCylindersCount }, (_, i) => {
        const existing = prev.find(p => p.id === i + 1);
        if (existing) return existing;
        return {
          id: i + 1,
          label: `POS-${String(i + 1).padStart(2, '0')}`,
          active: true,
          pi: headerPi,
          pf: headerPf,
        };
      });
    });
  }, [totalCylindersCount]);

  const activePositions = useMemo(() => positions.filter(p => p.active), [positions]);
  const activeCount = activePositions.length;

  // Prorrateo volumétrico uniforme
  const capacityPerCylinder = useMemo(() => {
    if (activeCount === 0) return 0;
    return totalCapacity / activeCount;
  }, [totalCapacity, activeCount]);

  const applyHeaderToPositions = (pi: number, pf: number) => {
    setPositions(prev => prev.map(p => ({ ...p, pi, pf })));
  };

  // Conmutador de Flujo (Cargue vs Descargue)
  const handleFlowSwitch = (newFlow: FlowType) => {
    if (newFlow === flowType) return;
    setFlowType(newFlow);
    if (newFlow === 'CARGUE') {
      setHeaderPi(50);
      setHeaderPf(250);
      applyHeaderToPositions(50, 250);
    } else {
      setHeaderPi(250);
      setHeaderPf(30);
      applyHeaderToPositions(250, 30);
    }
  };

  // Ejecución del Motor Termodinámico AGA-8
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
        console.error('Error calculando termodinámica:', e);
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

  // Totales
  const totalMass_kg = useMemo(() => 
    activePositions.reduce((acc, p) => acc + (p.result?.massTransferredKg || 0), 0), 
    [activePositions]
  );
  
  const totalVolume_Sm3 = useMemo(() => 
    activePositions.reduce((acc, p) => acc + (p.result?.volumeTransferredSm3 || 0), 0), 
    [activePositions]
  );

  const avgStabilizedPressureBar = useMemo(() => {
    if (activePositions.length === 0) return 0;
    const sum = activePositions.reduce((acc, p) => acc + (p.result?.stabilizedPressureBar || 0), 0);
    return sum / activePositions.length;
  }, [activePositions]);

  const deltaPressure = headerPf - headerPi;
  const absDeltaPressureBar = Math.abs(pressureUnit === 'psi' ? psiToBar(deltaPressure) : deltaPressure);

  // Certificación de Aforo: Regla de Sabanas (P_reposo >= 230 bar)
  const isAforoCertified = avgStabilizedPressureBar >= 230;
  const aforoConstant = absDeltaPressureBar > 0 ? (totalVolume_Sm3 / absDeltaPressureBar) : 0;

  // Toggle de cilindros individuales
  const togglePositionActive = (id: number) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const updateIndividualPosition = (id: number, field: keyof PositionState, val: any) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const resetAllToHeader = () => {
    applyHeaderToPositions(headerPi, headerPf);
  };

  // Guardar en Ledger
  const handleSave = async () => {
    if (activePositions.length === 0) {
      alert('Debes tener al menos una posición activa en la operación.');
      return;
    }

    const avgPi = activePositions.reduce((sum, p) => sum + (pressureUnit === 'psi' ? psiToBar(p.pi) : p.pi), 0) / activePositions.length;
    const avgPf = activePositions.reduce((sum, p) => sum + (pressureUnit === 'psi' ? psiToBar(p.pf) : p.pf), 0) / activePositions.length;

    const payload: SaveRackDTO = {
      parent: {
        recordType: 'RACK_PARENT',
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
        recordType: 'RACK_CHILD',
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

  return (
    <div className="space-y-8 w-full anim-fade-in font-sans">
      
      {/* 1. Barra Ejecutiva de Control Operacional */}
      <div className="p-6 sm:p-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-none transition-colors duration-300">
        
        {/* Lado Izquierdo: Selección de Flota y Flujo */}
        <div className="flex flex-wrap items-center gap-4">
          

          {/* Conmutador Operativo: Cargue vs Descargue */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Flujo:
            </span>
            <div className="flex bg-[var(--color-canvas)] border border-[var(--color-border)] p-0.5 rounded-md text-xs">
              <button
                type="button"
                onClick={() => handleFlowSwitch('CARGUE')}
                className={`px-3.5 py-1.5 font-bold uppercase tracking-wider rounded-sm transition-all ${
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
                className={`px-3.5 py-1.5 font-bold uppercase tracking-wider rounded-sm transition-all ${
                  flowType === 'DESCARGUE'
                    ? 'bg-[var(--color-alert-green-bg)] text-[var(--color-alert-green-text)] border border-[var(--color-border)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Descargue
              </button>
            </div>
          </div>

        </div>

        {/* Lado Derecho: Fuente de Suministro, Presión e Identificador */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Selector de Cromatografía Surtigas */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Perfil de Gas:
            </span>
            <select
              value={selectedGasProfileId}
              onChange={(e) => setSelectedGasProfileId(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono text-xs focus:outline-none cursor-pointer"
            >
              {gasProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Selector de Unidades */}
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

          {/* Identificador Oficial */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">Módulo:</span>
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

      {/* 2. Díptico de Control Ejecutivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch anim-slide-up">
        
        {/* TARJETA 1: Parámetros Físicos y Certificado del Gas */}
        <div className="p-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between space-y-8 shadow-none transition-all duration-300">
          
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] block">
                  1. Entrada Instrumental
                </span>
                <span className="text-[11px] text-[var(--color-text-secondary)]">Manifold & Cromatografía</span>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--color-text-primary)] px-2 py-0.5 rounded-sm bg-[var(--color-canvas)] border border-[var(--color-border)]">
                ΔP: {deltaPressure > 0 ? `+${deltaPressure.toFixed(1)}` : deltaPressure.toFixed(1)} {pressureUnit}
              </span>
            </div>

            {/* Presiones de Entrada */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] shadow-none">
                <span className="text-xs font-mono text-[var(--color-text-secondary)] uppercase block mb-4 tracking-widest">
                  {flowType === 'CARGUE' ? 'P₁ Talón' : 'P₁ Llegada'}
                </span>
                <div className="flex items-baseline gap-2 border-b border-[var(--color-border)] pb-2 mb-4">
                  <input
                    type="number"
                    value={headerPi}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setHeaderPi(val);
                      applyHeaderToPositions(val, headerPf);
                    }}
                    className="w-full bg-transparent font-serif font-bold text-4xl sm:text-5xl text-[var(--color-text-primary)] focus:outline-none"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)] font-mono">{pressureUnit}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <Thermometer className="w-4 h-4" />
                  <input 
                    type="number" 
                    value={headerTi} 
                    onChange={(e) => setHeaderTi(Number(e.target.value))}
                    className="w-12 bg-transparent font-mono text-sm focus:outline-none"
                  />
                  <span>°C</span>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] shadow-none">
                <span className="text-xs font-mono text-[var(--color-text-secondary)] uppercase block mb-4 tracking-widest">
                  {flowType === 'CARGUE' ? 'P₂ Corte' : 'P₂ Remanente'}
                </span>
                <div className="flex items-baseline gap-2 border-b border-[var(--color-border)] pb-2 mb-4">
                  <input
                    type="number"
                    value={headerPf}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setHeaderPf(val);
                      applyHeaderToPositions(headerPi, val);
                    }}
                    className="w-full bg-transparent font-serif font-bold text-4xl sm:text-5xl text-[var(--color-text-primary)] focus:outline-none"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)] font-mono">{pressureUnit}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <Thermometer className="w-4 h-4" />
                  <input 
                    type="number" 
                    value={headerTf} 
                    onChange={(e) => setHeaderTf(Number(e.target.value))}
                    className="w-12 bg-transparent font-mono text-sm focus:outline-none"
                  />
                  <span>°C</span>
                </div>
              </div>
            </div>

            {/* Capacidad Geométrica Total & Prorrateo Automático */}
            <div className="p-4 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase tracking-wider font-bold">
                  Capacidad Geométrica Total (Litros de Agua)
                </span>
                <span className="text-[11px] font-mono font-bold text-[var(--color-text-primary)]">
                  Prorrateo: {capacityPerCylinder.toFixed(1)} L / tubo ({activeCount} activos)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTotalCapacity(13497)}
                  className={`py-2 px-2.5 text-xs font-mono rounded-md border text-center transition-all cursor-pointer ${
                    totalCapacity === 13497
                      ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] border-[var(--color-text-primary)] font-bold'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  13,497 Litros
                </button>
                <button
                  type="button"
                  onClick={() => setTotalCapacity(26950)}
                  className={`py-2 px-2.5 text-xs font-mono rounded-md border text-center transition-all cursor-pointer ${
                    totalCapacity === 26950
                      ? 'bg-[var(--color-text-primary)] text-[var(--color-canvas)] border-[var(--color-text-primary)] font-bold'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  26,950 Litros
                </button>
                <div className="flex items-center gap-1.5 border border-[var(--color-border)] rounded-md px-2.5 bg-[var(--color-surface)]">
                  <input
                    type="number"
                    step="1"
                    value={totalCapacity}
                    onChange={(e) => setTotalCapacity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-transparent font-mono text-xs font-bold text-[var(--color-text-primary)] focus:outline-none"
                    placeholder="Otro vol."
                  />
                  <span className="text-[10px] text-[var(--color-text-secondary)] font-mono">L</span>
                </div>
              </div>
            </div>

            {/* Ficha Técnica de la Cromatografía Oficial Surtigas */}
            <div className="p-3.5 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-text-primary)]">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Certificado Surtigas RUT (14.65 psia / 60 °F):
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
                  {activeGas.name}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-[var(--color-text-secondary)] pt-1.5 border-t border-[var(--color-border)]">
                <div>CH₄: <strong className="text-[var(--color-text-primary)]">{activeGas.methanePercentage ? `${activeGas.methanePercentage.toFixed(4)}%` : '96.3666%'}</strong></div>
                <div>N₂: <strong className="text-[var(--color-text-primary)]">{activeGas.nitrogenPercentage ? `${activeGas.nitrogenPercentage.toFixed(4)}%` : '2.5379%'}</strong></div>
                <div>Gr. Esp (Gr): <strong className="text-[var(--color-text-primary)]">{activeGas.specificGravity ? activeGas.specificGravity.toFixed(4) : '0.5756'}</strong></div>
                <div>P. Calorífico: <strong className="text-[var(--color-text-primary)]">{activeGas.grossCalorificValue ? `${activeGas.grossCalorificValue.toFixed(1)} kcal/m³` : '8,884.3 kcal/m³'}</strong></div>
              </div>
            </div>

          </div>

          <div className="text-[11px] text-[var(--color-text-secondary)] opacity-80 pt-2 border-t border-[var(--color-border)]">
            Resolución en tiempo real vía ecuación virial AGA-8 / DAK
          </div>

        </div>

        {/* TARJETA 2: Dictamen Termodinámico y Certificación Sabanas */}
        <div className="p-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between space-y-8 shadow-none">
          
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] block">
                  2. Balance Físico & Certificación
                </span>
                <span className="text-[11px] text-[var(--color-text-secondary)]">Regla de Aforo (Sabanas)</span>
              </div>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>

            {/* Carga Neta Normalizada */}
            <div className="p-6 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] shadow-none">
              <span className="text-xs font-mono text-[var(--color-text-secondary)] uppercase tracking-widest block mb-4">
                Volumen Transferido AGA-8
              </span>
              <div className="flex items-baseline gap-3 mt-1 border-b border-[var(--color-border)] pb-4 mb-4">
                <span className="text-6xl font-serif font-bold text-[var(--color-text-primary)] tracking-tight">
                  {Math.abs(totalVolume_Sm3).toFixed(2)}
                </span>
                <span className="text-lg font-mono text-[var(--color-text-secondary)]">Sm³</span>
              </div>
              <div className="text-sm font-mono text-[var(--color-text-secondary)]">
                Masa Neta: <strong className="text-[var(--color-text-primary)] font-bold text-base">{Math.abs(totalMass_kg).toFixed(2)} kg</strong>
              </div>
            </div>

            {/* Sello de Aforo Certificado (Sabanas) */}
            <div className={`p-6 rounded-lg border transition-all shadow-none ${
              isAforoCertified
                ? 'bg-[var(--color-alert-green-bg)] border-[var(--color-alert-green-border)] text-[var(--color-alert-green-text)]'
                : 'bg-[var(--color-alert-yellow-bg)] border-[var(--color-alert-yellow-border)] text-[var(--color-alert-yellow-text)]'
            }`}>
              <div className="flex items-start gap-4">
                {isAforoCertified ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <span className="font-bold text-xs uppercase tracking-wide block">
                    {isAforoCertified ? 'Aforo Certificado (Sabanas)' : 'Subllenado Térmico en Reposo'}
                  </span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {isAforoCertified ? (
                      <>
                        Estabilización fría a 20°C: <strong>{avgStabilizedPressureBar.toFixed(1)} bar</strong> (Piso ≥ 230 bar cumplido).<br />
                        Constante oficial: <strong>{aforoConstant.toFixed(2)} Sm³/bar</strong>.
                      </>
                    ) : (
                      <>
                        La presión estabilizada caerá a <strong>{avgStabilizedPressureBar.toFixed(1)} bar</strong> (&lt; 230 bar piso contractual). No bloquea la operación pero requiere compensación.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="text-[11px] text-[var(--color-text-secondary)] opacity-80 pt-2 border-t border-[var(--color-border)]">
            Aforo certificado para auditoría y facturación de volumen
          </div>

        </div>

      </div>

      {/* Botón de Asentamiento en Libro Mayor */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={activeCount === 0 || isSaving}
          className={`w-full py-4 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
            isSavedFeedback
              ? 'bg-emerald-600 text-white'
              : 'bg-[var(--color-text-primary)] hover:opacity-90 text-[var(--color-canvas)] disabled:opacity-40 cursor-pointer'
          }`}
        >
          {isSaving ? (
            <span>Asentando en Libro Mayor...</span>
          ) : isSavedFeedback ? (
            <>
              <Check className="w-5 h-5 stroke-[2.5px]" />
              <span>Operación Asentada Exitosamente</span>
            </>
          ) : (
            <>
              <span>Guardar Registro de Operación</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* 3. Digital Twin de la Batería de Cilindros & Ajuste Fino */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 space-y-8 shadow-none mt-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
            <div>
              <span className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider block">
                Digital Twin: Estado de la Batería ({activeCount}/{totalCylindersCount} Cilindros Activos)
              </span>
              <span className="text-[11px] text-[var(--color-text-secondary)]">
                Supervisión geométrica del manifold • Prorrateo: {capacityPerCylinder.toFixed(1)} L por botella activa
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setPositions(prev => prev.map(p => ({ ...p, active: true })))}
                className="text-[var(--color-text-primary)] font-semibold hover:underline cursor-pointer"
              >
                Activar Todos
              </button>
              <span className="text-[var(--color-border)]">|</span>
              <button
                type="button"
                onClick={() => setPositions(prev => prev.map(p => ({ ...p, active: false })))}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                Desactivar Todos
              </button>
              <span className="text-[var(--color-border)]">|</span>
              <button
                type="button"
                onClick={() => setShowTuning(!showTuning)}
                className="font-bold text-[var(--color-text-primary)] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showTuning ? 'Ocultar Ajuste Fino' : 'Ajuste por Tubo'}</span>
              </button>
            </div>
          </div>

          {/* Grilla Visual de Tubos / Cilindros del Rack */}
          <div className={`grid gap-3 ${totalCylindersCount === 12 ? 'grid-cols-3 sm:grid-cols-6 lg:grid-cols-12' : 'grid-cols-3 sm:grid-cols-6 lg:grid-cols-11'}`}>
            {positions.map((p) => {
              const deltaP = p.pf - p.pi;
              return (
                <div
                  key={p.id}
                  onClick={() => togglePositionActive(p.id)}
                  className={`p-3 rounded-md border text-center transition-all duration-200 cursor-pointer flex flex-col justify-between hover:scale-[1.03] active:scale-[0.98] ${
                    p.active
                      ? 'bg-[var(--color-canvas)] border-[var(--color-border)] hover:border-[var(--color-text-primary)] hover:shadow-xs'
                      : 'bg-[var(--color-canvas)] border-[var(--color-border)] opacity-40 line-through'
                  }`}
                >
                  <span className="text-[10px] font-mono text-[var(--color-text-secondary)] font-bold">
                    #{p.id}
                  </span>
                  
                  <div className="my-2">
                    <span className="text-sm font-mono font-bold text-[var(--color-text-primary)] block">
                      {p.active && p.result ? `${Math.abs(p.result.volumeTransferredSm3).toFixed(1)}` : '0.0'}
                    </span>
                    <span className="text-[9px] text-[var(--color-text-secondary)] font-mono">Sm³</span>
                  </div>

                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                    {deltaP > 0 ? `+${deltaP.toFixed(0)}` : deltaP.toFixed(0)} {pressureUnit}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tabla Desplegable de Ajuste Manual por Tubo */}
          {showTuning && (
            <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-secondary)]">
                  Ajuste manual para cilindros con manómetro individual dispar:
                </span>
                <button
                  type="button"
                  onClick={resetAllToHeader}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar todos a valores del cabezal</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[var(--color-canvas)] text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider border-b border-[var(--color-border)]">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">Activo</th>
                      <th className="py-2.5 px-4">Cilindro</th>
                      <th className="py-2.5 px-4">P₁ ({pressureUnit})</th>
                      <th className="py-2.5 px-4">P₂ ({pressureUnit})</th>
                      <th className="py-2.5 px-4">ΔP</th>
                      <th className="py-2.5 px-4 text-right">Volumen Calculado</th>
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
                          {pos.active && pos.result ? `${Math.abs(pos.result.volumeTransferredSm3).toFixed(2)} Sm³` : '—'}
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
