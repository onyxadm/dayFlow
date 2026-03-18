import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  basePath: process.env.BASE_PATH || '',
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    '@dayflow/core',
    '@dayflow/react',
    '@dayflow/plugin-drag',
    '@dayflow/plugin-keyboard-shortcuts',
    '@dayflow/plugin-localization',
    '@dayflow/plugin-sidebar',
  ],
};

export default withMDX(config);
