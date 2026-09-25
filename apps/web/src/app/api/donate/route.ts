import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { buildWorld } from '@/lib/shadowfield/world';
import { findPath } from '@/lib/shadowfield/model';

// Donations to TwinThink through Stripe Checkout. Card details go to Stripe,
// never to this site. Requires STRIPE_SECRET_KEY (sk_live_… or sk_test_…).

const key = process.env.STRIPE_SECRET_KEY;
const configured = Boolean(key && (key.startsWith('sk_live_') || key.startsWith('sk_test_')) && !key.includes('MockSecretKey'));
const stripe = configured ? new Stripe(key!, { apiVersion: '2026-08-26.dahlia' as Stripe.LatestApiVersion }) : null;

const MIN_CENTS = 100;
const MAX_CENTS = 100000;

/**
 * Support can be given toward one public Shadow. Its name comes from the
 * server's own record, never from the request, so a checkout can only ever
 * carry the name of a real idea on the Canvas.
 */
function publicShadow(id: unknown): { id: string; title: string; path: string[] } | null {
  if (typeof id !== 'string' || id.length > 200 || id.startsWith('local/')) return null;
  const path = findPath(buildWorld([]), id);
  if (!path) return null;
  const node = path[path.length - 1];
  return { id, title: node.title ?? 'an idea', path: path.slice(1).map((n) => n.id) };
}

export async function POST(req: Request) {
  let cents = 0;
  let shadowId: unknown = undefined;
  try {
    const body = (await req.json()) as { amount?: unknown; shadow?: unknown };
    cents = Math.round(Number(body.amount) * 100);
    shadowId = body.shadow;
  } catch {
    // fall through to validation
  }
  const shadow = shadowId === undefined ? null : publicShadow(shadowId);
  if (shadowId !== undefined && !shadow) {
    return NextResponse.json({ error: 'That idea is not on the Canvas.' }, { status: 404 });
  }
  if (!Number.isFinite(cents) || cents < MIN_CENTS || cents > MAX_CENTS) {
    return NextResponse.json({ error: 'Choose an amount between $1 and $1,000.' }, { status: 400 });
  }
  if (!stripe) {
    return NextResponse.json({ error: 'Donations are not switched on yet.' }, { status: 503 });
  }
  const origin = new URL(req.url).origin;
  const back = shadow
    ? `${origin}/canvas?supported=${encodeURIComponent(shadow.id)}#path=${shadow.path.map(encodeURIComponent).join('~')}`
    : `${origin}/support?thanks=1`;
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
            product_data: shadow
              ? { name: `Help “${shadow.title}” continue`, description: 'Given through TwinThink toward this idea.' }
              : { name: 'Support TwinThink', description: 'A gift toward keeping ideas alive.' },
          },
        },
      ],
      metadata: shadow ? { shadowId: shadow.id, shadowTitle: shadow.title } : { purpose: 'twinthink' },
      success_url: back,
      cancel_url: shadow ? `${origin}/canvas#path=${shadow.path.map(encodeURIComponent).join('~')}` : `${origin}/support`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('donation checkout failed', err);
    return NextResponse.json({ error: 'Could not start the donation. Please try again.' }, { status: 502 });
  }
}
