# Run all three Ceylon Step projects with one command.
# Usage:  .\dev.ps1
# Each project opens in its own PowerShell window so logs stay separate.

$ErrorActionPreference = "Stop"

# Package manager - flip to "npm" if you prefer (backend has only a pnpm lockfile).
$pm = "pnpm"

# Project root = folder this script lives in.
$root = $PSScriptRoot

# name -> script to run
$projects = [ordered]@{
    "ceylon-step-back"   = "start:dev"   # NestJS API   (watch)
    "ceylon-steps-front" = "dev"          # Next public  (port 3000)
    "ceylon-steps-admin" = "dev"          # Next admin   (port 3001)
}

foreach ($name in $projects.Keys) {
    $dir    = Join-Path $root $name
    $script = $projects[$name]

    if (-not (Test-Path $dir)) {
        Write-Warning "Skipping $name - folder not found at $dir"
        continue
    }

    Write-Host "Starting $name ($pm run $script)..." -ForegroundColor Cyan

    # Open a new window, cd into the project, run the dev/start script.
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$dir'; `$Host.UI.RawUI.WindowTitle = '$name'; $pm run $script"
    )
}

Write-Host "All three projects launched in separate windows." -ForegroundColor Green
