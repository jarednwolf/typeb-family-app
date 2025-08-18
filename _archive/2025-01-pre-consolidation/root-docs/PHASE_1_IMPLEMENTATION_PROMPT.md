# Phase 1 Implementation Prompt for TypeB Family App

## Context
Phase 0 (Foundations & Guardrails) has been successfully completed with:
- Firebase Remote Config and Feature Flags Service implemented
- Cloud Functions for atomic operations (task approval, reward redemption) deployed
- Thumbnail generation pipeline active
- Analytics Dashboard Service configured
- Firestore Security Rules with denormalized counters in place

## Your Task
I need to implement Phase 1 (Landing Page & Conversion) for the TypeB Family App. Please follow the implementation requirements below and complete these tasks in order:

### 1. **Create Landing Page with Hero Section**
   - Create the landing page at apps/web/src/app/page.tsx
   - Implement hero section with value proposition: "Turn Chores into Adventures"
   - Add CTA buttons: "Start Free Trial" and "Watch Demo"
   - Include trust indicators (security badges, testimonials)
   - Use feature flag `enableNewHeroSection` for A/B testing
   - Follow TypeB design system colors and typography

### 2. **Implement Demo Video Component**
   - Create DemoVideo component at apps/web/src/components/landing/DemoVideo.tsx
   - Embed 2-minute product demo video
   - Add play button overlay with TypeB brand colors
   - Track video engagement metrics (play, pause, completion)
   - Use feature flag `enableDemoVideo` for controlled rollout
   - Implement lazy loading for performance

### 3. **Build Testimonials Section**
   - Create Testimonials component at apps/web/src/components/landing/Testimonials.tsx
   - Display 3-5 parent testimonials with photos
   - Include child achievement stories
   - Add carousel functionality for mobile
   - Use feature flag `enableTestimonials`
   - Implement schema.org markup for SEO

### 4. **Create Email Capture Modal**
   - Create EmailCaptureModal at apps/web/src/components/modals/EmailCaptureModal.tsx
   - Trigger after 30 seconds or exit intent
   - Offer "Family Setup Guide" as lead magnet
   - Integrate with email service (SendGrid/Mailchimp)
   - Use feature flag `enableEmailCaptureModal`
   - Store leads in Firestore with timestamp

### 5. **Implement Conversion Tracking**
   - Set up Google Analytics 4 events
   - Track landing page interactions (scroll depth, CTA clicks)
   - Implement Facebook Pixel for retargeting
   - Create conversion funnel: Visit → Signup → Activation
   - Add UTM parameter tracking for campaigns
   - Create analytics dashboard view for conversion metrics

### 6. **Add Social Proof Elements**
   - Display "500+ Happy Families" counter
   - Show real-time activity feed (anonymized)
   - Add press mentions/logos if available
   - Include app store ratings (4.8+ stars)
   - Implement dynamic user count from Firestore

### 7. **Optimize for SEO and Performance**
   - Add meta tags and Open Graph data
   - Implement structured data for rich snippets
   - Optimize images with next/image
   - Add sitemap.xml and robots.txt
   - Implement lazy loading for below-fold content
   - Achieve 90+ Lighthouse score

## IMPORTANT TypeB Standards to Follow:
- **NO emojis** in code, comments, or documentation
- Use **TypeScript with strict typing** (no 'any' types)
- Always use **'parent'/'child'** for internal role representation
- Store dates as **ISO 8601 strings** in Redux/Firestore
- Include **comprehensive documentation** for all components
- Follow error handling patterns in development-standards.md
- Use the color palette and design system from design-system.md
- All text content should emphasize family bonding and positive reinforcement

## Design System Reference:
```typescript
// Primary Colors
const colors = {
  primary: '#4A90E2',      // Trustworthy Blue
  secondary: '#7ED321',    // Success Green
  accent: '#F5A623',       // Reward Gold
  danger: '#D0021B',       // Alert Red
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  }
};

// Typography
const typography = {
  fontFamily: 'Inter, system-ui, sans-serif',
  hero: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  heading: {
    fontSize: '32px',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  body: {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.6,
  }
};
```

## Expected Deliverables:
1. Fully functional landing page with all sections
2. A/B testing capability through feature flags
3. Complete analytics tracking implementation
4. SEO-optimized pages with 90+ Lighthouse scores
5. Email capture system with lead storage
6. Responsive design for all screen sizes
7. Documentation for all new components

## File Structure to Create:
```
apps/web/
├── src/
│   ├── app/
│   │   └── page.tsx                    # Updated landing page
│   ├── components/
│   │   ├── landing/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── DemoVideo.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── SocialProof.tsx
│   │   │   └── FeatureGrid.tsx
│   │   └── modals/
│   │       └── EmailCaptureModal.tsx
│   ├── services/
│   │   ├── analytics.ts                # Enhanced with conversion tracking
│   │   └── email.ts                    # New email service
│   └── hooks/
│       └── useConversionTracking.ts
├── public/
│   ├── sitemap.xml
│   └── robots.txt
└── next.config.ts                      # Updated with optimizations
```

## Testing Requirements:
- Test all feature flags work correctly
- Verify analytics events fire properly
- Ensure email capture stores data correctly
- Test responsive design on multiple devices
- Validate SEO implementation with tools
- Check performance metrics meet targets

Start with Task 1 and proceed sequentially. Confirm each task completion before moving to the next. Use the existing Phase 0 infrastructure (feature flags, analytics service) where applicable.