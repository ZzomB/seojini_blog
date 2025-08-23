import type { NextConfig } from 'next';
import createMDX from '@next/mdx';
import rehypeSanitize from 'rehype-sanitize';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: 'picsum.photos',
      },
      {
        hostname: 'images.unsplash.com',
      },
      {
        hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
      },
    ],
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx', 'md'],
};

const withMDX = createMDX({
  //필요한 마크다운 플러그인 추가할수 있음
  options: {
    rehypePlugins: [rehypeSanitize],
  },
});

export default withMDX(nextConfig);
