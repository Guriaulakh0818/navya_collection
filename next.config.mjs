/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  compiler: {
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      'date-fns',
      'framer-motion',
    ],
  },
  images: {
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
        value: 'same-origin',
      },
      {
        key: 'Content-Security-Policy',
        value:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://*.razorpay.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://www.google-analytics.com https://www.clarity.ms https://api.razorpay.com https://lumberjack.razorpay.com; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
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
        source: '/category/sarees',
        destination: '/category/women-sarees',
        permanent: true,
      },
      {
        source: '/category/banarasi-sarees',
        destination: '/category/women-sarees',
        permanent: true,
      },
      {
        source: '/category/lehengas',
        destination: '/category/women-lehengas',
        permanent: true,
      },
      {
        source: '/category/kurtis',
        destination: '/category/women-kurtas',
        permanent: true,
      },
      {
        source: '/category/kurtis-tunics',
        destination: '/category/women-kurtas',
        permanent: true,
      },
      {
        source: '/category/anarkalis-suits',
        destination: '/category/women-kurta-sets',
        permanent: true,
      },
      {
        source: '/category/salwar-suits',
        destination: '/category/women-kurta-sets',
        permanent: true,
      },
      {
        source: '/category/suits',
        destination: '/category/women-kurta-sets',
        permanent: true,
      },
      {
        source: '/category/dresses',
        destination: '/category/women-dresses',
        permanent: true,
      },
      {
        source: '/category/phulkari-dupattas',
        destination: '/category/dupattas-stoles',
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
