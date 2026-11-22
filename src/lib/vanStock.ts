import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type VanStock = { location: string; label: string; items: { code: string; name: string; quantity: number }[] };

export async function technicianVanStock(technicianId: string): Promise<VanStock | null> {
  const db = createSupabaseAdminClient();
  const { data: van, error } = await db.from('kfc_locations').select('id, technicians(name)')
    .eq('technician_id', technicianId).maybeSingle().overrideTypes<{ id: string; technicians: { name: string } }, { merge: false }>();
  if (error) throw error;
  if (!van) return null;
  const { data: rows, error: stockError } = await db.from('kfc_stock_levels')
    .select('article_code, quantity, kfc_articles!inner(name)').eq('location_id', van.id).gt('quantity', 0).order('article_code')
    .overrideTypes<{ article_code: string; quantity: number; kfc_articles: { name: string } }[], { merge: false }>();
  if (stockError) throw stockError;
  return { location: van.id, label: van.technicians.name, items: rows.map((row) => ({ code: row.article_code, quantity: row.quantity, name: row.kfc_articles.name })) };
}
