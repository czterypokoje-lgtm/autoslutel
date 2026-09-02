import { redirect } from 'next/navigation';

export default async function BrandRedirect(props: { params: Promise<{ merk: string }> }) {
  const params = await props.params;
  redirect(`/webshop/catalogus?make=${params.merk}`);
}
