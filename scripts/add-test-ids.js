#!/usr/bin/env node

/**
 * Script to add missing testID props to React Native components
 * This will help E2E tests find elements
 */

const fs = require('fs');
const path = require('path');

// Map of screens and their required test IDs based on E2E tests
const screenTestIds = {
  'ForgotPasswordScreen.tsx': {
    container: 'forgot-password-screen',
    inputs: ['email-input'],
    buttons: ['send-reset-button', 'back-button']
  },
  'DashboardScreen.tsx': {
    container: 'dashboard-screen',
    buttons: ['create-task-fab'],
    sections: ['validation-pending-section']
  },
  'FamilySetupScreen.tsx': {
    container: 'family-setup-screen',
    buttons: ['create-family-button', 'join-family-button', 'skip-button']
  },
  'CreateFamilyScreen.tsx': {
    container: 'create-family-screen',
    inputs: ['family-name-input'],
    buttons: ['create-button', 'back-button'],
    modals: ['family-created-modal']
  },
  'JoinFamilyScreen.tsx': {
    container: 'join-family-screen',
    inputs: ['invite-code-input'],
    buttons: ['join-button'],
    modals: ['family-joined-modal']
  },
  'FamilyScreen.tsx': {
    sections: ['invite-code-section'],
    elements: ['current-invite-code'],
    buttons: ['copy-code-button', 'share-code-button', 'regenerate-code-button', 'leave-family-button']
  },
  'CreateTaskScreen.tsx': {
    container: 'create-task-screen',
    inputs: ['task-title-input', 'task-description-input', 'completion-note-input'],
    selectors: ['category-selector', 'assignee-selector', 'priority-selector', 'recurrence-selector'],
    pickers: ['due-date-picker'],
    switches: ['require-photo-switch', 'recurring-switch'],
    buttons: ['save-task-button']
  },
  'EditTaskScreen.tsx': {
    container: 'edit-task-screen',
    inputs: ['task-title-input', 'task-description-input'],
    selectors: ['category-selector', 'assignee-selector', 'priority-selector'],
    pickers: ['due-date-picker'],
    buttons: ['save-task-button']
  },
  'TaskDetailModal.tsx': {
    container: 'task-detail-modal',
    buttons: ['edit-task-button', 'complete-task-button', 'delete-task-button', 
              'approve-button', 'reject-button', 'close-modal-button'],
    elements: ['submitted-photo', 'task-stats']
  },
  'MemberDetailModal.tsx': {
    container: 'member-detail-modal',
    buttons: ['change-role-button', 'remove-member-button', 'close-modal-button'],
    elements: ['task-stats'],
    selectors: ['role-selector']
  },
  'PhotoUploadModal.tsx': {
    container: 'photo-upload-modal',
    buttons: ['take-photo-button', 'choose-photo-button', 'submit-completion-button'],
    elements: ['photo-preview']
  },
  'RejectionFeedbackModal.tsx': {
    container: 'rejection-feedback-modal',
    inputs: ['feedback-input'],
    buttons: ['send-feedback-button']
  },
  'SettingsScreen.tsx': {
    buttons: ['signout-button', 'settings-tab']
  }
};

// Function to check if a file needs test IDs
function checkFile(filePath) {
  const fileName = path.basename(filePath);
  const requiredIds = screenTestIds[fileName];
  
  if (!requiredIds) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const missingIds = [];
    
    // Check for container testID
    if (requiredIds.container && !content.includes(`testID="${requiredIds.container}"`)) {
      missingIds.push({ type: 'container', id: requiredIds.container });
    }
    
    // Check for input testIDs
    if (requiredIds.inputs) {
      requiredIds.inputs.forEach(id => {
        if (!content.includes(`testID="${id}"`)) {
          missingIds.push({ type: 'input', id });
        }
      });
    }
    
    // Check for button testIDs
    if (requiredIds.buttons) {
      requiredIds.buttons.forEach(id => {
        if (!content.includes(`testID="${id}"`)) {
          missingIds.push({ type: 'button', id });
        }
      });
    }
    
    // Check for other elements
    ['sections', 'elements', 'selectors', 'pickers', 'switches', 'modals'].forEach(category => {
      if (requiredIds[category]) {
        requiredIds[category].forEach(id => {
          if (!content.includes(`testID="${id}"`)) {
            missingIds.push({ type: category, id });
          }
        });
      }
    });
    
    return missingIds.length > 0 ? { fileName, missingIds } : null;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Function to scan directories
function scanDirectory(dir) {
  const results = [];
  
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      results.push(...scanDirectory(fullPath));
    } else if (stat.isFile() && item.endsWith('.tsx')) {
      const checkResult = checkFile(fullPath);
      if (checkResult) {
        results.push({ ...checkResult, path: fullPath });
      }
    }
  });
  
  return results;
}

// Main execution
console.log('🔍 Scanning for missing test IDs...\n');

const screensDir = path.join(__dirname, '..', 'src', 'screens');
const componentsDir = path.join(__dirname, '..', 'src', 'components');

const missingInScreens = scanDirectory(screensDir);
const missingInComponents = scanDirectory(componentsDir);

const allMissing = [...missingInScreens, ...missingInComponents];

if (allMissing.length === 0) {
  console.log('✅ All required test IDs are present!');
} else {
  console.log(`⚠️  Found ${allMissing.length} files with missing test IDs:\n`);
  
  allMissing.forEach(file => {
    console.log(`📄 ${file.fileName}`);
    console.log(`   Path: ${file.path}`);
    console.log('   Missing IDs:');
    file.missingIds.forEach(({ type, id }) => {
      console.log(`     - [${type}] ${id}`);
    });
    console.log('');
  });
  
  console.log('\n📝 To fix these issues:');
  console.log('1. Add testID props to the components in each file');
  console.log('2. For containers, add to the root View/SafeAreaView');
  console.log('3. For inputs, add to TextInput components');
  console.log('4. For buttons, add to TouchableOpacity/Button components');
  console.log('\nExample: <View testID="dashboard-screen">');
  console.log('         <TextInput testID="email-input" />');
  console.log('         <TouchableOpacity testID="signin-button">');
}

// Generate a summary report
const report = {
  timestamp: new Date().toISOString(),
  totalFilesChecked: Object.keys(screenTestIds).length,
  filesWithMissingIds: allMissing.length,
  totalMissingIds: allMissing.reduce((sum, file) => sum + file.missingIds.length, 0),
  details: allMissing
};

const reportPath = path.join(__dirname, '..', 'test-ids-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📊 Report saved to: ${reportPath}`);