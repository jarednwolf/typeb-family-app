# Getting Started with TypeB Development

This guide will help you set up your development environment and start contributing to TypeB.

## Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher (`npm install -g pnpm`)
- **Git**: Latest version
- **Firebase CLI**: Latest (`npm install -g firebase-tools`)
- **EAS CLI**: Latest (`npm install -g eas-cli`)

### Platform-Specific Requirements

#### iOS Development (Mac Only)
- Xcode 14+ from Mac App Store
- iOS Simulator
- CocoaPods (`sudo gem install cocoapods`)

#### Android Development
- Android Studio
- Android SDK (API 21+)
- Android Emulator or physical device

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repo
git clone https://github.com/[your-org]/typeb.git
cd typeb

# Or if you've forked it
git clone https://github.com/[your-username]/typeb.git
cd typeb
```

### 2. Install Dependencies

```bash
# Install all dependencies using pnpm workspaces
pnpm install

# Build shared packages
pnpm build:packages
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.example .env.local

# For mobile app
cd typeb-family-app
cp .env.example .env.local
cd ..
```

Edit `.env.local` with your configuration:

```env
# Firebase Configuration (Required)
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# RevenueCat (Required for payments)
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_xxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_xxxxxxxxxxxxx

# Sentry (Optional for development)
EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Environment
EXPO_PUBLIC_ENVIRONMENT=development
```

### 4. Firebase Setup

```bash
# Login to Firebase
firebase login

# Select or create a project
firebase projects:list
firebase use [project-id]

# Start Firebase emulators for local development
firebase emulators:start
```

The emulators will start:
- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Storage: http://localhost:9199
- Functions: http://localhost:5001

## Running the Applications

### Mobile App (React Native)

```bash
cd typeb-family-app

# Start the Expo development server
npx expo start

# Options:
# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
# Scan QR code with Expo Go app on physical device
```

### Web App (Next.js)

```bash
cd apps/web

# Start the development server
pnpm dev

# Open http://localhost:3000
```

### Running Both Simultaneously

```bash
# From root directory
pnpm dev

# This will start:
# - Mobile app on Expo
# - Web app on localhost:3000
# - Shared packages in watch mode
```

## Project Structure

```
tybeb_b/
├── apps/
│   └── web/                    # Next.js web application
├── typeb-family-app/           # React Native mobile app
│   ├── src/
│   │   ├── screens/           # App screens
│   │   ├── components/        # Reusable components
│   │   ├── services/          # Firebase services
│   │   ├── store/            # Redux state
│   │   └── navigation/       # Navigation setup
│   ├── ios/                  # iOS native code
│   └── android/              # Android native code
├── packages/
│   ├── core/                 # Shared business logic
│   ├── store/                # Redux configuration
│   └── types/                # TypeScript definitions
└── docs/                     # Documentation
```

## Common Development Tasks

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests (mobile)
cd typeb-family-app
pnpm e2e:ios  # or e2e:android
```

### Type Checking

```bash
# Check all TypeScript files
pnpm type-check

# Watch mode for type checking
pnpm type-check:watch
```

### Linting & Formatting

```bash
# Run ESLint
pnpm lint

# Fix lint issues
pnpm lint:fix

# Format with Prettier
pnpm format

# Check formatting
pnpm format:check
```

### Building for Production

```bash
# Build all packages
pnpm build

# Build specific app
pnpm build:web
pnpm build:mobile

# Build for specific platform
cd typeb-family-app
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

Follow these conventions:
- Use TypeScript for all new code
- Write tests for new features
- Update documentation
- Follow existing code style

### 3. Test Your Changes

```bash
# Run tests
pnpm test

# Check types
pnpm type-check

# Lint code
pnpm lint
```

### 4. Commit Your Changes

We use conventional commits:

```bash
git add .
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve issue with task creation"
# or
git commit -m "docs: update getting started guide"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Troubleshooting

### Common Issues

#### Dependencies not installing
```bash
# Clear package manager cache
pnpm store prune
rm -rf node_modules
pnpm install
```

#### Metro bundler issues (React Native)
```bash
cd typeb-family-app
npx expo start --clear
```

#### Firebase emulator not starting
```bash
# Check if ports are in use
lsof -i :8080  # Firestore
lsof -i :9099  # Auth
lsof -i :5001  # Functions

# Kill processes if needed
kill -9 [PID]
```

#### Build failures
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

#### iOS build issues
```bash
cd typeb-family-app/ios
pod deintegrate
pod install
cd ../..
```

## Useful Commands Reference

```bash
# Development
pnpm dev              # Start all dev servers
pnpm dev:mobile       # Start mobile only
pnpm dev:web         # Start web only

# Testing
pnpm test            # Run tests
pnpm test:watch      # Watch mode
pnpm test:coverage   # With coverage

# Building
pnpm build           # Build all
pnpm build:packages  # Build shared packages
pnpm build:web      # Build web app
pnpm build:mobile   # Build mobile app

# Code Quality
pnpm lint           # Run linter
pnpm lint:fix       # Fix lint issues
pnpm type-check     # Check TypeScript
pnpm format         # Format code

# Firebase
firebase emulators:start    # Start emulators
firebase deploy            # Deploy to production
firebase deploy --only firestore:rules  # Deploy rules only
```

## Getting Help

- **Documentation**: Check `/docs` folder
- **GitHub Issues**: Report bugs or request features
- **Slack**: Join #typeb-dev channel
- **Email**: dev@typebapp.com

## Next Steps

1. Review [Architecture](./ARCHITECTURE.md) to understand the system
2. Check [API Documentation](./API.md) for backend endpoints
3. Read [Testing Guide](./TESTING.md) for test practices
4. Review [Security Guidelines](./SECURITY.md) for best practices

---

**Last Updated**: January 2025  
**Version**: 2.0.0