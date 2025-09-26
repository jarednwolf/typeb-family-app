# E2E Test Scenarios for Critical User Flows
**TypeB Family App - Phase 5**
**Date**: January 9, 2025

## Overview

This document outlines the critical E2E test scenarios that must be implemented before App Store submission. These tests cover the main user journeys and ensure the app functions correctly from a user's perspective.

## Test Priority Levels

- **P0 (Critical)**: Must pass before launch - blocks core functionality
- **P1 (High)**: Should pass before launch - affects user experience
- **P2 (Medium)**: Nice to have - edge cases and optimizations

## 1. Authentication Flow Tests

### Test 1.1: New User Registration (P0)
**Scenario**: User creates a new account
```gherkin
Given I am on the welcome screen
When I tap "Get Started"
And I enter valid email "newuser@example.com"
And I enter valid password "SecurePass123!"
And I confirm password "SecurePass123!"
And I enter display name "John Doe"
And I tap "Create Account"
Then I should see the family setup screen
And I should be logged in
```

### Test 1.2: Existing User Sign In (P0)
**Scenario**: User signs in with existing account
```gherkin
Given I am on the sign in screen
When I enter email "existing@example.com"
And I enter password "Password123!"
And I tap "Sign In"
Then I should see the dashboard screen
And I should see my tasks
```

### Test 1.3: Password Reset Flow (P1)
**Scenario**: User resets forgotten password
```gherkin
Given I am on the sign in screen
When I tap "Forgot Password?"
And I enter email "user@example.com"
And I tap "Send Reset Email"
Then I should see confirmation message
And I should receive a password reset email
```

### Test 1.4: Sign Out (P0)
**Scenario**: User signs out of the app
```gherkin
Given I am signed in
When I navigate to Settings
And I tap "Sign Out"
Then I should see the sign in screen
And I should not be able to access protected screens
```

### Test 1.5: Session Persistence (P1)
**Scenario**: App remembers user session
```gherkin
Given I am signed in
When I close the app
And I reopen the app
Then I should still be signed in
And I should see the dashboard
```

## 2. Family Management Tests

### Test 2.1: Create New Family (P0)
**Scenario**: Parent creates a new family
```gherkin
Given I am a new user without a family
When I tap "Create Family"
And I enter family name "The Smiths"
And I tap "Create"
Then I should see the family created confirmation
And I should see the invite code
And I should be set as a parent role
```

### Test 2.2: Join Family with Invite Code (P0)
**Scenario**: Child joins existing family
```gherkin
Given I am a new user without a family
And a family exists with code "ABC123"
When I tap "Join Family"
And I enter invite code "ABC123"
And I tap "Join"
Then I should be added to the family
And I should see the family dashboard
And I should be set as a child role
```

### Test 2.3: View Family Members (P0)
**Scenario**: User views family member list
```gherkin
Given I am in a family with 3 members
When I navigate to Family tab
Then I should see all 3 family members
And I should see their roles (parent/child)
And I should see their task statistics
```

### Test 2.4: Remove Family Member (P1)
**Scenario**: Parent removes a family member
```gherkin
Given I am a parent in a family
And there are other members
When I navigate to Family tab
And I select a member
And I tap "Remove from Family"
And I confirm the action
Then the member should be removed
And they should lose access to family data
```

### Test 2.5: Change Member Role (P1)
**Scenario**: Parent changes member role
```gherkin
Given I am a parent in a family
And there is a child member
When I navigate to Family tab
And I select the child member
And I change role to "Parent"
Then the member should have parent permissions
And they should be able to create tasks for others
```

## 3. Task Management Tests

### Test 3.1: Create Task for Self (P0)
**Scenario**: User creates a task for themselves
```gherkin
Given I am on the dashboard
When I tap the "+" button
And I enter task title "Complete homework"
And I select category "Homework"
And I set due date for tomorrow
And I tap "Save"
Then the task should appear in my task list
And it should show as "Pending"
```

### Test 3.2: Parent Assigns Task to Child (P0)
**Scenario**: Parent creates and assigns task
```gherkin
Given I am a parent in a family
When I create a new task
And I assign it to "Child Name"
And I set priority to "High"
And I enable photo validation
And I save the task
Then the task should appear in child's task list
And the child should receive a notification
```

