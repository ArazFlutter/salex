import type {NextConfig} from 'next';

/** Base URL of the Express API (no path suffix). Avoids double `/api` in rewrites. */
function normalizeBackendBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '');
  if (url.endsWith('/api')) {
    url = url.slice(0, -4).replace(/\/+$/, '');
  }
  return url;
}

const BACKEND_URL = normalizeBackendBaseUrl(
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000',
);

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  outputFileTracingRoot: process.cwd(),
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: ['example.com', 'picsum.photos'],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${BACKEND_URL}/api/:path*`,
        },
        {
          source: '/uploads/:path*',
          destination: `${BACKEND_URL}/uploads/:path*`,
        },
      ],
    };
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
