import styles from './HeroQuickFacts.module.css';

/*
 * Was jemand neben einem verschlossenen Auto sehen muss, bevor er scrollt.
 *
 * Auf der niederländischen Seite steht hier die Ankunftszeit zuerst. Hier steht
 * der Festpreis zuerst, und das ist die eine inhaltliche Änderung gegenüber
 * dem Original: deutsche Suchende prüfen bei einem Schlüsseldienst erst, ob am
 * Ende mehr verlangt wird, und eine Zeitangabe kann dieses Netz noch nicht
 * halten (siehe src/config/arrival.ts).
 *
 * Der Preis wird übergeben, weil jede Leistung ihren eigenen hat.
 */
export default function HeroQuickFacts({ price, tone = 'light' }: { price?: string; tone?: 'light' | 'dark' }) {
  return (
    <div className={`${styles.facts} ${tone === 'dark' ? styles.dark : ''}`}>
      <ul className={styles.list}>
        <li>
          <strong>Festpreis</strong> vorab am Telefon
        </li>
        {price ? (
          <li>
            <strong>{price}</strong>, inkl. MwSt.
          </li>
        ) : null}
        <li>24/7 erreichbar</li>
      </ul>
    </div>
  );
}
