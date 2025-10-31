-- Initialize Payment Platform Database
-- This script runs automatically when PostgreSQL container starts for the first time
-- Runs after init-db.sh has created the database

-- Connect to payment_platform database
\c payment_platform

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas (if needed for future use)
-- CREATE SCHEMA IF NOT EXISTS payment;
-- CREATE SCHEMA IF NOT EXISTS onboarding;

-- Ensure permissions are set
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Payment Platform database extensions and permissions configured successfully';
END $$;

