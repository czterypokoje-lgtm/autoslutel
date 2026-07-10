import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: {
    absolute: 'Privacybeleid (AVG conform) | Autosleutel24',
  },
  description: `Privacybeleid van ${SITE_CONFIG.fullName}. GDPR/AVG conform.`,
  alternates: { canonical: `${SITE_CONFIG.domain}/privacybeleid` },
};

export default function PrivacyPage() {
  return (
    <main>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ color: '#fff' }}>Privacybeleid</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Laatste update: {new Date().toLocaleDateString('nl-NL')}</p>
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 2rem', maxWidth: 900 }}>
        {[
          { title: '1. Verantwoordelijke', content: `${SITE_CONFIG.fullName} is verantwoordelijk voor de verwerking van persoonsgegevens zoals beschreven in dit privacybeleid. KVK: ${SITE_CONFIG.kvk} | E-mail: ${SITE_CONFIG.email}` },
          { title: '2. Welke Gegevens Verzamelen Wij?', content: 'Wij verzamelen: naam, telefoonnummer, e-mailadres, kenteken/voertuigdata (voor dienstverlening), factuurgegevens. Wij verzamelen géén bijzondere persoonsgegevens.' },
          { title: '3. Waarom Verwerken Wij Uw Gegevens?', content: 'Uitvoering van de overeenkomst (dienstverlening), facturatie, wettelijke verplichtingen, en op uw verzoek voor garantieclaims.' },
          { title: '4. Hoe Lang Bewaren Wij Uw Gegevens?', content: 'Factuurgegevens: 7 jaar (wettelijke bewaarplicht). Overige klantgegevens: maximaal 2 jaar na laatste contact.' },
          { title: '5. Uw Rechten (AVG/GDPR)', content: 'U heeft het recht op inzage, correctie, verwijdering, bezwaar en dataportabiliteit. Neem contact op via ' + SITE_CONFIG.email },
          { title: '6. Cookies', content: 'Deze website gebruikt functionele cookies (noodzakelijk voor werking) en analytische cookies (Google Analytics 4, geanonimiseerd). U kunt cookies weigeren via uw browserinstellingen.' },
          { title: '7. Contact & Klachten', content: `Vragen? Mail naar ${SITE_CONFIG.email}. U kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).` },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>{section.title}</h2>
            <p style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>{section.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
