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
    template: '%s | Joos Blog',
    default: 'Joos Blog',
  },
  description: 'for test real activating notion based blog',
  keywords: ['Next.js', '프론트엔드', '웹개발', '코딩', '프로그래밍', '리액트'],
  authors: [{ name: 'Joo', url: 'https://github.com/ZzomB' }],
  creator: 'Joo',
  publisher: 'Joo',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_SITE_URL}`),
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
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
