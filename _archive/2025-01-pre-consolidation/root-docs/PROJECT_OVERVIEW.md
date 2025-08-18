# TypeB Family App - Complete Project Overview

## 🎯 What It Is

**TypeB** is a family task management platform that helps parents assign chores and responsibilities to children, with photo validation and a points-based reward system. It consists of a React Native mobile app and a Next.js web application sharing code through a monorepo structure.

**Live at:** https://typebapp.com

## 🏗️ Architecture Overview

```
tybeb_b/                              # Root monorepo
├── apps/
│   └── web/                          # Next.js web application
│       ├── src/
│       │   ├── app/                  # App router pages
│       │   ├── components/           # React components
│       │   ├── lib/                  # Utilities
│       │   └── styles/               # CSS/Tailwind
│       └── package.json
│
├── typeb-family-app/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/                  # App screens
│   │   ├── components/               # React Native components
│   │   ├── services/                 # Firebase services
│   │   ├── store/                    # Redux store
│   │   └── navigation/               # React Navigation
│   └── app.json                      # Expo config
│
├── packages/                         # Shared code
│   ├── core/                         # Business logic
│   │   ├── validators/               # Input validation
│   │   └── utils/                    # Shared utilities
│   ├── store/                        # Redux configuration
│   │   └── slices/                   # Redux slices
│   └── types/                        # TypeScript definitions
│       └── models/                   # Data models
│
├── package.json                      # Root package.json
├── pnpm-workspace.yaml              # Monorepo config
├── turbo.json                       # Turborepo config
└── vercel.json                      # Deployment config
```

## 💻 Tech Stack

### Frontend
- **Mobile:** React Native + Expo SDK 50
- **Web:** Next.js 15.4.6 + React 19
- **Styling:** Tailwind CSS (web), StyleSheet (mobile)
- **State:** Redux Toolkit
- **Navigation:** React Navigation (mobile), App Router (web)

### Backend
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage (photo uploads)
- **Hosting:** Vercel (web), Expo (mobile)

### Development
- **Monorepo:** pnpm workspaces + Turborepo
- **Language:** TypeScript
- **Testing:** Jest + Detox (E2E)
- **CI/CD:** Vercel (auto-deploy on push)

## 🔄 How It Works

### User Flow
1. **Parents** create family account and invite children
2. **Parents** create tasks with point values and deadlines
3. **Children** view assigned tasks in their app
4. **Children** complete tasks and upload photo proof
5. **Parents** validate completion and award points
6. **Children** accumulate points for rewards

### Data Flow
```
Mobile/Web App → Redux Store → Firebase Services → Firestore DB
                                                 ↓
                                           Firebase Storage
                                                 ↓
                                           Real-time Sync
                                                 ↓
                                         Back to all clients
```

## 🚀 Key Features

### Core Functionality
- **Task Management:** Create, assign, track tasks
- **Photo Validation:** Proof of completion with photos
- **Points System:** Earn and track points
- **Family Roles:** Parent/Child permissions
- **Real-time Sync:** Updates across all devices

### Platform-Specific
- **Mobile:** Push notifications, camera integration
- **Web:** Admin dashboard, bulk operations

## 📦 Shared Packages

### @typeb/types
- User, Family, Task, Member models
- API request/response types
- Validation schemas

### @typeb/core
- Date/time utilities
- Validation functions
- Business logic rules
- Service interfaces

### @typeb/store
- Redux slices (auth, family, tasks)
- Middleware configuration
- Selectors and actions

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev          # Run all services
pnpm dev:web      # Web only
pnpm dev:mobile   # Mobile only

# Building
pnpm build        # Build all packages
pnpm build:web    # Build web app

# Testing
pnpm test         # Run tests
pnpm e2e          # Run E2E tests

# Deployment
vercel --prod --archive=tgz  # Deploy to production
```

## 🌐 Deployment

### Web (Vercel)
- **URL:** https://typebapp.com
- **Auto-deploy:** On push to main
- **Config:** Root directory set to `apps/web`

### Mobile (Expo)
- **iOS:** TestFlight distribution
- **Android:** Google Play Console
- **OTA Updates:** Via Expo

## 🔐 Security

### Firebase Rules
- User authentication required
- Family-based data isolation
- Role-based permissions
- File size/type validation

### API Security
- HTTP referrer restrictions
- Domain whitelisting
- Environment variables for secrets

## 📊 Database Schema

### Collections
```typescript
/families/{familyId}
  - name, code, createdBy, settings

/families/{familyId}/members/{memberId}
  - userId, role, name, avatar, points

/families/{familyId}/tasks/{taskId}
  - title, assignedTo, points, dueDate, status, photoUrl

/users/{userId}
  - email, name, families[]
```

## 🎯 Current Status

- ✅ Production deployed at typebapp.com
- ✅ Core features working
- ✅ Security configured
- 🚧 User engagement improvements planned
- 🚧 Beta testing starting September 2025

## 📈 Next Steps

1. **Immediate:** Usability improvements (task templates, better notifications)
2. **Short-term:** Family workflow optimization (routines, schedules)
3. **Medium-term:** Calendar integration, smart scheduling
4. **Long-term:** Light gamification (optional, tested)

## 📚 Documentation

- `README.md` - Project overview
- `DEPLOYMENT.md` - Deployment guide
- `ENGAGEMENT_ROADMAP.md` - Feature roadmap
- `PROJECT_OVERVIEW.md` - This file
- `apps/web/README.md` - Web app details

## 🔗 Quick Links

- **Production:** https://typebapp.com
- **Vercel Dashboard:** https://vercel.com/jareds-projects-247fc15d/tybeb_b
- **Firebase Console:** https://console.firebase.google.com

---

*A monorepo family task management platform focused on real utility over gamification*