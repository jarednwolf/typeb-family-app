# TypeB Family App - Phase 4 UAT Test Plan

**Phase**: 4 - Notifications & Reminders
**Date**: 2025-01-06
**Version**: 1.0
**Status**: Ready for Testing

---

## 🎯 Test Objectives

1. Verify notification system works end-to-end
2. Confirm smart reminder escalation logic
3. Validate quiet hours functionality
4. Test notification settings persistence
5. Ensure proper permission handling
6. Verify background task execution
7. Confirm push notification delivery

---

## 📱 Test Environment Requirements

### Device Requirements
- **iOS Device**: iPhone with iOS 14+ (physical device required for push notifications)
- **Android Device**: Android 8+ (for future testing)
- **Expo Go App**: Latest version installed
- **Network**: Stable WiFi connection

### Account Setup
- **Test User 1**: Parent account with manager role
- **Test User 2**: Child account with member role
- **Test Family**: Both users in same family
- **Firebase**: Cloud Functions deployed (required for push notifications)

---

## 🧪 Test Scenarios

### 1. Notification Permissions (5 min)

#### Test Case 1.1: First-Time Permission Request
**Steps:**
1. Fresh install the app
2. Sign in as Test User 1
3. Navigate to Settings > Notifications
4. Observe permission prompt

**Expected Results:**
- [ ] System permission dialog appears
- [ ] Clear explanation text shown before prompt
- [ ] "Allow" and "Don't Allow" options available
- [ ] Choice is respected and saved

#### Test Case 1.2: Permission Denied Recovery
**Steps:**
1. Deny notification permissions
2. Try to enable notifications in Settings
3. Follow the prompt to system settings

**Expected Results:**
- [ ] Clear message about denied permissions
- [ ] Button to open system settings
- [ ] Instructions on how to enable
- [ ] App detects when permissions granted

---

### 2. Local Notifications (10 min)

#### Test Case 2.1: Basic Reminder
**Steps:**
1. Create a new task
2. Set reminder for 2 minutes from now
3. Assign to Test User 2
4. Wait for notification

**Expected Results:**
- [ ] Notification appears at scheduled time (±1 min)
- [ ] Shows task title and "Due soon" message
- [ ] Tapping opens app to task
- [ ] Sound/vibration based on settings

#### Test Case 2.2: Immediate Task Notification
**Steps:**
1. Create task due "now"
2. Enable reminder
3. Save task

**Expected Results:**
- [ ] Notification within 30 seconds
- [ ] Correct task information shown
- [ ] App badge count increases

#### Test Case 2.3: Multiple Notifications
**Steps:**
1. Create 3 tasks with different reminder times
2. Wait for all notifications

**Expected Results:**
- [ ] Each notification appears separately
- [ ] Correct timing for each
- [ ] No duplicate notifications
- [ ] All show in notification center

---

### 3. Smart Escalation (15 min)

#### Test Case 3.1: Three-Level Escalation
**Steps:**
1. Create task due in 5 minutes
2. Enable reminder (30 min before)
3. Don't complete task
4. Monitor notifications

**Timeline & Expected Results:**
- [ ] **-30 min**: First reminder "Task due in 30 minutes"
- [ ] **-15 min**: Second reminder "Task due in 15 minutes"
- [ ] **-5 min**: Urgent reminder "Task due in 5 minutes!"
- [ ] **0 min**: Manager notified "User hasn't completed task"

#### Test Case 3.2: Task Completion Stops Escalation
**Steps:**
1. Create task with reminder
2. Wait for first notification
3. Complete task before second reminder
4. Wait to ensure no more notifications

**Expected Results:**
- [ ] First reminder received
- [ ] Task marked complete
- [ ] No subsequent reminders
- [ ] No manager notification

---

### 4. Quiet Hours (10 min)

#### Test Case 4.1: Respect Quiet Hours
**Steps:**
1. Set quiet hours 10 PM - 8 AM
2. Create task due at 11 PM
3. Enable reminder
4. Wait for notification timing

**Expected Results:**
- [ ] No notification during quiet hours
- [ ] Notification queued
- [ ] Delivered at 8 AM next day
- [ ] Shows original due time in message

#### Test Case 4.2: Urgent Override
**Steps:**
1. Enable quiet hours
2. Create urgent priority task
3. Due during quiet hours
4. Check notification behavior

**Expected Results:**
- [ ] Urgent tasks may override (design decision)
- [ ] Or held until quiet hours end
- [ ] Consistent behavior

---

### 5. Push Notifications (15 min)

#### Test Case 5.1: Task Assignment
**Steps:**
1. As Test User 1, create task
2. Assign to Test User 2
3. Test User 2 should receive push

**Expected Results:**
- [ ] Push notification within 30 seconds
- [ ] Shows "New task assigned: [title]"
- [ ] Sender name included
- [ ] Opens to task when tapped

