import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site.config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
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
        userAgent: ['AdsBot-Google', 'AdsBot-Google-Mobile'],
        allow: '/',
        disallow: ['/api/', '/blog/'],
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
        disallow: ['/api/'],
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
