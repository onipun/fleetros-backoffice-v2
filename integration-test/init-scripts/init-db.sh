#!/bin/bash
set -e

# This script creates multiple databases for the PostgreSQL container
# It reads the POSTGRES_MULTIPLE_DATABASES environment variable

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    -- Create backoffice database for the application
    CREATE DATABASE backoffice;
    GRANT ALL PRIVILEGES ON DATABASE backoffice TO $POSTGRES_USER;

    -- Create keycloak database for Keycloak
    CREATE DATABASE keycloak;
    GRANT ALL PRIVILEGES ON DATABASE keycloak TO $POSTGRES_USER;

    -- Create payment_platform database for payment services
    CREATE DATABASE payment_platform;
    GRANT ALL PRIVILEGES ON DATABASE payment_platform TO $POSTGRES_USER;
EOSQL

echo "✅ Created databases: backoffice, keycloak, payment_platform"

# Initialize backoffice database schema
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "backoffice" <<-EOSQL
    -- Create public schema for application tables
    CREATE SCHEMA IF NOT EXISTS public;
    GRANT ALL PRIVILEGES ON SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;

    -- Set default privileges for future objects
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;
EOSQL

echo "✅ Initialized backoffice database"

# Initialize keycloak database schema
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "keycloak" <<-EOSQL
    -- Create public schema for Keycloak tables
    CREATE SCHEMA IF NOT EXISTS public;
    GRANT ALL PRIVILEGES ON SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;

    -- Set default privileges for future objects
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;
EOSQL

echo "✅ Initialized keycloak database"

# Initialize payment_platform database schema
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "payment_platform" <<-EOSQL
    -- Create public schema for payment platform tables
    CREATE SCHEMA IF NOT EXISTS public;
    GRANT ALL PRIVILEGES ON SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;

    -- Set default privileges for future objects
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;
EOSQL

echo "✅ Initialized payment_platform database"
echo "✅ Database initialization complete!"

