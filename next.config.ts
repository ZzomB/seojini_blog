import type { NextConfig } from 'next';
import createMDX from '@next/mdx';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Schema } from 'hast-util-sanitize';

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
    rehypePlugins: [
      // 보안: rehype-sanitize를 사용하여 XSS 공격 방지
      // u 태그를 허용하도록 스키마 확장
      [
        rehypeSanitize,
        {
          ...defaultSchema,
          tagNames: [...(Array.isArray(defaultSchema.tagNames) ? defaultSchema.tagNames : []), 'u'],
          attributes: {
            ...(defaultSchema.attributes || {}),
            u: [],
            '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'style'],
          },
        } as Schema,
      ],
    ],
  },
});

export default withMDX(nextConfig);
