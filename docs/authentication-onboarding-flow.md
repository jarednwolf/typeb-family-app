# TypeB - Authentication & Onboarding Flow

## Authentication Architecture

### Flow Overview
```
App Launch → Check Auth State → Route Decision
                ↓                      ↓
          Not Authenticated      Authenticated
                ↓                      ↓
          Welcome Screen          Check Family
                ↓                      ↓
          Sign Up/Sign In         Has Family?
                ↓                   ↙        ↘
          Email Verification    Yes          No
                ↓                ↓            ↓
          Create/Join Family   Dashboard   Family Setup
                ↓                             ↓
          Role Selection                 Dashboard
                ↓
          Dashboard
```

### Authentication Implementation

#### 1. Persistent Session
- Store auth token in secure storage (Expo SecureStore)
- Auto-login if valid token exists
- Refresh token before expiry (30-day lifetime)
- Biometric unlock option (Face ID/Touch ID) after first login

#### 2. Sign Up Flow
```
1. Email & Password input
2. Instant validation (as they type)
3. Create account → Send verification email
4. Allow limited access while unverified
5. Full access after email verification
```

#### 3. Family Context
- After auth, check if user has family
- Solo users (family of 1) skip family setup
- New users prompted to create or join family
- Join via 6-character invite code

## Engaging Onboarding Strategy

### Progressive Onboarding (Not All at Once)

#### Screen 1: Welcome + Signup (Combined!)
```
TypeB
More than checking the box

Email: [________________]
Password: [________________]

[Get Started] - Black button
[I have an account] - Text link

By continuing, you agree to our Terms & Privacy
```

#### Screen 2: Your Goal (Quick Choice)
```
I want to...

◉ Organize myself
○ Organize my family

[Continue] - Black button
```

#### Screen 3: Success! (Immediate Value)
```
✓ You're in!

Let's create your first task
(or explore on your own)

[Create First Task] - Black button
[Skip] - Text link
```

**THAT'S IT. 60 seconds to value.**

### Onboarding Principles

1. **Show Value Immediately**
   - Display pre-populated example tasks
   - Show beautiful, populated dashboard
   - Demonstrate the "after" state

2. **Reduce Friction**
   - Social login options (Apple/Google) for faster signup
   - Skip family setup if solo user
   - Allow exploration before requiring all info

3. **Celebrate Small Wins**
   - Confetti on first task created
   - Progress bar showing setup completion
   - "Great job!" messages without being patronizing

4. **Smart Defaults**
   - Pre-select common categories
   - Suggest task times based on time of day
   - Auto-generate family name from user's last name

## Development Progress Tracking

### Phase Tracking System

#### 1. GitHub Project Board
```
Columns:
- Backlog
- Day 1 Tasks
- Day 2 Tasks
- Day 3 Tasks
- In Progress
- Testing
- Done
```

#### 2. Daily Status Document
```markdown
# TypeB Development - Day X Status

## Completed Today
- ✅ Firebase setup
- ✅ Authentication flow
- ✅ Basic navigation

## In Progress
- 🔄 Dashboard UI (70% complete)
- 🔄 Task creation form (40% complete)

## Blockers
- None / Issue description

## Tomorrow's Priority
1. Complete dashboard
2. Start notification system
3. Add task CRUD operations

## Metrics
- Lines of Code: X
- Test Coverage: X%
- Components Built: X/Y
```

#### 3. Commit Message Convention
```
feat(auth): implement email verification
fix(tasks): resolve timezone issue  
test(dashboard): add unit tests
docs(api): update service documentation
style(ui): adjust color palette
```

#### 4. Time Boxing
- 2-hour blocks for major features
- 30-minute check-ins on progress
- Document decisions immediately
- Test as we go, not at end

## Color Palette (Based on Logo Analysis)

### Primary Colors
```css
/* Derived from your logo */
--primary-black: #0A0A0A;        /* Logo black */
--background-warm: #FAF8F5;      /* Warm off-white from logo bg */
--background-texture: #F5F2ED;   /* Slightly darker for depth */

/* Supporting colors */
--primary-black: #0A0A0A;        /* Black from logo for CTAs */
--success-green: #34C759;        /* Checkmark/completion */
--warning-amber: #FF9500;        /* Gentle warnings */
--error-red: #FF3B30;           /* Errors only */
```

