const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/ThermodynamicCalculator.tsx', 'utf8');

const replacement = `        {/* Encabezado Simple y Limpio */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--color-border)] gap-4">
          <div className="flex flex-row items-center gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-[var(--color-text-primary)]">
                Cálculo de Módulo Individual
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Estimación termodinámica de transferencia de gas natural comprimido
              </p>
            </div>
            
            {gasProfiles.length > 0 && (
              <div className="flex items-center gap-2 ml-4">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Gas:</span>
                <select
                  value={selectedGasProfileId}
                  onChange={(e) => setSelectedGasProfileId(e.target.value)}
                  className="h-8 px-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--color-text-primary)] cursor-pointer"
                >
                  {gasProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>{profile.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
  
          {/* Controles de Módulo y Unidad */}
          <div className="flex items-center gap-3">`;

c = c.replace(/        \{\/\* Encabezado Simple y Limpio \*\/\}.*?\{\/\* Controles de M(?:ó|)dulo y Unidad \*\/\}\r?\n\s+<div className="flex items-center gap-3">/s, replacement);

fs.writeFileSync('frontend/src/components/ThermodynamicCalculator.tsx', c);
