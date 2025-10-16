import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Poppins, PT_Sans } from 'next/font/google';

export const metadata: Metadata = {
  title: '143look',
  description: 'Find your fashion from Instagram Reels.',
};

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
});

const fontPtSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={cn(
          'font-sans antialiased h-full bg-background',
          'flex flex-col',
          fontPoppins.variable,
          fontPtSans.variable
        )}
      >
        <div className="relative flex flex-col h-full">
          <Header />
          <main className="flex-grow flex flex-col">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
