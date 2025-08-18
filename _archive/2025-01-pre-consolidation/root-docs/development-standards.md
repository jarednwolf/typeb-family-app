# TypeB - Development Standards & Decisions

## CRITICAL RULE #1: MASTER TRACKER
**THE MASTER-TRACKER.md FILE IS THE SINGLE SOURCE OF TRUTH**
- Never use ephemeral todo lists
- Update MASTER-TRACKER.md after EVERY work session
- Check off completed items with [x]
- Add timestamps for major completions
- Document all blockers and decisions
- This file persists across all sessions and is our continuity

## CRITICAL RULE #2: DOCUMENTATION CONSISTENCY
**CLEAN DOCS AFTER EVERY PHASE COMPLETION**
- Review all docs for outdated information
- Ensure consistency with latest decisions
- Update cross-references between docs
- Run before pushing to git/firebase
- Commit with: `docs: phase X cleanup and consistency update`

## CRITICAL RULE #3: AI ASSISTANT GUIDELINES
**ENFORCE SINGLE SOURCE OF TRUTH**
- ALWAYS check MASTER-TRACKER.md and existing docs first
- NEVER create new planning documents if one already exists
- Follow the SINGLE SOURCE OF TRUTH principle
- Reference existing documentation instead of creating duplicates
- Update existing docs rather than creating new ones

## Core Principles
- **No emojis** - Never use emojis in UI, code, comments, or documentation
- **Test-first development** - Assume nothing works until proven
- **Comprehensive documentation** - Every service decision documented
- **Single source of truth** - Redux store for all application state
- **Offline-first** - Full offline capability (incremental implementation OK)
- **Privacy-first** - Manager consent covers family, no data selling

## App Identity
- **Name**: TypeB
- **Tagline**: "More than checking the box"
- **Design Philosophy**: Clean, minimal, Apple-inspired
- **Icon Library**: Feather Icons (clean, minimal icons matching our premium aesthetic)
- **Target Audience**: Middle school through college age (Type B personalities)
- **Role System**: Customizable roles with presets (Family, Roommates, Team, Custom)

## Technical Architecture

### Stack
- **Framework**: React Native with Expo
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **State Management**: Redux Toolkit with feature-based slices
- **Testing**: Jest + React Native Testing Library + Detox (v20.13.5)
- **Analytics**: Firebase Analytics (comprehensive tracking)
- **Payments**: RevenueCat for subscriptions
- **Feature Flags**: Firebase Remote Config
- **Component Testing**: 253 tests implemented (91-100% coverage on tested components)
- **E2E Testing**: 60 tests written (auth, family, tasks flows)

### Code Organization
```
/src/features/
  /tasks/
    tasksSlice.ts      (Redux state)
    tasksService.ts    (Firebase operations)
    TasksScreen.tsx    (UI components)
    tasks.test.ts      (Tests)
    README.md          (Service documentation)
```

### Documentation Requirements
- **Services**: Complete documentation of all decisions, setup, architecture
- **Functions**: Clear description of purpose and what it accomplishes
- **Tech Debt**: Always log dependencies and debt items with TODO/FIXME
- **Comments**: Focus on "why" not "what", document assumptions
- **Progress**: Update MASTER-TRACKER.md constantly
- **Consistency**: Clean all docs after each phase completion

## UI/UX Standards

### Color Palette (From Logo Analysis)
```css
--primary-black: #0A0A0A;        /* Logo black */
--background-warm: #FAF8F5;      /* Warm off-white from logo */
--background-texture: #F5F2ED;   /* Slightly darker for depth */
--primary-black: #0A0A0A;        /* Black from logo for CTAs */
--success-green: #34C759;        /* Checkmark/completion */
--warning-amber: #FF9500;        /* Gentle warnings */
--error-red: #FF3B30;           /* Errors only */
```

### Communication Tone
- **Error Messages**: Friendly but concise (e.g., "Oops, we couldn't save that task. Let's try again!")
- **Success Messages**: Positive reinforcement without being childish
- **Instructions**: Clear, actionable, brief

### Form Behavior
- **Validation**: Instant validation as user types
- **Submit Button**: Disabled until all fields valid
- **Error Display**: Inline below fields, red text, clear explanation

### Loading & Performance
- **Optimistic Updates**: Show success immediately, rollback if failed
- **Progressive Loading**: Display cached data, sync in background
- **Skeleton Screens**: Only for initial app load
- **Sync Indicators**: Subtle, non-blocking

### Feedback & Celebrations
- **Task Completion**: Checkmark animation for all, progress updates shown
- **Milestones**: Confetti for daily completion, streak achievements
- **Sound**: Subtle haptics, optional sounds (user configurable)

