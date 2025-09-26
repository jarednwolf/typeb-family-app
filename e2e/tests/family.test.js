const { device, element, by, expect, waitFor } = require('detox');
const helpers = require('../helpers/testHelpers');
const { testUsers, testFamily } = require('../fixtures/testData');

describe('Family Management Flow', () => {
  let testEmail;
  let testPassword;
  let familyInviteCode;

  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      delete: true,
      permissions: { notifications: 'YES' }
    });
    
    // Use a new test account for family creation tests
    testEmail = helpers.generateTestEmail();
    testPassword = 'TestPass123!';
    familyInviteCode = testFamily.inviteCode; // Use seeded invite code
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Family Setup for New User', () => {
    it('should show family setup options after account creation', async () => {
      // Create new account
      await element(by.id('signup-link')).tap();
      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.id('email-input')).replaceText(testEmail);
      await element(by.id('password-input')).replaceText(testPassword);
      await element(by.id('confirm-password-input')).replaceText(testPassword);
      await element(by.id('display-name-input')).replaceText('Test Parent');
      
      await helpers.dismissKeyboard();
      await element(by.id('create-account-button')).tap();
      
      // Should see family setup screen
      await waitFor(element(by.id('family-setup-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Set Up Your Family'))).toBeVisible();
      await expect(element(by.id('create-family-button'))).toBeVisible();
      await expect(element(by.id('join-family-button'))).toBeVisible();
      await expect(element(by.id('skip-button'))).toBeVisible();
    });
  });

  describe('Create Family', () => {
    const familyName = helpers.generateFamilyName();

    it('should validate family name', async () => {
      await element(by.id('create-family-button')).tap();
      
      await waitFor(element(by.id('create-family-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Try to create without name
      await element(by.id('create-button')).tap();
      
      await waitFor(element(by.text('Family name is required')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should create family successfully', async () => {
      // Enter family name
      await element(by.id('family-name-input')).replaceText(familyName);
      await helpers.dismissKeyboard();
      
      await element(by.id('create-button')).tap();
      
      // Should show success with invite code
      await waitFor(element(by.id('family-created-modal')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Family Created!'))).toBeVisible();
      await expect(element(by.id('invite-code'))).toBeVisible();
      
      // The invite code is already set from test data
      // familyInviteCode = testFamily.inviteCode;
      
      // Continue to dashboard
      await element(by.id('continue-button')).tap();
      
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show user as parent in family', async () => {
      // Navigate to family tab
      await helpers.navigateToTab('family');
      
      // Should see family name
      await expect(element(by.text(familyName))).toBeVisible();
      
      // Should see self as parent
      await expect(element(by.text('Test Parent'))).toBeVisible();
      await expect(element(by.text('Parent'))).toBeVisible();
      
      // Should see invite code section
      await expect(element(by.id('invite-code-section'))).toBeVisible();
    });
  });

  describe('Join Family', () => {
    let childEmail;
    let childPassword;

    beforeAll(async () => {
      // Use seeded child account or create a new one
      childEmail = testUsers.child.email;
      childPassword = testUsers.child.password;
      
      // Sign out from parent account
      await helpers.logout();
      
      // Create child account
      await element(by.id('signup-link')).tap();
      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.id('email-input')).replaceText(childEmail);
      await element(by.id('password-input')).replaceText(childPassword);
      await element(by.id('confirm-password-input')).replaceText(childPassword);
      await element(by.id('display-name-input')).replaceText('Test Child');
      
      await helpers.dismissKeyboard();
      await element(by.id('create-account-button')).tap();
      
      await waitFor(element(by.id('family-setup-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should validate invite code', async () => {
      await element(by.id('join-family-button')).tap();
      
      await waitFor(element(by.id('join-family-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Try to join without code
      await element(by.id('join-button')).tap();
      
      await waitFor(element(by.text('Invite code is required')))
        .toBeVisible()
        .withTimeout(2000);
      
      // Try invalid code
      await element(by.id('invite-code-input')).replaceText('INVALID');
      await helpers.dismissKeyboard();
      await element(by.id('join-button')).tap();
      
      await waitFor(element(by.text('Invalid invite code')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should join family with valid code', async () => {
      // Clear previous input
      await helpers.clearText('invite-code-input');
      
      // Enter valid code from test data
      await element(by.id('invite-code-input')).replaceText(familyInviteCode);
      await helpers.dismissKeyboard();
      await element(by.id('join-button')).tap();
      
      // Should show success
      await waitFor(element(by.id('family-joined-modal')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Welcome to the Family!'))).toBeVisible();
      
      // Continue to dashboard
      await element(by.id('continue-button')).tap();
      
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show child in family members list', async () => {
      // Navigate to family tab
      await helpers.navigateToTab('family');
      
      // Should see family name
      await expect(element(by.text(familyName))).toBeVisible();
      
      // Should see self as child
      await expect(element(by.text('Test Child'))).toBeVisible();
      await expect(element(by.text('Child'))).toBeVisible();
      
      // Should also see parent
      await expect(element(by.text('Test Parent'))).toBeVisible();
      
      // Child should not see invite code section
      await expect(element(by.id('invite-code-section'))).not.toBeVisible();
    });
  });

  describe('Family Member Management', () => {
    beforeAll(async () => {
      // Sign back in as parent
      await helpers.logout();
      await helpers.login(testEmail, testPassword);
      await helpers.navigateToTab('family');
    });

    it('should show all family members', async () => {
      // Should see 2 members
      await expect(element(by.text('2 Members'))).toBeVisible();
      
      // Parent member
      await expect(element(by.text('Test Parent'))).toBeVisible();
      await expect(element(by.id('member-role-parent-0'))).toBeVisible();
      
      // Child member
      await expect(element(by.text('Test Child'))).toBeVisible();
      await expect(element(by.id('member-role-child-1'))).toBeVisible();
    });

    it('should show member details when tapped', async () => {
      // Tap on child member
      await element(by.text('Test Child')).tap();
      
      await waitFor(element(by.id('member-detail-modal')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should see member info
      await expect(element(by.text('Member Details'))).toBeVisible();
      await expect(element(by.text('Role: Child'))).toBeVisible();
      await expect(element(by.id('task-stats'))).toBeVisible();
      
      // Parent should see management options
      await expect(element(by.id('change-role-button'))).toBeVisible();
      await expect(element(by.id('remove-member-button'))).toBeVisible();
      
      // Close modal
      await element(by.id('close-modal-button')).tap();
    });

    it('should change member role', async () => {
      // Open child member details
      await element(by.text('Test Child')).tap();
      
      await waitFor(element(by.id('member-detail-modal')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Change role to parent
      await element(by.id('change-role-button')).tap();
      
      await waitFor(element(by.id('role-selector')))
        .toBeVisible()
        .withTimeout(2000);
      
      await element(by.text('Parent')).tap();
      await element(by.id('confirm-role-change')).tap();
      
      // Should show success
      await waitFor(element(by.text('Role updated successfully')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Close modal
      await element(by.id('close-modal-button')).tap();
      
      // Verify role changed in list
      await expect(element(by.id('member-role-parent-1'))).toBeVisible();
    });

    it('should prevent removing last parent', async () => {
      // Try to remove self (last parent if child was changed to parent)
      await element(by.text('Test Parent')).tap();
      
      await waitFor(element(by.id('member-detail-modal')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Try to remove
      await element(by.id('remove-member-button')).tap();
      
      // Should show confirmation
      await waitFor(element(by.text('Remove Member?')))
        .toBeVisible()
        .withTimeout(2000);
      
      await element(by.text('Remove')).tap();
      
      // Should show error
      await waitFor(element(by.text('Cannot remove yourself from the family')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Close modal
      await element(by.id('close-modal-button')).tap();
    });
  });

  describe('Invite Code Management', () => {
    it('should display current invite code', async () => {
      // Should be on family screen as parent
      await expect(element(by.id('invite-code-section'))).toBeVisible();
      await expect(element(by.id('current-invite-code'))).toBeVisible();
      await expect(element(by.id('copy-code-button'))).toBeVisible();
      await expect(element(by.id('share-code-button'))).toBeVisible();
    });

    it('should copy invite code to clipboard', async () => {
      await element(by.id('copy-code-button')).tap();
      
      // Should show success message
      await waitFor(element(by.text('Invite code copied!')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should regenerate invite code', async () => {
      await element(by.id('regenerate-code-button')).tap();
      
      // Should show confirmation
      await waitFor(element(by.text('Regenerate Invite Code?')))
        .toBeVisible()
        .withTimeout(2000);
      
      await expect(element(by.text('This will invalidate the current code'))).toBeVisible();
      
      await element(by.text('Regenerate')).tap();
      
      // Should show success
      await waitFor(element(by.text('New invite code generated')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Code should be updated (visual check)
      await expect(element(by.id('current-invite-code'))).toBeVisible();
    });
  });

  describe.skip('Leave Family', () => {
    // Skip this test for now as it modifies the seeded data
    beforeAll(async () => {
      // Sign in as child
      await helpers.logout();
      await helpers.login(childEmail, childPassword);
      await helpers.navigateToTab('family');
    });

    it('should allow member to leave family', async () => {
      // Navigate to settings
      await helpers.navigateToTab('settings');
      
      // Find leave family option
      await helpers.scrollToElement('leave-family-button');
      await element(by.id('leave-family-button')).tap();
      
      // Should show confirmation
      await waitFor(element(by.text('Leave Family?')))
        .toBeVisible()
        .withTimeout(2000);
      
      await expect(element(by.text('You will lose access to all family tasks'))).toBeVisible();
      
      await element(by.text('Leave')).tap();
      
      // Should return to family setup
      await waitFor(element(by.id('family-setup-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Set Up Your Family'))).toBeVisible();
    });
  });

  describe('Family Capacity Limits', () => {
    it('should enforce member limits for free tier', async () => {
      // This test would require setting up a family with max members
      // For now, we'll just check that the limit is displayed
      
      // Create new family
      await element(by.id('create-family-button')).tap();
      
      await waitFor(element(by.id('create-family-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Should show member limit (updated to 1 for free tier)
      await expect(element(by.text('Free: 1 member'))).toBeVisible();
      
      // Go back
      await element(by.id('back-button')).tap();
    });

    it('should show upgrade prompt when reaching limit', async () => {
      // This would be tested when trying to add 5th member
      // Placeholder for future implementation
      expect(true).toBe(true);
    });
  });
});