# Makefile for Infrastructure Management
# Quick commands for managing PostgreSQL and Keycloak during development

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

# Docker Compose paths
COMPOSE_FILE := docker-compose-infra.yaml
COMPOSE_CMD := docker-compose -f $(COMPOSE_FILE)

.PHONY: help infra-start infra-stop infra-restart infra-status infra-logs infra-clean dev run build test

help: ## Show this help message
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Infrastructure Management$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BLUE)Examples:$(NC)"
	@echo "  make start          # Start PostgreSQL + Keycloak"
	@echo "  make dev            # Start infrastructure + run app"
	@echo "  make status         # Check what's running"
	@echo "  make logs           # View all logs"
	@echo "  make clean-infra    # Remove all data"
	@echo ""
	@echo "$(BLUE)Connection Details:$(NC)"
	@echo "  PostgreSQL: localhost:5432 (user: postgres, password: changeme)"
	@echo "    - Databases: backoffice, keycloak, payment_platform"
	@echo "  Keycloak:   http://localhost:8180 (admin: admin/admin)"
	@echo "  Redis:      localhost:6379"
	@echo "  pgAdmin:    http://localhost:5050 (admin@admin.com / admin)"

infra-start: ## Start infrastructure (PostgreSQL + Keycloak)
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Starting Infrastructure$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(GREEN)ℹ$(NC) Starting services..."
	@$(COMPOSE_CMD) up -d
	@echo ""
	@echo "$(GREEN)ℹ$(NC) Waiting for services to be ready..."
	@echo -n "PostgreSQL: "
	@for i in $$(seq 1 30); do \
		if docker exec postgres pg_isready -U postgres > /dev/null 2>&1; then \
			echo "$(GREEN)✓ Ready$(NC)"; \
			break; \
		fi; \
		echo -n "."; \
		sleep 1; \
	done
	@echo -n "Keycloak:   "
	@for i in $$(seq 1 90); do \
		if curl -s http://localhost:8180/health/ready > /dev/null 2>&1; then \
			echo "$(GREEN)✓ Ready$(NC)"; \
			break; \
		fi; \
		echo -n "."; \
		sleep 1; \
	done
	@echo ""
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(GREEN)✓ Infrastructure Started Successfully!$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(GREEN)✓$(NC) PostgreSQL:  localhost:5432"
	@echo "  - Databases: backoffice, keycloak, payment_platform"
	@echo "  - Username: postgres"
	@echo "  - Password: changeme"
	@echo ""
	@echo "$(GREEN)✓$(NC) Redis:       localhost:6379"
	@echo ""
	@echo "$(GREEN)✓$(NC) pgAdmin:     http://localhost:5050"
	@echo "  - Email: admin@admin.com"
	@echo "  - Password: admin"
	@echo ""
	@echo "$(GREEN)✓$(NC) Keycloak:    http://localhost:8180"
	@echo "  - Admin Console: http://localhost:8180/admin"
	@echo "  - Username: admin"
	@echo "  - Password: admin"
	@echo "  - Realm: backoffice"
	@echo ""
	@echo "$(GREEN)ℹ$(NC) Starting Next.js application in dev mode..."
	@echo ""
	@cd .. && npm run dev

infra-stop: ## Stop infrastructure
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Stopping Infrastructure$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(GREEN)ℹ$(NC) Stopping services..."
	@$(COMPOSE_CMD) stop
	@echo ""
	@echo "$(GREEN)✓$(NC) Infrastructure stopped"

infra-restart: ## Restart infrastructure
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Restarting Infrastructure$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(GREEN)ℹ$(NC) Restarting services..."
	@$(COMPOSE_CMD) restart
	@echo ""
	@echo "$(GREEN)✓$(NC) Infrastructure restarted"

