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
    { href: '/cancellation-policy', label: 'Cancellation Policy' },
  ],
};
