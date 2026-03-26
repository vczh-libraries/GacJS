<#
.SYNOPSIS
    Build and start the RemotingTest_Core HTTP server.

.DESCRIPTION
    Builds the GacUISrc solution (Debug x64) using copilotBuild.ps1 from the GacUI
    submodule, then starts the RemotingTest_Core HTTP test server on localhost:8888.
    
    The server blocks the terminal, so it is launched via 'start' in a separate window.
    Use stop-test-server.ps1 to kill it.

.PARAMETER SkipBuild
    Skip the build step if the executable already exists.
#>

param(
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$GacUIRoot = Join-Path $RepoRoot "GacUI"
$BuildScript = Join-Path $GacUIRoot ".github\Scripts\copilotBuild.ps1"
$SolutionDir = Join-Path $GacUIRoot "Test\GacUISrc"
$ExePath = Join-Path $SolutionDir "x64\Debug\RemotingTest_Core.exe"

# Build if needed
if (-not $SkipBuild) {
    if (-not (Test-Path $BuildScript)) {
        Write-Error "Build script not found at: $BuildScript"
        exit 1
    }

    Write-Host "Building GacUISrc solution (Debug x64) via copilotBuild.ps1..." -ForegroundColor Cyan
    Push-Location $SolutionDir
    try {
        & $BuildScript -Configuration Debug -Platform x64
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build failed with exit code $LASTEXITCODE"
            exit $LASTEXITCODE
        }
        Write-Host "Build succeeded." -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "Skipping build (SkipBuild flag set)." -ForegroundColor Yellow
}

# Verify the executable exists
if (-not (Test-Path $ExePath)) {
    Write-Error "Executable not found at: $ExePath"
    exit 1
}

# Kill any existing instance
$existing = Get-Process -Name "RemotingTest_Core" -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Killing existing RemotingTest_Core process..." -ForegroundColor Yellow
    Stop-Process -Name "RemotingTest_Core" -Force
    Start-Sleep -Seconds 1
}

# Start the server (blocks the terminal, so use Start-Process)
Write-Host "Starting RemotingTest_Core /Http ..." -ForegroundColor Cyan
Write-Host "Server will listen on http://localhost:8888" -ForegroundColor Cyan
Write-Host "Use stop-test-server.ps1 or Ctrl+C in the server window to stop." -ForegroundColor Gray

Start-Process -FilePath $ExePath -ArgumentList "/FCT /Http"

Write-Host "Server started in a separate window." -ForegroundColor Green
