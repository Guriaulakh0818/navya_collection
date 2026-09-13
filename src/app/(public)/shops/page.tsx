import { redirect } from 'next/navigation';

export default function ShopsRedirectPage() {
  redirect('/shop?view=shops');
}
