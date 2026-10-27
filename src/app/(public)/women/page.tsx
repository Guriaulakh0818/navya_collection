import { permanentRedirect } from 'next/navigation';

export const metadata = {
  alternates: {
    canonical: 'https://jiivaakart.com/category/women',
  },
};

export default function WomenRedirectPage() {
  permanentRedirect('/category/women');
}
