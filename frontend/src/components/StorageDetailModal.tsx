import React, { useEffect } from 'react';
import { X, Building2, Truck, Edit2, Trash2, Box, Calendar } from 'lucide-react';
import { StorageModuleDTO } from '../core/api/storage.service';

interface StorageDetailModalProps {
  module: StorageModuleDTO | null;
  onClose: () => void;
  onEdit: (module: StorageModuleDTO) => void;
  onDelete: (id: string) => void;
}

export default function StorageDetailModal({
  module,
  onClose,
  onEdit,
  onDelete
}: StorageDetailModalProps) {
  // Cierre con la tecla Escape
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop con desenfoque suave */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Cuadro de diálogo del Modal (Responsive con max-h y scroll interno) */}
      <div className="relative w-full max-w-xl max-h-[92vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden flex flex-col font-sans animate-scale-in">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-canvas)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-md border bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-border)] shrink-0">
              {isStationary ? <Building2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-sans font-semibold text-[var(--color-text-primary)] tracking-tight truncate">
                  {module.name}
                </h3>
              </div>
              <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs mt-0.5 border bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-border)]">
                {isStationary ? 'Cascada Estacionaria' : 'Módulo de Transporte'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer shrink-0"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo: Ficha Técnica Completa con Scroll Interno Suave */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
          
          {/* Métrica Principal: Capacidad Geométrica */}
          <div className="p-4 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] flex items-baseline justify-between font-mono">
            <div>
              <span className="text-[11px] text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Capacidad Geométrica Total
              </span>
              <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                {module.totalCapacityLiters.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-[var(--color-text-secondary)] block">Volumen</span>
              <span className="text-base font-bold text-[var(--color-text-primary)]">
                {volumeM3} m³
              </span>
            </div>
          </div>

          {/* Desglose de Geometría */}
          <div className="grid grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-3 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)]">
              <span className="text-[10px] uppercase text-[var(--color-text-secondary)] block mb-1">
                Tubos / Cilindros
              </span>
              <span className="text-base font-bold text-[var(--color-text-primary)]">
                {module.cylinderCount} <span className="text-xs font-normal text-[var(--color-text-secondary)]">unidades</span>
              </span>
            </div>

            <div className="p-3 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)]">
              <span className="text-[10px] uppercase text-[var(--color-text-secondary)] block mb-1">
                Capacidad por Cilindro
              </span>
              <span className="text-base font-bold text-[var(--color-text-primary)]">
                {module.cylinderCapacityLiters.toFixed(1)} <span className="text-xs font-normal text-[var(--color-text-secondary)]">Litros</span>
              </span>
            </div>
          </div>

          {/* Esquema Visual Miniatura de Cilindros */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-mono text-[var(--color-text-secondary)] uppercase tracking-wider">
                Distribución en Manifold ({module.cylinderCount} posiciones)
              </span>
            </div>
            <div 
              className="grid gap-1.5 p-3 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] max-h-40 overflow-y-auto"
              style={{ gridTemplateColumns: `repeat(auto-fit, minmax(42px, 1fr))` }}
            >
              {Array.from({ length: module.cylinderCount }, (_, i) => (
                <div 
                  key={i} 
                  className="h-10 rounded border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col items-center justify-center text-[10px] font-mono text-[var(--color-text-secondary)] font-bold shadow-2xs"
                >
                  <span className="text-[9px] opacity-60">P</span>
                  <span>{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Metadatos */}
          <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] font-mono text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {module.createdAt ? new Date(module.createdAt).toLocaleDateString() : 'Estándar'}
            </span>
            <span className="opacity-70 truncate max-w-[150px]">
              ID: {module.id.slice(0, 8)}...
            </span>
          </div>

        </div>

        {/* Pie del Modal con Acciones */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-canvas)] border-t border-[var(--color-border)] shrink-0">
          <button
            onClick={() => onDelete(module.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-alert-red-text)] hover:bg-[var(--color-alert-red-bg)] border border-transparent hover:border-[var(--color-alert-red-border)] rounded transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-[var(--color-text-primary)] text-[var(--color-canvas)] hover:opacity-90 rounded cursor-pointer transition-opacity"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar Módulo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
