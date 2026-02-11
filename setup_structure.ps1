# Nazwa głównego folderu
$root = "projekt01"

# Lista folderów do utworzenia
$folders = @(
    "$root\assets\icons",
    "$root\assets\docs",
    "$root\css",
    "$root\js\core",
    "$root\js\modules",
    "$root\js\utils",
    "$root\pages",
    "$root\scripts"
)

# Lista plików do utworzenia
$files = @(
    "$root\css\shared.css",
    "$root\css\auth.css",
    "$root\css\operator-hmi.css",
    "$root\css\maintenance.css",
    "$root\css\manager.css",
    "$root\js\core\config.js",
    "$root\js\core\auth.js",
    "$root\js\modules\operator.js",
    "$root\js\modules\maintenance.js",
    "$root\js\modules\manager.js",
    "$root\js\utils\charts.js",
    "$root\js\utils\export-tool.js",
    "$root\js\utils\formatters.js",
    "$root\pages\operator.html",
    "$root\pages\maintenance.html",
    "$root\pages\manager.html",
    "$root\scripts\simulator.py",
    "$root\index.html",
    "$root\README.md"
)

# Tworzenie folderów
foreach ($folder in $folders) {
    if (-not (Test-Path -Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
        Write-Host "Utworzono folder: $folder" -ForegroundColor Green
    } else {
        Write-Host "Folder istnieje: $folder" -ForegroundColor Yellow
    }
}

# Tworzenie plików
foreach ($file in $files) {
    if (-not (Test-Path -Path $file)) {
        New-Item -ItemType File -Path $file | Out-Null
        Write-Host "Utworzono plik: $file" -ForegroundColor Cyan
    } else {
        Write-Host "Plik istnieje: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nStruktura została utworzona pomyślnie w folderze: $root" -ForegroundColor Magenta
Pause