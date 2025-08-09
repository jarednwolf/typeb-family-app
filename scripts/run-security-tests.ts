#!/usr/bin/env ts-node

/**
 * Security Testing Runner Script
 * 
 * Executes comprehensive security penetration tests
 * and generates a detailed security report
 */

import SecurityPenetrationTester from '../src/security/penetration-tests';
import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function runSecurityTests() {
  console.log(`${colors.cyan}${colors.bright}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          TypeB Family App - Security Testing Suite         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  console.log(`\n${colors.yellow}⚠️  WARNING: This will run penetration tests against your Firebase instance.`);
  console.log(`Make sure you're running against a test environment!${colors.reset}\n`);
  
  // Check environment
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    console.log(`${colors.red}❌ Cannot run security tests in production environment!${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ Running in ${env} environment${colors.reset}\n`);
  
  try {
    // Initialize tester
    const tester = new SecurityPenetrationTester();
    
    // Run all tests
    console.log(`${colors.blue}Starting security tests...${colors.reset}\n`);
    const results = await tester.runAllTests();
    
    // Generate report file
    const reportPath = generateReportFile(results);
    console.log(`\n${colors.green}✓ Security report saved to: ${reportPath}${colors.reset}`);
    
    // Check for critical vulnerabilities
    const criticalCount = results.results.filter(
      r => !r.passed && r.severity === 'critical'
    ).length;
    
    if (criticalCount > 0) {
      console.log(`\n${colors.red}${colors.bright}⚠️  ${criticalCount} CRITICAL VULNERABILITIES FOUND!`);
      console.log(`Fix these issues before deploying to production!${colors.reset}`);
      process.exit(1);
    }
    
    // Calculate security score
    const total = results.results.length;
    const passed = results.results.filter(r => r.passed).length;
    const score = Math.round((passed / total) * 100);
    
    if (score < 80) {
      console.log(`\n${colors.yellow}⚠️  Security score is below 80% (${score}%). Consider fixing high-priority issues.${colors.reset}`);
    } else {
      console.log(`\n${colors.green}✓ Security score: ${score}%${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Error running security tests:`, error);
    console.error(colors.reset);
    process.exit(1);
  }
}

function generateReportFile(results: any): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportDir = path.join(process.cwd(), 'security-reports');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, `security-report-${timestamp}.json`);
  
  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    summary: {
      totalTests: results.results.length,
      passed: results.results.filter((r: any) => r.passed).length,
      failed: results.results.filter((r: any) => !r.passed).length,
      bySeverity: {
        critical: results.results.filter((r: any) => !r.passed && r.severity === 'critical').length,
        high: results.results.filter((r: any) => !r.passed && r.severity === 'high').length,
        medium: results.results.filter((r: any) => !r.passed && r.severity === 'medium').length,
        low: results.results.filter((r: any) => !r.passed && r.severity === 'low').length,
      }
    },
    results: results.results,
    duration: results.endTime 
      ? (new Date(results.endTime).getTime() - new Date(results.startTime).getTime()) / 1000
      : 0
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Also generate a markdown report
  const mdReportPath = reportPath.replace('.json', '.md');
  const mdContent = generateMarkdownReport(report);
  fs.writeFileSync(mdReportPath, mdContent);
  
  return mdReportPath;
}

