// Manómetro Digital Industrial con Semáforo Normativo de Aforo (230 bar)
// Diseñado por: @impeccable-designer según estándares Impeccable (Modo Operate)

interface ManometerGaugeProps {
  pressureBar: number;
  label: string;
  thresholdBar?: number;
  maxPressureBar?: number;
}

export function ManometerGauge({
  pressureBar,
  label,
  thresholdBar = 230.0,
  maxPressureBar = 300.0,
}: ManometerGaugeProps) {
  const isOptimal = pressureBar >= thresholdBar;
  const isNearLimit = pressureBar > 255.0; // Margen de seguridad de trabajo
  const isLow = pressureBar < thresholdBar;

  // Cálculo del ángulo en arco de 240 grados (-120deg a +120deg)
  const clampedPressure = Math.max(0, Math.min(pressureBar, maxPressureBar));
  const ratio = clampedPressure / maxPressureBar;
  const angle = -120 + ratio * 240;

  // Posición del umbral en el arco
  const thresholdAngle = -120 + (thresholdBar / maxPressureBar) * 240;

  // Semáforo metrológico
  let statusColor = 'text-emerald-400';
  let statusBorder = 'border-emerald-500/30';
  let statusBg = 'bg-emerald-500/10';
  let statusText = 'CONFORME (≥ 230 bar)';

  if (isNearLimit) {
    statusColor = 'text-amber-400';
    statusBorder = 'border-amber-500/30';
    statusBg = 'bg-amber-500/10';
    statusText = 'ALTA PRESIÓN (> 255 bar)';
  } else if (isLow) {
    statusColor = 'text-rose-400';
    statusBorder = 'border-rose-500/30';
    statusBg = 'bg-rose-500/10';
    statusText = 'SUBPRESIÓN (< 230 bar)';
  }

  return (
    <div className="bg-industrial-900 border border-industrial-800 rounded-md p-5 flex flex-col items-center justify-between shadow-sm">
      <div className="w-full flex items-center justify-between mb-3 text-xs">
        <span className="text-industrial-400 uppercase tracking-wider font-semibold">{label}</span>
        <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold border ${statusBorder} ${statusBg} ${statusColor}`}>
          {statusText}
        </span>
      </div>

      <div className="relative w-48 h-40 flex items-center justify-center">
        <svg viewBox="0 0 200 170" className="w-full h-full overflow-visible">
          {/* Fondo del dial */}
          <path
            d="M 30 145 A 85 85 0 1 1 170 145"
            fill="none"
            stroke="#232734"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Arco de rango operativo óptimo (230 - 250 bar) */}
          <path
            d="M 30 145 A 85 85 0 1 1 170 145"
            fill="none"
            stroke="#10b981"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="356"
            strokeDashoffset={356 * (1 - ratio)}
            className="transition-all duration-300 ease-out"
          />

          {/* Marcador del piso de reposo 230 bar */}
          <line
            x1="100"
            y1="25"
            x2="100"
            y2="10"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${thresholdAngle} 100 100)`}
          />

          {/* Aguja manométrica */}
          <g transform={`rotate(${angle} 100 100)`} className="transition-transform duration-300 ease-out">
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="28"
              stroke="#f1f3f9"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="100" cy="100" r="5" fill="#f1f3f9" />
          </g>

          {/* Graduaciones numéricas en SVG */}
          <text x="35" y="160" fill="#717b9b" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">0</text>
          <text x="100" y="38" fill="#717b9b" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">150</text>
          <text x="165" y="160" fill="#717b9b" fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">300</text>
        </svg>

        {/* Lectura numérica central */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <div className="flex items-baseline space-x-1">
            <span className="font-mono text-3xl font-bold tracking-tight text-slate-100">
              {pressureBar.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-industrial-400">bar</span>
          </div>
          <span className="text-[10px] font-mono text-industrial-500">
            Piso: {thresholdBar.toFixed(1)} bar
          </span>
        </div>
      </div>

      <div className="w-full mt-3 pt-3 border-t border-industrial-800 flex justify-between text-xs font-mono text-industrial-400">
        <span>Presión Manométrica</span>
        <span className={isOptimal ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
          {isOptimal ? 'Aprobado para Tránsito' : 'Bloqueado por Subpresión'}
        </span>
      </div>
    </div>
  );
}
