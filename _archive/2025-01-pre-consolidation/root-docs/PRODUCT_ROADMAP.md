# TypeB Product Roadmap & Implementation Guide

## North-star & Guardrails

**North-star:** Weekly Active Families (WAF) completing ≥5 tasks with ≥2 active members.

**Up-funnel:** Visit → Signup conversion rate (marketing site + web app).

**Down-funnel:** DAU, DAU/WAU ("stickiness"), First Approval Time (child submit → parent approve), Week-2 retention.

## Instrumentation (Baseline for Every Phase)

### Events (Namespaced)
- `family_created`
- `member_invited`
- `member_joined`
- `task_template_created`
- `task_instance_created`
- `task_submitted`
- `task_approved`
- `task_rejected`
- `points_awarded`
- `reward_redeemed`
- `session_start`
- `onboarding_completed`
- `notification_sent`
- `notification_opened`

### Properties
- `familyId`
- `memberId`
- `role`
- `client` (web/mobile)
- `taskId`
- `templateId`
- `points`
- `dueDateTs`
- `latency_ms`
- `appVersion`

### Dashboards
- **Conversion:** Visit→signup
- **Activation:** First approval within 48h
- **Engagement:** DAU, DAU/WAU
- **Retention:** W2, W4

### Operations
- Feature flags/Remote Config
- BigQuery export
- Budget alerts for Firestore/Storage

> **Note:** If any of this isn't live yet, Phase 0 below makes it Day-1.

## Phase 0 — Foundations & Guardrails (Parallelizable, Start Now)

### Objectives
Ensure we can ship quickly, measure impact, and keep costs/safety in check.

### Deliverables
- [ ] Feature flags (Remote Config) + kill-switch for new flows
- [ ] Cloud Functions for atomic, server-side points awarding & redemptions (idempotent, transactional)
- [ ] Firestore Rules & App Check hardened (Auth + Firestore + Storage); Storage paths scoped per familyId
- [ ] Thumbnail pipeline for photos (store thumb + original; list views use thumbs)
- [ ] Event schema + dashboards (as above) shipped
- [ ] Denormalized counters: `families/{id}.pendingCount`, `members/{id}.completedThisWeek`

### Success Criteria
- P0 incidents route to dashboards/alerts
- p50 approval latency measurable
- Thumb images in all list UIs

## Phase 1 — Web "First Impression" Revamp (Conversion Lift)

### Objectives
- Make the landing/home page visually compelling, value-forward, and conversion-optimized
- Eliminate "wonky" styling so imagery and CTAs pop

### Deliverables

#### Hero that Sells the Outcome
- **Headline:** "Less nagging. More doing."
- **Sub:** "Assign chores with photo proof. Approve in a tap. Kids earn rewards."
- **Primary CTA:** Get Started Free (contrasting color, above the fold)
- **Secondary:** See how it works (anchors to demo)
- **Option A:** 20–30s silent demo video
- **Option B:** Interactive device mock with 3–4 step tour

#### Value Sections (3 tiles)
1. Assign & automate routines
2. Photo proof & instant approvals
3. Points → rewards kids love

Real product screenshots with brand-correct backgrounds and high contrast.

#### Social Proof & Trust
- 3 parent testimonials with avatars
- "Built with privacy in mind" snippet
- App store badges (when ready)

#### Styling Cleanup
- Semantic color tokens (primary, accent, surface, on-surface) + Tailwind theme
- Ensure AA contrast
- Consistent button variants (primary/secondary/text) and spacing/typography scale

#### Performance & SEO
- LCP < 2.5s, CLS < 0.1
- Preloaded hero assets
- OG/Twitter cards
- Sitemap & robots
- Accessible landmarks

### Experiments (Flagged)
- Demo video vs. static hero
- "Get Started"→ lightweight email capture modal vs. direct signup

### Success Metrics
- +30–50% relative lift in visit→signup conversion (baseline vs. A/B)
- Bounce rate down materially on first fold
- LCP target met

## Phase 2 — Activation: Onboarding to First Approval (TTV Reduction)

### Objectives
Get new families to "first approval" within 24–48 hours. This is the habit-forming moment.

### Deliverables

#### Guided Setup (Web)
- 3-step checklist: Create family → Invite child(ren) → Assign first task
- Starter templates (age-banded): 6–8, 9–11, 12+; morning/evening packs

#### Instant Join for Kids
- Parent shows a QR code; child scans to join the right family on mobile (deep link)
- Fallback: short join code

#### "Camera-first" Completion (Mobile)
- Task → Camera opens immediately → annotate/retake → submit
- (Use existing RN stack)

