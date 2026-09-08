'use server';

import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function transferStock(
  fromTechId: string | null,
  toTechId: string | null,
  description: string,
  quantity: number
) {
  const user = await requireCrmUser();
  if (user.role !== 'monteur' && user.role !== 'kantoor' && user.role !== 'owner') {
    throw new Error('Not authorized');
  }
  if (quantity <= 0) throw new Error('Invalid quantity');

  // We use the admin client because monteurs do not have RLS write access to stock_items.
  const adminDb = createSupabaseAdminClient();

  // 1. Decrement sender
  const { data: senderStock, error: err1 } = await adminDb
    .from('stock_items')
    .select('id, quantity')
    .eq('description', description)
    .is('technician_id', fromTechId)
    .single();

  if (err1 || !senderStock) throw new Error('Source stock item not found');
  if (senderStock.quantity < quantity) throw new Error('Not enough stock');

  const { error: err2 } = await adminDb
    .from('stock_items')
    .update({ quantity: senderStock.quantity - quantity, updated_at: new Date().toISOString() })
    .eq('id', senderStock.id);
    
  if (err2) throw new Error('Failed to decrement');

  // 2. Increment receiver
  // Try to find if receiver already has this item
  const { data: receiverStock } = await adminDb
    .from('stock_items')
    .select('id, quantity')
    .eq('description', description)
    .is('technician_id', toTechId)
    .single();

  if (receiverStock) {
    const { error: err3 } = await adminDb
      .from('stock_items')
      .update({ quantity: receiverStock.quantity + quantity, updated_at: new Date().toISOString() })
      .eq('id', receiverStock.id);
    if (err3) throw new Error('Failed to increment');
  } else {
    // Create new row for receiver
    const { error: err4 } = await adminDb
      .from('stock_items')
      .insert({
        technician_id: toTechId,
        description,
        quantity,
        min_quantity: 0
      });
    if (err4) throw new Error('Failed to create destination stock');
  }
}
