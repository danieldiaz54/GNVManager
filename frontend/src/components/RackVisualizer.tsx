// Visualizador Topológico de Baterías de Cilindros (11 y 12 Cilindros)
// Diseñado por: @impeccable-designer (Modo Operate)

export type RackConfigType = 'ELEVEN_CYLINDER_13497L' | 'TWELVE_CYLINDER_26950L';

interface RackVisualizerProps {
  selectedType: RackConfigType;
  onSelectType: (type: RackConfigType) => void;
  activePressureBar: number;
}

export function RackVisualizer({
  selectedType,
  onSelectType,
  activePressureBar,
}: RackVisualizerProps) {
  const isEleven = selectedType === 'ELEVEN_CYLINDER_13497L';
  const cylinderCount = isEleven ? 11 : 12;
  const nominalVolume = isEleven ? 13497 : 26950;
  const cylinderUnitVolume = (nominalVolume / cylinderCount).toFixed(1);

  const isOptimal = activePressureBar >= 230.0;

  return (
    <div className="bg-industrial-900 border border-industrial-800 rounded-md p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Topología de Activos (Módulo / Canasta)</h2>
          <p className="text-xs text-industrial-400">Esquema físico de conexión en manifold</p>
        </div>

        {/* Selector de Configuración de Rack */}
        <div className="flex bg-industrial-950 p-1 rounded border border-industrial-800 space-x-1">
          <button
            type="button"
            onClick={() => onSelectType('ELEVEN_CYLINDER_13497L')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              isEleven
                ? 'bg-industrial-800 text-slate-100 font-semibold shadow-inner'
                : 'text-industrial-400 hover:text-slate-200'
            }`}
          >
            11 Cilindros (13,497 L)
          </button>
          <button
            type="button"
            onClick={() => onSelectType('TWELVE_CYLINDER_26950L')}
            className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              !isEleven
                ? 'bg-industrial-800 text-slate-100 font-semibold shadow-inner'
                : 'text-industrial-400 hover:text-slate-200'
            }`}
          >
            12 Cilindros (26,950 L)
          </button>
        </div>
      </div>

      {/* Representación gráfica física de la batería */}
      <div className="bg-industrial-950 border border-industrial-800/80 rounded p-4 mb-4">
        <div className="flex items-center justify-between text-[11px] font-mono text-industrial-500 mb-2 border-b border-industrial-800/60 pb-1">
          <span>MANIFOLD DE DISTRIBUCIÓN</span>
          <span className={isOptimal ? 'text-emerald-400' : 'text-amber-400'}>
            Presión Común: {activePressureBar.toFixed(1)} bar
          </span>
        </div>

        <div className={`grid ${isEleven ? 'grid-cols-4 md:grid-cols-6' : 'grid-cols-4 md:grid-cols-6'} gap-2.5 py-2`}>
          {Array.from({ length: cylinderCount }).map((_, index) => (
            <div
              key={index}
              className="bg-industrial-900 border border-industrial-800 rounded p-2.5 flex flex-col items-center justify-center hover:border-industrial-700 transition-colors"
            >
              {/* Cilindro en SVG */}
              <svg viewBox="0 0 28 60" className="w-7 h-14 mb-1.5">
                <rect
                  x="4"
                  y="8"
                  width="20"
                  height="46"
                  rx="4"
                  fill="#1a1d27"
                  stroke={isOptimal ? '#10b981' : '#f59e0b'}
                  strokeWidth="1.5"
                />
                <circle cx="14" cy="6" r="3" fill="#353a4c" />
                <line x1="14" y1="2" x2="14" y2="4" stroke="#717b9b" strokeWidth="2" />
              </svg>
              <span className="text-[10px] font-mono text-slate-300 font-semibold">
                CIL-{(index + 1).toString().padStart(2, '0')}
              </span>
              <span className="text-[9px] font-mono text-industrial-500">
                {cylinderUnitVolume} L
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas nominales del módulo */}
      <div className="grid grid-cols-3 gap-3 text-xs font-mono bg-industrial-950/60 p-3 rounded border border-industrial-800">
        <div>
          <span className="text-industrial-500 block text-[10px]">VOLUMEN NOMINAL</span>
          <span className="text-slate-200 font-bold">{nominalVolume.toLocaleString()} L</span>
        </div>
        <div>
          <span className="text-industrial-500 block text-[10px]">CANTIDAD CILINDROS</span>
          <span className="text-slate-200 font-bold">{cylinderCount} Unidades</span>
        </div>
        <div>
          <span className="text-industrial-500 block text-[10px]">P. TRABAJO MAX</span>
          <span className="text-slate-200 font-bold">250.0 bar</span>
        </div>
      </div>
    </div>
  );
}
