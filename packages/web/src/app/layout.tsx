import type { Metadata } from 'next';
import Provider from '@/components/Provider';
import { Inter } from 'next/font/google';
import './globals.css';
import MenuBar from '@/components/MenuBar/MenuBar';
import MobileFooter from '@/components/MobileFooter/MobileFooter';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Raylac',
  description: 'Raylac | Ethereum staking made simple',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <Provider>{children}</Provider>
        <MenuBar />
        <MobileFooter />
      </body>
    </html>
  );
}
