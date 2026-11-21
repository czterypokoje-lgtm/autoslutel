import Link from 'next/link';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { requireOfficeUser } from '@/lib/crmSession';
import { fetchAll } from '@/lib/kfcOrders';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { addContact, createAccount } from './actions';

export const dynamic = 'force-dynamic';

const path = '/admin/klanten/relaties';
const types = { person: 'Particulier', company: 'Bedrijf' };
const messages = {
  saved: 'Opgeslagen.',
  invalid: 'Controleer de naam, het type en het internationale telefoonnummer.',
  failed: 'Opslaan mislukt.',
  review: 'Dit telefoonnummer staat onder een andere naam of is inactief. Controleer het bestaande contact.',
} as const;
type Account = { id: string; company: string; phone: string | null; account_kind: keyof typeof types };
type Membership = { customer_id: string; contact_id: string; position: string; contacts: { phone_e164: string; display_name: string } };

export default async function Accounts({ searchParams }: { searchParams: Promise<{ q?: string; account?: string; status?: string }> }) {
  await requireOfficeUser(path);
  const params = await searchParams;
  const search = typeof params.q === 'string' ? params.q.trim().slice(0, 80) : '';
  const status = typeof params.status === 'string' && Object.hasOwn(messages, params.status) ? params.status as keyof typeof messages : null;
  const db = createSupabaseAdminClient();
  const [accounts, memberships] = await Promise.all([
    fetchAll<Account>((a, b) => db.from('kfc_customers').select('id, company, phone, account_kind')
      .not('account_kind', 'is', null).is('merged_into', null).is('anonymised_at', null).order('company').order('id').range(a, b)),
    fetchAll<Membership>((a, b) => db.from('kfc_customer_contacts').select('customer_id, contact_id, position, contacts!inner(phone_e164, display_name)')
      .eq('contacts.active', true).order('customer_id').order('contact_id').range(a, b) as unknown as PromiseLike<{ data: Membership[] | null; error: { message: string } | null }>),
  ]);
  const byAccount = new Map<string, Membership[]>();
  for (const member of memberships) {
    const current = byAccount.get(member.customer_id) ?? [];
    current.push(member);
    byAccount.set(member.customer_id, current);
  }
  const needle = search.toLowerCase();
  const phone = needle.replace(/[\s()-]/g, '').replace(/^00/, '+');
  const visible = accounts.filter((account) => !needle || account.company.toLowerCase().includes(needle) ||
    (phone && account.phone?.includes(phone)) || byAccount.get(account.id)?.some(({ contacts }) =>
      contacts.display_name.toLowerCase().includes(needle) || (phone && contacts.phone_e164.includes(phone))));
  const selected = accounts.find((account) => account.id === params.account);

  return <main className="mx-auto grid w-full max-w-6xl gap-5 pb-8">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-3xl font-semibold tracking-tight"><PreviewText>Klantaccounts en contactpersonen</PreviewText></h1>
      <Button asChild variant="outline"><Link href="/admin/klanten"><PreviewText>Klanten</PreviewText></Link></Button>
    </header>
    {status && <p role="status" className="rounded-lg border p-3 text-sm"><PreviewText>{messages[status]}</PreviewText></p>}
    <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader><CardTitle><PreviewText>Klantaccounts</PreviewText></CardTitle></CardHeader>
        <CardContent>
          <form className="mb-4 flex gap-2">
            <Input type="search" name="q" defaultValue={search} aria-label="Zoek op naam of telefoonnummer" maxLength={80} />
            <Button><PreviewText>Zoeken</PreviewText></Button>
          </form>
          {visible.length ? <ul className="divide-y">
            {visible.map((account) => <li key={account.id}>
              <Link aria-current={selected?.id === account.id ? 'true' : undefined} className="hover:bg-muted flex items-center justify-between gap-3 rounded-md px-2 py-3" href={path + '?' + new URLSearchParams({ account: account.id, ...(search && { q: search }) })}>
                <strong>{account.company}</strong><span className="text-muted-foreground text-sm"><PreviewText>{types[account.account_kind]}</PreviewText></span>
              </Link>
            </li>)}
          </ul> : <p className="text-muted-foreground text-sm"><PreviewText>Geen klantaccounts gevonden.</PreviewText></p>}
        </CardContent>
      </Card>
      <div className="grid content-start gap-5">
        {selected && <Card>
          <CardHeader><CardTitle>{selected.company}</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {selected.phone && <p>{selected.phone}</p>}
            {selected.account_kind === 'company' && <>
              <h2 className="font-medium"><PreviewText>Contactpersonen</PreviewText></h2>
              <ul className="divide-y">
                {(byAccount.get(selected.id) ?? []).map(({ contact_id, position, contacts }) => <li key={contact_id} className="py-2">
                  <div className="font-medium">{contacts.display_name} · {position}</div>
                  <span className="text-muted-foreground text-sm">{contacts.phone_e164}</span>
                </li>)}
              </ul>
              <form action={addContact.bind(null, selected.id)} className="grid gap-2">
                <label className="grid gap-1 text-sm"><PreviewText>Naam contactpersoon</PreviewText><Input name="name" required maxLength={120} /></label>
                <label className="grid gap-1 text-sm"><PreviewText>Telefoon internationaal</PreviewText><Input name="phone" type="tel" required placeholder="+31…" /></label>
                <label className="grid gap-1 text-sm"><PreviewText>Functie bij bedrijf</PreviewText><Input name="position" required maxLength={80} /></label>
                <Button><PreviewText>Contactpersoon koppelen</PreviewText></Button>
              </form>
            </>}
          </CardContent>
        </Card>}
        <Card>
          <CardHeader><CardTitle><PreviewText>Nieuw klantaccount</PreviewText></CardTitle></CardHeader>
          <CardContent><form action={createAccount} className="grid gap-2">
            <label className="grid gap-1 text-sm"><PreviewText>Type klantaccount</PreviewText><select name="kind" className="border-input bg-background h-9 rounded-md border px-2">
              <option value="person"><PreviewText>Particulier</PreviewText></option><option value="company"><PreviewText>Bedrijf</PreviewText></option>
            </select></label>
            <label className="grid gap-1 text-sm"><PreviewText>Naam</PreviewText><Input name="name" required maxLength={160} /></label>
            <label className="grid gap-1 text-sm"><PreviewText>Telefoon internationaal</PreviewText><Input name="phone" type="tel" placeholder="+31…" /></label>
            <Button><PreviewText>Klantaccount toevoegen</PreviewText></Button>
          </form></CardContent>
        </Card>
      </div>
    </div>
  </main>;
}
