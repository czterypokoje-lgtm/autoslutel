/*
 * Every internal link in the public site resolves to a page that answers 200.
 *   node --test tests/unit/
 *
 * Twice now a page has been renamed or folded into another and the links to
 * it were left behind: /autosleutel-bijmaken/<stad> kept the nested shape
 * after the pilot cities moved to /autosleutel-bijmaken-<stad>, which put a
 * 404 in the footer of every page; and three merged-away service pages stayed
 * in the footer and the menu as 301s. Neither shows up in a build, in tsc, or
 * in review -- a wrong href is a valid string.
 *
 * This reads the links out of the source and checks them against the same
 * tables the router builds its routes from, so a rename that misses a link
 * fails here instead of in Search Console.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

/*
 * The slug tables are read as text, not imported. The config modules reach
 * each other through the '@/...' alias, which node --test does not resolve,
 * and a guard test that needs a bundler to run is one that stops being run.
 * Every set is asserted non-trivial below, so a config reshuffle that breaks
 * a pattern fails here rather than quietly matching nothing.
 */
const slugsIn = (file, re = /slug:\s*['"]([a-z0-9-]+)['"]/g) =>
  new Set([...read(file).matchAll(re)].map((m) => m[1]));

/** Every .ts/.tsx file under src, minus the CRM — this is about the public site. */
function sourceFiles(dir = path.join(ROOT, 'src'), out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'admin' || e.name === 'api') continue;
      sourceFiles(p, out);
    } else if (/\.tsx?$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

/** Static routes: every page.tsx whose path has no [dynamic] segment. */
function staticRoutes(dir = path.join(ROOT, 'src/app'), prefix = '', out = new Set()) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name === 'admin' || e.name === 'api' || e.name.startsWith('[')) continue;
      // A route group — (marketing) — does not appear in the URL.
      const seg = e.name.startsWith('(') ? '' : `/${e.name}`;
      staticRoutes(path.join(dir, e.name), prefix + seg, out);
    } else if (e.name === 'page.tsx') {
      out.add(prefix || '/');
    }
  }
  return out;
}

const STATIC = staticRoutes();
const cities = slugsIn('src/config/cities.ts');
const diensten = slugsIn('src/config/diensten.ts');
const blog = slugsIn('src/config/services.ts');
const regios = slugsIn('src/config/regions.ts');
const zakelijk = slugsIn('src/config/zakelijk.ts');
const merken = new Set(
  [...slugsIn('src/config/brands.ts', /nameSlug:\s*['"]([a-z0-9-]+)['"]/g)]
    .map((b) => `${b}-autosleutel-bijmaken`),
);

/*
 * The literal redirect sources in next.config.ts. A link to one of these is
 * not a 404 -- it works -- but it spends a hop to arrive somewhere we could
 * have pointed at directly, which is how a merged-away page keeps living in
 * a menu. Patterns (:slug, *) are skipped.
 */
const config = read('next.config.ts');
const REDIRECTED = new Set(
  [...config
    .slice(config.indexOf('async redirects()'), config.indexOf('async headers()'))
    .matchAll(/source:\s*['"](\/[^'":*]+)['"]/g)].map((m) => m[1]),
);

/** Where a path lands, or null if nowhere. */
function resolvePath(p) {
  if (STATIC.has(p)) return 'static';
  const parts = p.slice(1).split('/');
  // The webshop is a separate Next app proxied in by rewrite (SHOP_ZONE_ORIGIN).
  if (parts[0] === 'webshop') return 'shop-zone';
  if (parts.length !== 2) return null;
  const [group, slug] = parts;
  if (group === 'diensten') return diensten.has(slug) ? 'dienst' : null;
  if (group === 'steden') return cities.has(slug) ? 'stad' : null;
  if (group === 'merken') return merken.has(slug) ? 'merk' : null;
  if (group === 'blog') return blog.has(slug) ? 'blog' : null;
  if (group === 'regio') return regios.has(slug) ? 'regio' : null;
  if (group === 'zakelijk') return zakelijk.has(slug) ? 'zakelijk' : null;
  return null;
}

/*
 * Every literal internal path written in the source, with a file that holds
 * it. Two patterns, because the links that broke were not all written as
 * href="...": the footer and the menu keep theirs in arrays and hand them to
 * <Link> later, which is exactly where the dead city URLs sat.
 *
 * The second pattern is deliberately anchored on the route groups rather than
 * matching every quoted path, so that an outbound API path in a lib file
 * ('/products/batch') is not mistaken for a page on this site.
 */
const PATH_LITERAL =
  /["'](\/(?:diensten|steden|merken|blog|regio|zakelijk|webshop|autosleutel|prijzen|kennisbank|galerij|contact|over-ons|beoordelingen|veelgestelde-vragen|mobiele-sleutelmaker|motorsleutel-bijmaken|renault-sleutelkaart)[a-z0-9/-]*)["']/g;

function hrefsInSource() {
  const found = new Map();
  for (const file of sourceFiles()) {
    const rel = path.relative(ROOT, file);
    const src = read(rel);
    for (const re of [/href=["'](\/[a-z0-9][a-z0-9/-]*)["']/g, PATH_LITERAL]) {
      for (const m of src.matchAll(re)) {
        const href = m[1].replace(/\/$/, '');
        if (href && !found.has(href)) found.set(href, rel);
      }
    }
  }
  return found;
}

test('the route tables were actually read', () => {
  const sets = { STATIC, cities, diensten, blog, regios, zakelijk, merken, REDIRECTED };
  for (const [name, set] of Object.entries(sets)) {
    assert.ok(set.size > 3, `${name} came back with ${set.size} entries — its pattern no longer matches`);
  }
  assert.ok(hrefsInSource().size > 20, 'no hrefs found — the href pattern no longer matches');
});

test('every hard-coded internal href resolves to a real page', () => {
  const broken = [];
  for (const [href, file] of hrefsInSource()) {
    if (!resolvePath(href)) broken.push(`${href}  (${file})`);
  }
  assert.deepEqual(broken, [], `dead internal links:\n  ${broken.join('\n  ')}`);
});

test('no hard-coded internal href points at a redirect', () => {
  const stale = [];
  for (const [href, file] of hrefsInSource()) {
    if (REDIRECTED.has(href)) stale.push(`${href} → 301  (${file})`);
  }
  assert.deepEqual(stale, [], `links to redirects — point them at the destination:\n  ${stale.join('\n  ')}`);
});

test('the pilot cities are linked at their own URL, not under /steden and not nested', () => {
  const pilot = ['utrecht', 'amsterdam', 'amstelveen', 'almere'];
  const bad = [];
  for (const file of sourceFiles()) {
    const rel = path.relative(ROOT, file);
    // cityUrls.ts quotes a competitor's nested URL in its own comment.
    if (rel.endsWith('config/cityUrls.ts')) continue;
    const src = read(rel);
    for (const slug of pilot) {
      if (src.includes(`/autosleutel-bijmaken/${slug}`)) bad.push(`/autosleutel-bijmaken/${slug}  (${rel})`);
      if (new RegExp(`href=["']/steden/${slug}["']`).test(src)) bad.push(`/steden/${slug}  (${rel})`);
    }
  }
  assert.deepEqual(bad, [], `use cityPath(slug) from @/config/cityUrls:\n  ${bad.join('\n  ')}`);
});
