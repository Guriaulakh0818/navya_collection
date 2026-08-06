'use client';

import Link from 'next/link';

const footerLinks = {
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/shipping-policy', label: 'Shipping Policy' },
    { href: '/return-policy', label: 'Return Policy' },
  ],
  quickLinks: [
    { href: '/shop', label: 'Shop' },
    { href: '/wishlist', label: 'Wishlist' },
    { href: '/cart', label: 'Cart' },
    { href: '/account', label: 'My Account' },
  ],
  categories: [
    { href: '/shop?category=gents', label: 'Gents' },
    { href: '/shop?category=kids', label: 'Kids' },
    { href: '/shop?category=new', label: 'New Arrivals' },
    { href: '/shop?category=offers', label: 'Offers' },
  ],
  policies: [
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms-and-conditions', label: 'Terms & Conditions' },
    { href: '/shipping-policy', label: 'Shipping Policy' },
    { href: '/return-policy', label: 'Return Policy' },
  ],
};

type FooterLinksProps = {
  title: string;
  links: { href: string; label: string }[];
};

export function FooterLinks({ title, links }: FooterLinksProps) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-navy">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-slate-600 hover:text-navy">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
