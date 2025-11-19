<#
PowerShell helper to apply reseller-related SQL migrations to a MySQL database.
Run from repository root in PowerShell. Prompts for credentials.

Usage:
  pwsh ./server/scripts/apply_reseller_migrations.ps1
  (or in Windows PowerShell) .\server\scripts\apply_reseller_migrations.ps1
#>

Write-Host "Apply reseller-related SQL migrations"

$dbUser = Read-Host -Prompt 'DB user (e.g. billsnack)'
$dbName = Read-Host -Prompt 'Database name (default: billsnack)'
if (-not $dbName) { $dbName = 'billsnack' }
$pwdSecure = Read-Host -Prompt 'DB password (will be hidden)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($pwdSecure)
$dbPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

$base = Join-Path -Path (Get-Location) -ChildPath 'server/models/reseller'

$files = @(
  'create_reseller_profiles.sql',
  'create_telegram_users.sql',
  'add_reseller_id.sql',
  'create_reseller_connections.sql'
)

foreach ($f in $files) {
  $path = Join-Path $base $f
  if (-Not (Test-Path $path)) {
    Write-Warning "File missing: $path — skipping"
    continue
  }
  Write-Host "Applying $f ..."
  # Note: mysql client must be on PATH. We pass password directly to avoid interactive prompt.
  $cmd = "mysql -u $dbUser -p`"$dbPass`" $dbName < `"$path`""
  # Use cmd.exe/sh style invocation to allow input redirection
  cmd /c $cmd
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed applying $f (exit code $LASTEXITCODE). Aborting."
    break
  }
}

Write-Host "Migrations complete. Consider running a DB health check or starting the server." -ForegroundColor Green
