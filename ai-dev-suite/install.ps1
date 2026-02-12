# Zerwiz AI Dev Suite – WhyNot Productions (Windows PowerShell)
# Displays install commands and optionally installs tools.
# Run: irm https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.ps1 | iex
# Install one: irm ... | iex -ArgumentList ollama

param([string]$Tool = "")

$ErrorActionPreference = "Stop"
$SetupBase = "https://raw.githubusercontent.com/zerwiz/setup/main"

function Write-Header {
    Write-Host ""
    Write-Host "  " -NoNewline
    Write-Host "●" -ForegroundColor Red -NoNewline
    Write-Host " " -NoNewline
    Write-Host "Zerwiz AI" -ForegroundColor Red -NoNewline
    Write-Host " " -NoNewline
    Write-Host "Dev Suite" -ForegroundColor White
    Write-Host "  Installation commands for AI development." -ForegroundColor DarkGray
    Write-Host "  WhyNot Productions · whynotproductions.netlify.app" -ForegroundColor DarkGray
}

function Write-Section($Title) {
    Write-Host ""
    Write-Host " $Title" -ForegroundColor White
    Write-Host " ----------------------------------------------------------------" -ForegroundColor DarkGray
}

function Write-Tool($Name, $Desc, $Cmd, $Url) {
    Write-Host ""
    Write-Host " $Name" -ForegroundColor White
    Write-Host " $Desc" -ForegroundColor DarkGray
    Write-Host "   " -NoNewline
    Write-Host "▸ " -ForegroundColor Red -NoNewline
    Write-Host $Cmd -ForegroundColor Cyan
    Write-Host "   $Url" -ForegroundColor DarkGray
}

function Write-Card($Name, $Desc, $Url) {
    Write-Host ""
    Write-Host " $Name" -ForegroundColor White
    Write-Host " $Desc" -ForegroundColor DarkGray
    Write-Host "   $Url" -ForegroundColor DarkGray
}

function Install-Zed {
    Write-Host "`nInstalling Zed..." -ForegroundColor White
    winget install -e --id ZedIndustries.Zed
}

function Install-OpenCode {
    Write-Host "`nInstalling OpenCode..." -ForegroundColor White
    if (Get-Command scoop -ErrorAction SilentlyContinue) {
        scoop install opencode
        return
    }
    $dir = Join-Path $env:USERPROFILE ".opencode\bin"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $release = Invoke-RestMethod "https://api.github.com/repos/anomalyco/opencode/releases/latest"
    $latest = $release.tag_name.TrimStart('v')
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $asset = $release.assets | Where-Object { $_.name -match "opencode-windows-$arch\.zip$" } | Select-Object -First 1
    if (-not $asset) {
        Write-Host "CLI zip not found. Install via: scoop install opencode, or download from https://opencode.ai" -ForegroundColor Yellow
        return
    }
    $zip = Join-Path $env:TEMP "opencode-install.zip"
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zip -UseBasicParsing
    $extractDir = Join-Path $env:TEMP "opencode-extract"
    if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
    Expand-Archive -Path $zip -DestinationPath $extractDir -Force
    $exe = Get-ChildItem -Path $extractDir -Recurse -Filter "opencode*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($exe) { Copy-Item $exe.FullName (Join-Path $dir "opencode.exe") -Force }
    Remove-Item $zip -Force -ErrorAction SilentlyContinue
    Remove-Item $extractDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Installed to $dir. Add to PATH: `$env:USERPROFILE\.opencode\bin" -ForegroundColor DarkGray
}

function Install-Ollama {
    Write-Host "`nInstalling Ollama..." -ForegroundColor White
    $url = "https://ollama.com/download/OllamaSetup.exe"
    $exe = Join-Path $env:TEMP "OllamaSetup.exe"
    Invoke-WebRequest -Uri $url -OutFile $exe -UseBasicParsing
    Start-Process -FilePath $exe -Wait
}

function Install-LMStudio {
    Write-Host "`nInstalling LM Studio..." -ForegroundColor White
    winget install -e --id ElementLabs.LMStudio
}

function Install-OpenClaw {
    Write-Host "`nInstalling OpenClaw..." -ForegroundColor White
    if (Get-Command bash -ErrorAction SilentlyContinue) {
        irm https://openclaw.ai/install.sh | bash
    } else {
        Write-Host "Git Bash or WSL required. Download from: https://openclaw.ai" -ForegroundColor Yellow
    }
}

function Install-Workshop {
    Write-Host "`nRunning Workshop Setup..." -ForegroundColor White
    if (Get-Command bash -ErrorAction SilentlyContinue) {
        irm "$SetupBase/setup.sh" | bash
    } else {
        Write-Host "Workshop setup requires bash. Install Git for Windows, then run:" -ForegroundColor Yellow
        Write-Host "  irm $SetupBase/setup.sh | bash" -ForegroundColor Cyan
    }
}

# Main
Write-Header

# Core Tools
Write-Section "Core Tools"
Write-Tool "1. Zed" "High performance code editor. Built for collaboration." "winget install -e --id ZedIndustries.Zed" "https://zed.dev"
Write-Tool "2. OpenCode" "AI code editor. Agents that write and run code." "irm https://opencode.ai/install | iex  (or use bash)" "https://opencode.ai"
Write-Tool "3. Ollama" "Run large language models locally. Simple setup." "irm https://ollama.com/download/OllamaSetup.exe -OutFile OllamaSetup.exe; .\OllamaSetup.exe" "https://ollama.com"
Write-Tool "4. LM Studio" "Local LLM runner. Discover and download models." "winget install -e --id ElementLabs.LMStudio" "https://lmstudio.ai"
Write-Tool "5. OpenClaw" "AI assistant that actually does things. Any OS." "irm https://openclaw.ai/install.sh | bash  (requires Git Bash)" "https://openclaw.ai"
Write-Tool "6. Workshop Setup" "Install Node.js, Git, Elixir, AI Dev Suite TUI." "irm $SetupBase/setup.sh | bash  (requires Git Bash)" "https://github.com/zerwiz/setup"

# Model Libraries
Write-Section "Model Libraries"
Write-Card "Hugging Face" "Open source model hub." "https://huggingface.co"
Write-Card "Civitai" "Platform for stable diffusion models." "https://civitai.com"

# Frameworks
Write-Section "Frameworks and Projects"
Write-Card "Agent OS" "Operating system for AI agents." "https://agent-os.ai | https://github.com/OpenBMB/AgentOS"
Write-Card "BMAD" "Model development and management tools." "https://bmad.ai | https://github.com/bmad-git/bmad"

# Install if -Tool specified
if ($Tool -ne "") {
    $t = $Tool.Trim().ToLower()
    switch ($t) {
        { $_ -in "zed","1" }      { Install-Zed }
        { $_ -in "opencode","2" } { Install-OpenCode }
        { $_ -in "ollama","3" }   { Install-Ollama }
        { $_ -in "lm","4" }       { Install-LMStudio }
        { $_ -in "openclaw","5" } { Install-OpenClaw }
        { $_ -in "workshop","6" } { Install-Workshop }
        default { Write-Host "`nUnknown: $Tool. Use: zed, opencode, ollama, lm, openclaw, workshop" -ForegroundColor Red }
    }
}

# Footer
Write-Host ""
Write-Host "Copy a command above and run it in PowerShell to install." -ForegroundColor DarkGray
Write-Host "Or: irm ... | iex -ArgumentList ollama" -ForegroundColor DarkGray
Write-Host "More: whynotproductions.netlify.app · cal.com/whynotproductions" -ForegroundColor DarkGray
Write-Host ""
