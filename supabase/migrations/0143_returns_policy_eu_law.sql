/*
 * 0143: the return policy the agents state, brought in line with EU/NL consumer law.
 *
 * The owner, 23 Nov 2026: "whatever is legally correct, the agent reads that; opening the package to look is
 * of course allowed; only programmed or cut keys are not taken back". Researched against Directive 2011/83/EU
 * and BW 6:230o-230s (docs/webshop-agent-compliance.md):
 *   - 0087 said "opened ... items cannot be returned": not lawful for consumers. Inspecting as in a shop is
 *     allowed (art. 14(2)), using beyond that keeps the right to withdraw with a deduction for loss in value;
 *   - only goods cut, programmed or transferred BY US on the order are made to order (art. 16(c), BW 6:230p);
 *   - the refund includes the standard delivery cost, within 14 days, and may wait for the goods or proof of
 *     sending (art. 13).
 * The shop's own page /verzending-en-retour already says this; the table now agrees with it.
 *
 * Only these two rows. Idempotent: running it twice writes the same text twice.
 */

update public.agent_knowledge
   set answer = 'Consumers may withdraw from a webshop purchase within 14 days of receiving it (the last item, if delivered separately), without giving a reason. Opening the package and inspecting the item as in a shop is allowed. Using it beyond that does not cancel the right, but we may deduct the resulting loss in value. Keys that we cut, programmed or transferred for the customer''s car at their request are made to order and normally cannot be withdrawn. Return shipping is paid by the customer. We refund the purchase price and the standard delivery costs within 14 days of the withdrawal, and may wait until we have the item or proof that it was sent. Defects fall under the legal guarantee, separately from this. Business buyers have no statutory withdrawal right.',
       rule = 'Treat any clear statement of withdrawal as valid and register it with request_return. Never refuse a return because the item was opened or used, and never say a return is impossible; only an item we cut, programmed or transferred ourselves is "normally" excluded, and a colleague decides. Loss-in-value amounts, made-to-order cases, defects, unclear business buyers and requests outside the period go to a colleague.',
       status = 'confirmed',
       source = 'owner 2026-11-23, EU/NL consumer law (0143)',
       approved_at = now(),
       updated_at = now()
 where key = 'returns.policy';

update public.agent_knowledge
   set rule = 'Webshop prices (part plus service add-on) and on-site job prices are separate; do not mix them. Before a customer adds cutting, programming or transferring to a webshop order, say that this makes the key made to order, so the 14-day withdrawal right normally no longer applies.',
       source = 'owner 2026-11-23, EU/NL consumer law (0143)',
       approved_at = now(),
       updated_at = now()
 where key = 'rule.shop_vs_onsite';

select key, status, left(answer, 80) as answer, left(rule, 80) as rule
  from public.agent_knowledge
 where key in ('returns.policy', 'rule.shop_vs_onsite');
