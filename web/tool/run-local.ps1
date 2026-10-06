$ErrorActionPreference = 'Stop'
$env:NEXT_TELEMETRY_DISABLED = '1'
Set-Location (Split-Path -Parent $PSScriptRoot)
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) { $nodePath = $nodeCommand.Source } else {
  $nodePath = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Install Node.js 22 or newer, then reopen PowerShell.' }
if (-not (Test-Path -LiteralPath 'node_modules\next\dist\bin\next')) { throw 'Run pnpm install in the web folder first.' }
& $nodePath tool/setup.mjs
if ($LASTEXITCODE -ne 0) { throw 'Local setup failed.' }
& $nodePath node_modules/next/dist/bin/next dev --hostname 127.0.0.1
