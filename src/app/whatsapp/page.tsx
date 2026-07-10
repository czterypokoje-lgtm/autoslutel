import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site.config';

const TARGET_WA_URL = `https://api.whatsapp.com/send/?phone=${SITE_CONFIG.whatsapp}&text=Hallo%2C%20ik%20heb%20hulp%20nodig%20met%20mijn%20autosleutel.%20Automerk%20en%20model%3A%20&type=phone_number&app_absent=0`;

export const metadata: Metadata = {
  title: 'Direct WhatsApp Contact | Autosleutel24',
  description: 'U wordt direct doorverwezen naar onze 24/7 WhatsApp spoedservice.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function WhatsAppRedirectPage() {
  return (
    <>
      <head>
        <meta httpEquiv="refresh" content={`0;url=${TARGET_WA_URL}`} />
      </head>
      <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', padding: '2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '420px', background: '#1e293b', padding: '2.5rem', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ width: '64px', height: '64px', background: '#25d366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
            💬
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', color: '#fff' }}>
            Verbinding maken met WhatsApp...
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            U wordt automatisch doorverwezen naar onze monteur op WhatsApp. Gaat dit niet automatisch?
          </p>
          <a
            href={TARGET_WA_URL}
            style={{
              display: 'inline-block',
              background: '#25d366',
              color: '#fff',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '1rem',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            Open WhatsApp Direct →
          </a>
          <script
            dangerouslySetInnerHTML={{
              __html: `window.location.replace(${JSON.stringify(TARGET_WA_URL)});`,
            }}
          />
        </div>
      </main>
    </>
  );
}
