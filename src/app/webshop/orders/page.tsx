import { redirect } from 'next/navigation';

export default function OrdersRedirect() {
  // B2B Orders will require authentication. For now, redirect to the login gate.
  redirect('/webshop/account');
}
