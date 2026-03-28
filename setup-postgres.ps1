# REX PostgreSQL Setup Script
# This script sets up PostgreSQL for local development

$postgresPassword = Read-Host -Prompt "Enter postgres user password" -AsSecureString
$securePassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($postgresPassword))

# Write credentials to pgpass file temporarily with restricted permissions
$pgpassPath = "$($env:APPDATA)\postgresql\pgpass.conf"
$pgpassDir = Split-Path -Parent $pgpassPath
if (!(Test-Path $pgpassDir)) {
    New-Item -ItemType Directory -Path $pgpassDir -Force | Out-Null
}

$pgpassContent = "localhost:5432:postgres:postgres:$securePassword"
Set-Content -Path $pgpassPath -Value $pgpassContent -Force
icacls $pgpassPath /inheritance:r /grant:r "${env:USERNAME}:F" | Out-Null

Write-Host "Running PostgreSQL setup..." -ForegroundColor Green

# Run setup script
psql -h localhost -U postgres -d postgres -f setup-postgres.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "PostgreSQL setup failed. Check credentials and try again." -ForegroundColor Red
}

# Clean up pgpass
Remove-Item -Path $pgpassPath -Force -ErrorAction SilentlyContinue
Write-Host "Setup complete. You can now run: pnpm install && pnpm db:migrate" -ForegroundColor Yellow