### Test 3.3: Complete Task (P0)
**Scenario**: Child completes assigned task
```gherkin
Given I have a pending task
When I tap on the task
And I tap "Mark as Complete"
Then the task status should change to "Completed"
And my completion stats should update
And the parent should be notified
```

### Test 3.4: Task with Photo Validation (P1)
**Scenario**: Complete task requiring photo proof
```gherkin
Given I have a task requiring photo validation
When I tap "Mark as Complete"
Then I should see photo upload prompt
When I take or select a photo
And I submit the task
Then the task should show "Pending Validation"
And the parent should receive validation request
```

### Test 3.5: Parent Validates Task (P1)
**Scenario**: Parent approves completed task
```gherkin
Given I am a parent
And a child has completed a task with photo
When I view the completed task
And I review the photo proof
And I tap "Approve"
Then the task should be marked as "Validated"
And the child should receive confirmation
```

### Test 3.6: Edit Task (P1)
**Scenario**: User edits existing task
```gherkin
Given I have a pending task
When I tap on the task
And I tap "Edit"
And I change the title and due date
And I save changes
Then the task should be updated
And the changes should sync across devices
```

### Test 3.7: Delete Task (P1)
**Scenario**: User deletes a task
```gherkin
Given I have a task
When I tap on the task
And I tap "Delete"
And I confirm deletion
Then the task should be removed
And it should not appear in any lists
```

## 4. Dashboard & Navigation Tests

### Test 4.1: Dashboard Overview (P0)
**Scenario**: User views dashboard
```gherkin
Given I am signed in with tasks
When I open the app
Then I should see today's tasks
And I should see my completion stats
And I should see upcoming tasks
And I should see family activity
```

### Test 4.2: Tab Navigation (P0)
**Scenario**: Navigate between main tabs
```gherkin
Given I am on the dashboard
When I tap each tab (Dashboard, Tasks, Family, Settings)
Then each screen should load correctly
And the tab should be highlighted
And navigation should be smooth
```

### Test 4.3: Filter Tasks (P1)
**Scenario**: Filter tasks by status
```gherkin
Given I have tasks in different states
When I tap on filter tabs
And I select "Completed"
Then I should only see completed tasks
When I select "Pending"
Then I should only see pending tasks
```

## 5. Notification Tests

### Test 5.1: Task Reminder Notification (P1)
**Scenario**: Receive task reminder
```gherkin
Given I have a task due in 1 hour
And notifications are enabled
When the reminder time arrives
Then I should receive a push notification
And tapping it should open the task
```

### Test 5.2: Task Assignment Notification (P1)
**Scenario**: Receive notification for new task
```gherkin
Given I am a child in a family
When a parent assigns me a task
Then I should receive a notification
And it should show the task title
And tapping should open the task details
```

## 6. Settings & Profile Tests

### Test 6.1: Update Profile (P1)
**Scenario**: User updates profile information
```gherkin
Given I am in Settings
When I tap "Edit Profile"
And I change my display name
And I upload a profile photo
And I save changes
Then my profile should be updated
And changes should reflect everywhere
```

### Test 6.2: Notification Settings (P1)
**Scenario**: Configure notification preferences
```gherkin
Given I am in Settings
When I navigate to Notifications
And I disable task reminders
And I set quiet hours
Then I should not receive reminders
And notifications should respect quiet hours
```

### Test 6.3: Premium Upgrade Flow (P2)
**Scenario**: User upgrades to premium
```gherkin
Given I am on free tier
When I tap "Upgrade to Premium"
And I complete the purchase
Then I should have premium features
And family member limit should increase
And validation features should be enabled
```

## 7. Offline & Sync Tests

### Test 7.1: Offline Task Creation (P1)
**Scenario**: Create task while offline
```gherkin
Given I am offline
When I create a new task
Then the task should be saved locally
When I go back online
Then the task should sync to server
And appear on other devices
```

