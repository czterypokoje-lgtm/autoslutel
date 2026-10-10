import React from 'react';
import styles from './FaqSection.module.css';
import { SITE_CONFIG } from '@/config/site.config';

/*
 * Die Fragen, die eine Seite ohne eigene FAQ zeigt.
 *
 * Geschrieben gegen das, was in Deutschland auf der ersten Seite steht: ADAC,
 * AutoScout24, Allianz und R+V ranken für "Autoschlüssel nachmachen" und
 * schreiben, beim Schlüsseldienst gehe das bei modernen Schlüsseln nicht. Die
 * zweite Frage hier ist genau diese Frage, und sie ist die wichtigste auf der
 * Seite. Siehe ./keywords.ts.
 *
 * Keine Zahl, die nicht aus SITE_CONFIG kommt, und keine Ankunftszeit —
 * siehe src/config/arrival.ts, warum hier keine Minutenangabe steht.
 */
const defaultFaqs = [
  {
    question: 'Was muss ich tun, wenn ich meinen Autoschlüssel verloren habe?',
    answer: `Prüfen Sie zuerst, ob irgendwo noch ein Zweitschlüssel liegt — das ist immer der günstigste Weg. Wenn nicht, rufen Sie an${
      SITE_CONFIG.phone && SITE_CONFIG.phone !== '__TBD__' ? ` (${SITE_CONFIG.phone})` : ''
    }. Unser Partner kommt zu Ihrem Fahrzeug, öffnet es schadenfrei, fertigt einen neuen Schlüssel an und lernt ihn an der Wegfahrsperre an. Der verlorene Schlüssel wird dabei aus dem System gelöscht, damit er das Auto nicht mehr öffnet — und das Fahrzeug muss in der Regel nicht abgeschleppt werden.`
  },
  {
    question: 'Kann ein Schlüsseldienst moderne Autoschlüssel überhaupt nachmachen?',
    answer: 'Ein klassischer Schlüsseldienst nicht — wer nur Schlüssel fräst, kann die elektronische Wegfahrsperre nicht anlernen, und ohne das startet der Motor nicht. Genau deshalb schreiben ADAC und die Versicherer-Ratgeber, man müsse zum Hersteller. Der Unterschied ist die Fahrzeugdiagnose: unsere Partner lernen den Transponder mit denselben Geräten an, die eine Werkstatt benutzt. Bei einzelnen sehr neuen Systemen, die der Hersteller nur über eine Online-Freigabe zulässt, geht es tatsächlich nicht — und das sagen wir am Telefon, statt für eine Anfahrt zu berechnen.'
  },
  {
    question: 'Was kostet ein neuer Autoschlüssel?',
    answer: 'Sie hören den Festpreis für Ihr Fahrzeug am Telefon, bevor jemand losfährt, und er ändert sich vor Ort nicht. Was er ist, hängt von Marke, Modell, Baujahr und Schlüsselart ab. Zum Vergleich: Verbraucherberichte nennen für Herstellerersatz 200 bis 500 Euro, bei komplexeren Funkschlüsseln mehr, zuzüglich Abschleppen und drei bis fünf Werktagen Wartezeit. Alle unsere Beträge sind Bruttopreise inklusive 19 % MwSt.'
  },
  {
    question: 'Kann ein neuer Schlüssel angefertigt werden, wenn kein Original mehr da ist?',
    answer: 'Ja. Das ist der Fall "alle Schlüssel verloren": das Fahrzeug wird geöffnet, die Schlüsseldaten werden über die OBD-Schnittstelle aus dem Steuergerät gelesen, ein Rohling wird auf Ihr Schließsystem gefräst und an der Wegfahrsperre angelernt. Es dauert länger als ein Zweitschlüssel und kostet mehr, aber es geht — und zwar dort, wo das Auto steht.'
  },
  {
    question: 'Händler oder mobiler Dienst — was ist bei einem verlorenen Schlüssel besser?',
    answer: 'Der Händler verlangt, dass das Fahrzeug in die Werkstatt kommt, bestellt den Schlüssel auf Fahrgestellnummer und braucht meist drei bis fünf Werktage. Unser Partner kommt am selben Tag zu Ihrem Fahrzeug und lernt den Schlüssel vor Ort an. Was der Händler dafür mehr hat, ist der Zugang zu einzelnen Systemen mit Online-Freigabe — und genau da schicken wir Sie selbst zum Händler, statt es zu versuchen.'
  },
  {
    question: 'Welche Unterlagen brauche ich?',
    answer: 'Ihren Personalausweis oder Pass und die Zulassungsbescheinigung Teil I. Damit weisen Sie nach, dass das Fahrzeug Ihnen gehört. Ohne diesen Nachweis wird kein Schlüssel angefertigt — das ist der Grund, warum sich ein Dritter für Ihr Auto keinen Schlüssel machen lassen kann.'
  }
];

interface FaqSectionProps {
  customFaqs?: { question: string; answer: string }[];
  cityName?: string;
  brandName?: string;
  /** Canonical URL of the page this FAQ is rendered on, used to scope the JSON-LD @id. Defaults to the homepage. */
  pageUrl?: string;
}

export default function FaqSection({ customFaqs, cityName, brandName, pageUrl = SITE_CONFIG.domain }: FaqSectionProps = {}) {
  const displayFaqs = customFaqs && customFaqs.length > 0 ? customFaqs : defaultFaqs;
  // ── FAQPage schema — enables Google FAQ rich results ──
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faqpage`,
    mainEntity: displayFaqs.map((f, i) => ({
      '@type': 'Question',
      '@id': `${pageUrl}#faq-${i}`,
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  // ── Speakable schema — marks answers for voice search + AI Overview citations ──
  // Google, Perplexity, and AI assistants read speakable content aloud / cite it verbatim
  const speakableSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    speakable: {
      '@type': 'SpeakableSpecification',
      // CSS selectors pointing to the FAQ question+answer pairs
      cssSelector: displayFaqs.map((_, i) => `[data-speakable="faq-${i}"]`),
    },
  };

  return (
    <section className={styles.faqSection} id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableSchema) }}
      />
      <div className="container">
        <div className={styles.faqHeader}>
          <p className="section-eyebrow">HÄUFIGE FRAGEN</p>
          <h2 className="section-title">
            {cityName ? `Häufige Fragen aus ${cityName}` : brandName ? `Häufige Fragen zu ${brandName}-Autoschlüsseln` : 'Häufige Fragen zu Autoschlüsseln'}
          </h2>
          <p className="section-lead">
            {cityName
              ? `Die Fragen, die uns aus ${cityName} am häufigsten gestellt werden.`
              : brandName
                ? `Fragen zum Nachmachen oder Anlernen eines ${brandName}-Schlüssels — hier die häufigsten.`
                : 'Fragen zu Preisen, Dauer oder Reparaturen? Hier die Antworten, die wir am häufigsten geben.'}
          </p>
        </div>

        <div className={styles.faqList}>
          {displayFaqs.map((faq, index) => (
            <details
              key={index}
              className={styles.faqItem}
              name="home-faq"
              data-speakable={`faq-${index}`}
            >
              <summary className={styles.faqQuestion}>
                {faq.question}
                <span className={styles.faqIcon}></span>
              </summary>
              <div className={styles.faqAnswer}>
                <p>{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
