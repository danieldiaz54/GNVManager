import React, { useState, useEffect } from 'react';
import { thermodynamicsService, GasProfileDTO } from '../core/api/thermodynamic.service';
import { Settings, Plus, Edit2, Trash2, Check, X, AlertCircle, Database } from 'lucide-react';

export default function GasProfilesModule() {
  const [profiles, setProfiles] = useState<GasProfileDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError('Error al cargar los perfiles de gas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreateNew = () => {
    setFormData({
      name: 'Nuevo Perfil',
      reportDate: new Date().toISOString().split('T')[0],
      reportNumber: 'N/A',
      methanePercentage: 96.0,
      ethanePercentage: 1.5,
      propanePercentage: 0.5,
      isoButanePercentage: 0.1,
      normalButanePercentage: 0.1,
      isoPentanePercentage: 0.05,
      normalPentanePercentage: 0.05,
      hexanesPlusPercentage: 0.05,
      nitrogenPercentage: 1.0,
      carbonDioxidePercentage: 0.65,
      oxygenPercentage: 0.0,
      grossCalorificValue: 8900.0,
      specificGravity: 0.58,
      molarMass: 16.8,
      compressibilityFactor: 0.998,
      wobbeIndex: 12000,
      criticalPressure: 45.8,
      criticalTemperature: 191.0
    });
    setIsCreating(true);
    setIsEditing(null);
  };

  const handleEdit = (profile: GasProfileDTO) => {
    setFormData({
      name: profile.name,
      reportDate: profile.reportDate ? new Date(profile.reportDate).toISOString().split('T')[0] : '',
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
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este perfil de gas?')) return;
    try {
      await thermodynamicsService.deleteGasProfile(id);
      await fetchProfiles();
    } catch (err) {
      alert('No se pudo eliminar el perfil. Puede que esté en uso.');
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
      alert(err.response?.data?.error || 'Error al guardar el perfil');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(null);
  };

  const InputField = ({ label, field, type = "number", step = "0.0001", colSpan = 1 }: any) => (
    <div className={`col-span-${colSpan}`}>
      <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        step={step}
        value={formData[field as keyof typeof formData] as string | number}
        onChange={(e) => setFormData({ 
          ...formData, 
          [field]: type === 'number' ? Number(e.target.value) : e.target.value 
        })}
        className="w-full h-10 px-3 text-sm border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-primary)]"
      />
    </div>
  );

  const renderForm = () => {
    // Calculamos el total de porcentaje para validación visual
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
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md animate-fade-in shadow-none mb-6 overflow-hidden">
        
        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-canvas)]">
          <div>
            <h3 className="text-lg font-serif font-bold text-[var(--color-text-primary)]">
              {isCreating ? 'Nuevo Reporte Cromatográfico' : 'Editar Cromatografía'}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] font-mono mt-1">
              Especificación detallada para cálculos AGA-8
            </p>
          </div>
          <button onClick={handleCancel} className="p-1.5 rounded-sm hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border border-transparent hover:border-[var(--color-border)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Trazabilidad */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-4 pb-2 border-b border-[var(--color-border)]">
              1. Trazabilidad
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Nombre Identificador" field="name" type="text" />
              <InputField label="Fecha Reporte" field="reportDate" type="date" />
              <InputField label="N° Certificado" field="reportNumber" type="text" />
            </div>
          </div>

          {/* Composición */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--color-border)]">
              <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                2. Composición Molar (% mol)
              </h4>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 border rounded-sm ${
                isTotalValid 
                  ? 'bg-[var(--color-alert-green-bg)] text-[var(--color-alert-green-text)] border-[var(--color-alert-green-border)]' 
                  : 'bg-[var(--color-alert-red-bg)] text-[var(--color-alert-red-text)] border-[var(--color-alert-red-border)]'
              }`}>
                Total: {totalPercentage.toFixed(4)}%
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

          {/* Propiedades */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider mb-4 pb-2 border-b border-[var(--color-border)]">
              3. Propiedades Físicas y Termodinámicas
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        <div className="flex justify-end gap-3 p-4 bg-[var(--color-canvas)] border-t border-[var(--color-border)]">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-md cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isTotalValid}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-[var(--color-text-primary)] text-[var(--color-canvas)] hover:opacity-90 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            <Check className="w-4 h-4" />
            Guardar Cromatografía
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in py-8 px-4">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[var(--color-border)] gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-sm">
            <Database className="w-5 h-5 stroke-[1.5px]" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[var(--color-text-primary)] tracking-tight">
              Libro de Cromatografías
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-mono mt-1">
              Repositorio maestro de perfiles de gas para cálculos AGA-8
            </p>
          </div>
        </div>
        
        {!isCreating && !isEditing && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[var(--color-text-primary)] text-[var(--color-canvas)] hover:opacity-90 rounded-md shadow-sm cursor-pointer transition-opacity"
          >
            <Plus className="w-4 h-4 stroke-[2px]" />
            Ingresar Reporte
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-[var(--color-alert-red-bg)] border border-[var(--color-alert-red-border)] text-[var(--color-alert-red-text)] rounded-md flex items-center gap-2 text-sm font-bold shadow-sm">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {(isCreating || isEditing) && renderForm()}

      {!isCreating && !isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-[var(--color-text-secondary)] text-sm font-mono animate-pulse">
              [ Cargando repositorio cromatográfico... ]
            </div>
          ) : profiles.length === 0 ? (
            <div className="col-span-full py-20 text-center text-[var(--color-text-secondary)] text-sm border-2 border-dashed border-[var(--color-border)] rounded-md bg-[var(--color-canvas)]">
              No hay cromatografías registradas en el sistema.
            </div>
          ) : (
            profiles.map(profile => {
              const totalMethane = profile.methanePercentage || 0;
              const inertes = (profile.nitrogenPercentage || 0) + (profile.carbonDioxidePercentage || 0);
              const pesados = 100 - totalMethane - inertes;

              return (
                <div key={profile.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-sm flex flex-col hover:border-[var(--color-text-secondary)] transition-colors">
                  
                  <div className="p-5 border-b border-[var(--color-border)]">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-serif font-bold text-[var(--color-text-primary)] leading-tight">
                        {profile.name}
                      </h3>
                      {profile.reportDate && (
                        <span className="text-[10px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-canvas)] px-1.5 py-0.5 border border-[var(--color-border)] rounded-sm">
                          {new Date(profile.reportDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {profile.reportNumber && (
                      <p className="text-[11px] font-mono text-[var(--color-text-secondary)]">Cert: {profile.reportNumber}</p>
                    )}
                  </div>
                  
                  <div className="p-5 flex-1">
                    <div className="space-y-3 font-mono text-[11px]">
                      
                      <div className="flex justify-between items-center p-2 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-sm">
                        <span className="text-[var(--color-text-secondary)] uppercase">Metano (C1)</span>
                        <span className="font-bold text-[var(--color-text-primary)] text-sm">{totalMethane.toFixed(2)}%</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 border border-[var(--color-border)] rounded-sm flex flex-col justify-between">
                          <span className="text-[9px] text-[var(--color-text-secondary)] uppercase mb-1">Inertes</span>
                          <span className="font-bold text-[var(--color-text-primary)] text-xs">{inertes.toFixed(2)}%</span>
                        </div>
                        <div className="p-2 border border-[var(--color-border)] rounded-sm flex flex-col justify-between">
                          <span className="text-[9px] text-[var(--color-text-secondary)] uppercase mb-1">Pesados</span>
                          <span className="font-bold text-[var(--color-text-primary)] text-xs">{pesados.toFixed(2)}%</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--color-border)] space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-secondary)] uppercase">Gravedad Esp.</span>
                          <span className="text-[var(--color-text-primary)]">{profile.specificGravity.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-secondary)] uppercase">Masa Molar</span>
                          <span className="text-[var(--color-text-primary)]">{profile.molarMass.toFixed(2)}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 p-3 bg-[var(--color-canvas)] border-t border-[var(--color-border)]">
                    <button
                      onClick={() => handleEdit(profile)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border)] rounded-sm transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[var(--color-alert-red-text)] hover:bg-[var(--color-alert-red-bg)] border border-transparent hover:border-[var(--color-alert-red-border)] rounded-sm transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Borrar
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
