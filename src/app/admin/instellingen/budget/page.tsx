import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { PreviewText } from '../../PreviewLanguage';

export const dynamic = 'force-dynamic';

export default async function BudgetPage() {
  const user = await requireCrmUser('/admin/instellingen/budget');
  if (user.role !== 'owner') notFound();

  const { data, error } = await createSupabaseAdminClient().from('kfc_spend_policy')
    .select('id,provider,agent,operation,billing_unit,enabled,daily_limit,monthly_limit,daily_count,max_seconds,max_concurrent')
    .order('provider').order('agent').order('operation');
  return <main className="grid gap-4">
    <header><h1 className="text-2xl font-semibold"><PreviewText>AI-budget</PreviewText></h1></header>
    <Card><CardHeader><CardTitle><PreviewText>Uitgavenstatus</PreviewText></CardTitle></CardHeader>
      <CardContent className="grid gap-2 text-sm">
        <p><PreviewText>In de demo zijn betaalde aanvragen via de CRM-server geblokkeerd.</PreviewText></p>
        <p><PreviewText>De reserveringen zijn nog niet gekoppeld aan live gebruik. Gebruik in externe dashboards of via een rechtstreeks telefoonnummer valt buiten dit overzicht.</PreviewText></p>
        <dl className="grid gap-1 sm:grid-cols-[max-content_1fr] sm:gap-x-6">
          <dt><PreviewText>Resterend budget</PreviewText></dt><dd><PreviewText>Nog niet beschikbaar</PreviewText></dd>
          <dt><PreviewText>Maximale kosten per aanvraag</PreviewText></dt><dd><PreviewText>Geen betaalde aanvraag toegestaan in de demo</PreviewText></dd>
        </dl>
      </CardContent>
    </Card>
    <Card><CardHeader><CardTitle><PreviewText>Ingestelde limieten</PreviewText></CardTitle></CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {error ? <p role="status"><PreviewText>De budgettabellen zijn niet beschikbaar.</PreviewText></p> :
          !data?.length ? <p><PreviewText>Er zijn nog geen limieten ingesteld.</PreviewText></p> :
            data.map((policy) => <section key={policy.id} className="grid gap-1 rounded-md border p-3">
              <h2 className="font-medium">{policy.provider} · {policy.agent} · {policy.operation}</h2>
              <p><PreviewText>{policy.enabled ? 'Limiet ingeschakeld' : 'Limiet uitgeschakeld'}</PreviewText></p>
              <p><PreviewText>Daglimiet</PreviewText> {Number(policy.daily_limit) / 1e6} {policy.billing_unit} · <PreviewText>Maandlimiet</PreviewText> {Number(policy.monthly_limit) / 1e6} {policy.billing_unit}</p>
            </section>)}
      </CardContent>
    </Card>
  </main>;
}
