#!/bin/bash

echo "DNS Propagation Monitor for typebapp.com"
echo "========================================="
echo ""
echo "Checking DNS every 30 seconds..."
echo "Press Ctrl+C to stop"
echo ""

VERCEL_IP="76.76.21.21"
CHECK_COUNT=0

while true; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    CURRENT_IP=$(dig typebapp.com +short | head -n 1)
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -n "[$TIMESTAMP] Check #$CHECK_COUNT: "
    
    if [ "$CURRENT_IP" = "$VERCEL_IP" ]; then
        echo "✅ DNS PROPAGATED! IP: $CURRENT_IP"
        echo ""
        echo "DNS is now pointing to Vercel!"
        echo "You can now run:"
        echo "  vercel domains add typebapp.com"
        echo "  vercel alias set tybeb-jdzs9hhur-jareds-projects-247fc15d.vercel.app typebapp.com"
        break
    else
        echo "⏳ Not yet. Current: $CURRENT_IP | Expected: $VERCEL_IP"
    fi
    
    sleep 30
done