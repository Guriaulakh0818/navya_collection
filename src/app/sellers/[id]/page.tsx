import { redirect } from 'next/navigation';

interface SellersIdRedirectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SellersIdRedirectPage({ params }: SellersIdRedirectPageProps) {
  const { id } = await params;
  redirect(`/admin/sellers/${id}`);
}
