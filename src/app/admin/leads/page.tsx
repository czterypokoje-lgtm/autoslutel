import Link from 'next/link';
import { List } from 'lucide-react';
import { STUDIO_UI } from '@/config/install';
import { requireOfficeUser } from '@/lib/crmSession';
import { leadsDashboard } from '@/lib/kfcLeads';
import { Button } from '@/components/ui/button';
import LeadsListPage from './LeadsListPage';
import { OverviewCards } from './_components/overview-cards';
import { InsightCards } from './_components/insight-cards';
import { OperationalCards } from './_components/operational-cards';
import { RecentLeadsTable } from './_components/recent-leads-table';
import { PreviewText } from '../PreviewLanguage';

export const dynamic = 'force-dynamic';

export default async function LeadsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!STUDIO_UI) return <LeadsListPage {...props} />;

  // Studio UI: the CRM dashboard over the shared leads table; the list with filters lives one level down.
  await requireOfficeUser('/admin/leads');
  const data = await leadsDashboard();
  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Leads</PreviewText></h1>
          <p className="text-muted-foreground text-sm"><PreviewText>Aanvragen, offertes en verkoop van de afgelopen twaalf maanden.</PreviewText></p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/leads/lijst"><List data-icon="inline-start" /><PreviewText>Alle leads</PreviewText></Link>
        </Button>
      </div>
      <OverviewCards data={data} />
      <InsightCards data={data} />
      <OperationalCards data={data} />
      <RecentLeadsTable rows={data.recent} />
    </div>
  );
}
