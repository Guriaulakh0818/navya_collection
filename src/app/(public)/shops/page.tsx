import { permanentRedirect } from 'next/navigation';

export const metadata = {
  alternates: {
    canonical: 'https://jiivaakart.com/shop',
  },
};

export default function ShopsRedirectPage() {
  permanentRedirect('/shop');
}
