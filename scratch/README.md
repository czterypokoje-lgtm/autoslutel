# scratch/

Spent one-off scripts, kept only as a record of how something was done once.

Nothing here is maintained and nothing here is safe to re-run: paths, table
names and hardcoded lists are frozen at the day the script was written.
Maintained scripts live in `scripts/`.

**Never re-run a script that writes into `src/`.** `patch_vandaag_pim.js` did
exactly that — it repointed the materials picker from `stock_items` to the empty
`inventory_products` table, so the van screen stopped sending `stock_item_id`,
the `job_material_stock_trg` trigger stopped firing, and no stock was deducted
for any job for months. Every such codemod has been deleted from this repo
(see commit for this file); recover one from git history if you must read it,
and rewrite the change by hand.