## Feature Specifications

### Task Management
- **Categories**: Pre-defined (Chores, Homework, Exercise, Personal, Other)
- **Assignment**: Direct assignment by parent
- **Templates**: Basic starter pack for all age levels
- **Recurring Tasks**: All visible in upcoming, completed auto-clear, overdue summarized
- **Validation**: Photo/text proof (premium feature)

### Notifications
- **Default**: Persistent but polite
- **Escalation**: Smart escalation to parent if ignored
- **Customization**: Per-task settings (future premium feature)
- **Quiet Hours**: Respect user-defined quiet times

### Privacy & Data
- **Consent Model**: Family parent consent covers all members
- **Data Visibility**: Strict isolation - children see own tasks, parents see all
- **Analytics**: Track everything for optimization, anonymized where possible
- **Future**: Configurable privacy settings (premium)

### Dashboard
**Priority Order**:
1. Open tasks requiring action
2. Tasks needing review/validation
3. Achievements/streaks to acknowledge
4. Upcoming tasks
5. Family activity summary

### Onboarding Preferences
- **Quiet Hours**: When not to send notifications
- **Default Reminder Time**: Minutes before task
- **Week Starts On**: Sunday or Monday preference

## Monetization

### Pricing
- **Free Tier**: 1 family member (personal use/trial)
- **Premium**: $4.99/month with 7-day free trial
  - Add family members (up to 10)
  - Photo validation for tasks
  - Smart notification escalation
  - Advanced analytics
  - Custom task categories
  - Custom role names (beyond presets)
  - Priority support

### Premium Gates
- Adding family members (>1 member)
- Photo validation for tasks
- Advanced analytics dashboard
- Custom task categories
- Smart notification escalation
- Role customization (beyond presets)
- Priority support access

## Development Workflow

### Daily Process
1. Check MASTER-TRACKER.md for current status
2. Update "Session Notes" section with plan
3. Work on tasks in order
4. Check off completed items with [x]
5. Update metrics and test coverage
6. Document any blockers or decisions
7. Commit changes with conventional commits

### Git Strategy
- **Push Frequency**: Every 2 hours OR feature completion
- **Branch Strategy**: main → develop → feature branches
- **Commit Format**: `feat:`, `fix:`, `test:`, `docs:`, `style:`, `refactor:`
- **Never**: Leave uncommitted code > 2 hours

### Environment Strategy
- **Start Simple**: Single Firebase project for dev and beta
- **TestFlight**: Deploy from same Firebase initially
- **Production Split**: Only after App Store approval
- **Staging**: Add only when we have paying users

### Phase Completion Checklist
1. [ ] All phase tasks completed
2. [ ] Tests written and passing
3. [ ] Documentation updated
4. [ ] MASTER-TRACKER.md current
5. [ ] Docs cleaned for consistency
6. [ ] Code committed and pushed
7. [ ] Ready for next phase

### Release Cadence
- **Beta Phase**: Daily updates for bug fixes
- **Post-Launch**: Weekly sprints
- **A/B Testing**: Feature flags for all new features
- **Versioning**: Semantic versioning (major.minor.patch)

### Testing Requirements
- **Coverage**: Minimum 80% overall, 95% for critical paths
- **Types**: Unit, integration, E2E for critical flows
- **Component Tests**: 253 passing tests across 8 core components
- **E2E Tests**: 60 comprehensive tests written (P0: 11 critical, P1: 17 high priority)
- **Device Testing**: iPhone primary, iPad support, Android testing
- **Manual Testing**: Checklist before each release
- **Testing Infrastructure**: Firebase emulators configured, Detox setup complete

## Performance Targets
- **App Launch**: < 2 seconds
- **Screen Navigation**: < 300ms
- **Task Operations**: < 1 second
- **Image Upload**: < 3 seconds for 5MB
- **Offline Sync**: < 5 seconds when reconnecting
- **Notification Accuracy**: < 1 minute
- **Crash Rate**: < 1%

## Security Standards
- **Authentication**: Email/password with verification
- **Data Encryption**: HTTPS only, encrypted at rest
- **API Security**: All endpoints require authentication
- **File Uploads**: Validate type and size, scan for malware
- **User Input**: Sanitize all inputs, prevent injection
- **Tokens**: Expire after 30 days, refresh tokens available

## Accessibility Requirements
- **Touch Targets**: Minimum 44x44px
- **Color Contrast**: WCAG AA compliance (4.5:1)
- **Font Scaling**: Support dynamic type
- **Screen Readers**: Full VoiceOver/TalkBack support
- **Reduce Motion**: Respect system settings

## Error Handling

