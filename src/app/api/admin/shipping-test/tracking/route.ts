import { requireWarehouseUserApi } from '@/lib/crmSession';
import { getTestParcel, shippingTestEnabled } from '@/lib/kfcShippingTest';
import { testScenarios, testTracking, type TestScenario } from '@/lib/kfcShippingTestModel';

export async function GET(request: Request) {
  if (!shippingTestEnabled) return new Response(null, { status: 404 });
  const { response } = await requireWarehouseUserApi();
  if (response) return response;
  const params = new URL(request.url).searchParams;
  const scenario = (params.get('scenario') ?? 'label') as TestScenario;
  if (!testScenarios.includes(scenario)) return new Response(null, { status: 400 });
  const parcel = await getTestParcel(params.get('id') ?? '');
  if (!parcel) return new Response(null, { status: 404 });
  return Response.json({ ...testTracking(parcel, scenario), checkedAt: new Date().toISOString(), source: 'simulation' }, {
    headers: { 'cache-control': 'private, no-store' },
  });
}
