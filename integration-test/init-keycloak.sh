#!/bin/bash

# Keycloak Realm Initialization Script for Docker Container
# This runs automatically after Keycloak starts

set -e

KEYCLOAK_URL="http://keycloak:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALM_NAME="backoffice"
CLIENT_ID="backoffice-client"
CLIENT_SECRET="kypYMXtLSCxDjw8D6kNUSTwWigJEkqiF"

echo "=========================================="
echo "Keycloak Realm Auto-Setup"
echo "=========================================="

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
max_retries=60
retry_count=0
until curl -sf "${KEYCLOAK_URL}/health/ready" > /dev/null 2>&1; do
    retry_count=$((retry_count + 1))
    if [ $retry_count -ge $max_retries ]; then
        echo "ERROR: Keycloak did not become ready in time"
        exit 1
    fi
    echo "Waiting for Keycloak... ($retry_count/$max_retries)"
    sleep 3
done
echo "✓ Keycloak is ready"

# Additional delay to ensure Keycloak is fully initialized
#sleep 5

# Get admin access token
echo "Getting admin access token..."
ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" == "null" ]; then
    echo "ERROR: Failed to get admin token"
    exit 1
fi
echo "✓ Admin token obtained"

# Check if realm already exists
echo "Checking if realm '$REALM_NAME' exists..."
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

if [ "$REALM_EXISTS" == "200" ]; then
    echo "✓ Realm '$REALM_NAME' already exists"
else
    # Create realm
    echo "Creating realm '$REALM_NAME'..."
    CREATE_REALM_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${KEYCLOAK_URL}/admin/realms" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "realm": "'${REALM_NAME}'",
        "enabled": true,
        "registrationAllowed": true,
        "registrationEmailAsUsername": false,
        "resetPasswordAllowed": true,
        "rememberMe": true,
        "verifyEmail": false,
        "loginWithEmailAllowed": true,
        "duplicateEmailsAllowed": false,
        "sslRequired": "none",
        "accessTokenLifespan": 3600,
        "accessTokenLifespanForImplicitFlow": 900,
        "ssoSessionIdleTimeout": 1800,
        "ssoSessionMaxLifespan": 36000,
        "offlineSessionIdleTimeout": 2592000,
        "accessCodeLifespan": 60,
        "accessCodeLifespanUserAction": 300,
        "accessCodeLifespanLogin": 1800
      }')

    HTTP_CODE=$(echo "$CREATE_REALM_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" == "201" ]; then
        echo "✓ Realm '$REALM_NAME' created successfully"
    else
        echo "⚠ Realm creation returned status: $HTTP_CODE"
    fi
fi

# Get fresh admin token
ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

# Check if client already exists
echo "Checking if client '$CLIENT_ID' exists..."
CLIENT_UUID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id // empty')

if [ -n "$CLIENT_UUID" ]; then
    echo "✓ Client '$CLIENT_ID' already exists (UUID: $CLIENT_UUID)"

    # Update existing client to ensure correct configuration
    echo "Updating client configuration..."
    curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "clientId": "'${CLIENT_ID}'",
        "enabled": true,
        "protocol": "openid-connect",
        "publicClient": false,
        "secret": "'${CLIENT_SECRET}'",
        "directAccessGrantsEnabled": true,
        "standardFlowEnabled": true,
        "implicitFlowEnabled": false,
        "serviceAccountsEnabled": true,
        "authorizationServicesEnabled": false,
        "redirectUris": [
          "https://oauth.pstmn.io/v1/callback",
          "https://oauth.pstmn.io/v1/browser-callback",
          "http://localhost:8082/*",
          "http://localhost:8082/login/oauth2/code/keycloak",
          "http://localhost:8082/login/oauth2/code/*",
          "http://localhost:8080/*",
          "http://localhost:3000/*",
          "http://backoffice-service:8080/*"
        ],
        "webOrigins": [
          "https://oauth.pstmn.io",
          "http://localhost:8082",
          "http://localhost:8080",
          "http://localhost:3000",
          "http://backoffice-service:8080",
          "+"
        ],
        "attributes": {
          "access.token.lifespan": "3600"
        }
      }'
    echo "✓ Client '$CLIENT_ID' updated"
