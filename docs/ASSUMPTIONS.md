# TypeB Family App - Working Assumptions

**Document Status**: Living document, updated as assumptions are validated  
**Last Updated**: January 2025  

## Technical Assumptions

### Infrastructure
1. **Firebase Project**: Assuming `typeb-family-app` is the production project ID
2. **Firebase Quotas**: Free tier or Blaze plan can handle 1,000 concurrent users
3. **Vercel Deployment**: Current web deployment is production-ready
4. **Storage**: Firebase Storage has sufficient quota for photo uploads

### Development
1. **Node Version**: Team is using Node.js 18+ (per package.json)
2. **Package Manager**: pnpm is the standard (not npm/yarn)
3. **TypeScript**: Strict mode not required initially
4. **Monorepo**: Current structure should be preserved with minor restructuring

### Security
1. **API Keys**: Currently in development mode, need rotation for production
2. **Firebase Auth**: Sufficient for authentication (no need for Auth0/Cognito)
3. **Rate Limiting**: Firebase's built-in quotas are sufficient initially
4. **Secrets**: No customer PII in repository currently

## Business Assumptions

### Launch Strategy
1. **Soft Launch**: Start with limited user base (<100 families)
2. **Geography**: US-only, English language only
3. **Pricing**: $4.99/month and $39.99/year are final
4. **Free Tier**: Up to 5 family members remains free

### Users
1. **Target Audience**: Tech-savvy parents comfortable with apps
2. **Age Range**: Children 5-18 years old
3. **Family Size**: Average 4-5 members per family
4. **Device Usage**: Primarily iOS initially, Android secondary

### Compliance
1. **COPPA**: Parental consent via email is sufficient
2. **Data Retention**: 90-day retention for photos is acceptable
3. **Privacy Policy**: Can use template with modifications
4. **Terms of Service**: Standard SaaS terms acceptable

## Operational Assumptions

### Support
1. **Volume**: <50 support tickets in week 1
2. **Response Time**: 24 hours for free, 2 hours for premium
3. **Channels**: Email only initially (no chat/phone)
4. **Documentation**: In-app help sufficient initially

### Performance
1. **Response Time**: <500ms API responses acceptable
2. **Uptime**: 99.5% SLA acceptable for launch
3. **Photo Upload**: <5MB file size limit
4. **Concurrent Tasks**: <100 per family reasonable

### Monitoring
1. **Errors**: Sentry free tier sufficient initially
2. **Analytics**: Firebase Analytics meets needs
3. **Alerts**: Email notifications sufficient
4. **Logs**: Firebase logs retention acceptable

## Technical Debt Accepted

### For 1-Week Timeline
1. **Manual Processes**: Some deployment steps remain manual
2. **Test Coverage**: Current ~70% is acceptable
3. **Documentation**: Partial consolidation only
4. **Monitoring**: Basic error tracking only
5. **Android**: Delayed to post-launch
6. **Localization**: English-only
7. **Accessibility**: WCAG AA compliance deferred

### Post-Launch Priorities
1. Full CI/CD automation
2. Google SSO integration  
3. Android app development
4. Enhanced monitoring
5. Documentation completion
6. Load testing at scale

## Resource Assumptions

### Team
1. **Developers**: 1-2 people for launch week
2. **Testing**: Developer-led testing sufficient
3. **Support**: Founder handles initial support
4. **DevOps**: Developer manages deployment

### Budget
1. **Infrastructure**: <$500/month initially
2. **Third-party Services**: RevenueCat + Firebase only
3. **Monitoring**: Free tiers sufficient
4. **Marketing**: Not included in technical scope

## Risk Assumptions

### Acceptable Risks
1. **Scale**: Organic growth allows scaling gradually
2. **Security**: Firebase security sufficient for launch
3. **Performance**: Can optimize post-launch
4. **Features**: Current feature set meets MVP needs

### Unacceptable Risks
1. **Data Loss**: Must have backup strategy
2. **Payment Failures**: Must work 100%
3. **COPPA Violations**: Must be compliant
4. **Security Breaches**: Must protect user data

## Validation Requirements

These assumptions need validation before launch:

- [ ] Firebase project ID and configuration
- [ ] RevenueCat account and product IDs
- [ ] Apple Developer account status
- [ ] Vercel deployment configuration
- [ ] Firebase quotas and billing
- [ ] COPPA compliance requirements
- [ ] Photo storage costs at scale

## Decision Log

| Date | Assumption | Validation | Decision |
|------|------------|------------|----------|
| Jan 2025 | 1-week timeline feasible | Assessed risks | Proceeding with critical path only |
| Jan 2025 | Staging environment exists | Needs verification | Configure in sprint |
| Jan 2025 | RevenueCat ready | Needs API keys | Add to Day 1 tasks |

---

**Note**: This document will be updated as assumptions are validated or changed during the production sprint.
