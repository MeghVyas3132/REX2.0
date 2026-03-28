-- REX PostgreSQL Setup Script
-- Run with: psql -U postgres -f setup-postgres.sql

-- Create rex user if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rex') THEN
    CREATE USER rex WITH PASSWORD 'rex';
  END IF;
END$$;

-- Create rex database if it doesn't exist
SELECT 'CREATE DATABASE rex' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'rex')\gexec

-- Grant privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rex;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rex;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO rex;

GRANT ALL PRIVILEGES ON DATABASE rex TO rex;
GRANT ALL PRIVILEGES ON SCHEMA public TO rex;
GRANT USAGE ON SCHEMA public TO rex;
GRANT CREATE ON SCHEMA public TO rex;

-- Connect to rex database and enable pgvector
\c rex

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant privileges in rex database
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rex;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rex;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO rex;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rex;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rex;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rex;

-- Verify setup
SELECT 'PostgreSQL setup complete!' AS status;
SELECT datname FROM pg_database WHERE datname = 'rex' LIMIT 1;
SELECT rolname FROM pg_roles WHERE rolname = 'rex' LIMIT 1;
