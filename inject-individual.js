const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/ThermodynamicCalculator.tsx', 'utf8');

const newStates = `  const [isLoading, setIsLoading] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [gasProfiles, setGasProfiles] = useState<{ id: string; name: string }[]>([]);
  const [selectedGasProfileId, setSelectedGasProfileId] = useState<string>('');

  useEffect(() => {
    thermodynamicsService.getGasProfiles().then(profiles => {
      setGasProfiles(profiles);
      if (profiles.length > 0) {
        setSelectedGasProfileId(profiles[0].id);
      }
    }).catch(err => console.error('Error fetching gas profiles', err));
  }, []);`;

c = c.replace(/  const \[isLoading, setIsLoading\] = useState\(false\);\s+const \[isSavedFeedback, setIsSavedFeedback\] = useState\(false\);\s+const \[showAdvanced, setShowAdvanced\] = useState\(false\);/, newStates);

const newEffect = `      const calculated = await thermodynamicsService.calculateTransfer(
        Number(p_i_bar), t_i_K, Number(p_f_bar), t_f_K, capacity, 'CARGUE', selectedGasProfileId || undefined
      );`;

c = c.replace(/      const calculated = await thermodynamicsService\.calculateTransfer\(\s+Number\(p_i_bar\), t_i_K, Number\(p_f_bar\), t_f_K, capacity\s+\);/, newEffect);

// And we need to add the gas selector to the UI
const uiSearch = `        {/* Encabezado Despejado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--color-border)] gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-serif font-bold text-[var(--color-text-primary)]">
              Módulo Individual
            </h2>
          </div>`;

const uiReplace = `        {/* Encabezado Despejado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--color-border)] gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-serif font-bold text-[var(--color-text-primary)]">
              Módulo Individual
            </h2>
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
          </div>`;

c = c.replace(/        {\/\* Encabezado Despejado \*\/}\r?\n\s+<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-\[var\(--color-border\)\] gap-4">\r?\n\s+<div className="flex items-center gap-3">\r?\n\s+<h2 className="text-xl font-serif font-bold text-\[var\(--color-text-primary\)\]">\r?\n\s+Módulo Individual\r?\n\s+<\/h2>\r?\n\s+<\/div>/, uiReplace);

// We need to also make sure the useEffect for thermodynamicsService depends on selectedGasProfileId
c = c.replace(/    const timer = setTimeout\(async \(\) => {/g, '    const timer = setTimeout(async () => {');
c = c.replace(/  }, \[piInput, tiInput, pfInput, tfInput, capacity, pressureUnit\]\);/g, '  }, [piInput, tiInput, pfInput, tfInput, capacity, pressureUnit, selectedGasProfileId]);');

fs.writeFileSync('frontend/src/components/ThermodynamicCalculator.tsx', c);
