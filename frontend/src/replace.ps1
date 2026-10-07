$targetFolder = "c:\Users\DesarrolloIT Android\Desktop\Daniel\GNV\GNV Manager\frontend\src"
$files = Get-ChildItem -Path $targetFolder -Recurse -Include *.tsx

foreach ($f in $files) {
    $content = Get-Content -Path $f.FullName -Raw

    $oldContent = $content

    # Canvas / Surface Backgrounds
    $content = $content -replace 'bg-\[\#F7F6F3\]', 'bg-[var(--color-canvas)]'
    $content = $content -replace 'bg-white', 'bg-[var(--color-surface)]'
    $content = $content -replace 'bg-\[\#ffffff\]', 'bg-[var(--color-surface)]'
    
    # Accent Backgrounds
    $content = $content -replace 'bg-slate-900', 'bg-[var(--color-accent)]'
    $content = $content -replace 'bg-\[\#111111\]', 'bg-[var(--color-accent)]'
    $content = $content -replace 'bg-slate-800', 'bg-[var(--color-accent-hover)]'
    
    # Surface Hover Backgrounds
    $content = $content -replace 'bg-slate-100', 'bg-[var(--color-surface-hover)]'
    $content = $content -replace 'bg-slate-50', 'bg-[var(--color-surface-hover)]'
    
    # Alert Backgrounds
    $content = $content -replace 'bg-\[\#FDEBEC\]', 'bg-[var(--color-alert-red-bg)]'
    $content = $content -replace 'bg-\[\#EDF3EC\]', 'bg-[var(--color-alert-green-bg)]'
    $content = $content -replace 'bg-\[\#E1F3FE\]', 'bg-[var(--color-alert-blue-bg)]'
    $content = $content -replace 'bg-\[\#FBF3DB\]', 'bg-[var(--color-alert-yellow-bg)]'

    # Borders
    $content = $content -replace 'border-\[\#EAEAEA\]', 'border-[var(--color-border)]'
    $content = $content -replace 'border-slate-900', 'border-[var(--color-accent)]'
    $content = $content -replace 'border-slate-800', 'border-[var(--color-accent-hover)]'
    $content = $content -replace 'border-slate-300', 'border-[var(--color-border)]'
    $content = $content -replace 'border-slate-200', 'border-[var(--color-border)]'
    $content = $content -replace 'border-slate-100', 'border-[var(--color-border)]'
    
    $content = $content -replace 'border-\[\#FDEBEC\]', 'border-[var(--color-alert-red-border)]'
    $content = $content -replace 'border-\[\#EDF3EC\]', 'border-[var(--color-alert-green-border)]'
    $content = $content -replace 'border-\[\#E1F3FE\]', 'border-[var(--color-alert-blue-bg)]' # Mapping border to bg variable if border variable doesn't exist

    # Text Primary
    $content = $content -replace 'text-slate-900', 'text-[var(--color-text-primary)]'
    $content = $content -replace 'text-slate-800', 'text-[var(--color-text-primary)]'
    $content = $content -replace 'text-slate-700', 'text-[var(--color-text-primary)]'
    $content = $content -replace 'text-black', 'text-[var(--color-text-primary)]'
    $content = $content -replace 'text-\[\#111111\]', 'text-[var(--color-text-primary)]'
    
    # Text Secondary
    $content = $content -replace 'text-slate-600', 'text-[var(--color-text-secondary)]'
    $content = $content -replace 'text-slate-500', 'text-[var(--color-text-secondary)]'
    $content = $content -replace 'text-slate-400', 'text-[var(--color-text-secondary)]'
    $content = $content -replace 'text-\[\#787774\]', 'text-[var(--color-text-secondary)]'
    
    # Misc Text
    $content = $content -replace 'text-\[\#EAEAEA\]', 'text-[var(--color-border)]'
    
    # Alert Texts
    $content = $content -replace 'text-\[\#9F2F2D\]', 'text-[var(--color-alert-red-text)]'
    $content = $content -replace 'text-\[\#346538\]', 'text-[var(--color-alert-green-text)]'
    $content = $content -replace 'text-\[\#1F6C9F\]', 'text-[var(--color-alert-blue-text)]'
    $content = $content -replace 'text-\[\#956400\]', 'text-[var(--color-alert-yellow-text)]'

    if ($content -cne $oldContent) {
        Set-Content -Path $f.FullName -Value $content -NoNewline
        Write-Output "Updated $($f.Name)"
    }
}
