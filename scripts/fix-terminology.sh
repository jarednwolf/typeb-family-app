#!/bin/bash

# Script to help identify and fix manager/member terminology
# Should be replaced with parent/child according to data standards

echo "========================================"
echo "TypeB Family App - Terminology Fix"
echo "Finding manager/member references..."
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Count occurrences
MANAGER_COUNT=$(grep -r "\bmanager\b" --include="*.ts" --include="*.tsx" src/ | grep -v "node_modules" | wc -l)
MEMBER_COUNT=$(grep -r "\bmember\b" --include="*.ts" --include="*.tsx" src/ | grep -v "node_modules" | wc -l)

echo -e "${YELLOW}Found:${NC}"
echo -e "  'manager': ${RED}$MANAGER_COUNT${NC} occurrences"
echo -e "  'member': ${RED}$MEMBER_COUNT${NC} occurrences"
echo ""

# Detailed breakdown
echo -e "${YELLOW}Breakdown by context:${NC}"
echo ""

# Manager references (should be 'parent')
echo -e "${RED}MANAGER references (should be 'parent'):${NC}"
grep -r "\bmanager\b" --include="*.ts" --include="*.tsx" src/ | grep -v "node_modules" | head -10
echo ""

# Member references (context-dependent)
echo -e "${YELLOW}MEMBER references (check context):${NC}"
echo "Note: Some 'member' references are correct (e.g., memberIds, family members)"
echo "Only role references should change to 'child'"
echo ""

# Show specific patterns that need fixing
echo -e "${RED}Patterns that likely need fixing:${NC}"
echo ""

# Look for role-related member references
echo "1. Role comparisons with 'member':"
grep -r "role.*['\"]member['\"]" --include="*.ts" --include="*.tsx" src/ | grep -v "node_modules"
echo ""

echo "2. Member role assignments:"
grep -r "['\"]member['\"].*role" --include="*.ts" --include="*.tsx" src/ | grep -v "node_modules"
echo ""

echo "3. Manager role references:"
grep -r "manager" --include="*.ts" --include="*.tsx" src/ | grep -v "node_modules" | grep -i "role"
echo ""

# Generate sed commands for safe replacements
echo -e "${GREEN}Suggested sed commands for safe replacements:${NC}"
echo ""
echo "# Fix manager -> parent in role contexts"
echo "find src -name '*.ts' -o -name '*.tsx' | xargs sed -i '' 's/role.*manager/role === \"parent\"/g'"
echo ""
echo "# Fix member -> child in role contexts (be careful!)"
echo "find src -name '*.ts' -o -name '*.tsx' | xargs sed -i '' 's/role.*['\''\"]\?member['\''\"]\?/role === \"child\"/g'"
echo ""

# List files that need manual review
echo -e "${YELLOW}Files that need manual review:${NC}"
echo ""

# Files with manager references
echo "Files with 'manager':"
grep -l "\bmanager\b" --include="*.ts" --include="*.tsx" -r src/ | grep -v "node_modules"
echo ""

# Files with potentially problematic member references
echo "Files with role-related 'member' references:"
grep -l "role.*member\|member.*role" --include="*.ts" --include="*.tsx" -r src/ | grep -v "node_modules"
echo ""

# Summary
echo "========================================"
echo -e "${YELLOW}IMPORTANT NOTES:${NC}"
echo "1. 'manager' should always be replaced with 'parent'"
echo "2. 'member' should only be replaced with 'child' when referring to role"
echo "3. Keep 'member' in contexts like: memberIds, family members, etc."
echo "4. Always review changes before committing"
echo ""
echo "Run the suggested sed commands carefully and review all changes!"
echo "========================================"