else
    # Create client
    echo "Creating client '$CLIENT_ID'..."
    CREATE_CLIENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "clientId": "'${CLIENT_ID}'",
        "enabled": true,
        "protocol": "openid-connect",
        "publicClient": false,
        "secret": "'${CLIENT_SECRET}'",
        "directAccessGrantsEnabled": true,
        "standardFlowEnabled": true,
        "implicitFlowEnabled": false,
        "serviceAccountsEnabled": true,
        "authorizationServicesEnabled": false,
        "redirectUris": [
          "https://oauth.pstmn.io/v1/callback",
          "https://oauth.pstmn.io/v1/browser-callback",
          "http://localhost:8082/*",
          "http://localhost:8082/login/oauth2/code/keycloak",
          "http://localhost:8082/login/oauth2/code/*",
          "http://localhost:8080/*",
          "http://localhost:3000/*",
          "http://backoffice-service:8080/*"
        ],
        "webOrigins": [
          "https://oauth.pstmn.io",
          "http://localhost:8082",
          "http://localhost:8080",
          "http://localhost:3000",
          "http://backoffice-service:8080",
          "+"
        ],
        "attributes": {
          "access.token.lifespan": "3600"
        }
      }')

    HTTP_CODE=$(echo "$CREATE_CLIENT_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" == "201" ]; then
        echo "✓ Client '$CLIENT_ID' created successfully"
    else
        echo "⚠ Client creation returned status: $HTTP_CODE"
    fi
fi

# Create default roles
echo "Setting up default roles..."
for ROLE in "ADMIN" "USER" "MANAGER"; do
    ROLE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/roles" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "'${ROLE}'",
        "description": "Default '${ROLE}' role"
      }')

    HTTP_CODE=$(echo "$ROLE_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" == "201" ]; then
        echo "  ✓ Role $ROLE created"
    elif [ "$HTTP_CODE" == "409" ]; then
        echo "  ✓ Role $ROLE already exists"
    else
        echo "  ⚠ Role $ROLE status: $HTTP_CODE"
    fi
done

# Get fresh admin token
ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

# Get client UUID for protocol mapper configuration
CLIENT_UUID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id // empty')

# Create protocol mapper for account_id claim
echo "Setting up protocol mapper for account_id claim..."
MAPPER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/protocol-mappers/models" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "account-id-mapper",
    "protocol": "openid-connect",
    "protocolMapper": "oidc-usermodel-attribute-mapper",
    "config": {
      "user.attribute": "account_id",
      "claim.name": "account_id",
      "jsonType.label": "String",
      "id.token.claim": "true",
      "access.token.claim": "true",
      "userinfo.token.claim": "true"
    }
  }')

MAPPER_HTTP_CODE=$(echo "$MAPPER_RESPONSE" | tail -n1)
if [ "$MAPPER_HTTP_CODE" == "201" ]; then
    echo "  ✓ Protocol mapper for account_id created"
elif [ "$MAPPER_HTTP_CODE" == "409" ]; then
    echo "  ✓ Protocol mapper for account_id already exists"
else
    echo "  ⚠ Protocol mapper status: $MAPPER_HTTP_CODE"
fi

echo ""
echo "=========================================="
echo "✓ Keycloak Setup Complete!"
echo "=========================================="
echo "Realm: $REALM_NAME"
echo "Client ID: $CLIENT_ID"
echo "Client Secret: $CLIENT_SECRET"
echo ""
echo "Direct Access Grants: ENABLED"
echo "Standard Flow: ENABLED"
echo "Service Accounts: ENABLED"
echo "Protocol Mappers: account_id"
echo ""
echo "The realm is ready for integration tests!"
echo "=========================================="

