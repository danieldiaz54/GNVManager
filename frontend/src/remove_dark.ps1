$targetFolder = "c:\Users\DesarrolloIT Android\Desktop\Daniel\GNV\GNV Manager\frontend\src"
$files = Get-ChildItem -Path $targetFolder -Recurse -Include *.tsx

foreach ($f in $files) {
    $content = Get-Content -Path $f.FullName -Raw
    $oldContent = $content

    $content = $content -replace '\s*dark:[a-zA-Z0-9\-\/\[\]#\.:]+', ''

    if ($content -cne $oldContent) {
        Set-Content -Path $f.FullName -Value $content -NoNewline
        Write-Output "Removed dark mode classes from $($f.Name)"
    }
}