infra-status: ## Show infrastructure status
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Infrastructure Status$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@$(COMPOSE_CMD) ps
	@echo ""
	@echo "$(GREEN)ℹ$(NC) Service URLs:"
	@echo "  PostgreSQL:  localhost:5432 (3 databases)"
	@echo "  Redis:       localhost:6379"
	@echo "  Keycloak:    http://localhost:8180"
	@echo "  pgAdmin:     http://localhost:5050"

infra-logs: ## Show infrastructure logs
	@$(COMPOSE_CMD) logs -f

infra-logs-postgres: ## Show PostgreSQL logs
	@$(COMPOSE_CMD) logs -f postgres

infra-logs-keycloak: ## Show Keycloak logs
	@$(COMPOSE_CMD) logs -f keycloak

infra-logs-redis: ## Show Redis logs
	@$(COMPOSE_CMD) logs -f redis

infra-logs-keycloak-init: ## Show Keycloak initialization logs
	@$(COMPOSE_CMD) logs keycloak-init

infra-logs-pgadmin: ## Show pgAdmin logs
	@$(COMPOSE_CMD) logs -f pgadmin

infra-clean: ## Clean infrastructure (removes all data)
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Cleaning Infrastructure$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠$(NC) This will remove ALL data (PostgreSQL databases, Keycloak config, Redis data, pgAdmin settings)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(GREEN)ℹ$(NC) Removing everything..."; \
		$(COMPOSE_CMD) down -v; \
		echo ""; \
		echo "$(GREEN)✓$(NC) Infrastructure cleaned (all data removed)"; \
	else \
		echo "$(GREEN)ℹ$(NC) Cancelled"; \
	fi

infra-down: ## Remove infrastructure containers (keeps data)
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Removing Infrastructure$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)⚠$(NC) This will remove containers but keep data volumes"
	@$(COMPOSE_CMD) down
	@echo ""
	@echo "$(GREEN)✓$(NC) Infrastructure removed (volumes preserved)"

dev: infra-start ## Start infrastructure and run Next.js app in dev mode
	@echo ""
	@echo "$(GREEN)✓$(NC) Infrastructure started!"
	@echo "$(GREEN)ℹ$(NC) Starting Next.js application in dev mode..."
	@echo ""
	@cd .. && npm run dev

run: ## Run Next.js application in dev mode (assumes infrastructure is running)
	@echo "$(GREEN)ℹ$(NC) Running Next.js application in dev mode..."
	@cd .. && npm run dev

build: ## Build the Next.js application
	@echo "$(GREEN)ℹ$(NC) Building Next.js application..."
	@cd .. && npm run build

compile: build ## Alias for build (Next.js compiles during build)

test: ## Run tests
	@echo "$(GREEN)ℹ$(NC) Running tests..."
	@cd .. && npm test

integration-test: ## Run integration tests
	@echo "$(GREEN)ℹ$(NC) Running integration tests..."
	@cd .. && npm run test:integration

docker-build: ## Build Docker image for Next.js app
	@echo "$(GREEN)ℹ$(NC) Building Docker image..."
	@cd .. && docker build -t fleetros-backoffice-v2:latest .

docker-up: ## Start full stack (infrastructure + application)
	@echo "$(GREEN)ℹ$(NC) Starting infrastructure..."
	@$(COMPOSE_CMD) up -d
	@echo ""
	@echo "$(GREEN)✓$(NC) Infrastructure started"
	@echo "$(YELLOW)ℹ$(NC) Start your Next.js app with: npm run dev"

docker-down: ## Stop infrastructure
	@echo "$(GREEN)ℹ$(NC) Stopping infrastructure..."
	@$(COMPOSE_CMD) down

docker-logs: ## Show infrastructure logs
	@$(COMPOSE_CMD) logs -f

clean-all: infra-clean ## Clean everything (infrastructure + build artifacts)
	@echo "$(GREEN)ℹ$(NC) Cleaning Next.js build artifacts..."
	@cd .. && rm -rf .next node_modules/.cache

