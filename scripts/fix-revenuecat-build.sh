#!/bin/bash

# Fix RevenueCat SubscriptionPeriod ambiguity for iOS 18 SDK
# This script runs during EAS build to patch the problematic file

echo "🔧 Fixing RevenueCat SubscriptionPeriod ambiguity..."

# Find the PurchasesHybridCommon directory
HYBRID_DIR=$(find . -path "*/PurchasesHybridCommon/PurchasesHybridCommon" -type d 2>/dev/null | head -1)

if [ -z "$HYBRID_DIR" ]; then
    echo "⚠️  PurchasesHybridCommon directory not found, skipping fix"
    exit 0
fi

# Fix StoreProduct+HybridAdditions.swift
STORE_PRODUCT_FILE="$HYBRID_DIR/StoreProduct+HybridAdditions.swift"

if [ -f "$STORE_PRODUCT_FILE" ]; then
    echo "📝 Patching $STORE_PRODUCT_FILE"
    
    # Add StoreKit import if not present
    if ! grep -q "import StoreKit" "$STORE_PRODUCT_FILE"; then
        sed -i '' '1a\
import StoreKit' "$STORE_PRODUCT_FILE"
    fi
    
    # Replace ambiguous SubscriptionPeriod references
    sed -i '' 's/subscriptionPeriodUnit: SubscriptionPeriod\.Unit/subscriptionPeriodUnit: RevenueCat.SubscriptionPeriod.Unit/g' "$STORE_PRODUCT_FILE"
    
    echo "✅ StoreProduct+HybridAdditions.swift patched"
else
    echo "⚠️  StoreProduct+HybridAdditions.swift not found"
fi

# Fix any other files with similar issues
for swift_file in "$HYBRID_DIR"/*.swift; do
    if [ -f "$swift_file" ]; then
        # Check if file contains ambiguous SubscriptionPeriod
        if grep -q "SubscriptionPeriod\." "$swift_file" && ! grep -q "RevenueCat\.SubscriptionPeriod" "$swift_file"; then
            echo "📝 Fixing ambiguity in $(basename "$swift_file")"
            
            # Add StoreKit import if needed
            if ! grep -q "import StoreKit" "$swift_file"; then
                sed -i '' '1a\
import StoreKit' "$swift_file"
            fi
            
            # Disambiguate SubscriptionPeriod references
            sed -i '' 's/\([^.]\)SubscriptionPeriod\./\1RevenueCat.SubscriptionPeriod./g' "$swift_file"
        fi
    fi
done

echo "✅ RevenueCat fix complete"