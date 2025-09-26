# Engagement Features Test Guide

This guide provides step-by-step instructions for testing all Phase 2 engagement features in the TypeB Family App.

## Prerequisites
- Firebase emulators running (`firebase emulators:start`)
- App running on iOS/Android simulator or device
- Test accounts: 1 parent account and at least 1 child account in the same family

## Features to Test

### 1. ProgressRing Component
**Location**: Parent Dashboard (header area)

**Test Steps**:
1. Log in as a parent
2. Navigate to Parent Dashboard
3. Verify the progress ring displays in the header
4. The ring should show the family accountability score (0-100%)
5. Ring color should change based on percentage:
   - Red: 0-25%
   - Orange: 26-50%
   - Yellow: 51-75%
   - Green: 76-100%

**Expected Result**: Progress ring animates smoothly and displays correct color based on family completion rate

### 2. StreakDisplay Component
**Location**: Parent Dashboard (header area)

**Test Steps**:
1. On Parent Dashboard, look for the streak display
2. It should show the best family streak (highest among all children)
3. If a child has a broken streak, it should show recovery message
4. Flame indicators (🔥) should appear based on streak length:
   - 1-6 days: 1 flame
   - 7-13 days: 2 flames
   - 14+ days: 3 flames

**Expected Result**: Streak displays correctly with appropriate flame count

### 3. ParentReaction Component
**Location**: TaskCard (completed tasks only)

**Test Steps**:
1. Complete a task as a child
2. Log in as a parent
3. Find the completed task in the task list
4. Click "+ Add Reaction" button
5. Select from: STAR, FIRE, CLAP, HEART, THUMBS UP
6. Verify reaction appears with parent's name
7. Click on your reaction to change/remove it
8. Log in as child and verify they can see the reaction (read-only)

**Expected Result**: 
- Parents can add/modify reactions on completed tasks
- Children can view but not modify reactions
- Reactions persist across app restarts

### 4. MilestoneCelebration Component
**Location**: Full-screen modal triggered on milestone achievement

**Test Steps**:
1. Log in as a child with accountability score near a milestone (24%, 49%, 74%, or 99%)
2. Complete a task to push score over the milestone threshold
3. Milestone celebration should trigger automatically
4. Verify the modal shows:
   - Confetti animation
   - Appropriate milestone badge (Bronze/Silver/Gold/Diamond)
   - Congratulatory message
   - Current accountability score
5. Tap "Continue" to dismiss

**Expected Result**: 
- Celebration triggers only when crossing milestone thresholds
- Each milestone (25%, 50%, 75%, 100%) has unique styling
- Milestone is recorded and won't trigger again for same level

### 5. Integration Testing

#### A. Task Completion Flow with Milestone
1. Create a new child account with 0 completed tasks
2. Assign 4 tasks to the child
3. Complete 1 task (25% completion) → Bronze milestone should trigger
4. Complete 2nd task (50% completion) → Silver milestone should trigger
5. Verify milestones are recorded in Firebase

#### B. Parent Dashboard Integration
1. Log in as parent with multiple children
2. Verify ProgressRing shows overall family accountability
3. Verify StreakDisplay shows the highest streak among children
4. Both components should update in real-time as tasks are completed

#### C. Parent Reaction Flow
1. Child completes a task
2. Parent adds reaction
3. Another parent in same family adds different reaction
4. Verify both reactions show on the task
5. Child views task and sees all parent reactions

### 6. Edge Cases to Test

1. **Zero Data States**:
   - New family with no completed tasks (0% progress)
   - No active streaks (should show encouraging message)
   - No reactions on any tasks

2. **Multiple Parents**:
   - Multiple parents can react to same task
   - Each parent can only have one reaction per task
   - Parents can only see/edit their own reactions

3. **Offline Behavior**:
   - Add reaction while offline
   - Complete task while offline
   - Verify sync when returning online

4. **Performance**:
   - Test with family having 50+ completed tasks
   - Multiple children with various completion rates
   - Ensure smooth animations and no lag

### 7. Firebase Verification

Check Firebase Firestore for:
1. `milestones` collection - verify milestone records
2. Tasks with `parentReactions` field
3. User documents with updated streak data

## Common Issues and Troubleshooting

1. **Milestone not triggering**: 
   - Check if milestone was already achieved
   - Verify accountability score calculation
   - Check Firebase rules allow milestone creation

2. **Reactions not saving**:
   - Verify user is authenticated as parent
   - Check Firebase rules for task updates
   - Ensure task is in completed state

3. **Progress ring not updating**:
   - Force refresh the dashboard
   - Check Redux state for family data
   - Verify task completion is syncing

## Test Data Setup Script

Run this in Firebase console to set up test data:

```javascript
// Create test tasks with various completion states
const testTasks = [
  { title: "Test Task 1", status: "completed", assignedTo: "child1" },
  { title: "Test Task 2", status: "completed", assignedTo: "child1" },
  { title: "Test Task 3", status: "pending", assignedTo: "child1" },
  { title: "Test Task 4", status: "pending", assignedTo: "child1" },
];

// This would give child1 a 50% completion rate
```

## Success Criteria

All engagement features are working correctly when:
- [ ] ProgressRing displays accurate family accountability with correct colors
- [ ] StreakDisplay shows best family streak with appropriate flames
- [ ] Parents can add/modify reactions on completed tasks
- [ ] Children can view reactions but cannot modify them
- [ ] Milestones trigger at correct thresholds with celebration
- [ ] All components integrate smoothly with existing features
- [ ] Performance remains smooth with realistic data loads
- [ ] Offline/online sync works correctly