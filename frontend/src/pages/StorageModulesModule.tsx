import React, { useState, useEffect, useMemo } from 'react';
import { StorageService, StorageModuleDTO } from '../core/api/storage.service';
import { 
  Plus, 
  Search, 
  Check, 
  X, 
  AlertCircle, 
  Box, 
  Building2, 
  Truck, 
  Edit2, 
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Layers
} from 'lucide-react';

type MainTab = 'ESTACIONARIA' | 'TRANSPORTE';

export default function StorageModulesModule() {
  const [modules, setModules] = useState<StorageModuleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Categoría Principal
  const [activeTab, setActiveTab] = useState<MainTab>('ESTACIONARIA');
  
  // Buscador
  const [searchQuery, setSearchQuery] = useState('');

  // Estado de grupos expandidos (por defecto todas cerradas/colapsadas)
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});

  // Formulario de Creación / Edición Inline
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<StorageModuleDTO, 'id' | 'totalCapacityLiters' | 'createdAt'>>({
    name: '',
    type: 'ESTACIONARIA',
    cylinderCount: 12,
    cylinderCapacityLiters: 150.0
  });

  const fetchModules = async () => {
    try {
      setLoading(true);
      const data = await StorageService.getModules();
      setModules(data);
      setError(null);
    } catch (err) {
      setError('Error al conectar con el inventario de almacenamientos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  // Separación por Categoría Principal
  const stationaryModules = useMemo(() => 
    modules.filter(m => m.type === 'ESTACIONARIA'), 
    [modules]
  );

  const transportModules = useMemo(() => 
    modules.filter(m => m.type === 'TRANSPORTE'), 
    [modules]
  );

  // Subcategorías de Cascadas Estacionarias agrupadas por calibre de cilindro (150L, 125L, etc.)
  const stationaryGroups = useMemo(() => {
    const groups: { [key: number]: StorageModuleDTO[] } = {};
    stationaryModules.forEach(mod => {
      const cap = mod.cylinderCapacityLiters;
      if (!groups[cap]) groups[cap] = [];
      groups[cap].push(mod);
    });
    const sortedKeys = Object.keys(groups).map(Number).sort((a, b) => b - a);
    return sortedKeys.map(cap => {
      const groupMods = groups[cap].sort((a, b) => a.cylinderCount - b.cylinderCount);
      const groupCapacity = groupMods.reduce((acc, m) => acc + m.totalCapacityLiters, 0);
      return {
        capacity: cap,
        key: `${cap}`,
        label: `Baterías de Cilindros de ${cap} Litros`,
        unitCapText: `${cap} L / cilindro`,
        totalCapacityLiters: groupCapacity,
        modules: groupMods
      };
    });
  }, [stationaryModules]);

  // Toggle de expansión por grupo
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const expandAll = () => {
    const next: { [key: string]: boolean } = {};
    stationaryGroups.forEach(g => { next[g.key] = true; });
    next['transporte'] = true;
    setExpandedGroups(next);
  };

  const collapseAll = () => {
    setExpandedGroups({});
  };

  // Manejo de formulario
  const handleOpenCreate = () => {
    setFormData({
      name: activeTab === 'ESTACIONARIA' ? 'Cascada Estacionaria ' : 'Tráiler Transporte ',
      type: activeTab,
      cylinderCount: activeTab === 'ESTACIONARIA' ? 12 : 11,
      cylinderCapacityLiters: activeTab === 'ESTACIONARIA' ? 150.0 : 2450.0
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (mod: StorageModuleDTO) => {
    setFormData({
      name: mod.name,
      type: mod.type,
      cylinderCount: mod.cylinderCount,
      cylinderCapacityLiters: mod.cylinderCapacityLiters
    });
    setEditingId(mod.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleDeleteModule = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el módulo "${name}"?`)) return;
    try {
      await StorageService.deleteModule(id);
      await fetchModules();
    } catch (err) {
      alert('No se pudo eliminar el módulo. Puede estar referenciado en operaciones.');
    }
  };

  const handleSaveForm = async () => {
    if (!formData.name.trim()) {
      alert('Ingresa un nombre para el módulo');
      return;
    }
    try {
      if (editingId) {
        await StorageService.updateModule(editingId, formData);
      } else {
        await StorageService.createModule(formData);
      }
      setIsFormOpen(false);
      setEditingId(null);
      await fetchModules();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar el módulo');
    }
  };

  const calculatedTotalLiters = formData.cylinderCount * formData.cylinderCapacityLiters;

  return (
    <div className="w-full space-y-6 animate-fade-in py-4 px-2 sm:px-4 font-sans">
      
      {/* 1. Header Widescreen con Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[var(--color-border)] gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)]">
            <Box className="w-5 h-5 stroke-[1.8px]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-sans font-semibold text-[var(--color-text-primary)] tracking-tight">
                Almacenamientos
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold">
                {modules.length} Registros
              </span>
            </div>
          </div>
        </div>
        
        {!isFormOpen && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] rounded-md cursor-pointer transition-colors w-full sm:w-auto shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2px]" />
            Nuevo Almacenamiento
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[var(--color-alert-red-bg)] border border-[var(--color-alert-red-border)] text-[var(--color-alert-red-text)] rounded-md flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* 2. Formulario Inline Integrado (Solo cuando se activa) */}
      {isFormOpen && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 space-y-5 animate-fade-in shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
            <div>
              <h3 className="text-base font-sans font-semibold text-[var(--color-text-primary)] tracking-tight">
                {editingId ? 'Editar Almacenamiento' : 'Registrar Nuevo Almacenamiento'}
              </h3>
            </div>
            <button 
              onClick={handleCloseForm} 
              className="p-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                Nombre del Módulo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-9 px-3 text-xs border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[var(--color-text-primary)] rounded focus:outline-none focus:border-[var(--color-text-primary)]"
                placeholder="Ej: Cascada 12x150L"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                Categoría
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'ESTACIONARIA' | 'TRANSPORTE';
                  setFormData({
                    ...formData,
                    type: newType,
                    cylinderCapacityLiters: newType === 'ESTACIONARIA' ? 150 : 2450,
                    cylinderCount: newType === 'ESTACIONARIA' ? 12 : 11
                  });
                }}
                className="w-full h-9 px-3 text-xs border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[var(--color-text-primary)] rounded focus:outline-none focus:border-[var(--color-text-primary)] cursor-pointer"
              >
                <option value="ESTACIONARIA">Cascada Estacionaria (Planta)</option>
                <option value="TRANSPORTE">Módulo de Transporte (Carretera)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                N° Cilindros / Tubos
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.cylinderCount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  let val = e.target.value;
                  if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
                  setFormData({ ...formData, cylinderCount: val === '' ? 1 : Math.max(1, Number(val)) });
                }}
                className="w-full h-9 px-3 text-xs border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[var(--color-text-primary)] rounded focus:outline-none focus:border-[var(--color-text-primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                Capacidad por Cilindro (Litros)
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={formData.cylinderCapacityLiters}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  let val = e.target.value;
                  if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
                  setFormData({ ...formData, cylinderCapacityLiters: val === '' ? 1 : Math.max(0.1, Number(val)) });
                }}
                className="w-full h-9 px-3 text-xs border border-[var(--color-border)] bg-[var(--color-canvas)] font-mono text-[var(--color-text-primary)] rounded focus:outline-none focus:border-[var(--color-text-primary)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
            <button
              onClick={handleCloseForm}
              className="px-4 py-1.5 text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveForm}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] rounded cursor-pointer transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              Guardar Módulo
            </button>
          </div>
        </div>
      )}

      {/* 3. Barra de Control Widescreen: Pestañas + Buscador + Control de Expansión */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
        
        {/* Pestañas de Categoría Principal */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('ESTACIONARIA');
              setExpandedGroups({});
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer border ${
              activeTab === 'ESTACIONARIA'
                ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-accent)] font-bold shadow-2xs'
                : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cascadas Estacionarias</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
              {stationaryModules.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('TRANSPORTE');
              setExpandedGroups({});
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer border ${
              activeTab === 'TRANSPORTE'
                ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-accent)] font-bold shadow-2xs'
                : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Módulos de Transporte</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
              {transportModules.length}
            </span>
          </button>
        </div>

        {/* Acciones de Expansión y Buscador */}
        <div className="flex items-center gap-3">
          
          {/* Botones de Colapsar / Expandir Todos */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-[var(--color-text-secondary)]">
            <button
              onClick={expandAll}
              className="px-2 py-1 rounded hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              Expandir todo
            </button>
            <span>·</span>
            <button
              onClick={collapseAll}
              className="px-2 py-1 rounded hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              Colapsar todo
            </button>
          </div>

          {/* Buscador Rápido */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o tubos..."
              className="w-full h-8 pl-8 pr-3 text-xs border border-[var(--color-border)] bg-[var(--color-canvas)] rounded font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-text-primary)]"
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

      </div>

      {/* 4. Tablas Expandibles sin Columnas Redundantes */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-24 text-center text-[var(--color-text-secondary)] text-xs font-mono animate-pulse border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
            [ Consultando inventario de almacenamientos... ]
          </div>
        ) : (
          <>
            {/* VISTA A: CASCADAS ESTACIONARIAS (Subcategorías Expandibles) */}
            {activeTab === 'ESTACIONARIA' && (
              stationaryGroups.map(group => {
                const isExpanded = !!expandedGroups[group.key];
                
                // Filtrado por buscador
                const filteredModules = group.modules.filter(m => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return m.name.toLowerCase().includes(q) || `${m.cylinderCount}`.includes(q);
                });

                if (filteredModules.length === 0 && searchQuery.trim()) return null;

                return (
                  <div 
                    key={group.key}
                    className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] overflow-hidden shadow-2xs transition-all"
                  >
                    {/* Barra de Cabecera de Subcategoría Expandible */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center justify-between px-5 py-3.5 bg-[var(--color-canvas)] hover:bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] transition-colors text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--color-text-secondary)]">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </span>
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[var(--color-accent)]" />
                          <h3 className="font-sans font-semibold text-sm text-[var(--color-text-primary)]">
                            {group.label}
                          </h3>
                        </div>
                        {/* Especificación técnica de la subcategoría (elimina redundancia en cada fila) */}
                        <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] font-medium">
                          {group.unitCapText}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 font-mono text-xs text-[var(--color-text-secondary)]">
                        <span>{filteredModules.length} equipos</span>
                        <span className="hidden md:inline font-bold text-[var(--color-text-primary)]">
                          {group.totalCapacityLiters.toLocaleString()} L
                        </span>
                      </div>
                    </button>

                    {/* Tabla de Módulos (Solo visible cuando está expandido) */}
                    {isExpanded && (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-sans">
                          <thead>
                            <tr className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
                              <th className="py-2.5 px-5 font-bold">Identificación del Equipo</th>
                              <th className="py-2.5 px-4 font-bold text-center">N° Tubos</th>
                              <th className="py-2.5 px-4 font-bold text-right">Capacidad Total (L)</th>
                              <th className="py-2.5 px-4 font-bold text-right">Volumen (m³)</th>
                              <th className="py-2.5 px-5 font-bold text-center w-24">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-border)] font-mono">
                            {filteredModules.map(mod => {
                              const volumeM3 = (mod.totalCapacityLiters / 1000).toFixed(2);
                              return (
                                <tr 
                                  key={mod.id} 
                                  className="hover:bg-[var(--color-surface-hover)] transition-colors"
                                >
                                  {/* Nombre directo sin prefijos redundantes */}
                                  <td className="py-3 px-5 font-sans font-semibold text-sm text-[var(--color-text-primary)]">
                                    {mod.name}
                                  </td>

                                  {/* Conteo de tubos */}
                                  <td className="py-3 px-4 text-center font-bold text-[var(--color-text-primary)]">
                                    {mod.cylinderCount} <span className="text-[10px] text-[var(--color-text-secondary)] font-normal">cil.</span>
                                  </td>

                                  {/* Capacidad Total en Litros */}
                                  <td className="py-3 px-4 text-right font-bold text-[var(--color-text-primary)] text-sm">
                                    {mod.totalCapacityLiters.toLocaleString()} L
                                  </td>

                                  {/* Volumen en m³ */}
                                  <td className="py-3 px-4 text-right font-mono font-bold text-[var(--color-accent)] text-xs">
                                    {volumeM3} m³
                                  </td>

                                  {/* Acciones */}
                                  <td className="py-3 px-5 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleOpenEdit(mod)}
                                        className="p-1.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-canvas)] transition-colors cursor-pointer"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteModule(mod.id, mod.name)}
                                        className="p-1.5 rounded text-[var(--color-alert-red-text)] hover:bg-[var(--color-alert-red-bg)] transition-colors cursor-pointer"
                                        title="Eliminar"
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
                );
              })
            )}

            {/* VISTA B: MÓDULOS DE TRANSPORTE (Tráilers Móviles Expandibles) */}
            {activeTab === 'TRANSPORTE' && (
              <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] overflow-hidden shadow-2xs">
                {/* Cabecera Expandible de Transporte */}
                <button
                  type="button"
                  onClick={() => toggleGroup('transporte')}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-[var(--color-canvas)] hover:bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] transition-colors text-left cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--color-text-secondary)]">
                      {expandedGroups['transporte'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[var(--color-accent)]" />
                      <h3 className="font-sans font-semibold text-sm text-[var(--color-text-primary)]">
                        Semirremolques y Tráilers de Transporte Carretero
                      </h3>
                    </div>
                    <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] font-medium">
                      Tubos Jumbo 40 ft
                    </span>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-xs text-[var(--color-text-secondary)]">
                    <span>{transportModules.length} tráilers</span>
                    <span className="hidden md:inline font-bold text-[var(--color-text-primary)]">
                      {transportModules.reduce((acc, m) => acc + m.totalCapacityLiters, 0).toLocaleString()} L
                    </span>
                  </div>
                </button>

                {/* Tabla de Tráilers (Solo visible cuando el usuario le da clic para abrirla) */}
                {!!expandedGroups['transporte'] && (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
                          <th className="py-2.5 px-5 font-bold">Tráiler / Módulo de Transporte</th>
                          <th className="py-2.5 px-4 font-bold text-center">N° Tubos Jumbo</th>
                          <th className="py-2.5 px-4 font-bold text-right">Capacidad Total (L)</th>
                          <th className="py-2.5 px-4 font-bold text-right">Volumen (m³)</th>
                          <th className="py-2.5 px-5 font-bold text-center w-24">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)] font-mono">
                        {transportModules
                          .filter(m => {
                            if (!searchQuery.trim()) return true;
                            const q = searchQuery.toLowerCase();
                            return m.name.toLowerCase().includes(q) || `${m.cylinderCount}`.includes(q);
                          })
                          .map(mod => {
                            const volumeM3 = (mod.totalCapacityLiters / 1000).toFixed(2);
                            return (
                              <tr 
                                key={mod.id} 
                                className="hover:bg-[var(--color-surface-hover)] transition-colors"
                              >
                                <td className="py-3 px-5 font-sans font-semibold text-sm text-[var(--color-text-primary)]">
                                  {mod.name.replace(/\s*\(\d+(\.\d+)?\s*m³\)/i, '').trim()}
                                </td>

                                <td className="py-3 px-4 text-center font-bold text-[var(--color-text-primary)]">
                                  {mod.cylinderCount} <span className="text-[10px] text-[var(--color-text-secondary)] font-normal">tubos</span>
                                </td>

                                <td className="py-3 px-4 text-right font-bold text-[var(--color-text-primary)] text-sm">
                                  {mod.totalCapacityLiters.toLocaleString()} L
                                </td>

                                <td className="py-3 px-4 text-right font-mono font-bold text-[var(--color-accent)] text-xs">
                                  {volumeM3} m³
                                </td>

                                <td className="py-3 px-5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleOpenEdit(mod)}
                                      className="p-1.5 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-canvas)] transition-colors cursor-pointer"
                                      title="Editar"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteModule(mod.id, mod.name)}
                                      className="p-1.5 rounded text-[var(--color-alert-red-text)] hover:bg-[var(--color-alert-red-bg)] transition-colors cursor-pointer"
                                      title="Eliminar"
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
          </>
        )}
      </div>

    </div>
  );
}
