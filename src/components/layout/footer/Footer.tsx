'use client';

import Link from 'next/link';

import { Container } from '../container/Container';
import { footerLinks as defaultLinks } from './constants';
import { FooterBottom } from './FooterBottom';
import { FooterLinks } from './FooterLinks';
import { FooterNewsletter } from './FooterNewsletter';
import { FooterSocial } from './FooterSocial';

const footerSections = [
  { key: 'company', title: 'Company', links: defaultLinks.company },
  { key: 'quickLinks', title: 'Quick Links', links: defaultLinks.quickLinks },
  { key: 'categories', title: 'Categories', links: defaultLinks.categories },
  { key: 'policies', title: 'Policies', links: defaultLinks.policies },
];

export function Footer() {
  return (
    <footer className="bg-white">
      <Container className="py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <FooterNewsletter />
          </div>
          {footerSections.map((section) => (
            <FooterLinks key={section.key} title={section.title} links={section.links} />
          ))}
        </div>

        <FooterBottom
          social={<FooterSocial />}
          legal={
            <div className="flex gap-4 text-xs text-slate-500">
              <Link href="/privacy-policy" className="hover:text-navy">
                Privacy
              </Link>
              <Link href="/terms-and-conditions" className="hover:text-navy">
                Terms
              </Link>
            </div>
          }
        />
      </Container>
    </footer>
  );
}
