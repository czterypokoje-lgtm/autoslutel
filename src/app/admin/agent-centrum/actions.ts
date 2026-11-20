'use server';

import { randomUUID } from 'node:crypto';
import { notFound, redirect } from 'next/navigation';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { findProfile, searchProfiles } from '@/lib/productProfiles';
import { listTestParcels } from '@/lib/kfcShippingTest';
import { carriers } from '@/lib/kfcShippingTestModel';
import { DEMO_BOT_AGENT, demoBotIntent, isDemoChannel, matchesDemoOrder } from '@/lib/kfcDemoBotRules';

const path = '/admin/agent-centrum';

export async function runDemoBot(form: FormData) {
  const user = await requireCrmUser(path);
  if (user.role !== 'owner' || process.env.KFC_DEMO_MODE !== '1') notFound();

  const get = (field: string) => String(form.get(field) ?? '').trim();
  const message = get('message');
  const channel = get('channel');
  const language = get('lang');
  const order = get('order').replace(/^#\s*/, '');
  const email = get('email');
  const postcode = get('postcode');
  const code = get('sku').toUpperCase();
  const vehicle = get('vehicle');
  const en = language === 'en';
  const say = (english: string, dutch: string) => en ? english : dutch;
  if (!isDemoChannel(channel) || (language !== 'en' && language !== 'nl') || !message || message.length > 700 ||
      (order && !/^\d{1,20}$/.test(order)) || email.length > 254 || postcode.length > 16 ||
      (code && !/^[A-Z0-9_-]{1,40}$/.test(code)) || vehicle.length > 100) redirect(path + '?error=input');

  const db = createSupabaseAdminClient();
  const intent = demoBotIntent(message, !!order, !!(code || vehicle));
  let response = say('I can check an order, look up a product or record a technician request.', 'Ik kan een bestelling nakijken, een product opzoeken of een verzoek voor een technicus vastleggen.');
  let resolved = false;
  let technicianRequested = intent === 'technician';
  const skus: string[] = [];

  try {
    if (intent === 'order') {
      if (!order || !email || !postcode) {
        response = say('Please provide the order number, order email and delivery postcode.', 'Geef het bestelnummer, het e-mailadres van de bestelling en de bezorgpostcode.');
      } else {
        const { data, error } = await db.from('kfc_shop_orders').select('id,status,fulfilment,ship_email,ship_postcode')
          .eq('number', order).eq('raw->>source', 'sample');
        if (error) throw error;
        const matches = (data ?? []).filter((row) => matchesDemoOrder(row, email, postcode));
        if (matches.length !== 1) {
          response = say('I could not verify those order details.', 'Ik kon de bestelgegevens niet verifiëren.');
        } else {
          const [row] = matches;
          const states: Record<string, [string, string]> = {
            open: ['awaiting dispatch', 'wacht op verzending'], picked: ['items picked', 'artikelen verzameld'],
            shipped: ['marked as shipped in the CRM', 'in het CRM als verzonden gemarkeerd'],
            external: ['completed in the webshop', 'afgerond in de webshop'], cancelled: ['cancelled', 'geannuleerd'],
            refunded: ['refunded', 'terugbetaald'], 'on-hold': ['awaiting payment', 'wacht op betaling'],
          };
          const state = states[row.status] ?? states[row.fulfilment] ?? ['status unavailable', 'status niet beschikbaar'];
          const parcels = await listTestParcels([row.id]);
          const details = parcels.map((parcel) => say('Parcel ', 'Pakket ') + parcel.parcel_no + ' · ' + (carriers.find((item) => item.id === parcel.service)?.label ?? '—')).join('; ');
          response = say('Order #' + order + ' is ' + state[0] + '.', 'Bestelling #' + order + ': ' + state[1] + '.') +
            (details ? ' ' + say('Sample parcel records: ', 'Voorbeeldpakketten: ') + details + '.' : '') +
            ' ' + say('No verified carrier update or delivery estimate is available.', 'Er is geen bevestigde vervoerdersupdate of bezorgindicatie beschikbaar.');
          resolved = true;
        }
      }
    }
    if (intent === 'product') {
      const matched = code ? findProfile(code) : undefined;
      const hits = vehicle && /\b(?:19|20)\d\d\b/.test(vehicle) ? searchProfiles(vehicle, 8).filter((item) => item.fits.length > 0) : [];
      const checked = matched ? hits.some((hit) => hit.profile.sku === matched.sku) : false;
      if (!code) {
        technicianRequested = Boolean(vehicle && !hits.length);
        response = hits.length
          ? say('The catalogue lists these candidates: ', 'De catalogus vermeldt deze mogelijke artikelen: ') +
            hits.slice(0, 3).map((hit) => hit.profile.sku).join(', ') + '. ' +
            say('Please confirm the SKU or key specifications.', 'Bevestig de SKU of de sleutelspecificaties.')
          : say('Please provide the SKU, or the make, model and year. Compatibility is unconfirmed.', 'Geef de SKU of het merk, model en bouwjaar. De compatibiliteit is onbevestigd.');
      } else {
        const { data, error } = await db.from('kfc_articles').select('code,sku,name,sale_price_cents').eq('sku', code).limit(2);
        if (error) throw error;
        const article = data?.length === 1 ? data[0] : null;
        if (!article) {
          technicianRequested = true;
          response = say('I could not confirm this SKU in the CRM catalogue.', 'Ik kon deze SKU niet bevestigen in de CRM-catalogus.');
        } else {
          const amount = typeof article.sale_price_cents === 'number'
            ? new Intl.NumberFormat(en ? 'en-GB' : 'nl-NL', { style: 'currency', currency: 'EUR' }).format(article.sale_price_cents / 100)
            : say('price unavailable', 'prijs niet beschikbaar');
          const stock = await db.from('kfc_stock_position').select('available').eq('article_code', article.code).maybeSingle();
          const available = stock.data?.available;
          const name = (en ? matched?.name : matched?.nameNl || matched?.name) || article.name;
          response = code + ' · ' + name + ' · ' + amount + '. ' + (typeof available === 'number'
            ? say('Available units: ', 'Beschikbare stuks: ') + available + '.'
            : say('No stock figure is recorded.', 'Er is geen voorraadstand vastgelegd.'));
          response += ' ' + (checked
            ? say('The vehicle appears in the catalogue fitment record. Confirm the original key specifications before buying.', 'Het voertuig staat in de compatibiliteitsgegevens. Controleer voor aankoop de originele sleutelspecificaties.')
            : say('I cannot confirm compatibility for this vehicle.', 'Ik kan de compatibiliteit met dit voertuig niet bevestigen.'));
          if (checked) skus.push(code);
          technicianRequested = Boolean(vehicle && !checked);
          resolved = checked || !vehicle;
        }
      }
    }
    if (technicianRequested) {
      const escalation = say('Technician review recorded in the demo. No call or message was sent.', 'Beoordeling door een technicus is vastgelegd in de demo. Er is niet gebeld en geen bericht verstuurd.');
      response = intent === 'technician' ? escalation : response + ' ' + escalation;
    }
    const id = 'kfc-sim-' + randomUUID();
    // Verification fields stay out of the transcript. Mask any supplied details repeated in free text.
    const transcript = [email, postcode].filter(Boolean).reduce((text, value) =>
      text.replaceAll(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[redacted]'), message)
      .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[redacted]');
    const { error } = await db.from('agent_conversations').insert({
      conversation_id: id, channel: channel === 'chat' ? 'web' : channel,
      status: 'done', outcome: resolved ? 'success' : null,
      summary: response, transcript: [{ role: 'user', message: transcript }, { role: 'agent', message: response }],
      metadata: { kfc_demo_bot: { intent, technician_requested: technicianRequested },
        kfc_call_review: { agent_id: DEMO_BOT_AGENT, agent_name: 'KeyForCars Support (Demo)',
          channel: channel === 'chat' ? 'web' : channel, language, resolved: resolved ? 'yes' : 'unknown',
          recommended: skus.length ? 'yes' : 'no', product_skus: skus, transfer: 'not_recorded', transfer_number: null } },
    });
    if (error) throw error;
  } catch (error) {
    console.error('Demo bot request failed', error instanceof Error ? error.name : 'database');
    redirect(path + '?error=unavailable');
  }
  redirect(path + '?' + new URLSearchParams({ channel, lang: language, latest: '1' }));
}