# Database helper commands
db-connect: ## Connect to PostgreSQL database
	@docker exec -it postgres psql -U postgres -d backoffice

db-check-users: ## Check users without accounts
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Users Without Accounts$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@docker exec -it postgres psql -U postgres -d backoffice -c \
		"SELECT u.id, u.username, u.email, u.keycloak_user_id, u.created_at \
		FROM users u WHERE u.account_id IS NULL ORDER BY u.created_at DESC;"

db-fix-user: ## Fix user account linkage (usage: make db-fix-user USER=username ACCOUNT=1)
	@if [ -z "$(USER)" ] || [ -z "$(ACCOUNT)" ]; then \
		echo "$(RED)✗$(NC) Usage: make db-fix-user USER=username ACCOUNT=account_id"; \
		echo "  Example: make db-fix-user USER=admi2n ACCOUNT=1"; \
	else \
		echo "$(GREEN)ℹ$(NC) Linking user '$(USER)' to account $(ACCOUNT)..."; \
		docker exec -it postgres psql -U postgres -d backoffice -c \
			"UPDATE users SET account_id = $(ACCOUNT) WHERE username = '$(USER)';"; \
		echo "$(GREEN)✓$(NC) User linked successfully"; \
	fi

# Testing CORS
test-cors: ## Test CORS configuration
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Testing CORS Configuration$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(GREEN)ℹ$(NC) Testing CORS preflight request..."
	@echo ""
	@curl -X OPTIONS http://localhost:8080/api/auth/login \
		-H "Origin: http://localhost:3000" \
		-H "Access-Control-Request-Method: POST" \
		-H "Access-Control-Request-Headers: Content-Type" \
		-v 2>&1 | grep -i "access-control" || echo "$(YELLOW)⚠$(NC) No CORS headers found"

# Keycloak helpers
keycloak-open: ## Open Keycloak admin console
	@echo "$(GREEN)ℹ$(NC) Opening Keycloak admin console..."
	@echo "  URL: http://localhost:8180/admin"
	@echo "  Username: admin"
	@echo "  Password: admin"
	@command -v xdg-open >/dev/null && xdg-open http://localhost:8180/admin || \
		command -v open >/dev/null && open http://localhost:8180/admin || \
		echo "$(YELLOW)⚠$(NC) Please open http://localhost:8180/admin manually"

# pgAdmin helpers
pgadmin-open: ## Open pgAdmin web interface
	@echo "$(GREEN)ℹ$(NC) Opening pgAdmin..."
	@echo "  URL: http://localhost:5050"
	@echo "  Email: admin@admin.com"
	@echo "  Password: admin"
	@echo ""
	@echo "$(GREEN)✓$(NC) PostgreSQL server is pre-configured and auto-connects!"
	@echo "  You should see 'Local PostgreSQL' server in the left panel"
	@echo "  Click on it to connect automatically - no password needed!"
	@echo ""
	@echo "$(GREEN)ℹ$(NC) Available databases:"
	@echo "  - backoffice (main application)"
	@echo "  - keycloak (authentication)"
	@echo "  - payment_platform (payments)"
	@echo ""
	@command -v xdg-open >/dev/null && xdg-open http://localhost:5050 || \
		command -v open >/dev/null && open http://localhost:5050 || \
		echo "$(YELLOW)⚠$(NC) Please open http://localhost:5050 manually"

# Quick access aliases
start: infra-start ## Alias for infra-start
stop: infra-stop ## Alias for infra-stop
status: infra-status ## Alias for infra-status
logs: infra-logs ## Alias for infra-logs
restart: infra-restart ## Alias for infra-restart
clean: infra-clean ## Alias for infra-clean
down: infra-down ## Alias for infra-down
up: infra-start ## Alias for infra-start

# Development shortcuts
dev-fresh: clean-all infra-start dev ## Clean everything and start fresh
quick-start: start run ## Quick start: infrastructure + app

