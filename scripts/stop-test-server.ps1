<#
.SYNOPSIS
    Stop the RemotingTest_Core HTTP server.

.DESCRIPTION
    Kills any running RemotingTest_Core.exe processes.
    Safe to call even if no server is running.
#>

$ErrorActionPreference = 'SilentlyContinue'

$processes = Get-Process -Name "RemotingTest_Core" -ErrorAction SilentlyContinue

if ($processes) {
    $count = @($processes).Count
    Write-Host "Killing $count RemotingTest_Core process(es)..." -ForegroundColor Yellow
    Stop-Process -Name "RemotingTest_Core" -Force
    Write-Host "Done." -ForegroundColor Green
} else {
    Write-Host "No RemotingTest_Core processes found." -ForegroundColor Gray
}
