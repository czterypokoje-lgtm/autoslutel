import { getCrmUser } from '@/lib/crmSession';
import { IS_KEYFORCARS } from '@/config/install';
import { productNamesInEnglish } from '@/lib/productProfiles';

/*
 * English product names for the KeyForCars panel in English. Loaded once per
 * session by PreviewLanguage instead of riding along in every page payload.
 * The names come from the bundled product profiles and only change on deploy.
 */
export async function GET() {
  if (!IS_KEYFORCARS) return new Response(null, { status: 404 });
  const user = await getCrmUser();
  if (!user?.role) return new Response(null, { status: user ? 403 : 401 });
  return Response.json(productNamesInEnglish(), { headers: { 'Cache-Control': 'private, max-age=3600' } });
}
