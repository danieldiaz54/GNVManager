import React, { useState, useEffect, useMemo } from 'react';
import { thermodynamicsService, GasProfileDTO } from '../core/api/thermodynamic.service';
import { 
  Plus, 
  Search, 
  Check, 
  X, 
  AlertCircle, 
  Flame, 
  Edit2, 
  Trash2 
} from 'lucide-react';

export default function GasProfilesModule() {
  const [profiles, setProfiles] = useState<GasProfileDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Buscador
  const [searchQuery, setSearchQuery] = useState('');

  // Estados de Formulario
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<Omit<GasProfileDTO, 'id'>>({
    name: '',
    reportDate: '',
    reportNumber: '',
    methanePercentage: 0,
    ethanePercentage: 0,
    propanePercentage: 0,
    isoButanePercentage: 0,
    normalButanePercentage: 0,
    isoPentanePercentage: 0,
    normalPentanePercentage: 0,
    hexanesPlusPercentage: 0,
    nitrogenPercentage: 0,
    carbonDioxidePercentage: 0,
    oxygenPercentage: 0,
    grossCalorificValue: 0,
    specificGravity: 0,
    molarMass: 0,
    compressibilityFactor: 0,
    wobbeIndex: 0,
    criticalPressure: 0,
    criticalTemperature: 0
  });

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await thermodynamicsService.getGasProfiles();
      setProfiles(data);
      setError(null);
    } catch (err) {
      setError('Error al consultar las fuentes de gas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.reportNumber && p.reportNumber.toLowerCase().includes(q))
    );
  }, [profiles, searchQuery]);

  const handleCreateNew = () => {
    setFormData({
      name: '',
      reportDate: new Date().toISOString().split('T')[0],
      reportNumber: '',
      methanePercentage: 96.37,
      ethanePercentage: 2.15,
      propanePercentage: 0.45,
      isoButanePercentage: 0.08,
      normalButanePercentage: 0.12,
      isoPentanePercentage: 0.03,
      normalPentanePercentage: 0.02,
      hexanesPlusPercentage: 0.03,
      nitrogenPercentage: 0.55,
      carbonDioxidePercentage: 0.20,
      oxygenPercentage: 0,
      grossCalorificValue: 1045.2,
      specificGravity: 0.5756,
      molarMass: 16.65,
      compressibilityFactor: 0.998,
      wobbeIndex: 1377.8,
      criticalPressure: 45.99,
      criticalTemperature: 190.56
    });
    setIsCreating(true);
    setIsEditing(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (profile: GasProfileDTO) => {
    setFormData({
      name: profile.name,
      reportDate: profile.reportDate ? profile.reportDate.split('T')[0] : '',
      reportNumber: profile.reportNumber || '',
      methanePercentage: profile.methanePercentage || 0,
      ethanePercentage: profile.ethanePercentage || 0,
      propanePercentage: profile.propanePercentage || 0,
      isoButanePercentage: profile.isoButanePercentage || 0,
      normalButanePercentage: profile.normalButanePercentage || 0,
      isoPentanePercentage: profile.isoPentanePercentage || 0,
      normalPentanePercentage: profile.normalPentanePercentage || 0,
      hexanesPlusPercentage: profile.hexanesPlusPercentage || 0,
      nitrogenPercentage: profile.nitrogenPercentage || 0,
      carbonDioxidePercentage: profile.carbonDioxidePercentage || 0,
      oxygenPercentage: profile.oxygenPercentage || 0,
      grossCalorificValue: profile.grossCalorificValue || 0,
      specificGravity: profile.specificGravity || 0,
      molarMass: profile.molarMass || 0,
      compressibilityFactor: profile.compressibilityFactor || 0,
      wobbeIndex: profile.wobbeIndex || 0,
      criticalPressure: profile.criticalPressure || 0,
      criticalTemperature: profile.criticalTemperature || 0
    });
    setIsEditing(profile.id);
    setIsCreating(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la fuente de gas "${name}"?`)) return;
    try {
      await thermodynamicsService.deleteGasProfile(id);
      await fetchProfiles();
    } catch (err) {
      alert('No se pudo eliminar la fuente de gas. Puede que esté en uso en operaciones registradas.');
    }
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        await thermodynamicsService.createGasProfile(formData);
      } else if (isEditing) {
        await thermodynamicsService.updateGasProfile(isEditing, formData);
      }
      setIsCreating(false);
      setIsEditing(null);
      await fetchProfiles();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar la fuente de gas');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(null);
  };

  const InputField = ({ label, field, type = "number", step = "0.0001" }: any) => (
    <div>
      <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        step={step}
        value={formData[field as keyof typeof formData] as string | number}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          let val = e.target.value;
          if (type === 'number') {
            if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
            setFormData({ 
              ...formData, 
              [field]: val === '' ? 0 : Number(val) 
            });
          } else {
            setFormData({ 
              ...formData, 
              [field]: val 
            });
          }
        }}
        className="w-full h-9 px-3 text-xs border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[var(--color-text-primary)] rounded focus:outline-none focus:border-[var(--color-accent)]"
      />
    </div>
  );

  const renderForm = () => {
    const totalPercentage = 
      (formData.methanePercentage || 0) +
      (formData.ethanePercentage || 0) +
      (formData.propanePercentage || 0) +
      (formData.isoButanePercentage || 0) +
      (formData.normalButanePercentage || 0) +
      (formData.isoPentanePercentage || 0) +
      (formData.normalPentanePercentage || 0) +
      (formData.hexanesPlusPercentage || 0) +
      (formData.nitrogenPercentage || 0) +
      (formData.carbonDioxidePercentage || 0) +
      (formData.oxygenPercentage || 0);

    const isTotalValid = Math.abs(totalPercentage - 100) < 0.1;

    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 space-y-6 animate-fade-in shadow-xs mb-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-base font-sans font-semibold text-[var(--color-text-primary)]">
              {isCreating ? 'Registrar Nueva Fuente de Gas' : 'Editar Fuente de Gas'}
            </h3>
          </div>
          <button 
            onClick={handleCancel} 
            className="p-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 1. Trazabilidad */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-3 pb-1 border-b border-[var(--color-border)]">
              Identificación y Reporte Cromatográfico
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Nombre de la Fuente" field="name" type="text" />
              <InputField label="Fecha del Reporte" field="reportDate" type="date" />
              <InputField label="N° Reporte / Muestra" field="reportNumber" type="text" />
            </div>
          </div>

          {/* Composición Molar */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-1 border-b border-[var(--color-border)]">
              <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                Composición Molar (% mol)
              </h4>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 border rounded-sm ${
                isTotalValid 
                  ? 'bg-[var(--color-alert-green-bg)] text-[var(--color-alert-green-text)] border-[var(--color-alert-green-border)]' 
                  : 'bg-[var(--color-alert-red-bg)] text-[var(--color-alert-red-text)] border-[var(--color-alert-red-border)]'
              }`}>
                Total: {totalPercentage.toFixed(4)}%
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <InputField label="Metano (C1)" field="methanePercentage" />
              <InputField label="Etano (C2)" field="ethanePercentage" />
              <InputField label="Propano (C3)" field="propanePercentage" />
              <InputField label="i-Butano (i-C4)" field="isoButanePercentage" />
              <InputField label="n-Butano (n-C4)" field="normalButanePercentage" />
              <InputField label="i-Pentano (i-C5)" field="isoPentanePercentage" />
              <InputField label="n-Pentano (n-C5)" field="normalPentanePercentage" />
              <InputField label="Hexanos+ (C6+)" field="hexanesPlusPercentage" />
              <InputField label="Nitrógeno (N2)" field="nitrogenPercentage" />
              <InputField label="Dióxido de Carbono (CO2)" field="carbonDioxidePercentage" />
              <InputField label="Oxígeno (O2)" field="oxygenPercentage" />
            </div>
          </div>

          {/* Propiedades Termodinámicas */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-3 pb-1 border-b border-[var(--color-border)]">
              Parámetros Físicos y Termodinámicos
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <InputField label="Gravedad Específica (Gr)" field="specificGravity" />
              <InputField label="Masa Molar (g/mol)" field="molarMass" />
              <InputField label="Factor Z (estándar)" field="compressibilityFactor" />
              <InputField label="Poder Calorífico (BTU/ft³)" field="grossCalorificValue" />
              <InputField label="Índice de Wobbe" field="wobbeIndex" />
              <InputField label="Presión Crítica (bar)" field="criticalPressure" />
              <InputField label="Temp. Crítica (K)" field="criticalTemperature" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
          <button
            onClick={handleCancel}
            className="px-4 py-1.5 text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] rounded cursor-pointer transition-colors shadow-xs"
          >
            <Check className="w-4 h-4" />
            Guardar Fuente de Gas
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 animate-fade-in py-4 px-2 sm:px-4 font-sans">
      
      {/* 1. Header Widescreen con Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[var(--color-border)] gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-accent)]">
            <Flame className="w-5 h-5 text-[var(--color-accent)] stroke-[1.8px]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-sans font-semibold text-[var(--color-text-primary)] tracking-tight">
                Fuentes de Gas
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold">
                {profiles.length} Fuentes Registradas
              </span>
            </div>
          </div>
        </div>
        
        {!isCreating && !isEditing && (
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] rounded-md cursor-pointer transition-colors w-full sm:w-auto shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2px]" />
            Nueva Fuente de Gas
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[var(--color-alert-red-bg)] border border-[var(--color-alert-red-border)] text-[var(--color-alert-red-text)] rounded-md flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* 2. Formulario Inline Integrado */}
      {(isCreating || isEditing) && renderForm()}

      {/* 3. Barra de Control Widescreen: Buscador y Contador de Existencias */}
      {!isCreating && !isEditing && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Listado de Fuentes Existentes
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold">
              {filteredProfiles.length} {filteredProfiles.length === 1 ? 'fuente' : 'fuentes'}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por fuente o N° de reporte..."
              className="w-full h-8 pl-8 pr-3 text-xs border border-[var(--color-border)] bg-[var(--color-canvas)] rounded font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Listado Directo de Existencias */}
      {!isCreating && !isEditing && (
        <div>
          {loading ? (
            <div className="py-24 text-center text-[var(--color-text-secondary)] text-xs font-mono animate-pulse border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
              [ Consultando fuentes de gas... ]
            </div>
          ) : profiles.length === 0 ? (
            <div className="py-16 text-center text-[var(--color-text-secondary)] text-xs border border-dashed border-[var(--color-border)] rounded-md bg-[var(--color-canvas)] font-mono">
              No hay fuentes de gas registradas en el sistema. Haz clic en "Nueva Fuente de Gas" para registrar una.
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-16 text-center text-[var(--color-text-secondary)] text-xs border border-dashed border-[var(--color-border)] rounded-md bg-[var(--color-canvas)] font-mono space-y-2">
              <p>No se encontraron fuentes de gas coincidentes con "{searchQuery}".</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-[var(--color-accent)] font-semibold hover:underline cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xs">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-[var(--color-canvas)]/60 border-b border-[var(--color-border)] text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
                    <th className="py-3 px-5 font-bold">Fuente de Gas</th>
                    <th className="py-3 px-4 font-bold text-center">Reporte Cromatográfico</th>
                    <th className="py-3 px-4 font-bold text-right">Metano (C₁)</th>
                    <th className="py-3 px-4 font-bold text-right">Inertes (N₂ + CO₂)</th>
                    <th className="py-3 px-4 font-bold text-right">Masa Molar</th>
                    <th className="py-3 px-4 font-bold text-right">Gravedad Esp.</th>
                    <th className="py-3 px-4 font-bold text-right">Poder Calorífico</th>
                    <th className="py-3 px-5 font-bold text-center w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] font-mono">
                  {filteredProfiles.map(profile => {
                    const totalMethane = profile.methanePercentage || 0;
                    const inertes = (profile.nitrogenPercentage || 0) + (profile.carbonDioxidePercentage || 0);

                    return (
                      <tr 
                        key={profile.id} 
                        className="hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        {/* Nombre de la Fuente con Flama Azul */}
                        <td className="py-3.5 px-5 font-sans font-medium text-sm text-[var(--color-text-primary)]">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                            <span>{profile.name}</span>
                          </div>
                        </td>

                        {/* Reporte Cromatográfico */}
                        <td className="py-3.5 px-4 text-center">
                          {profile.reportDate || profile.reportNumber ? (
                            <div className="flex flex-col items-center gap-0.5">
                              {profile.reportDate && (
                                <span className="text-[11px] font-mono font-medium text-[var(--color-text-primary)]">
                                  {new Date(profile.reportDate).toLocaleDateString()}
                                </span>
                              )}
                              {profile.reportNumber && (
                                <span className="text-[10px] font-mono text-[var(--color-text-secondary)]">
                                  Muestra #{profile.reportNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-sans text-[var(--color-text-secondary)] opacity-75">
                              Composición Base
                            </span>
                          )}
                        </td>

                        {/* Metano (C1) */}
                        <td className="py-3.5 px-4 text-right font-bold text-[var(--color-text-primary)] text-sm">
                          {totalMethane.toFixed(2)}%
                        </td>

                        {/* Inertes */}
                        <td className="py-3.5 px-4 text-right text-[var(--color-text-secondary)]">
                          {inertes.toFixed(2)}%
                        </td>

                        {/* Masa Molar */}
                        <td className="py-3.5 px-4 text-right text-[var(--color-text-secondary)]">
                          {profile.molarMass ? `${profile.molarMass.toFixed(2)}` : 'N/A'}{' '}
                          <span className="text-[10px] opacity-70">g/mol</span>
                        </td>

                        {/* Gravedad Específica */}
                        <td className="py-3.5 px-4 text-right text-[var(--color-text-secondary)]">
                          {profile.specificGravity ? profile.specificGravity.toFixed(4) : 'N/A'}
                        </td>

                        {/* Poder Calorífico */}
                        <td className="py-3.5 px-4 text-right font-bold text-[var(--color-accent)] text-xs">
                          {profile.grossCalorificValue ? `${profile.grossCalorificValue.toFixed(1)} BTU` : 'N/A'}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEdit(profile)}
                              className="p-1.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-canvas)] transition-colors cursor-pointer"
                              title="Editar Fuente de Gas"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(profile.id, profile.name)}
                              className="p-1.5 rounded text-[var(--color-alert-red-text)] hover:bg-[var(--color-alert-red-bg)] transition-colors cursor-pointer"
                              title="Eliminar Fuente de Gas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
