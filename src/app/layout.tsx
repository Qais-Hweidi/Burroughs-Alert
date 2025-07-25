import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppInitializer from '@/components/app-initializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BurroughsAlert - Never Miss Your Perfect NYC Apartment',
  description:
    'Get instant notifications for NYC apartments that match your criteria. Smart filtering, scam detection, and real-time alerts across all 5 boroughs.',
  icons: {
    icon: '/bell.png',
    shortcut: '/bell.png',
    apple: '/bell.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <AppInitializer />
        {children}
      </body>
    </html>
  );
}
