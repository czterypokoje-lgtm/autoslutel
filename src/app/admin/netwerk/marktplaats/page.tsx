import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { waLink } from '@/lib/whatsapp';
import { SITE_CONFIG } from '@/config/site.config';
import { STUDIO_UI } from '@/config/install';
import NewListingForm from './NewListingForm';
import ListingActions from './ListingActions';
import StudioNewListingForm from './StudioNewListingForm';
import StudioListingActions from './StudioListingActions';
import styles from './marktplaats.module.css';
import { PreviewText } from '../../PreviewLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

interface Listing {
  id: string;
  posted_by: string;
  technician_id: string | null;
  title: string;
  description: string | null;
  price: number | string | null;
  photos: string[];
  status: 'available' | 'sold';
  created_at: string;
}

/**
 * Technicians selling tools/parts they don't use — a real listings board, not
 * a chat channel, since price/photos/sold-status don't fit a text message.
 * "Contact seller" is a plain WhatsApp link (waLink, same helper Kas/Leads
 * already use) rather than a new DM-channel system — chat_channel_type='dm'
 * exists as an enum value but nothing in this app creates one yet, and
 * building that is a bigger feature than this one needed.
 */
export default async function MarktplaatsPage() {
  const user = await requireCrmUser('/admin/netwerk/marktplaats');

  /*
   * The same Pro gate as the channels, enforced here and not only in the
   * sidebar — hiding a link is not access control, and this page is one
   * typed URL away otherwise.
   */
  const isOfficeUser = user.role === 'owner' || user.role === 'kantoor';
  if (!isOfficeUser) {
    const gate = await createSupabaseServerClient();
    const { data: meRow } = await gate
      .from('technicians')
      .select('verified, technician_subscription (tier)')
      .eq('user_id', user.id)
      .maybeSingle();
    const sub = (meRow?.technician_subscription ?? null) as
      | { tier?: string }
      | { tier?: string }[]
      | null;
    const subTier = Array.isArray(sub) ? sub[0]?.tier : sub?.tier;
    const mayEnter = meRow?.verified === true || subTier === 'pro' || subTier === 'premium';
    if (!mayEnter) {
      if (STUDIO_UI) {
        return (
          <div className="kfc-neutral flex flex-col gap-2 p-6">
            <h1 className="text-lg font-medium"><PreviewText>Alleen voor Pro en geverifieerde monteurs</PreviewText></h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <PreviewText>De marktplaats voor tools en onderdelen hoort bij een Pro-account. Vraag het kantoor om toegang.</PreviewText>
            </p>
          </div>
        );
      }
      return (
        <div className={styles.panel} style={{ padding: 24 }}>
          <h1 style={{ fontSize: 18, margin: '0 0 8px' }}>Alleen voor Pro en geverifieerde monteurs</h1>
          <p style={{ color: 'var(--crm-muted)', margin: 0, lineHeight: 1.6 }}>
            De marktplaats voor tools en onderdelen hoort bij een Pro-account. Vraag het
            kantoor om toegang.
          </p>
        </div>
      );
    }
  }
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('id, posted_by, technician_id, title, description, price, photos, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    const missing = /does not exist|relation/i.test(error.message);
    if (STUDIO_UI) {
      return (
        <div className="kfc-neutral flex flex-col gap-4 p-6">
          <p className="text-destructive text-sm">
            <PreviewText>{`Marktplaats kon niet worden geladen: ${error.message}`}</PreviewText>
            {missing && (
              <>
                <br />
                <PreviewText>Voer supabase/migrations/0031_marketplace_listings.sql uit.</PreviewText>
              </>
            )}
          </p>
        </div>
      );
    }
    return (
      <div className={styles.body}>
        <p>Marktplaats kon niet worden geladen: {error.message}</p>
        {missing && (
          <p>
            Voer <code>supabase/migrations/0031_marketplace_listings.sql</code> uit.
          </p>
        )}
      </div>
    );
  }

  const listings = (data ?? []) as Listing[];
  const technicianIds = [...new Set(listings.map((l) => l.technician_id).filter((id): id is string => !!id))];

  const { data: technicians } = technicianIds.length
    ? await supabase.from('technicians').select('id, name, phone').in('id', technicianIds)
    : { data: [] };

  const sellerOf = new Map((technicians ?? []).map((t) => [t.id, t]));

  if (STUDIO_UI) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Marktplaats</PreviewText></h1>
          <p className="text-muted-foreground text-sm"><PreviewText>Tools en onderdelen die monteurs niet meer gebruiken.</PreviewText></p>
        </div>

        <StudioNewListingForm />

        {listings.length === 0 ? (
          <p className="text-muted-foreground text-sm"><PreviewText>Nog geen advertenties.</PreviewText></p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => {
              const seller = listing.technician_id ? sellerOf.get(listing.technician_id) : null;
              const sellerName = seller?.name ?? 'Kantoor';
              const cover = listing.photos[0] ?? null;
              const price = listing.price === null || listing.price === '' ? null : Number(listing.price);
              const isOwner = listing.posted_by === user.id;
              const wa = waLink(
                seller?.phone ?? SITE_CONFIG.whatsapp,
                `Hoi, ik zag "${listing.title}" op Marktplaats — is dit nog beschikbaar?`
              );

              return (
                <div key={listing.id} className={`overflow-hidden rounded-xl border bg-card ${listing.status === 'sold' ? 'opacity-60' : ''}`}>
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote, already sized listing photo
                    <img className="aspect-square w-full object-cover" src={cover} alt={listing.title} />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex aspect-square w-full items-center justify-center text-xs">
                      <PreviewText>Geen foto</PreviewText>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5 p-3">
                    <span className="text-sm font-medium">{listing.title}</span>
                    {listing.description && <span className="text-muted-foreground line-clamp-2 text-xs">{listing.description}</span>}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{price === null ? '—' : MONEY.format(price)}</span>
                      <Badge
                        variant="outline"
                        className={
                          listing.status === 'sold'
                            ? undefined
                            : 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300'
                        }
                      >
                        <PreviewText>{listing.status === 'sold' ? 'Verkocht' : 'Beschikbaar'}</PreviewText>
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-xs">{sellerName}</span>

                    {isOwner ? (
                      listing.status === 'available' && <StudioListingActions id={listing.id} />
                    ) : (
                      wa &&
                      listing.status === 'available' && (
                        <Button size="sm" asChild>
                          <a href={wa} target="_blank" rel="noreferrer"><PreviewText>Contact via WhatsApp</PreviewText></a>
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.body}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Marktplaats</h1>
          <p className={styles.sub}>Tools en onderdelen die monteurs niet meer gebruiken.</p>
        </div>
      </div>

      <NewListingForm />

      {listings.length === 0 ? (
        <p className={styles.empty}>Nog geen advertenties.</p>
      ) : (
        <div className={styles.grid}>
          {listings.map((listing) => {
            const seller = listing.technician_id ? sellerOf.get(listing.technician_id) : null;
            const sellerName = seller?.name ?? 'Kantoor';
            const cover = listing.photos[0] ?? null;
            const price = listing.price === null || listing.price === '' ? null : Number(listing.price);
            const isOwner = listing.posted_by === user.id;
            // Office-posted listings have no technician to pull a phone
            // number from — fall back to the business WhatsApp so there is
            // always someone to message, not just when a monteur posted it.
            const wa = waLink(
              seller?.phone ?? SITE_CONFIG.whatsapp,
              `Hoi, ik zag "${listing.title}" op Marktplaats — is dit nog beschikbaar?`
            );

            return (
              <div key={listing.id} className={`${styles.card} ${listing.status === 'sold' ? styles.cardSold : ''}`}>
                {cover ? (
                  <img className={styles.cardPhoto} src={cover} alt={listing.title} />
                ) : (
                  <div className={styles.cardPhotoEmpty}>Geen foto</div>
                )}
                <div className={styles.cardBody}>
                  <span className={styles.cardTitle}>{listing.title}</span>
                  {listing.description && <span className={styles.cardDesc}>{listing.description}</span>}
                  <div className={styles.cardMeta}>
                    <span className={styles.cardPrice}>{price === null ? '—' : MONEY.format(price)}</span>
                    <span className={`${styles.badge} ${listing.status === 'sold' ? styles.badgeSold : ''}`}>
                      {listing.status === 'sold' ? 'Verkocht' : 'Beschikbaar'}
                    </span>
                  </div>
                  <span className={styles.cardSeller}>{sellerName}</span>

                  {isOwner ? (
                    listing.status === 'available' && <ListingActions id={listing.id} />
                  ) : (
                    wa &&
                    listing.status === 'available' && (
                      <div className={styles.cardActions}>
                        <a className={`${styles.act} ${styles.actPrimary}`} href={wa} target="_blank" rel="noreferrer">
                          Contact via WhatsApp
                        </a>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
