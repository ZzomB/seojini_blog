import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import Providers from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | 서지니 블로그',
    default: '서지니 블로그',
  },
  description: '일상을 기록한 특별한 블로그',
  keywords: ['blog', '일상', '기록', '일기', '서지니', '호야', '경험'],
  authors: [{ name: 'Joo', url: 'https://github.com/ZzomB' }],
  creator: 'Joo',
  publisher: 'Joo',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '서지니 블로그',
    description: '일상을 기록한 특별한 블로그',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`,
    siteName: '서지니 블로그',
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: '서지니 블로그',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '서지니 블로그',
    description: '일상을 기록한 특별한 블로그',
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/opengraph-image`],
  },
  // 네이버 검색엔진 등록을 위한 메타 태그
  other: {
    'naver-site-verification': process.env.NAVER_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            {/* Header 영역 */}
            <Header />

            {/* Main 영역 */}
            <main className="flex-1">{children}</main>

            {/* Footer 영역 */}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
