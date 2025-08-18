# Contributing to TypeB

Thank you for your interest in contributing to TypeB! This guide will help you get started.

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm 8+
- Git with commit signing (recommended)
- Firebase emulator suite
- iOS Simulator (Mac) or Android emulator

### Setup
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/typeb.git
cd typeb

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Start development
pnpm dev
```

## Development Workflow

### Branch Strategy
```
main
├── develop
│   ├── feature/task-improvements
│   ├── fix/photo-upload-bug
│   └── chore/update-dependencies
└── release/v1.1.0
```

### Creating a Branch
```bash
# Feature
git checkout -b feature/description

# Bug fix
git checkout -b fix/description

# Chore
git checkout -b chore/description
```

### Commit Convention
We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

# Examples
feat(tasks): add recurring task support
fix(auth): resolve login timeout issue
docs(readme): update installation steps
chore(deps): upgrade react-native to 0.73
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, semicolons)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## Code Standards

### TypeScript
```typescript
// Use explicit types
const processTask = (task: Task): void => {
  // ...
};

// Avoid any
// ❌ Bad
const data: any = fetchData();

// ✅ Good
const data: TaskData = fetchData();
```

### React/React Native
```tsx
// Functional components with TypeScript
interface Props {
  task: Task;
  onComplete: (id: string) => void;
}

export const TaskCard: React.FC<Props> = ({ task, onComplete }) => {
  // Use hooks
  const [loading, setLoading] = useState(false);
  
  // Memoize expensive computations
  const points = useMemo(() => calculatePoints(task), [task]);
  
  return (
    <View>
      {/* Component JSX */}
    </View>
  );
};
```

### Testing
```typescript
// Write tests for all new features
describe('TaskService', () => {
  it('should create a task', async () => {
    const task = await TaskService.create({
      title: 'Test Task',
      points: 10
    });
    
    expect(task).toBeDefined();
    expect(task.title).toBe('Test Task');
  });
});
```

## Pull Request Process

### Before Submitting
```bash
# Run tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint

# Format
pnpm format
```

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.logs left
```

### Review Process
1. Create PR against `develop` branch
2. Automated checks must pass
3. Code review by maintainer
4. Address feedback
5. Merge when approved

## Testing Guidelines

### Unit Tests
```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### E2E Tests
```bash
# iOS
pnpm e2e:ios

# Android
pnpm e2e:android

# Web
pnpm e2e:web
```

### Manual Testing Checklist
- [ ] Login/signup flow
- [ ] Task creation and assignment
- [ ] Photo upload and validation
- [ ] Payment flow (use test cards)
- [ ] Push notifications
- [ ] Offline functionality

## Project Structure

```
typeb/
├── apps/
│   └── web/           # Next.js web app
├── typeb-family-app/  # React Native app
├── packages/
│   ├── core/          # Business logic
│   ├── store/         # Redux store
│   └── types/         # TypeScript types
└── docs/              # Documentation
```

### Adding a Package
```bash
# Create new package
mkdir packages/new-package
cd packages/new-package
pnpm init

# Add to workspace
# Edit pnpm-workspace.yaml
```

## Firebase Development

### Emulator Setup
```bash
# Install Firebase tools
npm install -g firebase-tools

# Start emulators
firebase emulators:start

# Use emulators in app
const app = initializeApp({
  // config
});

if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### Security Rules Testing
```javascript
// Test security rules
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

test('users can read own profile', async () => {
  const db = getFirestore(myAuth);
  await assertSucceeds(db.doc(`users/${myId}`).get());
});
```

## Performance Guidelines

### Image Optimization
- Max size: 5MB
- Preferred format: JPEG for photos
- Compression: 80% quality
- Dimensions: Max 1920px wide

### Query Optimization
```typescript
// ❌ Bad - Multiple queries
const tasks = await getTasks();
const users = await getUsers();

// ✅ Good - Batch query
const [tasks, users] = await Promise.all([
  getTasks(),
  getUsers()
]);
```

### Bundle Size
- Monitor with `pnpm analyze`
- Lazy load heavy components
- Use dynamic imports
- Tree-shake unused code

## Documentation

### Code Comments
```typescript
/**
 * Validates a task before creation
 * @param task - The task to validate
 * @returns Validated task or throws error
 */
export const validateTask = (task: TaskInput): Task => {
  // Implementation
};
```

### README Updates
Update README when:
- Adding new features
- Changing setup steps
- Modifying API
- Adding dependencies

## Release Process

### Version Bumping
```bash
# Patch (1.0.0 → 1.0.1)
pnpm version patch

# Minor (1.0.0 → 1.1.0)
pnpm version minor

# Major (1.0.0 → 2.0.0)
pnpm version major
```

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Tag created
- [ ] Release notes written

## Getting Help

### Resources
- [Firebase Docs](https://firebase.google.com/docs)
- [React Native Docs](https://reactnative.dev)
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

### Communication
- **Discord**: [Join our server]
- **Issues**: GitHub Issues for bugs
- **Discussions**: GitHub Discussions for features
- **Email**: dev@typebapp.com

## Code of Conduct

### Our Pledge
We pledge to make participation in our project a harassment-free experience for everyone.

### Expected Behavior
- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Reporting
Report violations to: conduct@typebapp.com

---

**Thank you for contributing to TypeB!** 🚀
