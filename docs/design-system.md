# Type B Family App - Design System

## Design Philosophy
Clean, minimal, Apple-inspired design that appeals to both parents and teens without being childish or boring.

## Color Palette

### Primary Colors
```
Primary Black: #0A0A0A (from logo - premium, sophisticated)
Accent Green: #34C759 (success, checkmark from logo concept)
Warning Amber: #FF9500 (gentle warnings)
Error Red: #FF3B30 (errors only)
```

### Neutral Colors
```
Background Warm: #FAF8F5 (from logo background)
Surface White: #FFFFFF (cards, modals)
Background Texture: #F5F2ED (subtle depth)
Text Primary: #0A0A0A (black)
Text Secondary: #6B6B6B (60% black)
Text Tertiary: #9B9B9B (40% black)
Separator: #E8E5E0 (warm gray)
```

### Dark Mode (Future)
```
Background: #000000
Secondary Background: #1C1C1E
Tertiary Background: #2C2C2E
Label Primary: #FFFFFF
```

## Typography

### Font Family
- **iOS**: SF Pro Display / SF Pro Text
- **Android**: Roboto
- **Fallback**: System default

### Type Scale
```
Title Large: 34pt, Regular
Title 1: 28pt, Regular  
Title 2: 22pt, Regular
Title 3: 20pt, Regular
Headline: 17pt, Semibold
Body: 17pt, Regular
Callout: 16pt, Regular
Subheadline: 15pt, Regular
Footnote: 13pt, Regular
Caption 1: 12pt, Regular
Caption 2: 11pt, Regular
```

## Spacing System
```
XXS: 4px
XS: 8px
S: 12px
M: 16px
L: 24px
XL: 32px
XXL: 48px
```

## Component Library

### Navigation
```
Header {
  height: 44px (standard iOS)
  background: white with blur effect
  shadow: subtle bottom border
  title: centered or left-aligned
  actions: icon buttons on right
}
```

### Cards
```
TaskCard {
  padding: 16px
  borderRadius: 12px
  background: white
  shadow: 0 1px 3px rgba(0,0,0,0.1)
  margin: 8px horizontal, 4px vertical
}
```

### Buttons

#### Primary Button
```
height: 50px
borderRadius: 10px
background: #0A0A0A (black)
color: #FFFFFF
fontSize: 17px
fontWeight: 600
```

#### Secondary Button
```
height: 50px
borderRadius: 10px
background: #FAF8F5 (warm white)
color: #0A0A0A
fontSize: 17px
fontWeight: 600
border: 1px solid #E8E5E0
```

#### Text Button
```
height: 44px
color: #0A0A0A
fontSize: 17px
fontWeight: 400
```

### Form Elements

#### Text Input
```
height: 44px
borderRadius: 10px
background: #F2F2F7
padding: 12px
fontSize: 17px
border: none (until focused)
focusBorder: 1px solid #0A0A0A
```

#### Switch
```
iOS native switch component
tintColor: #34C759 when on
```

### Lists
```
ListItem {
  height: minimum 44px (touch target)
  padding: 12px horizontal
  separator: inset 16px from left
  accessories: chevron or custom
}
```

## Screen Layouts

### Dashboard (Home)
```
1. Header with family name and settings icon
2. Greeting with time-based message
3. Quick stats cards (tasks today, completion rate)
4. "My Tasks" section with filter tabs
5. Floating action button for new task
```

### Task Detail
```
1. Modal presentation with handle
2. Task title and category badge
3. Due date and reminder settings
4. Description field
5. Assigned to selector
6. Validation requirements (premium)
7. Delete option at bottom
```

### Family Management
```
1. Family name header
2. Member list with roles
3. Invite button (premium)
4. Member cards showing:
   - Avatar
   - Name
   - Role badge
   - Task stats
```

### Settings
```
1. Grouped list style
2. Sections:
   - Account
   - Family
   - Notifications
   - Subscription
   - Support
   - About
```

## Animations & Transitions

### Navigation
- Push: 300ms ease-in-out slide
- Modal: 250ms ease-out slide up
- Tab switch: 200ms fade

### Interactions
- Button press: 95% scale with 100ms duration
- Task complete: checkmark animation 400ms
- Card appear: fade in with 200ms stagger

### Feedback
- Success: subtle haptic + green checkmark
- Error: shake animation + red highlight
- Loading: iOS activity indicator

## Icons

### Style
- SF Symbols on iOS (preferred)
- Material Icons as fallback
- Line weight: 2px
- Size: 24x24px standard, 28x28px for tab bar

### Core Icons
```
add: plus.circle
task: checkmark.circle
routine: repeat
calendar: calendar
family: person.2
settings: gear
notification: bell
photo: camera
validate: checkmark.shield
premium: star.fill
```

## Empty States

### Design
- Centered illustration (simple, grayscale)
- Headline explaining the state
- Subtext with helpful context
- CTA button if actionable

### Examples
```
No Tasks: "No tasks yet"
"Create your first task to get started"
[+ Create Task]

No Family: "Flying solo"  
"Invite family members to collaborate"
[Invite Family] (premium)
```

## Accessibility

### Requirements
- Minimum touch target: 44x44px
- Color contrast: WCAG AA (4.5:1)
- Font scaling: Support dynamic type
- VoiceOver: Full label support

### Implementation
- Semantic colors for color blind users
- High contrast mode support
- Reduce motion option
- Clear focus indicators

## Platform Differences

### iOS Specific
- Safe area insets respected
- Swipe gestures for navigation
- Native date/time pickers
- iOS-style switches and segmented controls

### Android Adaptations
- Material Design where appropriate
- Back button handling
- Material date/time pickers
- FAB positioning

## Loading & Progress

### Skeleton Screens
- Show layout structure while loading
- Animated shimmer effect
- Match actual content layout

### Progress Indicators
- Linear progress for determinate operations
- Circular spinner for indeterminate
- Subtle animations to show activity

## Error Handling

### Inline Errors
- Red text below input fields
- 13pt font size
- Shake animation on submit attempt

### Toast/Snackbar
- Bottom positioned
- 3-second auto-dismiss
- Action button for undo/retry

### Error Screens
- Centered error illustration
- Clear error message
- Retry button
- Contact support link

## Onboarding Flow

### Welcome Screen
- App logo
- Value proposition
- Sign up / Sign in buttons

### Account Creation
1. Email and password
2. Name and role selection
3. Family setup (create or join)
4. Enable notifications
5. Subscription upsell (skippable)

### First Task
- Guided task creation
- Tooltip overlays
- Success celebration

## Premium UI Elements

### Badges
- "PRO" badge on premium features
- Gold star icon
- Subtle gradient background

### Upsell Cards
- Soft gradient background
- Feature comparison
- Clear CTA button
- Dismissible but reappears strategically

## Responsive Design

### Breakpoints
- Phone: 320-428px width
- Tablet: 428-768px width
- Large tablet: 768px+ width

### Adaptations
- Single column on phone
- Two column on tablet for dashboard
- Sidebar navigation on iPad
- Increased spacing on larger screens

## Performance Guidelines

### Image Optimization
- Lazy loading for images
- Thumbnail generation for photos
- WebP format where supported
- Maximum 100KB for UI assets

### Animation Performance
- Use native driver for animations
- 60fps target
- Disable on low-end devices
- CSS transforms over position changes