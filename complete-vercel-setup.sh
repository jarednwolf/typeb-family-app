#!/bin/bash

echo "Vercel Domain Setup Automation"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

VERCEL_IP="76.76.21.21"
DEPLOYMENT_URL="tybeb-jdzs9hhur-jareds-projects-247fc15d.vercel.app"
DOMAIN="typebapp.com"

echo -e "${YELLOW}Step 1: Checking DNS configuration...${NC}"
CURRENT_IP=$(dig $DOMAIN +short | head -n 1)

if [ "$CURRENT_IP" != "$VERCEL_IP" ]; then
    echo -e "${RED}✗ DNS not configured correctly${NC}"
    echo "Current IP: $CURRENT_IP"
    echo "Expected IP: $VERCEL_IP"
    echo ""
    echo "Please configure DNS in Porkbun first:"
    echo "1. Go to https://porkbun.com"
    echo "2. Navigate to Domain Management → typebapp.com → DNS"
    echo "3. Delete existing A records"
    echo "4. Add A record: Host=(blank), Answer=76.76.21.21"
    echo "5. Add CNAME record: Host=www, Answer=cname.vercel-dns.com"
    echo ""
    echo "Then run this script again after 5-30 minutes."
    exit 1
fi

echo -e "${GREEN}✓ DNS is correctly configured!${NC}"
echo ""

echo -e "${YELLOW}Step 2: Adding domain to Vercel...${NC}"
vercel domains add $DOMAIN 2>/dev/null || echo "Domain might already be added"
echo ""

echo -e "${YELLOW}Step 3: Creating alias...${NC}"
vercel alias set $DEPLOYMENT_URL $DOMAIN
echo ""

echo -e "${YELLOW}Step 4: Adding www subdomain...${NC}"
vercel alias set $DEPLOYMENT_URL www.$DOMAIN
echo ""

echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Your app should now be accessible at:"
echo "  • https://typebapp.com"
echo "  • https://www.typebapp.com"
echo ""
echo "SSL certificates will be automatically provisioned by Vercel."
echo ""
echo -e "${YELLOW}Testing URLs:${NC}"
curl -I https://$DOMAIN 2>/dev/null | head -n 1