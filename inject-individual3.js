const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/ThermodynamicCalculator.tsx', 'utf8');

const target = `{/* Controles de Módulo y Unidad */}
          <div className="flex items-center gap-3">`;
const replacement = `{gasProfiles.length > 0 && (
            <div className="flex items-center gap-2">
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

          {/* Controles de Módulo y Unidad */}
          <div className="flex items-center gap-3">`;

c = c.replace(/\{\/\* Controles de M(?:ó|)dulo y Unidad \*\/\}\r?\n\s+<div className="flex items-center gap-3">/g, replacement);

fs.writeFileSync('frontend/src/components/ThermodynamicCalculator.tsx', c);
