import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route for Email Lead Capture
 * 
 * Handles email lead submissions from the landing page modal.
 * In production, this would integrate with Firestore and email services.
 */

interface EmailLead {
  email: string;
  timestamp: string;
  source: 'exit_intent' | 'timed_trigger' | 'manual';
  leadMagnet: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailLead = await request.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!body.email || !emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Store the lead in Firestore
    // 2. Send the lead magnet email via SendGrid/Mailchimp
    // 3. Add to email marketing list
    // 4. Track conversion in analytics

    // For now, we'll just log and return success
    console.log('New email lead captured:', {
      email: body.email,
      source: body.source,
      leadMagnet: body.leadMagnet,
      timestamp: body.timestamp,
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(
      { 
        success: true,
        message: 'Lead captured successfully',
        leadId: `lead_${Date.now()}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error capturing lead:', error);
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}