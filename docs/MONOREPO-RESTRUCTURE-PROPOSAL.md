# Monorepo Restructure Proposal

## Current State

```
tybeb_b/
├── apps/web/              # ✅ Correct location
├── typeb-family-app/      # ❌ Should be in apps/
├── packages/              # ✅ Correct structure
└── docs/                  # ✅ Consolidated
```

## Proposed Structure

```
tybeb_b/
├── apps/
│   ├── web/              # Next.js web application
│   └── mobile/           # React Native app (moved from typeb-family-app/)
├── packages/
│   ├── core/             # Business logic & validators
│   ├── store/            # Redux configuration
│   ├── types/            # TypeScript definitions
│   └── ui/               # (Future) Shared UI components
├── infrastructure/
│   ├── firebase/         # Firebase configs and rules
│   └── scripts/          # Build and deployment scripts
├── docs/                 # All documentation
└── .github/              # GitHub Actions workflows
```

## Migration Plan

### Option A: Gradual Migration (Recommended)
**Timeline**: Can start after launch  
**Risk**: Low  
**Disruption**: Minimal  

1. Keep `typeb-family-app/` as-is for launch
2. After launch, create `apps/mobile/` directory
3. Gradually move files while maintaining builds
4. Update import paths incrementally
5. Remove old directory when complete

### Option B: Quick Migration
**Timeline**: 2-3 hours  
**Risk**: Medium  
**Disruption**: Requires build system updates  

```bash
# Commands to execute
git mv typeb-family-app apps/mobile
# Update pnpm-workspace.yaml
# Update all import paths
# Update CI/CD references
# Test all builds
```

## Benefits of Restructuring

1. **Consistency**: All apps in `apps/` directory
2. **Clarity**: Clear separation of concerns
3. **Tooling**: Better IDE and build tool support
4. **Onboarding**: Easier for new developers
5. **Future-proof**: Ready for additional apps

## Required Changes

### File Updates
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  # Remove: - 'typeb-family-app'
```

```json
// package.json scripts
{
  "dev:mobile": "turbo run dev --filter=@typeb/mobile",
  "build:mobile": "turbo run build --filter=@typeb/mobile"
}
```

```yaml
# .github/workflows/ci.yml
- name: Build Mobile
  run: |
    cd apps/mobile  # Changed from typeb-family-app
    eas build
```

### Import Path Updates
```typescript
// Before
import { TaskService } from '../../../typeb-family-app/src/services/tasks';

// After
import { TaskService } from '@typeb/mobile/services/tasks';
// Or move to shared package
import { TaskService } from '@typeb/core/services/tasks';
```

## Decision Required

Given the 1-week timeline to production, I recommend:

**✅ Option A: Gradual Migration**
- No risk to launch timeline
- Can be done post-launch
- Maintains stability

**Rationale**: The current structure works and doesn't block any functionality. Restructuring now adds unnecessary risk to the tight timeline.

## Action Items (Post-Launch)

- [ ] Create `apps/mobile/` directory structure
- [ ] Set up path aliases for cleaner imports
- [ ] Move non-breaking files first (docs, assets)
- [ ] Update build configurations
- [ ] Migrate source code in phases
- [ ] Update CI/CD pipelines
- [ ] Remove old directory
- [ ] Update all documentation

Would you like to proceed with Option A (defer to post-launch) or Option B (do it now)?
