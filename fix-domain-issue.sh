#!/bin/bash

echo "========================================="
echo "TypeB App Domain Configuration Fix"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Current Status:${NC}"
echo "✅ App is successfully deployed to Vercel"
echo "✅ Deployment URL works: https://tybeb-n0xtilm9w-jareds-projects-247fc15d.vercel.app"
echo "❌ Custom domain (typebapp.com) returns 404"
echo ""

echo -e "${YELLOW}Issue Diagnosis:${NC}"
echo "The domain 'typebapp.com' appears to be configured but not properly linked."
echo "This is likely due to one of the following:"
echo "1. Domain verification pending in Vercel"
echo "2. Domain assigned to a different project"
echo "3. DNS propagation still in progress"
echo ""

echo -e "${YELLOW}Steps to Fix:${NC}"
echo ""
echo -e "${GREEN}Option 1: Via Vercel Dashboard (Recommended)${NC}"
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select the 'tybeb_b' project"
echo "3. Go to Settings → Domains"
echo "4. If typebapp.com is listed:"
echo "   - Click on it and ensure it's properly configured"
echo "   - If there's a verification pending, complete it"
echo "5. If typebapp.com is NOT listed:"
echo "   - Click 'Add Domain'"
echo "   - Enter 'typebapp.com'"
echo "   - Follow the verification steps"
echo ""

echo -e "${GREEN}Option 2: Remove and Re-add Domain${NC}"
echo "If the domain is stuck, try removing and re-adding it:"
echo ""
echo "# First, check which project has the domain:"
echo "vercel domains ls --all"
echo ""
echo "# If found in wrong project, remove it:"
echo "vercel domains rm typebapp.com"
echo ""
echo "# Then add to correct project:"
echo "vercel domains add typebapp.com --project tybeb_b"
echo ""

echo -e "${GREEN}Option 3: Check DNS Configuration${NC}"
echo "Verify your DNS settings in Porkbun:"
echo ""
echo "Required DNS Records:"
echo "Type: A"
echo "Host: @"
echo "Value: 76.76.21.21"
echo ""
echo "Type: CNAME"
echo "Host: www"
echo "Value: cname.vercel-dns.com"
echo ""

echo -e "${YELLOW}Current DNS Status:${NC}"
echo "Checking DNS records..."
echo ""
echo "A Record for typebapp.com:"
nslookup typebapp.com | grep -A 1 "Name:"
echo ""
echo "CNAME Record for www.typebapp.com:"
nslookup www.typebapp.com | grep -A 1 "canonical name"
echo ""

echo -e "${YELLOW}Testing Deployment:${NC}"
echo ""
echo "Direct deployment URL status:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://tybeb-n0xtilm9w-jareds-projects-247fc15d.vercel.app
echo ""
echo "Custom domain status:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://typebapp.com
echo ""
echo "WWW subdomain status:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://www.typebapp.com
echo ""

echo -e "${YELLOW}Alternative Access:${NC}"
echo "While the domain issue is being resolved, you can access the app at:"
echo -e "${GREEN}https://tybebb.vercel.app${NC}"
echo "or"
echo -e "${GREEN}https://tybeb-n0xtilm9w-jareds-projects-247fc15d.vercel.app${NC}"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Log into Vercel Dashboard and check domain configuration"
echo "2. Ensure domain verification is complete"
echo "3. Wait 5-10 minutes for changes to propagate"
echo "4. If issue persists, contact Vercel support with project ID: prj_gVHKxnNgxbRzfa8ZIg9Qntzfk3Bl"
echo ""
echo "========================================="