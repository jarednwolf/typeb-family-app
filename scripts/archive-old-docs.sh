#!/bin/bash

# Archive old documentation files
# This script moves outdated docs to an archive folder

ARCHIVE_DIR="_archive/2025-01-pre-consolidation"
echo "📦 Archiving old documentation files..."

# Create archive directory
mkdir -p "$ARCHIVE_DIR"
mkdir -p "$ARCHIVE_DIR/typeb-app-docs"
mkdir -p "$ARCHIVE_DIR/root-docs"

# Archive old root-level docs (keeping only the new consolidated ones)
OLD_ROOT_DOCS=(
    "PROJECT_OVERVIEW.md"
    "ENGAGEMENT_ROADMAP.md"
    "DEPLOYMENT.md"
    "DOMAIN-SETUP.md"
    "DEPLOYMENT-SECURITY-PROMPT.md"
    "GIT-SETUP.md"
    "PUSH-TO-GITHUB.md"
    "MASTER-CONTEXT.md"
    "PHASE_1_IMPLEMENTATION_PROMPT.md"
    "PHASE_0_IMPLEMENTATION_SCRIPT.md"
    "NEXT_STEPS_SUMMARY.md"
    "IMPLEMENTATION_PLAN.md"
    "PRODUCT_ROADMAP.md"
    "MASTER-TRACKER.md"
    "RELEASE-NOTES-v1.0.1.md"
    "RELEASE-NOTES-v1.0.0-FINAL.md"
)

for doc in "${OLD_ROOT_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  Moving $doc"
        mv "$doc" "$ARCHIVE_DIR/root-docs/"
    fi
done

# Archive old typeb-family-app docs (keeping only critical operational ones)
OLD_APP_DOCS=(
    "typeb-family-app/docs/WEEK*.md"
    "typeb-family-app/docs/PR-SUMMARY*.md"
    "typeb-family-app/docs/PERFORMANCE-METRICS*.md"
    "typeb-family-app/docs/UI-UX*.md"
    "typeb-family-app/docs/ENGAGEMENT*.md"
    "typeb-family-app/docs/PHASE_0*.md"
    "typeb-family-app/docs/MASTER-TRACKER.md"
    "typeb-family-app/docs/DESIGN-SYSTEM.md"
    "typeb-family-app/docs/ACCESSIBILITY-TEST-PLAN.md"
    "typeb-family-app/docs/SESSION-SUMMARY*.md"
    "typeb-family-app/docs/CLEANUP-GUIDE.md"
    "typeb-family-app/docs/NEXT-STEPS-CONTEXT-PROMPT.md"
    "typeb-family-app/docs/IMPORTANT-FILES-GUIDE.md"
    "typeb-family-app/docs/PROJECT-STATUS*.md"
    "typeb-family-app/docs/TESTFLIGHT-BETA-DESCRIPTION.md"
    "typeb-family-app/APPLE-DEVELOPER-CHECKLIST.md"
    "typeb-family-app/TESTFLIGHT*.md"
    "typeb-family-app/PRODUCTION-SETUP-GUIDE.md"
    "typeb-family-app/README-GO-LIVE.md"
    "typeb-family-app/GO-LIVE-INSTRUCTIONS.md"
    "typeb-family-app/IOS-LAUNCH-PRIORITY.md"
    "typeb-family-app/NEXT-SESSION-PROMPT.md"
    "typeb-family-app/CURRENT-STATUS-AND-NEXT-STEPS.md"
    "typeb-family-app/FIX-XCODE-VERSION.md"
    "typeb-family-app/RELEASE-NOTES*.md"
)

for pattern in "${OLD_APP_DOCS[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            echo "  Moving $file"
            mv "$file" "$ARCHIVE_DIR/typeb-app-docs/"
        fi
    done
done

# Archive duplicate/old docs from docs/ folder
OLD_DOCS_DIR=(
    "docs/APP-ICON-FIX-AND-BUILD-19.md"
    "docs/APP-STORE-REVIEW-CHECKLIST.md"
    "docs/COMPLETE-APP-STORE-SUBMISSION-STEPS.md"
    "docs/FIX-APP-NAME-CONFLICT.md"
    "docs/FIX-MISSING-METADATA.md"
    "docs/APP-STORE-SUBMISSION-GUIDE.md"
    "docs/APP-STORE-QUICK-REFERENCE.md"
    "docs/NEXT-PROMPT*.md"
    "docs/PRODUCTION-READINESS-NEXT-STEPS.md"
    "docs/PREMIUM-FEATURES*.md"
    "docs/PRODUCTION-READY-NEXT-STEPS.md"
    "docs/development-standards.md"
    "docs/design-system.md"
    "docs/firebase-setup-guide.md"
    "docs/ios-firebase-setup.md"
    "docs/ENGAGEMENT-PHASE2-PROMPT.md"
    "docs/cli-tools-setup.md"
)

for pattern in "${OLD_DOCS_DIR[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            echo "  Moving $file"
            mv "$file" "$ARCHIVE_DIR/root-docs/"
        fi
    done
done

# Archive the old duplicate README files (keeping only main ones)
if [ -f "typeb-family-app/docs/README.md" ]; then
    echo "  Moving typeb-family-app/docs/README.md"
    mv "typeb-family-app/docs/README.md" "$ARCHIVE_DIR/typeb-app-docs/"
fi

if [ -f "docs/README.md" ]; then
    echo "  Moving old docs/README.md"
    mv "docs/README.md" "$ARCHIVE_DIR/root-docs/"
fi

echo ""
echo "✅ Documentation cleanup complete!"
echo "📁 Old files archived to: $ARCHIVE_DIR"
echo ""
echo "Remaining structure:"
echo "  /README.md (main entry point)"
echo "  /typeb-family-app/README.md (mobile app specific)"
echo "  /apps/web/README.md (web app specific)"
echo "  /docs/ (consolidated canonical docs)"
echo ""
echo "📊 Stats:"
echo "  Files archived: $(find "$ARCHIVE_DIR" -type f | wc -l)"
echo "  Space saved: $(du -sh "$ARCHIVE_DIR" | cut -f1)"
