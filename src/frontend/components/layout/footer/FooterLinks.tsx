'use client';

import Link from 'next/link';

const footerLinks = {
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/faq', label: 'FAQ & Help' },
    { href: '/become-seller', label: 'Become a Seller' },
    { href: '/contact', label: 'Contact Us' },
  ],
  quickLinks: [
    { href: '/shop', label: 'Shop Catalog' },
    { href: '/wishlist', label: 'Wishlist' },
    { href: '/cart', label: 'Cart' },
    { href: '/account', label: 'My Account' },
  ],
  categories: [
    { href: '/category/spotlight', label: 'In The Spotlight' },
    { href: '/category/women', label: "Women's Collection" },
    { href: '/category/men', label: "Men's Collection" },
    { href: '/category/kids', label: "Kids' Fashion" },
    { href: '/category/best-sellers', label: 'Best Sellers' },
    { href: '/shop', label: 'Boutique Shops' },
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
