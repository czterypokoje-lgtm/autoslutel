# A-Key product photos — the problem, and the toolchain

## What is actually wrong

A-Key serves every product photo from one path, in four fixed sizes:

```
https://a-key-gmbh.com/media/image/product/<id>/<size>/<slug>.jpg
```

| size | width | watermark |
|---|---|---|
| `xs` | 100 px | no |
| `sm` | 130 px | no |
| `md` | 320 px | **no** |
| `lg` | 800 px | **yes** — a large centred "A-KEY ®" overlay |

Read off their own `srcset`, in a product page saved at `akey_product.html`.

**The watermark is not added when you open the product page.** It is baked into
the `lg` rendition and only that one. A listing page shows `sm`/`md`, which is
why those look clean; a product page shows `lg`, which is why opening one
"adds" the watermark. Same file on disk at their end, two different renditions.

That matters, because it means there is nothing to defeat by changing headers,
a referer, a user-agent or a cookie. Their image processor wrote the watermark
into the 800 px file. No request shape gets a clean 800 px out of that URL.

Someone here already found half of this. `scripts/fetch-missing-photos.mjs`
carries the line *"Their medium variant carries no watermark; the large one
does"* and rewrites `/lg/` → `/md/`. It only ever ran for products that had no
photo at all, so the catalogue ended up split:

```
3,610 images at 320×320   clean,       too small
3,605 images at 800×800   watermarked, right size
~1,000 others            from AccessFobs and other sources
                          (measured over 8,243 files in public/images/products)
```

Neither half is what a shop needs.

## The thing to be clear about

**"Full HD without watermark" is not available from A-Key's public website.**
Their largest public rendition is 800 px and it is the watermarked one. No
scraper can produce a 1920 px clean image from a site whose biggest file is an
800 px watermarked one.

So there are only three real routes:

1. **An unwatermarked original behind a different path.** Gambio shops often
   keep `/images/product_images/original_images/…` alongside the generated
   renditions, and some installs expose an `original` or `xl` size. `probe.mjs`
   tests for this. It may find nothing — that is a real possible answer.
2. **Ask A-Key for the source images.** You are an authorised dropshipper
   selling their products with their knowledge. Asking a supplier for clean
   product photography is ordinary trade, it is one email, and it gives you
   better images than anything in this directory can. **This is the
   recommended route and the only one that actually yields full HD.**
3. **Accept 320 px clean**, upscale carefully for thumbnails, and photograph
   your own best sellers. Fine as a stopgap for a housing on a listing card;
   not fine for a product page hero.

What this toolchain deliberately does **not** do is erase the watermark from
the 800 px file. Not for legal reasons — you have the relationship — but
because it does not work: the overlay covers roughly 40% of the frame, dead
centre, directly over the product. Inpainting that gives you a damaged 800 px
photo, not a full-HD one. Route 2 costs one email and beats it outright.

## The toolchain

Run in order. Each is resumable and none of them overwrite good data.

```bash
node scripts/akey-images/probe.mjs      # 1. is there a clean large source at all?
node scripts/akey-images/fetch.mjs      # 2. scrape keys + housings
node scripts/akey-images/verify.mjs     # 3. prove every file is clean and big enough
```

### 1. `probe.mjs` — find the best available source

Takes a handful of known product ids and tries every plausible path: the
documented sizes, `xl` / `xxl` / `original`, and the classic Gambio
`product_images/*` directories. For each it reports HTTP status, dimensions and
whether the bytes differ from the known-clean `md`.

It answers one question — **what is the largest clean rendition that exists?** —
and writes `scripts/akey-images/sources.json` with the answer. `fetch.mjs`
refuses to run until that file exists, so the scraper can never silently fall
back to pulling watermarked `lg` files again.

### 2. `fetch.mjs` — the scraper

Scope is the two category trees you asked for, including every
`geeignet für <make>` sub-category:

- `https://a-key-gmbh.com/Autoschluessel-Funkschluessel`
- `https://a-key-gmbh.com/Funkschluessel-Gehaeuse`

It walks the category pages, collects product URLs, reads each product page for
its full gallery, and downloads every image at the best rendition `probe.mjs`
found. Polite by default: one request at a time, a delay between them, a real
user-agent, and it skips anything already on disk so a re-run costs almost
nothing.

Output goes to `public/images/akey/<product-id>/<n>.jpg` — a directory per
product, so a gallery stays together and a re-scrape of one product cannot
scatter files across the tree. A manifest lands at
`scripts/akey-images/manifest.json`.

### 3. `verify.mjs` — the part that makes this trustworthy

A scraper that reports success is worth nothing; this is what proves it.

Four checks, each of which **fails the run** rather than warning:

1. **Watermark, by differential.** For every saved image it also fetches the
   known-clean `md` of the same photo, scales both to a common size and
   compares them. A watermark is a large, centred, systematic difference —
   quite unlike JPEG noise, which is small and spread out. This is the check
   that cannot be fooled by a watermark we have not seen before, because it
   never looks for a *specific* mark; it looks for *any* difference from the
   rendition we know is clean.
2. **Resolution floor.** Anything below `MIN_WIDTH` is a failure, named.
3. **Coverage.** Every product found in the two categories must have at least
   one image. Missing ones are listed by URL, not counted.
4. **Decodability.** Every file is opened and decoded. A truncated download
   that still has a `.jpg` extension is caught here.

It writes `scripts/akey-images/verify-report.json` and a **contact sheet** —
`scripts/akey-images/contact-sheet-*.jpg`, a grid of every image at thumbnail
size. Open it and you can see a watermark across 200 products in one glance.
That is the "check it is working like we want" step, and it is a human one on
purpose: no automated detector should be the last word on how your shop looks.

## Network

These scripts need outbound access to `a-key-gmbh.com`. The cloud environment's
network policy currently denies it — add the host under **Allowed domains** in
the environment settings, or run them on a machine with normal internet.
