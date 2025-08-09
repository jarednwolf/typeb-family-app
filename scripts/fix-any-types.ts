#!/usr/bin/env ts-node

/**
 * Script to find and report all TypeScript `any` types in the codebase
 * Helps identify and fix type safety issues
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface AnyTypeLocation {
  file: string;
  line: number;
  column: number;
  context: string;
  category: 'explicit' | 'implicit' | 'cast' | 'error-handler' | 'test-mock';
}

interface FixSuggestion {
  location: AnyTypeLocation;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

class AnyTypeFinder {
  private locations: AnyTypeLocation[] = [];
  private srcDir: string;

  constructor(srcDir: string = 'src') {
    this.srcDir = srcDir;
  }

  /**
   * Find all TypeScript files
   */
  private findTypeScriptFiles(): string[] {
    const patterns = [
      `${this.srcDir}/**/*.ts`,
      `${this.srcDir}/**/*.tsx`,
    ];
    
    const files: string[] = [];
    patterns.forEach(pattern => {
      files.push(...glob.sync(pattern, { 
        ignore: [
          '**/node_modules/**',
          '**/build/**',
          '**/dist/**',
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.spec.ts',
          '**/*.spec.tsx',
        ]
      }));
    });
    
    return files;
  }

  /**
   * Analyze a file for any types
   */
  private analyzeFile(filePath: string): AnyTypeLocation[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const locations: AnyTypeLocation[] = [];

    // Patterns to find any types
    const patterns = [
      // Explicit any
      /:\s*any\b/g,
      /as\s+any\b/g,
      /<any>/g,
      
      // Function parameters without types (implicit any)
      /\(([\w\s,]+)\)\s*=>/g,
      /function\s+\w+\s*\(([\w\s,]+)\)/g,
      
      // Catch blocks with any
      /catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g,
      /catch\s*\(\s*(\w+)\s*\)/g, // Implicit any in catch
    ];

    lines.forEach((line, lineIndex) => {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const category = this.categorizeAny(line, match[0]);
          
          // Skip test mocks and legitimate uses
          if (category === 'test-mock' && filePath.includes('.test.')) {
            continue;
          }

          locations.push({
            file: filePath,
            line: lineIndex + 1,
            column: match.index + 1,
            context: line.trim(),
            category,
          });
        }
      });
    });

    return locations;
  }

  /**
   * Categorize the type of any usage
   */
  private categorizeAny(line: string, match: string): AnyTypeLocation['category'] {
    if (line.includes('as any')) return 'cast';
    if (line.includes('catch')) return 'error-handler';
    if (line.includes('mock') || line.includes('Mock')) return 'test-mock';
    if (match.includes(': any')) return 'explicit';
    return 'implicit';
  }

  /**
   * Generate fix suggestions
   */
  private generateSuggestions(location: AnyTypeLocation): FixSuggestion {
    let suggestion = '';
    let priority: FixSuggestion['priority'] = 'medium';

    switch (location.category) {
      case 'error-handler':
        suggestion = 'Replace with `unknown` and use type guards';
        priority = 'high';
        break;
      
      case 'cast':
        suggestion = 'Use proper type assertion or remove cast';
        priority = 'high';
        break;
      
      case 'explicit':
        if (location.context.includes('theme')) {
          suggestion = 'Import and use Theme type from theme.types.ts';
        } else if (location.context.includes('navigation')) {
          suggestion = 'Use proper navigation types from @react-navigation';
        } else if (location.context.includes('event')) {
          suggestion = 'Use proper event types from React Native';
        } else {
          suggestion = 'Define proper interface or type';
        }
        priority = 'high';
        break;
      
      case 'implicit':
        suggestion = 'Add explicit type annotation';
        priority = 'medium';
        break;
      
      default:
        suggestion = 'Review and add proper type';
        priority = 'low';
    }

    return { location, suggestion, priority };
  }

  /**
   * Run the analysis
   */
  public analyze(): void {
    console.log('🔍 Searching for TypeScript `any` types...\n');
    
    const files = this.findTypeScriptFiles();
    console.log(`Found ${files.length} TypeScript files to analyze\n`);

    files.forEach(file => {
      const fileLocations = this.analyzeFile(file);
      if (fileLocations.length > 0) {
        this.locations.push(...fileLocations);
      }
    });

    this.reportFindings();
  }

  /**
   * Report findings
   */
  private reportFindings(): void {
    if (this.locations.length === 0) {
      console.log('✅ No `any` types found! Your code is fully typed.');
      return;
    }

    console.log(`⚠️  Found ${this.locations.length} uses of \`any\` type\n`);

    // Group by category
    const byCategory = this.locations.reduce((acc, loc) => {
      if (!acc[loc.category]) acc[loc.category] = [];
      acc[loc.category].push(loc);
      return acc;
    }, {} as Record<string, AnyTypeLocation[]>);

    // Report by category
    Object.entries(byCategory).forEach(([category, locations]) => {
      console.log(`\n${this.getCategoryEmoji(category as any)} ${category.toUpperCase()} (${locations.length} occurrences)`);
      console.log('─'.repeat(60));
      
      // Show first 5 examples
      locations.slice(0, 5).forEach(loc => {
        const suggestion = this.generateSuggestions(loc);
        console.log(`📍 ${path.relative(process.cwd(), loc.file)}:${loc.line}:${loc.column}`);
        console.log(`   ${loc.context}`);
        console.log(`   💡 ${suggestion.suggestion}\n`);
      });
      
      if (locations.length > 5) {
        console.log(`   ... and ${locations.length - 5} more\n`);
      }
    });

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('─'.repeat(60));
    console.log(`Total any types: ${this.locations.length}`);
    console.log(`Files affected: ${new Set(this.locations.map(l => l.file)).size}`);
    
    const suggestions = this.locations.map(l => this.generateSuggestions(l));
    const highPriority = suggestions.filter(s => s.priority === 'high').length;
    const mediumPriority = suggestions.filter(s => s.priority === 'medium').length;
    const lowPriority = suggestions.filter(s => s.priority === 'low').length;
    
    console.log(`\nPriority breakdown:`);
    console.log(`  🔴 High: ${highPriority}`);
    console.log(`  🟡 Medium: ${mediumPriority}`);
    console.log(`  🟢 Low: ${lowPriority}`);

    // Generate fix file
    this.generateFixFile(suggestions);
  }

  /**
   * Generate a file with all fixes
   */
  private generateFixFile(suggestions: FixSuggestion[]): void {
    const fixFilePath = 'any-types-to-fix.md';
    
    let content = '# TypeScript `any` Types to Fix\n\n';
    content += `Generated on: ${new Date().toISOString()}\n\n`;
    content += `Total issues: ${suggestions.length}\n\n`;
    
    // Group by file
    const byFile = suggestions.reduce((acc, s) => {
      if (!acc[s.location.file]) acc[s.location.file] = [];
      acc[s.location.file].push(s);
      return acc;
    }, {} as Record<string, FixSuggestion[]>);
    
    Object.entries(byFile).forEach(([file, fileSuggestions]) => {
      content += `## ${path.relative(process.cwd(), file)}\n\n`;
      
      fileSuggestions.forEach(s => {
        const emoji = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🟢';
        content += `${emoji} **Line ${s.location.line}** - ${s.location.category}\n`;
        content += `\`\`\`typescript\n${s.location.context}\n\`\`\`\n`;
        content += `**Fix:** ${s.suggestion}\n\n`;
      });
    });
    
    fs.writeFileSync(fixFilePath, content);
    console.log(`\n📝 Detailed report saved to: ${fixFilePath}`);
  }

  /**
   * Get emoji for category
   */
  private getCategoryEmoji(category: AnyTypeLocation['category']): string {
    switch (category) {
      case 'explicit': return '🎯';
      case 'implicit': return '👻';
      case 'cast': return '🔄';
      case 'error-handler': return '⚠️';
      case 'test-mock': return '🧪';
      default: return '❓';
    }
  }
}

// Run the script
if (require.main === module) {
  const finder = new AnyTypeFinder();
  finder.analyze();
  
  console.log('\n✨ Analysis complete!');
  console.log('Next steps:');
  console.log('1. Review the any-types-to-fix.md file');
  console.log('2. Fix high priority issues first');
  console.log('3. Run `npm run type-check` to verify fixes');
  console.log('4. Commit changes with message: "fix: remove any types for better type safety"');
}

export default AnyTypeFinder;