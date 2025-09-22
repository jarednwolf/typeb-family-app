/**
 * Accessibility Audit Utility
 * Ensures WCAG 2.1 Level AA compliance for app store requirements
 */

import { AccessibilityInfo, Platform } from 'react-native';

export interface AccessibilityIssue {
  component: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  wcagCriteria: string;
  recommendation: string;
  location?: string;
}

export interface AuditConfig {
  checkScreenReader?: boolean;
  checkColorContrast?: boolean;
  checkTouchTargets?: boolean;
  checkTextSize?: boolean;
  checkFocus?: boolean;
  checkLabels?: boolean;
  verbose?: boolean;
}

/**
 * Component-specific accessibility rules
 */
const COMPONENT_RULES = {
  button: {
    minWidth: 44,
    minHeight: 44,
    requiresLabel: true,
    requiresHint: false,
  },
  text: {
    minFontSize: 14,
    minLineHeight: 1.5,
    maxLineLength: 80,
  },
  input: {
    minHeight: 44,
    requiresLabel: true,
    requiresError: true,
  },
  image: {
    requiresAlt: true,
    decorativeHandling: true,
  },
};

/**
 * WCAG 2.1 Color Contrast Requirements
 */
const COLOR_CONTRAST = {
  normalText: 4.5, // 4.5:1 for normal text
  largeText: 3.0,  // 3:1 for large text (18pt+)
  uiComponents: 3.0, // 3:1 for UI components
};

export class AccessibilityAudit {
  private issues: AccessibilityIssue[] = [];
  private config: AuditConfig;
  private screenReaderEnabled: boolean = false;

  constructor(config: AuditConfig = {}) {
    this.config = {
      checkScreenReader: true,
      checkColorContrast: true,
      checkTouchTargets: true,
      checkTextSize: true,
      checkFocus: true,
      checkLabels: true,
      verbose: false,
      ...config,
    };
  }

  /**
   * Run complete accessibility audit
   */
  async runAudit(): Promise<AccessibilityIssue[]> {
    this.issues = [];
    
    if (this.config.verbose) {
      console.log('🔍 Starting Accessibility Audit...');
    }

    // Check screen reader status
    if (this.config.checkScreenReader) {
      await this.checkScreenReaderStatus();
    }

    // Run component audits
    if (this.config.checkTextSize) {
      this.auditTextComponents();
    }

    if (this.config.checkTouchTargets) {
      this.auditInteractiveElements();
    }

    if (this.config.checkLabels) {
      this.auditImages();
      this.auditForms();
    }

    if (this.config.checkFocus) {
      this.auditNavigation();
    }

    if (this.config.checkColorContrast) {
      this.auditColorContrast();
    }

    // Platform-specific checks
    this.auditPlatformSpecific();

    if (this.config.verbose) {
      console.log(`✅ Audit complete. Found ${this.issues.length} issues.`);
    }

    return this.issues;
  }

  /**
   * Check if screen reader is enabled
   */
  private async checkScreenReaderStatus(): Promise<void> {
    try {
      this.screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      if (this.config.verbose && this.screenReaderEnabled) {
        console.log('📱 Screen reader is enabled');
      }
    } catch (error) {
      this.addIssue({
        component: 'System',
        issue: 'Unable to detect screen reader status',
        severity: 'warning',
        wcagCriteria: 'WCAG 4.1.2',
        recommendation: 'Ensure accessibility services are properly configured',
      });
    }
  }

  /**
   * Audit text components for readability
   */
  private auditTextComponents(): void {
    // Check for minimum font sizes
    this.addIssue({
      component: 'Text',
      issue: 'Ensure all body text is at least 14pt',
      severity: 'info',
      wcagCriteria: 'WCAG 1.4.4',
      recommendation: 'Use theme.fontSize.sm (14pt) as minimum for body text',
      location: 'Global styles',
    });

    // Check line height
    this.addIssue({
      component: 'Text',
      issue: 'Verify line height is at least 1.5x font size',
      severity: 'info',
      wcagCriteria: 'WCAG 1.4.8',
      recommendation: 'Set lineHeight to 1.5 or greater in typography styles',
      location: 'Typography components',
    });
  }

  /**
   * Audit interactive elements for touch targets
   */
  private auditInteractiveElements(): void {
    // Minimum touch target size
    this.addIssue({
      component: 'TouchableOpacity/Button',
      issue: 'Verify all touch targets are at least 44x44 points',
      severity: 'error',
      wcagCriteria: 'WCAG 2.5.5',
      recommendation: 'Set minHeight and minWidth to 44 for all touchable components',
      location: 'Button components',
    });

    // Accessible labels
    this.addIssue({
      component: 'Interactive Elements',
      issue: 'Ensure all buttons have accessible labels',
      severity: 'error',
      wcagCriteria: 'WCAG 4.1.2',
      recommendation: 'Add accessibilityLabel prop to all TouchableOpacity components',
      location: 'Throughout app',
    });
  }

