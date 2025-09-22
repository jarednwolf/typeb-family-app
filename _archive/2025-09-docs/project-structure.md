# TypeB - Project Structure & Documentation Standards

## Complete Project Folder Structure

```
typeb/                              # Root project directory
│
├── MASTER-TRACKER.md               # SINGLE SOURCE OF TRUTH (always at root)
├── README.md                       # Project overview
├── .gitignore                      # Git ignore rules
├── .env.example                    # Environment variables template
├── .env                           # Local environment (never committed)
│
├── docs/                          # All planning & architecture docs
│   ├── planning/                  # Initial planning docs
│   │   ├── architecture.md
│   │   ├── design-system.md
│   │   ├── implementation-plan.md
│   │   └── testing-strategy.md
│   │
│   ├── technical/                 # Technical specifications
│   │   ├── authentication-onboarding-flow.md
│   │   ├── scaling-preferences-strategy.md
│   │   ├── development-standards.md
│   │   └── project-structure.md (this file)
│   │
│   ├── api/                       # API documentation (auto-generated)
│   │   └── README.md
│   │
│   └── decisions/                 # Architecture Decision Records
│       └── README.md
│
├── assets/                        # Static assets
│   ├── logo/
│   │   └── type_b_logo.png
│   ├── icons/
│   └── images/
│
├── src/                          # Application source code
│   ├── features/                 # Feature-based modules
│   │   ├── auth/
│   │   │   ├── authSlice.ts
│   │   │   ├── authService.ts
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── auth.test.ts
│   │   │   └── README.md
│   │   │
│   │   ├── tasks/
│   │   │   ├── tasksSlice.ts
│   │   │   ├── tasksService.ts
│   │   │   ├── TasksScreen.tsx
│   │   │   ├── tasks.test.ts
│   │   │   └── README.md
│   │   │
│   │   └── family/
│   │       └── [similar structure]
│   │
│   ├── components/               # Shared components
│   │   ├── common/
│   │   ├── forms/
│   │   └── layout/
│   │
│   ├── navigation/              # Navigation configuration
│   ├── services/                # Core services
│   ├── store/                   # Redux store
│   ├── hooks/                   # Custom hooks
│   ├── utils/                   # Utilities
│   ├── types/                   # TypeScript types
│   └── constants/               # App constants
│
├── __tests__/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/                     # Build and utility scripts
│   ├── clean-docs.js           # Doc cleanup script
│   └── pre-push.sh            # Pre-push validation
│
├── ios/                        # iOS specific files (Expo managed)
├── android/                    # Android specific files (Expo managed)
│
├── app.json                    # Expo configuration
├── App.tsx                     # App entry point
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── babel.config.js            # Babel configuration
├── metro.config.js            # Metro bundler config
└── eas.json                   # EAS Build configuration
```

## Documentation Management Rules

### 1. Documentation Locations
- **MASTER-TRACKER.md**: Always at root, never move
- **Planning docs**: `/docs/planning/` - architecture decisions
- **Technical docs**: `/docs/technical/` - implementation details
- **Service docs**: Each service has README.md in its folder
- **API docs**: Auto-generated in `/docs/api/`

### 2. Documentation Update Schedule

#### After Each Phase Completion:
1. Update MASTER-TRACKER.md with completed items
2. Review and update relevant docs in `/docs/`
3. Update service-level README files
4. Run documentation cleanup script
5. Commit with message: `docs: phase X cleanup and consistency update`

#### Documentation Cleanup Checklist:
```bash
# Run at end of each phase
npm run docs:cleanup

# This script will:
- Check for outdated information
- Ensure consistent formatting
- Update cross-references
- Verify all decisions are logged
- Generate updated API docs
```

### 3. Environment Access & Validation

#### What I CAN do:
- Read all files in your project
- Write and modify files
- Execute terminal commands
- View command output
- See environment structure

#### What I CANNOT do:
- Directly access environment variables (you need to show me .env contents)
- See running process internals
- Access external services without credentials

#### How to give me access:
1. **For environment variables**: Show me `.env` file contents when needed
2. **For validation**: I'll run commands and see output
3. **For Firebase**: Share project ID and configuration
4. **For secrets**: Use `.env.example` as template, you fill actual values

### 4. Documentation Consistency Rules

#### Every Phase End:
1. **Consolidate decisions** from session into MASTER-TRACKER.md
2. **Update technical docs** with implementation details
3. **Clean up outdated info** in planning docs
4. **Verify consistency** across all docs
5. **Update README** files in feature folders

#### Automated Checks:
```javascript
// scripts/clean-docs.js
const cleanupTasks = [
  'Remove conflicting information',
  'Update version numbers',
  'Fix broken links',
  'Standardize formatting',
  'Update table of contents',
  'Verify decision log completeness'
];
```

## Documentation Priority Levels

### Level 1 (Critical - Always Current)
- MASTER-TRACKER.md
- .env.example
- README.md (root)

### Level 2 (Important - Update Each Phase)
- development-standards.md
- Service-level README files
- API documentation

### Level 3 (Reference - Update As Needed)
- Architecture docs
- Design system docs
- Planning docs

## Git Hooks for Documentation

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check if MASTER-TRACKER.md was updated
if git diff --cached --name-only | grep -q "MASTER-TRACKER.md"; then
  echo "✓ MASTER-TRACKER.md updated"
else
  echo "⚠️  Warning: MASTER-TRACKER.md not updated. Are you sure?"
  read -p "Continue without updating tracker? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

### Pre-push Hook
```bash
#!/bin/bash
# .git/hooks/pre-push

# Run documentation validation
npm run docs:validate

if [ $? -ne 0 ]; then
  echo "❌ Documentation validation failed"
  echo "Run 'npm run docs:cleanup' to fix"
  exit 1
fi

echo "✓ Documentation validated"
```

## Quick Commands

```bash
# Documentation management
npm run docs:cleanup      # Clean and standardize all docs
npm run docs:validate     # Check for inconsistencies
npm run docs:generate     # Generate API docs from code

# Development workflow
npm run dev              # Start development server
npm run test            # Run tests
npm run build           # Build for production
npm run lint            # Check code quality
```

## Environment Setup Template

```bash
# .env.example (commit this)
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_auth_domain_here
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
FIREBASE_APP_ID=your_app_id_here

EXPO_PUBLIC_API_URL=https://api.typeb.app
EXPO_PUBLIC_ENVIRONMENT=development
```

## Documentation Maintenance Contract

**I commit to:**
1. Update MASTER-TRACKER.md after every work session
2. Clean docs after each phase completion
3. Keep service README files current
4. Document all architectural decisions
5. Maintain consistency across all documentation
6. Run validation before pushing to git

**You provide:**
1. Environment variable values when needed
2. Firebase configuration details
3. Approval for major documentation changes
4. Feedback on documentation clarity

---

**This structure ensures:**
- Clear separation of concerns
- Easy navigation
- Consistent documentation
- Automated validation
- No lost context between sessions