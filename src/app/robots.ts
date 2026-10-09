import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site.config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        /*
         * `/winkel/zoeken` is blocked rather than left to its meta noindex.
         *
         * It takes nine filter parameters in any combination, so the number
         * of distinct URLs it can produce is effectively unbounded — and
         * every one of them is the same catalogue sliced differently. A
         * noindex only works after the page has been crawled, so it would
         * spend the crawl budget first and decline to index afterwards. The
         * canonical on those pages already points at /winkel, so nothing is
         * lost by never fetching them.
         *
         * `/winkel/mandje` and `/winkel/bestelling/` are per-visitor and have
         * nothing to index at all.
         *
         * `/winkel` itself and the article pages stay open: those are the
         * pages meant to rank.
         */
        disallow: ['/api/', '/winkel/zoeken', '/winkel/mandje', '/winkel/bestelling/'],
        // NOTE: /_next/ is intentionally NOT blocked — Google needs JS chunks for rendering
      },
      {
        /*
         * Google Ads must not pick blog posts as ad landing pages.
         *
         * Over 20 Aug - 18 Sep, "final URL expansion" spent €86.82 of €274.53
         * (32% of the budget, 54 of 136 clicks) on /blog/ URLs and returned
         * zero conversions. €73.48 of that went to one post,
         * /blog/autosleutel-kwijt-wat-nu-stappenplan. Blog readers are looking
         * for an answer, not for a locksmith to come out today.
         *
         * AdsBot-Google is the crawler that decides which pages an expanded
         * campaign may land on, and blocking it here makes those URLs
         * ineligible.
         *
         * IT MUST BE NAMED EXPLICITLY. AdsBot-Google deliberately ignores
         * `User-agent: *`, so the rule above does not reach it and no generic
         * disallow ever will. That is also why this needs its own block rather
         * than a line added to the first one.
         *
         * This is the durable half of the fix — it survives someone switching
         * URL expansion back on. The immediate half lives in the Google Ads
         * campaign settings.
         */
        /*
         * The two locksmith pages are blocked from AdsBot for a different
         * reason than /blog/, and a harder one.
         *
         * Google prohibits advertising locksmith services in the Netherlands
         * outright -- not advanced verification as in the US and Canada, a
         * blanket ban, shared with Germany, Belgium and Sweden. Our ads run on
         * key-duplication terms, which are allowed; these two pages are about
         * the locksmith trade itself, in the title and throughout.
         *
         * They stay indexed and they earn their place organically: the
         * sleutelmaker/slotenmaker family is 1,299 impressions in Search
         * Console and "sleutelmaker" alone sits at position 10. Organic is in
         * fact the ONLY channel available for those queries, which makes the
         * pages more valuable, not less. What must not happen is an ad landing
         * on one of them -- through final-URL expansion, dynamic search ads or
         * a broad campaign -- and being read as a locksmith advertisement.
         */
        userAgent: ['AdsBot-Google', 'AdsBot-Google-Mobile'],
        allow: '/',
        disallow: ['/api/', '/blog/', '/mobiele-sleutelmaker', '/diensten/auto-slotenmaker'],
      },
      {
        // Allow AI bots to index content for LLM citations & AI search visibility
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-Web',
          'Google-Extended',
          'Applebot-Extended',
          'PerplexityBot',
          'YouBot',
          'Amazonbot',
          'anthropic-ai',
          'Bytespider',
        ],
        allow: '/',
        disallow: ['/api/', '/winkel/zoeken', '/winkel/mandje', '/winkel/bestelling/'],
      },
    ],
    // Sitemaps — main sitemap (which now includes all dynamic images)
    sitemap: [
      `${SITE_CONFIG.domain}/sitemap.xml`,
      // 423 images were being generated at /image-sitemap.xml but never
      // announced here, so Google never discovered any of them.
      `${SITE_CONFIG.domain}/image-sitemap.xml`,
    ],
    // NOTE: 'host' directive is NOT supported by Google — removed
  };
}
