const { device, element, by, expect, waitFor } = require('detox');

const testHelpers = {
  /**
   * Sign in with existing credentials
   */
  async login(email, password) {
    await element(by.id('email-input')).replaceText(email);
    await element(by.id('password-input')).replaceText(password);
    await element(by.id('signin-button')).tap();
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);
  },

  /**
   * Sign up with new credentials
   */
  async signUp(email, password, displayName) {
    await element(by.id('signup-button')).tap();
    await this.safeReplaceText('email-input', email, 'signup-screen');
    await this.safeReplaceText('password-input', password, 'signup-screen');
    await this.safeReplaceText('confirm-password-input', password, 'signup-screen');
    await this.safeReplaceText('display-name-input', displayName, 'signup-screen');
    await this.ensureElementVisible('create-account-button', 'signup-screen');
    await element(by.id('create-account-button')).tap();
    await waitFor(element(by.id('family-setup-screen')))
      .toBeVisible()
      .withTimeout(5000);
  },

  /**
   * Sign out of the app
   */
  async logout() {
    await element(by.id('settings-tab')).tap();
    await element(by.id('signout-button')).tap();
    await waitFor(element(by.id('signin-screen')))
      .toBeVisible()
      .withTimeout(5000);
  },

  /**
   * Create a new family
   */
  async createFamily(familyName) {
    await element(by.id('create-family-button')).tap();
    await element(by.id('family-name-input')).replaceText(familyName);
    await element(by.id('create-button')).tap();
    await waitFor(element(by.id('invite-code')))
      .toBeVisible()
      .withTimeout(5000);
  },

  /**
   * Join an existing family
   */
  async joinFamily(inviteCode) {
    await element(by.id('join-family-button')).tap();
    await element(by.id('invite-code-input')).replaceText(inviteCode);
    await element(by.id('join-button')).tap();
    await waitFor(element(by.id('family-dashboard')))
      .toBeVisible()
      .withTimeout(5000);
  },

  /**
   * Create a new task
   */
  async createTask(title, description, category = 'Other') {
    await element(by.id('create-task-button')).tap();
    await element(by.id('task-title-input')).replaceText(title);
    
    if (description) {
      await element(by.id('task-description-input')).replaceText(description);
    }
    
    // Select category
    await element(by.id('category-selector')).tap();
    await element(by.text(category)).tap();
    
    await element(by.id('save-task-button')).tap();
    await waitFor(element(by.text(title)))
      .toBeVisible()
      .withTimeout(5000);
  },

  /**
   * Complete a task
   */
  async completeTask(taskTitle) {
    await element(by.text(taskTitle)).tap();
    await element(by.id('complete-task-button')).tap();
    await waitFor(element(by.id('task-completed-indicator')))
      .toBeVisible()
      .withTimeout(5000);
  },

  /**
   * Wait for an element to be visible
   */
  async waitForElement(testID, timeout = 5000) {
    await waitFor(element(by.id(testID)))
      .toBeVisible()
      .withTimeout(timeout);
  },

  /**
   * Wait for text to be visible
   */
  async waitForText(text, timeout = 5000) {
    await waitFor(element(by.text(text)))
      .toBeVisible()
      .withTimeout(timeout);
  },

  /**
   * Scroll to element
   */
  async scrollToElement(testID, scrollViewID = 'scroll-view') {
    await waitFor(element(by.id(testID)))
      .toBeVisible()
      .whileElement(by.id(scrollViewID))
      .scroll(500, 'down');
  },

  /**
   * Clear text input
   */
  async clearText(testID) {
    await element(by.id(testID)).clearText();
  },

  /**
   * Check if element exists (doesn't have to be visible)
   */
  async elementExists(testID) {
    try {
      await expect(element(by.id(testID))).toExist();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Dismiss keyboard
   */
  async dismissKeyboard() {
    // Try multiple methods to dismiss keyboard
    try {
      if (device.getPlatform() === 'ios') {
        // Try tapping outside first
        await element(by.id('signin-screen')).tap();
      } else {
        await device.pressBack();
      }
    } catch (e) {
      // If that fails, try other methods
      try {
        await element(by.label('Done')).tap();
      } catch (e2) {
        // Last resort - swipe down
        try {
          await element(by.id('signin-screen')).swipe('down', 'fast', 0.1);
        } catch (e3) {
          // Keyboard might already be dismissed
        }
      }
    }
  },

  /**
   * Generate unique test email
   */
  generateTestEmail() {
    return `test-${Date.now()}@example.com`;
  },

  /**
   * Generate unique family name
   */
  generateFamilyName() {
    return `Test Family ${Date.now()}`;
  },

  /**
   * Generate unique task title
   */
  generateTaskTitle() {
    return `Test Task ${Date.now()}`;
  },

  /**
   * Take screenshot
   */
  async takeScreenshot(name) {
    await device.takeScreenshot(name);
  },

  /**
   * Reset app state
   */
  async resetApp() {
    await device.launchApp({
      newInstance: true,
      delete: true,
      permissions: { notifications: 'YES' }
    });
  },

  /**
   * Navigate to tab
   */
  async navigateToTab(tabName) {
    const tabMap = {
      'dashboard': 'dashboard-tab',
      'tasks': 'tasks-tab',
      'family': 'family-tab',
      'settings': 'settings-tab'
    };
    
    const tabId = tabMap[tabName.toLowerCase()];
    if (!tabId) {
      throw new Error(`Unknown tab: ${tabName}`);
    }
    
    await element(by.id(tabId)).tap();
    await waitFor(element(by.id(`${tabName.toLowerCase()}-screen`)))
      .toBeVisible()
      .withTimeout(3000);
  },

  /**
   * Check notification permission
   */
  async checkNotificationPermission() {
    // This would need platform-specific implementation
    // For now, we'll assume permissions are granted in test
    return true;
  },

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete() {
    await waitFor(element(by.id('loading-indicator')))
      .not.toBeVisible()
      .withTimeout(10000);
  },

  /**
   * Ensure element is visible (scroll if needed)
   */
  async ensureElementVisible(testID, scrollViewID = 'signup-screen') {
    try {
      // First check if element is already visible
      await expect(element(by.id(testID))).toBeVisible();
    } catch (e) {
      // If not visible, try scrolling down
      try {
        await waitFor(element(by.id(testID)))
          .toBeVisible()
          .whileElement(by.id(scrollViewID))
          .scroll(300, 'down');
      } catch (e2) {
        // Element might not be scrollable or already at bottom
        console.log(`Could not scroll to ${testID}, continuing...`);
      }
    }
  },

  /**
   * Type text with keyboard avoidance
   */
  async safeReplaceText(testID, text, scrollViewID = 'signup-screen') {
    // Ensure element is visible first
    await this.ensureElementVisible(testID, scrollViewID);
    // Then type the text
    await element(by.id(testID)).replaceText(text);
  }
};

module.exports = testHelpers;