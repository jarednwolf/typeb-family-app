#!/usr/bin/env node

/**
 * Script to identify and categorize `any` types in the TypeScript codebase
 * This helps prioritize which ones to fix first
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Categories of any usage
const categories = {
  errorHandling: [],
  functionParams: [],
  redux: [],
  firebase: [],
  navigation: [],
  eventHandlers: [],
  typeAssertions: [],
  other: []
};

// Patterns to identify different contexts
const patterns = {
  errorHandling: /catch\s*\([^)]*:\s*any\)/,
  functionParams: /\([^)]*:\s*any[^)]*\)\s*(:|=>)/,
  redux: /(dispatch|selector|state).*any/,
  firebase: /(firebase|firestore|auth).*any/,
  navigation: /navigation.*any/,
  eventHandlers: /(handle|on)[A-Z]\w*.*any/,
  typeAssertions: /as\s+any/
};

// Find all TypeScript files
const files = glob.sync('src/**/*.{ts,tsx}', {
  cwd: path.join(__dirname, '..'),
  absolute: true,
  ignore: ['**/node_modules/**', '**/__tests__/**', '**/types/errors.ts']
});

console.log(`Found ${files.length} TypeScript files to analyze\n`);

// Analyze each file
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(path.join(__dirname, '..'), file);
  
  lines.forEach((line, index) => {
    if (line.includes('any')) {
      const lineNumber = index + 1;
      const entry = {
        file: relativePath,
        line: lineNumber,
        code: line.trim()
      };
      
      // Categorize the any usage
      let categorized = false;
      for (const [category, pattern] of Object.entries(patterns)) {
        if (pattern.test(line)) {
          categories[category].push(entry);
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        categories.other.push(entry);
      }
    }
  });
});

// Generate report
console.log('='.repeat(80));
console.log('ANY TYPE USAGE REPORT');
console.log('='.repeat(80));
console.log();

// Summary
const totalAnys = Object.values(categories).reduce((sum, cat) => sum + cat.length, 0);
console.log(`Total 'any' usages found: ${totalAnys}`);
console.log();

// Detailed breakdown
Object.entries(categories).forEach(([category, entries]) => {
  if (entries.length > 0) {
    console.log(`\n${category.toUpperCase()} (${entries.length} occurrences)`);
    console.log('-'.repeat(40));
    
    // Show first 5 examples
    entries.slice(0, 5).forEach(entry => {
      console.log(`${entry.file}:${entry.line}`);
      console.log(`  ${entry.code}`);
    });
    
    if (entries.length > 5) {
      console.log(`  ... and ${entries.length - 5} more`);
    }
  }
});

// Recommendations
console.log('\n' + '='.repeat(80));
console.log('RECOMMENDATIONS');
console.log('='.repeat(80));
console.log();

console.log('Priority fixes (in order):');
console.log('1. Error handling - Replace with proper error types from src/types/errors.ts');
console.log('2. Function parameters - Add proper type definitions');
console.log('3. Redux/state management - Use proper Redux types');
console.log('4. Type assertions - Remove or replace with proper types');
console.log('5. Event handlers - Use proper React event types');
console.log();

// Generate fix suggestions
console.log('SUGGESTED FIXES:');
console.log('-'.repeat(40));
console.log();

console.log('1. For error handling:');
console.log('   Replace: } catch (error: any) {');
console.log('   With:    } catch (error) {');
console.log('            import { isAppError, getErrorMessage } from "@/types/errors";');
console.log();

console.log('2. For navigation:');
console.log('   Replace: const navigation = useNavigation<any>();');
console.log('   With:    import { NavigationProp } from "@react-navigation/native";');
console.log('            const navigation = useNavigation<NavigationProp<RootStackParamList>>();');
console.log();

console.log('3. For Redux dispatch:');
console.log('   Replace: dispatch(action as any)');
console.log('   With:    import { AppDispatch } from "@/store";');
console.log('            const dispatch = useAppDispatch();');
console.log();

console.log('4. For event handlers:');
console.log('   Replace: const handleChange = (e: any) => {');
console.log('   With:    const handleChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {');
console.log();

// Export detailed report
const reportPath = path.join(__dirname, 'any-types-report.json');
fs.writeFileSync(reportPath, JSON.stringify(categories, null, 2));
console.log(`\nDetailed report saved to: ${reportPath}`);