#### Parent Review Queue (Web & Mobile)
- Family-wide "Pending" inbox with photo zoom, quick Approve/Reject, bulk approve for routines
- Rejection reasons (short list + free text) → child sees actionable feedback

#### Digest Notifications
- Parents get 1–2 daily digests during set windows (Quiet Hours respected) with approve actions
- Kids get "You've got 1 task left today" nudges

### Success Metrics
- ≥70% of new families reach first approval ≤48h
- Median time-to-approval ↓ 40% from baseline

## Phase 3 — Automation & Personalization v1 (Habit Loop and DAU)

### Objectives
Reduce parent cognitive load; make daily use obvious and rewarding.

### Deliverables

#### Templates → Instances Engine
- `taskTemplates` with frequency, allowedDays, rotationMode (fixed/round-robin)
- Scheduled job creates 7 days of instances
- Human-readable schedule copy ("Every weekday at 7:30a")

#### "Today" Views
- **Kid Today:** overdue/due-soon grouping; big "Start" + camera; streak indicator (soft)
- **Parent Today:** pending approvals, today's scheduled tasks, low-effort assign

#### Personalized Nudges
- Behavior-based suggestions: "You assign 'Pack Lunch' most weeknights—add as a routine?"
- Quiet Hours + batching
- Server-driven targeting via flags

#### ICS Calendar Feeds (Read-only v1)
- Per family/child ICS endpoints from Next.js
- Subscribe in Google/Apple

### Success Metrics
- DAU/WAU ↑ to target band (define in dashboards)
- "Tasks completed/child/week" ↑
- % rejections stable or ↓

## Phase 4 — Rewards That Feel Real (Value Recognition)

### Objectives
Make points tangible and motivating without heavy ops overhead.

### Deliverables

#### Reward Catalog (Family)
- Parent-defined items (screen-time token, stay-up-late pass, choose dinner, $5 treat)
- Point costs + optional caps per week

#### Redemption Flow (Server-side Atomic)
- Kid requests → parent approves → points decrement + Reward Voucher artifact (ID, emoji, date)

#### Light Gamification (Opt-in)
- Streaks on routine templates
- 3–5 badges (e.g., "Zero rejections week")

### Success Metrics
- % families with ≥1 reward redeemed in first 14 days
- Daily submissions maintain/↑ after catalog launch

## Phase 5 — Personalization v2 & Lifecycle (Retention Lift)

### Objectives
Deepen relevance over time; keep families from churning after week 3–4.

### Deliverables

#### Smart Suggestions 2.0
- Time-of-day & weekday patterns
- "Recommended" routines during setup
- Per-child difficulty scaling

#### Weekly Family Recap
- Auto-generated summary: completions, approvals, streaks, shout-outs
- Sent to parent (email/push) and shown in-app

#### In-app Tips & Empty-state Coaching
- Contextual nudges when users stall (e.g., no tasks assigned in 3 days → "Try a 3-task morning pack")

### Success Metrics
- W2 and W4 retention ↑
- DAU/WAU stabilizes at target
- Drop-off post-day-10 reduced vs. baseline cohort

## Phase 6 — Monetization Fit: $5 Plan (After Value is Obvious)

### Objectives
Introduce pricing when core value is felt; keep free tier viable for trial.

### Deliverables

#### Plan Structure
- **Free:** up to 2 children, basic templates, basic notifications
- **Pro ($5/mo family):** unlimited children, routines/rotation, digest notifications, reward catalog, ICS, priority support

#### Paywall & Entitlements
- Soft walls with "trial" for Pro features
- Stripe on web (mobile stores later)
- In-product "what you get" comparison
- Upgrade CTA timed to success moments (e.g., after 5 approvals)

#### Billing Events & Support
- `plan_upgraded`, `plan_downgraded`, `billing_failed`
- Downgrade grace handling

### Success Metrics
- Trial→Paid conversion at target
- Churn within first billing cycle low
- No spike in support pings tied to paywall

## Phase 7 — Android Readiness (De-prioritized, Stabilize When Ready)

### Objectives
Parity with iOS core loop; leverage shared RN code.

### Deliverables
- Device testing matrix
- Push notification integration
- Permission flows
- Layout QA across densities
- Closed beta via Play Console
- Store listing assets reusing updated web messaging

### Success Metrics
- Crash-free sessions ≥ 99%
- Performance KPIs within budget
- Engagement parity with iOS cohort

## Cross-phase Technical Notes (Specific to Your Stack)

