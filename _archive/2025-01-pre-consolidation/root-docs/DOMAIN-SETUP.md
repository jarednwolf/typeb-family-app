# TypeB App Domain Configuration Guide

## DNS Configuration for Porkbun

To connect typebapp.com to your Vercel deployment, you need to configure the following DNS records in your Porkbun account:

### Option 1: Using Vercel's IP Addresses (Recommended)

Add these DNS records in Porkbun:

#### For typebapp.com (apex domain):
- **Type**: A
- **Host**: (leave blank or use @)
- **Answer**: 76.76.21.21
- **TTL**: 600

#### For www.typebapp.com:
- **Type**: CNAME
- **Host**: www
- **Answer**: cname.vercel-dns.com
- **TTL**: 600

### Option 2: Using CNAME for both (if Porkbun supports CNAME flattening)

#### For typebapp.com:
- **Type**: ALIAS or CNAME (if supported)
- **Host**: (leave blank or use @)
- **Answer**: cname.vercel-dns.com
- **TTL**: 600

#### For www.typebapp.com:
- **Type**: CNAME
- **Host**: www
- **Answer**: cname.vercel-dns.com
- **TTL**: 600

## Steps to Configure in Porkbun:

1. Log in to your Porkbun account
2. Go to Domain Management
3. Find typebapp.com and click "DNS"
4. Delete any existing A or CNAME records for @ and www
5. Add the records listed above
6. Save changes

## Verify Domain in Vercel:

After configuring DNS, run these commands:

```bash
# Add the domain to your Vercel project
vercel domains add typebapp.com

# Check domain status
vercel domains inspect typebapp.com

# Once DNS propagates (5-30 minutes), assign to deployment
vercel alias set tybeb-jdzs9hhur-jareds-projects-247fc15d.vercel.app typebapp.com
```

## Alternative: TXT Record Verification

If Vercel requires domain verification first, you may need to add a TXT record:

- **Type**: TXT
- **Host**: _vercel
- **Answer**: (Vercel will provide this value)
- **TTL**: 600

## DNS Propagation

DNS changes typically take:
- 5-30 minutes to start working
- Up to 48 hours for full global propagation

You can check DNS propagation at: https://www.whatsmydns.net/

## SSL Certificate

Vercel automatically provisions SSL certificates once the domain is verified and connected.

## Testing

Once configured, test these URLs:
- https://typebapp.com
- https://www.typebapp.com

Both should redirect to your Vercel deployment with HTTPS enabled.