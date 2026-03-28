#!/usr/bin/env pwsh

$env:DATABASE_URL = "postgresql://rex:rex@localhost:5432/rex"

Write-Host "REX Database Migration" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "" 

# Check if database exists and has tables
Write-Host "[1/2] Checking database..." -ForegroundColor Cyan
$checkSQL = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
$env:PGPASSWORD = "rex"
$tableCount = & psql -h localhost -U rex -d rex -t -c $checkSQL 2>&1
Write-Host "Existing public tables: $tableCount" -ForegroundColor White

# Run migrations
Write-Host "[2/2] Running migrations..." -ForegroundColor Cyan
Write-Host ""

Push-Location C:\Users\ashbi\REX\REX2.0
& pnpm db:migrate
$exitCode = $LASTEXITCODE
Pop-Location

if ($exitCode -eq 0) {
    Write-Host "`n✓ Migrations completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n⚠ Migration script completed with exit code: $exitCode" -ForegroundColor Yellow
    Write-Host "Check if tables exist in the database..." -ForegroundColor Yellow
}

# Final check
Write-Host "`n[3/2] Verifying tables..." -ForegroundColor Cyan
$finalCheck = & psql -h localhost -U rex -d rex -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>&1
Write-Host "Final table count: $finalCheck" -ForegroundColor White

if ($finalCheck -gt 50) {
    Write-Host "`n✓ Database setup complete! Ready to start services." -ForegroundColor Green
    Write-Host "Run the following in separate terminals:" -ForegroundColor Green
    Write-Host "`n  Terminal 1: `$env:DATABASE_URL=`"postgresql://rex:rex@localhost:5432/rex`"; pnpm --filter @rex/backend dev" -ForegroundColor White
    Write-Host "  Terminal 2: `$env:DATABASE_URL=`"postgresql://rex:rex@localhost:5432/rex`"; pnpm --filter @rex/worker dev" -ForegroundColor White
    Write-Host "  Terminal 3: pnpm --filter @rex/frontend dev" -ForegroundColor White
} else {
    Write-Host "`n⚠ Database may not be fully initialized. Only $finalCheck tables found." -ForegroundColor Red
}

$env:PGPASSWORD = $null
