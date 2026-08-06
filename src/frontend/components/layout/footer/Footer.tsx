'use client';

import { Mail, MapPin, Phone, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { FooterNewsletter } from './FooterNewsletter';

export function Footer() {
  return (
    <footer className="bg-navy text-white pt-12 sm:pt-16 pb-8 border-t border-navy-500/20 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6">
        {/* Brand Value Props Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-10 sm:pb-12 mb-10 sm:mb-12 border-b border-white/10">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="h-11 w-11 rounded-xl bg-orange/20 flex items-center justify-center text-orange shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-xs sm:text-sm">Pan-India Express Shipping</h4>
              <p className="text-[11px] sm:text-xs text-white/70">
                Free shipping on orders above ₹999
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="h-11 w-11 rounded-xl bg-orange/20 flex items-center justify-center text-orange shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-xs sm:text-sm">100% Guaranteed Quality</h4>
              <p className="text-[11px] sm:text-xs text-white/70">Directly sourced & verified</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/5 border border-white/10 sm:col-span-2 lg:col-span-1">
            <div className="h-11 w-11 rounded-xl bg-orange/20 flex items-center justify-center text-orange shrink-0">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-xs sm:text-sm">7-Day Easy Returns</h4>
              <p className="text-[11px] sm:text-xs text-white/70">Hassle-free exchange & refund</p>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12">
          {/* Brand Info */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group mb-2">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-xs shrink-0 bg-white">
                <Image
                  src="/images/navya-logo.png"
                  alt="Navya Collection Logo"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col leading-none">
                <span className="font-heading text-xl font-bold tracking-wider text-white uppercase">
                  NAVYA
                </span>
                <span className="font-heading text-[10px] font-extrabold tracking-[0.2em] text-orange uppercase mt-0.5">
                  COLLECTION
                </span>
              </div>
            </Link>
            <p className="text-xs text-white/70 leading-relaxed max-w-sm">
              Navya Collection is India’s most trusted online fashion brand for everyday Indian
              families. Delivering modern style, premium quality Gents & Kids garments, and honest
              value.
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
                <span className="truncate">support@navyacollection.store</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="font-heading text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-4">
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

          {/* Policies & Help */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="font-heading text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-4">
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
          <div className="sm:col-span-2 lg:col-span-4">
            <h4 className="font-heading text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-4">
              Join Our VIP Club
            </h4>
            <p className="text-xs text-white/70 mb-3 leading-relaxed">
              Subscribe for exclusive discount codes, early access to new launches & insider sales.
            </p>
            <FooterNewsletter />
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p className="text-center sm:text-left text-[11px] sm:text-xs">
            © {new Date().getFullYear()} Navya Collection. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3">
            <span className="bg-white/10 px-2.5 py-1 rounded text-[10px] font-semibold text-white whitespace-nowrap">
              Razorpay Secured
            </span>
            <span className="bg-white/10 px-2.5 py-1 rounded text-[10px] font-semibold text-white whitespace-nowrap">
              UPI / GPay / PhonePe
            </span>
            <span className="bg-white/10 px-2.5 py-1 rounded text-[10px] font-semibold text-white whitespace-nowrap">
              COD Available
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
