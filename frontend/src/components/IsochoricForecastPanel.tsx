// Panel de Simulación y Certificación Isocórica de Aforo
// Diseñado por: @impeccable-designer (Modo Operate)

import { useState } from 'react';
import { thermoApi, IsochoricForecastResponse, AforoCertificationResponse } from '../services/thermoApi';

interface IsochoricForecastPanelProps {
  volumeLiters: number;
  onPressureCalculated?: (pressureBar: number) => void;
}

export function IsochoricForecastPanel({
  volumeLiters,
  onPressureCalculated,
}: IsochoricForecastPanelProps) {
  const [cutoffPressure, setCutoffPressure] = useState<number>(248.0);
  const [cutoffTempC, setCutoffTempC] = useState<number>(55.0); // Calentamiento compresivo
  const [ambientTempC, setAmbientTempC] = useState<number>(28.0);
  const [chromatography, setChromatography] = useState<string>('Bonga-Mamey');

  const [loading, setLoading] = useState<boolean>(false);
  const [forecast, setForecast] = useState<IsochoricForecastResponse | null>(null);
  const [certification, setCertification] = useState<AforoCertificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setErrorMessage(null);

    const cutoffK = cutoffTempC + 273.15;
    const ambientK = ambientTempC + 273.15;

    try {
      // 1. Pronóstico isocórico
      const result = await thermoApi.forecastIsochoricDecay({
        cutoffPressureBar: cutoffPressure,
        cutoffTemperatureK: cutoffK,
        ambientTemperatureK: ambientK,
        geometricVolumeLiters: volumeLiters,
        chromatography,
        coolingTimeSeconds: 7200,
      });

      setForecast(result);
      if (onPressureCalculated) {
        onPressureCalculated(result.stabilizedPressureBar);
      }

      // 2. Certificación oficial de aforo en Sabanas
      const cert = await thermoApi.certifyAforoSabanas({
        stabilizedPressureBar: result.stabilizedPressureBar,
        stationId: 'ST-SABANAS',
      });
      setCertification(cert);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al consultar API';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-industrial-900 border border-industrial-800 rounded-md p-5 flex flex-col justify-between shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-100">Pronóstico Isocórico y Aforo Regulatorio</h2>
        <p className="text-xs text-industrial-400">
          Cálculo del enfriamiento post-corte a volumen constante y validación del piso normativo (230 bar)
        </p>
      </div>

      {/* Formulario de parámetros operativos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div>
          <label className="block text-[11px] font-mono text-industrial-400 mb-1">
            P. CORTE (bar)
          </label>
          <input
            type="number"
            step="0.5"
            value={cutoffPressure}
            onChange={(e) => setCutoffPressure(parseFloat(e.target.value) || 0)}
            className="w-full bg-industrial-950 border border-industrial-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-industrial-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-industrial-400 mb-1">
            T. CORTE (°C)
          </label>
          <input
            type="number"
            step="1"
            value={cutoffTempC}
            onChange={(e) => setCutoffTempC(parseFloat(e.target.value) || 0)}
            className="w-full bg-industrial-950 border border-industrial-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-industrial-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-industrial-400 mb-1">
            T. AMBIENTE (°C)
          </label>
          <input
            type="number"
            step="1"
            value={ambientTempC}
            onChange={(e) => setAmbientTempC(parseFloat(e.target.value) || 0)}
            className="w-full bg-industrial-950 border border-industrial-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-industrial-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-industrial-400 mb-1">
            CROMATOGRAFÍA
          </label>
          <select
            value={chromatography}
            onChange={(e) => setChromatography(e.target.value)}
            className="w-full bg-industrial-950 border border-industrial-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-industrial-500"
          >
            <option value="Bonga-Mamey">Bonga-Mamey (96.37% CH4)</option>
            <option value="Candilejas">Candilejas (99.17% CH4)</option>
            <option value="Gas Rico Llano">Gas Rico Llano (86.50% CH4)</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleSimulate}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-semibold text-xs py-2 rounded transition-colors uppercase tracking-wider font-mono mb-4"
      >
        {loading ? 'Calculando Ecuación de Estado...' : 'Simular Estabilización Térmica y Certificar'}
      </button>

      {errorMessage && (
        <div className="p-3 mb-4 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
          {errorMessage}
        </div>
      )}

      {/* Resultados de Pronóstico y Certificación */}
      {forecast && certification && (
        <div className="space-y-3">
          {/* Badge Oficial de Certificación */}
          <div
            className={`p-3.5 rounded border flex items-center justify-between font-mono ${
              certification.isCertified
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div>
              <span className="text-xs uppercase font-bold tracking-wider block">
                {certification.isCertified
                  ? 'AFORO CERTIFICADO (SABANAS)'
                  : 'RECHAZADO POR SUBPRESIÓN'}
              </span>
              <span className="text-[11px] opacity-90 block">
                {certification.rejectionReason || 'Cumple con el piso operacional de reposo ≥ 230.00 bar.'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold block">
                {forecast.stabilizedPressureBar.toFixed(2)} bar
              </span>
              <span className="text-[10px] opacity-80 block">
                Caída: -{forecast.pressureDropBar.toFixed(2)} bar
              </span>
            </div>
          </div>

          {/* Cuadrícula de Métricas Físicas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-industrial-950 p-3 rounded border border-industrial-800 text-xs font-mono">
            <div>
              <span className="text-industrial-500 block text-[10px]">MASA FÍSICA</span>
              <span className="text-slate-100 font-bold">{forecast.massKg.toFixed(2)} kg</span>
            </div>
            <div>
              <span className="text-industrial-500 block text-[10px]">VOL. ESTÁNDAR</span>
              <span className="text-slate-100 font-bold">{forecast.standardVolumeSm3.toFixed(2)} Sm³</span>
            </div>
            <div>
              <span className="text-industrial-500 block text-[10px]">FACTOR Z ESTAB.</span>
              <span className="text-slate-100 font-bold">{forecast.stabilizedZFactor.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-industrial-500 block text-[10px]">T. REPOSO</span>
              <span className="text-slate-100 font-bold">{(forecast.stabilizedTemperatureK - 273.15).toFixed(1)} °C</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
