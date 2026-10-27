import { permanentRedirect } from 'next/navigation';

export const metadata = {
  alternates: {
    canonical: 'https://jiivaakart.com/category/kids',
  },
};

export default function KidsRedirectPage() {
  permanentRedirect('/category/kids');
}
