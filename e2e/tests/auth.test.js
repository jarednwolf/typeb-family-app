const { device, element, by, expect, waitFor } = require('detox');
const helpers = require('../helpers/testHelpers');
const { testUsers } = require('../fixtures/testData');

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Sign In Screen', () => {
    it('should show sign in screen on app launch', async () => {
      await expect(element(by.id('signin-screen'))).toBeVisible();
      await expect(element(by.text('Welcome Back'))).toBeVisible();
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('signin-button'))).toBeVisible();
    });

    it('should show validation errors for empty fields', async () => {
      await element(by.id('signin-button')).tap();
      
      // The app shows an Alert with "Please fill in all fields"
      await waitFor(element(by.text('Please fill in all fields')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should show error for invalid email format', async () => {
      await element(by.id('email-input')).replaceText('invalid-email');
      await element(by.id('password-input')).replaceText('password123');
      await element(by.id('signin-button')).tap();
      
      // The auth service returns "Please enter a valid email address"
      await waitFor(element(by.text('Please enter a valid email address')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should navigate to forgot password screen', async () => {
      await element(by.id('forgot-password-button')).tap();
      
      await waitFor(element(by.id('forgot-password-screen')))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.text('Reset Password')).atIndex(0)).toBeVisible();
      
      // Go back
      if (await helpers.elementExists('back-button')) {
        await element(by.id('back-button')).tap();
      } else {
        await device.pressBack();
      }
      await expect(element(by.id('signin-screen'))).toBeVisible();
    });

    it('should navigate to sign up screen', async () => {
      await element(by.id('signup-link')).tap();
      
      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.text('Create Account')).atIndex(0)).toBeVisible();
      
      // Go back
      await element(by.id('signin-link')).tap();
      await expect(element(by.id('signin-screen'))).toBeVisible();
    });
  });

  describe('Sign Up Flow', () => {
    const testEmail = helpers.generateTestEmail();
    const testPassword = 'TestPass123!';
    const testDisplayName = 'Test User';

    beforeEach(async () => {
      // Navigate to sign up screen
      await element(by.id('signup-link')).tap();
      await waitFor(element(by.id('signup-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should show all sign up fields', async () => {
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('confirm-password-input'))).toBeVisible();
      await expect(element(by.id('display-name-input'))).toBeVisible();
      await expect(element(by.id('create-account-button'))).toBeVisible();
    });

    it('should validate password match', async () => {
      await helpers.safeReplaceText('display-name-input', testDisplayName, 'signup-screen');
      await helpers.safeReplaceText('email-input', testEmail, 'signup-screen');
      await helpers.safeReplaceText('password-input', testPassword, 'signup-screen');
      await helpers.safeReplaceText('confirm-password-input', 'DifferentPass123!', 'signup-screen');
      
      await helpers.dismissKeyboard();
      await helpers.ensureElementVisible('create-account-button', 'signup-screen');
      await element(by.id('create-account-button')).tap();
      
      // Check for password mismatch error - the actual error message from the app
      await waitFor(element(by.text('Passwords do not match')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should validate password strength', async () => {
      await helpers.safeReplaceText('display-name-input', testDisplayName, 'signup-screen');
      await helpers.safeReplaceText('email-input', testEmail, 'signup-screen');
      await helpers.safeReplaceText('password-input', 'weak', 'signup-screen');
      await helpers.safeReplaceText('confirm-password-input', 'weak', 'signup-screen');
      
      await helpers.dismissKeyboard();
      await helpers.ensureElementVisible('create-account-button', 'signup-screen');
      await element(by.id('create-account-button')).tap();
      
      // The app shows password requirements in an alert
      await waitFor(element(by.label('Password Requirements')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should create account and navigate to family setup', async () => {
      await helpers.safeReplaceText('email-input', testEmail, 'signup-screen');
      await helpers.safeReplaceText('password-input', testPassword, 'signup-screen');
      await helpers.safeReplaceText('confirm-password-input', testPassword, 'signup-screen');
      await helpers.safeReplaceText('display-name-input', testDisplayName, 'signup-screen');
      
      // Dismiss keyboard before tapping button
      await helpers.dismissKeyboard();
      await helpers.ensureElementVisible('create-account-button', 'signup-screen');
      
      await element(by.id('create-account-button')).tap();
      
      // Wait for family setup screen
      await waitFor(element(by.id('family-setup-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Set Up Your Family'))).toBeVisible();
      await expect(element(by.id('create-family-button'))).toBeVisible();
      await expect(element(by.id('join-family-button'))).toBeVisible();
    });
  });

  describe('Sign In with Existing Account', () => {
    // Using seeded test data from Firebase emulator
    
    it('should sign in with valid credentials', async () => {
      // Make sure we're on sign in screen
      if (await helpers.elementExists('family-setup-screen')) {
        await helpers.logout();
      }
      
      const testEmail = testUsers.existingUser.email;
      const testPassword = testUsers.existingUser.password;
      
      await element(by.id('email-input')).replaceText(testEmail);
      await element(by.id('password-input')).replaceText(testPassword);
      
      // Dismiss keyboard
      await helpers.dismissKeyboard();
      
      await element(by.id('signin-button')).tap();
      
      // Should navigate to dashboard
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(10000);
      
      await expect(element(by.text('Dashboard'))).toBeVisible();
    });

    it('should show error for incorrect password', async () => {
      // Sign out if signed in
      if (await helpers.elementExists('dashboard-screen')) {
        await helpers.logout();
      }
      
      await element(by.id('email-input')).replaceText(testUsers.existingUser.email);
      await element(by.id('password-input')).replaceText('WrongPassword123!');
      
      await helpers.dismissKeyboard();
      await element(by.id('signin-button')).tap();
      
      // Firebase returns "Invalid email or password. Please try again."
      await waitFor(element(by.text('Invalid email or password. Please try again.')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Sign Out', () => {
    beforeEach(async () => {
      // Sign in first with existing user
      const testEmail = testUsers.existingUser.email;
      const testPassword = testUsers.existingUser.password;
      
      // Make sure we're signed out
      if (await helpers.elementExists('dashboard-screen')) {
        await helpers.logout();
      }
      
      await helpers.login(testEmail, testPassword);
    });

    it('should sign out successfully', async () => {
      // Navigate to settings
      await helpers.navigateToTab('settings');
      
      // Find and tap sign out button
      await element(by.id('signout-button')).tap();
      
      // Confirm sign out
      await element(by.text('Sign Out')).tap();
      
      // Should return to sign in screen
      await waitFor(element(by.id('signin-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Welcome Back'))).toBeVisible();
    });
  });

  describe('Password Reset', () => {
    beforeEach(async () => {
      // Make sure we're on sign in screen
      if (!await helpers.elementExists('signin-screen')) {
        await helpers.resetApp();
      }
      
      // Navigate to forgot password
      await element(by.id('forgot-password-button')).tap();
      await waitFor(element(by.id('forgot-password-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should validate email before sending reset', async () => {
      // Try with empty email
      await element(by.id('email-input')).clearText();
      await element(by.id('send-reset-button')).tap();
      
      await waitFor(element(by.text('Please enter your email')))
        .toBeVisible()
        .withTimeout(2000);
      
      // Try with invalid email
      await element(by.id('email-input')).replaceText('invalid-email');
      await element(by.id('send-reset-button')).tap();
      
      await waitFor(element(by.text('Please enter a valid email address')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should send password reset email', async () => {
      await element(by.id('email-input')).replaceText(testUsers.existingUser.email);
      await helpers.dismissKeyboard();
      await element(by.id('send-reset-button')).tap();
      
      // Should show success message
      await waitFor(element(by.text('Password reset email sent')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Should navigate back to sign in
      await waitFor(element(by.id('signin-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session after app restart', async () => {
      // Sign in with existing user
      const testEmail = testUsers.existingUser.email;
      const testPassword = testUsers.existingUser.password;
      
      // Make sure we're signed out
      if (await helpers.elementExists('dashboard-screen')) {
        await helpers.logout();
      }
      
      await helpers.login(testEmail, testPassword);
      
      // Verify we're on dashboard
      await expect(element(by.id('dashboard-screen'))).toBeVisible();
      
      // Restart app without clearing data
      await device.launchApp({ newInstance: true });
      
      // Should still be signed in
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(5000);
      
      await expect(element(by.text('Dashboard'))).toBeVisible();
    });
  });
});