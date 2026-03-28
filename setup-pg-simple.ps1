#!/usr/bin/env pwsh

Write-Host "REX PostgreSQL Setup" -ForegroundColor Green

# Function to manage pg_hba.conf
function Set-PgHbaAuth($method) {
    $path = "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
    $content = Get-Content $path -Raw
    $content = $content -replace "local\s+all\s+all\s+scram-sha-256", "local   all             all                                     $method"
    $content = $content -replace "host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256", "host    all             all             127.0.0.1/32            $method"
    $content = $content -replace "host\s+all\s+all\s+::1/128\s+scram-sha-256", "host    all             all             ::1/128                 $method"
    Set-Content -Path $path -Value $content -Force
}

function Restart-PG {
    Stop-Service -Name "postgresql-x64-16" -Force | Out-Null
    Start-Sleep -Seconds 2
    Start-Service -Name "postgresql-x64-16" | Out-Null
    Start-Sleep -Seconds 3
}

Write-Host "1. Enabling trust auth..." -ForegroundColor Cyan
Set-PgHbaAuth "trust"
Restart-PG

Write-Host "2. Creating rex user..." -ForegroundColor Cyan
psql.exe -h localhost -U postgres -d postgres -c "DROP DATABASE IF EXISTS rex CASCADE; DROP USER IF EXISTS rex; CREATE USER rex WITH PASSWORD 'rex'; CREATE DATABASE rex OWNER rex;" 2>&1 | Out-Null

Write-Host "3. Enabling extensions..." -ForegroundColor Cyan
psql.exe -h localhost -U postgres -d rex -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS uuid-ossp;" 2>&1 | Out-Null

Write-Host "4. Reverting to scram-sha-256..." -ForegroundColor Cyan
Set-PgHbaAuth "scram-sha-256"
Restart-PG

Write-Host "5. Testing connection..." -ForegroundColor Cyan
$env:PGPASSWORD = "rex"
$result = psql.exe -h localhost -U rex -d rex -c "SELECT 1;" 2>&1
$env:PGPASSWORD = $null

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! PostgreSQL is ready." -ForegroundColor Green
} else {
    Write-Host "Connection test output: $result" -ForegroundColor Yellow
}
