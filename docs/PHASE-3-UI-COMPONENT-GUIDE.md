# Phase 3: UI Component Guide & Visual Mockups

## 🎨 Design System Overview

Based on our style guidelines, we're creating a **premium, minimal, Apple-inspired** design that appeals to both parents and teens.

### Core Design Principles
1. **Clean & Minimal**: Lots of whitespace, clear hierarchy
2. **Premium Feel**: Black primary color from logo, sophisticated touches
3. **Warm & Inviting**: Warm background (#FAF8F5) from logo
4. **Not Childish**: Professional but approachable

## 🎯 Component Library Preview

### 1. Task Card Component

```
┌─────────────────────────────────────────┐
│  ┌───┐  Clean the Kitchen               │
│  │ ✓ │  [home] Chores • High Priority   │
│  └───┘  [person] Assigned to Sarah      │
│         [calendar] Due today at 5:00 PM  │
└─────────────────────────────────────────┘
```

**Design Specs:**
- Background: #FFFFFF
- Border Radius: 12px
- Padding: 16px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Checkbox: 24x24px, green (#34C759) when checked

**React Native Code Structure:**
```tsx
<TouchableOpacity style={styles.taskCard}>
  <View style={styles.taskHeader}>
    <Checkbox status={task.status} />
    <Text style={styles.taskTitle}>{task.title}</Text>
  </View>
  <View style={styles.taskMeta}>
    <CategoryBadge category={task.category} />
    <Text style={styles.priority}>High Priority</Text>
  </View>
  <View style={styles.taskFooter}>
    <UserAvatar user={task.assignedTo} />
    <Text style={styles.dueDate}>Due today at 5:00 PM</Text>
  </View>
</TouchableOpacity>
```

### 2. Dashboard Screen Layout

```
┌─────────────────────────────────────────┐
│ ╔═══════════════════════════════════════╗
│ ║  The Smith Family          ⚙️         ║
│ ╚═══════════════════════════════════════╝
│                                          │
│  Good morning, Sarah!                   │
│  You have 3 tasks today                  │
│                                          │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ Today's     │  │ Completion  │       │
│  │ Tasks       │  │ Rate        │       │
│  │    3        │  │   85%       │       │
│  └─────────────┘  └─────────────┘       │
│                                          │
│  My Tasks ─────────────────────          │
│  [All] [Today] [Upcoming] [Completed]    │
│                                          │
│  ┌─────────────────────────────────┐     │
│  │ [checkmark.circle] Task Card 1  │     │
│  └─────────────────────────────────┘     │
│  ┌─────────────────────────────────┐     │
│  │ [checkmark.circle] Task Card 2  │     │
│  └─────────────────────────────────┘     │
│                                          │
│              [ + ]                       │
└─────────────────────────────────────────┘
```

**Key Elements:**
- Warm background: #FAF8F5
- White cards with subtle shadows
- Tab filters using segmented control
- Floating Action Button (FAB) for new tasks

### 3. Button Styles

#### Primary Button (CTA)
```
╔═══════════════════════════════╗
║        Create Task            ║
╚═══════════════════════════════╝
```
- Background: #0A0A0A (black)
- Text: #FFFFFF
- Height: 50px
- Border Radius: 10px
- Font: 17px, Semibold

#### Secondary Button
```
┌───────────────────────────────┐
│         Join Family           │
└───────────────────────────────┘
```
- Background: #FAF8F5
- Text: #0A0A0A
- Border: 1px solid #E8E5E0
- Height: 50px

### 4. Form Input Components

#### Text Input
```
┌─────────────────────────────────────────┐
│ Task title...                           │
└─────────────────────────────────────────┘
```
- Background: #F2F2F7
- Height: 44px
- Border Radius: 10px
- Focus Border: 1px solid #0A0A0A

#### Category Selector
```
┌─────────────────────────────────────────┐
│ 🏠 Chores          ▼                    │
└─────────────────────────────────────────┘
```

### 5. Navigation Components

#### Tab Bar
```
┌─────┬─────┬─────┬─────┬─────┐
│ [list.bullet] │ [checkmark] │ [person.2] │ [gear] │     │
│Tasks│Done │Family│ Set │     │
└─────┴─────┴─────┴─────┴─────┘
```
- Active: Black icon + label
- Inactive: Gray (#6B6B6B)
- Height: 49px (iOS standard)

### 6. Empty States

```
┌─────────────────────────────────────────┐
│                                         │
│         [doc.text]                      │
│                                         │
│        No tasks yet!                    │
│   Create your first task to             │
│        get started                      │
│                                         │
│     ╔═══════════════════════╗           │
│     ║    Create Task        ║           │
│     ╚═══════════════════════╝           │
│                                         │
└─────────────────────────────────────────┘
```

### 7. Modal Presentations

#### Task Creation Modal
```
┌─────────────────────────────────────────┐
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                         │
│ Cancel          New Task          Save  │
│ ─────────────────────────────────────── │
│                                         │
│ Title                                   │
│ ┌─────────────────────────────────────┐ │
│ │ Clean the kitchen                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Category                                │
│ ┌─────────────────────────────────────┐ │
│ │ [home] Chores                  ▼   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Assign to                               │
│ ┌─────────────────────────────────────┐ │
│ │ [person] Sarah                 ▼   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Due Date                                │
│ ┌─────────────────────────────────────┐ │
│ │ Today at 5:00 PM          [calendar]│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ ] Set Reminder                        │
│ [ ] Require Photo Proof (PRO)           │
│                                         │
└─────────────────────────────────────────┘
```

### 8. Premium Feature Indicators

```
┌─────────────────────────────────────────┐
│  Photo Validation  [star.fill] PRO      │
│  ─────────────────────────────────────  │
│  Require photo proof when tasks are     │
│  completed for extra accountability     │
│                                         │
│  ╔═══════════════════════════════╗      │
│  ║      Upgrade to Pro          ║      │
│  ╚═══════════════════════════════╝      │
└─────────────────────────────────────────┘
```

## 🎯 Screen-by-Screen Breakdown

### 1. Onboarding Flow (3 Screens)

#### Screen 1: Welcome
```
┌─────────────────────────────────────────┐
│                                         │
│              [Logo]                     │
│                                         │
│         TypeB Family                    │
│    More than checking the box           │
│                                         │
│                                         │
│     ╔═══════════════════════════════╗   │
│     ║      Get Started             ║   │
│     ╚═══════════════════════════════╝   │
│                                         │
│     Already have an account? Sign In    │
│                                         │
└─────────────────────────────────────────┘
```

#### Screen 2: Create/Join Family
```
┌─────────────────────────────────────────┐
│                                         │
│        Let's set up your family         │
│                                         │
│     ╔═══════════════════════════════╗   │
│     ║    Create New Family         ║   │
│     ╚═══════════════════════════════╝   │
│                                         │
│              — or —                     │
│                                         │
│     ┌───────────────────────────────┐   │
│     │    Join Existing Family       │   │
│     └───────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

#### Screen 3: First Task Tutorial
```
┌─────────────────────────────────────────┐
│                                         │
│     Create your first task!             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Try creating a simple task      │    │
│  │ like "Take out trash" ↓         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Interactive task creation demo]        │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Family Management Screen

```
┌─────────────────────────────────────────┐
│ ╔═══════════════════════════════════════╗
│ ║  ← Back        The Smiths             ║
│ ╚═══════════════════════════════════════╝
│                                         │
│  Family Code: ABC123                    │
│  ┌───────────────────────────────┐      │
│  │      Share Invite Code        │      │
│  └───────────────────────────────┘      │
│                                         │
│  Members (3/4)                          │
│  ─────────────────────────────────      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [person.fill] John Smith        │    │
│  │    Parent • 12 tasks completed  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ [person.fill] Sarah Smith       │    │
│  │    Child • 45 tasks completed   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ╔═══════════════════════════════╗      │
│  ║   Invite Family Member [star] ║      │
│  ╚═══════════════════════════════╝      │
└─────────────────────────────────────────┘
```

## 🎨 Color Usage Guidelines

### Primary Actions
- **Black (#0A0A0A)**: Primary buttons, active states
- **Green (#34C759)**: Success states, checkmarks

### Backgrounds
- **Warm White (#FAF8F5)**: Main app background
- **Pure White (#FFFFFF)**: Cards, modals
- **Light Gray (#F2F2F7)**: Input fields

### Text Hierarchy
- **Primary (#0A0A0A)**: Titles, important text
- **Secondary (#6B6B6B)**: Subtitles, meta info
- **Tertiary (#9B9B9B)**: Hints, placeholders

## 📱 Platform-Specific Adaptations

### iOS
- Use SF Symbols for icons
- Native iOS switches
- Swipe gestures for actions
- Haptic feedback on interactions

### Android
- Material Design icons as fallback
- Material ripple effects
- FAB positioning (bottom right)
- Back button handling

## ⚡ Animation Guidelines

### Micro-interactions
- **Button Press**: Scale to 95% for 100ms
- **Task Complete**: Checkmark animation 400ms
- **Card Appear**: Fade in with 200ms stagger

### Screen Transitions
- **Push**: 300ms slide from right
- **Modal**: 250ms slide up from bottom
- **Tab Switch**: 200ms cross-fade

## 🚀 Implementation Priority

### Phase 3A: Core Components (Week 1, Days 1-2)
1. Button components (Primary, Secondary, Text)
2. Input components (TextInput, Selector)
3. Card components (TaskCard, StatsCard)
4. Navigation setup

### Phase 3B: Main Screens (Days 3-4)
1. Dashboard screen
2. Task list/detail screens
3. Family management screen
4. Settings screen

### Phase 3C: Polish & Animations (Day 5)
1. Empty states
2. Loading states
3. Animations
4. Error handling

## ✅ Component Checklist

Before implementing each component:
- [ ] Matches design system colors
- [ ] Follows spacing guidelines
- [ ] Includes loading states
- [ ] Handles errors gracefully
- [ ] Supports both iOS/Android
- [ ] Accessible (44px touch targets)
- [ ] Performs well (60fps animations)

This guide ensures we build consistent, beautiful UI that matches our premium brand positioning while being practical and user-friendly.