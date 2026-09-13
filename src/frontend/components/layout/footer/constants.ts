import Link from 'next/link';

export const footerLinks = {
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/become-seller', label: 'Sell on Navya' },
    { href: '/seller-agreement', label: 'Seller Agreement' },
  ],
  quickLinks: [
    { href: '/shop', label: 'Shop' },
    { href: '/become-seller', label: 'Become a Seller' },
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
    { href: '/shops', label: 'Boutique Shops' },
  ],
  policies: [
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms-and-conditions', label: 'Terms & Conditions' },
    { href: '/shipping-policy', label: 'Shipping Policy' },
    { href: '/return-policy', label: 'Return Policy' },
    { href: '/cancellation-policy', label: 'Cancellation Policy' },
  ],
};
