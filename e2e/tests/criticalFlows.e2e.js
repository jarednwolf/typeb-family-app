/**
 * Critical User Flows E2E Tests
 * 
 * Tests end-to-end user journeys including:
 * - User onboarding and family creation
 * - Task creation with photo validation
 * - Offline/online sync
 * - Premium subscription flow
 */

describe('Critical User Flows', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { camera: 'YES', notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('New User Onboarding', () => {
    it('should complete full onboarding flow', async () => {
      // Start from welcome screen
      await expect(element(by.id('welcome-screen'))).toBeVisible();
      await element(by.id('get-started-button')).tap();

      // Sign up
      await element(by.id('email-input')).typeText('newuser@test.com');
      await element(by.id('password-input')).typeText('Test123!');
      await element(by.id('confirm-password-input')).typeText('Test123!');
      await element(by.id('sign-up-button')).tap();

      // Wait for verification
      await waitFor(element(by.id('verification-sent')))
        .toBeVisible()
        .withTimeout(5000);

      // Skip verification for testing
      await element(by.id('skip-verification-dev')).tap();

      // Create family
      await expect(element(by.id('family-setup-screen'))).toBeVisible();
      await element(by.id('family-name-input')).typeText('Test Family');
      await element(by.id('create-family-button')).tap();

      // Add family members
      await expect(element(by.id('add-members-screen'))).toBeVisible();
      await element(by.id('add-member-button')).tap();
      await element(by.id('member-name-input')).typeText('Child 1');
      await element(by.id('member-role-picker')).tap();
      await element(by.text('Child')).tap();
      await element(by.id('save-member-button')).tap();

      // Complete onboarding
      await element(by.id('finish-onboarding-button')).tap();

      // Should land on home screen
      await expect(element(by.id('home-screen'))).toBeVisible();
      await expect(element(by.text('Test Family'))).toBeVisible();
    });
  });

  describe('Task Creation with Photo Validation', () => {
    it('should create task and submit photo proof', async () => {
      // Sign in with existing user
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('Test123!');
      await element(by.id('sign-in-button')).tap();

      // Navigate to tasks
      await element(by.id('tasks-tab')).tap();
      
      // Create new task
      await element(by.id('add-task-button')).tap();
      await element(by.id('task-title-input')).typeText('Clean Room');
      await element(by.id('task-description-input')).typeText('Clean and organize bedroom');
      
      // Select category
      await element(by.id('category-picker')).tap();
      await element(by.text('Chores')).tap();
      
      // Enable photo requirement
      await element(by.id('require-photo-toggle')).tap();
      
      // Set due date
      await element(by.id('due-date-picker')).tap();
      await element(by.text('Tomorrow')).tap();
      
      // Assign to family member
      await element(by.id('assignee-picker')).tap();
      await element(by.text('Child 1')).tap();
      
      // Save task
      await element(by.id('save-task-button')).tap();

      // Verify task created
      await expect(element(by.text('Clean Room'))).toBeVisible();
      await expect(element(by.id('photo-required-badge'))).toBeVisible();

      // Complete task with photo
      await element(by.text('Clean Room')).tap();
      await element(by.id('mark-complete-button')).tap();
      
      // Photo validation required
      await expect(element(by.id('photo-validation-prompt'))).toBeVisible();
      await element(by.id('take-photo-button')).tap();
      
      // Handle camera (in test mode, auto-accepts)
      await waitFor(element(by.id('photo-preview')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.id('use-photo-button')).tap();
      
      // Wait for validation
      await waitFor(element(by.id('validation-in-progress')))
        .toBeVisible()
        .withTimeout(2000);
      
      await waitFor(element(by.id('validation-success')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Task should be marked complete
      await expect(element(by.id('task-completed-badge'))).toBeVisible();
    });

    it('should handle photo validation rejection', async () => {
      // Create task requiring photo
      await element(by.id('add-task-button')).tap();
      await element(by.id('task-title-input')).typeText('Do Homework');
      await element(by.id('require-photo-toggle')).tap();
      await element(by.id('save-task-button')).tap();

      // Try to complete with invalid photo
      await element(by.text('Do Homework')).tap();
      await element(by.id('mark-complete-button')).tap();
      await element(by.id('take-photo-button')).tap();
      
      // Simulate blurry/invalid photo
      await element(by.id('use-test-invalid-photo')).tap();
      
      // Should show validation failure
      await waitFor(element(by.id('validation-failed')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Photo does not match task requirements'))).toBeVisible();
      await expect(element(by.id('retake-photo-button'))).toBeVisible();
      
      // Retake photo
      await element(by.id('retake-photo-button')).tap();
      await element(by.id('use-test-valid-photo')).tap();
      
      // Should succeed this time
      await waitFor(element(by.id('validation-success')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Offline/Online Sync', () => {
    it('should queue changes offline and sync when online', async () => {
      // Go offline
      await device.setURLBlacklist(['.*']);
      
      // Verify offline indicator
      await waitFor(element(by.id('offline-indicator')))
        .toBeVisible()
        .withTimeout(3000);

      // Make changes while offline
      await element(by.id('add-task-button')).tap();
      await element(by.id('task-title-input')).typeText('Offline Task');
      await element(by.id('save-task-button')).tap();
      
      // Should show in list with pending indicator
      await expect(element(by.text('Offline Task'))).toBeVisible();
      await expect(element(by.id('sync-pending-badge'))).toBeVisible();
      
      // Create another task
      await element(by.id('add-task-button')).tap();
      await element(by.id('task-title-input')).typeText('Another Offline Task');
      await element(by.id('save-task-button')).tap();
      
      // Should show queue count
      await expect(element(by.text('2 pending sync'))).toBeVisible();

      // Go back online
      await device.clearURLBlacklist();
      
      // Wait for sync
      await waitFor(element(by.id('sync-in-progress')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.id('sync-complete')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Pending badges should be gone
      await expect(element(by.id('sync-pending-badge'))).not.toBeVisible();
      await expect(element(by.text('All synced'))).toBeVisible();
    });

    it('should handle sync conflicts', async () => {
      // Create task online
      await element(by.id('add-task-button')).tap();
      await element(by.id('task-title-input')).typeText('Shared Task');
      await element(by.id('save-task-button')).tap();
      
      const taskId = await element(by.text('Shared Task')).getId();

      // Go offline
      await device.setURLBlacklist(['.*']);
      
      // Edit task offline
      await element(by.text('Shared Task')).tap();
      await element(by.id('edit-task-button')).tap();
      await element(by.id('task-title-input')).clearText();
      await element(by.id('task-title-input')).typeText('Edited Offline');
      await element(by.id('save-task-button')).tap();

      // Simulate another device editing (mock server change)
      await device.executeScript(`
        window.testHelpers.simulateServerChange('${taskId}', {
          title: 'Edited on Server'
        });
      `);

      // Go back online
      await device.clearURLBlacklist();
      
      // Should detect conflict
      await waitFor(element(by.id('sync-conflict-detected')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Show conflict resolution dialog
      await expect(element(by.text('Sync Conflict'))).toBeVisible();
      await expect(element(by.text('Local: Edited Offline'))).toBeVisible();
      await expect(element(by.text('Server: Edited on Server'))).toBeVisible();
      
      // Choose local version
      await element(by.id('keep-local-button')).tap();
      
      // Should resolve and sync
      await waitFor(element(by.id('conflict-resolved')))
        .toBeVisible()
        .withTimeout(3000);
      
      await expect(element(by.text('Edited Offline'))).toBeVisible();
    });
  });

  describe('Premium Subscription Flow', () => {
    it('should complete premium subscription purchase', async () => {
      // Try to access premium feature
      await element(by.id('settings-tab')).tap();
      await element(by.text('Custom Categories')).tap();
      
      // Should show premium gate
      await expect(element(by.id('premium-gate'))).toBeVisible();
      await expect(element(by.text('Premium Feature'))).toBeVisible();
      
      // Open paywall
      await element(by.id('upgrade-button')).tap();
      
      // Should show pricing options
      await expect(element(by.id('paywall-screen'))).toBeVisible();
      await expect(element(by.text('Premium Monthly - $4.99'))).toBeVisible();
      await expect(element(by.text('Premium Annual - $39.99'))).toBeVisible();
      
      // Select monthly plan
      await element(by.id('monthly-plan-button')).tap();
      await element(by.id('subscribe-button')).tap();
      
      // Handle test purchase (auto-completes in test mode)
      await waitFor(element(by.id('purchase-processing')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.id('purchase-success')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should now have access to premium features
      await element(by.id('continue-button')).tap();
      await expect(element(by.id('custom-categories-screen'))).toBeVisible();
      
      // Verify premium badge in settings
      await element(by.id('back-button')).tap();
      await expect(element(by.id('premium-badge'))).toBeVisible();
      await expect(element(by.text('Premium Member'))).toBeVisible();
    });

    it('should restore previous purchases', async () => {
      // Sign in with account that has premium
      await element(by.id('sign-out-button')).tap();
      await element(by.id('email-input')).typeText('premium@test.com');
      await element(by.id('password-input')).typeText('Test123!');
      await element(by.id('sign-in-button')).tap();
      
      // Go to settings
      await element(by.id('settings-tab')).tap();
      
      // Premium status might not be synced yet
      if (await element(by.id('restore-purchases-button')).isVisible()) {
        await element(by.id('restore-purchases-button')).tap();
        
        await waitFor(element(by.id('restoring-purchases')))
          .toBeVisible()
          .withTimeout(3000);
        
        await waitFor(element(by.id('restore-success')))
          .toBeVisible()
          .withTimeout(5000);
      }
      
      // Should show premium status
      await expect(element(by.id('premium-badge'))).toBeVisible();
      
      // Should have access to premium features
      await element(by.text('Custom Categories')).tap();
      await expect(element(by.id('custom-categories-screen'))).toBeVisible();
    });
  });

  describe('Family Collaboration', () => {
    it('should handle real-time updates between family members', async () => {
      // Sign in as parent
      await element(by.id('email-input')).typeText('parent@test.com');
      await element(by.id('password-input')).typeText('Test123!');
      await element(by.id('sign-in-button')).tap();
      
      // Create task for child
      await element(by.id('tasks-tab')).tap();
      await element(by.id('add-task-button')).tap();
      await element(by.id('task-title-input')).typeText('Math Homework');
      await element(by.id('assignee-picker')).tap();
      await element(by.text('Child 1')).tap();
      await element(by.id('save-task-button')).tap();
      
      // Simulate child device completing task
      await device.executeScript(`
        window.testHelpers.simulateChildDevice({
          action: 'completeTask',
          taskTitle: 'Math Homework',
          withPhoto: true
        });
      `);
      
      // Parent should see real-time update
      await waitFor(element(by.id('task-completed-notification')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Child 1 completed Math Homework'))).toBeVisible();
      
      // Task should show as pending approval
      await expect(element(by.id('pending-approval-badge'))).toBeVisible();
      
      // Approve task
      await element(by.text('Math Homework')).tap();
      await element(by.id('view-photo-button')).tap();
      await expect(element(by.id('photo-viewer'))).toBeVisible();
      await element(by.id('approve-button')).tap();
      
      // Should update status
      await expect(element(by.id('task-approved-badge'))).toBeVisible();
      
      // Child device should receive approval notification
      await waitFor(element(by.id('simulated-child-notification')))
        .toHaveText('Task approved!')
        .withTimeout(3000);
    });
  });
});
