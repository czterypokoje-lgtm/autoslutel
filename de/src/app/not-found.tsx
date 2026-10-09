import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap prose">
        <h1>Seite nicht gefunden</h1>
        <p>
          Diese Adresse gibt es nicht. Vielleicht suchen Sie{' '}
          <Link href="/leistungen">unsere Leistungen</Link> oder{' '}
          <Link href="/staedte">die Städte</Link>, in denen ein Partner steht.
        </p>
      </div>
    </section>
  );
}
