import React, { useState, useEffect, useMemo, useRef } from 'react';
import { thermodynamicsService, TransferResult, GasProfileDTO } from '../core/api/thermodynamic.service';
import { StorageService, StorageModuleDTO } from '../core/api/storage.service';
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
  ChevronRight,
  Sliders, 
  RotateCcw, 
  Layers, 
  Box, 
  Building2,
  Truck,
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
  // 1. Almacenamientos Dinámicos
  const [storageModules, setStorageModules] = useState<StorageModuleDTO[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');

  const [flowType, setFlowType] = useState<FlowType>('CARGUE');
  const [pressureUnit, setPressureUnit] = useState<'bar' | 'psi'>('bar');

  // 2. Cromatografía Dinámica Surtigas
  const [gasProfiles, setGasProfiles] = useState<GasProfileDTO[] | GasProfilePreset[]>(DEFAULT_GAS_PROFILES);
  const [selectedGasProfileId, setSelectedGasProfileId] = useState<string>(DEFAULT_GAS_PROFILES[0].id);

  // 3. Parámetros del Manifold / Cabezal (Inicializados en 0)
  const [headerPi, setHeaderPi] = useState(0);
  const [headerPf, setHeaderPf] = useState(0);
  const [headerTi, setHeaderTi] = useState(0);
  const [headerTf, setHeaderTf] = useState(0);

  const [piStr, setPiStr] = useState('0');
  const [pfStr, setPfStr] = useState('0');
  const [tiStr, setTiStr] = useState('0');
  const [tfStr, setTfStr] = useState('0');

  // 5. Estados UI
  const [showTuning, setShowTuning] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Estados para el Selector Jerárquico de Módulo
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const [openModuleCategory, setOpenModuleCategory] = useState<'ESTACIONARIA' | 'TRANSPORTE' | null>(null);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(event.target as Node)) {
        setIsModuleDropdownOpen(false);
        setOpenModuleCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar módulos y cromatografías desde el backend
  useEffect(() => {
    StorageService.getModules().then(modules => {
      if (modules && modules.length > 0) {
        setStorageModules(modules);
        setSelectedModuleId(modules[0].id);
      }
    }).catch(err => console.warn('Error cargando almacenamientos:', err));

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

  const activeModule = useMemo(() => {
    return storageModules.find(m => m.id === selectedModuleId);
  }, [storageModules, selectedModuleId]);

  const stationaryModules = useMemo(() => 
    storageModules.filter(m => m.type === 'ESTACIONARIA'), 
    [storageModules]
  );

  const transportModules = useMemo(() => 
    storageModules.filter(m => m.type === 'TRANSPORTE'), 
    [storageModules]
  );

  const totalCapacity = activeModule ? activeModule.totalCapacityLiters : 0;
  const totalCylindersCount = activeModule ? activeModule.cylinderCount : 12;
  const identifier = activeModule ? activeModule.name : 'RACK-12P';

  // Posiciones del Rack (Inicializadas en 0)
  const [positions, setPositions] = useState<PositionState[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      label: `POS-${String(i + 1).padStart(2, '0')}`,
      active: true,
      pi: 0,
      pf: 0,
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
    setHeaderPi(0);
    setHeaderPf(0);
    setPiStr('0');
    setPfStr('0');
    applyHeaderToPositions(0, 0);
  };

  // Ejecución del Motor Termodinámico AGA-8
  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(async () => {
      const activeToCompute = positions.filter(p => p.active && (p.pi > 0 || p.pf > 0));
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

  // Verificación de estado en reposo con valores en 0
  const hasZeroPressures = useMemo(() => {
    return activePositions.length === 0 || activePositions.every(p => p.pi === 0 && p.pf === 0);
  }, [activePositions]);

  // Estimación de Aforo: Condición de Entrega (P_reposo >= 230 bar)
  const isAforoConforme = avgStabilizedPressureBar >= 230;
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

    if (hasZeroPressures) {
      alert('Debes ingresar presiones operativas mayores a 0 para asentar el movimiento.');
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
      
      {/* 1. Barra Ejecutiva de Control Operacional Adaptable */}
      <div className="p-4 sm:p-5 lg:px-6 lg:py-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 shadow-none transition-colors duration-300">
        
        {/* Lado Izquierdo: Selección de Flota y Flujo */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          

          {/* Conmutador Operativo: Cargue vs Descargue */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Tipo de operación:
            </span>
            <div className="flex bg-[var(--color-canvas)] border border-[var(--color-border)] p-0.5 rounded-md text-xs">
              <button
                type="button"
                onClick={() => handleFlowSwitch('CARGUE')}
                className={`px-3 sm:px-3.5 py-1.5 font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
                  flowType === 'CARGUE'
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] shadow-2xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                }`}
              >
                Cargue
              </button>
              <button
                type="button"
                onClick={() => handleFlowSwitch('DESCARGUE')}
                className={`px-3 sm:px-3.5 py-1.5 font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
                  flowType === 'DESCARGUE'
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] shadow-2xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-transparent'
                }`}
              >
                Descargue
              </button>
            </div>
          </div>

        </div>

        {/* Lado Derecho: Selector de Unidades de Presión */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Unidad:
          </span>
          <div className="flex bg-[var(--color-canvas)] border border-[var(--color-border)] p-0.5 rounded-md text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                if (pressureUnit === 'psi') {
                  const newPi = Math.round(psiToBar(headerPi));
                  const newPf = Math.round(psiToBar(headerPf));
                  setHeaderPi(newPi);
                  setHeaderPf(newPf);
                  setPiStr(String(newPi));
                  setPfStr(String(newPf));
                  setPositions(prev => prev.map(p => ({
                    ...p,
                    pi: Math.round(psiToBar(p.pi)),
                    pf: Math.round(psiToBar(p.pf))
                  })));
                  setPressureUnit('bar');
                }
              }}
              className={`px-2.5 py-1 rounded-sm transition-colors ${
                pressureUnit === 'bar' ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-bold shadow-xs' : 'text-[var(--color-text-secondary)]'
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
                  setPiStr(String(newPi));
                  setPfStr(String(newPf));
                  setPositions(prev => prev.map(p => ({
                    ...p,
                    pi: Math.round(barToPsi(p.pi)),
                    pf: Math.round(barToPsi(p.pf))
                  })));
                  setPressureUnit('psi');
                }
              }}
              className={`px-2.5 py-1 rounded-sm transition-colors ${
                pressureUnit === 'psi' ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] font-bold shadow-xs' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              psi
            </button>
          </div>
        </div>

      </div>

      {/* 2. Díptico de Control Ejecutivo: Distribución Asimétrica de Jerarquía */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-stretch anim-slide-up">
        
        {/* TARJETA 1: Parámetros de Operación y Condiciones de Despacho */}
        <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 p-4 sm:p-6 lg:p-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between space-y-6 shadow-none transition-all duration-300">
          
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--color-border)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Condiciones de Despacho
              </span>
              <span className="text-xs font-mono font-bold text-[var(--color-accent)] px-2.5 py-1 rounded-sm bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)]">
                ΔP: {deltaPressure > 0 ? `+${deltaPressure.toFixed(1)}` : deltaPressure.toFixed(1)} {pressureUnit}
              </span>
            </div>

            {/* Presiones de Entrada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="p-5 sm:p-6 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] shadow-none flex flex-col justify-between">
                <span className="text-xs font-mono text-[var(--color-text-secondary)] uppercase block mb-3 tracking-widest">
                  P1 Inicial
                </span>
                <div className="flex items-baseline gap-2 border-b border-[var(--color-border)] pb-2 mb-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={piStr}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9.]/g, '');
                      if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
                      setPiStr(val);
                      const num = parseFloat(val) || 0;
                      setHeaderPi(num);
                      applyHeaderToPositions(num, headerPf);
                    }}
                    onBlur={() => {
                      if (!piStr || isNaN(parseFloat(piStr))) {
                        setPiStr('0');
                        setHeaderPi(0);
                        applyHeaderToPositions(0, headerPf);
                      }
                    }}
                    className="w-full bg-transparent font-sans font-semibold text-3xl sm:text-4xl lg:text-5xl text-[var(--color-text-primary)] focus:outline-none tracking-tight"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)] font-mono">{pressureUnit}</span>
                </div>
                <div className="flex items-center justify-between pt-2 mt-auto">
                  <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5 select-none">
                    <Thermometer className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span>Temperatura</span>
                  </label>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)] transition-all shadow-2xs cursor-text">
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={tiStr}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9.-]/g, '');
                        if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
                        setTiStr(val);
                        setHeaderTi(parseFloat(val) || 0);
                      }}
                      onBlur={() => {
                        if (!tiStr || isNaN(parseFloat(tiStr))) {
                          setTiStr('0');
                          setHeaderTi(0);
                        }
                      }}
                      className="w-12 text-right bg-transparent font-mono font-bold text-xs text-[var(--color-text-primary)] focus:outline-none"
                    />
                    <span className="text-[11px] font-mono font-semibold text-[var(--color-text-secondary)]">°C</span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] shadow-none flex flex-col justify-between">
                <span className="text-xs font-mono text-[var(--color-text-secondary)] uppercase block mb-3 tracking-widest">
                  P2 Final
                </span>
                <div className="flex items-baseline gap-2 border-b border-[var(--color-border)] pb-2 mb-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={pfStr}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9.]/g, '');
                      if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
                      setPfStr(val);
                      const num = parseFloat(val) || 0;
                      setHeaderPf(num);
                      applyHeaderToPositions(headerPi, num);
                    }}
                    onBlur={() => {
                      if (!pfStr || isNaN(parseFloat(pfStr))) {
                        setPfStr('0');
                        setHeaderPf(0);
                        applyHeaderToPositions(headerPi, 0);
                      }
                    }}
                    className="w-full bg-transparent font-sans font-semibold text-3xl sm:text-4xl lg:text-5xl text-[var(--color-text-primary)] focus:outline-none tracking-tight"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)] font-mono">{pressureUnit}</span>
                </div>
                <div className="flex items-center justify-between pt-2 mt-auto">
                  <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5 select-none">
                    <Thermometer className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span>Temperatura</span>
                  </label>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)] transition-all shadow-2xs cursor-text">
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={tfStr}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9.-]/g, '');
                        if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
                        setTfStr(val);
                        setHeaderTf(parseFloat(val) || 0);
                      }}
                      onBlur={() => {
                        if (!tfStr || isNaN(parseFloat(tfStr))) {
                          setTfStr('0');
                          setHeaderTf(0);
                        }
                      }}
                      className="w-12 text-right bg-transparent font-mono font-bold text-xs text-[var(--color-text-primary)] focus:outline-none"
                    />
                    <span className="text-[11px] font-mono font-semibold text-[var(--color-text-secondary)]">°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selectores Instrumentales: Módulo de Almacenamiento y Fuente de Gas en 2 Columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              
              {/* Selector de Módulo de Almacenamiento */}
              <div className="p-4 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5" />
                      Módulo:
                    </label>
                    <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
                      {totalCapacity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} L
                    </span>
                  </div>
                  {/* Selector Jerárquico por Categorías (No muestra todo de golpe) */}
                  <div className="relative" ref={moduleDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModuleDropdownOpen(prev => !prev);
                        // Al abrir, sólo se muestran las 2 categorías inicialmente
                        setOpenModuleCategory(null);
                      }}
                      className="w-full h-9 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono text-xs focus:outline-none flex items-center justify-between hover:border-[var(--color-accent)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {activeModule?.type === 'ESTACIONARIA' ? (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] shrink-0 font-medium">
                            Estacionaria
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] shrink-0 font-medium">
                            Transporte
                          </span>
                        )}
                        <span className="truncate font-semibold">
                          {activeModule ? activeModule.name.replace(/\s*\(\d+(\.\d+)?\s*m³\)/i, '').trim() : 'Seleccionar Módulo...'}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform shrink-0 ${isModuleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isModuleDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-[#18181b] border border-[var(--color-border)] rounded-md shadow-xl overflow-hidden">
                        
                        {/* Categoría 1: Cascadas Estacionarias */}
                        <div className="border-b border-[var(--color-border)]">
                          <button
                            type="button"
                            onClick={() => setOpenModuleCategory(prev => prev === 'ESTACIONARIA' ? null : 'ESTACIONARIA')}
                            className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold bg-[#f7f6f3] dark:bg-[#27272a] hover:bg-[#eaeaea] dark:hover:bg-[#3f3f46] transition-colors text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                              <span className="text-[var(--color-text-primary)]">Cascadas Estacionarias (Planta)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[var(--color-text-secondary)] bg-white dark:bg-[#18181b] border border-[var(--color-border)] px-1.5 py-0.2 rounded font-bold">
                                {stationaryModules.length}
                              </span>
                              {openModuleCategory === 'ESTACIONARIA' ? (
                                <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                              )}
                            </div>
                          </button>

                          {openModuleCategory === 'ESTACIONARIA' && (
                            <div className="max-h-48 overflow-y-auto divide-y divide-[var(--color-border)] bg-white dark:bg-[#18181b]">
                              {stationaryModules.length === 0 ? (
                                <div className="px-4 py-2 text-[11px] text-[var(--color-text-secondary)] italic bg-white dark:bg-[#18181b]">
                                  No hay cascadas estacionarias registradas
                                </div>
                              ) : (
                                stationaryModules.map(m => {
                                  const isSelected = m.id === selectedModuleId;
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedModuleId(m.id);
                                        setIsModuleDropdownOpen(false);
                                        setOpenModuleCategory(null);
                                      }}
                                      className={`w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono transition-colors text-left cursor-pointer ${
                                        isSelected 
                                          ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold' 
                                          : 'bg-white dark:bg-[#18181b] text-[var(--color-text-primary)] hover:bg-[#f9f9f8] dark:hover:bg-[#27272a]'
                                      }`}
                                    >
                                      <span className="truncate">{m.name.replace(/\s*\(\d+(\.\d+)?\s*m³\)/i, '').trim()}</span>
                                      <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)] shrink-0 ml-2">
                                        <span>{m.totalCapacityLiters.toLocaleString()} L</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--color-accent)]" />}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>

                        {/* Categoría 2: Módulos de Transporte */}
                        <div>
                          <button
                            type="button"
                            onClick={() => setOpenModuleCategory(prev => prev === 'TRANSPORTE' ? null : 'TRANSPORTE')}
                            className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-semibold bg-[#f7f6f3] dark:bg-[#27272a] hover:bg-[#eaeaea] dark:hover:bg-[#3f3f46] transition-colors text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Truck className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                              <span className="text-[var(--color-text-primary)]">Módulos de Transporte (Carretera)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[var(--color-text-secondary)] bg-white dark:bg-[#18181b] border border-[var(--color-border)] px-1.5 py-0.2 rounded font-bold">
                                {transportModules.length}
                              </span>
                              {openModuleCategory === 'TRANSPORTE' ? (
                                <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                              )}
                            </div>
                          </button>

                          {openModuleCategory === 'TRANSPORTE' && (
                            <div className="max-h-48 overflow-y-auto divide-y divide-[var(--color-border)] bg-white dark:bg-[#18181b]">
                              {transportModules.length === 0 ? (
                                <div className="px-4 py-2 text-[11px] text-[var(--color-text-secondary)] italic bg-white dark:bg-[#18181b]">
                                  No hay módulos de transporte registrados
                                </div>
                              ) : (
                                transportModules.map(m => {
                                  const isSelected = m.id === selectedModuleId;
                                  return (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedModuleId(m.id);
                                        setIsModuleDropdownOpen(false);
                                        setOpenModuleCategory(null);
                                      }}
                                      className={`w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono transition-colors text-left cursor-pointer ${
                                        isSelected 
                                          ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold' 
                                          : 'bg-white dark:bg-[#18181b] text-[var(--color-text-primary)] hover:bg-[#f9f9f8] dark:hover:bg-[#27272a]'
                                      }`}
                                    >
                                      <span className="truncate">{m.name.replace(/\s*\(\d+(\.\d+)?\s*m³\)/i, '').trim()}</span>
                                      <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)] shrink-0 ml-2">
                                        <span>{m.totalCapacityLiters.toLocaleString()} L</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--color-accent)]" />}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border)]">
                  <span>{totalCylindersCount} {activeModule?.type === 'TRANSPORTE' ? 'tubos jumbo' : 'cilindros'}</span>
                  <span>{capacityPerCylinder.toFixed(0)} L por unidad</span>
                </div>
              </div>

              {/* Selector de Fuente de Gas (Cromatografía) */}
              <div className="p-4 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                      Fuente de Gas:
                    </label>
                    <span className="font-mono text-xs font-bold text-[var(--color-accent)]">
                      CH₄: {activeGas.methanePercentage ? `${activeGas.methanePercentage.toFixed(2)}%` : '96.37%'}
                    </span>
                  </div>
                  <select
                    value={selectedGasProfileId}
                    onChange={(e) => setSelectedGasProfileId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono text-xs focus:outline-none cursor-pointer"
                  >
                    {gasProfiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border)]">
                  <span>Gr: {activeGas.specificGravity ? activeGas.specificGravity.toFixed(4) : '0.5756'}</span>
                  <span>{activeGas.grossCalorificValue ? `${activeGas.grossCalorificValue.toFixed(0)} kcal/m³` : '8,884 kcal/m³'}</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* TARJETA 2: Balance de Entrega y Aforo (Panel Ejecutivo de Salida) */}
        <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 p-4 sm:p-6 lg:p-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between space-y-6 shadow-none">
          
          <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Balance de Entrega y Aforo
              </span>
            </div>

            {/* Carga Neta Normalizada */}
            <div className="p-4 sm:p-6 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] shadow-none">
              <span className="text-xs font-mono text-[var(--color-text-secondary)] uppercase tracking-widest block mb-3 sm:mb-4">
                Volumen Transferido
              </span>
              <div className="flex items-baseline gap-2 sm:gap-3 mt-1 border-b border-[var(--color-border)] pb-3 sm:pb-4 mb-3 sm:mb-4">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-sans font-semibold text-[var(--color-text-primary)] tracking-tight">
                  {Math.abs(totalVolume_Sm3).toFixed(2)}
                </span>
                <span className="text-base sm:text-lg font-mono text-[var(--color-text-secondary)]">Sm³</span>
              </div>
              <div className="text-xs sm:text-sm font-mono text-[var(--color-text-secondary)]">
                Masa Neta: <strong className="text-[var(--color-text-primary)] font-bold text-sm sm:text-base">{Math.abs(totalMass_kg).toFixed(2)} kg</strong>
              </div>
            </div>

            {/* Indicador Compacto de Presión en Reposo */}
            <div className={`px-4 py-3 rounded-lg border transition-all text-xs flex items-center justify-between gap-3 shadow-none ${
              hasZeroPressures
                ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                : isAforoConforme
                ? 'bg-[var(--color-alert-green-bg)] border-[var(--color-alert-green-border)] text-[var(--color-alert-green-text)]'
                : 'bg-[var(--color-alert-yellow-bg)] border-[var(--color-alert-yellow-border)] text-[var(--color-alert-yellow-text)]'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                {hasZeroPressures ? (
                  <Gauge className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" />
                ) : isAforoConforme ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <div className="flex items-baseline gap-1.5 truncate">
                  <span className="font-semibold text-xs">
                    {hasZeroPressures ? 'Presión en Reposo:' : 'Presión en Reposo (20°C):'}
                  </span>
                  <span className="font-mono font-bold text-xs">
                    {hasZeroPressures ? '—' : `${avgStabilizedPressureBar.toFixed(1)} bar`}
                  </span>
                </div>
              </div>

              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                hasZeroPressures
                  ? 'border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-text-secondary)]'
                  : isAforoConforme
                  ? 'border-[var(--color-alert-green-border)] bg-[var(--color-alert-green-bg)] text-[var(--color-alert-green-text)]'
                  : 'border-[var(--color-alert-yellow-border)] bg-[var(--color-alert-yellow-bg)] text-[var(--color-alert-yellow-text)]'
              }`}>
                {hasZeroPressures
                  ? 'En Espera'
                  : isAforoConforme
                  ? 'Conforme (≥ 230 bar)'
                  : 'Bajo Piso (< 230 bar)'}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Botón de Asentamiento en Cuenta de Balance */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={activeCount === 0 || isSaving || hasZeroPressures}
          className={`w-full py-4 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
            isSavedFeedback
              ? 'bg-emerald-600 text-white'
              : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white disabled:opacity-40 cursor-pointer shadow-xs'
          }`}
        >
          {isSaving ? (
            <span>Asentando en Cuenta de Balance...</span>
          ) : isSavedFeedback ? (
            <>
              <Check className="w-5 h-5 stroke-[2.5px]" />
              <span>Operación Asentada Exitosamente</span>
            </>
          ) : (
            <>
              <span>Asentar Operación en Cuenta de Balance</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Monitoreo de Cilindros y Ajuste Operativo */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 shadow-none mt-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
              Monitoreo de Cilindros ({activeCount}/{totalCylindersCount} Activos)
            </span>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
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
          <div 
            className="grid gap-3" 
            style={{ gridTemplateColumns: `repeat(auto-fit, minmax(75px, 1fr))` }}
          >
            {positions.map((p) => {
              const deltaP = p.pf - p.pi;
              return (
                <div
                  key={p.id}
                  onClick={() => togglePositionActive(p.id)}
                  className={`p-3 rounded-md border text-center transition-all duration-200 cursor-pointer flex flex-col justify-between hover:scale-[1.03] active:scale-[0.98] ${
                    p.active
                      ? 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:shadow-xs'
                      : 'bg-[var(--color-canvas)] border-[var(--color-border)] opacity-40 line-through'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold ${
                    p.active ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'
                  }`}>
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
                            type="text"
                            inputMode="decimal"
                            disabled={!pos.active}
                            value={pos.pi}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9.]/g, '');
                              if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
                              updateIndividualPosition(pos.id, 'pi', parseFloat(val) || 0);
                            }}
                            className="w-20 h-7 px-2 rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={!pos.active}
                            value={pos.pf}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9.]/g, '');
                              if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
                              updateIndividualPosition(pos.id, 'pf', parseFloat(val) || 0);
                            }}
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

