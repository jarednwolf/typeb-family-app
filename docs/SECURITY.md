# TypeB Security & Compliance

## COPPA Compliance (Children's Online Privacy Protection Act)

### Requirements for Children Under 13

#### Parental Consent
```javascript
// Required implementation
1. Verify parent email
2. Send consent request
3. Record consent timestamp
4. Allow consent withdrawal
5. No data collection before consent
```

#### Data Collection Limitations
- **Permitted**: First name, avatar, task completion
- **Prohibited**: Last name, address, phone, email
- **Photos**: Only task validation, auto-delete after 90 days
- **No third-party sharing** without explicit consent

#### Implementation Checklist
- [ ] Parent verification flow
- [ ] Consent management UI
- [ ] Data minimization audit
- [ ] Privacy policy update
- [ ] Disclosure requirements
- [ ] Right to deletion

### Privacy Policy Requirements

```markdown
## Children's Privacy (COPPA)

TypeB does not knowingly collect personal information from children under 13 without parental consent.

### Information We Collect from Children
- First name (for display)
- Avatar (optional)
- Task completion data
- Photos (task validation only)

### Parental Rights
- Review child's information
- Delete child's account
- Withdraw consent
- Refuse further collection

Contact: privacy@typebapp.com
```

## Data Protection

### Encryption
```javascript
// At Rest
- Firestore: AES-256-GCM
- Cloud Storage: AES-256
- Secrets: Google Secret Manager

// In Transit
- TLS 1.3 minimum
- Certificate pinning (mobile)
- HSTS headers (web)
```

### Data Retention
| Data Type | Retention | Deletion |
|-----------|-----------|----------|
| Task photos | 90 days | Automatic |
| User profiles | Account active + 30 days | Manual |
| Analytics | 365 days | Automatic |
| Audit logs | 180 days | Automatic |
| Backups | 30 days | Automatic |

## Authentication & Authorization

### Firebase Security Rules
```javascript
// Enforce authentication
allow read, write: if request.auth != null;

// Family isolation
allow read: if request.auth.uid in resource.data.memberIds;

// Parent-only operations
allow write: if request.auth.token.role == 'parent';

// Rate limiting
allow write: if request.time < resource.data.lastWrite + duration(1s);
```

### Password Requirements
- Minimum 8 characters
- Must include: uppercase, lowercase, number
- No common passwords (top 10,000 list)
- Force reset on breach detection

### Session Management
- JWT expiration: 1 hour
- Refresh token: 30 days
- Automatic logout: 7 days inactive
- Concurrent session limit: 5 devices

## API Security

### Input Validation
```javascript
// Sanitization example
const sanitizeInput = (input) => {
  return validator.escape(
    validator.trim(
      validator.stripLow(input)
    )
  );
};

// Schema validation
const taskSchema = {
  title: Joi.string().max(100).required(),
  description: Joi.string().max(500),
  points: Joi.number().min(0).max(1000),
  dueDate: Joi.date().min('now')
};
```

### Rate Limiting
```javascript
// Per-user limits
const limits = {
  'api/tasks': '100/hour',
  'api/photos': '20/hour',
  'api/auth': '10/hour',
  'api/payments': '5/hour'
};
```

### Error Handling
```javascript
// Never expose internal details
catch (error) {
  logger.error(error);
  return res.status(500).json({
    error: 'An error occurred',
    id: generateErrorId()
  });
}
```

## Payment Security (PCI Compliance)

### RevenueCat Integration
- **No credit card handling** - RevenueCat handles all PCI requirements
- **Webhook validation** - Verify signatures on all webhooks
- **Receipt validation** - Server-side validation only
- **Subscription state** - Single source of truth in RevenueCat

### Security Headers
```javascript
// Required headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

## Vulnerability Management

### Dependency Scanning
```bash
# Weekly automated scans
npm audit
pnpm audit
snyk test

# Update process
pnpm update --interactive
npm run test
git commit -m "chore: security updates"
```

### Security Testing
```bash
# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://typebapp.com

# Penetration testing (quarterly)
# Vendor: [Security Firm]
# Scope: API, Auth, Payments
```

## Incident Response Plan

### Classification
| Level | Type | Response |
|-------|------|----------|
| Critical | Data breach | Immediate |
| High | Auth bypass | 1 hour |
| Medium | XSS/CSRF | 4 hours |
| Low | Info disclosure | 24 hours |

### Response Steps
1. **Contain**: Isolate affected systems
2. **Assess**: Determine scope and impact
3. **Notify**: Legal, users (if required)
4. **Remediate**: Fix vulnerability
5. **Document**: Post-mortem report

### Breach Notification
- **Timeline**: Within 72 hours
- **Required Info**: What, when, impact, actions
- **Channels**: Email, in-app, website banner

## Access Control

### Production Access
```yaml
roles:
  admin:
    - Full Firebase console
    - Vercel admin
    - RevenueCat admin
  
  developer:
    - Firebase read-only
    - Vercel preview
    - Sentry access
  
  support:
    - Firebase support tools
    - RevenueCat read-only
```

### Key Management
```bash
# Rotation schedule
- API keys: 90 days
- Certificates: Annual
- Passwords: 60 days
- Service accounts: 180 days

# Storage
- Development: .env files (gitignored)
- Production: Google Secret Manager
- CI/CD: GitHub Secrets
```

## Compliance Checklist

### COPPA (Required)
- [ ] Privacy policy with COPPA section
- [ ] Parental consent mechanism
- [ ] Data deletion capability
- [ ] No behavioral advertising
- [ ] Limited data collection

### GDPR (Future)
- [ ] Explicit consent
- [ ] Right to be forgotten
- [ ] Data portability
- [ ] Privacy by design
- [ ] DPA with processors

### SOC 2 (Future)
- [ ] Security policies
- [ ] Access controls
- [ ] Change management
- [ ] Risk assessment
- [ ] Vendor management

## Security Contacts

### Internal
- **Security Lead**: security@typebapp.com
- **DPO**: privacy@typebapp.com
- **Incident Response**: incidents@typebapp.com

### External
- **Firebase Security**: https://firebase.google.com/support/contact/security
- **Vercel Security**: security@vercel.com
- **RevenueCat**: security@revenuecat.com

### Reporting Vulnerabilities
```
Email: security@typebapp.com
PGP Key: [Published on website]
Response: <24 hours
Bounty: Coming soon
```

---

**Last Updated**: January 2025  
**Next Review**: Quarterly  
**Compliance Officer**: [Name]
