import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'clsx',
      'tailwind-merge',
      'papaparse',
    ],
  },
};

export default nextConfig;
