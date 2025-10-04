# TypeB Development Makefile
# Run 'make help' to see available commands

.PHONY: help
help: ## Show this help message
	@echo "TypeB Development Commands"
	@echo "=========================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: install
install: ## Install all dependencies
	pnpm install --frozen-lockfile

.PHONY: dev
dev: ## Start all development servers
	@echo "Starting web dev server..."
	make dev-web

.PHONY: dev-web
dev-web: ## Start web development server
	pnpm --filter @typeb/web dev

.PHONY: dev-mobile
dev-mobile: ## Start mobile development server
	npm start

.PHONY: build
build: ## Build all packages and apps
	pnpm build

.PHONY: test
test: ## Run all tests
	pnpm test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	pnpm test:watch

.PHONY: lint
lint: ## Run linting
	pnpm lint

.PHONY: format
format: ## Format all code
	pnpm format

.PHONY: type-check
type-check: ## Run TypeScript type checking
	pnpm type-check

.PHONY: clean
clean: ## Clean all build artifacts and node_modules
	pnpm clean
	rm -rf node_modules
	rm -rf apps/web/.next
	rm -rf apps/web/node_modules
	rm -rf typeb-family-app/node_modules
	rm -rf packages/*/dist
	rm -rf packages/*/node_modules

.PHONY: firebase-emulator
firebase-emulator: ## Start Firebase emulators
	npx --yes firebase emulators:start

.PHONY: deploy-staging
deploy-staging: ## Deploy to staging environment
	@echo "Deploying to staging..."
	cd apps/web && npx --yes vercel --yes
	npx --yes firebase deploy --only firestore:rules,firestore:indexes --project staging

.PHONY: deploy-production
deploy-production: ## Deploy to production (requires confirmation)
	@echo "⚠️  WARNING: Deploying to PRODUCTION!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd apps/web && npx --yes vercel --prod --yes; \
		npx --yes firebase deploy --only firestore:rules,firestore:indexes --project production; \
	fi

.PHONY: backup-firestore
backup-firestore: ## Backup Firestore database
	@echo "Backing up Firestore..."
	gcloud firestore export gs://typeb-backups/$$(date +%Y%m%d-%H%M%S)

.PHONY: check-env
check-env: ## Check if environment variables are set
	@echo "Checking environment configuration..."
	@test -f .env.local && echo "✅ .env.local exists" || echo "❌ .env.local missing"
	@test -f .env.staging && echo "✅ .env.staging exists" || echo "❌ .env.staging missing"
	@test -f .env.production && echo "✅ .env.production exists" || echo "❌ .env.production missing"

.PHONY: security-scan
security-scan: ## Run security audit
	npm audit
	pnpm audit

.PHONY: bundle-analyze
bundle-analyze: ## Analyze bundle size
	cd apps/web && npm run analyze

.PHONY: pre-commit-install
pre-commit-install: ## Install pre-commit hooks
	pip install pre-commit
	pre-commit install

.PHONY: pre-launch-check
pre-launch-check: ## Run all checks before launch
	@echo "Running pre-launch checks..."
	@make lint
	@make type-check
	@make test
	@make security-scan
	@echo "✅ All checks passed!"

.PHONY: mobile-ios
mobile-ios: ## Build iOS app
	eas build --platform ios --profile production

.PHONY: mobile-android
mobile-android: ## Build Android app
	eas build --platform android --profile production

.PHONY: docs-serve
docs-serve: ## Serve documentation locally
	cd docs && python -m http.server 8000

.PHONY: update-deps
update-deps: ## Update dependencies interactively
	pnpm update --interactive --latest
