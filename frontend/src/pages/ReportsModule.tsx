import { Construction } from 'lucide-react';

export default function ReportsModule() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] bg-transparent p-8">
      <div className="ui-card flex flex-col items-center text-center max-w-2xl shadow-md dark:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="bg-[var(--color-canvas)] p-4 rounded-full mb-6 border border-[var(--color-border)] shadow-[0_0_15px_var(--color-accent-glow)]">
          <Construction className="w-12 h-12 text-[var(--color-accent)] stroke-[1.5px]" />
        </div>
        <h2 className="text-3xl font-serif tracking-tight mb-3 text-[var(--color-text-primary)]">
          Módulo en Construcción
        </h2>
        <p className="text-base text-[var(--color-text-secondary)]">
          El sistema de reportes de auditoría y análisis de tendencias estará disponible en la próxima actualización.
        </p>
      </div>
    </div>
  );
}
