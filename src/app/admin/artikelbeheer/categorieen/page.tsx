import { PreviewText } from '@/app/admin/PreviewLanguage';
import { BRAND } from '@/config/install';
import { loadCategories, type Category } from '@/lib/kfcProductMaster';
import { requireMasterDataUser } from '../access';
import CategoryTree from './CategoryTree';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Categorieën | ${BRAND.name}` };

export default async function CategorieenPage() {
  await requireMasterDataUser('/admin/artikelbeheer/categorieen');
  let categories: Category[] = [];
  let error = '';
  try {
    categories = await loadCategories();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Categorieën konden niet geladen worden.';
  }
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>Categorieën</PreviewText></h1>
        <p className="text-muted-foreground text-sm">
          <PreviewText>Artikelgroepen als boom. Elke categorie heeft een standaard btw-tarief en een standaardmarge die de bulkbewerker gebruikt om verkoopprijzen voor te stellen.</PreviewText>
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : <CategoryTree categories={categories} />}
    </>
  );
}
