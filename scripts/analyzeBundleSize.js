#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Analyzing Bundle Size...\n');
console.log('================================================\n');

// Configuration
const BUNDLE_SIZE_LIMITS = {
  ios: 50 * 1024 * 1024, // 50MB
  android: 50 * 1024 * 1024, // 50MB
  warning: 40 * 1024 * 1024 // 40MB warning threshold
};

// Color codes
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Run Metro bundler with bundle analysis
async function analyzeBundle() {
  const results = {
    ios: {},
    android: {},
    suggestions: []
  };
  
  console.log('Building production bundle...\n');
  
  try {
    // Build for iOS
    console.log('📱 Building iOS bundle...');
    try {
      execSync(
        'npx react-native bundle --platform ios --dev false --entry-file index.js ' +
        '--bundle-output ios-bundle.js --sourcemap-output ios-bundle.map',
        { stdio: 'pipe' }
      );
      
      const iosSize = fs.statSync('ios-bundle.js').size;
      results.ios = {
        size: iosSize,
        sizeInMB: (iosSize / 1024 / 1024).toFixed(2),
        status: getBundleStatus(iosSize)
      };
      
      console.log(`${results.ios.status.color}✓ iOS bundle: ${results.ios.sizeInMB} MB${colors.reset}\n`);
    } catch (error) {
      console.log(`${colors.red}✗ iOS bundle build failed${colors.reset}\n`);
      results.ios.error = error.message;
    }
    
    // Build for Android
    console.log('🤖 Building Android bundle...');
    try {
      execSync(
        'npx react-native bundle --platform android --dev false --entry-file index.js ' +
        '--bundle-output android-bundle.js --sourcemap-output android-bundle.map',
        { stdio: 'pipe' }
      );
      
      const androidSize = fs.statSync('android-bundle.js').size;
      results.android = {
        size: androidSize,
        sizeInMB: (androidSize / 1024 / 1024).toFixed(2),
        status: getBundleStatus(androidSize)
      };
      
      console.log(`${results.android.status.color}✓ Android bundle: ${results.android.sizeInMB} MB${colors.reset}\n`);
    } catch (error) {
      console.log(`${colors.red}✗ Android bundle build failed${colors.reset}\n`);
      results.android.error = error.message;
    }
    
    // Analyze with source-map-explorer if available
    if (fs.existsSync('ios-bundle.js') && fs.existsSync('ios-bundle.map')) {
      try {
        console.log('🔍 Analyzing bundle composition...\n');
        
        const output = execSync(
          'npx source-map-explorer ios-bundle.js ios-bundle.map --json',
          { stdio: 'pipe', encoding: 'utf8' }
        );
        
        const analysis = JSON.parse(output);
        const files = analysis.results[0].files;
        
        // Sort by size
        const sorted = Object.entries(files)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        console.log('📊 Top 10 Largest Dependencies:\n');
        console.log('--------------------------------');
        
        sorted.forEach(([file, size], index) => {
          const sizeInKB = (size / 1024).toFixed(2);
          const percentage = ((size / results.ios.size) * 100).toFixed(1);
          const barLength = Math.round(percentage / 2);
          const bar = '█'.repeat(barLength) + '░'.repeat(50 - barLength);
          
          console.log(`${index + 1}. ${file.substring(0, 50)}...`);
          console.log(`   ${bar} ${sizeInKB} KB (${percentage}%)\n`);
        });
        
        // Identify problematic dependencies
        checkForProblematicDependencies(files, results);
        
      } catch (e) {
        console.log(`${colors.yellow}⚠️  Install source-map-explorer for detailed analysis:${colors.reset}`);
        console.log('   npm install -g source-map-explorer\n');
      }
    }
    
    // Generate optimization suggestions
    generateOptimizationSuggestions(results);
    
    // Clean up temporary files
    cleanupTempFiles();
    
    // Generate report
    generateReport(results);
    
  } catch (error) {
    console.error(`${colors.red}Bundle analysis failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

function getBundleStatus(size) {
  if (size > BUNDLE_SIZE_LIMITS.ios) {
    return { color: colors.red, status: 'ERROR' };
  } else if (size > BUNDLE_SIZE_LIMITS.warning) {
    return { color: colors.yellow, status: 'WARNING' };
  }
  return { color: colors.green, status: 'OK' };
}

function checkForProblematicDependencies(files, results) {
  const problematic = {
    'moment': 'Consider using date-fns or dayjs instead',
    'lodash': 'Use lodash-es with tree shaking or native methods',
    'rxjs': 'Import only needed operators',
    'firebase': 'Import only required Firebase modules',
    '@sentry': 'Consider lazy loading Sentry',
    'react-native-reanimated': 'Check if all animations are necessary'
  };
  
  console.log('\n🔎 Checking for optimization opportunities...\n');
  
  Object.keys(files).forEach(file => {
    Object.keys(problematic).forEach(dep => {
      if (file.includes(dep)) {
        const size = (files[file] / 1024).toFixed(2);
        console.log(`${colors.yellow}⚠️  Found ${dep} (${size} KB): ${problematic[dep]}${colors.reset}`);
        results.suggestions.push({
          dependency: dep,
          size: size,
          suggestion: problematic[dep]
        });
      }
    });
  });
}

function generateOptimizationSuggestions(results) {
  console.log('\n💡 Optimization Suggestions:\n');
  console.log('================================\n');
  
  const suggestions = [];
  
  // Check bundle sizes
  if (results.ios.size > BUNDLE_SIZE_LIMITS.ios || results.android.size > BUNDLE_SIZE_LIMITS.android) {
    suggestions.push({
      priority: 'HIGH',
      action: 'Reduce bundle size',
      steps: [
        'Enable code splitting with dynamic imports',
        'Remove unused dependencies',
        'Use ProGuard/R8 for Android',
        'Enable Hermes for both platforms'
      ]
    });
  }
  
  // Platform-specific suggestions
  suggestions.push({
    priority: 'MEDIUM',
    action: 'Platform optimizations',
    steps: [
      'Enable Hermes on iOS (if not already enabled)',
      'Use .webp format for images',
      'Implement image lazy loading',
      'Consider using react-native-fast-image'
    ]
  });
  
  // Code optimization suggestions
  suggestions.push({
    priority: 'LOW',
    action: 'Code optimizations',
    steps: [
      'Remove console.log statements in production',
      'Minimize inline styles',
      'Use PureComponent or React.memo for expensive components',
      'Optimize re-renders with useMemo and useCallback'
    ]
  });
  
  suggestions.forEach(suggestion => {
    const priorityColor = 
      suggestion.priority === 'HIGH' ? colors.red :
      suggestion.priority === 'MEDIUM' ? colors.yellow :
      colors.green;
    
    console.log(`${priorityColor}[${suggestion.priority}]${colors.reset} ${suggestion.action}`);
    suggestion.steps.forEach(step => {
      console.log(`   ✓ ${step}`);
    });
    console.log('');
  });
  
  results.optimizationSuggestions = suggestions;
}

function cleanupTempFiles() {
  const filesToClean = [
    'ios-bundle.js',
    'ios-bundle.map',
    'android-bundle.js',
    'android-bundle.map'
  ];
  
  filesToClean.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
}

function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    ios: results.ios,
    android: results.android,
    suggestions: results.suggestions,
    optimizations: results.optimizationSuggestions
  };
  
  // Save JSON report
  fs.writeFileSync(
    'bundle-analysis-report.json',
    JSON.stringify(report, null, 2)
  );
  
  // Generate markdown report
  const markdown = `# Bundle Size Analysis Report

Generated: ${new Date().toLocaleString()}

## Bundle Sizes

| Platform | Size | Status |
|----------|------|--------|
| iOS | ${results.ios.sizeInMB || 'N/A'} MB | ${results.ios.status?.status || 'FAILED'} |
| Android | ${results.android.sizeInMB || 'N/A'} MB | ${results.android.status?.status || 'FAILED'} |

## Size Limits

- Maximum: 50 MB
- Warning Threshold: 40 MB

## Problematic Dependencies

${results.suggestions.length > 0 ? results.suggestions.map(s => 
  `- **${s.dependency}** (${s.size} KB): ${s.suggestion}`
).join('\n') : 'No problematic dependencies found.'}

## Optimization Recommendations

${results.optimizationSuggestions?.map(opt => 
  `### ${opt.priority} Priority: ${opt.action}\n${opt.steps.map(s => `- ${s}`).join('\n')}`
).join('\n\n') || 'No recommendations'}

## Next Steps

1. Review the bundle composition
2. Implement high-priority optimizations
3. Re-run analysis after changes
4. Target < 40MB for optimal performance

## Commands

\`\`\`bash
# Analyze bundle size
node scripts/analyzeBundleSize.js

# View detailed composition
npx source-map-explorer ios-bundle.js ios-bundle.map

# Enable Hermes (iOS)
# In ios/Podfile, ensure:
# :hermes_enabled => true

# Enable Hermes (Android)
# In android/app/build.gradle:
# hermesEnabled = true
\`\`\`
`;
  
  fs.writeFileSync('BUNDLE_ANALYSIS.md', markdown);
  
  console.log('\n📊 Reports generated:');
  console.log(`   ${colors.blue}• bundle-analysis-report.json${colors.reset}`);
  console.log(`   ${colors.blue}• BUNDLE_ANALYSIS.md${colors.reset}`);
  console.log('\n✅ Bundle analysis complete!\n');
}

// Check for required dependencies
function checkDependencies() {
  try {
    execSync('npx react-native --version', { stdio: 'pipe' });
  } catch (error) {
    console.error(`${colors.red}Error: React Native CLI not found${colors.reset}`);
    console.log('Please install: npm install -g react-native-cli');
    process.exit(1);
  }
}

// Main execution
checkDependencies();
analyzeBundle();
