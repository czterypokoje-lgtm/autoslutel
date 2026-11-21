import { redirect } from 'next/navigation';
import { requireMasterDataUser } from './access';

export const dynamic = 'force-dynamic';

/** Artikelbeheer opens on the data-quality overview: it says where to start. */
export default async function ArtikelbeheerPage() {
  await requireMasterDataUser('/admin/artikelbeheer');
  redirect('/admin/artikelbeheer/kwaliteit');
}
