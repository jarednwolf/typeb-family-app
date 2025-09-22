import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// RevenueCat webhook event types
enum WebhookEventType {
  INITIAL_PURCHASE = 'initial_purchase',
  RENEWAL = 'renewal',
  CANCELLATION = 'cancellation',
  UNCANCELLATION = 'uncancellation',
  NON_RENEWING_PURCHASE = 'non_renewing_purchase',
  SUBSCRIPTION_PAUSED = 'subscription_paused',
  EXPIRATION = 'expiration',
  BILLING_ISSUE = 'billing_issue',
  PRODUCT_CHANGE = 'product_change',
}

interface RevenueCatWebhookEvent {
  event: {
    type: WebhookEventType;
    id: string;
    app_user_id: string;
    product_id: string;
    entitlement_ids?: string[];
    period_type?: string;
    purchased_at_ms?: number;
    expiration_at_ms?: number;
    store?: string;
    environment?: string;
    is_trial_conversion?: boolean;
    currency?: string;
    price?: number;
  };
  api_version: string;
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Update user subscription in Firestore
 */
async function updateUserSubscription(
  userId: string,
  eventType: WebhookEventType,
  eventData: any
): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  const subscriptionRef = db.collection('subscriptions').doc(userId);

  const now = admin.firestore.FieldValue.serverTimestamp();
  
  switch (eventType) {
    case WebhookEventType.INITIAL_PURCHASE:
    case WebhookEventType.RENEWAL:
      // Update active subscription
      await subscriptionRef.set({
        userId,
        productId: eventData.product_id,
        status: 'active',
        purchasedAt: new Date(eventData.purchased_at_ms),
        expiresAt: eventData.expiration_at_ms 
          ? new Date(eventData.expiration_at_ms) 
          : null,
        isTrial: eventData.period_type === 'TRIAL',
        entitlements: eventData.entitlement_ids || [],
        store: eventData.store,
        environment: eventData.environment,
        lastUpdated: now,
      }, { merge: true });

      // Update user premium status
      await userRef.update({
        isPremium: true,
        premiumSince: eventData.purchased_at_ms 
          ? new Date(eventData.purchased_at_ms) 
          : now,
      });
      break;

    case WebhookEventType.CANCELLATION:
      // Mark subscription as cancelled (but still active until expiry)
      await subscriptionRef.update({
        status: 'cancelled',
        cancelledAt: now,
        willRenew: false,
        lastUpdated: now,
      });
      break;

    case WebhookEventType.UNCANCELLATION:
      // Reactivate subscription
      await subscriptionRef.update({
        status: 'active',
        cancelledAt: null,
        willRenew: true,
        lastUpdated: now,
      });
      break;

    case WebhookEventType.EXPIRATION:
      // Mark subscription as expired
      await subscriptionRef.update({
        status: 'expired',
        expiredAt: now,
        lastUpdated: now,
      });

      // Remove premium status from user
      await userRef.update({
        isPremium: false,
        premiumExpiredAt: now,
      });
      break;

    case WebhookEventType.BILLING_ISSUE:
      // Mark subscription as having billing issues
      await subscriptionRef.update({
        status: 'billing_issue',
        billingIssueDetectedAt: now,
        lastUpdated: now,
      });
      
      // Notify user about billing issue
      await db.collection('notifications').add({
        userId,
        type: 'billing_issue',
        title: 'Payment Issue',
        message: 'There was an issue with your payment. Please update your payment method.',
        createdAt: now,
        read: false,
      });
      break;

    case WebhookEventType.PRODUCT_CHANGE:
      // Update product information
      await subscriptionRef.update({
        productId: eventData.product_id,
        productChangedAt: now,
        lastUpdated: now,
      });
      break;

    case WebhookEventType.SUBSCRIPTION_PAUSED:
      // Mark subscription as paused
      await subscriptionRef.update({
        status: 'paused',
        pausedAt: now,
        lastUpdated: now,
      });
      
      // Temporarily remove premium status
      await userRef.update({
        isPremium: false,
        premiumPausedAt: now,
      });
      break;
  }

  // Log the event for auditing
  await db.collection('subscription_events').add({
    userId,
    eventType,
    eventData,
    processedAt: now,
  });
}

/**
 * Handle RevenueCat webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('RevenueCat webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Get signature from headers
    const signature = request.headers.get('X-RevenueCat-Signature');
    
    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const webhookData: RevenueCatWebhookEvent = JSON.parse(rawBody);
    
    console.log('Received RevenueCat webhook:', {
      type: webhookData.event.type,
      userId: webhookData.event.app_user_id,
      productId: webhookData.event.product_id,
    });

    // Process the webhook event
    await updateUserSubscription(
      webhookData.event.app_user_id,
      webhookData.event.type,
      webhookData.event
    );

    // Send success response
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error processing RevenueCat webhook:', error);
    
    // Log error for debugging
    await db.collection('webhook_errors').add({
      webhook: 'revenuecat',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Return error response
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle GET request (for webhook verification)
 */
export async function GET(request: NextRequest) {
  // RevenueCat may send a GET request to verify the endpoint
  return NextResponse.json(
    { 
      status: 'ok',
      message: 'RevenueCat webhook endpoint is active'
    },
    { status: 200 }
  );
}