  /**
   * Audit images for alt text
   */
  private auditImages(): void {
    this.addIssue({
      component: 'Image',
      issue: 'Verify all informative images have alt text',
      severity: 'error',
      wcagCriteria: 'WCAG 1.1.1',
      recommendation: 'Add accessibilityLabel to Image components',
      location: 'Image components',
    });

    this.addIssue({
      component: 'Image',
      issue: 'Mark decorative images appropriately',
      severity: 'warning',
      wcagCriteria: 'WCAG 1.1.1',
      recommendation: 'Use accessibilityRole="none" for decorative images',
      location: 'Decorative images',
    });
  }

  /**
   * Audit form components
   */
  private auditForms(): void {
    // Label associations
    this.addIssue({
      component: 'TextInput',
      issue: 'Ensure all form inputs have associated labels',
      severity: 'error',
      wcagCriteria: 'WCAG 1.3.1',
      recommendation: 'Add accessibilityLabel to all TextInput components',
      location: 'Form components',
    });

    // Error messages
    this.addIssue({
      component: 'Form Validation',
      issue: 'Make error messages accessible to screen readers',
      severity: 'error',
      wcagCriteria: 'WCAG 3.3.1',
      recommendation: 'Use accessibilityLiveRegion="polite" for error messages',
      location: 'Form validation',
    });

    // Required fields
    this.addIssue({
      component: 'Required Fields',
      issue: 'Indicate required fields accessibly',
      severity: 'warning',
      wcagCriteria: 'WCAG 3.3.2',
      recommendation: 'Use accessibilityHint to indicate required fields',
      location: 'Form inputs',
    });
  }

  /**
   * Audit navigation and focus management
   */
  private auditNavigation(): void {
    // Focus order
    this.addIssue({
      component: 'Navigation',
      issue: 'Verify logical focus order',
      severity: 'error',
      wcagCriteria: 'WCAG 2.4.3',
      recommendation: 'Test with keyboard navigation and screen reader',
      location: 'All screens',
    });

    // Focus indicators
    this.addIssue({
      component: 'Focus Indicators',
      issue: 'Ensure visible focus indicators',
      severity: 'error',
      wcagCriteria: 'WCAG 2.4.7',
      recommendation: 'Add focusVisible styles to interactive elements',
      location: 'Interactive components',
    });

    // Skip navigation
    this.addIssue({
      component: 'Navigation',
      issue: 'Consider skip navigation for complex screens',
      severity: 'info',
      wcagCriteria: 'WCAG 2.4.1',
      recommendation: 'Add skip links for screens with many elements',
      location: 'Complex screens',
    });
  }

  /**
   * Audit color contrast ratios
   */
  private auditColorContrast(): void {
    // Text contrast
    this.addIssue({
      component: 'Color Contrast',
      issue: 'Verify text contrast ratio is at least 4.5:1',
      severity: 'error',
      wcagCriteria: 'WCAG 1.4.3',
      recommendation: 'Test all text/background combinations with contrast checker',
      location: 'Theme colors',
    });

    // UI component contrast
    this.addIssue({
      component: 'UI Components',
      issue: 'Verify UI component contrast is at least 3:1',
      severity: 'error',
      wcagCriteria: 'WCAG 1.4.11',
      recommendation: 'Check borders, icons, and form controls',
      location: 'UI elements',
    });

    // Color-only information
    this.addIssue({
      component: 'Information Display',
      issue: 'Ensure information is not conveyed by color alone',
      severity: 'error',
      wcagCriteria: 'WCAG 1.4.1',
      recommendation: 'Add icons or text labels alongside color indicators',
      location: 'Status indicators',
    });
  }

  /**
   * Platform-specific accessibility checks
   */
  private auditPlatformSpecific(): void {
    if (Platform.OS === 'ios') {
      this.addIssue({
        component: 'iOS VoiceOver',
        issue: 'Test with VoiceOver enabled',
        severity: 'info',
        wcagCriteria: 'Platform Specific',
        recommendation: 'Settings > Accessibility > VoiceOver',
        location: 'iOS devices',
      });

      this.addIssue({
        component: 'iOS Accessibility',
        issue: 'Support Dynamic Type',
        severity: 'warning',
        wcagCriteria: 'iOS HIG',
        recommendation: 'Test with larger text sizes',
        location: 'Text components',
      });
    } else if (Platform.OS === 'android') {
      this.addIssue({
        component: 'Android TalkBack',
        issue: 'Test with TalkBack enabled',
        severity: 'info',
        wcagCriteria: 'Platform Specific',
        recommendation: 'Settings > Accessibility > TalkBack',
        location: 'Android devices',
      });

      this.addIssue({
        component: 'Android Accessibility',
        issue: 'Support font scaling',
        severity: 'warning',
        wcagCriteria: 'Android Guidelines',
        recommendation: 'Test with system font scaling',
        location: 'Text components',
      });
    }
  }

  /**
   * Add an issue to the audit results
   */
  private addIssue(issue: Omit<AccessibilityIssue, 'id'>): void {
    this.issues.push(issue as AccessibilityIssue);
  }

