import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Donations to TwinThink through Stripe Checkout. Card details go to Stripe,
// never to this site. Requires STRIPE_SECRET_KEY (sk_live_… or sk_test_…).

const key = process.env.STRIPE_SECRET_KEY;
const configured = Boolean(key && (key.startsWith('sk_live_') || key.startsWith('sk_test_')) && !key.includes('MockSecretKey'));
const stripe = configured ? new Stripe(key!, { apiVersion: '2026-08-26.dahlia' as Stripe.LatestApiVersion }) : null;

const MIN_CENTS = 100;
const MAX_CENTS = 100000;

export async function POST(req: Request) {
  let cents = 0;
  try {
    const body = (await req.json()) as { amount?: unknown };
    cents = Math.round(Number(body.amount) * 100);
  } catch {
    // fall through to validation
  }
  if (!Number.isFinite(cents) || cents < MIN_CENTS || cents > MAX_CENTS) {
    return NextResponse.json({ error: 'Choose an amount between $1 and $1,000.' }, { status: 400 });
  }
  if (!stripe) {
    return NextResponse.json({ error: 'Donations are not switched on yet.' }, { status: 503 });
  }
  const origin = new URL(req.url).origin;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      submit_type: 'donate',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: cents,
            product_data: { name: 'Support TwinThink', description: 'A gift toward keeping ideas alive.' },
          },
        },
      ],
      success_url: `${origin}/support?thanks=1`,
      cancel_url: `${origin}/support`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('donation checkout failed', err);
    return NextResponse.json({ error: 'Could not start the donation. Please try again.' }, { status: 502 });
  }
}
