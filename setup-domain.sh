#!/bin/bash

echo "TypeB App Domain Setup Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Current DNS Configuration:${NC}"
echo "Domain: typebapp.com"
echo "Current A Records:"
nslookup typebapp.com | grep Address | tail -n +2
echo ""

echo -e "${GREEN}Required DNS Changes in Porkbun:${NC}"
echo ""
echo "1. Log in to Porkbun (https://porkbun.com)"
echo "2. Go to Domain Management → typebapp.com → DNS"
echo "3. Delete all existing A and CNAME records"
echo "4. Add these records:"
echo ""
echo -e "${YELLOW}For typebapp.com (root domain):${NC}"
echo "   Type: A"
echo "   Host: (leave blank)"
echo "   Answer: 76.76.21.21"
echo "   TTL: 600"
echo ""
echo -e "${YELLOW}For www.typebapp.com:${NC}"
echo "   Type: CNAME"
echo "   Host: www"
echo "   Answer: cname.vercel-dns.com"
echo "   TTL: 600"
echo ""

echo -e "${GREEN}After DNS is configured, run these commands:${NC}"
echo ""
echo "# Wait for DNS propagation (5-30 minutes)"
echo "# Check DNS propagation:"
echo "dig typebapp.com +short"
echo ""
echo "# When it shows 76.76.21.21, continue with:"
echo "vercel domains add typebapp.com"
echo "vercel alias set tybeb-jdzs9hhur-jareds-projects-247fc15d.vercel.app typebapp.com"
echo ""

echo -e "${YELLOW}Checking if DNS has propagated...${NC}"
CURRENT_IP=$(dig typebapp.com +short | head -n 1)
VERCEL_IP="76.76.21.21"

if [ "$CURRENT_IP" = "$VERCEL_IP" ]; then
    echo -e "${GREEN}✓ DNS is correctly configured!${NC}"
    echo "You can now proceed with Vercel domain setup."
else
    echo -e "${RED}✗ DNS not yet configured or propagated.${NC}"
    echo "Current IP: $CURRENT_IP"
    echo "Expected IP: $VERCEL_IP"
    echo ""
    echo "Please configure DNS in Porkbun first, then wait 5-30 minutes for propagation."
fi