-- Drop existing rex user and database if they exist
DROP DATABASE IF EXISTS rex;
DROP USER IF EXISTS rex;

-- Create new rex user
CREATE USER rex WITH ENCRYPTED PASSWORD 'rex';

-- Create rex database owned by rex
CREATE DATABASE rex OWNER rex;

-- Grant all privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rex;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rex;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO rex;
GRANT ALL PRIVILEGES ON DATABASE rex TO rex;
GRANT ALL PRIVILEGES ON SCHEMA public TO rex;

-- Connect to rex database and create extensions
\c rex

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Final setup
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rex;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rex;

SELECT 'REX setup complete!' as status;
