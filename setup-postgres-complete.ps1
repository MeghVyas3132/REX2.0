#!/usr/bin/env pwsh

# REX PostgreSQL Complete Setup Script
param(
    [string]$PostgresPassword = "postgres",
    [string]$RexPassword = "rex"
)

Write-Host "REX PostgreSQL Setup Script" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

# Function to manage pg_hba.conf
function Set-PgHbaAuth {
    param([string]$Method)
    $pgHbaPath = "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
    $content = Get-Content $pgHbaPath -Raw
    $newContent = $content `
        -replace "local\s+all\s+all\s+scram-sha-256", "local   all             all                                     $Method" `
        -replace "host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256", "host    all             all             127.0.0.1/32            $Method" `
        -replace "host\s+all\s+all\s+::1/128\s+scram-sha-256", "host    all             all             ::1/128                 $Method"
    Set-Content -Path $pgHbaPath -Value $newContent -Force
}

# Function to restart PostgreSQL
function Restart-PostgreSQL {
    Write-Host "Restarting PostgreSQL service..." -ForegroundColor Yellow
    Stop-Service -Name "postgresql-x64-16" -Force | Out-Null
    Start-Sleep -Seconds 2
    Start-Service -Name "postgresql-x64-16" | Out-Null
    Start-Sleep -Seconds 3
}

try {
    # Step 1: Enable trust auth temporarily
    Write-Host "`n[1/6] Enabling trust authentication temporarily..." -ForegroundColor Cyan
    Set-PgHbaAuth "trust"
    Restart-PostgreSQL
    
    # Step 2: Create rex user and database
    Write-Host "[2/6] Creating rex user and database..." -ForegroundColor Cyan
    $setupSQL = @"
DROP DATABASE IF EXISTS rex;
DROP USER IF EXISTS rex;
CREATE USER rex WITH ENCRYPTED PASSWORD '$RexPassword';
CREATE DATABASE rex OWNER rex;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rex;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rex;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO rex;
GRANT ALL PRIVILEGES ON DATABASE rex TO rex;
"@
    $setupSQL | psql -h localhost -U postgres -d postgres 2>&1 | Select-String -NotMatch "^$"
    
    # Step 3: Connect to rex database and create extensions
    Write-Host "[3/6] Creating extensions in rex database..." -ForegroundColor Cyan
    @"
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rex;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rex;
"@ | psql -h localhost -U postgres -d rex 2>&1 | Select-String -NotMatch "^$"
    
    # Step 4: Revert to scram-sha-256
    Write-Host "[4/6] Reverting to scram-sha-256 authentication..." -ForegroundColor Cyan
    Set-PgHbaAuth "scram-sha-256"
    Restart-PostgreSQL
    
    # Step 5: Test connection with rex user
    Write-Host "[5/6] Testing connection with rex user..." -ForegroundColor Cyan
    $env:PGPASSWORD = $RexPassword
    $testResult = psql -h localhost -U rex -d rex -c "SELECT version();" 2>&1
    if ($testResult -match "PostgreSQL") {
        Write-Host "✓ Connection successful!" -ForegroundColor Green
    } else {
        Write-Host "✗ Connection failed" -ForegroundColor Red
        Write-Host $testResult
    }
    $env:PGPASSWORD = $null
    
    # Step 6: Summary
    Write-Host "[6/6] Setup complete!" -ForegroundColor Cyan
    Write-Host "`nPostgreSQL Configuration:" -ForegroundColor Green
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Port: 5432" -ForegroundColor White
    Write-Host "  Postgres User: postgres" -ForegroundColor White
    Write-Host "  Postgres Password: $PostgresPassword" -ForegroundColor White
    Write-Host "  Rex User: rex" -ForegroundColor White
    Write-Host "  Rex Password: $RexPassword" -ForegroundColor White
    Write-Host "  Database: rex" -ForegroundColor White
    
} catch {
    Write-Host "Error: $($_.Message)" -ForegroundColor Red
    exit 1
}
