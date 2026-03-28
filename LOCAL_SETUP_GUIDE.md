# REX Locally Started - Setup Summary

## ✅ Database Setup Completed

- **PostgreSQL**: Running on `localhost:5432`
- **User**: rex / Password: rex
- **Database**: rex
- **Extensions**: pgvector, uuid-ossp enabled

## ❌ Known Issue: Database Migrations

The database migrations need to be run explicitly. Run this command in PowerShell:

```powershell
$env:DATABASE_URL="postgresql://rex:rex@localhost:5432/rex"
pnpm db:migrate
```

## Services Setup

### Port Configuration
- **Frontend**: 3000
- **Backend**: 4000 (or 4001 if port in use)
- **Worker**: Background service
- **Redis**: 6379 (required for queue)
- **PostgreSQL**: 5432

### Environment File (.env)
```
DATABASE_URL=postgresql://rex:rex@localhost:5432/rex
REDIS_HOST=localhost
REDIS_PORT=6379
BACKEND_PORT=4000
FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Quick Start Commands

```powershell
# Terminal 1 - Backend  
$env:DATABASE_URL="postgresql://rex:rex@localhost:5432/rex"
pnpm --filter @rex/backend dev

# Terminal 2 - Worker
$env:DATABASE_URL="postgresql://rex:rex@localhost:5432/rex"
pnpm --filter @rex/worker dev

# Terminal 3 - Frontend
pnpm --filter @rex/frontend dev
```

## Access Points

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Network Access: http://192.168.1.5:3000 (frontend)

## Troubleshooting

### Port Already in Use
If port 4000 is in use, change BACKEND_PORT:
```powershell
$env:BACKEND_PORT=4001
```

### Database Errors
If services report "relation does not exist", run migrations:
```powershell
$env:DATABASE_URL="postgresql://rex:rex@localhost:5432/rex"
pnpm db:migrate
```

### PostgreSQL Password Issues
If you need to reset the postgres password:
```powershell
.\setup-pg-simple.ps1
```

## Next Steps

1. Run `pnpm db:migrate` to ensure database schema is initialized
2. Start services in separate terminals
3. Navigate to http://localhost:3000 for the frontend
4. Check http://localhost:4000/health for backend health status
