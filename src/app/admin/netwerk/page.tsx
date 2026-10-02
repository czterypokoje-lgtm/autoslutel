import styles from './netwerk.module.css';

export const dynamic = 'force-dynamic';

export default function NetwerkIndex() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--crm-muted)' }}>
      Selecteer een kanaal om te beginnen.
    </div>
  );
}