- **Monorepo:** Keep marketing site and app surfaces in `apps/web` with a design-system package (`@typeb/ui`) exporting Tailwind tokens + shared components for consistency
- **Server Authority:** All point mutations (approve, redeem) via Cloud Functions; client only proposes changes
- **Rules Tests:** In CI, cover "child cannot approve," "parent limited to family," Storage R/W invariants
- **Offline:** Enable Firestore persistence on mobile; queue photo uploads with retry/backoff; display "awaiting upload" state
- **Cost Control:** Prefer denormalized counts for badges; composite indexes for status + dueDate; list queries capped + paginated

## Initiative Table

| Priority | Initiative | Description | Platform | Primary Outcome |
|----------|-----------|-------------|----------|-----------------|
| P0 | Feature Flags & Metrics | Remote Config, events, dashboards, App Check, thumbnails | Shared | Reliability, Measurement |
| P0 | Landing Hero Revamp | New hero, CTA, demo, value tiles, social proof, SEO/perf | Web | Conversion |
| P0 | Styling System Cleanup | Color tokens, button variants, spacing/typography scale | Web | Conversion, UX Quality |
| P0 | Guided Onboarding | 3-step setup, starter templates, progress checklist | Web | Activation |
| P0 | Parent Review Queue | Pending inbox, bulk approve, reject reasons | Web/Mobile | Activation, DAU |
| P1 | Kid "Today" View | Camera-first completion, overdue/due-soon grouping | Mobile | DAU |
| P1 | Templates → Instances | Schedules, rotation, 7-day generator | Shared | DAU, Retention |
| P1 | Digest Notifications | Parent digests, kid nudges, Quiet Hours | Shared | DAU |
| P1 | ICS Feeds | Read-only subscription per family/child | Web/Shared | Retention |
| P1 | Reward Catalog & Vouchers | Define rewards, redemption flow, voucher artifact | Web/Mobile | DAU, Retention |
| P2 | Personalization v2 | Smart suggestions, weekly recap, coaching | Shared | Retention |
| P2 | Monetization ($5) | Plans, paywall, Stripe, entitlements | Web | Revenue |
| P3 | Android Readiness | QA matrix, push, permissions, closed beta | Mobile (Android) | Reach |

## Acceptance Criteria Examples

### Landing Hero Revamp
- LCP ≤ 2.5s on 75th percentile mobile
- AA color contrast
- Primary CTA above fold with ≥ 60% visibility
- A/B test: demo vs static. Winner shows ≥15% relative lift in visit→signup

### Guided Onboarding
- New families see checklist
- Completion events fire for each step
- ≥70% of new families create ≥1 task
- ≥50% invite ≥1 child within 24h

### Parent Review Queue
- Approve/reject latency (p50) < 2 minutes in first week usage
- Bulk approve updates points atomically and logs to auditLogs

### Templates → Instances
- Instances created 7 days ahead
- Humanized schedule strings
- Rotation verified across children

### Digest Notifications
- Quiet Hours honored
- Digests coalesce multiple events
- Deep link lands on Review Queue

### Reward Catalog
- Voucher doc includes voucherId, issuedAt, rewardRef
- Points decrement is atomic

### Monetization
- Entitlements gate features reliably
- Downgrade preserves data and re-locks correctly

## What to Start This Week

### Design Sprint (3–5 days)
- New hero, tile visuals, testimonial module
- Color tokens, button variants
- Kid/Parent "Today" wireflows

### Engineering
- Remote Config + event schema + dashboards
- Cloud Function: `approveTaskAndAwardPoints` (transactional, idempotent)
- Web hero (behind flag), tile section, testimonial module
- SEO/perf checklist

### Content
- Finalize hero copy, 3 value tiles, 3 parent quotes, privacy blurb, FAQs
- Starter template sets (age-banded, morning/evening packs)

### QA
- Color contrast audit
- LCP/CLS perf check on preview
- Accessibility pass on new components

---

## Current Implementation Status

### ✅ Already Implemented
- Basic Firebase setup (Auth, Firestore, Storage)
- Analytics service with comprehensive event tracking
- Family creation and member management
- Task creation, assignment, and completion
- Photo upload and validation
- Points system
- Push notifications (basic)
- Web deployment on Vercel
- Mobile app with React Native/Expo

### 🚧 Partially Implemented
- Analytics dashboards (events tracked but dashboards needed)
- Smart notifications (basic implementation exists)
- Task templates (basic recurring tasks exist)

### ❌ Not Yet Implemented
- Feature flags/Remote Config
- Cloud Functions for atomic operations
- Thumbnail pipeline
- Denormalized counters
- Landing page optimization
- QR code family joining
- Templates → Instances engine
- Reward catalog
- ICS calendar feeds
- Monetization/Stripe integration
- Weekly family recap
- A/B testing infrastructure

---

*Last Updated: August 16, 2025*