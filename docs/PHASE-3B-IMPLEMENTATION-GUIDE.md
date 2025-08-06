# Phase 3B: Screen Implementation Guide

## 🎯 Implementation Strategy

### Core Principles
1. **Start with Dashboard** - Most complex, sets patterns
2. **Connect real data early** - Don't build with mock data
3. **Fix accessibility as we go** - Don't defer to later
4. **Test each screen before moving on** - Maintain quality

## 📱 Screen-by-Screen Implementation

### 1. Dashboard Screen Implementation

#### File Structure
```
src/screens/dashboard/
├── DashboardScreen.tsx       # Main screen component
├── components/
│   ├── FilterTabs.tsx        # Task filter tabs
│   ├── TaskSection.tsx       # Task list section
│   ├── QuickStats.tsx        # Stats summary
│   └── ActivityFeed.tsx      # Family activity
└── hooks/
    └── useDashboardData.ts   # Data fetching hook
```

#### Implementation Steps
```typescript
// 1. Create custom hook for data
const useDashboardData = () => {
  const tasks = useAppSelector(selectUserTasks);
  const family = useAppSelector(selectFamily);
  const stats = useAppSelector(selectTaskStats);
  
  // Calculate derived data
  const todaysTasks = useMemo(() => {
    return tasks.filter(task => isToday(task.dueDate));
  }, [tasks]);
  
  return { tasks, family, stats, todaysTasks };
};

// 2. Build main screen structure
const DashboardScreen = () => {
  const { tasks, stats } = useDashboardData();
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue'>('today');
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        <WelcomeSection />
        <QuickStats stats={stats} />
        <FilterTabs value={filter} onChange={setFilter} />
        <TaskSection tasks={filteredTasks} filter={filter} />
      </ScrollView>
    </SafeAreaView>
  );
};
```

#### Required New Components
- **FilterTabs**: Segmented control for filtering
- **WelcomeSection**: Time-based greeting
- **QuickStats**: Uses existing StatsCard
- **TaskSection**: Uses existing TaskCard

### 2. Task Screens Implementation

#### File Structure
```
src/screens/tasks/
├── TasksScreen.tsx           # Main list screen
├── TaskDetailModal.tsx       # View/edit modal
├── CreateTaskModal.tsx       # Create new task
├── components/
│   ├── TaskFilters.tsx      # Search and filter
│   ├── CategorySelector.tsx # Category picker
│   ├── DateTimePicker.tsx   # Due date selector
│   └── AssigneeSelector.tsx # Family member picker
└── hooks/
    └── useTaskForm.ts        # Form logic hook
```

#### Key Implementation Points
```typescript
// Task form with validation
const useTaskForm = (initialTask?: Task) => {
  const [form, setForm] = useState({
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    category: initialTask?.category || null,
    dueDate: initialTask?.dueDate || new Date(),
    assignedTo: initialTask?.assignedTo || [],
    requiresPhoto: initialTask?.requiresPhoto || false,
  });
  
  const validation = Yup.object({
    title: Yup.string().required('Task title is required'),
    category: Yup.object().required('Please select a category'),
    assignedTo: Yup.array().min(1, 'Assign to at least one person'),
  });
  
  return { form, setForm, validation, isValid };
};
```

### 3. Family Screen Implementation

#### File Structure
```
src/screens/family/
├── FamilyScreen.tsx          # Member list
├── InviteModal.tsx           # Invite flow
├── JoinFamilyModal.tsx       # Join with code
├── components/
│   ├── MemberCard.tsx        # Member display
│   ├── InviteCode.tsx        # Code display/share
│   └── RoleSelector.tsx      # Role management
└── hooks/
    └── useFamilyManagement.ts
```

#### Premium Gate Implementation
```typescript
const InviteButton = () => {
  const isPremium = useAppSelector(selectIsPremium);
  
  if (!isPremium) {
    return (
      <Button
        variant="secondary"
        onPress={() => navigation.navigate('Subscription')}
        icon={<Feather name="lock" />}
      >
        Upgrade to Invite Members
      </Button>
    );
  }
  
  return (
    <Button variant="primary" onPress={openInviteModal}>
      Invite Family Member
    </Button>
  );
};
```

### 4. Settings Screen Implementation

#### File Structure
```
src/screens/settings/
├── SettingsScreen.tsx        # Main settings
├── ProfileScreen.tsx         # Profile editing
├── NotificationSettings.tsx  # Notification prefs
├── components/
│   ├── SettingsRow.tsx       # List item
│   ├── SettingsSection.tsx   # Grouped items
│   └── SubscriptionCard.tsx  # Premium status
└── hooks/
    └── useSettings.ts
```

#### Settings Structure
```typescript
const settingsSections = [
  {
    title: 'Account',
    items: [
      { label: 'Profile', icon: 'user', screen: 'Profile' },
      { label: 'Email', icon: 'mail', screen: 'EmailSettings' },
      { label: 'Password', icon: 'lock', screen: 'PasswordChange' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { label: 'Notifications', icon: 'bell', screen: 'Notifications' },
      { label: 'Quiet Hours', icon: 'moon', screen: 'QuietHours' },
      { label: 'Week Start', icon: 'calendar', screen: 'WeekStart' },
    ],
  },
  {
    title: 'Premium',
    items: [
      { label: 'Subscription', icon: 'star', screen: 'Subscription' },
    ],
  },
];
```

