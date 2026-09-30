// Consola Operativa Principal de Estación (Hito 1 - Sabanas)
// Diseñado por: @impeccable-designer según estándares de Impeccable (Modo Operate)

import { useState } from 'react';
import { ManometerGauge } from './ManometerGauge';
import { RackVisualizer, RackConfigType } from './RackVisualizer';
import { IsochoricForecastPanel } from './IsochoricForecastPanel';

export function StationConsole() {
  const [rackType, setRackType] = useState<RackConfigType>('ELEVEN_CYLINDER_13497L');
  const [activePressure, setActivePressure] = useState<number>(231.45);

  const nominalVolume = rackType === 'ELEVEN_CYLINDER_13497L' ? 13497 : 26950;

  return (
    <div className="space-y-6">
      {/* Barra de Contexto y Telemetría de Estación */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-md px-5 py-3 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-200 font-bold">ESTACIÓN SABANAS (ST-SABANAS)</span>
          </div>
          <span className="text-industrial-500">|</span>
          <span className="text-industrial-400">ISLA DE DESPACHO #01</span>
          <span className="text-industrial-500">|</span>
          <span className="text-industrial-400">MANIFOLD B-02</span>
        </div>

        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          <span className="text-industrial-400">PISO DE AFORO OBLIGATORIO:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
            ≥ 230.00 bar
          </span>
        </div>
      </div>

      {/* Grid Principal: Manómetro y Topología de Rack */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ManometerGauge
            pressureBar={activePressure}
            label="Presión en Cabeza de Manifold"
            thresholdBar={230.0}
            maxPressureBar={300.0}
          />
        </div>

        <div className="lg:col-span-2">
          <RackVisualizer
            selectedType={rackType}
            onSelectType={setRackType}
            activePressureBar={activePressure}
          />
        </div>
      </div>

      {/* Panel de Pronóstico Isocórico y Certificación de Aforo */}
      <div>
        <IsochoricForecastPanel
          volumeLiters={nominalVolume}
          onPressureCalculated={(newP) => setActivePressure(newP)}
        />
      </div>
    </div>
  );
}
