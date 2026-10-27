import { permanentRedirect } from 'next/navigation';

export const metadata = {
  alternates: {
    canonical: 'https://jiivaakart.com/category/men',
  },
};

export default function MenRedirectPage() {
  permanentRedirect('/category/men');
}
