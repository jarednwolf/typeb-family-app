# TypeB Family App - Monorepo

A monorepo structure for the TypeB Family App, supporting both mobile (React Native) and web (Next.js) applications with shared code packages.

## 🏗️ Architecture

```
tybeb_b/
├── packages/           # Shared packages
│   ├── types/         # TypeScript type definitions
│   ├── core/          # Business logic and validators
│   └── store/         # Redux store (coming soon)
├── apps/              # Applications
│   └── web/           # Next.js web app (coming soon)
└── typeb-family-app/  # React Native mobile app (existing)
```

## 📦 Packages

### @typeb/types
Shared TypeScript type definitions used across all applications:
- Data models (User, Family, Task, etc.)
- API request/response types
- WebSocket event types

### @typeb/core
Shared business logic and utilities:
- Service interfaces for platform abstraction
- Input validators (auth, tasks, etc.)
- Date/time utilities
- Common helper functions

### @typeb/store (Coming Soon)
Shared Redux store configuration:
- Redux slices
- Middleware
- Selectors

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Run all packages in watch mode
pnpm dev

# Run specific app
pnpm dev:mobile  # React Native app
pnpm dev:web     # Next.js app (coming soon)

# Run tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 🛠️ Technology Stack

- **Monorepo Tool**: pnpm workspaces + Turborepo
- **Build Tool**: tsup
- **Mobile App**: React Native + Expo
- **Web App**: Next.js 14 (coming soon)
- **Shared Code**: TypeScript
- **State Management**: Redux Toolkit
- **Backend**: Firebase (Firestore, Auth, Storage)

## 📝 Development Workflow

1. **Shared Code Changes**: 
   - Make changes in `packages/` directory
   - Run `pnpm build` to compile packages
   - Changes automatically available to apps

2. **Mobile Development**:
   - Work in `typeb-family-app/` directory
   - Import from `@typeb/types` and `@typeb/core`
   - Run `pnpm dev:mobile`

3. **Web Development** (Coming Soon):
   - Work in `apps/web/` directory
   - Import from shared packages
   - Run `pnpm dev:web`

## 🔄 Code Sharing Strategy

### What's Shared
- TypeScript type definitions
- Validation logic
- Business rules
- Utility functions
- Redux store configuration

### Platform-Specific
- UI components
- Navigation
- Platform APIs (camera, notifications, etc.)
- Build configurations

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [Development Standards](docs/development-standards.md)
- [Project Structure](docs/project-structure.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request

## 📄 License

MIT

## 🔗 Links

- [TypeB Website](https://typebapp.com) (coming soon)
- [Mobile App (TestFlight)](https://testflight.apple.com/join/YOUR_CODE)
- [Firebase Console](https://console.firebase.google.com/project/typeb-family-app)