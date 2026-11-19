import { getBaseLocalBusinessSchema, serviceRegionNodes } from '@/utils/schema';

interface ServiceSchemaProps {
  name: string;
  description: string;
  url: string;
  image?: string;
}

export default function ServiceSchema({ name, description, url, image }: ServiceSchemaProps) {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: getBaseLocalBusinessSchema(),
    url,
    ...(image && { image }),
    areaServed: serviceRegionNodes(),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
    />
  );
}