### 5. Onboarding Flow Implementation

#### File Structure
```
src/screens/onboarding/
├── OnboardingNavigator.tsx   # Flow controller
├── WelcomeScreen.tsx         # Initial screen
├── FamilySetupScreen.tsx     # Create/join family
├── FirstTaskScreen.tsx       # Tutorial
├── components/
│   ├── OnboardingSlide.tsx   # Slide template
│   ├── ProgressDots.tsx      # Progress indicator
│   └── SkipButton.tsx        # Skip to main app
└── hooks/
    └── useOnboarding.ts
```

#### Simplified 3-Screen Flow
```typescript
const OnboardingNavigator = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const screens = [
    <WelcomeScreen onNext={() => setCurrentStep(1)} />,
    <FamilySetupScreen onNext={() => setCurrentStep(2)} />,
    <FirstTaskScreen onComplete={completeOnboarding} />,
  ];
  
  return (
    <View style={styles.container}>
      {screens[currentStep]}
      <ProgressDots total={3} current={currentStep} />
    </View>
  );
};
```

## 🔧 Common Patterns

### Data Loading Pattern
```typescript
const useScreenData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadData()
      .then(handleSuccess)
      .catch(handleError)
      .finally(() => setLoading(false));
  }, []);
  
  return { loading, error, retry: loadData };
};
```

### Form Handling Pattern
```typescript
const useForm = <T>(initialValues: T, validation: Yup.Schema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = async () => {
    try {
      await validation.validate(values, { abortEarly: false });
      return true;
    } catch (err) {
      setErrors(formatYupErrors(err));
      return false;
    }
  };
  
  return { values, errors, touched, setFieldValue, validate };
};
```

### Modal Presentation Pattern
```typescript
const useModal = () => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);
  
  const open = (modalData = null) => {
    setData(modalData);
    setVisible(true);
  };
  
  const close = () => {
    setVisible(false);
    setTimeout(() => setData(null), 300); // Clear after animation
  };
  
  return { visible, data, open, close };
};
```

## 🎨 Component Templates

### New Component Template
```typescript
import React, { FC, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface ComponentNameProps {
  // Props here
  testID?: string;
  accessibilityLabel?: string;
}

export const ComponentName: FC<ComponentNameProps> = memo(({
  testID = 'component-name',
  accessibilityLabel,
  ...props
}) => {
  return (
    <View 
      style={styles.container}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Component content */}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    // Styles
  },
});
```

### Screen Template
```typescript
import React, { FC, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { theme } from '@/constants/theme';

export const ScreenName: FC = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector(selectScreenData);
  
  useEffect(() => {
    // Load data on mount
  }, []);
  
  if (loading) {
    return <LoadingState variant="screen" />;
  }
  
  if (error) {
    return (
      <EmptyState
        icon="alert-circle"
        title="Something went wrong"
        message={error}
        action={{
          label: 'Try Again',
          onPress: retry,
        }}
      />
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title="No data yet"
        message="Get started by adding your first item"
      />
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Screen content */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
});
```

## ✅ Accessibility Checklist

For each component/screen:
- [ ] Add `testID` prop for testing
- [ ] Add `accessibilityLabel` for screen readers
- [ ] Add `accessibilityHint` for complex interactions
- [ ] Ensure minimum 44x44 touch targets
- [ ] Test with VoiceOver (iOS)
- [ ] Check color contrast (4.5:1 minimum)
- [ ] Support dynamic font sizes

## 🚀 Performance Checklist

For each screen:
- [ ] Use `React.memo` for expensive components
- [ ] Use `useMemo` for expensive calculations
- [ ] Use `useCallback` for event handlers
- [ ] Implement list virtualization (FlatList)
- [ ] Lazy load heavy components
- [ ] Optimize images (resize, compress)
- [ ] Use native driver for animations

## 🧪 Testing Requirements

### Component Tests
```typescript
describe('ComponentName', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(<ComponentName />);
    expect(getByTestId('component-name')).toBeTruthy();
  });
  
  it('handles user interaction', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ComponentName onPress={onPress} />);
    fireEvent.press(getByTestId('button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Screen Tests
```typescript
describe('ScreenName', () => {
  it('loads data on mount', async () => {
    const { getByTestId } = render(<ScreenName />);
    await waitFor(() => {
      expect(getByTestId('content')).toBeTruthy();
    });
  });
  
  it('handles error state', () => {
    // Mock error response
    const { getByText } = render(<ScreenName />);
    expect(getByText('Something went wrong')).toBeTruthy();
  });
});
```

## 📝 Documentation Requirements

For each screen, document:
1. **Purpose**: What the screen does
2. **Data requirements**: What Redux/Firebase data it needs
3. **Navigation**: How users get to/from this screen
4. **Premium features**: What requires subscription
5. **Edge cases**: Empty states, errors, offline

## 🎯 Definition of Done

A screen is complete when:
- [ ] Fully functional with real data
- [ ] All accessibility props added
- [ ] Animations use native driver
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Empty states designed
- [ ] Connected to Redux
- [ ] TypeScript fully typed
- [ ] Component tests written
- [ ] Screen documented
- [ ] No console warnings
- [ ] Smooth 60fps performance

---

**Remember**: Quality over speed. Each screen should be production-ready before moving to the next.