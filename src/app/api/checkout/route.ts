import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Prepare line items for Stripe Checkout
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

    // Create Checkout Session from body params.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['ideal', 'card' /*, 'bancontact' */],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/webshop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/webshop/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creating checkout session', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
