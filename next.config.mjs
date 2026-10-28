/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  turbopack: {},
  compiler: {
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },
  outputFileTracingExcludes: {
    '*': [
      '@swc/core',
      'esbuild',
      'uglify-js',
      'watchpack',
      '@playwright/test',
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      '@tanstack/react-query',
      'date-fns',
      'framer-motion',
      'zustand',
    ],
  },
  images: {
    contentDispositionType: 'inline',
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin-allow-popups',
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'cross-origin',
      },
      {
        key: 'Content-Security-Policy',
        value:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https: http:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://www.google-analytics.com https://www.clarity.ms https://api.razorpay.com https://lumberjack.razorpay.com; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
      },
    ];

    const routes = [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];

    // Only set immutable asset caching in production
    if (isProd) {
      routes.push({
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      });
      routes.push({
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      });
    }

    return routes;
  },
  async redirects() {
    return [
      {
        source: '/men',
        destination: '/category/men',
        permanent: true,
      },
      {
        source: '/women',
        destination: '/category/women',
        permanent: true,
      },
      {
        source: '/kids',
        destination: '/category/kids',
        permanent: true,
      },
      {
        source: '/shops',
        destination: '/shop',
        permanent: true,
      },
      // Category Aliases (308 Permanent SEO Redirects)
      { source: '/category/sarees', destination: '/category/women-sarees', permanent: true },
      { source: '/category/banarasi-sarees', destination: '/category/women-sarees', permanent: true },
      { source: '/category/kanjeevaram-silk-sarees', destination: '/category/women-sarees', permanent: true },
      { source: '/category/chanderi-sarees', destination: '/category/women-sarees', permanent: true },
      { source: '/category/lehengas', destination: '/category/women-lehengas', permanent: true },
      { source: '/category/bridal-lehengas', destination: '/category/women-lehengas', permanent: true },
      { source: '/category/partywear-lehengas', destination: '/category/women-lehengas', permanent: true },
      { source: '/category/kurtis', destination: '/category/women-kurtas', permanent: true },
      { source: '/category/kurtis-tunics', destination: '/category/women-kurtas', permanent: true },
      { source: '/category/anarkalis-suits', destination: '/category/women-kurta-sets', permanent: true },
      { source: '/category/silk-anarkali-sets', destination: '/category/women-kurta-sets', permanent: true },
      { source: '/category/salwar-suits', destination: '/category/women-kurta-sets', permanent: true },
      { source: '/category/suits', destination: '/category/women-kurta-sets', permanent: true },
      { source: '/category/dresses', destination: '/category/women-dresses', permanent: true },
      { source: '/category/phulkari-dupattas', destination: '/category/women-scarves-stoles', permanent: true },
      { source: '/category/dupattas-stoles', destination: '/category/women-scarves-stoles', permanent: true },
      { source: '/category/gents-mens-couture', destination: '/category/men', permanent: true },
      { source: '/category/designer-kurta-pajamas', destination: '/category/men-kurta-sets', permanent: true },
      { source: '/category/indo-western-fusion', destination: '/category/women-indian-wear', permanent: true },
      { source: '/category/shirts', destination: '/category/men-shirts', permanent: true },
      { source: '/category/t-shirts', destination: '/category/men-t-shirts', permanent: true },
      { source: '/category/jeans', destination: '/category/men-jeans', permanent: true },
      { source: '/category/trousers', destination: '/category/men-trousers', permanent: true },
      { source: '/category/cargos', destination: '/category/men-cargo-pants', permanent: true },
      { source: '/category/cargo-pants', destination: '/category/men-cargo-pants', permanent: true },
      { source: '/category/cargo', destination: '/category/men-cargo-pants', permanent: true },
      { source: '/category/chinos', destination: '/category/men-chinos', permanent: true },
      { source: '/category/track-pants', destination: '/category/men-track-pants', permanent: true },
      { source: '/category/blazers', destination: '/category/men-blazers', permanent: true },
      { source: '/category/watches', destination: '/category/men-watches', permanent: true },
      { source: '/category/boys-clothing', destination: '/category/boys-fashion', permanent: true },
      { source: '/category/girls-clothing', destination: '/category/girls-fashion', permanent: true },
      { source: '/category/teen-trends', destination: '/category/teens-fashion', permanent: true },
      { source: '/category/women-handbags', destination: '/category/women-bags', permanent: true },
      { source: '/category/handbags', destination: '/category/women-bags', permanent: true },
      { source: '/category/clutches', destination: '/category/women-bags', permanent: true },
      { source: '/category/women-winter-outerwear', destination: '/category/women-jackets', permanent: true },
      { source: '/category/gents-wear', destination: '/category/men', permanent: true },
      { source: '/category/women-wear', destination: '/category/women', permanent: true },
      { source: '/category/kids-wear', destination: '/category/kids', permanent: true },
      { source: '/category/gents-tshirts', destination: '/category/men-t-shirts', permanent: true },
      { source: '/category/girls-casuals', destination: '/category/girls-fashion', permanent: true },
      { source: '/category/handbags-clutches', destination: '/category/women-bags', permanent: true },
      { source: '/category/nehru-jackets', destination: '/category/men-nehru-jackets', permanent: true },
      { source: '/category/turbans-stoles', destination: '/category/women-scarves-stoles', permanent: true },
      { source: '/category/women-backpacks', destination: '/category/women-bags', permanent: true },
      { source: '/category/men-bags-backpacks', destination: '/category/men-accessories', permanent: true },
      { source: '/category/boys-party-suits', destination: '/category/boys-ethnic-wear', permanent: true },
      { source: '/category/all-women-clothing', destination: '/category/women', permanent: true },
      { source: '/category/all-men-accessories', destination: '/category/men-accessories', permanent: true },
      { source: '/category/all-women-accessories', destination: '/category/women-accessories', permanent: true },
      { source: '/category/men-outer-jackets', destination: '/category/men-jackets', permanent: true },
      { source: '/category/men-thermal-bottoms', destination: '/category/men-thermals', permanent: true },
      { source: '/category/women-activewear-sets', destination: '/category/women-activewear', permanent: true },
      { source: '/category/women-thermal-tops', destination: '/category/women-thermals', permanent: true },
      { source: '/category/women-shape-camisoles', destination: '/category/women-shapewear', permanent: true },
      { source: '/category/women-slips', destination: '/category/women-innerwear', permanent: true },
      { source: '/category/women-tote-bags', destination: '/category/women-bags', permanent: true },
      { source: '/category/women-shoulder-bags', destination: '/category/women-bags', permanent: true },
      { source: '/category/shops', destination: '/shop', permanent: true },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.jiivaakart.com',
          },
        ],
        destination: 'https://jiivaakart.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.navyacollection.store',
          },
        ],
        destination: 'https://navyacollection.store/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
