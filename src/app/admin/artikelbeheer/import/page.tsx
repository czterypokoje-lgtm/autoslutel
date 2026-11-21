import { PreviewText } from '@/app/admin/PreviewLanguage';
import { BRAND } from '@/config/install';
import { loadCategories, recentImports, type Category, type ImportRun } from '@/lib/kfcProductMaster';
import { requireMasterDataUser } from '../access';
import ImportWizard from './ImportWizard';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Importeren en exporteren | ${BRAND.name}` };

export default async function ImportPage() {
  await requireMasterDataUser('/admin/artikelbeheer/import');
  let runs: ImportRun[] = [];
  let categories: Category[] = [];
  let error = '';
  try {
    [runs, categories] = await Promise.all([recentImports(), loadCategories()]);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Laden mislukt.';
  }
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>Importeren en exporteren</PreviewText></h1>
        <p className="text-muted-foreground text-sm">
          <PreviewText>Artikelen bijwerken of aanmaken uit een CSV- of Excel-bestand. Eerst een proefrun die laat zien wat er verandert; pas daarna schrijven. Hetzelfde bestand twee keer toepassen verandert niets.</PreviewText>
        </p>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <ImportWizard runs={runs} categories={categories.map((c) => ({ id: c.id, path: c.path }))} />
    </>
  );
}
