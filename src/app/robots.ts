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
    // Sitemaps — main + dedicated image sitemap for Google Image Search
    sitemap: [
      `${SITE_CONFIG.domain}/sitemap.xml`,
      `${SITE_CONFIG.domain}/image-sitemap.xml`,
    ],
    // NOTE: 'host' directive is NOT supported by Google — removed
  };
}
