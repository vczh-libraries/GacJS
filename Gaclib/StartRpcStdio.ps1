$ErrorActionPreference = 'Stop'

function ConvertTo-WindowsCommandArgument {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Argument
    )

    if ($Argument.Length -eq 0) {
        return '""'
    }
    if ($Argument -notmatch '[\s"]') {
        return $Argument
    }

    $result = [System.Text.StringBuilder]::new()
    [void]$result.Append('"')
    $backslashes = 0
    foreach ($character in $Argument.ToCharArray()) {
        if ($character -eq '\') {
            $backslashes++
        }
        elseif ($character -eq '"') {
            [void]$result.Append('\' * ($backslashes * 2 + 1))
            [void]$result.Append('"')
            $backslashes = 0
        }
        else {
            [void]$result.Append('\' * $backslashes)
            [void]$result.Append($character)
            $backslashes = 0
        }
    }
    [void]$result.Append('\' * ($backslashes * 2))
    [void]$result.Append('"')
    return $result.ToString()
}

function Assert-LastExitCode {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Description
    )

    if ($LASTEXITCODE -ne 0) {
        throw "$Description failed with exit code $LASTEXITCODE."
    }
}

$gaclibRoot = $PSScriptRoot
$gacjsRoot = Split-Path -Parent $gaclibRoot
$workspaceRoot = Split-Path -Parent $gacjsRoot
$workflowRoot = Join-Path $workspaceRoot 'Workflow'
$workflowUnitTestRoot = Join-Path $workflowRoot 'Test\UnitTest'
$workflowTestRoot = Join-Path $workflowRoot 'Test'
$workflowBuildScript = Join-Path $workflowRoot '.github\Scripts\copilotBuild.ps1'
$driver = Join-Path $workflowUnitTestRoot 'x64\Debug\RpcStdioTest_Driver.exe'
$skipList = Join-Path $workflowTestRoot 'StartRpcStdio_DtorSkipList.txt'
$cliEntry = Join-Path $gaclibRoot 'rpc-test\rpc-test-cli\lib\src\cli.js'

foreach ($requiredPath in @($workflowUnitTestRoot, $workflowBuildScript, $skipList)) {
    if (-not (Test-Path -LiteralPath $requiredPath)) {
        throw "Required Workflow path does not exist: $requiredPath"
    }
}

Write-Host 'Building Workflow Debug x64 tests...'
Push-Location $workflowUnitTestRoot
try {
    & $workflowBuildScript -Configuration Debug -Platform x64
    Assert-LastExitCode 'Workflow build'
}
finally {
    Pop-Location
}

Write-Host 'Building GacJS...'
Push-Location $gaclibRoot
try {
    & yarn build
    Assert-LastExitCode 'GacJS build'
}
finally {
    Pop-Location
}

foreach ($requiredFile in @($driver, $cliEntry)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw "Required executable or entry point was not built: $requiredFile"
    }
}

$node = Get-Command node -CommandType Application -ErrorAction Stop | Select-Object -First 1
$serviceCommand = '{0} {1}' -f `
    (ConvertTo-WindowsCommandArgument $node.Source), `
    (ConvertTo-WindowsCommandArgument $cliEntry)

Write-Host "Starting: $driver $serviceCommand $skipList"
Push-Location $workflowTestRoot
try {
    # Invoke the driver in this console so its stdout and stderr stay visible.
    & $driver $serviceCommand $skipList
    $driverExitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

exit $driverExitCode
