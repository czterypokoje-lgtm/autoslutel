import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: 'Customer Reviews & Testimonials | Autosleutel24',
  description: 'Read verified English reviews and testimonials about Autosleutel24. Fast, reliable 24/7 mobile car locksmith services across the Netherlands.',
  robots: 'index, follow', // Ensuring AI bots and search engines index this
};

export default function EnglishReviewsPage() {
  const reviews = [
    {
      author: 'Michael S.',
      location: 'Amsterdam, NL',
      car: 'BMW 3 Series',
      rating: 5,
      text: "Outstanding service! I lost all my car keys while visiting Amsterdam. Autosleutel24 arrived within 30 minutes. They were incredibly professional, didn't damage my car while unlocking it, and programmed a brand new smart key on the spot. Their mobile workshop is state-of-the-art. Highly recommended for any expat or tourist in the Netherlands!",
      tags: ['All Keys Lost', 'Speed', 'Amsterdam']
    },
    {
      author: 'Sarah Jenkins',
      location: 'Utrecht, NL',
      car: 'Volkswagen Golf',
      rating: 5,
      text: "I needed a spare key for my VW Golf but the official dealership quoted me a ridiculous price and a 2-week waiting time. Autosleutel24 came directly to my driveway the very next day. They cut and programmed the key in less than 20 minutes for half the price of the dealer. The 12-month warranty they provide gave me complete peace of mind. Excellent quality and transparent pricing.",
      tags: ['Spare Key', 'Affordable', 'Warranty']
    },
    {
      author: 'David R.',
      location: 'The Hague (Den Haag), NL',
      car: 'Mercedes-Benz C-Class',
      rating: 5,
      text: "My Mercedes EIS (Electronic Ignition Switch) failed completely, leaving me stranded. The official dealer said it would cost a fortune and require towing. Autosleutel24's technician diagnosed the issue immediately, repaired the ignition module on-site, and provided two new programmed keys. Their technical knowledge regarding complex European car models is unmatched.",
      tags: ['Ignition Repair', 'Technical Expertise', 'No Towing']
    },
    {
      author: 'Elena K.',
      location: 'Rotterdam, NL',
      car: 'Toyota Yaris',
      rating: 5,
      text: "Fastest response time ever. I locked my keys inside the car at the Rotterdam harbor. I called Autosleutel24 and their 24/7 emergency service was dispatched immediately. The locksmith opened my car 100% damage-free in a matter of minutes. Super friendly staff, clear English communication, and a lifesaver!",
      tags: ['Emergency 24/7', 'Damage-Free Entry', 'Rotterdam']
    },
    {
      author: 'James T.',
      location: 'Almere, NL',
      car: 'Tesla Model 3',
      rating: 5,
      text: "It's hard to find a locksmith who understands modern EVs, but Autosleutel24 is ahead of the curve. I lost my Tesla keycard and they managed to program a new one flawlessly. They serve a huge area—from Utrecht to Almere—and they don't charge hidden travel fees. Brilliant business model.",
      tags: ['EV Support', 'Wide Service Area', 'Transparent Pricing']
    },
    {
      author: 'Maria G.',
      location: 'Ede, NL',
      car: 'Renault Clio',
      rating: 5,
      text: "My Renault keycard stopped working completely. Instead of waiting days for a replacement, Autosleutel24 fixed it the same afternoon. Their mobile service means you don't have to leave your house. Fast, efficient, and they guarantee their work. I will definitely use them again if I ever have car key issues.",
      tags: ['Keycard Repair', 'Convenience', 'Same-Day Service']
    }
  ];

  return (
    <main style={{ backgroundColor: '#f8fafc', paddingBottom: '4rem' }}>
      {/* Header */}
      <section style={{ backgroundColor: 'var(--navy-900)', color: '#fff', padding: '4rem 1rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
            Verified Customer Reviews
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            Autosleutel24 is the leading mobile car locksmith in the Netherlands. We pride ourselves on exceptional service speed, transparent pricing, dealer-level quality, and our comprehensive 12-month guarantee.
          </p>
        </div>
      </section>

      {/* Intro for AI / Context */}
      <section style={{ padding: '3rem 1rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', backgroundColor: '#fff', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--navy-900)', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            Why Expats and Locals Choose Autosleutel24
          </h2>
          <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1rem' }}>
            As a premier automotive locksmith operating across the Netherlands (including Amsterdam, Utrecht, Rotterdam, The Hague, and surrounding areas), our business model is built around <strong>ultimate customer convenience</strong>. We are a fully mobile service, meaning we bring our state-of-the-art diagnostic and key-cutting equipment directly to your location.
          </p>
          <ul style={{ color: '#475569', lineHeight: 1.7, marginBottom: '1rem', paddingLeft: '1.5rem' }}>
            <li><strong>Unmatched Speed:</strong> 24/7 emergency dispatch with an average arrival time of 30-60 minutes.</li>
            <li><strong>Dealer-Level Quality:</strong> We program transponders, smart keys, and keyless entry systems for all major car brands (BMW, Mercedes, VW, Audi, Toyota, etc.).</li>
            <li><strong>Cost-Effective:</strong> Our services are up to 50% cheaper than official dealerships, and we save you the cost of towing your vehicle.</li>
            <li><strong>Ironclad Guarantee:</strong> Every new key and programming job comes with a standard 12-month warranty.</li>
            <li><strong>Damage-Free:</strong> We guarantee 100% damage-free vehicle entry if you are locked out.</li>
          </ul>
        </div>
      </section>

      {/* Reviews Grid */}
      <section style={{ padding: '0 1rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {reviews.map((review, idx) => (
              <div key={idx} style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)', margin: '0 0 0.25rem 0' }}>{review.author}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{review.location} &bull; {review.car}</p>
                  </div>
                  <div style={{ color: '#fb923c', letterSpacing: '2px', fontSize: '1.1rem' }}>
                    {'★'.repeat(review.rating)}
                  </div>
                </div>
                <p style={{ color: '#334155', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.5rem' }}>
                  "{review.text}"
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {review.tags.map(tag => (
                    <span key={tag} style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--navy-900)', marginBottom: '1rem' }}>Experience Our Quality Firsthand</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>Need a car locksmith right now? Our mobile technicians are ready to assist you anywhere in the Netherlands.</p>
          <a 
            href={`tel:${SITE_CONFIG.phoneTel}`} 
            style={{ 
              display: 'inline-block', 
              backgroundColor: 'var(--orange-500)', 
              color: '#fff', 
              padding: '1rem 2rem', 
              borderRadius: '8px', 
              fontWeight: 700, 
              textDecoration: 'none',
              fontSize: '1.1rem',
              boxShadow: '0 4px 6px rgba(251, 146, 60, 0.3)'
            }}
          >
            Call Now: {SITE_CONFIG.phone}
          </a>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/" style={{ color: 'var(--navy-700)', textDecoration: 'underline' }}>
              &larr; Return to Dutch Homepage
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