#### Test Case 5.2: Task Completion
**Steps:**
1. Test User 2 completes assigned task
2. Test User 1 (manager) receives notification

**Expected Results:**
- [ ] Manager notified of completion
- [ ] Shows who completed and task name
- [ ] Photo icon if photo required
- [ ] Opens to task for validation

#### Test Case 5.3: Family Invite
**Steps:**
1. Generate family invite code
2. New user joins with code
3. Existing members notified

**Expected Results:**
- [ ] "New member joined" notification
- [ ] Shows member name
- [ ] All family members receive it

---

### 6. Settings & Preferences (10 min)

#### Test Case 6.1: Notification Toggle
**Steps:**
1. Disable notifications in settings
2. Create new task with reminder
3. Verify no notifications
4. Re-enable and test

**Expected Results:**
- [ ] Toggle instantly effective
- [ ] No notifications when disabled
- [ ] Resume when re-enabled
- [ ] Setting persists across sessions

#### Test Case 6.2: Sound & Vibration
**Steps:**
1. Toggle sound off, vibration on
2. Receive notification
3. Toggle sound on, vibration off
4. Receive notification

**Expected Results:**
- [ ] Respects sound setting
- [ ] Respects vibration setting
- [ ] Changes apply immediately

#### Test Case 6.3: Reminder Time Preference
**Steps:**
1. Change default reminder to 60 min
2. Create new task
3. Check default reminder time

**Expected Results:**
- [ ] New default applied
- [ ] Existing tasks unchanged
- [ ] Can override per task

---

### 7. Background Behavior (10 min)

#### Test Case 7.1: App Closed
**Steps:**
1. Create task with reminder
2. Force close app
3. Wait for notification time

**Expected Results:**
- [ ] Notification still appears
- [ ] Tapping launches app
- [ ] App syncs on launch

#### Test Case 7.2: Background Sync
**Steps:**
1. Create task on Device A
2. Device B in background
3. Check if Device B receives notification

**Expected Results:**
- [ ] Background sync works
- [ ] Notification on both devices
- [ ] Or only assigned device (design choice)

---

### 8. Edge Cases (10 min)

#### Test Case 8.1: Timezone Changes
**Steps:**
1. Create task with reminder
2. Change device timezone
3. Check notification timing

**Expected Results:**
- [ ] Adjusts to new timezone
- [ ] Or maintains original time
- [ ] Consistent behavior

#### Test Case 8.2: Notification Overload
**Steps:**
1. Create 10 tasks due at same time
2. All with reminders
3. Check notification behavior

**Expected Results:**
- [ ] All notifications delivered
- [ ] Or intelligently grouped
- [ ] No crashes or freezes
- [ ] Can clear all

#### Test Case 8.3: Network Offline
**Steps:**
1. Enable airplane mode
2. Create task with reminder
3. Wait for notification
4. Re-enable network

**Expected Results:**
- [ ] Local notifications work offline
- [ ] Push notifications queue
- [ ] Sync when online

---

## 📊 Test Metrics

Track these metrics during testing:

1. **Notification Accuracy**: % delivered on time (±1 minute)
2. **Push Delivery Rate**: % of push notifications received
3. **Permission Grant Rate**: % of users allowing notifications
4. **Setting Persistence**: Settings maintained across sessions
5. **Background Reliability**: % success when app backgrounded

---

## 🐛 Bug Report Template

When issues found, document:

```
**Issue**: Brief description
**Severity**: Critical/High/Medium/Low
**Device**: iPhone model, iOS version
**Steps**: 
1. Step one
2. Step two
**Expected**: What should happen
**Actual**: What actually happened
**Screenshot**: Attach if applicable
**Frequency**: Always/Sometimes/Once
```

---

## ✅ Sign-Off Criteria

Phase 4 is complete when:

- [ ] All test cases pass on iOS device
- [ ] No critical bugs remain
- [ ] Push notifications working (if Cloud Functions deployed)
- [ ] Settings persist correctly
- [ ] Escalation logic verified
- [ ] Quiet hours respected
- [ ] Performance acceptable (no lag/crashes)
- [ ] User experience smooth

---

## 📝 Notes for Testers

1. **Physical Device Required**: Push notifications won't work in simulator
2. **Timing Tolerance**: Allow ±1 minute for notification timing
3. **Background Testing**: Don't force-quit app from app switcher (disables notifications)
4. **Multiple Devices**: Best tested with 2 devices for push notifications
5. **Clean State**: Start each test section with fresh data

---

## 🚀 Post-Testing Actions

1. Document all bugs found
2. Prioritize fixes (Critical → High → Medium → Low)
3. Re-test fixed issues
4. Update test plan based on findings
5. Get sign-off from stakeholders
6. Prepare for Phase 5 (Premium Features)

---

**Test Plan Version**: 1.0
**Last Updated**: 2025-01-06
**Next Review**: After Phase 4 testing complete