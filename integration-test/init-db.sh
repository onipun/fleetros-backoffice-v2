#!/bin/bash
set -e

# Create multiple databases
# This script creates all databases specified in POSTGRES_MULTIPLE_DATABASES

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "Creating multiple databases: $POSTGRES_MULTIPLE_DATABASES"
    
    # Split the comma-separated list of databases
    IFS=',' read -ra DATABASES <<< "$POSTGRES_MULTIPLE_DATABASES"
    
    for DB in "${DATABASES[@]}"; do
        # Trim whitespace
        DB=$(echo "$DB" | xargs)
        
        echo "Creating database: $DB"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
            CREATE DATABASE "$DB";
            GRANT ALL PRIVILEGES ON DATABASE "$DB" TO "$POSTGRES_USER";
EOSQL
    done
    
    echo "Multiple databases created successfully"
fi

# Run reporting tables initialization on the backoffice database
# This creates dashboard_statistics and revenue_reports tables
if [ -f /docker-entrypoint-initdb.d/02-init-reporting-tables.sql ]; then
    echo "Initializing reporting tables in backoffice database..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "backoffice" -f /docker-entrypoint-initdb.d/02-init-reporting-tables.sql
    echo "Reporting tables initialized successfully"
fi