### Test 7.2: Conflict Resolution (P2)
**Scenario**: Handle conflicting updates
```gherkin
Given a task exists on multiple devices
When the task is edited on two devices while offline
And both devices come online
Then the most recent change should win
And no data should be lost
```

## 8. Error Handling Tests

### Test 8.1: Network Error Recovery (P1)
**Scenario**: Handle network failures gracefully
```gherkin
Given I am using the app
When the network connection fails
Then I should see an offline indicator
And I should be able to continue using cached data
When connection is restored
Then data should sync automatically
```

### Test 8.2: Invalid Input Handling (P1)
**Scenario**: Handle invalid user input
```gherkin
Given I am creating a task
When I enter invalid data (empty title, past due date)
Then I should see appropriate error messages
And the form should not submit
And errors should be clear and helpful
```

## 9. Performance Tests

### Test 9.1: App Launch Time (P1)
**Scenario**: App launches quickly
```gherkin
Given the app is not running
When I tap the app icon
Then the app should launch in under 2 seconds
And show content within 3 seconds
```

### Test 9.2: Large Data Set Handling (P2)
**Scenario**: Handle many tasks efficiently
```gherkin
Given I have 100+ tasks
When I open the tasks list
Then scrolling should be smooth
And filtering should be responsive
And the app should not crash
```

## Test Execution Matrix

| Test Category | P0 Tests | P1 Tests | P2 Tests | Total |
|--------------|----------|----------|----------|-------|
| Authentication | 3 | 2 | 0 | 5 |
| Family Management | 3 | 2 | 0 | 5 |
| Task Management | 3 | 4 | 0 | 7 |
| Dashboard | 2 | 1 | 0 | 3 |
| Notifications | 0 | 2 | 0 | 2 |
| Settings | 0 | 2 | 1 | 3 |
| Offline/Sync | 0 | 1 | 1 | 2 |
| Error Handling | 0 | 2 | 0 | 2 |
| Performance | 0 | 1 | 1 | 2 |
| **TOTAL** | **11** | **17** | **3** | **31** |

## Implementation Priority

### Phase 1: Critical Path (Week 2, Days 8-9)
1. Authentication Flow (Tests 1.1, 1.2, 1.4)
2. Family Creation/Joining (Tests 2.1, 2.2, 2.3)
3. Basic Task Operations (Tests 3.1, 3.2, 3.3)
4. Dashboard Navigation (Tests 4.1, 4.2)

### Phase 2: Extended Coverage (Week 2, Days 10-11)
1. Password Reset (Test 1.3)
2. Session Persistence (Test 1.5)
3. Task Validation (Tests 3.4, 3.5)
4. Task Management (Tests 3.6, 3.7)
5. Notifications (Tests 5.1, 5.2)

### Phase 3: Edge Cases (Post-Launch)
1. Offline Scenarios (Tests 7.1, 7.2)
2. Error Handling (Tests 8.1, 8.2)
3. Performance Tests (Tests 9.1, 9.2)
4. Premium Features (Test 6.3)

## Success Criteria

- **P0 Tests**: 100% must pass before launch
- **P1 Tests**: 80% should pass before launch
- **P2 Tests**: Nice to have, can be post-launch
- **Overall**: 90% pass rate for P0+P1 tests

## Test Data Requirements

### Test Users
- Parent account: `parent@test.com` / `Test123!`
- Child account: `child@test.com` / `Test123!`
- New user: Generated dynamically per test

### Test Families
- Family 1: "Test Family" (Code: TEST01)
- Family 2: "Premium Family" (Code: PREM01)

### Test Tasks
- Task 1: "Complete Homework" (Homework category)
- Task 2: "Clean Room" (Chores category)
- Task 3: "Exercise 30 mins" (Exercise category)

## Automation Tools

- **Framework**: Detox
- **Test Runner**: Jest
- **Assertions**: Detox matchers
- **Reporting**: Jest HTML Reporter
- **CI/CD**: GitHub Actions

## Manual Testing Fallback

If E2E automation is delayed, these scenarios should be tested manually using this checklist before each release. Document results in a test execution report.

---
*Last Updated: January 9, 2025*
*TypeB Development Team*