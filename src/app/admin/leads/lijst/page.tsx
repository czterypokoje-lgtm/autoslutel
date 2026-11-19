import LeadsListPage from '../LeadsListPage';

export const dynamic = 'force-dynamic';

/* KeyForCars: the full lead list with filters; the dashboard sits at /admin/leads. */
export default function Page(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <LeadsListPage {...props} base="/admin/leads/lijst" />;
}
