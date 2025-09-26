# Component Testing Guide

## Overview
This guide documents the testing patterns and best practices established for the TypeB Family App component testing infrastructure.

## Test Infrastructure Setup

### Key Dependencies
- `@testing-library/react-native`: Core testing library for React Native components
- `jest`: Test runner and assertion library
- `react-test-renderer`: React rendering for tests

### Configuration Files
- **jest.config.js**: Main Jest configuration with React Native preset
- **jest.setup.js**: Global mocks and test environment setup
- **test-utils/component-test-utils.tsx**: Reusable test utilities and helpers

## Testing Patterns

### 1. Component Test Structure
```typescript
describe('ComponentName', () => {
  describe('Rendering', () => {
    // Basic rendering tests
  });
  
  describe('Interactions', () => {
    // User interaction tests
  });
  
  describe('Props Variations', () => {
    // Different prop combinations
  });
  
  describe('Edge Cases', () => {
    // Boundary conditions and error states
  });
});
```

### 2. Common Test Scenarios

#### Basic Rendering
```typescript
it('renders with required props', () => {
  const { getByText } = render(
    <Component prop="value" />
  );
  expect(getByText('Expected Text')).toBeTruthy();
});
```

#### User Interactions
```typescript
it('handles press events', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <Button onPress={onPress} title="Click Me" />
  );
  fireEvent.press(getByText('Click Me'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

#### Style Assertions
```typescript
// React Native flattens styles to arrays
const styles = Array.isArray(element.props.style) 
  ? element.props.style 
  : [element.props.style];
const hasStyle = styles.some(style => style?.property === value);
expect(hasStyle).toBeTruthy();
```

### 3. Mocking Strategies

#### Icon Mocking
All @expo/vector-icons are mocked to render as Text components:
```typescript
<Text>Icon: {iconName}</Text>
```

#### Firebase Services
Firebase services are fully mocked in jest.setup.js to prevent network calls and provide predictable test data.

#### React Navigation
Navigation hooks are mocked to return controllable navigation functions.

## Best Practices

### 1. Test Organization
- One test file per component
- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior

### 2. Test Data
- Create minimal mock data that satisfies TypeScript types
- Use factory functions for complex data structures
- Keep test data close to the tests that use it

### 3. Assertions
- Test user-visible behavior, not implementation details
- Prefer `getByText`, `getByRole` over test IDs when possible
- Test accessibility features alongside functionality

### 4. Performance
- Keep tests focused and fast
- Avoid testing external dependencies (mock them instead)
- Use `beforeEach` for common setup, but avoid over-using it

### 5. Handling React Native Specifics
- Remember that styles are flattened into arrays
- TouchableOpacity and other touchables may render as Views in tests
- Use `UNSAFE_` queries sparingly and only when necessary

## Current Test Coverage

### Completed Components (135 tests)
- ✅ **Button** (32 tests): All variants, sizes, states, and interactions
- ✅ **Input** (39 tests): Text input, validation, icons, password visibility
- ✅ **Card** (35 tests): Basic card, InfoCard, ActionCard variants
- ✅ **TaskCard** (29 tests): Task display, priorities, categories, completion states

### Pending Components
- ⏳ Modal (skipped - complex animations)
- ⏳ StatsCard
- ⏳ EmptyState
- ⏳ LoadingState
- ⏳ FilterTabs
- ⏳ NotificationPermissionHandler

## Common Issues and Solutions

### Issue: "Cannot read properties of undefined"
**Solution**: Check that all required mocks are in place in jest.setup.js

### Issue: Style assertions failing
**Solution**: Remember that React Native flattens styles into arrays. Use array methods to check for specific styles.

### Issue: TouchableOpacity not found
**Solution**: In test environment, TouchableOpacity may render as View. Use role-based queries or check for accessible elements.

### Issue: Animated.Value is not a constructor
**Solution**: Ensure Animated API is properly mocked in test setup or component test file.

## Running Tests

### Run all component tests
```bash
npm test -- --testPathPattern="__tests__"
```

### Run specific component tests
```bash
npm test -- Button.test.tsx
```

### Run with coverage
```bash
npm test -- --coverage
```

### Watch mode for development
```bash
npm test -- --watch
```

## Next Steps

1. Complete remaining component tests
2. Add integration tests for complex user flows
3. Set up visual regression testing for UI consistency
4. Implement E2E tests for critical paths
5. Configure CI/CD pipeline for automated testing

## Resources

- [React Native Testing Library Docs](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview)