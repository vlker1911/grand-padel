# One-shot oprava: nahradí všechny výskyty starého bordó "801A28" za nové "8C1325".
# Používá .NET File IO s UTF-8 (bez BOM), takže nepoškodí české znaky.

$root = Join-Path $PSScriptRoot ".." | Resolve-Path
$srcDir = Join-Path $root "src"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Path $srcDir -Recurse -Include *.ts, *.tsx, *.css -File
$count = 0

foreach ($f in $files) {
    $content = [System.IO.File]::ReadAllText($f.FullName, $utf8NoBom)
    if ($content.Contains("801A28")) {
        $new = $content.Replace("801A28", "8C1325")
        [System.IO.File]::WriteAllText($f.FullName, $new, $utf8NoBom)
        $count++
        Write-Output "OK: $($f.FullName.Substring($srcDir.Path.Length + 1))"
    }
}

Write-Output ""
Write-Output "Celkem upraveno: $count souborů"
