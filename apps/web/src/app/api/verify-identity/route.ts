import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use a mock key if none provided so it doesn't crash in dev before the user adds keys
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51MockSecretKeyForDevPurposeOnlyNoRealCharges123', {
  apiVersion: '2025-01-27.acacia',
});

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    // Create a SetupIntent instead of a PaymentIntent. 
    // SetupIntents verify and save a card without generating a charge.
    const setupIntent = await stripe.setupIntents.create({
      usage: 'off_session', // Optimized for verifying the card without immediately charging
      metadata: {
        signerName: name,
        purpose: 'Identity Verification for Private NDA'
      }
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Stripe SetupIntent Error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize identity verification' },
      { status: 500 }
    );
  }
}