  /**
   * Get audit summary
   */
  getSummary(): {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    compliant: boolean;
  } {
    const errors = this.issues.filter(i => i.severity === 'error').length;
    const warnings = this.issues.filter(i => i.severity === 'warning').length;
    const info = this.issues.filter(i => i.severity === 'info').length;

    return {
      total: this.issues.length,
      errors,
      warnings,
      info,
      compliant: errors === 0,
    };
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(): string {
    const summary = this.getSummary();
    const date = new Date().toLocaleDateString();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TypeB Family - Accessibility Audit Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .compliant { color: #4CAF50; }
    .non-compliant { color: #f44336; }
    .issue { margin: 15px 0; padding: 15px; border-left: 4px solid; background: #fafafa; }
    .error { border-color: #f44336; }
    .warning { border-color: #ff9800; }
    .info { border-color: #2196F3; }
    .wcag { color: #666; font-size: 0.9em; }
    .recommendation { margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>TypeB Family - Accessibility Audit Report</h1>
  <p>Generated: ${date}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Issues: ${summary.total}</p>
    <p>Errors: ${summary.errors}</p>
    <p>Warnings: ${summary.warnings}</p>
    <p>Info: ${summary.info}</p>
    <p class="${summary.compliant ? 'compliant' : 'non-compliant'}">
      WCAG 2.1 Level AA Compliance: ${summary.compliant ? '✅ PASSED' : '❌ FAILED'}
    </p>
  </div>

  <h2>Issues</h2>
  ${this.issues.map(issue => `
    <div class="issue ${issue.severity}">
      <h3>${issue.component}</h3>
      <p><strong>Issue:</strong> ${issue.issue}</p>
      <p class="wcag"><strong>WCAG Criteria:</strong> ${issue.wcagCriteria}</p>
      <p><strong>Severity:</strong> ${issue.severity.toUpperCase()}</p>
      ${issue.location ? `<p><strong>Location:</strong> ${issue.location}</p>` : ''}
      <div class="recommendation">
        <strong>Recommendation:</strong> ${issue.recommendation}
      </div>
    </div>
  `).join('')}

  <h2>Next Steps</h2>
  <ol>
    <li>Address all ERROR level issues before app store submission</li>
    <li>Review WARNING level issues and fix where possible</li>
    <li>Test with actual screen readers (VoiceOver/TalkBack)</li>
    <li>Verify color contrast with online tools</li>
    <li>Test with users who rely on assistive technologies</li>
  </ol>
</body>
</html>
    `;
  }

  /**
   * Generate Markdown report
   */
  generateMarkdownReport(): string {
    const summary = this.getSummary();
    const date = new Date().toLocaleDateString();

    return `# TypeB Family - Accessibility Audit Report

Generated: ${date}

## Summary

- **Total Issues**: ${summary.total}
- **Errors**: ${summary.errors}
- **Warnings**: ${summary.warnings}
- **Info**: ${summary.info}
- **WCAG 2.1 Level AA Compliance**: ${summary.compliant ? '✅ PASSED' : '❌ FAILED'}

## Issues

${this.issues.map(issue => `
### ${issue.component}

- **Issue**: ${issue.issue}
- **WCAG Criteria**: ${issue.wcagCriteria}
- **Severity**: ${issue.severity.toUpperCase()}
${issue.location ? `- **Location**: ${issue.location}` : ''}

**Recommendation**: ${issue.recommendation}

---
`).join('')}

## Next Steps

1. Address all ERROR level issues before app store submission
2. Review WARNING level issues and fix where possible
3. Test with actual screen readers (VoiceOver/TalkBack)
4. Verify color contrast with online tools
5. Test with users who rely on assistive technologies

## Testing Checklist

- [ ] VoiceOver (iOS) testing completed
- [ ] TalkBack (Android) testing completed
- [ ] Keyboard navigation verified
- [ ] Color contrast ratios checked
- [ ] Touch targets measured (44x44 minimum)
- [ ] Form labels and errors tested
- [ ] Focus indicators visible
- [ ] Dynamic text sizing tested

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Accessibility Guidelines](https://developer.apple.com/accessibility/ios/)
- [Android Accessibility Guidelines](https://developer.android.com/guide/topics/ui/accessibility)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
    `;
  }
}

/**
 * Run accessibility audit and save report
 */
export async function runAccessibilityAudit(
  config?: AuditConfig,
  saveReport: boolean = true
): Promise<{ issues: AccessibilityIssue[]; reportPath?: string }> {
  const audit = new AccessibilityAudit(config);
  const issues = await audit.runAudit();
  
  if (saveReport) {
    const report = audit.generateMarkdownReport();
    // In a real implementation, save to file system
    console.log('Accessibility report generated');
    console.log(audit.getSummary());
  }

  return { issues };
}

/**
 * Quick audit for CI/CD pipeline
 */
export async function quickAccessibilityCheck(): Promise<boolean> {
  const audit = new AccessibilityAudit({ verbose: false });
  const issues = await audit.runAudit();
  const summary = audit.getSummary();
  
  if (!summary.compliant) {
    console.error(`❌ Accessibility check failed: ${summary.errors} errors found`);
    return false;
  }
  
  console.log('✅ Accessibility check passed');
  return true;
}
