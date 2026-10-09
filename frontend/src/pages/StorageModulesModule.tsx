import React, { useState, useEffect, useMemo } from 'react';
import { StorageService, StorageModuleDTO, CreateStorageModuleDTO } from '../core/api/storage.service';
import StorageDetailModal from '../components/StorageDetailModal';
import { 
  Plus, 
  Search, 
  X, 
  AlertCircle, 
  Box, 
  Building2, 
  Truck, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Layers,
  Eye,
  Gauge,
  Scale
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

  // Estado de grupos expandidos (por defecto abiertas para visualización directa)
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    transporte: true
  });

  // Modal de Detalle / Ficha Técnica
  const [selectedModuleForDetail, setSelectedModuleForDetail] = useState<StorageModuleDTO | null>(null);

  // Formulario de Creación / Edición
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateStorageModuleDTO>({
    name: '',
    type: 'ESTACIONARIA',
    cylinderCount: 12,
    cylinderCapacityLiters: 150.0,
    workingPressureBar: 250.0,
    testPressureBar: 375.0,
    safetyReliefPressureBar: 273.0,
    minOperatingTempC: -40.0,
    maxOperatingTempC: 60.0,
    tareWeightKg: 2940.0,
    maxPayloadKg: 405.0,
    grossWeightKg: 3345.0,
    chassisType: 'Batería Estacionaria Vertical',
    tubeMaterial: '34CrMo4',
    tubeOuterDiameterMm: 356.0,
    tubeLengthMm: 1890.0,
    plugConfiguration: 'SINGLE_PLUG',
    valveManufacturer: 'DK-Lok',
    manufacturingStandard: 'ISO 9809-1:1999',
    certificationAgency: 'Bureau Veritas (BV)',
    designLifeYears: 15
  });

  const fetchModules = async () => {
    try {
      setLoading(true);
      const data = await StorageService.getModules();
      setModules(data);
      // Abrir por defecto los grupos presentes
      const initialGroups: { [key: string]: boolean } = { transporte: true };
      data.forEach(m => {
        if (m.type === 'ESTACIONARIA') {
          initialGroups[`${m.cylinderCapacityLiters}`] = true;
        }
      });
      setExpandedGroups(initialGroups);
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

  // Subcategorías de Cascadas Estacionarias agrupadas por calibre de cilindro
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

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Manejo de formulario
  const handleOpenCreate = () => {
    const isStat = activeTab === 'ESTACIONARIA';
    setFormData({
      name: isStat ? 'Cascada Estacionaria ' : 'Tráiler Transporte ',
      type: activeTab,
      cylinderCount: isStat ? 12 : 11,
      cylinderCapacityLiters: isStat ? 150.0 : 2450.0,
      workingPressureBar: 250.0,
      testPressureBar: 375.0,
      safetyReliefPressureBar: isStat ? 273.0 : 375.0,
      minOperatingTempC: isStat ? -40.0 : -50.0,
      maxOperatingTempC: 60.0,
      tareWeightKg: isStat ? 2940.0 : 32200.0,
      maxPayloadKg: isStat ? 405.0 : 6063.0,
      grossWeightKg: isStat ? 3345.0 : 38263.0,
      chassisType: isStat ? 'Batería Estacionaria Vertical' : 'Triple eje / Three-axis',
      tubeMaterial: isStat ? '34CrMo4' : '4130X',
      tubeOuterDiameterMm: isStat ? 356.0 : 559.0,
      tubeLengthMm: isStat ? 1890.0 : 11580.0,
      plugConfiguration: isStat ? 'SINGLE_PLUG' : 'DOUBLE_PLUG',
      valveManufacturer: 'DK-Lok',
      manufacturingStandard: isStat ? 'ISO 9809-1:1999' : 'ISO 11120:2015',
      certificationAgency: 'Bureau Veritas (BV)',
      designLifeYears: 15
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (mod: StorageModuleDTO) => {
    setFormData({
      name: mod.name,
      type: mod.type,
      cylinderCount: mod.cylinderCount,
      cylinderCapacityLiters: mod.cylinderCapacityLiters,
      workingPressureBar: mod.workingPressureBar || 250.0,
      testPressureBar: mod.testPressureBar || 375.0,
      safetyReliefPressureBar: mod.safetyReliefPressureBar || 273.0,
      minOperatingTempC: mod.minOperatingTempC ?? -50.0,
      maxOperatingTempC: mod.maxOperatingTempC ?? 60.0,
      tareWeightKg: mod.tareWeightKg,
      maxPayloadKg: mod.maxPayloadKg,
      grossWeightKg: mod.grossWeightKg,
      chassisType: mod.chassisType,
      tubeMaterial: mod.tubeMaterial,
      tubeOuterDiameterMm: mod.tubeOuterDiameterMm,
      tubeLengthMm: mod.tubeLengthMm,
      plugConfiguration: mod.plugConfiguration,
      valveManufacturer: mod.valveManufacturer,
      manufacturingStandard: mod.manufacturingStandard,
      certificationAgency: mod.certificationAgency,
      designLifeYears: mod.designLifeYears || 15
    });
    setEditingId(mod.id);
    setIsFormOpen(true);
    setSelectedModuleForDetail(null);
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
      setSelectedModuleForDetail(null);
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
                {modules.length} Registros Activos
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Inventario de cascadas estacionarias y semirremolques de transporte con fichas técnicas industriales.
            </p>
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

      {/* 2. Formulario Inline Integrado (Creación / Edición) */}
      {isFormOpen && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 sm:p-6 space-y-5 animate-fade-in shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                {editingId ? 'Editar Ficha Técnica de Almacenamiento' : 'Registrar Nuevo Equipo de Almacenamiento'}
              </span>
            </div>
            <button
              onClick={handleCloseForm}
              className="p-1 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
            
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                Identificación / Nombre del Equipo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Cascada Estacionaria 16x150L"
                className="w-full px-3 py-2 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                Tipo de Almacenamiento
              </label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as MainTab })}
                className="w-full px-3 py-2 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold focus:outline-none focus:border-[var(--color-accent)]"
              >
                <option value="ESTACIONARIA">Cascada Estacionaria Fija</option>
                <option value="TRANSPORTE">Módulo de Transporte Carretero</option>
              </select>
            </div>

            {/* Número de Cilindros */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                Cantidad de Tubos / Cilindros
              </label>
              <input
                type="number"
                min="1"
                value={formData.cylinderCount}
                onChange={e => setFormData({ ...formData, cylinderCount: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono font-semibold focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Capacidad por Cilindro */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                Capacidad por Cilindro (Litros)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.cylinderCapacityLiters}
                onChange={e => setFormData({ ...formData, cylinderCapacityLiters: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono font-semibold focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Presión de Trabajo */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                Presión de Trabajo (bar)
              </label>
              <input
                type="number"
                value={formData.workingPressureBar || 250}
                onChange={e => setFormData({ ...formData, workingPressureBar: parseFloat(e.target.value) || 250 })}
                className="w-full px-3 py-2 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono font-semibold focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Presión de Prueba */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                Presión de Prueba Hidrostática (bar)
              </label>
              <input
                type="number"
                value={formData.testPressureBar || 375}
                onChange={e => setFormData({ ...formData, testPressureBar: parseFloat(e.target.value) || 375 })}
                className="w-full px-3 py-2 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono font-semibold focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Tara (kg) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                Peso Tara en Vacío (kg)
              </label>
              <input
                type="number"
                value={formData.tareWeightKg ?? ''}
                onChange={e => setFormData({ ...formData, tareWeightKg: parseFloat(e.target.value) || null })}
                placeholder="Ej: 32200"
                className="w-full px-3 py-2 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono font-semibold focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Carga Máxima (kg) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                Carga Máxima de GNV en Masa (kg)
              </label>
              <input
                type="number"
                value={formData.maxPayloadKg ?? ''}
                onChange={e => setFormData({ ...formData, maxPayloadKg: parseFloat(e.target.value) || null })}
                placeholder="Ej: 6063"
                className="w-full px-3 py-2 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono font-semibold focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Norma de Fabricación */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase">
                Norma Técnica
              </label>
              <input
                type="text"
                value={formData.manufacturingStandard ?? ''}
                onChange={e => setFormData({ ...formData, manufacturingStandard: e.target.value })}
                placeholder="Ej: ISO 11120:2015"
                className="w-full px-3 py-2 rounded-md bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

          </div>

          {/* Resumen Calculado */}
          <div className="p-3 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-md flex flex-wrap items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-text-secondary)]">
              Capacidad Geométrica Estimada: <strong className="text-[var(--color-text-primary)]">{calculatedTotalLiters.toLocaleString()} Litros</strong> ({(calculatedTotalLiters / 1000).toFixed(2)} m³)
            </span>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-3 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                className="px-4 py-1.5 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold cursor-pointer shadow-xs"
              >
                {editingId ? 'Actualizar Ficha' : 'Guardar Almacenamiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Selector de Categoría Principal y Buscador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2">
        
        {/* Pestañas Principales con Acento Azul Gas */}
        <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('ESTACIONARIA')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'ESTACIONARIA'
                ? 'bg-white dark:bg-[#18181b] text-[var(--color-accent)] shadow-xs font-bold'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Building2 className="w-4 h-4 stroke-[2px]" />
            <span>Cascadas Estacionarias</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--color-surface)] border border-[var(--color-border)]">
              {stationaryModules.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRANSPORTE')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'TRANSPORTE'
                ? 'bg-white dark:bg-[#18181b] text-[var(--color-accent)] shadow-xs font-bold'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Truck className="w-4 h-4 stroke-[2px]" />
            <span>Módulos de Transporte</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--color-surface)] border border-[var(--color-border)]">
              {transportModules.length}
            </span>
          </button>
        </div>

        {/* Buscador Rápido */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o tubos..."
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* 4. Tablas con Ficha Técnica Expandible */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-24 text-center text-[var(--color-text-secondary)] text-xs font-mono animate-pulse border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
            [ Consultando inventario de almacenamientos... ]
          </div>
        ) : (
          <>
            {/* VISTA A: CASCADAS ESTACIONARIAS */}
            {activeTab === 'ESTACIONARIA' && (
              stationaryGroups.map(group => {
                const isExpanded = !!expandedGroups[group.key];
                
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
                    {/* Barra de Cabecera */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 bg-[var(--color-canvas)] hover:bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] transition-colors text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[var(--color-text-secondary)]">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </span>
                        <div className="flex items-center gap-2 min-w-0 truncate">
                          <Layers className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                          <h3 className="font-sans font-semibold text-sm text-[var(--color-text-primary)] truncate">
                            {group.label}
                          </h3>
                        </div>
                        <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] font-medium shrink-0">
                          {group.unitCapText}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 font-mono text-xs text-[var(--color-text-secondary)] shrink-0">
                        <span>{filteredModules.length} equipos</span>
                        <span className="hidden md:inline font-bold text-[var(--color-text-primary)]">
                          {group.totalCapacityLiters.toLocaleString()} L
                        </span>
                      </div>
                    </button>

                    {/* Tabla de Módulos */}
                    {isExpanded && (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-sans">
                          <thead>
                            <tr className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
                              <th className="py-2.5 px-4 font-bold">Identificación del Equipo</th>
                              <th className="py-2.5 px-3 font-bold text-center">N° Tubos</th>
                              <th className="py-2.5 px-3 font-bold text-center">P. Trabajo</th>
                              <th className="py-2.5 px-4 font-bold text-right">Capacidad Total</th>
                              <th className="py-2.5 px-4 font-bold text-right">Volumen</th>
                              <th className="py-2.5 px-4 font-bold text-center w-28">Acciones</th>
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
                                  <td className="py-3 px-4 font-sans">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedModuleForDetail(mod)}
                                      className="font-semibold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors text-left flex items-center gap-2 cursor-pointer"
                                    >
                                      <span>{mod.name}</span>
                                      {mod.manufacturingStandard && (
                                        <span className="hidden lg:inline text-[9px] font-mono px-1.5 py-0.2 rounded border bg-[var(--color-canvas)] text-[var(--color-text-secondary)]">
                                          {mod.manufacturingStandard}
                                        </span>
                                      )}
                                    </button>
                                  </td>

                                  <td className="py-3 px-3 text-center font-bold text-[var(--color-text-primary)]">
                                    {mod.cylinderCount} <span className="text-[10px] text-[var(--color-text-secondary)] font-normal">cil.</span>
                                  </td>

                                  <td className="py-3 px-3 text-center font-bold text-[var(--color-accent)]">
                                    {mod.workingPressureBar || 250} bar
                                  </td>

                                  <td className="py-3 px-4 text-right font-bold text-[var(--color-text-primary)] text-sm">
                                    {mod.totalCapacityLiters.toLocaleString()} L
                                  </td>

                                  <td className="py-3 px-4 text-right font-mono font-bold text-[var(--color-text-primary)] text-xs">
                                    {volumeM3} m³
                                  </td>

                                  <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => setSelectedModuleForDetail(mod)}
                                        className="p-1.5 rounded text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] transition-colors cursor-pointer"
                                        title="Ver Ficha Técnica"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
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

            {/* VISTA B: MÓDULOS DE TRANSPORTE */}
            {activeTab === 'TRANSPORTE' && (
              <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] overflow-hidden shadow-2xs">
                {/* Cabecera de Transporte */}
                <button
                  type="button"
                  onClick={() => toggleGroup('transporte')}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 bg-[var(--color-canvas)] hover:bg-[var(--color-surface-hover)] border-b border-[var(--color-border)] transition-colors text-left cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[var(--color-text-secondary)]">
                      {expandedGroups['transporte'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      <Truck className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                      <h3 className="font-sans font-semibold text-sm text-[var(--color-text-primary)] truncate">
                        Semirremolques y Tráilers de Transporte Carretero
                      </h3>
                    </div>
                    <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] font-medium shrink-0">
                      Tubos Jumbo 40 ft
                    </span>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-xs text-[var(--color-text-secondary)] shrink-0">
                    <span>{transportModules.length} tráilers</span>
                    <span className="hidden md:inline font-bold text-[var(--color-text-primary)]">
                      {transportModules.reduce((acc, m) => acc + m.totalCapacityLiters, 0).toLocaleString()} L
                    </span>
                  </div>
                </button>

                {/* Tabla de Tráilers con Datos Logísticos de Báscula */}
                {!!expandedGroups['transporte'] && (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-[var(--color-canvas)] border-b border-[var(--color-border)] text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-secondary)]">
                          <th className="py-2.5 px-4 font-bold">Tráiler / Módulo de Transporte</th>
                          <th className="py-2.5 px-3 font-bold text-center">Tubos Jumbo</th>
                          <th className="py-2.5 px-3 font-bold text-center">P. Trabajo</th>
                          <th className="py-2.5 px-3 font-bold text-right">Tara Vacío</th>
                          <th className="py-2.5 px-3 font-bold text-right">Carga Máx. GNV</th>
                          <th className="py-2.5 px-4 font-bold text-right">Capacidad</th>
                          <th className="py-2.5 px-3 font-bold text-right">Volumen</th>
                          <th className="py-2.5 px-4 font-bold text-center w-28">Acciones</th>
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
                                <td className="py-3 px-4 font-sans">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedModuleForDetail(mod)}
                                    className="font-semibold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors text-left block cursor-pointer"
                                  >
                                    <span>{mod.name.replace(/\s*\(\d+(\.\d+)?\s*m³\)/i, '').trim()}</span>
                                    <span className="block text-[10px] font-mono text-[var(--color-text-secondary)] font-normal">
                                      {mod.chassisType || 'Triple eje'} • {mod.tubeMaterial || 'Acero 4130X'}
                                    </span>
                                  </button>
                                </td>

                                <td className="py-3 px-3 text-center font-bold text-[var(--color-text-primary)]">
                                  {mod.cylinderCount} <span className="text-[10px] text-[var(--color-text-secondary)] font-normal">tubos</span>
                                </td>

                                <td className="py-3 px-3 text-center font-bold text-[var(--color-accent)]">
                                  {mod.workingPressureBar || 250} bar
                                </td>

                                <td className="py-3 px-3 text-right font-medium text-[var(--color-text-secondary)]">
                                  {mod.tareWeightKg ? `${mod.tareWeightKg.toLocaleString()} kg` : '-'}
                                </td>

                                <td className="py-3 px-3 text-right font-bold text-[var(--color-text-primary)]">
                                  {mod.maxPayloadKg ? `${mod.maxPayloadKg.toLocaleString()} kg` : '-'}
                                </td>

                                <td className="py-3 px-4 text-right font-bold text-[var(--color-text-primary)] text-sm">
                                  {mod.totalCapacityLiters.toLocaleString()} L
                                </td>

                                <td className="py-3 px-3 text-right font-mono font-bold text-[var(--color-accent)] text-xs">
                                  {volumeM3} m³
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setSelectedModuleForDetail(mod)}
                                      className="p-1.5 rounded text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] transition-colors cursor-pointer"
                                      title="Ver Ficha Técnica"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
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

      {/* 5. Modal de Ficha Técnica Detallada */}
      <StorageDetailModal
        module={selectedModuleForDetail}
        onClose={() => setSelectedModuleForDetail(null)}
        onEdit={(m) => handleOpenEdit(m)}
        onDelete={(id, name) => handleDeleteModule(id, name)}
      />

    </div>
  );
}
