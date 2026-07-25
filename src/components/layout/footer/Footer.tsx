'use client';

import { Mail, MapPin, Phone, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';

import { FooterNewsletter } from './FooterNewsletter';

export function Footer() {
  return (
    <footer className="bg-navy text-white pt-16 pb-8 border-t border-navy-500/20">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6">
        {/* Brand Value Props Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 mb-12 border-b border-white/10">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="h-12 w-12 rounded-xl bg-orange/20 flex items-center justify-center text-orange shrink-0">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Pan-India Express Shipping</h4>
              <p className="text-xs text-white/70">Free shipping on orders above ₹999</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="h-12 w-12 rounded-xl bg-orange/20 flex items-center justify-center text-orange shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">100% Premium Quality Guarantee</h4>
              <p className="text-xs text-white/70">Curated fabrics & precision tailoring</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="h-12 w-12 rounded-xl bg-orange/20 flex items-center justify-center text-orange shrink-0">
              <RefreshCw className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">7-Day Easy Returns</h4>
              <p className="text-xs text-white/70">Hassle-free exchange & refund</p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-heading text-2xl font-bold tracking-tight">NAVYA</span>
              <span className="block text-[11px] font-bold tracking-[0.25em] text-orange uppercase">
                Collection
              </span>
            </Link>
            <p className="text-xs text-white/70 leading-relaxed max-w-sm">
              Navya Collection is India’s most trusted brand for affordable premium fashion.
              Crafting elegant Gents & Kids garments with luxury-grade quality and unmatched
              affordability.
            </p>
            <div className="pt-2 space-y-2 text-xs text-white/80">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange shrink-0" />
                <span>India | navyacollection.store</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange shrink-0" />
                <span>Customer Care: +91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange shrink-0" />
                <span>support@navyacollection.store</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <Link href="/shop?category=gents" className="hover:text-orange transition-colors">
                  Gents Shirts & Kurtas
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=gents&sub=Trousers"
                  className="hover:text-orange transition-colors"
                >
                  Chinos & Trousers
                </Link>
              </li>
              <li>
                <Link href="/shop?category=kids" className="hover:text-orange transition-colors">
                  Boys Wear & T-Shirts
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=kids&sub=Girls"
                  className="hover:text-orange transition-colors"
                >
                  Girls Dresses & Frocks
                </Link>
              </li>
              <li>
                <Link href="/shop?filter=new" className="hover:text-orange transition-colors">
                  New Season 2026
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4">
              Policies & Help
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              <li>
                <Link href="/account/orders" className="hover:text-orange transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-orange transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-orange transition-colors">
                  Return & Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-orange transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-orange transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider mb-4">
              Join Our VIP Club
            </h4>
            <p className="text-xs text-white/70 mb-3">
              Subscribe for exclusive discount codes, early access to new launches & insider sales.
            </p>
            <FooterNewsletter />
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© {new Date().getFullYear()} Navya Collection. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="bg-white/10 px-2.5 py-1 rounded text-[10px] font-semibold text-white">
              Razorpay Secured
            </span>
            <span className="bg-white/10 px-2.5 py-1 rounded text-[10px] font-semibold text-white">
              UPI / GPay / PhonePe
            </span>
            <span className="bg-white/10 px-2.5 py-1 rounded text-[10px] font-semibold text-white">
              COD Available
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
