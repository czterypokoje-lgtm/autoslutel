import { redirect } from 'next/navigation';

export default async function CategoryRedirect(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  redirect(`/webshop/catalogus?category=${params.slug}`);
}
