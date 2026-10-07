import React, { useState, useEffect } from 'react';
import { thermodynamicsService, GasProfileDTO } from '../core/api/thermodynamic.service';
import { Settings, Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';

export default function GasProfilesModule() {
  const [profiles, setProfiles] = useState<GasProfileDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<Omit<GasProfileDTO, 'id'>>({
    name: '',
    methanePercentage: 96.0,
    nitrogenPercentage: 2.0,
    grossCalorificValue: 8900.0,
    specificGravity: 0.58,
    molarMass: 16.8,
    criticalPressure: 45.8,
    criticalTemperature: 191.0
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
      methanePercentage: 96.0,
      nitrogenPercentage: 2.0,
      grossCalorificValue: 8900.0,
      specificGravity: 0.58,
      molarMass: 16.8,
      criticalPressure: 45.8,
      criticalTemperature: 191.0
    });
    setIsCreating(true);
    setIsEditing(null);
  };

  const handleEdit = (profile: GasProfileDTO) => {
    setFormData({
      name: profile.name,
      methanePercentage: profile.methanePercentage,
      nitrogenPercentage: profile.nitrogenPercentage || 0,
      grossCalorificValue: profile.grossCalorificValue || 0,
      specificGravity: profile.specificGravity,
      molarMass: profile.molarMass,
      criticalPressure: profile.criticalPressure,
      criticalTemperature: profile.criticalTemperature
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

  const renderForm = () => (
    <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md animate-fade-in shadow-none mb-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
        <h3 className="text-lg font-serif font-bold text-[var(--color-text-primary)]">
          {isCreating ? 'Crear Nuevo Perfil' : 'Editar Perfil'}
        </h3>
        <button onClick={handleCancel} className="p-1.5 rounded-sm hover:bg-[var(--color-canvas)] text-[var(--color-text-secondary)]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
            Nombre del Perfil
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-10 px-3 text-sm border border-[var(--color-border)] bg-[var(--color-canvas)] font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-primary)]"
          />
        </div>
        
        <div>
          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
            % Metano (CH₄)
          </label>
          <input
            type="number"
            step="0.0001"
            value={formData.methanePercentage}
            onChange={(e) => setFormData({ ...formData, methanePercentage: Number(e.target.value) })}
            className="w-full h-10 px-3 text-sm border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-primary)]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
            Gravedad Específica (Gr)
          </label>
          <input
            type="number"
            step="0.0001"
            value={formData.specificGravity}
            onChange={(e) => setFormData({ ...formData, specificGravity: Number(e.target.value) })}
            className="w-full h-10 px-3 text-sm border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-primary)]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
            Masa Molar (g/mol)
          </label>
          <input
            type="number"
            step="0.0001"
            value={formData.molarMass}
            onChange={(e) => setFormData({ ...formData, molarMass: Number(e.target.value) })}
            className="w-full h-10 px-3 text-sm border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-primary)]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
            Presión Crítica (bar)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.criticalPressure}
            onChange={(e) => setFormData({ ...formData, criticalPressure: Number(e.target.value) })}
            className="w-full h-10 px-3 text-sm border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-primary)]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
            Temp. Crítica (K)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.criticalTemperature}
            onChange={(e) => setFormData({ ...formData, criticalTemperature: Number(e.target.value) })}
            className="w-full h-10 px-3 text-sm border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-primary)]"
          />
        </div>

      </div>

      <div className="flex justify-end mt-6 gap-3 pt-4 border-t border-[var(--color-border)]">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-xs font-bold border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded-md cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[var(--color-text-primary)] text-[var(--color-canvas)] hover:opacity-90 rounded-md cursor-pointer"
        >
          <Check className="w-4 h-4" />
          Guardar Perfil
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in py-8">
      
      <div className="flex items-center justify-between pb-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-md bg-[var(--color-alert-blue-bg)] border border-[var(--color-border)] text-[var(--color-alert-blue-text)]">
            <Settings className="w-5 h-5 stroke-[2px]" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[var(--color-text-primary)]">
              Perfiles Cromatográficos
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-mono mt-1">
              Configuración de mezclas de gas para el motor termodinámico
            </p>
          </div>
        </div>
        
        {!isCreating && !isEditing && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[var(--color-text-primary)] text-[var(--color-canvas)] hover:opacity-90 rounded-md shadow-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Perfil
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-[var(--color-alert-red-bg)] border border-[var(--color-alert-red-border)] text-[var(--color-alert-red-text)] rounded-md flex items-center gap-2 text-sm font-bold">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {(isCreating || isEditing) && renderForm()}

      {!isCreating && !isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-[var(--color-text-secondary)] text-sm font-mono">
              Cargando perfiles...
            </div>
          ) : profiles.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[var(--color-text-secondary)] text-sm border border-dashed border-[var(--color-border)] rounded-md">
              No hay perfiles de gas configurados.
            </div>
          ) : (
            profiles.map(profile => (
              <div key={profile.id} className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-none flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[var(--color-text-primary)] mb-4 pb-2 border-b border-[var(--color-border)]">
                    {profile.name}
                  </h3>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)] uppercase">Metano (CH₄)</span>
                      <span className="font-bold text-[var(--color-text-primary)]">{profile.methanePercentage.toFixed(4)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)] uppercase">Gravedad Específica</span>
                      <span className="font-bold text-[var(--color-text-primary)]">{profile.specificGravity.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)] uppercase">Masa Molar</span>
                      <span className="font-bold text-[var(--color-text-primary)]">{profile.molarMass.toFixed(2)} g/mol</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)] uppercase">Presión Crítica</span>
                      <span className="font-bold text-[var(--color-text-primary)]">{profile.criticalPressure.toFixed(2)} bar</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)] uppercase">Temp. Crítica</span>
                      <span className="font-bold text-[var(--color-text-primary)]">{profile.criticalTemperature.toFixed(2)} K</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => handleEdit(profile)}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-canvas)] rounded-md transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="p-2 text-[var(--color-alert-red-text)] hover:bg-[var(--color-alert-red-bg)] rounded-md transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
