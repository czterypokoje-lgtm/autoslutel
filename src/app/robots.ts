import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/config/site.config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /webshop is excluded until the catalogue runs on licensed product
        // data and each page has its own canonical (see webshop/layout.tsx).
        disallow: ['/api/', '/webshop'],
        // NOTE: /_next/ is intentionally NOT blocked — Google needs JS chunks for rendering
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
        disallow: ['/api/', '/webshop'],
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
