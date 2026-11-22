'use client';

import { STOCK_OPERATIONS } from '@/lib/keyforcarsStock';
import { usePreviewLanguage } from '../PreviewLanguage';
import styles from './keyforcars.module.css';

const descriptions: Record<keyof typeof STOCK_OPERATIONS, readonly [string, string]> = {
  count: ['Vervangt de geregistreerde voorraad op deze locatie door het werkelijk getelde aantal.', 'Replaces the recorded stock at this location with the quantity you actually counted.'],
  receive: ['Voegt binnengekomen artikelen toe aan de voorraad.', 'Adds received items to stock.'],
  issue: ['Boekt artikelen af voor intern gebruik, bijvoorbeeld in de werkplaats. Dit gebeurt handmatig en heeft geen vaste grens van 20 stuks.', 'Removes items for internal use, such as workshop use. It is recorded manually and has no fixed 20-unit threshold.'],
  sale: ['Boekt verkochte artikelen af. Voeg, indien beschikbaar, het bedrag en de bijbehorende factuur toe.', 'Removes sold items from stock. Add the sale amount and related invoice when available.'],
  return: ['Voegt teruggekomen artikelen weer toe aan de voorraad.', 'Adds returned items back to stock.'],
  transfer: ['Verplaatst artikelen tussen twee getelde locaties. De totale voorraad blijft gelijk.', 'Moves items between two counted locations. Total stock stays the same.'],
};

export default function StockHelp() {
  const { english, t } = usePreviewLanguage();
  return <details className={styles.stockHelp}>
    <summary aria-label={english ? 'How stock movements work' : 'Hoe voorraadbewegingen werken'}><span aria-hidden="true">?</span></summary>
    <dl>
      {Object.entries(STOCK_OPERATIONS).map(([key, label]) => <div key={key}>
        <dt>{t(label)}</dt><dd>{descriptions[key as keyof typeof descriptions][english ? 1 : 0]}</dd>
      </div>)}
      <div><dt>{t('Minimumvoorraad')}</dt><dd>{english ? 'The low-stock indicator uses the minimum set for each bin when counting. It does not create a stock movement.' : 'De melding voor lage voorraad gebruikt het ingestelde minimum per bak. Er wordt geen voorraadbeweging aangemaakt.'}</dd></div>
    </dl>
  </details>;
}
