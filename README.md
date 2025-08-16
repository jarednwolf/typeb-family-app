# TypeB Family App - Monorepo

🌐 **Live Production:** https://typebapp.com

A monorepo structure for the TypeB Family App, supporting both mobile (React Native) and web (Next.js) applications with shared code packages.

## 🏗️ Architecture

```
tybeb_b/
├── packages/           # Shared packages
│   ├── types/         # TypeScript type definitions
│   ├── core/          # Business logic and validators
│   └── store/         # Redux store
├── apps/              # Applications
│   └── web/           # Next.js web app (Live at typebapp.com)
└── typeb-family-app/  # React Native mobile app
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

### @typeb/store
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
pnpm dev:web     # Next.js web app

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
- **Mobile App**: React Native + Expo SDK 50
- **Web App**: Next.js 15.4.6 (Live at typebapp.com)
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

3. **Web Development**:
   - Work in `apps/web/` directory
   - Import from shared packages
   - Run `pnpm dev:web`
   - Deploy with `vercel --prod --archive=tgz`

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

- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Architecture Overview](docs/architecture.md)
- [Development Standards](docs/development-standards.md)
- [Project Structure](docs/project-structure.md)

## 🚀 Upcoming Features - User Engagement Focus

### Phase 1: Core Engagement (Q3 2025)
- [ ] **Gamification Enhancements**
  - Achievement badges system
  - Streak tracking for consistent task completion
  - Family leaderboards with weekly/monthly views
  - XP levels and progression system
  
- [ ] **Enhanced Rewards System**
  - Custom reward creation by parents
  - Reward marketplace
  - Point multipliers for difficult tasks
  - Bonus points for early completion

### Phase 2: Social & Interactive Features (Q4 2025)
- [ ] **Family Communication**
  - In-app family chat
  - Task comments and discussions
  - Photo reactions and stickers
  - Celebration animations for completed tasks
  
- [ ] **Collaborative Features**
  - Team tasks for siblings
  - Family challenges
  - Shared goals and milestones
  - Progress sharing with extended family

### Phase 3: Smart Features (Q1 2026)
- [ ] **AI-Powered Enhancements**
  - Smart task suggestions based on history
  - Personalized difficulty adjustment
  - Predictive task scheduling
  - Natural language task creation
  
- [ ] **Integration & Automation**
  - Calendar sync (Google, Apple)
  - Voice commands via Siri/Google Assistant
  - Smart home integration
  - School schedule integration

### Phase 4: Advanced Analytics (Q2 2026)
- [ ] **Parent Dashboard Improvements**
  - Detailed child progress analytics
  - Behavioral pattern insights
  - Task completion trends
  - Customizable reports
  
- [ ] **Child Motivation Tools**
  - Personal best tracking
  - Growth visualization
  - Peer comparison (optional)
  - Achievement showcase

## 🧪 User Testing Plan

1. **Alpha Testing** (Current)
   - Internal team testing
   - Core functionality validation
   
2. **Beta Testing** (September 2025)
   - 50 family pilot program
   - Feedback collection system
   - A/B testing framework
   
3. **Public Launch** (October 2025)
   - Gradual rollout
   - Performance monitoring
   - User feedback integration

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request

## 📄 License

MIT

## 🔗 Links

- [TypeB Website](https://typebapp.com) - Live Production
- [Mobile App (TestFlight)](https://testflight.apple.com/join/YOUR_CODE)
- [Firebase Console](https://console.firebase.google.com/project/typeb-family-app)
- [Vercel Dashboard](https://vercel.com/jareds-projects-247fc15d/tybeb_b)