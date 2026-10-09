import React, { useEffect, useState } from 'react';
import { 
  X, 
  Building2, 
  Truck, 
  Edit2, 
  Trash2, 
  Gauge, 
  Scale, 
  ShieldCheck, 
  Wrench, 
  Thermometer, 
  Calendar,
  Layers
} from 'lucide-react';
import { StorageModuleDTO } from '../core/api/storage.service';

interface StorageDetailModalProps {
  module: StorageModuleDTO | null;
  onClose: () => void;
  onEdit: (module: StorageModuleDTO) => void;
  onDelete: (id: string, name: string) => void;
}

type TabType = 'OPERACION' | 'LOGISTICA' | 'MECANICA' | 'CILINDROS';

export default function StorageDetailModal({
  module,
  onClose,
  onEdit,
  onDelete
}: StorageDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('OPERACION');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!module) return null;

  const isStationary = module.type === 'ESTACIONARIA';
  const volumeM3 = (module.totalCapacityLiters / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Fondo opaco sólido sin desenfoques translúcidos */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity" 
        onClick={onClose} 
      />

      {/* Contenedor Modal de Grado Industrial */}
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#18181b] border border-[var(--color-border)] rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans animate-scale-in">
        
        {/* Cabecera Técnica */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-canvas)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-md border bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-border)] shrink-0">
              {isStationary ? <Building2 className="w-5 h-5 stroke-[2px]" /> : <Truck className="w-5 h-5 stroke-[2px]" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-sans font-semibold text-[var(--color-text-primary)] tracking-tight truncate">
                {module.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs border bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-border)]">
                  {isStationary ? 'Cascada Estacionaria' : 'Módulo de Transporte Vial'}
                </span>
                {module.manufacturingStandard && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs border bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]">
                    Norma {module.manufacturingStandard}
                  </span>
                )}
                {module.certificationAgency && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs border bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]">
                    {module.certificationAgency}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer shrink-0 ml-2"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen Métrico Principal (Fila Industrial Compacta) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] font-mono shrink-0">
          <div className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Volumen Agua</span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">{volumeM3} m³</span>
          </div>
          <div className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Capacidad</span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">{module.totalCapacityLiters.toLocaleString()} L</span>
          </div>
          <div className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">P. Trabajo</span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-accent)]">{module.workingPressureBar || 250} bar</span>
          </div>
          <div className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Tubos Activos</span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">{module.cylinderCount} unid.</span>
          </div>
        </div>

        {/* Navegación por Pestañas de Ingeniería */}
        <div className="flex border-b border-[var(--color-border)] bg-[var(--color-canvas)] px-4 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('OPERACION')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'OPERACION'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Operación y Seguridad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LOGISTICA')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'LOGISTICA'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Pesaje y Transporte</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MECANICA')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'MECANICA'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Ficha Mecánica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CILINDROS')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CILINDROS'
                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Distribución de Tubos</span>
          </button>
        </div>

        {/* Contenido Dinámico por Pestaña */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
          
          {/* PESTAÑA 1: OPERACIÓN Y SEGURIDAD */}
          {activeTab === 'OPERACION' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                    Presión Nominal de Trabajo (PW)
                  </span>
                  <span className="text-base font-bold text-[var(--color-text-primary)]">
                    {module.workingPressureBar || 250} bar <span className="text-xs font-normal text-[var(--color-text-secondary)]">(25.0 MPa)</span>
                  </span>
                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 font-sans">
                    Límite máximo recomendado para llenado y presurización de despacho.
                  </p>
                </div>

                <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                    Presión de Prueba Hidrostática (PH)
                  </span>
                  <span className="text-base font-bold text-[var(--color-text-primary)]">
                    {module.testPressureBar || 375} bar <span className="text-xs font-normal text-[var(--color-text-secondary)]">(37.5 MPa)</span>
                  </span>
                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 font-sans">
                    Presión de ensayo hidráulico quinquenal de fábrica.
                  </p>
                </div>

                <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                    Presión de Alivio / Ruptura
                  </span>
                  <span className="text-base font-bold text-[var(--color-accent)]">
                    {module.safetyReliefPressureBar || (isStationary ? 273 : 375)} bar
                  </span>
                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 font-sans">
                    {isStationary ? 'Válvula de alivio de seguridad calibrada a 273 bar.' : 'Disco de ruptura de seguridad calibrado a 375 bar.'}
                  </p>
                </div>

                <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1 flex items-center gap-1">
                    <Thermometer className="w-3 h-3" />
                    Rango Térmico de Operación
                  </span>
                  <span className="text-base font-bold text-[var(--color-text-primary)]">
                    {module.minOperatingTempC ?? -50} °C a {module.maxOperatingTempC ?? 60} °C
                  </span>
                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 font-sans">
                    Tolerancia térmica del acero ante expansión rápida por efecto Joule-Thomson.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: LOGÍSTICA Y PESAJE */}
          {activeTab === 'LOGISTICA' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                    Peso Tara (Vacío)
                  </span>
                  <span className="text-base font-bold text-[var(--color-text-primary)]">
                    {module.tareWeightKg ? `${module.tareWeightKg.toLocaleString()} kg` : 'No asignado'}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                    Estructura y manifold sin gas
                  </span>
                </div>

                <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                    Carga Máxima de GNV
                  </span>
                  <span className="text-base font-bold text-[var(--color-accent)]">
                    {module.maxPayloadKg ? `${module.maxPayloadKg.toLocaleString()} kg` : 'No asignado'}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                    Masa neta de gas comprimido
                  </span>
                </div>

                <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                    Peso Bruto Total
                  </span>
                  <span className="text-base font-bold text-[var(--color-text-primary)]">
                    {module.grossWeightKg ? `${module.grossWeightKg.toLocaleString()} kg` : 'No asignado'}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                    Límite autorizado para báscula
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">
                    Configuración de Chasis / Montaje
                  </span>
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    {module.chassisType || (isStationary ? 'Batería Estacionaria Fija' : 'Semirremolque Móvil')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">
                    Vida Útil Estimada
                  </span>
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">
                    {module.designLifeYears || 15} años
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 3: FICHA MECÁNICA */}
          {activeTab === 'MECANICA' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                    Material Metalúrgico
                  </span>
                  <span className="text-base font-bold text-[var(--color-text-primary)]">
                    {module.tubeMaterial || (isStationary ? 'Acero 34CrMo4' : 'Acero aleado 4130X')}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                    Tratamiento térmico templado y revenido
                  </span>
                </div>

                <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                    Dimensiones del Tubo Individual
                  </span>
                  <span className="text-base font-bold text-[var(--color-text-primary)]">
                    φ{module.tubeOuterDiameterMm || (isStationary ? 356 : 559)} x {module.tubeLengthMm ? `${module.tubeLengthMm} mm` : 'Estándar'}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                    Diámetro exterior x Longitud
                  </span>
                </div>

                <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                    Configuración de Boquillas
                  </span>
                  <span className="text-base font-bold text-[var(--color-text-primary)]">
                    {module.plugConfiguration === 'DOUBLE_PLUG' ? 'Doble Tapón (Double Plug)' : 'Tapón Simple (Single Plug)'}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                    Inspección y purga en ambos extremos
                  </span>
                </div>

                <div className="p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                    Fabricante de Valvulería y Acoples
                  </span>
                  <span className="text-base font-bold text-[var(--color-text-primary)]">
                    {module.valveManufacturer || 'DK-Lok / Parker'}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                    Válvulas esféricas de alta presión
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 4: DISTRIBUCIÓN DE TUBOS */}
          {activeTab === 'CILINDROS' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Matriz de Tubos Conectados ({module.cylinderCount} posiciones)
                </span>
                <span className="text-[11px] font-bold text-[var(--color-text-primary)]">
                  {module.cylinderCapacityLiters.toFixed(1)} L por tubo
                </span>
              </div>

              <div 
                className="grid gap-2 p-3.5 rounded border border-[var(--color-border)] bg-[var(--color-canvas)] max-h-56 overflow-y-auto"
                style={{ gridTemplateColumns: `repeat(auto-fit, minmax(52px, 1fr))` }}
              >
                {Array.from({ length: module.cylinderCount }, (_, i) => (
                  <div 
                    key={i} 
                    className="h-12 rounded border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center text-[10px] font-mono text-[var(--color-text-secondary)] font-bold shadow-2xs"
                  >
                    <span className="text-[8px] opacity-60">TUBO</span>
                    <span className="text-xs text-[var(--color-text-primary)]">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadatos y Trazabilidad */}
          <div className="pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Alta en sistema: {module.createdAt ? new Date(module.createdAt).toLocaleDateString() : 'Estándar'}
            </span>
            <span className="opacity-70 truncate max-w-[200px]">
              UUID: {module.id}
            </span>
          </div>

        </div>

        {/* Pie del Modal con Acciones */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-canvas)] border-t border-[var(--color-border)] shrink-0">
          <button
            onClick={() => onDelete(module.id, module.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--color-alert-red-text)] hover:bg-[var(--color-alert-red-bg)] border border-transparent hover:border-[var(--color-alert-red-border)] rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded cursor-pointer transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => onEdit(module)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded cursor-pointer transition-colors shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar Ficha
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
