$targetFolder = "c:\Users\DesarrolloIT Android\Desktop\Daniel\GNV\GNV Manager\frontend\src"
$files = Get-ChildItem -Path $targetFolder -Recurse -Include *.tsx

foreach ($f in $files) {
    $content = Get-Content -Path $f.FullName -Raw
    $oldContent = $content

    # Slate leftovers
    $content = $content -replace 'bg-slate-200', 'bg-[var(--color-surface-hover)]'
    $content = $content -replace 'border-slate-400', 'border-[var(--color-border-hover)]'
    $content = $content -replace 'divide-slate-100', 'divide-[var(--color-border)]'
    $content = $content -replace 'divide-slate-200', 'divide-[var(--color-border)]'
    $content = $content -replace 'ring-slate-900', 'ring-[var(--color-accent)]'
    $content = $content -replace 'text-slate-300', 'text-[var(--color-text-secondary)]'
    
    # Stone
    $content = $content -replace 'bg-stone-50', 'bg-[var(--color-canvas)]'

    # Amber -> Yellow Alert
    $content = $content -replace 'bg-amber-100', 'bg-[var(--color-alert-yellow-bg)]'
    $content = $content -replace 'bg-amber-600', 'bg-[var(--color-alert-yellow-bg)]' # wait, if it's text or bg
    $content = $content -replace 'border-amber-200', 'border-[var(--color-alert-yellow-bg)]'
    $content = $content -replace 'border-amber-300', 'border-[var(--color-alert-yellow-bg)]'

    # Emerald -> Green Alert
    $content = $content -replace 'bg-emerald-600', 'bg-[var(--color-alert-green-bg)]'
    $content = $content -replace 'border-emerald-200', 'border-[var(--color-alert-green-border)]'
    $content = $content -replace 'border-emerald-300', 'border-[var(--color-alert-green-border)]'

    # Rose -> Red Alert
    $content = $content -replace 'border-rose-200', 'border-[var(--color-alert-red-border)]'
    $content = $content -replace 'border-rose-300', 'border-[var(--color-alert-red-border)]'

    # Blue / Cyan -> Blue Alert
    $content = $content -replace 'bg-blue-50', 'bg-[var(--color-alert-blue-bg)]'
    $content = $content -replace 'text-blue-600', 'text-[var(--color-alert-blue-text)]'
    $content = $content -replace 'border-blue-200', 'border-[var(--color-alert-blue-bg)]'
    
    $content = $content -replace 'bg-cyan-100', 'bg-[var(--color-alert-blue-bg)]'
    # bg-cyan-400 / 500 / ring-cyan-500 are probably used for the GasFlame or the "Live" ping dot indicator, so I will leave them alone.
    
    if ($content -cne $oldContent) {
        Set-Content -Path $f.FullName -Value $content -NoNewline
        Write-Output "Updated leftover colors in $($f.Name)"
    }
}
