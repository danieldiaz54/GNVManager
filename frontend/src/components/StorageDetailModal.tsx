import React, { useEffect } from 'react';
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
  Layers,
  CheckCircle2,
  Info
} from 'lucide-react';
import { StorageModuleDTO } from '../core/api/storage.service';

interface StorageDetailModalProps {
  module: StorageModuleDTO | null;
  onClose: () => void;
  onEdit: (module: StorageModuleDTO) => void;
  onDelete: (id: string, name: string) => void;
}

export default function StorageDetailModal({
  module,
  onClose,
  onEdit,
  onDelete
}: StorageDetailModalProps) {

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
      {/* Fondo sólido opaco sin transparencias difusas */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity" 
        onClick={onClose} 
      />

      {/* Contenedor Widescreen de Grado Industrial (Aprovechamiento Horizontal Total) */}
      <div className="relative w-full max-w-5xl xl:max-w-6xl max-h-[92vh] bg-white dark:bg-[#18181b] border border-[var(--color-border)] rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans animate-scale-in">
        
        {/* 1. Cabecera Industrial Widescreen */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-canvas)] gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 rounded-md border bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-border)] shrink-0">
              {isStationary ? <Building2 className="w-5 h-5 stroke-[2px]" /> : <Truck className="w-5 h-5 stroke-[2px]" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base sm:text-lg lg:text-xl font-sans font-semibold text-[var(--color-text-primary)] tracking-tight truncate">
                  {module.name}
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs border bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-border)] shrink-0">
                  {isStationary ? 'Cascada Estacionaria' : 'Módulo de Transporte Vial'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {module.manufacturingStandard && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs border bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]">
                    Norma {module.manufacturingStandard}
                  </span>
                )}
                {module.certificationAgency && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs border bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]">
                    Certificación {module.certificationAgency}
                  </span>
                )}
                <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">
                  {module.cylinderCount} tubos conectados × {module.cylinderCapacityLiters.toFixed(1)} L
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => onEdit(module)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded cursor-pointer transition-colors shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Franja de Métricas Principales (6 Columnas en Desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3 sm:p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] font-mono shrink-0">
          <div className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Volumen Agua</span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">{volumeM3} m³</span>
          </div>
          <div className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Capacidad Geométrica</span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">{module.totalCapacityLiters.toLocaleString()} L</span>
          </div>
          <div className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Presión Trabajo</span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-accent)]">{module.workingPressureBar || 250} bar</span>
          </div>
          <div className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Tubos Activos</span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">{module.cylinderCount} unid.</span>
          </div>
          <div className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Tara Vacío</span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
              {module.tareWeightKg ? `${module.tareWeightKg.toLocaleString()} kg` : 'Estándar'}
            </span>
          </div>
          <div className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
            <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">Carga Máx GNV</span>
            <span className="text-sm sm:text-base font-bold text-[var(--color-accent)]">
              {module.maxPayloadKg ? `${module.maxPayloadKg.toLocaleString()} kg` : 'Estándar'}
            </span>
          </div>
        </div>

        {/* 3. Panel Widescreen de Ingeniería: 2 Grandes Columnas Balanceadas */}
        <div className="p-4 sm:p-5 lg:p-6 overflow-y-auto flex-1 font-mono text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
            
            {/* COLUMNA IZQUIERDA: Operación y Mecánica */}
            <div className="space-y-5">
              
              {/* Sección A: Operación y Seguridad */}
              <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] overflow-hidden shadow-2xs">
                <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-canvas)] border-b border-[var(--color-border)]">
                  <Gauge className="w-4 h-4 text-[var(--color-accent)]" />
                  <h3 className="font-sans font-semibold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                    Operación y Límites de Seguridad
                  </h3>
                </div>
                
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
                    <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                      Presión Nominal Trabajo (PW)
                    </span>
                    <span className="text-base font-bold text-[var(--color-text-primary)]">
                      {module.workingPressureBar || 250} bar <span className="text-xs font-normal text-[var(--color-text-secondary)]">(25.0 MPa)</span>
                    </span>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 font-sans">
                      Límite operativo de llenado en estación.
                    </p>
                  </div>

                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
                    <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                      Presión Prueba Hidrostática (PH)
                    </span>
                    <span className="text-base font-bold text-[var(--color-text-primary)]">
                      {module.testPressureBar || 375} bar <span className="text-xs font-normal text-[var(--color-text-secondary)]">(37.5 MPa)</span>
                    </span>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 font-sans">
                      Ensayo hidráulico de fábrica.
                    </p>
                  </div>

                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
                    <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                      Presión de Alivio / Ruptura
                    </span>
                    <span className="text-base font-bold text-[var(--color-accent)]">
                      {module.safetyReliefPressureBar || (isStationary ? 273 : 375)} bar
                    </span>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 font-sans">
                      {isStationary ? 'Válvula de alivio calibrada a 273 bar.' : 'Disco de ruptura calibrado a 375 bar.'}
                    </p>
                  </div>

                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
                    <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1 flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      Rango Térmico de Operación
                    </span>
                    <span className="text-base font-bold text-[var(--color-text-primary)]">
                      {module.minOperatingTempC ?? -40} °C a {module.maxOperatingTempC ?? 60} °C
                    </span>
                    <p className="text-[10px] text-[var(--color-text-secondary)] mt-1 font-sans">
                      Tolerancia térmica por efecto Joule-Thomson.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección B: Ficha Mecánica y Metalúrgica */}
              <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] overflow-hidden shadow-2xs">
                <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-canvas)] border-b border-[var(--color-border)]">
                  <Wrench className="w-4 h-4 text-[var(--color-accent)]" />
                  <h3 className="font-sans font-semibold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                    Especificaciones Físicas y Mecánicas
                  </h3>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
                    <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                      Material Metalúrgico
                    </span>
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">
                      {module.tubeMaterial || (isStationary ? 'Acero 34CrMo4' : 'Acero aleado 4130X')}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                      Tratamiento térmico templado y revenido
                    </span>
                  </div>

                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
                    <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                      Dimensiones del Tubo
                    </span>
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">
                      φ{module.tubeOuterDiameterMm || (isStationary ? 356 : 559)} × {module.tubeLengthMm ? `${module.tubeLengthMm} mm` : 'Estándar'}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                      Diámetro exterior × Longitud
                    </span>
                  </div>

                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
                    <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                      Configuración de Boquillas
                    </span>
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">
                      {module.plugConfiguration === 'DOUBLE_PLUG' ? 'Doble Tapón (Double Plug)' : 'Tapón Simple (Single Plug)'}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                      Inspección y purga en extremos
                    </span>
                  </div>

                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
                    <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                      Valvulería y Acoples
                    </span>
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">
                      {module.valveManufacturer || 'DK-Lok / Parker'}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                      Válvulas esféricas de alta presión
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* COLUMNA DERECHA: Logística y Matriz de Tubos */}
            <div className="space-y-5">
              
              {/* Sección C: Logística y Pesaje */}
              <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] overflow-hidden shadow-2xs">
                <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-canvas)] border-b border-[var(--color-border)]">
                  <Scale className="w-4 h-4 text-[var(--color-accent)]" />
                  <h3 className="font-sans font-semibold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                    Pesaje y Logística Vial
                  </h3>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
                      <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                        Peso Tara (Vacío)
                      </span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">
                        {module.tareWeightKg ? `${module.tareWeightKg.toLocaleString()} kg` : 'No asignado'}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                        Estructura sin gas
                      </span>
                    </div>

                    <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
                      <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                        Carga Máxima GNV
                      </span>
                      <span className="text-sm font-bold text-[var(--color-accent)]">
                        {module.maxPayloadKg ? `${module.maxPayloadKg.toLocaleString()} kg` : 'No asignado'}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                        Masa neta admisible
                      </span>
                    </div>

                    <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)]">
                      <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block mb-1">
                        Peso Bruto Total
                      </span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">
                        {module.grossWeightKg ? `${module.grossWeightKg.toLocaleString()} kg` : 'No asignado'}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-secondary)] block mt-0.5 font-sans">
                        Límite para báscula
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">
                        Configuración de Chasis / Montaje
                      </span>
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">
                        {module.chassisType || (isStationary ? 'Batería Estacionaria Vertical' : 'Semirremolque Triple Eje')}
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-[var(--color-text-secondary)] uppercase block">
                        Vida Útil de Diseño
                      </span>
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">
                        {module.designLifeYears || 15} años
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección D: Matriz de Distribución de Tubos */}
              <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-canvas)] border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--color-accent)]" />
                    <h3 className="font-sans font-semibold text-xs text-[var(--color-text-primary)] uppercase tracking-wider">
                      Matriz de Tubos Conectados ({module.cylinderCount} posiciones)
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--color-text-primary)] font-mono">
                    {module.cylinderCapacityLiters.toFixed(1)} L / tubo
                  </span>
                </div>

                <div className="p-4">
                  <div 
                    className="grid gap-2 p-3 rounded border border-[var(--color-border)] bg-[var(--color-canvas)] max-h-52 overflow-y-auto"
                    style={{ gridTemplateColumns: `repeat(auto-fill, minmax(64px, 1fr))` }}
                  >
                    {Array.from({ length: module.cylinderCount }, (_, i) => (
                      <div 
                        key={i} 
                        className="h-12 rounded border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center text-[10px] font-mono text-[var(--color-text-secondary)] font-bold shadow-2xs hover:border-[var(--color-accent)] transition-colors"
                      >
                        <span className="text-[8px] opacity-60">TUBO</span>
                        <span className="text-xs text-[var(--color-text-primary)]">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Trazabilidad y Metadatos */}
          <div className="pt-4 mt-5 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              Alta en sistema: {module.createdAt ? new Date(module.createdAt).toLocaleDateString() : 'Estándar'}
            </span>
            <span className="font-mono opacity-70">
              UUID: {module.id}
            </span>
          </div>
        </div>

        {/* 4. Pie de Acciones */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-canvas)] border-t border-[var(--color-border)] shrink-0">
          <button
            onClick={() => onDelete(module.id, module.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--color-alert-red-text)] hover:bg-[var(--color-alert-red-bg)] border border-transparent hover:border-[var(--color-alert-red-border)] rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Módulo</span>
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
              <span>Editar Ficha Técnica</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
