import { PreviewText } from '@/app/admin/PreviewLanguage';
import { BRAND } from '@/config/install';
import { ISSUES, loadArticles, loadCategories, type Category, type Issue, type MasterArticle } from '@/lib/kfcProductMaster';
import { requireMasterDataUser } from '../access';
import BulkEditor from './BulkEditor';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Bulk bewerken | ${BRAND.name}` };

export default async function BulkBewerkenPage({ searchParams }: { searchParams: Promise<{ issue?: string; category?: string }> }) {
  await requireMasterDataUser('/admin/artikelbeheer/bulk');
  const params = await searchParams;
  const issue = (ISSUES as readonly string[]).includes(params.issue ?? '') ? (params.issue as Issue) : null;
  let articles: MasterArticle[] = [];
  let categories: Category[] = [];
  let error = '';
  try {
    [articles, categories] = await Promise.all([loadArticles(), loadCategories()]);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Artikelen konden niet geladen worden.';
  }
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>Bulk bewerken</PreviewText></h1>
        <p className="text-muted-foreground text-sm">
          <PreviewText>Pas prijzen, categorie, status, barcodes en minimumvoorraad van veel artikelen tegelijk aan. Wijzigingen worden pas bij Opslaan geschreven, allemaal of geen.</PreviewText>
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : (
        <BulkEditor
          articles={articles}
          categories={categories.map((c) => ({ id: c.id, path: c.path, margin: c.default_margin_pct, vat: c.vat_rate, parent: c.parent_id }))}
          initialIssue={issue}
          initialCategory={params.category ?? ''}
        />
      )}
    </>
  );
}
