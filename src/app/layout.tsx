import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Stellar Links',
  description: 'Navigate your digital universe with Stellar Links.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'font-sans antialiased h-full bg-background',
          'flex flex-col'
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
