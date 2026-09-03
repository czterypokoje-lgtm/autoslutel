'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import styles from '../klanten/klanten.module.css';
import jobStyles from '../jobs/jobs.module.css';

export interface ProductRow {
  slug: string;
  title: string;
  category: string;
  audience: string;
  makes: string[];
  image: string | null;
  feedCost: number | null;
  feedPrice: number | null;
  published: boolean | null;
  priceOverride: number | null;
  costOverride: number | null;
  titleOverride: string | null;
  trackStock: boolean;
  stockQuantity: number;
  minQuantity: number;
  featured: boolean;
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export default function ProductTable({
  rows,
  page,
  pages,
}: {
  rows: ProductRow[];
  page: number;
  pages: number;
}) {
  if (rows.length === 0) {
    return (
      <div className={styles.wrap}>
        <p className={styles.empty}>Geen producten met deze filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Categorie</th>
              <th>Voor</th>
              <th style={{ textAlign: 'right' }}>Inkoop</th>
              <th style={{ textAlign: 'right' }}>Prijs</th>
              <th>Voorraad</th>
              <th>Zichtbaar</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const price = row.priceOverride ?? row.feedPrice;
              const hidden = row.published === false;
              const low = row.trackStock && row.stockQuantity <= row.minQuantity;

              return (
                <Fragment key={row.slug}>
                  <tr style={hidden ? { opacity: 0.55 } : undefined}>
                    <td>
                      <span className={styles.strong}>
                        {row.titleOverride ?? row.title}
                      </span>
                      <span className={styles.sub}>
                        {row.makes.join(', ') || 'geen merk'} · {row.slug}
                      </span>
                    </td>
                    <td>{row.category}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.no}`}>
                        {row.audience === 'trade' ? 'vakhandel' : 'publiek'}
                      </span>
                    </td>
                    <td className={styles.money}>
                      {row.costOverride !== null
                        ? MONEY.format(row.costOverride)
                        : row.feedCost !== null
                          ? MONEY.format(row.feedCost)
                          : '—'}
                    </td>
                    <td className={styles.money}>
                      {price !== null ? MONEY.format(price) : '—'}
                      {row.priceOverride !== null && (
                        <span className={styles.sub}>eigen prijs</span>
                      )}
                    </td>
                    <td>
                      {row.trackStock ? (
                        <span style={low ? { color: 'var(--crm-stop)', fontWeight: 700 } : undefined}>
                          {row.stockQuantity}
                          {low && ' · bijbestellen'}
                        </span>
                      ) : (
                        <span className={styles.sub}>niet bijgehouden</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${hidden ? styles.no : styles.ok}`}>
                        {hidden ? 'verborgen' : 'zichtbaar'}
                      </span>
                    </td>
                    <td>
                      <Link
                        className={jobStyles.navBtn}
                        href={`/admin/producten/${encodeURIComponent(row.slug)}`}
                      >
                        Bewerk
                      </Link>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className={styles.head} style={{ marginTop: 12, justifyContent: 'flex-end' }}>
          <span className={styles.count}>Pagina {page} van {pages}</span>
          {page > 1 && (
            <Link className={styles.link} href={`?p=${page - 1}`}>Vorige</Link>
          )}
          {page < pages && (
            <Link className={styles.link} href={`?p=${page + 1}`}>Volgende</Link>
          )}
        </div>
      )}
    </>
  );
}
