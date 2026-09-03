import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../jobs.module.css';
import JobEditor, { type JobDetail } from './JobEditor';

export const dynamic = 'force-dynamic';

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOfficeUser(`/admin/jobs/${id}`);

  const supabase = await createSupabaseServerClient();

  const [{ data: job, error }, { data: technicians }] = await Promise.all([
    supabase
      .from('jobs')
      .select(
        'id, status, technician_id, scheduled_date, slot_start, slot_end, street, postcode, city, kenteken, service_type, quoted_price, final_price, notes, started_at, completed_at, lead_id, created_at'
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('technicians').select('id, name, active').order('name'),
  ]);

  if (error) {
    return (
      <div className={styles.warning}>
        De klus kon niet worden geladen: {error.message}
      </div>
    );
  }
  if (!job) notFound();

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Klus</h1>
        <span className={styles.count}>
          {job.scheduled_date} · {String(job.slot_start).slice(0, 5)}
        </span>
        <div className={styles.toolbar}>
          <Link className={styles.navBtn} href={`/admin/jobs?datum=${job.scheduled_date}`}>
            Terug naar agenda
          </Link>
          {job.lead_id && (
            <Link className={styles.navBtn} href={`/admin/leads?q=${job.kenteken ?? ''}`}>
              Bekijk lead
            </Link>
          )}
        </div>
      </div>

      <JobEditor
        job={job as unknown as JobDetail}
        technicians={
          ((technicians ?? []) as { id: string; name: string; active: boolean }[])
            .filter((t) => t.active)
        }
      />
    </>
  );
}