### Client Errors
```typescript
try {
  // Operation
} catch (error) {
  // Log to analytics
  analytics.logError(error);
  
  // Show user-friendly message
  showToast("Oops, something went wrong. Let's try again!");
  
  // Log technical details for debugging
  console.error('[ServiceName]', error);
}
```

### Network Errors
- Retry with exponential backoff
- Queue for offline if appropriate
- Clear error message to user
- Don't expose technical details

## Analytics Events

### Core Events to Track
```typescript
// User Journey
'app_opened'
'user_signed_up'
'user_signed_in'
'family_created'
'member_invited'

// Task Events
'task_created'
'task_assigned'
'task_completed'
'task_validated'
'reminder_sent'
'reminder_acknowledged'

// Engagement
'screen_viewed'
'feature_discovered'
'notification_opened'
'streak_achieved'

// Monetization
'subscription_screen_viewed'
'subscription_started'
'subscription_cancelled'
'feature_gated_encountered'
```

## Platform-Specific Guidelines

### iOS
- Follow Human Interface Guidelines
- Use SF Symbols where possible
- Respect safe areas
- Support iPad multitasking
- Implement iOS-specific features (widgets, shortcuts)

### Android (Future)
- Follow Material Design
- Support back button properly
- Handle deep links
- Respect system themes
- Support various screen sizes

## Documentation Templates

### Service Documentation
```markdown
# [Service Name]

## Purpose
Brief description of what this service handles

## Architecture Decisions
- Why this approach was chosen
- Alternatives considered
- Trade-offs accepted

## Dependencies
- External libraries used
- Other services required
- Environment variables needed

## API Reference
- Method signatures
- Parameters
- Return values
- Error cases

## Testing
- How to test locally
- Required test data
- Common issues

## Tech Debt
- [ ] Known limitations
- [ ] Future improvements
- [ ] Performance optimizations needed
```

### Function Documentation
```typescript
/**
 * Creates a new task and schedules reminders
 * 
 * @param taskData - Task information from form
 * @param userId - ID of user creating the task
 * @returns Promise<Task> - Created task with generated ID
 * 
 * @throws {ValidationError} If task data is invalid
 * @throws {PermissionError} If user lacks permission
 * 
 * TODO: Add support for recurring tasks
 * FIXME: Timezone handling for international users
 */
```

## Deployment Checklist

### Pre-Release
- [ ] All tests passing
- [ ] No console.log statements in production
- [ ] Environment variables configured
- [ ] Analytics events verified
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] MASTER-TRACKER.md updated
- [ ] Documentation cleaned and consistent

### App Store Submission
- [ ] Version number incremented
- [ ] Release notes written
- [ ] Screenshots updated
- [ ] App description current
- [ ] Privacy policy updated
- [ ] TestFlight tested

### Post-Release
- [ ] Monitor crash reports
- [ ] Check analytics funnel
- [ ] Review user feedback
- [ ] Plan next sprint
- [ ] Update documentation
- [ ] Update MASTER-TRACKER.md

## Emergency Procedures

### Critical Bug in Production
1. Assess impact and severity
2. Rollback if necessary
3. Create hotfix branch
4. Fix with minimal changes
5. Test thoroughly
6. Deploy immediately
7. Document incident in MASTER-TRACKER.md

### Data Breach
1. Immediately disable affected systems
2. Assess scope of breach
3. Notify affected users within 24 hours
4. Contact legal counsel
5. File required reports
6. Implement preventive measures

## Support Channels
- **Email**: support@typeb.app
- **In-App**: Feedback button
- **Analytics**: Automated crash reports
- **Beta**: TestFlight feedback
- **Social**: Twitter @typebapp (future)

---

### Data Structure Standards
For detailed data models, naming conventions, and type definitions, see:
- `typeb-family-app/docs/DATA-STANDARDS-AND-CONVENTIONS.md`

### Role System Standards
- **Internal Roles**: Always use 'parent'/'child' in code for consistency
- **Display Labels**: Use family.roleConfig for user-facing text
- **Presets**: Family, Roommates, Team, Custom
- **Customization**: Premium feature for custom role names
- **Backward Compatibility**: Default to Parent/Child if roleConfig not set

---

**Last Updated**: January 9, 2025
**Version**: 1.3.1
**Owner**: Development Team
**App Version**: v1.0.1 (UI Polish Complete)
**Testing Status**: Infrastructure ready, 253 component tests passing
**Premium Status**: Infrastructure complete, integration in progress

**CRITICAL**:
1. Always update MASTER-TRACKER.md - it's our single source of truth!
2. Clean docs after each phase for consistency!
3. Follow DATA-STANDARDS-AND-CONVENTIONS.md for all data structures!