import { getBrandLogo } from '@/lib/brandLogos';
import styles from './dashboard.module.css';

/** The car maker's logo in a small round tile, or its first letters when we have none. */
export default function BrandLogo({ make }: { make: string | null }) {
  const src = getBrandLogo(make);
  return (
    <span className={styles.logo} aria-hidden="true">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" />
      ) : (
        <span>{(make ?? '?').slice(0, 3).toUpperCase()}</span>
      )}
    </span>
  );
}