function generateMarkdownReport(report: any): string {
  let md = '# Security Penetration Test Report\n\n';
  md += `**Date:** ${new Date(report.timestamp).toLocaleString()}\n`;
  md += `**Environment:** ${report.environment}\n`;
  md += `**Duration:** ${report.duration.toFixed(2)} seconds\n\n`;
  
  // Summary
  md += '## Summary\n\n';
  md += `- **Total Tests:** ${report.summary.totalTests}\n`;
  md += `- **Passed:** ${report.summary.passed} (${Math.round(report.summary.passed/report.summary.totalTests*100)}%)\n`;
  md += `- **Failed:** ${report.summary.failed} (${Math.round(report.summary.failed/report.summary.totalTests*100)}%)\n\n`;
  
  if (report.summary.failed > 0) {
    md += '### Failed Tests by Severity\n\n';
    if (report.summary.bySeverity.critical > 0) {
      md += `- 🔴 **Critical:** ${report.summary.bySeverity.critical}\n`;
    }
    if (report.summary.bySeverity.high > 0) {
      md += `- 🟠 **High:** ${report.summary.bySeverity.high}\n`;
    }
    if (report.summary.bySeverity.medium > 0) {
      md += `- 🟡 **Medium:** ${report.summary.bySeverity.medium}\n`;
    }
    if (report.summary.bySeverity.low > 0) {
      md += `- 🟢 **Low:** ${report.summary.bySeverity.low}\n`;
    }
    md += '\n';
  }
  
  // Security Score
  const score = Math.round(report.summary.passed / report.summary.totalTests * 100);
  let grade = 'F';
  if (score >= 95) grade = 'A+';
  else if (score >= 90) grade = 'A';
  else if (score >= 85) grade = 'B+';
  else if (score >= 80) grade = 'B';
  else if (score >= 75) grade = 'C+';
  else if (score >= 70) grade = 'C';
  else if (score >= 65) grade = 'D';
  
  md += `## Security Score: ${score}/100 (Grade: ${grade})\n\n`;
  
  // Test Results by Category
  const categories = [...new Set(report.results.map((r: any) => r.category))] as string[];
  
  md += '## Test Results by Category\n\n';
  
  categories.forEach((category) => {
    md += `### ${category}\n\n`;
    
    const categoryResults = report.results.filter((r: any) => r.category === category);
    
    categoryResults.forEach((result: any) => {
      const icon = result.passed ? '✅' : '❌';
      const severityBadge = getSeverityBadge(result.severity);
      
      md += `#### ${icon} ${result.testName} ${severityBadge}\n\n`;
      md += `**Details:** ${result.details}\n\n`;
      
      if (result.recommendation) {
        md += `**Recommendation:** ${result.recommendation}\n\n`;
      }
    });
  });
  
  // Failed Tests Details
  const failedTests = report.results.filter((r: any) => !r.passed);
  
  if (failedTests.length > 0) {
    md += '## Failed Tests Details\n\n';
    
    // Sort by severity
    failedTests.sort((a: any, b: any) => {
      const severityOrder: any = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    failedTests.forEach((result: any) => {
      const severityBadge = getSeverityBadge(result.severity);
      
      md += `### ${result.testName} ${severityBadge}\n\n`;
      md += `- **Category:** ${result.category}\n`;
      md += `- **Severity:** ${result.severity.toUpperCase()}\n`;
      md += `- **Details:** ${result.details}\n`;
      
      if (result.recommendation) {
        md += `- **Recommendation:** ${result.recommendation}\n`;
      }
      
      md += '\n';
    });
  }
  
  // Recommendations
  md += '## Recommendations\n\n';
  
  if (report.summary.bySeverity.critical > 0) {
    md += '### Critical Priority\n\n';
    md += '⚠️ **Fix all critical vulnerabilities before deployment!**\n\n';
    
    failedTests
      .filter((r: any) => r.severity === 'critical')
      .forEach((r: any) => {
        md += `- ${r.testName}: ${r.recommendation || 'Review and fix immediately'}\n`;
      });
    md += '\n';
  }
  
  if (report.summary.bySeverity.high > 0) {
    md += '### High Priority\n\n';
    failedTests
      .filter((r: any) => r.severity === 'high')
      .forEach((r: any) => {
        md += `- ${r.testName}: ${r.recommendation || 'Address before production'}\n`;
      });
    md += '\n';
  }
  
  // Next Steps
  md += '## Next Steps\n\n';
  md += '1. Review all failed tests, starting with critical severity\n';
  md += '2. Implement recommended fixes\n';
  md += '3. Re-run security tests after fixes\n';
  md += '4. Consider implementing additional security measures:\n';
  md += '   - Web Application Firewall (WAF)\n';
  md += '   - DDoS protection\n';
  md += '   - Security monitoring and alerting\n';
  md += '   - Regular security audits\n';
  md += '   - Dependency vulnerability scanning\n';
  
  return md;
}

function getSeverityBadge(severity: string): string {
  switch (severity) {
    case 'critical':
      return '`CRITICAL`';
    case 'high':
      return '`HIGH`';
    case 'medium':
      return '`MEDIUM`';
    case 'low':
      return '`LOW`';
    default:
      return '';
  }
}

// Run the tests
if (require.main === module) {
  runSecurityTests().catch(console.error);
}

export { runSecurityTests };