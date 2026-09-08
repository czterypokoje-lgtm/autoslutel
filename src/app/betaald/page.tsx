import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Betaling ontvangen · Autosleutel24',
  robots: { index: false, follow: false },
};

/**
 * Where Mollie sends the customer after paying at the kerb.
 *
 * Deliberately says nothing about whether the payment succeeded. Mollie returns
 * the customer here whatever happened — cancelled, failed or paid — and only
 * the webhook knows which. Claiming success on this page would tell a customer
 * whose payment failed that they are done.
 */
export default function BetaaldPage() {
  return (
    <main
      style={{
        minHeight: '70vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '32rem' }}>
        <h1 style={{ fontSize: '1.6rem', margin: '0 0 .75rem' }}>Bedankt</h1>
        <p style={{ color: '#475569', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
          Uw betaling is verwerkt door uw bank. De monteur ziet het op zijn scherm zodra het
          bedrag binnen is — u hoeft niets meer te doen.
        </p>
        <Link href="/" style={{ color: '#c2410c' }}>
          Naar autosleutel24.nl
        </Link>
      </div>
    </main>
  );
}
