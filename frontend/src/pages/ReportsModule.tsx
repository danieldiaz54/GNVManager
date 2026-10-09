import { Construction } from 'lucide-react';

export default function ReportsModule() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] bg-transparent p-8">
      <div className="ui-card flex flex-col items-center text-center max-w-2xl border border-[var(--color-border)] shadow-none">
        <div className="bg-[var(--color-surface)] p-4 rounded-md mb-6 border border-[var(--color-border)]">
          <Construction className="w-12 h-12 text-[var(--color-text-primary)] stroke-[1.5px]" />
        </div>
        <h2 className="text-3xl font-sans font-semibold tracking-tight mb-3 text-[var(--color-text-primary)]">
          Módulo en Construcción
        </h2>
        <p className="text-base text-[var(--color-text-secondary)]">
          El sistema de reportes de auditoría y análisis de tendencias estará disponible en la próxima actualización.
        </p>
      </div>
    </div>
  );
}
