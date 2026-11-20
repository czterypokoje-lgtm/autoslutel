import profiles from "./profiles.json" with { type: "json" };

const sku = (value) => String(value ?? "").trim().toUpperCase();
const fold = (value) => String(value ?? "").normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const bySku = new Map(profiles.map((profile) => [sku(profile.sku), profile]));
const columns = "code,sku,name,category,ean,sale_price_cents,status";
const project = Deno.env.get("SUPABASE_URL");
const admin = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const access = Deno.env.get("KFC_CATALOG_ACCESS");
const json = (body, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

async function read(table, params) {
  const response = await fetch(project + "/rest/v1/" + table + "?" + new URLSearchParams(params), {
    headers: { apikey: admin, authorization: "Bearer " + admin },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Catalog data unavailable");
  return response.json();
}

async function search(query) {
  const terms = fold(query).match(/[a-z0-9]+/g) ?? [];
  if (!terms.length) return { matches: [] };
  const year = terms.find((term) => /^(19|20)\d{2}$/.test(term));
  const words = terms.filter((term) => term !== year);
  const rows = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const page = await read("kfc_articles", { select: "code,sku,name,category,ean", order: "code.asc", limit: pageSize, offset });
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  const matches = rows.flatMap((row) => {
    const profile = bySku.get(sku(row.sku));
    const fit = profile?.fits?.find((entry) =>
      words.every((term) => fold(entry.vehicle + " " + entry.text).includes(term)) &&
      (!year || (entry.from != null && entry.to != null && entry.from <= Number(year) && entry.to >= Number(year)))
    );
    const index = fold([row.code, row.sku, row.name, row.category, ...(row.ean ?? []), profile?.name, profile?.nameNl, ...(profile?.ean ?? []), JSON.stringify(profile?.facts ?? {}), JSON.stringify(profile?.specs ?? [])].join(" "));
    const exact = sku(row.sku) === sku(query) || sku(row.code) === sku(query) || row.ean?.includes(query) || profile?.ean?.includes(query);
    if (!exact && !fit && (!words.length || !words.every((term) => index.includes(term)))) return [];
    return [{ article_id: row.code, sku: row.sku, name_nl: profile?.nameNl || row.name, name_en: profile?.name || null, category: row.category, matched_vehicle: fit ?? null, rank: exact ? 3 : fit ? 2 : 1 }];
  }).sort((a, b) => b.rank - a.rank);
  return { searched_count: rows.length, total_matches: matches.length, matches: matches.slice(0, 8).map(({ rank, ...match }) => match) };
}

async function detail(id) {
  const [article] = await read("kfc_articles", { select: columns, code: "eq." + id, limit: 1 });
  if (!article) return json({ error: "Article not found" }, 404);
  const [stock] = await read("kfc_stock_position", { select: "available", article_code: "eq." + id, limit: 1 });
  const profile = bySku.get(sku(article.sku));
  return json({
    article_id: article.code, sku: article.sku, name_nl: profile?.nameNl || article.name,
    name_en: profile?.name || null, category: article.category, status: article.status,
    product_facts: profile?.facts ?? null, specifications: profile?.specs ?? [],
    recorded_vehicle_fit: profile?.fits ?? [], product_pages: profile?.links ?? [],
    ean: [...new Set([...(article.ean ?? []), ...(profile?.ean ?? [])])],
    price_eur_cents: article.sale_price_cents, available_units: stock?.available ?? null,
    inventory_note: "CRM inventory only; sale price and stock may be demo values. A missing value is unknown.",
  });
}

Deno.serve(async (request) => {
  const provided = request.headers.get("x-kfc-catalog-key") ?? "";
  let difference = provided.length ^ (access?.length ?? 0);
  for (let i = 0; i < (access?.length ?? 0); i++) difference |= provided.charCodeAt(i) ^ access.charCodeAt(i);
  if (!access || difference !== 0) return json({ error: "Unauthorized" }, 401);
  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
  const query = new URL(request.url).searchParams;
  const id = query.get("article_id")?.trim();
  const term = query.get("query")?.trim();
  try {
    if (id && /^[a-z0-9_-]{1,80}$/i.test(id)) return await detail(id);
    if (term && term.length <= 160) return json(await search(term));
    return json({ error: "Provide query or a valid article_id" }, 400);
  } catch {
    return json({ error: "Catalog temporarily unavailable" }, 503);
  }
});
