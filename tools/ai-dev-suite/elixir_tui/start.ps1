# AI Dev Suite TUI – Startup script (Windows PowerShell)
# Installs Elixir if needed, then runs the app.
# Run: .\start.ps1   or: powershell -ExecutionPolicy Bypass -File .\start.ps1

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host ""
Write-Host "● " -NoNewline; Write-Host "Zerwiz AI" -ForegroundColor Red -NoNewline; Write-Host " Dev Suite TUI – WhyNot Productions" -ForegroundColor White
Write-Host "Checking dependencies..." -ForegroundColor DarkGray
Write-Host ""

function Install-Elixir {
    # Try winget first
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "Installing Elixir via winget..." -ForegroundColor DarkGray
        winget install -e --id Elixir.Elixir --accept-package-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        return
    }
    # Try Chocolatey
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "Installing Elixir via Chocolatey..." -ForegroundColor DarkGray
        choco install elixir -y
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        return
    }
    Write-Host "Install Elixir manually: https://elixir-lang.org/install.html" -ForegroundColor Red
    Write-Host "Or install Chocolatey: https://chocolatey.org/install" -ForegroundColor DarkGray
    exit 1
}

# Check Elixir
if (-not (Get-Command mix -ErrorAction SilentlyContinue)) {
    Install-Elixir
    # Refresh PATH and retry
    if (-not (Get-Command mix -ErrorAction SilentlyContinue)) {
        Write-Host "Elixir installed. Please close and reopen your terminal, then run .\start.ps1 again." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Starting Zerwiz AI Dev Suite TUI..." -ForegroundColor DarkGray
Write-Host ""
mix deps.get 2>$null
mix run