### UI Color Applications
```css
/* Backgrounds */
--bg-primary: #FAF8F5;           /* Main background */
--bg-secondary: #FFFFFF;         /* Cards, modals */
--bg-tertiary: #F5F2ED;         /* Subtle sections */

/* Text */
--text-primary: #0A0A0A;         /* Main text */
--text-secondary: #6B6B6B;       /* Subtitles */
--text-tertiary: #9B9B9B;        /* Hints */

/* Borders & Dividers */
--border-light: #E8E5E0;         /* Subtle borders */
--border-medium: #D4D1CC;        /* Defined borders */

/* Interactive States */
--hover-state: rgba(0,122,255,0.08);  /* Subtle blue tint */
--pressed-state: rgba(0,122,255,0.12); /* Deeper blue */
```

### Design Characteristics
1. **Warm Minimalism**: The off-white background creates warmth vs stark white
2. **High Contrast**: Black on warm white ensures readability
3. **Subtle Depth**: Use shadows sparingly, rely on color layers
4. **Checkmark Green**: Pull from logo's implied completion metaphor

### Typography Pairing
```css
/* Matches logo's modern, clean aesthetic */
--font-display: -apple-system, "SF Pro Display", sans-serif;
--font-body: -apple-system, "SF Pro Text", sans-serif;
--font-mono: "SF Mono", Monaco, monospace;

/* Weight scale */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

## Authentication Security Considerations

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- Real-time strength indicator

### Security Features
- Rate limiting (5 attempts per 15 minutes)
- Account lockout after 10 failed attempts
- Email verification required for full access
- Optional 2FA for family managers (future)

### Session Management
- 30-day token expiration
- Refresh token rotation
- Logout from all devices option
- Activity timeout after 30 days inactive

## Onboarding Metrics to Track

### Engagement Metrics
```javascript
analytics.track('onboarding_started');
analytics.track('onboarding_screen_viewed', { screen: 'value_prop' });
analytics.track('account_created');
analytics.track('family_created');
analytics.track('first_task_created');
analytics.track('notifications_enabled');
analytics.track('onboarding_completed', { 
  duration_seconds: timeElapsed,
  skipped_screens: []
});
```

### Drop-off Points
- Monitor where users abandon
- A/B test different value propositions
- Test social login vs email
- Optimize based on data

## Quick Wins for Engagement

1. **Sample Data**: Show populated dashboard immediately
2. **Quick Success**: First task takes < 30 seconds
3. **Social Proof**: "Join 10,000+ families getting organized"
4. **Progress Indicator**: Show setup completion %
5. **Skip Options**: Let power users jump ahead
6. **Contextual Help**: Tooltips on first use of features

## Error Recovery

### Common Auth Errors
- "Email already exists" → Offer sign in instead
- "Weak password" → Show requirements inline
- "Network error" → Queue for retry, allow offline exploration
- "Invalid code" → Clear instructions for getting new code

### Friendly Error Messages
```typescript
const authErrors = {
  'auth/email-already-in-use': 
    "Looks like you already have an account! Let's sign you in instead.",
  'auth/weak-password': 
    "Let's make that password a bit stronger - try adding a number and capital letter!",
  'auth/invalid-email': 
    "Hmm, that email doesn't look quite right. Mind double-checking it?",
  'auth/user-not-found': 
    "We couldn't find that account. Want to create a new one?",
  'auth/wrong-password': 
    "That password doesn't match. Give it another try or reset it.",
};
```

## Next Steps for Implementation

### Day 1 Auth Priorities
1. Basic email/password auth working
2. Session persistence
3. Auth state management in Redux
4. Protected route navigation
5. Basic error handling

### Day 2 Onboarding
1. Welcome screens with skip option
2. Family creation/join flow
3. First task guided creation
4. Permission requests
5. Completion celebration

### Future Enhancements
- Social login (Apple/Google)
- Biometric authentication
- Password reset flow
- 2FA for managers
- Magic link login option