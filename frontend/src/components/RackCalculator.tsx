import React, { useState, useEffect, useMemo } from 'react';
import { thermodynamicsService, TransferResult } from '../core/api/thermodynamic.service';
import { psiToBar, celsiusToKelvin, barToPsi } from '../core/utils/UnitConversion';
import { Gauge, Thermometer, Check, ChevronDown, ChevronUp, Sliders, RotateCcw } from 'lucide-react';
import { SaveRackDTO } from '../core/api/reconciliation.service';

export interface RackPositionState {
  id: number;
  label: string;
  active: boolean;
  pi: number;
  pf: number;
  result?: TransferResult;
}

interface RackCalculatorProps {
  onSave: (rackData: SaveRackDTO) => Promise<void> | void;
  isSaving?: boolean;
}

export default function RackCalculator({ onSave, isSaving = false }: RackCalculatorProps) {
  const [pressureUnit, setPressureUnit] = useState<'bar' | 'psi'>('bar');
  const [identifier, setIdentifier] = useState('RACK-11P');
  const [totalCylinders, setTotalCylinders] = useState<11 | 12>(11);
  const [totalRackCapacity, setTotalRackCapacity] = useState<number>(13497);
  const [flowType, setFlowType] = useState<'CARGUE' | 'DESCARGUE'>('CARGUE');

  // Parámetros de cabezal común (Default para todo el rack)
  const [headerPi, setHeaderPi] = useState(50);
  const [headerPf, setHeaderPf] = useState(250);
  const [headerTi, setHeaderTi] = useState(25);
  const [headerTf, setHeaderTf] = useState(45);

  const [showPerCylinderTuning, setShowPerCylinderTuning] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Perfiles de Gas
  const [gasProfiles, setGasProfiles] = useState<{ id: string; name: string }[]>([]);
  const [selectedGasProfileId, setSelectedGasProfileId] = useState<string>('');

  useEffect(() => {
    thermodynamicsService.getGasProfiles().then(profiles => {
      if (profiles && profiles.length > 0) {
        setGasProfiles(profiles);
        setSelectedGasProfileId(profiles[0].id);
      }
    }).catch(err => console.error(err));
  }, []);

  // Posiciones del Rack
  const [positions, setPositions] = useState<RackPositionState[]>(() =>
    Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
      label: `POS-${String(i + 1).padStart(2, '0')}`,
      active: true,
      pi: 50,
      pf: 250,
    }))
  );

  useEffect(() => {
    setPositions(prev => {
      const newPositions = Array.from({ length: totalCylinders }, (_, i) => {
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
      return newPositions;
    });
    
    if (totalCylinders === 11 && totalRackCapacity === 26950) {
      setTotalRackCapacity(13497);
    } else if (totalCylinders === 12 && totalRackCapacity === 13497) {
      setTotalRackCapacity(26950);
    }
  }, [totalCylinders]);

  const activePositions = useMemo(() => positions.filter(p => p.active), [positions]);
  const activeCount = activePositions.length;
  const capacityPerCylinder = activeCount > 0 ? totalRackCapacity / activeCount : 0;

  const applyHeaderToPositions = (newPi: number, newPf: number) => {
    setPositions(prev => prev.map(p => ({
      ...p,
      pi: newPi,
      pf: newPf,
    })));
  };

  const handleFlowSwitch = (type: 'CARGUE' | 'DESCARGUE') => {
    setFlowType(type);
    if (type === 'CARGUE' && headerPi > headerPf) {
      setHeaderPi(headerPf);
      setHeaderPf(headerPi);
      applyHeaderToPositions(headerPf, headerPi);
    } else if (type === 'DESCARGUE' && headerPi < headerPf) {
      setHeaderPi(headerPf);
      setHeaderPf(headerPi);
      applyHeaderToPositions(headerPf, headerPi);
    }
  };

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
        console.error('Error calculando lote termodinámico de rack:', e);
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

  const totalMass_kg = useMemo(() => activePositions.reduce((acc, p) => acc + (p.result?.massTransferredKg || 0), 0), [activePositions]);
  const totalVolume_Sm3 = useMemo(() => activePositions.reduce((acc, p) => acc + (p.result?.volumeTransferredSm3 || 0), 0), [activePositions]);

  const deltaPressure = headerPf - headerPi;

  const togglePositionActive = (id: number) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const updateIndividualPosition = (id: number, field: keyof RackPositionState, val: any) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const resetAllToHeader = () => {
    applyHeaderToPositions(headerPi, headerPf);
  };

  const handleSave = async () => {
    if (activePositions.length === 0) {
      alert('Debes tener al menos una posición activa en el rack.');
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
        moduleCapacityLiters: totalRackCapacity,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--color-border)] gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-serif font-bold text-[var(--color-text-primary)]">
              Operación de Rack
            </h2>
            <div className="flex bg-[var(--color-canvas)] border border-[var(--color-border)] p-0.5">
              <button 
                onClick={() => setTotalCylinders(11)}
                className={`text-xs font-mono px-3 py-1 transition-colors ${totalCylinders === 11 ? 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-none' : 'text-[var(--color-text-secondary)]'}`}
              >
                11 Cilindros
              </button>
              <button 
                onClick={() => setTotalCylinders(12)}
                className={`text-xs font-mono px-3 py-1 transition-colors ${totalCylinders === 12 ? 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-none' : 'text-[var(--color-text-secondary)]'}`}
              >
                12 Cilindros
                </button>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Perfil de Gas:</span>
                <select
                  value={selectedGasProfileId}
                  onChange={(e) => setSelectedGasProfileId(e.target.value)}
                  className="h-8 px-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--color-text-primary)] cursor-pointer"
                >
                  {gasProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>{profile.name}</option>
                  ))}
                  {gasProfiles.length === 0 && (
                    <option value="" disabled>No hay perfiles</option>
                  )}
                </select>
              </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">ID Rack:</span>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-8 w-28 px-2.5 border border-[var(--color-border)] bg-transparent font-mono font-bold text-xs focus:outline-none focus:border-[var(--color-border-hover)]"
              placeholder="RACK-01"
            />
          </div>

          <div className="flex items-center gap-1 bg-[var(--color-canvas)] p-0.5 border border-[var(--color-border)] text-xs">
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
              className={`px-2.5 py-1 transition-colors ${
                pressureUnit === 'bar' ? 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-none' : 'text-[var(--color-text-secondary)]'
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
              className={`px-2.5 py-1 transition-colors ${
                pressureUnit === 'psi' ? 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-none' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              psi
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-[var(--color-border)] bg-[var(--color-surface)]">
        
        {/* Columna Izquierda: Entradas de Cabezal Común */}
        <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-[var(--color-canvas)] border border-[var(--color-border)] p-0.5">
              <button
                onClick={() => handleFlowSwitch('CARGUE')}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${flowType === 'CARGUE' ? 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-none' : 'text-[var(--color-text-secondary)]'}`}
              >
                Cargue
              </button>
              <button
                onClick={() => handleFlowSwitch('DESCARGUE')}
                className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${flowType === 'DESCARGUE' ? 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-none' : 'text-[var(--color-text-secondary)]'}`}
              >
                Descargue
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-text-secondary)] font-medium">Capacidad Total Rack:</span>
              <div className="relative">
                <input 
                  type="number"
                  value={totalRackCapacity}
                  onChange={(e) => setTotalRackCapacity(Number(e.target.value))}
                  className="w-28 h-8 px-2 pr-6 border border-[var(--color-border)] bg-transparent text-xs font-mono focus:outline-none focus:border-[var(--color-border-hover)] text-right"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-secondary)] font-mono">L</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Parámetros de Cabezal Común
              </span>
              <span className="text-xs font-mono font-medium px-2 py-1 bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)]">
                ΔP: {deltaPressure > 0 ? `+${deltaPressure.toFixed(1)}` : deltaPressure.toFixed(1)} {pressureUnit}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 p-4 border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                  1. {flowType === 'CARGUE' ? 'Remanente Inicial' : 'Lleno Inicial'}
                </span>
                
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1.5">Presión Inicial (P₁)</label>
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
                      className="w-full h-10 pl-9 pr-2 border border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-sm focus:outline-none focus:border-[var(--color-border-hover)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1.5">Temp Global (T₁)</label>
                  <div className="relative">
                    <Thermometer className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      step="0.5"
                      value={headerTi}
                      onChange={(e) => setHeaderTi(Number(e.target.value))}
                      className="w-full h-10 pl-9 pr-2 border border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-sm focus:outline-none focus:border-[var(--color-border-hover)] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 border border-[var(--color-border)] bg-[var(--color-surface)]">
                <span className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider block">
                  2. {flowType === 'CARGUE' ? 'Corte Final' : 'Remanente Final'}
                </span>

                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1.5">Presión Final (P₂)</label>
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
                      className="w-full h-10 pl-9 pr-2 border border-[var(--color-accent)] bg-[var(--color-surface)] font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1.5">Temp Global (T₂)</label>
                  <div className="relative">
                    <Thermometer className="w-4 h-4 text-[var(--color-text-primary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="number"
                      step="0.5"
                      value={headerTf}
                      onChange={(e) => setHeaderTf(Number(e.target.value))}
                      className="w-full h-10 pl-9 pr-2 border border-[var(--color-accent)] bg-[var(--color-surface)] font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Cilindros Conectados ({activeCount}/{totalCylinders})
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPositions(prev => prev.map(p => ({ ...p, active: true })))}
                  className="text-[var(--color-text-primary)] font-medium hover:underline"
                >
                  Activar Todos
                </button>
                <span className="text-[var(--color-border)]">|</span>
                <button
                  type="button"
                  onClick={() => setPositions(prev => prev.map(p => ({ ...p, active: false })))}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)]"
                >
                  Desactivar
                </button>
              </div>
            </div>

            <div className={`grid gap-2 ${totalCylinders === 12 ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-4 sm:grid-cols-6'}`}>
              {positions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePositionActive(p.id)}
                  className={`py-2 px-1 text-xs font-mono border transition-colors text-center ${
                    p.active
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-canvas)] border-[var(--color-border)] text-[var(--color-text-secondary)] line-through'
                  }`}
                >
                  #{p.id}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Columna Derecha: Consolidado */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between bg-[var(--color-canvas)]">
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Consolidado Total
              </span>
              <span className="text-xs font-mono text-[var(--color-text-primary)] font-semibold px-2 py-0.5 bg-[var(--color-surface)] border border-[var(--color-border)]">
                {identifier}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Suma simultánea de las {activeCount} posiciones
            </p>

            <div className="mt-8 space-y-4">
              
              <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)]">
                <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase tracking-wider">Volumen Transferido</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-serif text-[var(--color-text-primary)] tracking-tight">
                    {Math.abs(totalVolume_Sm3).toFixed(2)}
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)] font-medium">Sm³</span>
                </div>
                <span className="text-[11px] font-mono text-[var(--color-text-secondary)] mt-3 block pt-3 border-t border-[var(--color-border)]">
                  Capacidad prorrateada: {capacityPerCylinder.toFixed(1)} L/cilindro
                </span>
              </div>

              <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)]">
                <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase tracking-wider">Masa Total</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-serif text-[var(--color-text-primary)] tracking-tight">
                    {Math.abs(totalMass_kg).toFixed(2)}
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)] font-medium">kg</span>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-8">
            <button
              type="button"
              onClick={handleSave}
              disabled={activeCount === 0 || isSaving}
              className={`w-full py-4 px-4 text-sm font-semibold border transition-colors flex items-center justify-center gap-2 ${
                isSavedFeedback
                  ? 'bg-[var(--color-surface)] border-[var(--color-accent)] text-[var(--color-text-primary)]'
                  : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white border-[var(--color-accent)] disabled:opacity-50 disabled:bg-[var(--color-surface-hover)] disabled:text-[var(--color-text-secondary)] disabled:border-[var(--color-border)]'
              }`}
            >
              {isSaving ? (
                <span>Procesando...</span>
              ) : isSavedFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Operación Registrada</span>
                </>
              ) : (
                <span>Confirmar Operación</span>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Ajuste Individual */}
      <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
        <button
          type="button"
          onClick={() => setShowPerCylinderTuning(!showPerCylinderTuning)}
          className="w-full px-6 py-4 flex items-center justify-between text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-canvas)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-[var(--color-text-secondary)]" />
            <span>Ajuste Individual de Presiones por Cilindro</span>
          </div>
          {showPerCylinderTuning ? (
            <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />
          )}
        </button>

        {showPerCylinderTuning && (
          <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-canvas)] space-y-4">
            
            <div className="flex items-center justify-between text-xs">
              <p className="text-[var(--color-text-secondary)]">
                Ajuste manual para cilindros aislados o con diferentes remanentes.
              </p>
              <button
                type="button"
                onClick={resetAllToHeader}
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar P₁ y P₂ de cabezal</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-[var(--color-border)] bg-[var(--color-surface)]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[var(--color-canvas)] text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider border-b border-[var(--color-border)]">
                  <tr>
                    <th className="py-3 px-4 border-r border-[var(--color-border)] w-12 text-center">Est</th>
                    <th className="py-3 px-4 border-r border-[var(--color-border)]">Posición</th>
                    <th className="py-3 px-4 border-r border-[var(--color-border)]">P₁ ({pressureUnit})</th>
                    <th className="py-3 px-4 border-r border-[var(--color-border)]">P₂ ({pressureUnit})</th>
                    <th className="py-3 px-4 border-r border-[var(--color-border)]">ΔP</th>
                    <th className="py-3 px-4 text-right">Volumen Sm³</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {positions.map((pos) => (
                    <tr 
                      key={pos.id} 
                      className={`hover:bg-[var(--color-canvas)] transition-colors ${
                        !pos.active ? 'opacity-40 bg-[var(--color-canvas)]' : ''
                      }`}
                    >
                      <td className="py-2 px-4 border-r border-[var(--color-border)] text-center">
                        <input
                          type="checkbox"
                          checked={pos.active}
                          onChange={() => togglePositionActive(pos.id)}
                          className="rounded-sm border-[var(--color-border)] text-[var(--color-text-primary)] focus:ring-[var(--color-accent)]"
                        />
                      </td>
                      <td className="py-2 px-4 border-r border-[var(--color-border)] text-[var(--color-text-primary)] font-medium">
                        {pos.label}
                      </td>
                      <td className="py-2 px-4 border-r border-[var(--color-border)]">
                        <input
                          type="number"
                          disabled={!pos.active}
                          value={pos.pi}
                          onChange={(e) => updateIndividualPosition(pos.id, 'pi', Number(e.target.value))}
                          className="w-20 h-8 px-2 text-xs border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-border-hover)]"
                        />
                      </td>
                      <td className="py-2 px-4 border-r border-[var(--color-border)]">
                        <input
                          type="number"
                          disabled={!pos.active}
                          value={pos.pf}
                          onChange={(e) => updateIndividualPosition(pos.id, 'pf', Number(e.target.value))}
                          className="w-20 h-8 px-2 text-xs border border-[var(--color-border)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-border-hover)]"
                        />
                      </td>
                      <td className="py-2 px-4 border-r border-[var(--color-border)] text-[var(--color-text-secondary)]">
                        {(pos.pf - pos.pi).toFixed(1)}
                      </td>
                      <td className="py-2 px-4 text-right text-[var(--color-text-primary)] font-medium">
                        {pos.active && pos.result ? `${Math.abs(pos.result.volumeTransferredSm3).toFixed(2)}` : '—'}
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


