import { redirect } from 'next/navigation';

export default function LegacyShippingSettingsPage() {
  redirect('/admin/verzendinstellingen');
}
