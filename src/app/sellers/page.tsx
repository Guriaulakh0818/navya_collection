import { redirect } from 'next/navigation';

export default function SellersRedirectPage() {
  redirect('/admin/sellers');
}
