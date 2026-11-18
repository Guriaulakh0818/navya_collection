import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import middleware from '../../src/middleware';

function makeRequest(url: string, headers: Record<string, string> = {}) {
  const parsed = new URL(url);
  return new NextRequest(url, {
    headers: {
      host: parsed.host,
      'x-forwarded-host': parsed.host,
      'x-forwarded-proto': parsed.protocol.replace(':', ''),
      ...headers,
    },
  });
}

describe('Subdomain Routing Middleware (jiivaakart.com)', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as any).NODE_ENV = originalNodeEnv;
  });

  it('redirects admin.jiivaakart.com/ to /admin/dashboard', async () => {
    const req = makeRequest('https://admin.jiivaakart.com/');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://admin.jiivaakart.com/admin/dashboard');
  });

  it('redirects admin.jiivaakart.com/login to /admin/login', async () => {
    const req = makeRequest('https://admin.jiivaakart.com/login');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://admin.jiivaakart.com/admin/login');
  });

  it('allows unauthenticated access to admin.jiivaakart.com/admin/login without redirect loop', async () => {
    const req = makeRequest('https://admin.jiivaakart.com/admin/login');
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('allows unauthenticated access to admin.jiivaakart.com/admin/set-password', async () => {
    const req = makeRequest('https://admin.jiivaakart.com/admin/set-password');
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects unauthenticated admin.jiivaakart.com/admin/dashboard to /admin/login', async () => {
    const req = makeRequest('https://admin.jiivaakart.com/admin/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://admin.jiivaakart.com/admin/login');
  });

  it('rewrites seller.jiivaakart.com/ to /become-seller (Seller Portal Landing)', async () => {
    const req = makeRequest('https://seller.jiivaakart.com/');
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-rewrite')).toBe(
      'https://seller.jiivaakart.com/become-seller',
    );
  });

  it('redirects seller.jiivaakart.com/home back to https://jiivaakart.com/', async () => {
    const req = makeRequest('https://seller.jiivaakart.com/home');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://jiivaakart.com/');
  });

  it('protects seller.jiivaakart.com/dashboard and redirects unauthenticated user to /login', async () => {
    const req = makeRequest('https://seller.jiivaakart.com/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://seller.jiivaakart.com/login?redirectUrl=%2Fdashboard',
    );
  });

  it('canonicalizes www.jiivaakart.com to https://jiivaakart.com', async () => {
    const req = makeRequest('https://www.jiivaakart.com/shop');
    const res = await middleware(req);
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('https://jiivaakart.com/shop');
  });

  it('redirects jiivaakart.com/admin/dashboard to admin.jiivaakart.com in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    const req = makeRequest('https://jiivaakart.com/admin/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://admin.jiivaakart.com/admin/dashboard');
  });

  it('redirects jiivaakart.com/seller/dashboard to seller.jiivaakart.com in production', async () => {
    (process.env as any).NODE_ENV = 'production';
    const req = makeRequest('https://jiivaakart.com/seller/dashboard');
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://seller.jiivaakart.com/dashboard');
  });

  it('keeps jiivaakart.com/ on main storefront', async () => {
    (process.env as any).NODE_ENV = 'production';
    const req = makeRequest('https://jiivaakart.com/');
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
  });
});
