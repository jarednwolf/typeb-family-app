const { device, element, by, expect, waitFor } = require('detox');
const helpers = require('../helpers/testHelpers');

describe('Task Management Flow', () => {
  let parentEmail;
  let parentPassword;
  let childEmail;
  let childPassword;
  let familyName;

  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      delete: true,
      permissions: { notifications: 'YES' }
    });
    
    // Set up test accounts and family
    parentEmail = helpers.generateTestEmail();
    parentPassword = 'Parent123!';
    childEmail = helpers.generateTestEmail();
    childPassword = 'Child123!';
    familyName = helpers.generateFamilyName();
    
    // Create parent account and family
    await setupTestFamily();
  });

  async function setupTestFamily() {
    // Create parent account
    await element(by.id('signup-link')).tap();
    await waitFor(element(by.id('signup-screen'))).toBeVisible().withTimeout(3000);
    
    await element(by.id('email-input')).replaceText(parentEmail);
    await element(by.id('password-input')).replaceText(parentPassword);
    await element(by.id('confirm-password-input')).replaceText(parentPassword);
    await element(by.id('display-name-input')).replaceText('Test Parent');
    await helpers.dismissKeyboard();
    await element(by.id('create-account-button')).tap();
    
    // Create family
    await waitFor(element(by.id('family-setup-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('create-family-button')).tap();
    await waitFor(element(by.id('create-family-screen'))).toBeVisible().withTimeout(3000);
    await element(by.id('family-name-input')).replaceText(familyName);
    await helpers.dismissKeyboard();
    await element(by.id('create-button')).tap();
    
    // Get to dashboard
    await waitFor(element(by.id('family-created-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('continue-button')).tap();
    await waitFor(element(by.id('dashboard-screen'))).toBeVisible().withTimeout(5000);
    
    // Create child account and join family
    await helpers.logout();
    await element(by.id('signup-link')).tap();
    await waitFor(element(by.id('signup-screen'))).toBeVisible().withTimeout(3000);
    
    await element(by.id('email-input')).replaceText(childEmail);
    await element(by.id('password-input')).replaceText(childPassword);
    await element(by.id('confirm-password-input')).replaceText(childPassword);
    await element(by.id('display-name-input')).replaceText('Test Child');
    await helpers.dismissKeyboard();
    await element(by.id('create-account-button')).tap();
    
    // Join family (using mock code)
    await waitFor(element(by.id('family-setup-screen'))).toBeVisible().withTimeout(10000);
    await element(by.id('join-family-button')).tap();
    await waitFor(element(by.id('join-family-screen'))).toBeVisible().withTimeout(3000);
    await element(by.id('invite-code-input')).replaceText('TEST01');
    await helpers.dismissKeyboard();
    await element(by.id('join-button')).tap();
    await waitFor(element(by.id('family-joined-modal'))).toBeVisible().withTimeout(5000);
    await element(by.id('continue-button')).tap();
    await waitFor(element(by.id('dashboard-screen'))).toBeVisible().withTimeout(5000);
  }

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Create Task', () => {
    beforeAll(async () => {
      // Sign in as parent
      await helpers.logout();
      await helpers.login(parentEmail, parentPassword);
    });

    it('should navigate to create task screen', async () => {
      // Tap create task button (FAB)
      await element(by.id('create-task-fab')).tap();
      
      await waitFor(element(by.id('create-task-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      await expect(element(by.text('Create Task'))).toBeVisible();
      await expect(element(by.id('task-title-input'))).toBeVisible();
      await expect(element(by.id('task-description-input'))).toBeVisible();
      await expect(element(by.id('category-selector'))).toBeVisible();
      await expect(element(by.id('assignee-selector'))).toBeVisible();
      await expect(element(by.id('due-date-picker'))).toBeVisible();
      await expect(element(by.id('save-task-button'))).toBeVisible();
    });

    it('should validate required fields', async () => {
      // Try to save without title
      await element(by.id('save-task-button')).tap();
      
      await waitFor(element(by.text('Task title is required')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should create task for self', async () => {
      const taskTitle = 'Complete project report';
      
      // Fill in task details
      await element(by.id('task-title-input')).replaceText(taskTitle);
      await element(by.id('task-description-input')).replaceText('Finish the quarterly report');
      
      // Select category
      await element(by.id('category-selector')).tap();
      await element(by.text('Personal')).tap();
      
      // Leave assignee as self (default)
      
      // Set due date (tomorrow)
      await element(by.id('due-date-picker')).tap();
      await element(by.text('Tomorrow')).tap();
      
      await helpers.dismissKeyboard();
      await element(by.id('save-task-button')).tap();
      
      // Should return to dashboard with success message
      await waitFor(element(by.text('Task created successfully')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Task should appear in list
      await expect(element(by.text(taskTitle))).toBeVisible();
    });

    it('should assign task to child', async () => {
      const taskTitle = 'Clean your room';
      
      // Create new task
      await element(by.id('create-task-fab')).tap();
      await waitFor(element(by.id('create-task-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Fill in task details
      await element(by.id('task-title-input')).replaceText(taskTitle);
      await element(by.id('task-description-input')).replaceText('Make bed and organize desk');
      
      // Select category
      await element(by.id('category-selector')).tap();
      await element(by.text('Chores')).tap();
      
      // Assign to child
      await element(by.id('assignee-selector')).tap();
      await element(by.text('Test Child')).tap();
      
      // Set priority
      await element(by.id('priority-selector')).tap();
      await element(by.text('High')).tap();
      
      // Enable photo validation (premium feature)
      await element(by.id('require-photo-switch')).tap();
      
      await helpers.dismissKeyboard();
      await element(by.id('save-task-button')).tap();
      
      // Should show success
      await waitFor(element(by.text('Task assigned to Test Child')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should create recurring task', async () => {
      const taskTitle = 'Daily exercise';
      
      // Create new task
      await element(by.id('create-task-fab')).tap();
      await waitFor(element(by.id('create-task-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Fill in task details
      await element(by.id('task-title-input')).replaceText(taskTitle);
      
      // Select category
      await element(by.id('category-selector')).tap();
      await element(by.text('Exercise')).tap();
      
      // Enable recurring
      await element(by.id('recurring-switch')).tap();
      
      // Set recurrence pattern
      await element(by.id('recurrence-selector')).tap();
      await element(by.text('Daily')).tap();
      
      await helpers.dismissKeyboard();
      await element(by.id('save-task-button')).tap();
      
      // Should show success
      await waitFor(element(by.text('Recurring task created')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should show recurring indicator
      await expect(element(by.id('recurring-indicator-' + taskTitle))).toBeVisible();
    });
  });

  describe('View and Filter Tasks', () => {
    beforeAll(async () => {
      // Navigate to tasks tab
      await helpers.navigateToTab('tasks');
    });

    it('should show all tasks by default', async () => {
      // Should see all created tasks
      await expect(element(by.text('Complete project report'))).toBeVisible();
      await expect(element(by.text('Clean your room'))).toBeVisible();
      await expect(element(by.text('Daily exercise'))).toBeVisible();
    });

    it('should filter tasks by status', async () => {
      // Filter by pending
      await element(by.id('filter-pending')).tap();
      
      // All tasks should still be visible (none completed yet)
      await expect(element(by.text('Complete project report'))).toBeVisible();
      await expect(element(by.text('Clean your room'))).toBeVisible();
      
      // Filter by completed
      await element(by.id('filter-completed')).tap();
      
      // Should show empty state
      await waitFor(element(by.text('No completed tasks')))
        .toBeVisible()
        .withTimeout(2000);
      
      // Reset filter
      await element(by.id('filter-all')).tap();
    });

    it('should filter tasks by category', async () => {
      // Open category filter
      await element(by.id('category-filter-button')).tap();
      
      // Select Chores
      await element(by.text('Chores')).tap();
      
      // Should only show chores
      await expect(element(by.text('Clean your room'))).toBeVisible();
      await expect(element(by.text('Complete project report'))).not.toBeVisible();
      
      // Clear filter
      await element(by.id('clear-filters-button')).tap();
    });

    it('should show task details when tapped', async () => {
      // Tap on a task
      await element(by.text('Complete project report')).tap();
      
      await waitFor(element(by.id('task-detail-modal')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should see task details
      await expect(element(by.text('Task Details'))).toBeVisible();
      await expect(element(by.text('Finish the quarterly report'))).toBeVisible();
      await expect(element(by.text('Category: Personal'))).toBeVisible();
      await expect(element(by.text('Status: Pending'))).toBeVisible();
      await expect(element(by.id('edit-task-button'))).toBeVisible();
      await expect(element(by.id('complete-task-button'))).toBeVisible();
      
      // Close modal
      await element(by.id('close-modal-button')).tap();
    });
  });

  describe('Complete Tasks', () => {
    describe('As Parent', () => {
      it('should complete own task', async () => {
        // Open task details
        await element(by.text('Complete project report')).tap();
        await waitFor(element(by.id('task-detail-modal')))
          .toBeVisible()
          .withTimeout(3000);
        
        // Complete task
        await element(by.id('complete-task-button')).tap();
        
        // Should show success
        await waitFor(element(by.text('Task completed!')))
          .toBeVisible()
          .withTimeout(3000);
        
        // Modal should close
        await waitFor(element(by.id('task-detail-modal')))
          .not.toBeVisible()
          .withTimeout(3000);
        
        // Task should show as completed
        await expect(element(by.id('task-completed-Complete project report'))).toBeVisible();
      });
    });

    describe('As Child', () => {
      beforeAll(async () => {
        // Sign in as child
        await helpers.logout();
        await helpers.login(childEmail, childPassword);
        await helpers.navigateToTab('tasks');
      });

      it('should see assigned tasks', async () => {
        // Should see task assigned by parent
        await expect(element(by.text('Clean your room'))).toBeVisible();
        
        // Should not see parent's personal tasks
        await expect(element(by.text('Complete project report'))).not.toBeVisible();
      });

      it('should complete task without photo', async () => {
        // For this test, assume photo validation is optional
        // Open task
        await element(by.text('Daily exercise')).tap();
        await waitFor(element(by.id('task-detail-modal')))
          .toBeVisible()
          .withTimeout(3000);
        
        // Complete task
        await element(by.id('complete-task-button')).tap();
        
        // Should show success
        await waitFor(element(by.text('Task completed!')))
          .toBeVisible()
          .withTimeout(3000);
        
        // Task should show as completed
        await waitFor(element(by.id('task-detail-modal')))
          .not.toBeVisible()
          .withTimeout(3000);
        
        await expect(element(by.id('task-completed-Daily exercise'))).toBeVisible();
      });

      it('should complete task with photo validation', async () => {
        // Open task that requires photo
        await element(by.text('Clean your room')).tap();
        await waitFor(element(by.id('task-detail-modal')))
          .toBeVisible()
          .withTimeout(3000);
        
        // Should see photo requirement
        await expect(element(by.text('Photo required'))).toBeVisible();
        
        // Tap complete
        await element(by.id('complete-task-button')).tap();
        
        // Should prompt for photo
        await waitFor(element(by.id('photo-upload-modal')))
          .toBeVisible()
          .withTimeout(3000);
        
        await expect(element(by.text('Add Photo Proof'))).toBeVisible();
        await expect(element(by.id('take-photo-button'))).toBeVisible();
        await expect(element(by.id('choose-photo-button'))).toBeVisible();
        
        // Simulate taking photo (in real test, would use camera)
        await element(by.id('take-photo-button')).tap();
        
        // Mock photo taken
        await waitFor(element(by.id('photo-preview')))
          .toBeVisible()
          .withTimeout(5000);
        
        // Add optional note
        await element(by.id('completion-note-input')).replaceText('Room is clean!');
        await helpers.dismissKeyboard();
        
        // Submit
        await element(by.id('submit-completion-button')).tap();
        
        // Should show pending validation
        await waitFor(element(by.text('Submitted for validation')))
          .toBeVisible()
          .withTimeout(3000);
        
        // Task should show as pending validation
        await waitFor(element(by.id('task-detail-modal')))
          .not.toBeVisible()
          .withTimeout(3000);
        
        await expect(element(by.id('task-validation-pending-Clean your room'))).toBeVisible();
      });
    });
  });

  describe('Task Validation', () => {
    beforeAll(async () => {
      // Sign back in as parent
      await helpers.logout();
      await helpers.login(parentEmail, parentPassword);
    });

    it('should show tasks pending validation', async () => {
      // Navigate to dashboard
      await helpers.navigateToTab('dashboard');
      
      // Should see validation pending section
      await expect(element(by.id('validation-pending-section'))).toBeVisible();
      await expect(element(by.text('1 task needs validation'))).toBeVisible();
      
      // Navigate to tasks
      await helpers.navigateToTab('tasks');
      
      // Should see task with validation pending
      await expect(element(by.id('task-validation-pending-Clean your room'))).toBeVisible();
    });

    it('should validate completed task', async () => {
      // Open task needing validation
      await element(by.text('Clean your room')).tap();
      await waitFor(element(by.id('task-detail-modal')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should see validation section
      await expect(element(by.text('Pending Validation'))).toBeVisible();
      await expect(element(by.id('submitted-photo'))).toBeVisible();
      await expect(element(by.text('Room is clean!'))).toBeVisible();
      await expect(element(by.id('approve-button'))).toBeVisible();
      await expect(element(by.id('reject-button'))).toBeVisible();
      
      // Approve the task
      await element(by.id('approve-button')).tap();
      
      // Should show success
      await waitFor(element(by.text('Task validated!')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Modal should close
      await waitFor(element(by.id('task-detail-modal')))
        .not.toBeVisible()
        .withTimeout(3000);
      
      // Task should show as completed
      await expect(element(by.id('task-completed-Clean your room'))).toBeVisible();
    });

    it('should reject task with feedback', async () => {
      // Create another task for testing rejection
      await element(by.id('create-task-fab')).tap();
      await waitFor(element(by.id('create-task-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.id('task-title-input')).replaceText('Test rejection');
      await element(by.id('assignee-selector')).tap();
      await element(by.text('Test Child')).tap();
      await element(by.id('require-photo-switch')).tap();
      await helpers.dismissKeyboard();
      await element(by.id('save-task-button')).tap();
      
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Sign in as child and complete with photo
      await helpers.logout();
      await helpers.login(childEmail, childPassword);
      await helpers.navigateToTab('tasks');
      
      await element(by.text('Test rejection')).tap();
      await waitFor(element(by.id('task-detail-modal')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('complete-task-button')).tap();
      await waitFor(element(by.id('photo-upload-modal')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('take-photo-button')).tap();
      await waitFor(element(by.id('photo-preview')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('submit-completion-button')).tap();
      await waitFor(element(by.text('Submitted for validation')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Sign back in as parent
      await helpers.logout();
      await helpers.login(parentEmail, parentPassword);
      await helpers.navigateToTab('tasks');
      
      // Open task and reject
      await element(by.text('Test rejection')).tap();
      await waitFor(element(by.id('task-detail-modal')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.id('reject-button')).tap();
      
      // Should show feedback modal
      await waitFor(element(by.id('rejection-feedback-modal')))
        .toBeVisible()
        .withTimeout(2000);
      
      await element(by.id('feedback-input')).replaceText('Please redo this task properly');
      await helpers.dismissKeyboard();
      await element(by.id('send-feedback-button')).tap();
      
      // Should show rejection sent
      await waitFor(element(by.text('Task rejected with feedback')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Task should return to pending
      await waitFor(element(by.id('task-detail-modal')))
        .not.toBeVisible()
        .withTimeout(3000);
      
      await expect(element(by.id('task-rejected-Test rejection'))).toBeVisible();
    });
  });

  describe('Edit and Delete Tasks', () => {
    beforeAll(async () => {
      // Make sure we're signed in as parent
      if (!await helpers.elementExists('dashboard-screen')) {
        await helpers.login(parentEmail, parentPassword);
      }
      await helpers.navigateToTab('tasks');
    });

    it('should edit task details', async () => {
      // Open a task
      await element(by.text('Daily exercise')).tap();
      await waitFor(element(by.id('task-detail-modal')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Tap edit
      await element(by.id('edit-task-button')).tap();
      
      await waitFor(element(by.id('edit-task-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Change title
      await helpers.clearText('task-title-input');
      await element(by.id('task-title-input')).replaceText('Morning exercise');
      
      // Change category
      await element(by.id('category-selector')).tap();
      await element(by.text('Personal')).tap();
      
      await helpers.dismissKeyboard();
      await element(by.id('save-task-button')).tap();
      
      // Should show success
      await waitFor(element(by.text('Task updated successfully')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should see updated task
      await expect(element(by.text('Morning exercise'))).toBeVisible();
      await expect(element(by.text('Daily exercise'))).not.toBeVisible();
    });

    it('should delete task', async () => {
      // Open task
      await element(by.text('Test rejection')).tap();
      await waitFor(element(by.id('task-detail-modal')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Tap delete
      await element(by.id('delete-task-button')).tap();
      
      // Should show confirmation
      await waitFor(element(by.text('Delete Task?')))
        .toBeVisible()
        .withTimeout(2000);
      
      await element(by.text('Delete')).tap();
      
      // Should show success
      await waitFor(element(by.text('Task deleted')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Task should be gone
      await expect(element(by.text('Test rejection'))).not.toBeVisible();
    });
  });
});